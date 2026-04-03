# Repo Structure

## Purpose

Mailbot is a Next.js App Router application for generating networking emails, reviewing them, and sending them through a connected Gmail account. The app also stores sender profile data, draft history, sent history, and a saved PDF resume that can be attached to emails by default.

## High-Level Architecture

- `app/`
  Next.js routes for pages and API endpoints.
- `components/`
  Reusable UI building blocks and client-side forms.
- `lib/`
  Server-side helpers for auth, Prisma, integrations, prompt generation, profile logic, and email sending.
- `prisma/`
  Database schema and migration history.
- `tests/`
  Vitest coverage for page rendering, route behavior, and helper logic.

## App Layer

### Top-level pages

- `app/page.tsx`
  Landing page.
- `app/login/page.tsx`
  Login and signup entry point.
- `app/dashboard/page.tsx`
  User guide dashboard that explains the normal workflow.
- `app/connections/page.tsx`
  Gmail connection management and account safety controls.
- `app/profile/page.tsx`
  Sender profile editor, resume upload, and autofill entry point.
- `app/compose/page.tsx`
  Draft generation, review, editing, and send flow.
- `app/sent/page.tsx`
  Sent email history.

### API routes

- `app/api/auth/*`
  Email/password auth: signup, login, logout.
- `app/api/account/route.ts`
  Account deletion.
- `app/api/profile/route.ts`
  Read and save profile data.
- `app/api/profile/autofill/route.ts`
  Extract text from uploaded docs and autofill profile fields through OpenAI.
- `app/api/profile/resume/route.ts`
  Save a PDF resume for default email attachments.
- `app/api/google/connect/route.ts`
  Start Gmail OAuth flow.
- `app/api/google/callback/route.ts`
  Complete Gmail OAuth flow and store tokens.
- `app/api/email/generate/route.ts`
  Generate a draft with OpenAI and persist it.
- `app/api/email/drafts/[draftId]/route.ts`
  Update or delete a saved draft.
- `app/api/email/send/route.ts`
  Send a draft through Gmail and optionally attach the stored resume.
- `app/api/connections/disconnect/route.ts`
  Disconnect the Gmail provider.
- `app/api/health/route.ts`
  Simple health check.

## Components

### Layout and shell

- `components/site-header.tsx`
  Global header, nav, current account state, and sign-out.
- `components/section-card.tsx`
  Shared content card wrapper.

### Auth and account

- `components/auth-form.tsx`
  Login/signup form.
- `components/logout-button.tsx`
  Sign-out button.
- `components/account-danger-zone.tsx`
  Account deletion UI.

### Connections

- `components/connect-button.tsx`
  Connect provider CTA.
- `components/disconnect-button.tsx`
  Disconnect provider CTA.

### Profile and compose

- `components/profile-form.tsx`
  Sender profile editing, PDF resume upload, and autofill upload.
- `components/compose-form.tsx`
  Draft generation form, draft editor, and send controls.

## Library Layer

### Core infrastructure

- `lib/prisma.ts`
  Shared Prisma client singleton.
- `lib/env.ts`
  Environment variable parsing and validation.
- `lib/current-user.ts`
  Thin re-export layer for current-user helpers.

### Authentication and security

- `lib/auth.ts`
  User signup/login, session creation, session lookup, and auth guards.
- `lib/crypto.ts`
  Password hashing, token hashing, and encryption helpers.
- `lib/oauth-connection-secrets.ts`
  Encrypt and decrypt stored provider tokens.
- `lib/audit.ts`
  Structured audit-event writes.
- `lib/rate-limit.ts`
  Audit-backed rate limiting for generation and send actions.

### Profile and drafting

- `lib/profile.ts`
  Profile read/write helpers and stored resume persistence.
- `lib/default-profile.ts`
  Default empty/fallback profile values.
- `lib/profile-autofill.ts`
  Document parsing and OpenAI profile autofill logic.
- `lib/email-generation.ts`
  Prompt shaping, validation, OpenAI generation, and recipient inference.

### Gmail and integrations

- `lib/gmail-send.ts`
  Gmail access token refresh, MIME building, attachment handling, and send request.
- `lib/integrations/google.ts`
  Google OAuth URLs, token exchange, token refresh, and profile fetch.
- `lib/integrations/linkedin.ts`
  LinkedIn OAuth helpers still present in the codebase even though LinkedIn is no longer shown in the product UI.
- `lib/integration-types.ts`
  Connection status display helpers.
- `lib/oauth-state.ts`
  OAuth state generation and hashing.

### Legacy / low-use helper

- `lib/navigation.ts`
  Primary navigation entries plus old phase-checklist data. The navigation entries are still used by the header, but the phase checklist constants are now mostly historical.

## Database Layer

### Prisma schema

- `prisma/schema.prisma`
  Source of truth for the database schema.

### Main models

- `User`
  Account identity, email, password hash.
- `Session`
  Server-side login sessions.
- `UserProfile`
  Sender profile data and stored resume fields.
- `OAuthConnection`
  Connected provider metadata and encrypted token storage.
- `EmailDraft`
  Generated and edited drafts.
- `SentEmail`
  Sent history.
- `AuditEvent`
  Structured audit log entries.

### Migrations

The `prisma/migrations/` folder contains the full migration history. These files are part of the repo's database setup and are not safe to delete casually, because new environments depend on them to reconstruct the schema correctly.

## Main User Flow

### 1. Authentication

- User signs up or logs in through `app/login/page.tsx`
- Session is created in `lib/auth.ts`
- Protected pages use `requireCurrentUser()`

### 2. Profile setup

- User edits profile in `components/profile-form.tsx`
- Profile saves through `app/api/profile/route.ts`
- Optional profile autofill runs through `app/api/profile/autofill/route.ts`
- Optional PDF resume storage runs through `app/api/profile/resume/route.ts`

### 3. Gmail connection

- User connects Gmail from `app/connections/page.tsx`
- OAuth runs through `app/api/google/connect/route.ts` and `app/api/google/callback/route.ts`
- Tokens are stored on `OAuthConnection`

### 4. Draft generation

- User fills inputs in `components/compose-form.tsx`
- Draft generation hits `app/api/email/generate/route.ts`
- Prompt construction and model call happen in `lib/email-generation.ts`
- Draft is stored in `EmailDraft`

### 5. Send workflow

- User loads or edits a draft in `components/compose-form.tsx`
- Send request hits `app/api/email/send/route.ts`
- Gmail send logic runs in `lib/gmail-send.ts`
- Stored resume can be attached by default
- Send history is persisted in `SentEmail`

## Testing Structure

- page tests
  Server-rendered page output and basic UI expectations.
- route tests
  API behavior, validation, and persistence flow mocks.
- helper tests
  Prompt helpers, OAuth helpers, MIME building, and document parsing.

The test suite uses:

- `vitest`
- `@testing-library/react`
- mocked `next/navigation` in `vitest.setup.ts`

## Current Cleanup Notes

- Prisma files were reviewed and left intact because the current `prisma/` folder only contains required schema and migration assets.
- LinkedIn server code still exists even though the UI no longer exposes LinkedIn as a user-facing connection option. If the product no longer needs LinkedIn at all, that would be a separate cleanup task across `app/api/linkedin`, `lib/integrations/linkedin.ts`, tests, env handling, and Prisma enum usage.
