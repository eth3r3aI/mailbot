import { NextResponse } from "next/server";
import { clearSession, getCurrentUserForApi } from "@/lib/auth";
import { createAuditEvent } from "@/lib/audit";

export async function POST() {
  const user = await getCurrentUserForApi();

  await clearSession();

  if (user) {
    await createAuditEvent({
      userId: user.id,
      eventType: "auth.logout"
    });
  }

  return NextResponse.json({ ok: true });
}
