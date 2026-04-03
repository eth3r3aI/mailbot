import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUserForApi } from "@/lib/auth";
import { env } from "@/lib/env";
import { buildGoogleAuthorizationUrl, isGoogleConfigured } from "@/lib/integrations/google";
import { createOAuthState, hashOAuthState } from "@/lib/oauth-state";

export async function GET() {
  const user = await getCurrentUserForApi();

  if (!user) {
    return NextResponse.redirect(new URL("/login", env.NEXT_PUBLIC_APP_URL));
  }

  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: "Google credentials are not configured." },
      { status: 500 }
    );
  }

  const state = createOAuthState();
  const cookieStore = await cookies();
  cookieStore.set("mailbot_google_state", hashOAuthState(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  });

  return NextResponse.redirect(buildGoogleAuthorizationUrl(state));
}
