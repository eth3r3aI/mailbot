"use client";

import { useState } from "react";
import type { ComposeRequest, GeneratedEmail } from "@/lib/email-generation";
import type { ProfileInput } from "@/lib/profile";

type DraftRecord = {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  recipientName: string;
  recipientEmail?: string | null;
  recipientCompany?: string | null;
  recipientRole?: string | null;
  objective?: string | null;
  composeInput?: ComposeRequest | null;
  variantShort?: string | null;
  inferredRecipient?: {
    inferredEmail: string | null;
    resolvedCompany: string | null;
    resolvedDomain: string | null;
    confidence: "low" | "medium" | "high" | null;
    rationale: string;
    sourceUrls: string[];
  } | null;
};

type ComposeFormProps = {
  profile: ProfileInput;
  recentDrafts: DraftRecord[];
  hasStoredResume: boolean;
  storedResumeFileName?: string | null;
};

const initialComposeValues: ComposeRequest = {
  recipientName: "",
  recipientEmail: "",
  recipientCompany: "",
  recipientRole: "",
  targetProfileText: "",
  connectionGoal: "",
  sharedContext: "",
  whyThem: "",
  credibility: "",
  ask: "",
  desiredTone: ""
};

const connectionGoalOptions = [
  "Learn about the recipient's internship or career path",
  "Ask for internship advice and how to stand out",
  "Build a genuine professional connection",
  "Explore a possible internship opportunity",
  "Ask for a referral if there is a fit",
  "Learn more about the team, role, or company"
];

const networkingAskOptions = [
  "A short 15-minute chat",
  "A few career advice pointers over email",
  "Guidance on internship recruiting timelines",
  "Advice on breaking into the field",
  "A referral if they think there is a fit",
  "Permission to stay in touch"
];

const desiredToneOptions = [
  "Professional and warm",
  "Curious and respectful",
  "Friendly and concise",
  "Confident but low-pressure",
  "Student-to-professional and appreciative",
  "Direct and polished"
];

function getPresetMode(
  value: string,
  options: string[]
): "preset" | "custom" {
  return !value || options.includes(value) ? "preset" : "custom";
}

