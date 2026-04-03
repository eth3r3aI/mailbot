import { prisma } from "@/lib/prisma";

export async function enforceUserRateLimit(args: {
  userId: string;
  eventType: string;
  limit: number;
  windowMs: number;
  message: string;
}) {
  const auditEventClient = (prisma as typeof prisma & {
    auditEvent?: {
      count: (input: {
        where: {
          userId: string;
          eventType: string;
          createdAt: {
            gte: Date;
          };
        };
      }) => Promise<number>;
    };
  }).auditEvent;

  if (!auditEventClient) {
    return;
  }

  const count = await auditEventClient.count({
    where: {
      userId: args.userId,
      eventType: args.eventType,
      createdAt: {
        gte: new Date(Date.now() - args.windowMs)
      }
    }
  });

  if (count >= args.limit) {
    throw new Error(args.message);
  }
}
