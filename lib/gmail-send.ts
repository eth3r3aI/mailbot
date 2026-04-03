import { ConnectionStatus } from "@prisma/client";
import { googleProvider, refreshGoogleAccessToken } from "@/lib/integrations/google";
import {
  getDecryptedAccessToken,
  getDecryptedRefreshToken,
  setEncryptedTokens
} from "@/lib/oauth-connection-secrets";
import { prisma } from "@/lib/prisma";

export function buildMimeEmail(args: {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachment?: {
    fileName: string;
    mimeType: string;
    dataBase64: string;
  } | null;
}) {
  if (!args.attachment) {
    return [
      `From: ${args.from}`,
      `To: ${args.to}`,
      `Subject: ${args.subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      args.body
    ].join("\r\n");
  }

  const boundary = `mailbot-boundary-${Date.now()}`;

  return [
    `From: ${args.from}`,
    `To: ${args.to}`,
    `Subject: ${args.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    args.body,
    "",
    `--${boundary}`,
    `Content-Type: ${args.attachment.mimeType}; name="${args.attachment.fileName}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${args.attachment.fileName}"`,
    "",
    args.attachment.dataBase64.match(/.{1,76}/g)?.join("\r\n") ?? args.attachment.dataBase64,
    "",
    `--${boundary}--`
  ].join("\r\n");
}

export function encodeBase64Url(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getGoogleConnection(userId: string) {
  const connection = await prisma.oAuthConnection.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: googleProvider
      }
    }
  });

  return { connection };
}

export async function getAuthorizedGoogleAccessToken(userId: string) {
  const { connection } = await getGoogleConnection(userId);

  if (!connection || connection.status !== ConnectionStatus.CONNECTED) {
    throw new Error("Gmail is not connected for the current user.");
  }

  const currentAccessToken = getDecryptedAccessToken(connection);
  const currentRefreshToken = getDecryptedRefreshToken(connection);

  if (connection.tokenExpiresAt && connection.tokenExpiresAt.getTime() > Date.now() + 60_000) {
    if (!currentAccessToken) {
      throw new Error("Connected Gmail account is missing an access token.");
    }

    return {
      accessToken: currentAccessToken,
      fromEmail: connection.email ?? ""
    };
  }

  if (!currentRefreshToken) {
    if (!currentAccessToken) {
      throw new Error("Connected Gmail account cannot refresh or send mail.");
    }

    return {
      accessToken: currentAccessToken,
      fromEmail: connection.email ?? ""
    };
  }

  const refreshed = await refreshGoogleAccessToken(currentRefreshToken);
  const tokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

  await prisma.oAuthConnection.update({
    where: {
      userId_provider: {
        userId: connection.userId,
        provider: googleProvider
      }
    },
    data: {
      ...setEncryptedTokens({
        accessToken: refreshed.access_token,
        refreshToken: currentRefreshToken
      }),
      tokenExpiresAt,
      scope: refreshed.scope ?? connection.scope,
      status: ConnectionStatus.CONNECTED,
      lastError: null,
      lastSyncedAt: new Date()
    }
  });

  return {
    accessToken: refreshed.access_token,
    fromEmail: connection.email ?? ""
  };
}

export async function sendDraftViaGmail(args: {
  userId: string;
  to: string;
  subject: string;
  body: string;
  attachment?: {
    fileName: string;
    mimeType: string;
    dataBase64: string;
  } | null;
}) {
  const { accessToken, fromEmail } = await getAuthorizedGoogleAccessToken(args.userId);

  if (!fromEmail) {
    throw new Error("Connected Gmail account is missing a sender email.");
  }

  const mime = buildMimeEmail({
    from: fromEmail,
    to: args.to,
    subject: args.subject,
    body: args.body,
    attachment: args.attachment ?? null
  });

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      raw: encodeBase64Url(mime)
    })
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        id?: string;
        error?: {
          message?: string;
        };
      }
    | null;

  if (!response.ok || !payload?.id) {
    throw new Error(payload?.error?.message ?? `Gmail send failed with ${response.status}.`);
  }

  return {
    gmailMessageId: payload.id,
    fromEmail
  };
}
