"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfileInput, StoredResume } from "@/lib/profile";

type ProfileFormProps = {
  initialValues: ProfileInput;
  initialResume: StoredResume | null;
};

export function ProfileForm({ initialValues, initialResume }: ProfileFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [storedResume, setStoredResume] = useState<StoredResume | null>(initialResume);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [resumeStatus, setResumeStatus] = useState<
    "idle" | "uploading" | "saved" | "error"
  >("idle");
  const [autofillStatus, setAutofillStatus] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [autofillError, setAutofillError] = useState("");

  function updateField(field: keyof ProfileInput, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError("");

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setError(payload?.error ?? "Profile save failed.");
      return;
    }

    setStatus("saved");
    router.refresh();
  }

  async function handleResumeUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setResumeStatus("uploading");
    setResumeError("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/profile/resume", {
      method: "POST",
      body: formData
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          resume?: StoredResume;
          error?: string;
        }
      | null;

    if (!response.ok || !payload?.resume) {
      setResumeStatus("error");
      setResumeError(payload?.error ?? "Resume upload failed.");
      return;
    }

    setStoredResume(payload.resume);
    setResumeStatus("saved");
    event.target.value = "";
  }

  async function handleAutofill(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setAutofillStatus("uploading");
    setAutofillError("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/profile/autofill", {
      method: "POST",
      body: formData
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          profile?: ProfileInput;
          error?: string;
        }
      | null;

    if (!response.ok || !payload?.profile) {
      setAutofillStatus("error");
      setAutofillError(payload?.error ?? "Profile autofill failed.");
      return;
    }

    setValues(payload.profile);
    setAutofillStatus("done");
    event.target.value = "";
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="upload-panel">
        <div>
          <p className="label">Saved PDF resume for email attachments</p>
          <p className="muted">
            Upload your PDF resume here to keep it on your profile and attach it by
            default when sending emails.
          </p>
        </div>
        <label className="upload-field">
          <span className="button--secondary">Upload PDF resume</span>
          <input
            className="sr-only"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleResumeUpload}
          />
        </label>
        {resumeStatus === "uploading" ? (
          <p className="status-copy">Uploading and saving resume...</p>
        ) : null}
        {resumeStatus === "saved" ? (
          <p className="status-copy">Resume saved. It will be attached by default during send.</p>
        ) : null}
        {resumeStatus === "error" ? (
          <p className="status-copy status-copy--error">{resumeError}</p>
        ) : null}
        {storedResume ? (
          <p className="muted">
            Stored PDF resume: <strong>{storedResume.fileName}</strong>
          </p>
        ) : (
          <p className="muted">No saved PDF resume yet.</p>
        )}
      </div>

      <div className="upload-panel">
        <div>
          <p className="label">Autofill from resume or background document</p>
          <p className="muted">
            Upload a PDF or Word document and the app will extract text, query the
            LLM, and populate the profile fields below.
          </p>
        </div>
        <label className="upload-field">
          <span className="button--secondary">Choose document</span>
          <input
            className="sr-only"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleAutofill}
          />
        </label>
        {autofillStatus === "uploading" ? (
          <p className="status-copy">Reading document and filling fields...</p>
        ) : null}
        {autofillStatus === "done" ? (
          <p className="status-copy">Fields updated from the uploaded document.</p>
        ) : null}
        {autofillStatus === "error" ? (
          <p className="status-copy status-copy--error">{autofillError}</p>
        ) : null}
        <p className="muted">
          This upload only fills profile fields. Use the PDF resume uploader above for the saved email attachment.
        </p>
      </div>

      <div className="form-grid form-grid--two">
        <label>
          <p className="label">Full name</p>
          <input
            className="input"
            value={values.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
          />
        </label>
        <label>
          <p className="label">Current title</p>
          <input
            className="input"
            value={values.currentTitle}
            onChange={(event) => updateField("currentTitle", event.target.value)}
          />
        </label>
      </div>

      <div className="form-grid form-grid--two">
        <label>
          <p className="label">Company</p>
          <input
            className="input"
            value={values.company}
            onChange={(event) => updateField("company", event.target.value)}
          />
        </label>
        <label>
          <p className="label">Target audience</p>
          <input
            className="input"
            value={values.targetAudience}
            onChange={(event) => updateField("targetAudience", event.target.value)}
          />
        </label>
      </div>

      <label>
        <p className="label">Short bio</p>
        <textarea
          className="textarea"
          value={values.shortBio}
          onChange={(event) => updateField("shortBio", event.target.value)}
        />
      </label>

      <label>
        <p className="label">Education summary</p>
        <textarea
          className="textarea"
          value={values.educationSummary}
          onChange={(event) => updateField("educationSummary", event.target.value)}
        />
      </label>

      <label>
        <p className="label">Background summary</p>
        <textarea
          className="textarea"
          value={values.backgroundSummary}
          onChange={(event) => updateField("backgroundSummary", event.target.value)}
        />
      </label>

      <label>
        <p className="label">Experience highlights</p>
        <textarea
          className="textarea"
          value={values.experienceHighlights}
          onChange={(event) => updateField("experienceHighlights", event.target.value)}
        />
      </label>

      <label>
        <p className="label">Expertise areas</p>
        <textarea
          className="textarea"
          value={values.expertiseAreas}
          onChange={(event) => updateField("expertiseAreas", event.target.value)}
        />
      </label>

      <div className="form-grid form-grid--two">
        <label>
          <p className="label">Tone preference</p>
          <input
            className="input"
            value={values.tonePreference}
            onChange={(event) => updateField("tonePreference", event.target.value)}
          />
        </label>
        <label>
          <p className="label">CTA preference</p>
          <input
            className="input"
            value={values.ctaPreference}
            onChange={(event) => updateField("ctaPreference", event.target.value)}
          />
        </label>
      </div>

      <label>
        <p className="label">About text / resume paste</p>
        <textarea
          className="textarea"
          value={values.aboutText}
          onChange={(event) => updateField("aboutText", event.target.value)}
        />
      </label>

      <div className="hero__actions">
        <button className="button" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : "Save profile"}
        </button>
        {status === "saved" ? <p className="status-copy">Profile saved.</p> : null}
        {status === "error" ? <p className="status-copy status-copy--error">{error}</p> : null}
      </div>
    </form>
  );
}
