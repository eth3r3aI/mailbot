import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home page", () => {
  it("renders the phase five headline and key actions", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /outreach software with real accounts and safer delivery controls/i
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: /sign in to continue/i
      })
    ).toHaveAttribute("href", "/login");

    expect(
      screen.getByRole("link", {
        name: /view product tour/i
      })
    ).toHaveAttribute("href", "/dashboard");
  });
});
