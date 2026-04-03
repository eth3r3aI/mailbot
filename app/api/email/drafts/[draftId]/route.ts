import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { createAuditEvent } from "@/lib/audit";
import { getCurrentUserForApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateDraftSchema = z.object({
  subject: z.string().min(1, "Subject is required."),
  body: z.string().min(1, "Body is required."),
  variantShort: z.string().min(1, "Short variant is required.").optional()
});

function updateContextVariant(contextJson: string | null, variantShort?: string) {
  if (!contextJson) {
    return contextJson;
  }

  try {
    const parsed = JSON.parse(contextJson) as Record<string, unknown>;
    if (variantShort) {
      parsed.variantShort = variantShort;
    }
    return JSON.stringify(parsed);
  } catch {
    return contextJson;
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ draftId: string }> }
) {
  try {
    const user = await getCurrentUserForApi();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { draftId } = await context.params;
    const body = await request.json();
    const input = updateDraftSchema.parse(body);

    const existing = await prisma.emailDraft.findFirst({
      where: {
        id: draftId,
        userId: user.id
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }

    const draft = await prisma.emailDraft.update({
      where: {
        id: draftId
      },
      data: {
        subject: input.subject,
        body: input.body,
        contextJson: updateContextVariant(existing.contextJson, input.variantShort)
      }
    });

    await createAuditEvent({
      userId: user.id,
      eventType: "draft.updated",
      metadata: {
        draftId
      }
    });

    return NextResponse.json({
      ok: true,
      draft: {
        id: draft.id,
        subject: draft.subject,
        body: draft.body,
        createdAt: draft.createdAt.toISOString()
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid draft update." },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Draft update failed." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ draftId: string }> }
) {
  const user = await getCurrentUserForApi();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { draftId } = await context.params;

  const existing = await prisma.emailDraft.findFirst({
    where: {
      id: draftId,
      userId: user.id
    }
  });

  if (!existing) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  await prisma.emailDraft.delete({
    where: {
      id: draftId
    }
  });

  await createAuditEvent({
    userId: user.id,
    eventType: "draft.deleted",
    metadata: {
      draftId
    }
  });

  return NextResponse.json({ ok: true, draftId });
}
