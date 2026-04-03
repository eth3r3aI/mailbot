import { z } from "zod";
import { env } from "@/lib/env";
import { type ProfileInput, profileSchema } from "@/lib/profile";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const autofillResponseSchema = profileSchema;

async function extractTextFromPdfBuffer(buffer: Buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer)
  });
  const document = await loadingTask.promise;

  try {
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");

      pages.push(pageText);
    }

    return normalizeExtractedText(pages.join("\n\n"));
  } finally {
    await document.destroy();
  }
}

export async function extractTextFromUploadedDocument(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Document is too large. Please upload a file under 10 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (extension === "pdf") {
    try {
      return await extractTextFromPdfBuffer(buffer);
    } catch {
      throw new Error(
        "PDF parsing failed for this file. Please try a text-based PDF or upload a .docx version instead."
      );
    }
  }

  if (extension === "docx" || extension === "doc") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return normalizeExtractedText(result.value);
  }

  throw new Error("Unsupported file type. Please upload a PDF or Word document.");
}

export async function serializeUploadedDocument(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Document is too large. Please upload a file under 10 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !["pdf", "doc", "docx"].includes(extension)) {
    throw new Error("Unsupported file type. Please upload a PDF or Word document.");
  }

  const mimeType =
    file.type ||
    (extension === "pdf"
      ? "application/pdf"
      : extension === "doc"
        ? "application/msword"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

  return {
    fileName: file.name,
    mimeType,
    dataBase64: Buffer.from(await file.arrayBuffer()).toString("base64")
  };
}

export function normalizeExtractedText(text: string) {
  return text.replace(/\u0000/g, "").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Profile autofill response did not include a JSON object.");
  }

  return text.slice(start, end + 1);
}

export function parseAutofillProfile(text: string): ProfileInput {
  const json = extractJsonObject(text);
  return autofillResponseSchema.parse(JSON.parse(json));
}

export function buildProfileAutofillPrompt(documentText: string) {
  const system = [
    "You extract professional profile information from resumes, bios, CVs, and background documents.",
    "Return only valid JSON that matches the requested profile fields.",
    "If a field is not clearly present, infer conservatively from the document.",
    "Never invent hard facts like employers, achievements, or credentials that are not supported by the document.",
    "Write clean, concise profile field values appropriate for a networking email tool.",
    "Keep educationSummary and backgroundSummary meaningfully distinct.",
    "educationSummary should focus on school, degree, concentration, academic programs, clubs, honors, and graduation timing.",
    "backgroundSummary should focus on internships, projects, work experience, career direction, and professional strengths.",
    "Do not repeat the same summary in both fields."
  ].join(" ");

  const user = `
Extract and structure the following document into this exact JSON shape:
{
  "fullName": "string",
  "currentTitle": "string",
  "company": "string",
  "shortBio": "string",
  "educationSummary": "string",
  "backgroundSummary": "string",
  "experienceHighlights": "string",
  "expertiseAreas": "string",
  "targetAudience": "string",
  "tonePreference": "string",
  "ctaPreference": "string",
  "aboutText": "string"
}

Field guidance:
- fullName: the person's likely full name
- currentTitle: their current role or best-fit professional title
- company: current company if clear, otherwise best-fit organization or "Independent"
- shortBio: a 1-2 sentence professional summary
- educationSummary: school-only summary if present, including degree, major, academic programs, student organizations, honors, or graduation context
- backgroundSummary: a concise overview of professional background, internships, projects, and career direction
- experienceHighlights: a concise summary of notable experience
- expertiseAreas: comma-separated areas of expertise
- targetAudience: who they would most likely network with or reach out to
- tonePreference: default to "Warm, thoughtful, and professional" unless the document strongly suggests another tone
- ctaPreference: default to "A short conversation to learn from each other"
- aboutText: a slightly richer background summary grounded in the document

Important distinctions:
- Do not copy backgroundSummary into educationSummary.
- Do not describe employers or work history inside educationSummary unless the document only contains blended school/work context and cannot be separated cleanly.
- Prefer leaving educationSummary concise rather than stuffing in unrelated professional details.

Document:
${documentText}
`.trim();

  return { system, user };
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("OpenAI response payload was empty.");
  }

  const response = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (response.output_text && response.output_text.trim()) {
    return response.output_text;
  }

  const nestedText = response.output
    ?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n")
    .trim();

  if (!nestedText) {
    throw new Error("OpenAI response did not include assistant text.");
  }

  return nestedText;
}

export async function autofillProfileFromDocumentText(documentText: string) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!documentText.trim()) {
    throw new Error("The uploaded document did not contain readable text.");
  }

  const prompt = buildProfileAutofillPrompt(documentText.slice(0, 18000));
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_PROFILE_MODEL,
      input: [
        {
          role: "system",
          content: prompt.system
        },
        {
          role: "user",
          content: prompt.user
        }
      ]
    })
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | {
          error?: {
            message?: string;
          };
        }
      | null;

    throw new Error(
      errorPayload?.error?.message ??
        `OpenAI profile autofill failed with ${response.status}.`
    );
  }

  const payload = await response.json();
  const text = extractResponseText(payload);
  return parseAutofillProfile(text);
}
