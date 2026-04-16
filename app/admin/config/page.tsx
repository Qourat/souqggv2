import Link from "next/link";
import { sql } from "@/lib/db";
import AdminShellBar from "@/app/components/AdminShellBar";


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
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <AdminShellBar
        end={
          <>
            <Link href="/admin" className="hover:underline text-xs">
              Dashboard
            </Link>
            <Link href="/admin/users" className="hover:underline text-xs">
              Users
            </Link>
            <Link href="/admin/products" className="hover:underline text-xs">
              Products
            </Link>
            <Link href="/admin/analytics" className="hover:underline text-xs">
              Analytics
            </Link>
            <Link href="/admin/config" className="hover:underline font-bold text-xs">
              Config
            </Link>
          </>
        }
      />

      <main className="max-w-4xl mx-auto p-4 px-4">
        <h1 className="text-2xl font-bold mb-6">Platform Configuration</h1>

        <div className="space-y-6">
          {/* Env Vars */}
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-souq-muted mb-3">Environment Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-souq-line">
                <span>Database</span>
                <span className="text-souq-sage font-bold">Connected</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-souq-line">
                <span>Auth Mode</span>
                <span className="bg-souq-sage-muted text-souq-sage text-xs px-2 py-0.5 rounded font-bold">Local JWT</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-souq-line">
                <span>Stripe</span>
                <span className="bg-souq-gold-muted text-souq-gold text-xs px-2 py-0.5 rounded font-bold">Mock Mode</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-souq-line">
                <span>File Storage (R2)</span>
                <span className="bg-souq-gold-muted text-souq-gold text-xs px-2 py-0.5 rounded font-bold">Not Configured</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-souq-line">
                <span>Search (Typesense)</span>
                <span className="bg-souq-gold-muted text-souq-gold text-xs px-2 py-0.5 rounded font-bold">Not Configured</span>
              </div>
            </div>
          </div>

          {/* Platform Config Table */}
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-souq-muted mb-3">Runtime Configuration</h2>
            {config.length === 0 ? (
              <div className="text-sm text-souq-faint">No config entries yet. Add settings below.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wider text-souq-muted">
                  <tr>
                    <th className="px-3 py-2">Key</th>
                    <th className="px-3 py-2">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-souq-line">
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
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-souq-muted mb-3">Add / Update Config</h2>
            <form action="/api/admin/config" method="POST" className="flex gap-2">
              <input
                type="text"
                name="key"
                placeholder="platform_fee_percent"
                className="flex-1 border border-souq-border p-2 rounded text-sm focus:border-souq-terra focus:outline-none font-mono"
              />
              <input
                type="text"
                name="value"
                placeholder="10"
                className="flex-1 border border-souq-border p-2 rounded text-sm focus:border-souq-terra focus:outline-none"
              />
              <button type="submit" className="bg-souq-terra text-white font-bold px-4 py-2 rounded text-sm hover:bg-souq-terra-hover">
                Save
              </button>
            </form>
          </div>

          {/* Quick Setup Defaults */}
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-souq-muted mb-3">Quick Setup Defaults</h2>
            <p className="text-xs text-souq-muted mb-3">Add recommended platform defaults:</p>
            <form action="/api/admin/config" method="POST" className="flex flex-wrap gap-2">
              <input type="hidden" name="key" value="platform_fee_percent" />
              <input type="hidden" name="value" value="10" />
              <button type="submit" className="bg-souq-raised border border-souq-border text-sm px-3 py-1.5 rounded hover:bg-souq-line">Set Platform Fee: 10%</button>
            </form>
            <form action="/api/admin/config" method="POST" className="flex flex-wrap gap-2 mt-2">
              <input type="hidden" name="key" value="max_products_per_seller" />
              <input type="hidden" name="value" value="100" />
              <button type="submit" className="bg-souq-raised border border-souq-border text-sm px-3 py-1.5 rounded hover:bg-souq-line">Set Max Products/Seller: 100</button>
            </form>
            <form action="/api/admin/config" method="POST" className="flex flex-wrap gap-2 mt-2">
              <input type="hidden" name="key" value="max_file_size_mb" />
              <input type="hidden" name="value" value="500" />
              <button type="submit" className="bg-souq-raised border border-souq-border text-sm px-3 py-1.5 rounded hover:bg-souq-line">Set Max File Size: 500MB</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}