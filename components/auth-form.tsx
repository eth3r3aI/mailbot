"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const response = await fetch(
      mode === "login" ? "/api/auth/login" : "/api/auth/signup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          mode === "login"
            ? { email, password }
            : { fullName, email, password }
        )
      }
    );

    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setStatus("error");
      setError(payload?.error ?? "Authentication failed.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <section className="card">
      <div className="card__header">
        <p className="eyebrow">Authentication</p>
        <h2>{mode === "login" ? "Sign in to Mailbot" : "Create your account"}</h2>
        <p className="muted">
          {mode === "login"
            ? "Use your email and password to continue into your private workspace."
            : "Create a private account so your profile, connections, drafts, and sends stay isolated."}
        </p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label>
            <p className="label">Full name</p>
            <input className="input" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </label>
        ) : null}
        <label>
          <p className="label">Email</p>
          <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          <p className="label">Password</p>
          <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>

        <div className="hero__actions">
          <button className="button" type="submit" disabled={status === "loading"}>
            {status === "loading"
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
          <button
            className="button--secondary"
            type="button"
            onClick={() => {
              setMode((current) => (current === "login" ? "signup" : "login"));
              setError("");
              setStatus("idle");
            }}
          >
            {mode === "login" ? "Need an account?" : "Already have an account?"}
          </button>
        </div>

        {status === "error" ? <p className="status-copy status-copy--error">{error}</p> : null}
      </form>
    </section>
  );
}
