import { SectionCard } from "@/components/section-card";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SentPage() {
  const user = await requireCurrentUser();
  const sentEmails = await prisma.sentEmail.findMany({
    where: {
      userId: user.id
    },
    orderBy: {
      sentAt: "desc"
    },
    take: 20
  });

  return (
    <main className="page">
      <div className="shell grid">
        <div>
          <p className="eyebrow">Sent</p>
          <h1>Track sent networking emails</h1>
          <p className="muted">
            Successful Gmail sends are recorded per signed-in account so users
            can review what was sent, when it was sent, and which Gmail message
            ID it produced.
          </p>
        </div>

        <SectionCard
          eyebrow="History"
          title="Sent email history"
          description="Each record below represents a successful Gmail API send."
        >
          <ul className="list">
            {sentEmails.map((item) => (
              <li key={item.id}>
                <p className="kicker">{item.recipientEmail}</p>
                <strong>{item.subject}</strong>
                <p className="muted">
                  Sent: {item.sentAt ? new Date(item.sentAt).toLocaleString() : "Unknown"}
                </p>
                <p className="muted">Gmail ID: {item.gmailMessageId ?? "Unavailable"}</p>
              </li>
            ))}
            {sentEmails.length === 0 ? (
              <li>
                <strong>No sent emails yet.</strong>
                <p className="muted">
                  Review a draft in the compose workspace and send it with Gmail to create history here.
                </p>
              </li>
            ) : null}
          </ul>
        </SectionCard>
      </div>
    </main>
  );
}
