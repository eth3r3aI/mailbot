import { describe, expect, it } from "vitest";
import {
  buildProfileAutofillPrompt,
  normalizeExtractedText,
  parseAutofillProfile
} from "@/lib/profile-autofill";

describe("profile autofill helpers", () => {
  it("normalizes extracted text", () => {
    expect(normalizeExtractedText("Alex\n\n\nMorgan \n Consultant")).toBe(
      "Alex\nMorgan\n Consultant"
    );
  });

  it("builds an autofill prompt with the document text", () => {
    const prompt = buildProfileAutofillPrompt("Alex Morgan\nGrowth Consultant");

    expect(prompt.system).toContain("extract professional profile information");
    expect(prompt.user).toContain("Alex Morgan");
    expect(prompt.user).toContain("\"fullName\"");
  });

  it("parses a profile autofill JSON payload", () => {
    const profile = parseAutofillProfile(`
      {
        "fullName": "Alex Morgan",
        "currentTitle": "Growth Consultant",
        "company": "North Harbor Studio",
        "shortBio": "Short bio",
        "educationSummary": "University of Michigan, Economics",
        "backgroundSummary": "Background summary",
        "experienceHighlights": "Experience highlights",
        "expertiseAreas": "Outbound strategy, messaging",
        "targetAudience": "Founders and operators",
        "tonePreference": "Warm, thoughtful, and professional",
        "ctaPreference": "A short conversation to learn from each other",
        "aboutText": "Longer background summary"
      }
    `);

    expect(profile.fullName).toBe("Alex Morgan");
    expect(profile.currentTitle).toBe("Growth Consultant");
  });
});
