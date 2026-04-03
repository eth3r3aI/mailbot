import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createAuditEvent } from "@/lib/audit";
import { getCurrentUserForApi } from "@/lib/auth";
import {
  getProfileForUser,
  profileSchema,
  saveProfileForUser
} from "@/lib/profile";

export async function GET() {
  const user = await getCurrentUserForApi();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const profile = await getProfileForUser(user);
  return NextResponse.json(profile.values);
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserForApi();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const input = profileSchema.parse(body);
    const profile = await saveProfileForUser(user.id, input);
    await createAuditEvent({
      userId: user.id,
      eventType: "profile.saved"
    });

    return NextResponse.json({
      ok: true,
      profile
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Invalid profile input."
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Profile save failed."
      },
      { status: 500 }
    );
  }
}
