import { ConnectionStatus, OAuthProvider } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuditEvent } from "@/lib/audit";
import { getCurrentUserForApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const disconnectSchema = z.object({
  provider: z.nativeEnum(OAuthProvider)
});

export async function POST(request: Request) {
  const body = await request.json();
  const { provider } = disconnectSchema.parse(body);
  const user = await getCurrentUserForApi();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await prisma.oAuthConnection.deleteMany({
    where: {
      userId: user.id,
      provider
    }
  });

  await createAuditEvent({
    userId: user.id,
    eventType: "oauth.disconnect",
    metadata: {
      provider
    }
  });

  return NextResponse.json({
    ok: true,
    provider,
    status: ConnectionStatus.DISCONNECTED
  });
}
