import { NextResponse } from "next/server";
import { createAuditEvent } from "@/lib/audit";
import { getCurrentUserForApi } from "@/lib/auth";
import {
  autofillProfileFromDocumentText,
  extractTextFromUploadedDocument
} from "@/lib/profile-autofill";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserForApi();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Please upload a PDF or Word document."
        },
        { status: 400 }
      );
    }

    const documentText = await extractTextFromUploadedDocument(file);
    const profile = await autofillProfileFromDocumentText(documentText);
    await createAuditEvent({
      userId: user.id,
      eventType: "profile.autofill"
    });

    return NextResponse.json({
      ok: true,
      profile
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Profile autofill failed.";

    return NextResponse.json(
      {
        error: message
      },
      { status: 500 }
    );
  }
}
