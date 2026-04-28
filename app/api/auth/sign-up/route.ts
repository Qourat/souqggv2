import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db, schema } from "@/shared/db";
import { hashPassword } from "@/shared/auth/password";
import { setSessionUser } from "@/shared/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const signUpSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(200),
  locale: z.string().min(2).max(5).default("en"),
});

export async function POST(req: NextRequest) {
  if (!db) {
    return NextResponse.json(
      { error: "Account access is not configured.", code: "DEPENDENCY_DOWN" },
      { status: 503 },
    );
  }

  const parsed = signUpSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid account details.", code: "VALIDATION" },
      { status: 422 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await db
    .select({ id: schema.profiles.id })
    .from(schema.profiles)
    .where(eq(schema.profiles.email, email))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account already exists for this email.", code: "CONFLICT" },
      { status: 409 },
    );
  }

  const [profile] = await db
    .insert(schema.profiles)
    .values({
      email,
      passwordHash: hashPassword(parsed.data.password),
      fullName: parsed.data.name,
      preferredLocale: parsed.data.locale,
      role: "buyer",
    })
    .returning();

  await setSessionUser({
    id: profile.id,
    email: profile.email,
    role: profile.role as "buyer" | "admin",
  });

  return NextResponse.json(
    { user: { id: profile.id, email: profile.email, role: profile.role } },
    { status: 201 },
  );
}
