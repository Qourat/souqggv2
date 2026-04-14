"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = "/";
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6ef] font-sans text-black">
      <nav className="bg-[#ff6600] px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-black overflow-x-auto whitespace-nowrap border-b border-[#e55c00]">
        <Link href="/" className="text-lg mr-2">SOUQ.GG</Link>
        <Link href="/" className="hover:underline">new</Link>
        <span>|</span>
        <Link href="/categories" className="hover:underline">categories</Link>
        <div className="ml-auto">
          <span className="bg-white px-2 py-0.5 rounded text-xs font-bold">Login</span>
        </div>
      </nav>

      <main className="max-w-sm mx-auto p-4 mt-16">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in to SOUQ.GG</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1 uppercase tracking-wide">Username</label>
            <input
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-sm focus:border-[#ff6600] focus:outline-none"
              placeholder="your_username"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 uppercase tracking-wide">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-sm focus:border-[#ff6600] focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff6600] text-white font-bold py-2.5 rounded hover:bg-[#e55c00] transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#ff6600] hover:underline">Sign up</Link>
          </p>
        </div>


      </main>
    </div>
  );
}