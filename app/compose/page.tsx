import { ComposeForm } from "@/components/compose-form";
import { SectionCard } from "@/components/section-card";
import { requireCurrentUser } from "@/lib/current-user";
import type { ComposeRequest } from "@/lib/email-generation";
import { getCurrentUserProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type InferredRecipient = {
  inferredEmail: string | null;
  resolvedCompany: string | null;
  resolvedDomain: string | null;
  confidence: "low" | "medium" | "high" | null;
  rationale: string;
  sourceUrls: string[];
};

export default async function ComposePage() {
  const [{ values: profile }, user] = await Promise.all([
    getCurrentUserProfile(),
    requireCurrentUser()
  ]);
  const recentDrafts = await prisma.emailDraft.findMany({
    where: {
      userId: user.id
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 5,
    select: {
      id: true,
      subject: true,
      body: true,
      createdAt: true,
      recipientName: true,
      recipientEmail: true,
      recipientCompany: true,
      recipientRole: true,
      objective: true,
      contextJson: true
    }
  });

  const hydratedDrafts = recentDrafts.map((item) => {
    let composeInput: ComposeRequest | null = null;
    let variantShort = "";
    let inferredRecipient: InferredRecipient | null = null;

    try {
      const parsed = item.contextJson ? JSON.parse(item.contextJson) : null;
      composeInput = (parsed?.generationInput as ComposeRequest | undefined) ?? null;
      variantShort = (parsed?.variantShort as string | undefined) ?? "";
      const candidate = parsed?.inferredRecipient as Partial<InferredRecipient> | null | undefined;
      inferredRecipient = candidate
        ? {
            inferredEmail: candidate.inferredEmail ?? null,
            resolvedCompany: candidate.resolvedCompany ?? null,
            resolvedDomain: candidate.resolvedDomain ?? null,
            confidence:
              candidate.confidence === "low" ||
              candidate.confidence === "medium" ||
              candidate.confidence === "high"
                ? candidate.confidence
                : null,
            rationale: candidate.rationale ?? "",
            sourceUrls: Array.isArray(candidate.sourceUrls) ? candidate.sourceUrls : []
          }
        : null;
    } catch {
      composeInput = null;
      variantShort = "";
      inferredRecipient = null;
    }

    return {
      id: item.id,
      subject: item.subject,
      body: item.body,
      createdAt: item.createdAt.toISOString(),
      recipientName: item.recipientName,
      recipientEmail: item.recipientEmail,
      recipientCompany: item.recipientCompany,
      recipientRole: item.recipientRole,
      objective: item.objective,
      composeInput,
      variantShort,
      inferredRecipient
    };
  });

  return (
    <main className="page">
      <div className="shell grid">
        <div>
          <p className="eyebrow">Compose</p>
          <h1>Generate networking emails from saved sender context and pasted target profile text</h1>
          <p className="muted">
            This workspace combines your saved sender profile, copied target
            profile text, and OpenAI-backed prompt shaping into a reviewable draft.
          </p>
        </div>

        <div className="grid grid--two">
          <SectionCard
            eyebrow="Profile signal"
            title="What the model will use"
            description="These sender details are loaded from the saved profile before each generation."
          >
            <ul className="list">
              <li>
                <p className="kicker">Sender</p>
                <strong>{profile.fullName}</strong>
                <p className="muted">
                  {profile.currentTitle} at {profile.company}
                </p>
              </li>
              <li>
                <p className="kicker">Audience</p>
                <strong>{profile.targetAudience}</strong>
              </li>
              <li>
                <p className="kicker">Tone</p>
                <strong>{profile.tonePreference}</strong>
              </li>
            </ul>
          </SectionCard>

          <SectionCard
            eyebrow="Safety"
            title="Generation guardrails"
            description="The draft route keeps the message relationship-first and only uses target details you paste in manually."
          >
            <ul className="list">
              <li>
                <strong>No fabricated claims or relationships.</strong>
              </li>
              <li>
                <strong>Copied profile text is used as context, not scraped LinkedIn data.</strong>
              </li>
              <li>
                <strong>Every successful generation is stored as a draft.</strong>
              </li>
              <li>
                <strong>Generation and send actions are rate limited and require explicit user review.</strong>
              </li>
            </ul>
          </SectionCard>
        </div>

        <ComposeForm
          profile={profile}
          recentDrafts={hydratedDrafts}
          hasStoredResume={Boolean(user.profile?.resumeDataBase64)}
          storedResumeFileName={user.profile?.resumeFileName ?? null}
        />
      </div>
    </main>
  );
}
