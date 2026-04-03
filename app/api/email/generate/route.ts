import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createAuditEvent } from "@/lib/audit";
import { getCurrentUserForApi } from "@/lib/auth";
import {
  composeRequestSchema,
  generateEmailDraft,
  inferRecipientEmail
} from "@/lib/email-generation";
import { getCurrentUserProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { enforceUserRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserForApi();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    await enforceUserRateLimit({
      userId: user.id,
      eventType: "email.generate",
      limit: 10,
      windowMs: 1000 * 60 * 60,
      message: "Generation limit reached. Please wait before creating more drafts."
    });

    const body = await request.json();
    const input = composeRequestSchema.parse(body);
    let inferredRecipient: Awaited<ReturnType<typeof inferRecipientEmail>> | null = null;
    let effectiveInput = input;

    if (!input.recipientEmail) {
      try {
        inferredRecipient = await inferRecipientEmail(input);
        if (inferredRecipient.inferredEmail) {
          effectiveInput = {
            ...input,
            recipientEmail: inferredRecipient.inferredEmail,
            recipientCompany:
              input.recipientCompany || inferredRecipient.resolvedCompany || "",
            recipientRole: input.recipientRole
          };
        }
      } catch {
        inferredRecipient = null;
      }
    }

    const { values: profile } = await getCurrentUserProfile();
    const { draft, model } = await generateEmailDraft(profile, effectiveInput);

    const record = await prisma.emailDraft.create({
      data: {
        userId: user.id,
        recipientName: effectiveInput.recipientName,
        recipientEmail: effectiveInput.recipientEmail || null,
        recipientCompany: effectiveInput.recipientCompany || null,
        recipientRole: effectiveInput.recipientRole || null,
        objective: effectiveInput.connectionGoal,
        contextJson: JSON.stringify({
          profile,
          generationInput: effectiveInput,
          variantShort: draft.variantShort,
          inferredRecipient
        }),
        subject: draft.subject,
        body: draft.body,
        model,
        promptVersion: "phase3-v1"
      }
    });

    await createAuditEvent({
      userId: user.id,
      eventType: "email.generate",
      metadata: {
        draftId: record.id
      }
    });

    return NextResponse.json({
      ok: true,
      draft,
      record: {
        id: record.id,
        subject: record.subject,
        body: record.body,
        createdAt: record.createdAt.toISOString(),
        recipientName: record.recipientName,
        recipientEmail: record.recipientEmail,
        recipientCompany: record.recipientCompany,
        recipientRole: record.recipientRole,
        objective: record.objective,
        composeInput: effectiveInput,
        variantShort: draft.variantShort,
        inferredRecipient
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Invalid generation input."
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Draft generation failed.";
    const status = /limit reached/i.test(message) ? 429 : 500;

    return NextResponse.json(
      {
        error: message
      },
      { status }
    );
  }
}
