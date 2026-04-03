import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";

vi.mock("@/lib/current-user", () => ({
  requireCurrentUser: vi.fn().mockResolvedValue({
    id: "user_123",
    email: "demo@mailbot.local",
    fullName: "Mailbot Demo User",
    oauthConnections: [
      {
        provider: "GOOGLE",
        status: "CONNECTED",
        displayName: "Demo Gmail",
        email: "demo@mailbot.local",
        lastError: null
      }
    ]
  })
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailDraft: {
      count: vi.fn().mockResolvedValue(2)
    },
    sentEmail: {
      count: vi.fn().mockResolvedValue(1)
    }
  }
}));

vi.mock("@/lib/integrations/google", () => ({
  isGoogleConfigured: vi.fn(() => true)
}));

describe("dashboard page", () => {
  it("shows a user guide and account activity", async () => {
    render(await DashboardPage());

    expect(
      screen.getByRole("heading", { name: /how to use mailbot/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/1\. connect gmail/i)).toBeInTheDocument();
    expect(screen.getByText(/start here/i)).toBeInTheDocument();
    expect(screen.getByText(/^2$/)).toBeInTheDocument();
    expect(screen.getByText(/^1$/)).toBeInTheDocument();
    expect(screen.getByText(/draft generation is ready to use/i)).toBeInTheDocument();
  });
});
