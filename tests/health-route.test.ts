import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("health route", () => {
  it("returns the expected phase one payload", async () => {
    const response = GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "ok",
      service: "mailbot",
      phase: "foundation"
    });
  });
});

