# Email Outreach Web App Plan

## Overview

This project will be a simple multi-user web application that helps users:

1. Use a simple UI to manage their outreach workflow
2. Connect to LinkedIn APIs
3. Feed personal background information to an LLM
4. Auto-generate outreach emails
5. Send those emails through the Gmail API
6. Deploy the product as a hosted web app for other users

The current project directory is empty, so this plan assumes a greenfield implementation.

## Product Goal

Build a hosted SaaS web app where each user can:

- create an account
- connect LinkedIn
- connect Gmail
- provide personal background and business context
- generate personalized outreach emails with an LLM
- review and edit generated drafts
- send emails from their own Gmail account

## Success Criteria

The first version should satisfy these outcomes:

- A new user can onboard in less than 5 minutes
- The app can store enough user context to generate personalized emails
- Users can edit every generated email before sending
- Emails send successfully through the user’s Gmail account
- The app is deployable and usable by multiple independent users

## Important Feasibility Constraint

The biggest external dependency risk is LinkedIn API access. The safest version of this app should assume:

- LinkedIn can be used for OAuth login and basic identity/profile enrichment
- richer LinkedIn member data may require additional permissions, approval, or restricted products
- the core product must still work even if LinkedIn only provides limited profile data

Because of that, the product should not depend on deep LinkedIn profile extraction in order to function.

## Recommended Architecture

### Stack

Use a practical full-stack TypeScript web app:

- Frontend + backend: Next.js
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Authentication/session management: Auth.js or Clerk
- LLM integration: OpenAI Responses API
- Background jobs: optional for v1, add later if send/generation throughput grows
- Hosting: Vercel
- Database hosting: Neon, Supabase Postgres, or managed Postgres
- Monitoring: Sentry
- Product analytics: PostHog or Plausible

### Why this stack

- Fast to build as a greenfield app
- Easy OAuth integration
- One repo for frontend and backend
- Good deployment experience for a SaaS web app
- Strong ecosystem for auth, database, and API integrations

## Core User Flows

### 1. User Registration and Login

- User visits landing page
- User signs up with email/password or social login
- App creates a user account and session
- App redirects user to onboarding/dashboard

### 2. Connect LinkedIn

- User clicks "Connect LinkedIn"
- App starts LinkedIn OAuth flow
- User grants access
- App stores LinkedIn identity metadata and any permitted profile fields
- App shows connection success and prefilled profile fields where available

### 3. Connect Gmail

- User clicks "Connect Gmail"
- App starts Google OAuth flow with minimum required send scope
- User grants access
- App securely stores refresh/access credentials
- App verifies Gmail sending capability

### 4. Build Personal Background

- User completes a profile form with professional and outreach context
- App stores editable structured profile data
- App may prefill basic fields from LinkedIn where permitted
- User can refine, overwrite, or add more detail manually

### 5. Generate Email

- User enters recipient and campaign context
- App combines user profile + outreach context + prompt template
- LLM returns subject and email body
- App displays editable draft

### 6. Send Email

- User reviews and edits draft
- User clicks send
- App sends through Gmail API
- App stores message metadata and send status

## UI Plan

The first version should keep the interface intentionally small and obvious.

### Pages

- Landing page
- Login / signup page
- Dashboard
- Connections page
- Profile page
- Composer page
- Sent history page

### Landing Page

Purpose:
- explain value proposition
- direct users to sign up or sign in

Content:
- headline
- short feature explanation
- call-to-action button

### Dashboard

Purpose:
- give users a quick overview of setup and recent activity

Content:
- LinkedIn connection status
- Gmail connection status
- profile completion status
- recent drafts
- recent sent emails
- quick link to compose

### Connections Page

Purpose:
- manage integrations

Content:
- connect/disconnect LinkedIn
- connect/disconnect Gmail
- show account currently linked
- show integration errors if any

### Profile Page

Purpose:
- let the user define the personal context sent to the LLM

Fields:
- full name
- current title
- company
- short bio
- experience highlights
- expertise areas
- target audience
- tone preference
- preferred CTA style
- optional pasted resume/about text

### Composer Page

Purpose:
- generate and edit outreach drafts

Fields:
- recipient name
- recipient company
- recipient role
- outreach objective
- reason for reaching out
- product/service summary
- proof points
- call to action
- desired tone

