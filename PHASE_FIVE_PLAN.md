# Phase 5 Plan: Production Hardening

## Goal

Phase 5 should turn Mailbot from a working single-demo-user prototype into a production-ready multi-user SaaS application. The focus is not adding a new core workflow. The focus is making the existing profile, draft, send, and history flows safe and reliable for real users.

## Starting Point

Based on `PHASES_DONE.md` and the current codebase, the app already has:

- Next.js + Prisma + Postgres foundation
- LinkedIn and Google OAuth connection routes
- profile save and autofill workflow
- OpenAI draft generation
- Gmail send flow
- sent email history
- test and build coverage for the current implementation

The biggest current gap is that the app still runs through a temporary demo-user resolver in `lib/current-user.ts`. That means Phase 5 should begin by replacing the demo-user model with real authentication and then hardening the rest of the stack around that.

## Phase 5 Outcome

When Phase 5 is complete, a real user should be able to:

- sign up and sign in securely
- keep their own isolated profile, drafts, connections, and sent history
- connect provider accounts without exposing reusable secrets
- recover gracefully from provider, token, or API failures
- disconnect integrations and delete their account data
- use the app under reasonable anti-abuse controls
- run in production with monitoring, audit visibility, and deployment guidance

## Recommended Workstreams

### 1. Real Authentication and Session Handling

Replace demo-user mode with a real auth system before touching the rest of the hardening work.

#### Deliverables

- add Auth.js or Clerk
- support email-based authentication at minimum
- create authenticated user/session resolution utilities
- protect app pages and API routes that currently assume a demo user
- update `lib/current-user.ts` to resolve the signed-in user instead of upserting a shared account
- create login, signup, signout, and unauthorized states

#### Code areas

- `lib/current-user.ts`
- `app/*` protected pages
- `app/api/*` routes that read or write user-owned data
- Prisma schema if auth tables are added

#### Acceptance criteria

- every profile, draft, send, and connection action is tied to the signed-in user
- no shared fallback demo account is used in normal app flow
- unauthenticated requests are redirected or rejected consistently

### 2. Token Security and Secret Handling

Once users are real, provider credentials need stronger protection.

#### Deliverables

- encrypt OAuth refresh tokens and other long-lived secrets at rest
- centralize token read/write helpers instead of storing plain values directly in route handlers
- add environment validation for encryption keys and auth secrets
- minimize logged error details so tokens and provider payloads never leak
- review Google and LinkedIn scopes for least privilege

#### Code areas

- `prisma/schema.prisma`
- Google and LinkedIn callback routes
- Gmail send helpers
- env parsing and validation utilities

#### Acceptance criteria

- refresh tokens are not stored in plaintext
- app startup fails clearly when required secrets are missing
- provider errors are sanitized before display or logging

### 3. Access Control and Multi-User Safety Review

Every route should be reviewed as if multiple unrelated users are now using the same deployment.

#### Deliverables

- audit all API routes for user ownership checks
- confirm draft load, update, delete, and send routes only operate on owned records
- confirm sent-history and connection pages only surface the current user's data
- add regression tests for cross-user access attempts

#### Priority routes

- `app/api/profile/route.ts`
- `app/api/profile/autofill/route.ts`
- `app/api/email/generate/route.ts`
- `app/api/email/drafts/[draftId]/route.ts`
- `app/api/email/send/route.ts`
- OAuth callback and disconnect routes

#### Acceptance criteria

- a user cannot read, mutate, send, or disconnect another user's resources
- test coverage includes unauthorized and cross-user cases

### 4. Error Handling and Onboarding UX

The current app works, but production use needs clearer user guidance and clearer failure recovery.

#### Deliverables

- add user-visible error states for OAuth failure, revoked tokens, Gmail send failure, and OpenAI failure
- improve connection success and failure feedback on the connections page
- add onboarding guidance for first-time users: connect Gmail, complete profile, generate draft, send test message
- show actionable setup hints when env or provider configuration is incomplete
- prevent dead-end states when required prerequisites are missing

#### UI targets

- dashboard
- connections page
- compose page
- sent history page

#### Acceptance criteria

