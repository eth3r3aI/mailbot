import exampleProfile from "@/examples/example-profile.json";

export function getDefaultProfileValues() {
  return {
    fullName: exampleProfile.fullName,
    currentTitle: exampleProfile.currentTitle,
    company: exampleProfile.company,
    shortBio: exampleProfile.shortBio,
    educationSummary:
      "Student or recent graduate with relevant coursework, campus involvement, and a clear professional direction.",
    backgroundSummary:
      "Experienced outbound strategist focused on practical systems and thoughtful personalization.",
    experienceHighlights: exampleProfile.experienceHighlights.join(", "),
    expertiseAreas: "Outbound strategy, email messaging, workflow automation",
    targetAudience: exampleProfile.targetAudience,
    tonePreference: exampleProfile.tonePreference,
    ctaPreference: exampleProfile.ctaPreference,
    aboutText:
      "Paste longer source material here to give the generator additional business context."
  };
}