Actions:
- generate draft
- regenerate
- edit subject
- edit body
- send email

### Sent History Page

Purpose:
- show previously sent emails and draft history

Content:
- recipient
- subject
- sent timestamp
- send status
- Gmail message ID

## Data Model Plan

Suggested primary entities:

- `users`
- `oauth_connections`
- `user_profiles`
- `linkedin_profiles`
- `gmail_connections`
- `email_drafts`
- `sent_emails`
- `audit_events`

### users

Stores:
- internal user ID
- email
- auth metadata
- created at / updated at

### oauth_connections

Stores:
- provider name
- provider user ID
- access token metadata
- refresh token metadata
- token expiry
- connection status

### user_profiles

Stores:
- full name
- title
- company
- short bio
- background summary
- experience highlights
- audience preferences
- tone preferences
- CTA preferences

### linkedin_profiles

Stores:
- LinkedIn member ID if available
- public profile URL if available
- headline if available
- avatar URL if available
- synced profile payload snapshot
- last sync timestamp

### gmail_connections

Stores:
- Gmail account email
- OAuth token references
- last successful send timestamp
- status

### email_drafts

Stores:
- draft ID
- user ID
- recipient metadata
- generation inputs
- subject
- body
- model used
- prompt version
- created timestamp

### sent_emails

Stores:
- sent email ID
- draft ID
- Gmail message ID
- send status
- error details if any
- sent timestamp

### audit_events

Stores:
- user ID
- event type
- event metadata
- timestamp

## Integration Plan

### LinkedIn Integration

Use LinkedIn only in ways supported by approved access.

Recommended v1 behavior:

- Use LinkedIn OAuth for login/identity connection
- Pull basic allowed profile information
- Prefill user profile where possible
- Store LinkedIn profile URL and profile metadata
- Ask user to fill missing professional details manually

Important design rule:

- Do not design the system assuming unrestricted access to employment history, network data, or arbitrary LinkedIn member information

### Gmail Integration

Use Gmail API to send mail from each user’s own account.

Recommended v1 behavior:

- Connect one Gmail account per user
- Request minimum required OAuth scopes
- Store encrypted token data
- Send emails only after explicit user action
- Persist send result and provider message ID

## LLM Plan

### LLM Input Strategy

The app should send structured user context into the model rather than relying on scraped profile text.

Input groups:

- sender profile
- outreach target details
- campaign objective
- tone and CTA preferences
- optional business proof points

### Prompt Design

Prompt structure should include:

- system instruction for safe business email generation
- sender background block
- outreach goal block
- recipient context block
- output format instructions

### Output Format

The LLM should return:

- subject line
- email body
- optional short version
- optional internal explanation/debug metadata

### Guardrails

- Do not hallucinate facts not provided
- Do not invent shared relationships or LinkedIn-specific knowledge
- Keep output concise and professional
- Require user review before sending
- Avoid spammy or deceptive wording

## Backend Service Plan

Organize backend responsibilities into these modules:

- authentication
- LinkedIn integration
- Google/Gmail integration
- profile management
- draft generation
- sending workflow
- logging/audit

### Suggested Internal Endpoints

- `POST /api/linkedin/connect`
- `GET /api/linkedin/callback`
- `POST /api/google/connect`
- `GET /api/google/callback`
- `GET /api/profile`
- `POST /api/profile`
- `POST /api/email/generate`
- `POST /api/email/send`
- `GET /api/email/history`

## Security and Compliance Plan

This project handles OAuth tokens, user profile data, and outbound email actions, so security needs to be part of the initial design.

### Required Controls

- Encrypt OAuth refresh tokens at rest
- Use least-privilege OAuth scopes
- Sanitize and validate all user input
- Add secure session handling
- Log key generation and send events
- Allow users to disconnect integrations
- Allow users to delete their data

### Abuse Prevention

To prevent the app from becoming a spam tool, v1 should include:

- manual user review before every send
- no bulk sends
- no autonomous email sending
- rate limits on generation and sending
- logging for suspicious activity

### Policy Boundary

The app should only use LinkedIn through officially permitted APIs and scopes. It should not rely on scraping or unauthorized access patterns.

## Deployment Plan

### Hosting Model

Deploy as a hosted multi-user SaaS web app.

Recommended setup:

- app hosted on Vercel
- Postgres hosted on a managed provider
- environment variables for secrets
- HTTPS on a custom domain
- separate dev, staging, and production environments

