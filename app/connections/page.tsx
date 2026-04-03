import { ConnectionStatus } from "@prisma/client";
import { AccountDangerZone } from "@/components/account-danger-zone";
import { ConnectButton } from "@/components/connect-button";
import { DisconnectButton } from "@/components/disconnect-button";
import { SectionCard } from "@/components/section-card";
import { requireCurrentUser } from "@/lib/current-user";
import { isGoogleConfigured } from "@/lib/integrations/google";
import { describeConnection } from "@/lib/integration-types";

export default async function ConnectionsPage() {
  const user = await requireCurrentUser();
  const googleConnection = user.oauthConnections.find(
    (connection) => connection.provider === "GOOGLE"
  );

  const cards = [
    {
      provider: "GOOGLE" as const,
      label: "Gmail",
      connectPath: "/api/google/connect",
      isConfigured: isGoogleConfigured(),
      connection: googleConnection
    }
  ].map((item) => ({
    ...item,
    summary: describeConnection(item.connection, item.label, item.isConfigured)
  }));

  return (
    <main className="page">
      <div className="shell grid">
        <div>
          <p className="eyebrow">Connections</p>
          <h1>Manage your email connection and account settings</h1>
          <p className="muted">
            Connect Gmail here before sending outreach, and manage account
            cleanup controls in the same place.
          </p>
        </div>

        <div className="grid grid--two">
          {cards.map((item) => (
            <SectionCard
              key={item.provider}
              eyebrow="Provider"
              title={item.label}
              description={item.summary.detail}
            >
              <div className="pill-row">
                <span className="pill">
                  <span className="status-dot" />
                  {item.summary.status}
                </span>
                <span className="pill">
                  <span className="status-dot" />
                  {item.isConfigured ? "Configured" : "Missing credentials"}
                </span>
              </div>
              {item.connection?.email ? (
                <p className="muted">Connected account: {item.connection.email}</p>
              ) : null}
              {item.connection?.profileUrl ? (
                <p className="muted">
                  Profile URL: <a href={item.connection.profileUrl}>{item.connection.profileUrl}</a>
                </p>
              ) : null}
              <div className="hero__actions">
                <ConnectButton
                  href={item.connectPath}
                  disabled={!item.isConfigured}
                  label={
                    item.summary.status === ConnectionStatus.CONNECTED
                      ? `Reconnect ${item.label}`
                      : `Connect ${item.label}`
                  }
                />
                {item.connection ? <DisconnectButton provider={item.provider} /> : null}
              </div>
            </SectionCard>
          ))}

          <SectionCard
            eyebrow="Account"
            title="Account safety controls"
            description="Disconnect providers or remove your account and stored data."
          >
            <AccountDangerZone />
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
