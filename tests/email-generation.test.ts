import { describe, expect, it } from "vitest";
import {
  buildGenerationPrompt,
  extractResponseText,
  parseInferredRecipient,
  parseGeneratedEmail
} from "@/lib/email-generation";

const profile = {
  fullName: "Alex Morgan",
  currentTitle: "Growth Consultant",
  company: "North Harbor Studio",
  shortBio: "Short bio",
  educationSummary: "University of Michigan alum with a background in economics and student entrepreneurship.",
  backgroundSummary: "Background summary",
  experienceHighlights: "Highlights",
  expertiseAreas: "Expertise",
  targetAudience: "B2B founders",
  tonePreference: "Confident",
  ctaPreference: "Short intro call",
  aboutText: "Additional context"
};

const request = {
  recipientName: "Taylor Reed",
  recipientEmail: "taylor@example.com",
  recipientCompany: "Acme",
  recipientRole: "Founder",
  targetProfileText: "Taylor Reed is Founder at Acme and previously led growth at Northstar.",
  connectionGoal: "Start a thoughtful professional relationship",
  sharedContext: "We both spend time thinking about outbound and founder-led growth",
  whyThem: "Taylor has a perspective on early-stage sales that I genuinely want to learn from",
  credibility: "I help teams improve response rates and messaging systems",
  ask: "A short intro call sometime this month",
  desiredTone: "Professional and warm"
};

describe("email generation helpers", () => {
  it("builds prompts that include profile and campaign context", () => {
    const prompt = buildGenerationPrompt(profile, request);

    expect(prompt.system).toContain("Return only valid JSON");
    expect(prompt.user).toContain("Alex Morgan");
    expect(prompt.user).toContain("Taylor Reed");
    expect(prompt.user).toContain("Education summary");
    expect(prompt.user).toContain("Start a thoughtful professional relationship");
    expect(prompt.system).toContain("relationship-building");
    expect(prompt.system).toContain("alumni overlap");
  });

  it("parses a JSON model response", () => {
    const draft = parseGeneratedEmail(`
      {
        "subject": "Quick idea for Acme",
        "body": "Hi Taylor,\\n\\nI had an idea for Acme.\\n\\nBest,\\nAlex",
        "variantShort": "Hi Taylor, I had an idea for Acme."
      }
    `);

    expect(draft.subject).toContain("Acme");
    expect(draft.variantShort).toContain("Taylor");
  });

  it("parses an inferred recipient payload", () => {
    const inferred = parseInferredRecipient(`
      {
        "inferredEmail": "taylor@acme.com",
        "resolvedCompany": "Acme",
        "resolvedDomain": "acme.com",
        "confidence": "medium",
        "rationale": "Acme's site and public references point to acme.com as the company domain.",
        "sourceUrls": ["https://acme.com"]
      }
    `);

    expect(inferred.inferredEmail).toBe("taylor@acme.com");
    expect(inferred.resolvedDomain).toBe("acme.com");
  });

  it("extracts assistant text from nested responses payloads", () => {
    const text = extractResponseText({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: "{\"subject\":\"Hello\",\"body\":\"World\",\"variantShort\":\"Hi\"}"
            }
          ]
        }
      ]
    });

    expect(text).toContain("\"subject\"");
  });
});
