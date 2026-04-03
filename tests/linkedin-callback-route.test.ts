import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/linkedin/callback/route";
import { hashOAuthState } from "@/lib/oauth-state";

const {
  getCookieMock,
  deleteCookieMock,
  upsertMock,
  exchangeLinkedInCodeMock,
  fetchLinkedInUserInfoMock
} = vi.hoisted(() => ({
  getCookieMock: vi.fn(),
  deleteCookieMock: vi.fn(),
  upsertMock: vi.fn(),
  exchangeLinkedInCodeMock: vi.fn(),
  fetchLinkedInUserInfoMock: vi.fn()
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: getCookieMock,
    delete: deleteCookieMock
  }))
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserForApi: vi.fn().mockResolvedValue({
    id: "user_123",
    email: "demo@mailbot.local",
    fullName: "Mailbot Demo User"
  })
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    oAuthConnection: {
      upsert: upsertMock
    }
  }
}));

vi.mock("@/lib/integrations/linkedin", () => ({
  linkedinProvider: "LINKEDIN",
  exchangeLinkedInCode: exchangeLinkedInCodeMock,
  fetchLinkedInUserInfo: fetchLinkedInUserInfoMock
}));

describe("linkedin callback route", () => {
  it("rejects invalid oauth state", async () => {
    getCookieMock.mockReturnValue({ value: "stored-state" });

    const response = await GET(
      new Request("http://localhost:3000/api/linkedin/callback?code=abc&state=wrong")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("error=invalid_state");
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("stores a successful linkedin connection without inventing a public profile url", async () => {
    getCookieMock.mockReturnValue({
      value: hashOAuthState("abc")
    });
    exchangeLinkedInCodeMock.mockResolvedValue({
      access_token: "token",
      expires_in: 3600,
      scope: "openid profile email"
    });
    fetchLinkedInUserInfoMock.mockResolvedValue({
      sub: "opaque-subject-id",
      name: "Demo LinkedIn",
      email: "demo@mailbot.local"
    });
    upsertMock.mockResolvedValue({});

    const response = await GET(
      new Request("http://localhost:3000/api/linkedin/callback?code=abc&state=abc")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("success=1");
    expect(upsertMock).toHaveBeenCalled();

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.update.profileUrl).toBeNull();
    expect(payload.create.profileUrl).toBeNull();
    expect(deleteCookieMock).toHaveBeenCalledWith("mailbot_linkedin_state");
  });
});
