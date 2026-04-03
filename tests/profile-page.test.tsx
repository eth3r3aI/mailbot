import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProfilePage from "@/app/profile/page";

vi.mock("@/lib/profile", () => ({
  getCurrentUserProfile: vi.fn().mockResolvedValue({
    resume: {
      fileName: "Alex-Morgan-Resume.pdf",
      mimeType: "application/pdf"
    },
    values: {
      fullName: "Alex Morgan",
      currentTitle: "Growth Consultant",
      company: "North Harbor Studio",
      shortBio:
        "I help outbound teams improve response rates with better messaging, workflow design, and lightweight automation.",
      educationSummary: "University of Michigan, Economics and entrepreneurship programs",
      backgroundSummary: "Background summary",
      experienceHighlights: "Built outbound playbooks",
      expertiseAreas: "Outbound strategy",
      targetAudience: "B2B founders and sales teams",
      tonePreference: "Confident, concise, and friendly",
      ctaPreference: "Short intro call next week",
      aboutText: "Longer about text"
    }
  })
}));

describe("profile page", () => {
  it("renders the saved profile editor fields", async () => {
    render(await ProfilePage());

    expect(
      screen.getByRole("heading", {
        name: /capture the sender story we want the model to use/i
      })
    ).toBeInTheDocument();

    expect(screen.getByDisplayValue(/alex morgan/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/growth consultant/i)).toBeInTheDocument();
    expect(screen.getByText(/save profile/i)).toBeInTheDocument();
    expect(screen.getByText(/saved pdf resume for email attachments/i)).toBeInTheDocument();
    expect(screen.getByText(/upload pdf resume/i)).toBeInTheDocument();
    expect(screen.getByText(/alex-morgan-resume\.pdf/i)).toBeInTheDocument();
    expect(screen.queryByText(/how this feeds later phases/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/structured sender profile/i)).not.toBeInTheDocument();
  });
});
