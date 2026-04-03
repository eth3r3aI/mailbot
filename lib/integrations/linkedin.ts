import type { OAuthProvider } from "@prisma/client";
import { env } from "@/lib/env";

export const linkedinProvider: OAuthProvider = "LINKEDIN";
export const linkedinScopes = ["openid", "profile", "email"];

export function isLinkedInConfigured() {
  return Boolean(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET);
}

export function buildLinkedInAuthorizationUrl(state: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.LINKEDIN_CLIENT_ID,
    redirect_uri: env.LINKEDIN_REDIRECT_URI,
    scope: linkedinScopes.join(" "),
    state
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

type LinkedInTokenResponse = {
  access_token: string;
  expires_in: number;
  scope?: string;
};

type LinkedInUserInfo = {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
};

export async function exchangeLinkedInCode(code: string) {
  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: env.LINKEDIN_CLIENT_ID,
      client_secret: env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: env.LINKEDIN_REDIRECT_URI
    })
  });

  if (!response.ok) {
    throw new Error(`LinkedIn token exchange failed with ${response.status}`);
  }

  return (await response.json()) as LinkedInTokenResponse;
}

export async function fetchLinkedInUserInfo(accessToken: string) {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`LinkedIn user info fetch failed with ${response.status}`);
  }

  return (await response.json()) as LinkedInUserInfo;
}

