import type { Route } from "next";

export const primaryNavigation = [
  {
    href: "/dashboard" as Route,
    label: "Dashboard",
    description: "Track setup progress and recent activity."
  },
  {
    href: "/connections" as Route,
    label: "Connections",
    description: "Manage LinkedIn and Gmail provider accounts."
  },
  {
    href: "/profile" as Route,
    label: "Profile",
    description: "Capture the sender background used for generation."
  },
  {
    href: "/compose" as Route,
    label: "Compose",
    description: "Generate and review outreach drafts."
  },
  {
    href: "/sent" as Route,
    label: "Sent",
    description: "Review sent Gmail history."
  }
];

export const phaseOneChecklist = [
  "Scaffold a Next.js + TypeScript application shell",
  "Define the initial Prisma models for users, profiles, and drafts",
  "Prepare environment configuration for LinkedIn, Gmail, and OpenAI",
  "Create the first landing, dashboard, and profile screens"
];

export const phaseTwoChecklist = [
  "Add provider configuration helpers for LinkedIn and Google",
  "Create OAuth start and callback routes for both providers",
  "Persist provider connection state in Prisma",
  "Build a connections page for connect and disconnect actions"
];

export const phaseThreeChecklist = [
  "Persist sender profiles through API routes",
  "Create a compose page with recipient and campaign inputs",
  "Build prompt shaping and OpenAI generation helpers",
  "Persist successful generations as email drafts"
];

export const phaseFourChecklist = [
  "Refresh Gmail tokens and send MIME messages through Gmail API",
  "Create a send route for reviewed drafts",
  "Persist successful sends in sent email history",
  "Add sent history and compose send actions"
];
