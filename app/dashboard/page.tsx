import { SectionCard } from "@/components/section-card";
import { requireCurrentUser } from "@/lib/current-user";
import { env } from "@/lib/env";
import { isGoogleConfigured } from "@/lib/integrations/google";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const draftCount = await prisma.emailDraft.count({
    where: {
      userId: user.id
    }
  });
  const sentCount = await prisma.sentEmail.count({
    where: {
      userId: user.id
    }
  });
  const googleConnection = user.oauthConnections.find(
    (connection) => connection.provider === "GOOGLE"
  );
  const gmailReady = Boolean(googleConnection && isGoogleConfigured());
  const openAiReady = Boolean(env.OPENAI_API_KEY);
  const canGenerate = gmailReady && openAiReady;
  const guideSteps = [
    {
      title: "1. Connect Gmail",
      description: gmailReady
        ? "Your Gmail account is connected and ready for sending."
        : "Open Connections and connect Gmail before trying to send outreach.",
      status: gmailReady ? "Ready" : "Action needed"
    },
    {
      title: "2. Complete your profile",
      description:
        "Add your background, save a PDF resume if you want it attached by default, and keep your sender details current.",
      status: "Recommended"
    },
    {
      title: "3. Generate a draft",
      description: openAiReady
        ? "Use Compose to generate a draft from your saved profile and target context."
        : "OpenAI is not configured yet, so draft generation is currently unavailable.",
      status: openAiReady ? "Ready" : "Blocked"
    },
    {
      title: "4. Review and send",
      description:
        "Edit the subject and body, confirm the recipient, and send when the draft looks right.",
      status: canGenerate ? "Ready" : "Pending setup"
    }
  ];

  return (
    <main className="page">
      <div className="shell grid">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>How to use Mailbot</h1>
          <p className="muted">
            This dashboard is your quick guide to getting from setup to a sent
            outreach email.
          </p>
        </div>

        <div className="grid grid--two">
          <SectionCard
            eyebrow="Guide"
            title="Start here"
            description="Follow these steps in order the first time you use the app."
          >
            <ul className="list">
              {guideSteps.map((step) => (
                <li key={step.title}>
                  <p className="kicker">{step.status}</p>
                  <strong>{step.title}</strong>
                  <p className="muted">{step.description}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            eyebrow="Progress"
            title="Your activity"
            description="A quick snapshot of what you have already done."
          >
            <ul className="list">
              <li>
                <p className="kicker">Drafts saved</p>
                <strong>{draftCount}</strong>
                <p className="muted">Saved drafts are available from the compose page.</p>
              </li>
              <li>
                <p className="kicker">Emails sent</p>
                <strong>{sentCount}</strong>
                <p className="muted">Sent messages are listed on the sent history page.</p>
              </li>
              <li>
                <p className="kicker">Gmail connection</p>
                <strong>{gmailReady ? "Connected" : "Not connected"}</strong>
                <p className="muted">
                  {gmailReady
                    ? "You can send reviewed drafts through Gmail."
                    : "Visit Connections to finish Gmail setup."}
                </p>
              </li>
              <li>
                <p className="kicker">OpenAI generation</p>
                <strong>{openAiReady ? "Available" : "Not configured"}</strong>
                <p className="muted">
                  {openAiReady
                    ? "Draft generation is ready to use."
                    : "Add OPENAI_API_KEY to enable draft generation."}
                </p>
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
