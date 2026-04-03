import Link from "next/link";
import { SectionCard } from "@/components/section-card";

const pillars = [
  {
    title: "Authenticate real users",
    description:
      "Keep every profile, integration, draft, and send history isolated behind a real account session."
  },
  {
    title: "Collect sender context",
    description:
      "Give each user a structured profile so the app drafts with real background instead of generic copy."
  },
  {
    title: "Connect outbound channels",
    description:
      "Prepare LinkedIn and Gmail integrations as first-class connection states in the product."
  },
  {
    title: "Ship a hosted workflow",
    description:
      "Start with a clean multi-user web foundation that we can extend into the full SaaS product."
  }
];

export default function HomePage() {
  return (
    <main className="page">
      <div className="shell">
        <section className="hero">
          <div className="hero__panel">
            <p className="hero__eyebrow">Phase 5 production hardening</p>
            <h1>Outreach software with real accounts and safer delivery controls.</h1>
            <p>
              Mailbot now centers on authenticated multi-user workflows, protected
              provider connections, AI-assisted drafting, and explicit Gmail sending
              with stronger production safeguards.
            </p>
            <div className="hero__actions">
              <Link className="button" href="/login">
                Sign in to continue
              </Link>
              <Link className="button--secondary" href="/dashboard">
                View product tour
              </Link>
            </div>
          </div>
          <div className="grid grid--three">
            {pillars.map((pillar) => (
              <SectionCard
                key={pillar.title}
                eyebrow="Platform"
                title={pillar.title}
                description={pillar.description}
              >
                <p className="muted">
                  The interface stays intentionally compact so onboarding, review,
                  and send safety remain easy to understand.
                </p>
              </SectionCard>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