### Operational Additions

- Sentry for error tracking
- analytics for onboarding and usage
- health checks for OAuth and send flows
- backup strategy for database

## Phased Delivery Plan

### Phase 1: Foundation

- initialize Next.js project
- add TypeScript, Prisma, and Postgres
- set up auth
- create landing page, dashboard shell, and profile page

### Phase 2: Integrations

- add LinkedIn OAuth flow
- add Google OAuth flow
- connect Gmail send capability
- build integration status UI

### Phase 3: Email Generation

- design prompt templates
- create composer form
- add LLM-based draft generation
- allow review and editing

### Phase 4: Send Workflow and History

- add Gmail send action
- store send status and message metadata
- build sent history page
- handle token refresh and provider errors

### Phase 5: Production Hardening

- add monitoring and audit logging
- improve onboarding UX
- add rate limiting and abuse controls
- add account disconnect and data deletion flows

## Detailed Implementation Work Breakdown

### Workstream 1: App Foundation

- create project structure
- configure environment variables
- define database schema
- add migration flow
- create base layout and navigation

### Workstream 2: Authentication and User Management

- choose auth provider strategy
- implement user session handling
- create protected routes
- associate external integrations with internal users

### Workstream 3: LinkedIn Connection

- register LinkedIn app
- configure OAuth redirect URIs
- implement connect and callback flow
- store approved profile data
- prefill profile form where possible

### Workstream 4: Gmail Connection and Sending

- register Google Cloud app
- enable Gmail API
- configure OAuth consent screen
- implement Gmail OAuth
- store encrypted token data
- build message send utility

### Workstream 5: Profile and Prompt Context

- define editable user profile schema
- implement profile form and persistence
- define prompt input schema
- map stored user context into generation payload

### Workstream 6: Email Generation UX

- build composer UI
- validate recipient and campaign fields
- call LLM generation endpoint
- render and persist draft output
- support regenerate flow

### Workstream 7: Email Send UX

- add final review state
- trigger Gmail send action
- display success/failure feedback
- save send history

### Workstream 8: Production Readiness

- add logging and metrics
- add rate limiting
- add security reviews for tokens and sessions
- add account deletion and disconnect flows

## Testing Plan

### Functional Tests

- user signup and login
- LinkedIn connect success path
- LinkedIn connect failure path
- Gmail connect success path
- Gmail connect failure path
- profile save and update
- email generation success path
- send email success path

### Edge Cases

- LinkedIn returns only minimal profile data
- Gmail token expires or is revoked
- user attempts send without Gmail connected
- user attempts generation without required profile fields
- LLM returns malformed output
- duplicate send clicks

### Security and Reliability Tests

- token encryption behavior
- access control for protected pages and endpoints
- rate limit enforcement
- safe error handling without leaking secrets
- audit event recording

## Recommended v1 Scope

Keep the first release intentionally limited:

- one user account per person
- one Gmail sender account per user
- one-email-at-a-time sending
- manual draft review before send
- no bulk campaign engine
- no inbox sync
- no CRM features
- no autonomous follow-up engine

## Risks

### Primary Risk

LinkedIn data availability may be more limited than desired for auto-populating user background.

Mitigation:

- make manual profile entry the primary source of truth
- treat LinkedIn enrichment as optional enhancement

### Secondary Risk

OAuth and email-sending flows add security and compliance complexity.

Mitigation:

- use standard OAuth libraries
- use least-privilege scopes
- encrypt token storage
- require explicit user send action

### Product Risk

Auto-generated emails may feel generic if user context is too shallow.

Mitigation:

- collect structured user background fields
- allow editing and regeneration
- support prompt tuning over time

## Recommended Next Planning Artifacts

After this plan, the next useful documents would be:

- a folder structure plan
- a database schema spec
- a page-by-page UX wireframe/spec
- an API contract spec
- a milestone timeline by week

## Source References

- LinkedIn consumer developer docs: https://learn.microsoft.com/en-us/linkedin/consumer/
- LinkedIn authentication/access overview: https://learn.microsoft.com/sr-latn-rs/linkedin/shared/authentication/getting-access
- Gmail API sending guide: https://developers.google.com/workspace/gmail/api/guides/sending
- Gmail API scopes: https://developers.google.com/workspace/gmail/api/auth/scopes
