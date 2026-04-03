# Mailbot

Mailbot is a multi-user outreach web app that can now:

- connect LinkedIn
- collect sender context
- generate personalized emails with an LLM
- send those emails through Gmail
- authenticate real users with isolated account data

## Included in Phase 1

- Next.js App Router scaffold
- TypeScript project configuration
- Prisma schema for the initial product entities
- environment variable template
- shared UI shell and styling
- landing page
- dashboard page
- profile page
- health check endpoint
- Vitest smoke tests for the initial routes and pages
- example sender profile data in `examples/example-profile.json`

## Included in Phase 2

- LinkedIn OAuth start and callback routes
- Google OAuth start and callback routes
- Prisma-backed provider connection state
- connections management page
- disconnect action for provider accounts
- temporary demo-user resolver until full authentication is added

## Included in Phase 3

- persisted profile read and save routes
- compose page for draft generation
- prompt-building and OpenAI generation helpers
- email draft persistence via the existing `EmailDraft` table
- recent-draft display in the compose experience
- profile autofill from uploaded PDF or Word documents
- education summary field in the saved sender profile
- alumni-aware generation preference when sender and target education context overlap
- load, edit, and delete interactions for saved drafts

## Included in Phase 4

- Gmail token refresh and send helpers
- reviewed-draft send route
- sent history page
- compose send action for loaded/generated drafts

## Included in Phase 5

- email/password authentication with server-side sessions
- protected app pages and API routes
- encrypted OAuth token storage
- audit-event foundation for auth, draft, and provider activity
- generation and send rate limiting
- duplicate-send protection
- account deletion flow

## Local setup

1. Install Node.js 20 or newer.
2. Install dependencies:

```bash
npm install
```

3. Copy the environment template:

```bash
cp .env.example .env
```

4. Update `DATABASE_URL`, auth secrets, encryption key, and provider credentials.
5. Generate the Prisma client:

```bash
npm run prisma:generate
```

6. Run the initial migration:

```bash
npm run prisma:migrate
```

If you already ran Phase 1 locally, make sure you apply the new Phase 2 migration as well before testing OAuth routes.

7. Start the app:

```bash
npm run dev
```

## Deployment

For the lowest-friction production setup, deploy the app to Vercel and use Neon for Postgres.

- Add production env vars from [`.env.example`](./.env.example)
- Set `NEXT_PUBLIC_APP_URL` to your public app URL
- Use production callback URLs for `GOOGLE_REDIRECT_URI` and `LINKEDIN_REDIRECT_URI`
- The repo includes [`vercel.json`](./vercel.json), which runs `npm run build:deploy`

See [`DEPLOY.md`](./DEPLOY.md) for the full step-by-step guide.

## Tests

Run the lightweight smoke test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

The tests currently verify:

- the health endpoint payload
- the landing page headline and navigation actions
- the dashboard checklist content
- the profile editor shell and default example values
- OAuth URL builders and connection state helpers

## Routes

- `/`
- `/dashboard`
- `/connections`
- `/compose`
- `/profile`
- `/api/health`
- `/api/profile`
- `/api/profile/autofill`
- `/api/email/generate`
- `/api/email/drafts/[draftId]`
- `/api/email/send`
- `/api/linkedin/connect`
- `/api/linkedin/callback`
- `/api/google/connect`
- `/api/google/callback`

## Notes

- Authentication is now required for app pages and user-owned API routes.
- Set strong production values for `AUTH_SECRET` and `TOKEN_ENCRYPTION_KEY` before deployment.
- OpenAI generation is wired through the Responses API and requires `OPENAI_API_KEY`.
- profile autofill also uses OpenAI and supports `.pdf`, `.doc`, and `.docx`
- PDF autofill text extraction now uses `pdfjs-dist` directly in the server route
- Gmail sending is wired for connected Google accounts with the `gmail.send` scope.
- LinkedIn callbacks now store the provider subject ID but intentionally do not fabricate a public profile URL.
- This machine did not have Node.js installed during scaffolding, so dependency installation and runtime verification still need to be run locally once Node is available.
