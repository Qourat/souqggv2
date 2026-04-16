import Link from "next/link";
import { sql } from "@/lib/db";
import AdminShellBar from "@/app/components/AdminShellBar";


export const revalidate = 30;

async function getUsers() {
  return sql`
    SELECT id, username, display_name, role, bio, created_at
    FROM public.profiles
    ORDER BY created_at DESC
  `;
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <AdminShellBar
        end={
          <>
            <Link href="/admin" className="hover:underline text-xs">
              Dashboard
            </Link>
            <Link href="/admin/users" className="hover:underline font-bold text-xs">
              Users
            </Link>
            <Link href="/admin/products" className="hover:underline text-xs">
              Products
            </Link>
            <Link href="/admin/analytics" className="hover:underline text-xs">
              Analytics
            </Link>
            <Link href="/admin/config" className="hover:underline text-xs">
              Config
            </Link>
          </>
        }
      />

      <main className="max-w-6xl mx-auto p-4 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
          <span className="text-sm text-souq-muted">{users.length} total users</span>
        </div>

        <div className="bg-souq-card border border-souq-line rounded overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-souq-raised border-b text-xs uppercase tracking-wider text-souq-muted">
              <tr>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Display Name</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Bio</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-souq-line">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-souq-raised">
                  <td className="px-3 py-2 font-medium">{u.username}</td>
                  <td className="px-3 py-2 text-souq-muted">{u.display_name || "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                      u.role === "admin" ? "bg-souq-terra/20 text-souq-terra" :
                      u.role === "seller" ? "bg-souq-sage/20 text-souq-sage" :
                      u.role === "agent" ? "bg-souq-gold/20 text-souq-gold" :
                      "bg-souq-raised text-souq-muted"
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-souq-faint max-w-[200px] truncate">{u.bio || "—"}</td>
                  <td className="px-3 py-2 text-xs text-souq-faint">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <form action="/api/admin/users" method="POST">
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="action" value="promote_seller" />
                        <button type="submit" className="text-[10px] bg-souq-sage/10 text-souq-sage px-2 py-0.5 rounded hover:bg-souq-sage/20" title="Make Seller">→ Seller</button>
                      </form>
                      <form action="/api/admin/users" method="POST">
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="action" value="promote_admin" />
                        <button type="submit" className="text-[10px] bg-souq-terra/10 text-souq-terra px-2 py-0.5 rounded hover:bg-souq-terra/20" title="Make Admin">→ Admin</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}