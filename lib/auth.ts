import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { env } from "@/lib/env";
import { hashPassword, sha256, verifyPassword } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

const sessionDurationMs = 1000 * 60 * 60 * 24 * 14;

type SafeUser = Awaited<ReturnType<typeof getCurrentUser>>;

export async function signUpUser(args: {
  email: string;
  password: string;
  fullName: string;
}) {
  const email = args.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  return prisma.user.create({
    data: {
      email,
      fullName: args.fullName.trim(),
      passwordHash: hashPassword(args.password),
      profile: {
        create: {}
      }
    }
  });
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase()
    }
  });

  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }

  return user;
}

export async function createSession(userId: string) {
  const token = randomUUID();
  const tokenHash = sha256(`${token}:${env.AUTH_SECRET}`);
  const expiresAt = new Date(Date.now() + sessionDurationMs);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: sha256(`${token}:${env.AUTH_SECRET}`)
      }
    });
  }

  cookieStore.delete(env.SESSION_COOKIE_NAME);
}

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: sha256(`${token}:${env.AUTH_SECRET}`)
    },
    include: {
      user: {
        include: {
          oauthConnections: true,
          profile: true
        }
      }
    }
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) {
      await prisma.session.delete({
        where: {
          tokenHash: session.tokenHash
        }
      });
    }

    cookieStore.delete(env.SESSION_COOKIE_NAME);
    return null;
  }

  return session.user;
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getCurrentUserForApi() {
  return getCurrentUser();
}

export function assertPasswordPolicy(password: string) {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
}

export type AuthenticatedUser = NonNullable<SafeUser>;
