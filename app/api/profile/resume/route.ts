import { NextResponse } from "next/server";
import { createAuditEvent } from "@/lib/audit";
import { getCurrentUserForApi } from "@/lib/auth";
import { saveResumeForUser } from "@/lib/profile";

export const runtime = "nodejs";

function isPdfResume(file: File) {
  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith(".pdf") || file.type === "application/pdf";
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserForApi();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || !isPdfResume(file)) {
      return NextResponse.json(
        { error: "Please upload a PDF resume." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Resume is too large. Please upload a file under 10 MB." },
        { status: 400 }
      );
    }

    await saveResumeForUser({
      userId: user.id,
      fileName: file.name,
      mimeType: "application/pdf",
      dataBase64: Buffer.from(await file.arrayBuffer()).toString("base64")
    });

    await createAuditEvent({
      userId: user.id,
      eventType: "profile.resume_saved",
      metadata: {
        fileName: file.name
      }
    });

    return NextResponse.json({
      ok: true,
      resume: {
        fileName: file.name,
        mimeType: "application/pdf"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Resume upload failed."
      },
      { status: 500 }
    );
  }
}
