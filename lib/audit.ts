import { prisma } from "@/lib/prisma";

export async function createAuditEvent(args: {
  userId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  const auditEventClient = (prisma as typeof prisma & {
    auditEvent?: {
      create: (input: {
        data: {
          userId: string | null;
          eventType: string;
          metadataJson: string | null;
        };
      }) => Promise<unknown>;
    };
  }).auditEvent;

  if (!auditEventClient) {
    return null;
  }

  try {
    return await auditEventClient.create({
      data: {
        userId: args.userId ?? null,
        eventType: args.eventType,
        metadataJson: args.metadata ? JSON.stringify(args.metadata) : null
      }
    });
  } catch {
    return null;
  }
}
