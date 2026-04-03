import type { OAuthConnection } from "@prisma/client";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

export function setEncryptedTokens(args: {
  accessToken?: string | null;
  refreshToken?: string | null;
}) {
  return {
    accessToken: null,
    refreshToken: null,
    accessTokenCiphertext: args.accessToken ? encryptSecret(args.accessToken) : null,
    refreshTokenCiphertext: args.refreshToken ? encryptSecret(args.refreshToken) : null
  };
}

export function getDecryptedAccessToken(connection: OAuthConnection) {
  if (connection.accessTokenCiphertext) {
    return decryptSecret(connection.accessTokenCiphertext);
  }

  return connection.accessToken;
}

export function getDecryptedRefreshToken(connection: OAuthConnection) {
  if (connection.refreshTokenCiphertext) {
    return decryptSecret(connection.refreshTokenCiphertext);
  }

  return connection.refreshToken;
}
