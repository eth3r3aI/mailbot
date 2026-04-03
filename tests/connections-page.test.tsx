import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConnectionsPage from "@/app/connections/page";

vi.mock("@/components/account-danger-zone", () => ({
  AccountDangerZone: () => <div>Danger zone</div>
}));

vi.mock("@/lib/current-user", () => ({
  requireCurrentUser: vi.fn().mockResolvedValue({
    email: "demo@mailbot.local",
    fullName: "Mailbot Demo User",
    oauthConnections: [
      {
        provider: "GOOGLE",
        status: "CONNECTED",
        displayName: "Demo Gmail",
        email: "demo@mailbot.local",
        profileUrl: null
      }
    ]
  })
}));

vi.mock("@/lib/integrations/google", () => ({
  isGoogleConfigured: vi.fn(() => true)
}));

describe("connections page", () => {
  it("renders provider cards and configuration state", async () => {
    render(await ConnectionsPage());

    expect(
      screen.getByRole("heading", {
        name: /manage your email connection and account settings/i
      })
    ).toBeInTheDocument();

    expect(screen.getByText(/connected account: demo@mailbot.local/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /gmail/i })).toBeInTheDocument();
    expect(screen.getByText(/account safety controls/i)).toBeInTheDocument();
  });
});
