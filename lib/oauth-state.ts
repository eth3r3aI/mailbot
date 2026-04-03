import { createHash, randomBytes } from "crypto";

const OAUTH_STATE_SALT = "mailbot-phase-two";

export function createOAuthState() {
  return randomBytes(24).toString("hex");
}

export function hashOAuthState(state: string) {
  return createHash("sha256")
    .update(`${state}:${OAUTH_STATE_SALT}`)
    .digest("hex");
}
