# Phase 3 Plan

## Goal

Phase 3 adds the first usable drafting workflow to the app. It turns the current scaffold and integration layer into a product slice where a user can save their sender profile, open a composer, generate an outreach draft with an LLM, review the result, and persist the generated draft for later use.

## Product outcomes

By the end of Phase 3, the app should let a user:

- maintain a saved sender profile
- open a composer page
- enter recipient and outreach context
- generate an email subject and body with OpenAI
- review the generated output in the UI
- persist the generated draft in the database

## Scope for this phase

### Included

- profile read and save API
- profile editor wired to real persistence
- compose page and generation form
- prompt-building helpers
- OpenAI generation route
- draft persistence using the existing `EmailDraft` model
- dashboard updates that show Phase 3 progress
- tests for Phase 3 prompt and route behavior

### Not included

- Gmail send action
- bulk generation
- send scheduling
- real account auth
- advanced prompt versioning UI
- draft history detail page

## Implementation plan

### 1. Profile persistence

- replace the static profile page shell with a real editable form
- load the current demo user and current profile on the server
- seed blank fields from the example profile so the app has useful starter content
- add `GET /api/profile` and `POST /api/profile`
- store profile fields in `UserProfile`
- update `User.fullName` when the profile full name changes

### 2. Composer experience

- add a new `/compose` page
- show a form for recipient and campaign inputs
- show basic profile readiness indicators
- show generated output inline after submission
- keep the result editable in the UI after generation
- show recent generated drafts for quick inspection

### 3. Prompt construction

- define a validated request shape for email generation
- map sender profile + recipient info + campaign intent into a structured prompt payload
- include guardrails that prevent invented facts and overly aggressive wording
- require JSON-only output with:
  - `subject`
  - `body`
  - `variantShort`

### 4. OpenAI integration

- add `OPENAI_MODEL` environment support
- create a generation helper that calls the OpenAI Responses API
- parse assistant text safely into the expected JSON structure
- return friendly errors when the API key is missing, the model response is malformed, or generation fails

### 5. Draft persistence

- save every successful generation into `EmailDraft`
- persist:
  - recipient details
  - objective
  - prompt input snapshot
  - generated subject and body
  - model name
  - prompt version
- expose recent drafts on the composer page for visibility

### 6. Verification

- update page tests for async server rendering where needed
- add tests for prompt helper behavior
- add tests for profile route persistence behavior
- add tests for generation parsing behavior

## Acceptance criteria

- visiting `/profile` shows a real saved profile form
- saving the profile updates the database for the current demo user
- visiting `/compose` shows a working draft composer
- valid generation input calls the OpenAI-backed route and returns subject/body text
- successful generation creates an `EmailDraft` row
- missing `OPENAI_API_KEY` results in a clear UI-safe error, not a crash

## Assumptions

- the app still uses the Phase 2 demo-user approach until real auth is added
- the existing `EmailDraft` model is sufficient for this phase
- generated drafts remain review-only and are not yet sendable
