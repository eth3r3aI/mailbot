import { describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "@/app/api/email/drafts/[draftId]/route";

const { findFirstMock, updateMock, deleteMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserForApi: vi.fn().mockResolvedValue({
    id: "user_123"
  })
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailDraft: {
      findFirst: findFirstMock,
      update: updateMock,
      delete: deleteMock
    }
  }
}));

describe("email draft route", () => {
  it("updates a saved draft", async () => {
    findFirstMock.mockResolvedValue({
      id: "draft_123",
      userId: "user_123",
      contextJson: JSON.stringify({ variantShort: "Old short" })
    });
    updateMock.mockResolvedValue({
      id: "draft_123",
      subject: "Updated subject",
      body: "Updated body",
      createdAt: new Date("2026-04-03T00:00:00.000Z")
    });

    const response = await PATCH(
      new Request("http://localhost:3000/api/email/drafts/draft_123", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subject: "Updated subject",
          body: "Updated body",
          variantShort: "Updated short"
        })
      }),
      { params: Promise.resolve({ draftId: "draft_123" }) }
    );

    const data = await response.json();

    expect(updateMock).toHaveBeenCalled();
    expect(data.ok).toBe(true);
    expect(data.draft.subject).toBe("Updated subject");
  });

  it("deletes a saved draft", async () => {
    findFirstMock.mockResolvedValue({
      id: "draft_123",
      userId: "user_123"
    });
    deleteMock.mockResolvedValue({});

    const response = await DELETE(
      new Request("http://localhost:3000/api/email/drafts/draft_123", {
        method: "DELETE"
      }),
      { params: Promise.resolve({ draftId: "draft_123" }) }
    );

    const data = await response.json();

    expect(deleteMock).toHaveBeenCalledWith({
      where: {
        id: "draft_123"
      }
    });
    expect(data).toEqual({
      ok: true,
      draftId: "draft_123"
    });
  });
});
