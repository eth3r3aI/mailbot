import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/mailbot";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
process.env.AUTH_SECRET ??= "test-auth-secret-123456789012345678901234";
process.env.SESSION_COOKIE_NAME ??= "mailbot_session";
process.env.TOKEN_ENCRYPTION_KEY ??= "test-token-encryption-key-123456789012";
process.env.OPENAI_API_KEY ??= "test-openai-key";
process.env.OPENAI_MODEL ??= "gpt-4.1-mini";
process.env.LINKEDIN_CLIENT_ID ??= "linkedin-client";
process.env.LINKEDIN_CLIENT_SECRET ??= "linkedin-secret";
process.env.LINKEDIN_REDIRECT_URI ??= "http://localhost:3000/api/linkedin/callback";
process.env.GOOGLE_CLIENT_ID ??= "google-client";
process.env.GOOGLE_CLIENT_SECRET ??= "google-secret";
process.env.GOOGLE_REDIRECT_URI ??= "http://localhost:3000/api/google/callback";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn()
  })
}));
