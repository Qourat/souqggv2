import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";
import { cookies } from "next/headers";
import Nav from "@/app/components/Nav";
import SettingsPageClient from "./SettingsPageClient";

async function getCategories() {
  return sql`SELECT c.id, c.name, c.slug FROM public.categories c ORDER BY c.name LIMIT 12`;
}

export default async function SettingsPage() {
  let currentUser = null;
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (session) {
      const payload = await verifyToken(session);
      if (payload?.userId) {
        const [profile] = await sql`SELECT * FROM public.profiles WHERE id = ${payload.userId}`;
        if (profile) currentUser = profile;
      }
    }
  } catch {}

  if (!currentUser) redirect("/login");

  const categories = await getCategories();

  return (
    <>
      <Nav categories={categories as any[]} currentUser={{ username: currentUser.username, display_name: currentUser.display_name }} />
      <SettingsPageClient profile={currentUser as any} />
    </>
  );
}