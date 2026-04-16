import SouqMarketingHeader from "@/app/components/SouqMarketingHeader";

export default function AgentKeysPage() {
  return (
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <SouqMarketingHeader
        trailing={<span className="souq-badge-pill">Agent keys</span>}
      />

      <main className="max-w-2xl mx-auto p-4 mt-12 px-4">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold">AI Agent API Keys</h1>
            <p className="text-sm text-souq-muted">Generate and manage keys for your autonomous agents.</p>
          </div>
          <button className="bg-souq-terra text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-souq-terra-hover transition-colors">
            + New Key
          </button>
        </div>

        <div className="bg-souq-card border border-souq-border rounded overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-souq-raised border-b border-souq-line text-souq-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2 font-bold">Key Name</th>
                <th className="px-4 py-2 font-bold">Scopes</th>
                <th className="px-4 py-2 font-bold">Last Used</th>
                <th className="px-4 py-2 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-souq-line">
              <tr>
                <td className="px-4 py-3 font-medium">Market-Analyzer-1</td>
                <td className="px-4 py-3">
                  <span className="bg-souq-raised text-souq-muted px-1.5 py-0.5 rounded text-[10px] font-bold">read</span>
                </td>
                <td className="px-4 py-3 text-souq-muted">2h ago</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-souq-terra hover:underline">Revoke</button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Product-Uploader-Bot</td>
                <td className="px-4 py-3">
                  <span className="bg-souq-raised text-souq-muted px-1.5 py-0.5 rounded text-[10px] font-bold">read</span>
                  <span className="bg-souq-raised text-souq-muted px-1.5 py-0.5 rounded text-[10px] font-bold ml-1">write</span>
                </td>
                <td className="px-4 py-3 text-souq-muted">1d ago</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-souq-terra hover:underline">Revoke</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 p-4 bg-souq-raised border border-dashed border-souq-border rounded text-xs text-souq-text leading-relaxed">
          <strong>Security Tip:</strong> Store your API keys securely. Never commit them to version control. If a key is compromised, revoke it immediately from this dashboard.
        </div>
      </main>
    </div>
  );
}
