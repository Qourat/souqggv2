import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { env } from "@/shared/env";
import { db, schema } from "@/shared/db";

export interface SessionUser {
  id: string;
  email: string | null;
  role: "buyer" | "admin";
}

const SESSION_COOKIE = "souq_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

interface SessionPayload extends SessionUser {
  exp: number;
  nonce: string;
}

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string): string {
  return createHmac("sha256", env.JWT_SECRET ?? "souq-local-dev-secret")
    .update(value)
    .digest("base64url");
}

function encodeSession(payload: SessionPayload): string {
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

function decodeSession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload?.id || !payload?.exp || Date.now() > payload.exp) return null;
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionUser(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,
    encodeSession({
      ...user,
      exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
      nonce: randomUUID(),
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  );
}

export async function clearSessionUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  if (!db) return null;
  const [profile] = await db
    .select({
      id: schema.profiles.id,
      email: schema.profiles.email,
      role: schema.profiles.role,
      isBanned: schema.profiles.isBanned,
    })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, session.id))
    .limit(1);

  if (!profile || profile.isBanned) return null;

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role as "buyer" | "admin",
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}
