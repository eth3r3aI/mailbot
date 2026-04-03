import type { OAuthConnection } from "@prisma/client";

export function describeConnection(
  connection: OAuthConnection | undefined,
  providerLabel: string,
  isConfigured: boolean
) {
  if (!isConfigured) {
    return {
      status: "ERROR" as const,
      detail: `${providerLabel} credentials are missing in the environment.`
    };
  }

  if (!connection) {
    return {
      status: "DISCONNECTED" as const,
      detail: `No ${providerLabel} account connected yet.`
    };
  }

  if (connection.status === "CONNECTED") {
    return {
      status: connection.status,
      detail:
        connection.displayName ??
        connection.email ??
        `Connected and ready for ${providerLabel} features.`
    };
  }

  if (connection.status === "ERROR") {
    return {
      status: connection.status,
      detail: connection.lastError ?? `${providerLabel} needs attention.`
    };
  }

  return {
    status: connection.status,
    detail: `No ${providerLabel} account connected yet.`
  };
}

