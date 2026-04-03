import { describe, expect, it } from "vitest";
import { buildGoogleAuthorizationUrl } from "@/lib/integrations/google";
import { buildLinkedInAuthorizationUrl } from "@/lib/integrations/linkedin";
import { describeConnection } from "@/lib/integration-types";
import { hashOAuthState } from "@/lib/oauth-state";

describe("oauth helpers", () => {
  it("builds a LinkedIn authorization URL with the expected state", () => {
    const url = new URL(buildLinkedInAuthorizationUrl("linkedin-state"));

    expect(url.origin).toBe("https://www.linkedin.com");
    expect(url.searchParams.get("state")).toBe("linkedin-state");
    expect(url.searchParams.get("scope")).toContain("openid");
  });

  it("builds a Google authorization URL with the expected state", () => {
    const url = new URL(buildGoogleAuthorizationUrl("google-state"));

    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("state")).toBe("google-state");
    expect(url.searchParams.get("scope")).toContain("gmail.send");
  });

  it("describes connected and disconnected states", () => {
    const disconnected = describeConnection(undefined, "LinkedIn", true);
    const connected = describeConnection(
      {
        id: "1",
        userId: "u1",
        provider: "GOOGLE",
        providerAccountId: "acct",
        email: "demo@example.com",
        displayName: "Demo User",
        profileUrl: null,
        accessToken: "token",
        refreshToken: "refresh",
        tokenExpiresAt: null,
        scope: "email",
        status: "CONNECTED",
        lastError: null,
        lastSyncedAt: null,
        metadataJson: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      "Gmail",
      true
    );

    expect(disconnected.status).toBe("DISCONNECTED");
    expect(connected.status).toBe("CONNECTED");
    expect(connected.detail).toBe("Demo User");
  });

  it("hashes oauth state deterministically", () => {
    expect(hashOAuthState("abc")).toBe(hashOAuthState("abc"));
    expect(hashOAuthState("abc")).not.toBe(hashOAuthState("xyz"));
  });
});

