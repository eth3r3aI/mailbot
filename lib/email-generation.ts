import { z } from "zod";
import { env } from "@/lib/env";
import type { ProfileInput } from "@/lib/profile";

export const composeRequestSchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required."),
  recipientEmail: z.string().email("Recipient email must be valid.").optional().or(z.literal("")),
  recipientCompany: z.string().optional().or(z.literal("")),
  recipientRole: z.string().optional().or(z.literal("")),
  targetProfileText: z.string().min(1, "Copied profile text is required."),
  connectionGoal: z.string().min(1, "Connection goal is required."),
  sharedContext: z.string().optional().or(z.literal("")),
  whyThem: z.string().optional().or(z.literal("")),
  credibility: z.string().optional().or(z.literal("")),
  ask: z.string().min(1, "A networking ask is required."),
  desiredTone: z.string().min(1, "Desired tone is required.")
});

export const generatedEmailSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  variantShort: z.string().min(1)
});

export type ComposeRequest = z.infer<typeof composeRequestSchema>;
export type GeneratedEmail = z.infer<typeof generatedEmailSchema>;

const inferredRecipientSchema = z.object({
  inferredEmail: z.string().email().nullable(),
  resolvedCompany: z.string().nullable(),
  resolvedDomain: z.string().nullable(),
  confidence: z.enum(["low", "medium", "high"]).nullable(),
  rationale: z.string().min(1),
  sourceUrls: z.array(z.string().url()).default([])
});

export type InferredRecipient = z.infer<typeof inferredRecipientSchema>;

export function buildGenerationPrompt(profile: ProfileInput, input: ComposeRequest) {
  const system = [
    "You write concise, thoughtful networking emails.",
    "Optimize for relationship-building, curiosity, relevance, and a low-pressure tone.",
    "Do not write like a sales pitch unless the provided context clearly supports that style.",
    "Do not invent facts, relationships, shared history, results, or LinkedIn details that were not provided.",
    "Use only the sender profile and networking context supplied.",
    "Treat copied target profile text as user-provided notes, not verified truth.",
    "If target company, role, or background details are missing, avoid guessing them.",
    "If there is credible alumni overlap between the sender education summary and the copied target profile text, prefer that as the strongest common ground.",
    "Never claim an alumni connection unless the overlap is actually supported by the provided context.",
    "Return only valid JSON with keys subject, body, and variantShort.",
    "Keep the tone warm, credible, specific, and easy to reply to.",
    "The body should feel like a real networking note from one professional to another."
  ].join(" ");

  const user = `
Sender profile:
- Full name: ${profile.fullName}
- Title: ${profile.currentTitle}
- Company: ${profile.company}
- Short bio: ${profile.shortBio}
- Education summary: ${profile.educationSummary}
- Background summary: ${profile.backgroundSummary}
- Experience highlights: ${profile.experienceHighlights}
- Expertise areas: ${profile.expertiseAreas}
- Target audience: ${profile.targetAudience}
- Tone preference: ${profile.tonePreference}
- CTA preference: ${profile.ctaPreference}
- Additional context: ${profile.aboutText}

Recipient and campaign context:
- Recipient name: ${input.recipientName}
- Recipient email: ${input.recipientEmail || "Not provided"}
- Recipient company: ${input.recipientCompany || "Not provided"}
- Recipient role: ${input.recipientRole || "Not provided"}
- Copied target profile text: ${input.targetProfileText}
- Connection goal: ${input.connectionGoal}
- Shared context or reason this message makes sense: ${input.sharedContext || "Not provided"}
- Why this person specifically: ${input.whyThem || "Not provided"}
- Credibility note about the sender: ${input.credibility || "Derive the most relevant credibility framing from the sender profile."}
- Networking ask: ${input.ask}
- Desired tone: ${input.desiredTone}

Generate:
1. A subject line.
2. A complete email body.
3. A shorter alternative version.

Writing guidance:
- Prioritize authentic connection over pitching.
- Keep the note concise and respectful of the recipient's time.
- Make the ask easy to decline or accept.
- Avoid hype, aggressive sales language, or manufactured familiarity.
- Use the copied profile text to ground relevance, but do not repeat long resume-like details back verbatim.
- If an alumni link is supported by the context, prefer using that as the opening bridge naturally and briefly.

Return JSON only in this exact shape:
{
  "subject": "string",
  "body": "string",
  "variantShort": "string"
}
`.trim();

  return { system, user };
}

export function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response did not include a JSON object.");
  }

  return text.slice(start, end + 1);
}

export function parseGeneratedEmail(text: string) {
  const json = extractJsonObject(text);
  return generatedEmailSchema.parse(JSON.parse(json));
}

export function parseInferredRecipient(text: string) {
  const json = extractJsonObject(text);
  return inferredRecipientSchema.parse(JSON.parse(json));
}

export function extractResponseText(payload: unknown) {
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

export async function generateEmailDraft(profile: ProfileInput, input: ComposeRequest) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const prompt = buildGenerationPrompt(profile, input);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
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
            type?: string;
            code?: string;
          };
        }
      | null;

    if (response.status === 429) {
      const providerMessage =
        errorPayload?.error?.message ??
        "OpenAI rejected the request because of rate limits or account quota.";

      throw new Error(
        `OpenAI rate limit or quota issue: ${providerMessage}`
      );
    }

    throw new Error(
      errorPayload?.error?.message ??
        `OpenAI generation failed with ${response.status}.`
    );
  }

  const payload = await response.json();
  const text = extractResponseText(payload);
  const draft = parseGeneratedEmail(text);

  return {
    draft,
    model: env.OPENAI_MODEL
  };
}

export async function inferRecipientEmail(input: ComposeRequest) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      tools: [
        {
          type: "web_search"
        }
      ],
      input: [
        {
          role: "system",
          content:
            "You help infer likely work email addresses for outreach drafts. Use web search to resolve the recipient's current company and company domain from public sources. Return only valid JSON. Never invent certainty. If evidence is weak, return inferredEmail as null."
        },
        {
          role: "user",
          content: `
Infer a likely work email for this recipient using current public web information.

Recipient:
- Name: ${input.recipientName}
- Company hint: ${input.recipientCompany || "Not provided"}
- Role hint: ${input.recipientRole || "Not provided"}
- Copied target profile text: ${input.targetProfileText}

Instructions:
- Use web search to identify the most likely current employer and primary company domain.
- Infer the most likely work email pattern only if the evidence is reasonably strong.
- Prefer exact public evidence over guessing.
- If you cannot make a reasonable inference, return inferredEmail as null.
- Include up to 5 supporting source URLs.

Return JSON only in this exact shape:
{
  "inferredEmail": "string | null",
  "resolvedCompany": "string | null",
  "resolvedDomain": "string | null",
  "confidence": "low | medium | high | null",
  "rationale": "string",
  "sourceUrls": ["https://example.com"]
}
`.trim()
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
        `Recipient email inference failed with ${response.status}.`
    );
  }

  const payload = await response.json();
  const text = extractResponseText(payload);
  return parseInferredRecipient(text);
}
