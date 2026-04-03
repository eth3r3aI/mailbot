import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/email/send/route";

const { findFirstMock, findUserProfileMock, updateMock, createMock, sendDraftViaGmailMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  findUserProfileMock: vi.fn(),
  updateMock: vi.fn(),
  createMock: vi.fn(),
  sendDraftViaGmailMock: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserForApi: vi.fn().mockResolvedValue({
    id: "user_123"
  })
}));

vi.mock("@/lib/gmail-send", () => ({
  sendDraftViaGmail: sendDraftViaGmailMock
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailDraft: {
      findFirst: findFirstMock,
      update: updateMock
    },
    userProfile: {
      findUnique: findUserProfileMock
    },
    sentEmail: {
      create: createMock
    }
  }
}));

describe("email send route", () => {
  it("sends a reviewed draft and persists sent history", async () => {
    findFirstMock.mockResolvedValue({
      id: "draft_123",
      userId: "user_123"
    });
    sendDraftViaGmailMock.mockResolvedValue({
      gmailMessageId: "gmail_123",
      fromEmail: "alex@example.com"
    });
    updateMock.mockResolvedValue({});
    createMock.mockResolvedValue({
      id: "sent_123",
      gmailMessageId: "gmail_123",
      recipientEmail: "taylor@example.com",
      subject: "Hello",
      sentAt: new Date("2026-04-03T00:00:00.000Z")
    });

    const response = await POST(
      new Request("http://localhost:3000/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          draftId: "draft_123",
          subject: "Hello",
          body: "Hi Taylor",
          recipientEmail: "taylor@example.com"
        })
      })
    );

    const data = await response.json();

    expect(sendDraftViaGmailMock).toHaveBeenCalledWith({
      userId: "user_123",
      to: "taylor@example.com",
      subject: "Hello",
      body: "Hi Taylor",
      attachment: null
    });
    expect(data.ok).toBe(true);
    expect(data.sent.gmailMessageId).toBe("gmail_123");
  });

  it("can attach the stored resume while sending", async () => {
    findFirstMock.mockResolvedValueOnce({
      id: "draft_123",
      userId: "user_123"
    });
    findUserProfileMock.mockResolvedValueOnce({
      resumeFileName: "Alex-Morgan-Resume.pdf",
      resumeMimeType: "application/pdf",
      resumeDataBase64: "UERG"
    });
    sendDraftViaGmailMock.mockResolvedValueOnce({
      gmailMessageId: "gmail_456",
      fromEmail: "alex@example.com"
    });
    updateMock.mockResolvedValueOnce({});
    createMock.mockResolvedValueOnce({
      id: "sent_456",
      gmailMessageId: "gmail_456",
      recipientEmail: "taylor@example.com",
      subject: "Hello again",
      sentAt: new Date("2026-04-03T00:00:00.000Z")
    });

    const response = await POST(
      new Request("http://localhost:3000/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          draftId: "draft_123",
          subject: "Hello again",
          body: "Hi Taylor",
          recipientEmail: "taylor@example.com",
          attachResume: true
        })
      })
    );

    const data = await response.json();

    expect(sendDraftViaGmailMock).toHaveBeenCalledWith({
      userId: "user_123",
      to: "taylor@example.com",
      subject: "Hello again",
      body: "Hi Taylor",
      attachment: {
        fileName: "Alex-Morgan-Resume.pdf",
        mimeType: "application/pdf",
        dataBase64: "UERG"
      }
    });
    expect(data.ok).toBe(true);
  });
});