export function ComposeForm({
  profile,
  recentDrafts,
  hasStoredResume,
  storedResumeFileName
}: ComposeFormProps) {
  const [values, setValues] = useState(initialComposeValues);
  const [draft, setDraft] = useState<GeneratedEmail | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [editorStatus, setEditorStatus] = useState<"idle" | "saving" | "deleting" | "sending" | "saved" | "sent">(
    "idle"
  );
  const [error, setError] = useState("");
  const [savedDrafts, setSavedDrafts] = useState(recentDrafts);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [goalMode, setGoalMode] = useState<"preset" | "custom">("preset");
  const [askMode, setAskMode] = useState<"preset" | "custom">("preset");
  const [toneMode, setToneMode] = useState<"preset" | "custom">("preset");
  const [attachResume, setAttachResume] = useState(hasStoredResume);

  const profileIsReady = Boolean(profile.fullName && profile.currentTitle && profile.shortBio);

  function updateField(field: keyof ComposeRequest, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value
    }));
  }

  function loadDraft(record: DraftRecord) {
    setActiveDraftId(record.id);
    setDraft({
      subject: record.subject,
      body: record.body,
      variantShort: record.variantShort || "Short version not saved for this draft."
    });
    if (record.composeInput) {
      setValues(record.composeInput);
      setGoalMode(getPresetMode(record.composeInput.connectionGoal, connectionGoalOptions));
      setAskMode(getPresetMode(record.composeInput.ask, networkingAskOptions));
      setToneMode(getPresetMode(record.composeInput.desiredTone, desiredToneOptions));
    } else {
      setValues(initialComposeValues);
    }
    // Always populate recipient fields from the draft record
    setValues((current) => ({
      ...current,
      recipientEmail: record.recipientEmail || current.recipientEmail || "",
      recipientCompany: record.recipientCompany || current.recipientCompany || "",
      recipientRole: record.recipientRole || current.recipientRole || "",
      recipientName: record.recipientName || current.recipientName || ""
    }));
    setEditorStatus("idle");
    setError("");
  }

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setEditorStatus("idle");
    setError("");

    const response = await fetch("/api/email/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          draft?: GeneratedEmail;
          record?: DraftRecord;
          error?: string;
        }
      | null;

    if (!response.ok || !payload?.draft || !payload.record) {
      setStatus("error");
      setError(payload?.error ?? "Draft generation failed.");
      return;
    }

    setDraft(payload.draft);
    setActiveDraftId(payload.record.id);
    setValues((current) => ({
      ...current,
      recipientEmail:
        current.recipientEmail || payload.record?.recipientEmail || "",
      recipientCompany:
        current.recipientCompany || payload.record?.recipientCompany || ""
    }));
    setSavedDrafts((current) => [payload.record!, ...current.filter((item) => item.id !== payload.record!.id)].slice(0, 5));
    setStatus("idle");
  }

  async function handleSaveDraft() {
    if (!activeDraftId || !draft) {
      return;
    }

    setEditorStatus("saving");
    setError("");

    const response = await fetch(`/api/email/drafts/${activeDraftId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(draft)
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          draft?: {
            id: string;
            subject: string;
            body: string;
          };
          error?: string;
        }
      | null;

    if (!response.ok || !payload?.draft) {
      setEditorStatus("idle");
      setError(payload?.error ?? "Draft save failed.");
      return;
    }

    setSavedDrafts((current) =>
      current.map((item) =>
        item.id === activeDraftId
          ? {
              ...item,
              subject: draft.subject,
              body: draft.body,
              variantShort: draft.variantShort
            }
          : item
      )
    );
    setEditorStatus("saved");
  }

  async function handleDeleteDraft() {
    if (!activeDraftId) {
      return;
    }

    setEditorStatus("deleting");
    setError("");

    const response = await fetch(`/api/email/drafts/${activeDraftId}`, {
      method: "DELETE"
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          draftId?: string;
          error?: string;
        }
      | null;

    if (!response.ok || !payload?.draftId) {
      setEditorStatus("idle");
      setError(payload?.error ?? "Draft delete failed.");
      return;
    }

    setSavedDrafts((current) => current.filter((item) => item.id !== payload.draftId));
    setActiveDraftId(null);
    setDraft(null);
    setEditorStatus("idle");
  }

  async function handleSendDraft() {
    if (!activeDraftId || !draft) {
      return;
    }

    if (!values.recipientEmail) {
      setError("Recipient email is required before sending.");
      return;
    }

    setEditorStatus("sending");
    setError("");

    const response = await fetch("/api/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        draftId: activeDraftId,
        subject: draft.subject,
        body: draft.body,
        recipientEmail: values.recipientEmail,
        attachResume
      })
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          sent?: {
            id: string;
          };
          error?: string;
        }
      | null;

    if (!response.ok || !payload?.sent) {
      setEditorStatus("idle");
      setError(payload?.error ?? "Draft send failed.");
      return;
    }

    setEditorStatus("sent");
  }

  return (
    <div className="grid grid--two">
      <div className="grid">
        <div className="pill-row">
          <span className="pill">
            <span className="status-dot" />
            {profileIsReady ? "Profile ready" : "Profile needs work"}
          </span>
          <span className="pill">
            <span className="status-dot" />
            Recent drafts: {savedDrafts.length}
          </span>
        </div>

        <form className="card form-grid" onSubmit={handleGenerate}>
          <div className="card__header">
            <p className="eyebrow">Composer</p>
            <h2>Generate a networking email</h2>
            <p className="muted">
              The model will use your saved sender profile plus copied target profile text that you paste in here.
            </p>
            <p className="muted">
              If recipient email is blank, the app may infer a likely work email from public web information and keep it editable before send.
            </p>
          </div>

          <div className="form-grid form-grid--two">
            <label>
              <p className="label">Recipient name</p>
              <input className="input" value={values.recipientName} onChange={(event) => updateField("recipientName", event.target.value)} />
            </label>
            <label>
              <p className="label">Recipient email</p>
              <input className="input" value={values.recipientEmail} onChange={(event) => updateField("recipientEmail", event.target.value)} />
            </label>
          </div>

          <div className="form-grid form-grid--two">
            <label>
              <p className="label">Recipient company</p>
              <input className="input" placeholder="Optional if the pasted profile text already covers this" value={values.recipientCompany} onChange={(event) => updateField("recipientCompany", event.target.value)} />
            </label>
            <label>
              <p className="label">Recipient role</p>
              <input className="input" placeholder="Optional if the pasted profile text already covers this" value={values.recipientRole} onChange={(event) => updateField("recipientRole", event.target.value)} />
            </label>
          </div>

          <label>
            <p className="label">Copied target profile text</p>
            <textarea
              className="textarea textarea--tall"
              placeholder="Paste the target person's profile summary, experience, headline, or other text you copied manually."
              value={values.targetProfileText}
              onChange={(event) => updateField("targetProfileText", event.target.value)}
            />
            <p className="muted">
              This is the source of truth for target-person context. We only use the text you paste here.
            </p>
          </label>

          <label>
            <p className="label">Connection goal</p>
            <select
              className="input"
              value={goalMode === "preset" ? values.connectionGoal : "__custom__"}
              onChange={(event) => {
                if (event.target.value === "__custom__") {
                  setGoalMode("custom");
                  updateField("connectionGoal", "");
                  return;
                }

                setGoalMode("preset");
                updateField("connectionGoal", event.target.value);
              }}
            >
              <option value="">Select a common outreach goal</option>
              {connectionGoalOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value="__custom__">Other goal...</option>
            </select>
            {goalMode === "custom" ? (
              <input
                className="input"
                placeholder="Write a custom connection goal"
                value={values.connectionGoal}
                onChange={(event) => updateField("connectionGoal", event.target.value)}
              />
            ) : null}
          </label>

          <label>
            <p className="label">Shared context</p>
            <textarea className="textarea" placeholder="Optional context like alumni overlap, event context, or a reason you're reaching out now" value={values.sharedContext} onChange={(event) => updateField("sharedContext", event.target.value)} />
          </label>

          <label>
            <p className="label">Why this person</p>
            <textarea className="textarea" placeholder="Optional note about why this person is a good fit for the conversation" value={values.whyThem} onChange={(event) => updateField("whyThem", event.target.value)} />
          </label>

          <label>
            <p className="label">Credibility note</p>
            <textarea
              className="textarea"
              placeholder="Optional. Leave blank to let the app derive a credibility angle from your saved profile."
              value={values.credibility}
              onChange={(event) => updateField("credibility", event.target.value)}
            />
          </label>

          <div className="form-grid form-grid--two">
            <label>
              <p className="label">Networking ask</p>
              <select
                className="input"
                value={askMode === "preset" ? values.ask : "__custom__"}
                onChange={(event) => {
                  if (event.target.value === "__custom__") {
                    setAskMode("custom");
                    updateField("ask", "");
                    return;
                  }

                  setAskMode("preset");
                  updateField("ask", event.target.value);
                }}
              >
                <option value="">Select a common ask</option>
                {networkingAskOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value="__custom__">Other ask...</option>
              </select>
              {askMode === "custom" ? (
                <input
                  className="input"
                  placeholder="Write a custom ask"
                  value={values.ask}
                  onChange={(event) => updateField("ask", event.target.value)}
                />
              ) : null}
            </label>
            <label>
              <p className="label">Desired tone</p>
              <select
                className="input"
                value={toneMode === "preset" ? values.desiredTone : "__custom__"}
                onChange={(event) => {
                  if (event.target.value === "__custom__") {
                    setToneMode("custom");
                    updateField("desiredTone", "");
                    return;
                  }

                  setToneMode("preset");
                  updateField("desiredTone", event.target.value);
                }}
              >
                <option value="">Select a tone</option>
                {desiredToneOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value="__custom__">Other tone...</option>
              </select>
              {toneMode === "custom" ? (
                <input
                  className="input"
                  placeholder="Write a custom tone"
                  value={values.desiredTone}
                  onChange={(event) => updateField("desiredTone", event.target.value)}
                />
              ) : null}
            </label>
          </div>

          <div className="hero__actions">
            <button className="button" type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Generating..." : "Generate networking email"}
            </button>
            {status === "error" ? <p className="status-copy status-copy--error">{error}</p> : null}
          </div>
        </form>
      </div>

      <div className="grid">
        <section className="card">
          <div className="card__header">
            <p className="eyebrow">Latest result</p>
            <h2>Review the generated networking note</h2>
            <p className="muted">
              Load a saved draft from history, edit it here, and save your changes back to the database.
            </p>
          </div>
          {draft ? (
            <div className="card__body">
              <label>
                <p className="label">Recipient email</p>
                <input
                  className="input"
                  value={values.recipientEmail}
                  onChange={(event) => updateField("recipientEmail", event.target.value)}
                />
              </label>
              {hasStoredResume ? (
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={attachResume}
                    onChange={(event) => setAttachResume(event.target.checked)}
                  />
                  <span>
                    Attach stored resume{storedResumeFileName ? ` (${storedResumeFileName})` : ""}
                  </span>
                </label>
              ) : (
                <p className="muted">
                  Upload a resume on the profile page if you want to attach it during send.
                </p>
              )}
              <label>
                <p className="label">Subject</p>
                <textarea className="textarea textarea--compact" value={draft.subject} onChange={(event) => setDraft((current) => current ? { ...current, subject: event.target.value } : current)} />
              </label>
              <label>
                <p className="label">Email body</p>
                <textarea className="textarea textarea--tall" value={draft.body} onChange={(event) => setDraft((current) => current ? { ...current, body: event.target.value } : current)} />
              </label>
              <label>
                <p className="label">Short variant</p>
                <textarea className="textarea" value={draft.variantShort} onChange={(event) => setDraft((current) => current ? { ...current, variantShort: event.target.value } : current)} />
              </label>
              <div className="hero__actions">
                <button className="button" type="button" disabled={!activeDraftId || editorStatus === "saving"} onClick={handleSaveDraft}>
                  {editorStatus === "saving" ? "Saving..." : "Save draft changes"}
                </button>
                <button className="button" type="button" disabled={!activeDraftId || editorStatus === "sending"} onClick={handleSendDraft}>
                  {editorStatus === "sending" ? "Sending..." : "Send with Gmail"}
                </button>
                <button className="button--secondary" type="button" disabled={!activeDraftId || editorStatus === "deleting"} onClick={handleDeleteDraft}>
                  {editorStatus === "deleting" ? "Deleting..." : "Delete draft"}
                </button>
                {editorStatus === "saved" ? <p className="status-copy">Draft updated.</p> : null}
                {editorStatus === "sent" ? <p className="status-copy">Draft sent through Gmail.</p> : null}
              </div>
            </div>
          ) : (
            <p className="muted">
              No draft loaded. Generate one or choose a saved draft from the history list.
            </p>
          )}
        </section>

        <section className="card">
          <div className="card__header">
            <p className="eyebrow">Recent drafts</p>
            <h2>Saved generation history</h2>
          </div>
          <ul className="list">
            {savedDrafts.map((item) => (
              <li key={item.id}>
                <p className="kicker">
                  {item.recipientName} {item.recipientCompany ? `at ${item.recipientCompany}` : ""}
                </p>
                <strong>{item.subject}</strong>
                <p className="muted">{new Date(item.createdAt).toLocaleString()}</p>
                <div className="hero__actions">
                  <button
                    className="button--secondary"
                    type="button"
                    onClick={() => loadDraft(item)}
                  >
                    {activeDraftId === item.id ? "Loaded" : "Load draft"}
                  </button>
                </div>
              </li>
            ))}
            {savedDrafts.length === 0 ? (
              <li>
                <strong>No drafts yet.</strong>
                <p className="muted">Successful generations will be listed here.</p>
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
