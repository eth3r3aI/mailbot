import { describe, expect, it } from "vitest";
import { buildMimeEmail, encodeBase64Url } from "@/lib/gmail-send";

describe("gmail send helpers", () => {
  it("builds a simple MIME email", () => {
    const mime = buildMimeEmail({
      from: "alex@example.com",
      to: "taylor@example.com",
      subject: "Hello",
      body: "Hi Taylor"
    });

    expect(mime).toContain("From: alex@example.com");
    expect(mime).toContain("To: taylor@example.com");
    expect(mime).toContain("Subject: Hello");
    expect(mime).toContain("Hi Taylor");
  });

  it("builds a multipart MIME email when an attachment is included", () => {
    const mime = buildMimeEmail({
      from: "alex@example.com",
      to: "taylor@example.com",
      subject: "Hello",
      body: "Hi Taylor",
      attachment: {
        fileName: "Resume.pdf",
        mimeType: "application/pdf",
        dataBase64: "UERG"
      }
    });

    expect(mime).toContain('Content-Type: multipart/mixed; boundary="');
    expect(mime).toContain('Content-Disposition: attachment; filename="Resume.pdf"');
    expect(mime).toContain("UERG");
  });

  it("encodes MIME content to base64url", () => {
    const encoded = encodeBase64Url("hello world");

    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });
});
