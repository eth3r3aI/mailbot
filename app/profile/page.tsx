import { ProfileForm } from "@/components/profile-form";
import { SectionCard } from "@/components/section-card";
import { getCurrentUserProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getCurrentUserProfile();

  return (
    <main className="page">
      <div className="shell grid">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>Capture the sender story we want the model to use</h1>
          <p className="muted">
            These fields back the draft generation workflow for the signed-in
            user. You can save a PDF resume for default email attachments and
            separately auto-populate profile fields from a resume or background
            document before review.
          </p>
        </div>

        <SectionCard
          eyebrow="Sender context"
          title="Profile editor"
          description="These fields are persisted and used directly in prompt construction."
        >
          <ProfileForm initialValues={profile.values} initialResume={profile.resume} />
        </SectionCard>
      </div>
    </main>
  );
}
