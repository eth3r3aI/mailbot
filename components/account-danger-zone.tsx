"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AccountDangerZone() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "deleting" | "error">("idle");
  const [error, setError] = useState("");

  return (
    <div className="upload-panel">
      <div>
        <p className="label">Delete account</p>
        <p className="muted">
          This removes your profile, connections, drafts, sent history, and session.
        </p>
      </div>
      <div className="hero__actions">
        <button
          className="button--secondary"
          type="button"
          disabled={status === "deleting"}
          onClick={async () => {
            const confirmed = window.confirm(
              "Delete your Mailbot account and all associated data?"
            );

            if (!confirmed) {
              return;
            }

            setStatus("deleting");
            setError("");

            const response = await fetch("/api/account", {
              method: "DELETE"
            });
            const payload = (await response.json().catch(() => null)) as
              | { error?: string }
              | null;

            if (!response.ok) {
              setStatus("error");
              setError(payload?.error ?? "Account deletion failed.");
              return;
            }

            router.push("/login");
            router.refresh();
          }}
        >
          {status === "deleting" ? "Deleting..." : "Delete account"}
        </button>
        {status === "error" ? <p className="status-copy status-copy--error">{error}</p> : null}
      </div>
    </div>
  );
}
