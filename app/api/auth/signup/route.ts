import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { createAuditEvent } from "@/lib/audit";
import { assertPasswordPolicy, createSession, signUpUser } from "@/lib/auth";

const signUpSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("A valid email is required."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = signUpSchema.parse(body);
    assertPasswordPolicy(input.password);

    const user = await signUpUser(input);
    await createSession(user.id);
    await createAuditEvent({
      userId: user.id,
      eventType: "auth.signup",
      metadata: {
        email: user.email
      }
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
        { error: error.issues[0]?.message ?? "Invalid signup input." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sign-up failed." },
      { status: 400 }
    );
  }
}
