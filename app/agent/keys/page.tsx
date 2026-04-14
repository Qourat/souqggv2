import Link from "next/link";

export default function AgentKeysPage() {
  return (
    <div className="min-h-screen bg-[#f6f6ef] font-sans text-black">
      <nav className="bg-[#ff6600] px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-black overflow-x-auto whitespace-nowrap border-b border-[#e55c00]">
        <Link href="/" className="text-lg mr-2">SOUQ.GG</Link>
        <div className="ml-auto">
          <span className="bg-white px-2 py-0.5 rounded text-xs">Agent Management</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-4 mt-12">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold">AI Agent API Keys</h1>
            <p className="text-sm text-gray-600">Generate and manage keys for your autonomous agents.</p>
          </div>
          <button className="bg-[#ff6600] text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-[#e55c00] transition-colors">
            + New Key
          </button>
        </div>

        <div className="bg-white border border-gray-300 rounded overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2 font-bold">Key Name</th>
                <th className="px-4 py-2 font-bold">Scopes</th>
                <th className="px-4 py-2 font-bold">Last Used</th>
                <th className="px-4 py-2 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 font-medium">Market-Analyzer-1</td>
                <td className="px-4 py-3">
                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold">read</span>
                </td>
                <td className="px-4 py-3 text-gray-500">2h ago</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-red-500 hover:underline">Revoke</button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Product-Uploader-Bot</td>
                <td className="px-4 py-3">
                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold">read</span>
                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold ml-1">write</span>
                </td>
                <td className="px-4 py-3 text-gray-500">1d ago</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-red-500 hover:underline">Revoke</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800 leading-relaxed">
          <strong>Security Tip:</strong> Store your API keys securely. Never commit them to version control. If a key is compromised, revoke it immediately from this dashboard.
        </div>
      </main>
    </div>
  );
}