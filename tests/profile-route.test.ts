import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/profile/route";

const { getProfileForUserMock, saveProfileForUserMock } = vi.hoisted(() => ({
  getProfileForUserMock: vi.fn(),
  saveProfileForUserMock: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserForApi: vi.fn().mockResolvedValue({
    id: "user_123"
  })
}));

vi.mock("@/lib/audit", () => ({
  createAuditEvent: vi.fn().mockResolvedValue(null)
}));

vi.mock("@/lib/profile", () => ({
  getProfileForUser: getProfileForUserMock,
  saveProfileForUser: saveProfileForUserMock,
  profileSchema: {
    parse: vi.fn((value) => value)
  }
}));

describe("profile route", () => {
  it("returns the current profile values", async () => {
    getProfileForUserMock.mockResolvedValue({
      values: {
        fullName: "Alex Morgan"
      }
    });

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({
      fullName: "Alex Morgan"
    });
  });

  it("saves the provided profile input", async () => {
    saveProfileForUserMock.mockResolvedValue({
      id: "profile_123"
    });

    const response = await POST(
      new Request("http://localhost:3000/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: "Alex Morgan"
        })
      })
    );
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(saveProfileForUserMock).toHaveBeenCalledWith("user_123", {
      fullName: "Alex Morgan"
    });
  });
});
