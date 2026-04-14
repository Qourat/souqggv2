import Link from "next/link";
import { sql } from "@/lib/db";


export const revalidate = 0;

async function getConfig() {
  try {
    const rows = await sql`SELECT key, value FROM public.platform_config ORDER BY key`;
    return rows;
  } catch {
    return [];
  }
}

export default async function ConfigPage() {
  const config = await getConfig();

  return (
    <div className="min-h-screen bg-[#f6f6ef] font-sans text-black">
      <nav className="bg-[#ff6600] px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-black overflow-x-auto whitespace-nowrap border-b border-[#e55c00]">
        <Link href="/" className="text-lg mr-2">SOUQ.GG</Link>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <Link href="/admin" className="hover:underline">Dashboard</Link>
          <Link href="/admin/users" className="hover:underline">Users</Link>
          <Link href="/admin/products" className="hover:underline">Products</Link>
          <Link href="/admin/analytics" className="hover:underline">Analytics</Link>
          <Link href="/admin/config" className="hover:underline font-bold">Config</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Platform Configuration</h1>

        <div className="space-y-6">
          {/* Env Vars */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Environment Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span>Database</span>
                <span className="text-green-600 font-bold">Connected</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span>Auth Mode</span>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-bold">Local JWT</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span>Stripe</span>
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded font-bold">Mock Mode</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span>File Storage (R2)</span>
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded font-bold">Not Configured</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span>Search (Typesense)</span>
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded font-bold">Not Configured</span>
              </div>
            </div>
          </div>

          {/* Platform Config Table */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Runtime Configuration</h2>
            {config.length === 0 ? (
              <div className="text-sm text-gray-400">No config entries yet. Add settings below.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Key</th>
                    <th className="px-3 py-2">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {config.map((c: any) => (
                    <tr key={c.key}>
                      <td className="px-3 py-2 font-mono text-xs">{c.key}</td>
                      <td className="px-3 py-2">{c.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Add Config */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Add / Update Config</h2>
            <form action="/api/admin/config" method="POST" className="flex gap-2">
              <input
                type="text"
                name="key"
                placeholder="platform_fee_percent"
                className="flex-1 border border-gray-300 p-2 rounded text-sm focus:border-[#ff6600] focus:outline-none font-mono"
              />
              <input
                type="text"
                name="value"
                placeholder="10"
                className="flex-1 border border-gray-300 p-2 rounded text-sm focus:border-[#ff6600] focus:outline-none"
              />
              <button type="submit" className="bg-[#ff6600] text-white font-bold px-4 py-2 rounded text-sm hover:bg-[#e55c00]">
                Save
              </button>
            </form>
          </div>

          {/* Quick Setup Defaults */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Quick Setup Defaults</h2>
            <p className="text-xs text-gray-500 mb-3">Add recommended platform defaults:</p>
            <form action="/api/admin/config" method="POST" className="flex flex-wrap gap-2">
              <input type="hidden" name="key" value="platform_fee_percent" />
              <input type="hidden" name="value" value="10" />
              <button type="submit" className="bg-gray-100 border border-gray-300 text-sm px-3 py-1.5 rounded hover:bg-gray-200">Set Platform Fee: 10%</button>
            </form>
            <form action="/api/admin/config" method="POST" className="flex flex-wrap gap-2 mt-2">
              <input type="hidden" name="key" value="max_products_per_seller" />
              <input type="hidden" name="value" value="100" />
              <button type="submit" className="bg-gray-100 border border-gray-300 text-sm px-3 py-1.5 rounded hover:bg-gray-200">Set Max Products/Seller: 100</button>
            </form>
            <form action="/api/admin/config" method="POST" className="flex flex-wrap gap-2 mt-2">
              <input type="hidden" name="key" value="max_file_size_mb" />
              <input type="hidden" name="value" value="500" />
              <button type="submit" className="bg-gray-100 border border-gray-300 text-sm px-3 py-1.5 rounded hover:bg-gray-200">Set Max File Size: 500MB</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}