- a first-time user can understand the required setup sequence without reading the codebase
- provider and model failures explain the next action instead of only showing raw errors

### 5. Rate Limiting and Anti-Abuse Controls

Mailbot already generates and sends email, so this phase needs guardrails before production exposure.

#### Deliverables

- add per-user rate limits for generation and send endpoints
- add duplicate-send protection for rapid repeated clicks
- log suspicious patterns such as repeated failures or burst activity
- keep single-email explicit-send behavior as a product boundary

#### Suggested scope

- generation limit per minute and per hour
- send limit per minute and per day
- idempotency or request-state protection on send

#### Acceptance criteria

- repeated requests are throttled with clear user feedback
- the send route resists accidental double submission

### 6. Audit Logging, Monitoring, and Operational Visibility

Production hardening should make failures diagnosable without manually reproducing them.

#### Deliverables

- add `AuditEvent` persistence or equivalent structured audit logging
- record key events: signup, signin, provider connect, provider disconnect, draft generation, send success, send failure, account deletion
- integrate error monitoring such as Sentry
- add request correlation or event metadata where practical
- create a minimal admin/debugging story through logs and audit records

#### Schema/API work

- add an audit table in Prisma
- create helper functions for structured audit writes

#### Acceptance criteria

- critical user and provider actions leave an audit trail
- unexpected errors are captured in monitoring with enough context to diagnose safely

### 7. Disconnect and Data Deletion Flows

Users need a complete path to remove access and remove their data.

#### Deliverables

- improve disconnect flow to revoke or forget tokens cleanly where possible
- add account deletion flow for the signed-in user
- delete or cascade-delete owned profile, drafts, sent emails, and connections
- warn users clearly before destructive actions
- add tests for disconnect and account deletion behavior

#### Acceptance criteria

- a user can disconnect providers without leaving the UI in an inconsistent state
- a user can delete their account and owned data in one supported flow

### 8. Deployment and Production Readiness

Finish by making the repo ready for hosted deployment and handoff.

#### Deliverables

- document required production environment variables
- document auth provider setup, OAuth redirect URIs, and deployment steps
- document database migration and seed expectations
- verify production build and smoke-test flows against a staging-like environment
- add health and readiness notes for hosted operation

#### Acceptance criteria

- a new maintainer can deploy the app without reverse-engineering local-only assumptions
- production configuration is explicit and documented

## Recommended Execution Order

### Milestone A: Identity Foundation

- add auth
- remove demo-user dependency
- protect routes and pages

### Milestone B: Data and Secret Hardening

- encrypt tokens
- add env and secret validation
- complete access-control review

### Milestone C: Safer User Experience

- improve onboarding
- improve error handling
- add duplicate-send protection and rate limits

### Milestone D: Production Operations

- add audit logging
- add monitoring
- add disconnect and account deletion
- finalize deployment docs

## Suggested Schema Changes

These are the most likely Prisma additions for Phase 5:

- auth-related tables if Auth.js is used
- encrypted token fields or token-ciphertext replacements in `OAuthConnection`
- `AuditEvent` model
- optional deletion timestamps or soft-delete support if desired

## Testing Plan for Phase 5

Add or expand tests for:

- signup, signin, signout
- route protection for anonymous users
- cross-user authorization failures
- encrypted token persistence helpers
- OAuth callback failure states
- Gmail send with expired or revoked tokens
- generation and send rate limiting
- duplicate-send prevention
- disconnect flow
- account deletion flow

## Definition of Done

Phase 5 should be considered complete when:

- the app no longer depends on a shared demo user
- real users can authenticate and keep isolated data
- OAuth tokens are handled securely
- critical routes enforce ownership and abuse controls
- onboarding and failure states are understandable in the UI
- users can disconnect providers and delete their account
- audit logging and monitoring are in place
- production setup is documented and verified

## Practical First Task

The best first implementation step is:

1. add real authentication
2. replace `getOrCreateCurrentUser()` with authenticated user resolution
3. update all protected pages and API routes to require a session

That change unlocks the rest of Phase 5 and prevents later hardening work from being built on top of the current shared-user shortcut.
