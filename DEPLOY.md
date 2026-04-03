# Deploy Mailbot

This guide walks you through the simplest production setup for this app:

- Vercel for the Next.js app
- Neon for the Postgres database

That is the lowest-friction option for this repo and is the easiest way to get a public URL that other people can use.

## Overview

You will do these steps:

1. Push the project to GitHub.
2. Create a hosted Postgres database in Neon.
3. Create a Vercel project from the GitHub repo.
4. Add the production environment variables.
5. Deploy.
6. Test the live site.
7. Optionally enable OpenAI, Google, and LinkedIn integrations.

## Before You Start

Make sure you have:

- a GitHub account
- a Vercel account
- a Neon account
- this project committed locally

## 1. Push The Repo To GitHub

If this repo is not on GitHub yet, run these commands from the project folder:

```powershell
git init
git add .
git commit -m "Initial deployable version"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mailbot.git
git push -u origin main
```

If the repo already exists on GitHub, just commit and push your latest changes.

## 2. Create The Database In Neon

1. Go to `https://neon.tech`
2. Create a new project
3. Create a Postgres database if Neon does not do it automatically
4. Copy the connection string

It will look roughly like this:

```env
postgresql://user:password@host/dbname?sslmode=require
```

You will use that value as `DATABASE_URL` in Vercel.

## 3. Create The Vercel Project

1. Go to `https://vercel.com`
2. Click `Add New`
3. Click `Project`
4. Import your GitHub repository
5. Let Vercel detect the framework as Next.js

This repo already includes [`vercel.json`](./vercel.json), so Vercel will use the production build command automatically.

## 4. Add Production Environment Variables

In Vercel:

1. Open the project
2. Go to `Settings`
3. Go to `Environment Variables`

Add these required values first:

```env
DATABASE_URL=your_neon_connection_string
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
AUTH_SECRET=some-long-random-string-at-least-32-characters
SESSION_COOKIE_NAME=mailbot_session
TOKEN_ENCRYPTION_KEY=another-long-random-string-at-least-32-characters
LINKEDIN_REDIRECT_URI=https://your-app-name.vercel.app/api/linkedin/callback
GOOGLE_REDIRECT_URI=https://your-app-name.vercel.app/api/google/callback
```

### Generate The Secrets

You can generate secure random values in PowerShell with:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { [byte]$_ }))
```

Run it twice:

- once for `AUTH_SECRET`
- once for `TOKEN_ENCRYPTION_KEY`

### Optional Variables For AI Features

If you want email generation and profile autofill enabled immediately, add:

```env
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_PROFILE_MODEL=gpt-4.1-mini
```

If you leave `OPENAI_API_KEY` empty, the app can still deploy, but generation and autofill will not work.

### Optional Variables For Gmail Sending

Add these only if you want Gmail sending enabled now:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Optional Variables For LinkedIn Connection

Add these only if you want LinkedIn connection enabled now:

```env
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
```

## 5. Deploy

After the environment variables are saved, trigger the deployment in Vercel.

This repo is configured to run:

```bash
npm run build:deploy
```

That script is defined in [`package.json`](./package.json) and runs:

```bash
prisma generate && prisma migrate deploy && next build
```

That means:

- Prisma client is generated during deployment
- production database migrations are applied
- the Next.js app is built

## 6. Open The Live Site

When deployment finishes, Vercel will give you a public URL such as:

```text
https://your-app-name.vercel.app
```

Open it and test the app.

Recommended first checks:

1. Create a user account
2. Log in
3. Open `/dashboard`
4. Open `/profile`
5. Save profile data

If you enabled OpenAI:

1. Go to `/compose`
2. Generate a draft

## 7. Minimum Viable First Launch

If you want the easiest possible first deployment, start with only:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `SESSION_COOKIE_NAME`
- `TOKEN_ENCRYPTION_KEY`
- optional `OPENAI_API_KEY`

That is enough to get the app live with user accounts and the core web experience.

You can leave Google and LinkedIn client IDs and secrets empty until you are ready to enable those features.

## 8. Add Google And LinkedIn Later

If you decide to enable provider integrations later, update your OAuth app settings to use your production callbacks:

- `https://your-app-name.vercel.app/api/google/callback`
- `https://your-app-name.vercel.app/api/linkedin/callback`

Then add the matching client ID and client secret values in Vercel.

If you later switch to a custom domain, update these environment variables too:

- `NEXT_PUBLIC_APP_URL`
- `GOOGLE_REDIRECT_URI`
- `LINKEDIN_REDIRECT_URI`

## Common Gotchas

- `GOOGLE_REDIRECT_URI` and `LINKEDIN_REDIRECT_URI` must still be valid URLs because the environment schema validates them during startup.
- Use your production site URL, not `localhost`, in all production redirect variables.
- `prisma migrate deploy` is the correct Prisma command for production. Do not use `prisma migrate dev` in Vercel.
- If you add a custom domain later, update the app URL and redirect URLs so sign-in and OAuth flows keep working.

## Quick Copy-Paste Environment Template

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
AUTH_SECRET=replace-with-long-random-string
SESSION_COOKIE_NAME=mailbot_session
TOKEN_ENCRYPTION_KEY=replace-with-second-long-random-string
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_PROFILE_MODEL=gpt-4.1-mini
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=https://your-app-name.vercel.app/api/linkedin/callback
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://your-app-name.vercel.app/api/google/callback
```

## After Deployment

Once the first deploy succeeds, anyone with the public URL can use the app on the web.
