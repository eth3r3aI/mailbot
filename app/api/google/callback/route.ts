import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ConnectionStatus } from "@prisma/client";
import { createAuditEvent } from "@/lib/audit";
import { getCurrentUserForApi } from "@/lib/auth";
import {
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  googleProvider
} from "@/lib/integrations/google";
import { setEncryptedTokens } from "@/lib/oauth-connection-secrets";
import { hashOAuthState } from "@/lib/oauth-state";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieStore = await cookies();
  const storedState = cookieStore.get("mailbot_google_state")?.value;

  if (error) {
    return NextResponse.redirect(
      new URL(`/connections?provider=google&error=${encodeURIComponent(error)}`, url)
    );
  }

  if (!code || !state || !storedState || hashOAuthState(state) !== storedState) {
    return NextResponse.redirect(
      new URL("/connections?provider=google&error=invalid_state", url)
    );
  }

  try {
    const user = await getCurrentUserForApi();

    if (!user) {
      return NextResponse.redirect(new URL("/login", url));
    }

    const token = await exchangeGoogleCode(code);
    const profile = await fetchGoogleUserInfo(token.access_token);

    await prisma.oAuthConnection.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: googleProvider
        }
      },
      update: {
        providerAccountId: profile.sub ?? null,
        email: profile.email ?? user.email,
        displayName: profile.name ?? user.fullName,
        profileUrl: null,
        ...setEncryptedTokens({
          accessToken: token.access_token,
          refreshToken: token.refresh_token ?? null
        }),
        tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
        scope: token.scope ?? null,
        status: ConnectionStatus.CONNECTED,
        lastError: null,
        lastSyncedAt: new Date(),
        metadataJson: JSON.stringify(profile)
      },
      create: {
        userId: user.id,
        provider: googleProvider,
        providerAccountId: profile.sub ?? null,
        email: profile.email ?? user.email,
        displayName: profile.name ?? user.fullName,
        profileUrl: null,
        ...setEncryptedTokens({
          accessToken: token.access_token,
          refreshToken: token.refresh_token ?? null
        }),
        tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
        scope: token.scope ?? null,
        status: ConnectionStatus.CONNECTED,
        lastSyncedAt: new Date(),
        metadataJson: JSON.stringify(profile)
      }
    });

    await createAuditEvent({
      userId: user.id,
      eventType: "oauth.connect",
      metadata: {
        provider: "GOOGLE",
        email: profile.email ?? user.email
      }
    });

    cookieStore.delete("mailbot_google_state");
    return NextResponse.redirect(new URL("/connections?provider=google&success=1", url));
  } catch (caughtError) {
    const user = await getCurrentUserForApi();
    const message = caughtError instanceof Error ? caughtError.message : "Google connection failed.";

    if (user) {
      await prisma.oAuthConnection.upsert({
        where: {
          userId_provider: {
            userId: user.id,
            provider: googleProvider
          }
        },
        update: {
          status: ConnectionStatus.ERROR,
          lastError: message
        },
        create: {
          userId: user.id,
          provider: googleProvider,
          status: ConnectionStatus.ERROR,
          lastError: message
        }
      });

      await createAuditEvent({
        userId: user.id,
        eventType: "oauth.connect_error",
        metadata: {
          provider: "GOOGLE"
        }
      });
    }

    return NextResponse.redirect(
      new URL(`/connections?provider=google&error=${encodeURIComponent(message)}`, url)
    );
  }
}
