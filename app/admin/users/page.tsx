import Link from "next/link";
import { sql } from "@/lib/db";


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
    <div className="min-h-screen bg-[#f6f6ef] font-sans text-black">
      <nav className="bg-[#ff6600] px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-black overflow-x-auto whitespace-nowrap border-b border-[#e55c00]">
        <Link href="/" className="text-lg mr-2">SOUQ.GG</Link>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <Link href="/admin" className="hover:underline">Dashboard</Link>
          <Link href="/admin/users" className="hover:underline font-bold">Users</Link>
          <Link href="/admin/products" className="hover:underline">Products</Link>
          <Link href="/admin/analytics" className="hover:underline">Analytics</Link>
          <Link href="/admin/config" className="hover:underline">Config</Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
          <span className="text-sm text-gray-500">{users.length} total users</span>
        </div>

        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Display Name</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Bio</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{u.username}</td>
                  <td className="px-3 py-2 text-gray-500">{u.display_name || "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                      u.role === "admin" ? "bg-red-100 text-red-700" :
                      u.role === "seller" ? "bg-blue-100 text-blue-700" :
                      u.role === "agent" ? "bg-purple-100 text-purple-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-400 max-w-[200px] truncate">{u.bio || "—"}</td>
                  <td className="px-3 py-2 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <form action="/api/admin/users" method="POST">
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="action" value="promote_seller" />
                        <button type="submit" className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-100" title="Make Seller">→ Seller</button>
                      </form>
                      <form action="/api/admin/users" method="POST">
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="action" value="promote_admin" />
                        <button type="submit" className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded hover:bg-red-100" title="Make Admin">→ Admin</button>
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