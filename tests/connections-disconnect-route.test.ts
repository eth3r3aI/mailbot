import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/connections/disconnect/route";

const { deleteManyMock } = vi.hoisted(() => ({
  deleteManyMock: vi.fn()
}));

vi.mock("@/lib/current-user", () => ({
  getOrCreateCurrentUser: vi.fn().mockResolvedValue({
    id: "user_123"
  })
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserForApi: vi.fn().mockResolvedValue({
    id: "user_123"
  })
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    oAuthConnection: {
      deleteMany: deleteManyMock
    }
  }
}));

describe("connections disconnect route", () => {
  it("removes the selected provider for the current user", async () => {
    deleteManyMock.mockResolvedValue({ count: 1 });

    const response = await POST(
      new Request("http://localhost:3000/api/connections/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ provider: "GOOGLE" })
      })
    );

    const data = await response.json();

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: {
        userId: "user_123",
        provider: "GOOGLE"
      }
    });
    expect(data).toEqual({
      ok: true,
      provider: "GOOGLE",
      status: "DISCONNECTED"
    });
  });
});
