import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { SectionCard } from "@/components/section-card";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const benefits = [
  "Private profile, draft, and send history per user",
  "Authenticated Gmail and LinkedIn connections",
  "Safer production controls for generation and send workflows"
];

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page">
      <div className="shell grid grid--two">
        <SectionCard
          eyebrow="Phase 5"
          title="Production-ready access"
          description="Phase Five replaces the shared demo user with real account isolation and session handling."
        >
          <ul className="list">
            {benefits.map((item) => (
              <li key={item}>
                <strong>{item}</strong>
              </li>
            ))}
          </ul>
        </SectionCard>

        <AuthForm />
      </div>
    </main>
  );
}
