import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ComposePage from "@/app/compose/page";

vi.mock("@/lib/profile", () => ({
  getCurrentUserProfile: vi.fn().mockResolvedValue({
    values: {
      fullName: "Alex Morgan",
      currentTitle: "Growth Consultant",
      company: "North Harbor Studio",
      shortBio: "Short bio",
      educationSummary: "University of Michigan, Economics",
      backgroundSummary: "Background summary",
      experienceHighlights: "Highlights",
      expertiseAreas: "Expertise",
      targetAudience: "B2B founders",
      tonePreference: "Confident",
      ctaPreference: "Short intro call",
      aboutText: "Additional context"
    }
  })
}));

vi.mock("@/lib/current-user", () => ({
  requireCurrentUser: vi.fn().mockResolvedValue({
    id: "user_123"
  })
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailDraft: {
      findMany: vi.fn().mockResolvedValue([])
    }
  }
}));

describe("compose page", () => {
  it("renders the composer and generation guardrails", async () => {
    render(await ComposePage());

    expect(
      screen.getByRole("heading", {
        name: /generate networking emails from saved sender context/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/generate a networking email/i)).toBeInTheDocument();
    expect(screen.getByText(/no fabricated claims or relationships/i)).toBeInTheDocument();
  });
});
