import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { createAuditEvent } from "@/lib/audit";
import { authenticateUser, createSession } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("A valid email is required."),
  password: z.string().min(1, "Password is required.")
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);
    const user = await authenticateUser(input.email, input.password);

    await createSession(user.id);
    await createAuditEvent({
      userId: user.id,
      eventType: "auth.login"
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid login input." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed." },
      { status: 401 }
    );
  }
}
