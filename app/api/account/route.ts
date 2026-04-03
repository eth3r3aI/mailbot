import { NextResponse } from "next/server";
import { clearSession, getCurrentUserForApi } from "@/lib/auth";
import { createAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const user = await getCurrentUserForApi();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await createAuditEvent({
    userId: user.id,
    eventType: "account.delete_requested"
  });

  await prisma.user.delete({
    where: {
      id: user.id
    }
  });

  await clearSession();

  return NextResponse.json({
    ok: true
  });
}
