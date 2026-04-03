import { DraftStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { createAuditEvent } from "@/lib/audit";
import { getCurrentUserForApi } from "@/lib/auth";
import { sendDraftViaGmail } from "@/lib/gmail-send";
import { prisma } from "@/lib/prisma";
import { enforceUserRateLimit } from "@/lib/rate-limit";

const sendDraftSchema = z.object({
  draftId: z.string().min(1, "Draft ID is required."),
  subject: z.string().min(1, "Subject is required."),
  body: z.string().min(1, "Body is required."),
  recipientEmail: z.string().email("Recipient email must be valid."),
  attachResume: z.boolean().optional().default(false)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = sendDraftSchema.parse(body);
    const user = await getCurrentUserForApi();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    await enforceUserRateLimit({
      userId: user.id,
      eventType: "email.send",
      limit: 20,
      windowMs: 1000 * 60 * 60 * 24,
      message: "Send limit reached for today. Please try again tomorrow."
    });

    const existingDraft = await prisma.emailDraft.findFirst({
      where: {
        id: input.draftId,
        userId: user.id
      }
    });

    if (!existingDraft) {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }

    if (existingDraft.status === DraftStatus.SENT) {
      return NextResponse.json(
        { error: "This draft has already been sent. Duplicate sends are blocked." },
        { status: 409 }
      );
    }

    let attachment:
      | {
          fileName: string;
          mimeType: string;
          dataBase64: string;
        }
      | null = null;

    if (input.attachResume) {
      const profile = await prisma.userProfile.findUnique({
        where: {
          userId: user.id
        },
        select: {
          resumeFileName: true,
          resumeMimeType: true,
          resumeDataBase64: true
        }
      });

      if (
        !profile?.resumeFileName ||
        !profile.resumeMimeType ||
        !profile.resumeDataBase64
      ) {
        return NextResponse.json(
          { error: "No stored resume is available. Upload one on the profile page first." },
          { status: 400 }
        );
      }

      attachment = {
        fileName: profile.resumeFileName,
        mimeType: profile.resumeMimeType,
        dataBase64: profile.resumeDataBase64
      };
    }

    const result = await sendDraftViaGmail({
      userId: user.id,
      to: input.recipientEmail,
      subject: input.subject,
      body: input.body,
      attachment
    });

    await prisma.emailDraft.update({
      where: {
        id: existingDraft.id
      },
      data: {
        subject: input.subject,
        body: input.body,
        recipientEmail: input.recipientEmail,
        status: DraftStatus.SENT
      }
    });

    const sent = await prisma.sentEmail.create({
      data: {
        userId: user.id,
        draftId: existingDraft.id,
        gmailMessageId: result.gmailMessageId,
        recipientEmail: input.recipientEmail,
        subject: input.subject,
        body: input.body,
        status: DraftStatus.SENT,
        sentAt: new Date()
      }
    });

    await createAuditEvent({
      userId: user.id,
      eventType: "email.send",
      metadata: {
        draftId: existingDraft.id,
        sentEmailId: sent.id
      }
    });

    return NextResponse.json({
      ok: true,
      sent: {
        id: sent.id,
        gmailMessageId: sent.gmailMessageId,
        recipientEmail: sent.recipientEmail,
        subject: sent.subject,
        sentAt: sent.sentAt?.toISOString() ?? null
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Invalid send request."
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Draft send failed.";
    const status = /limit reached/i.test(message) ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
