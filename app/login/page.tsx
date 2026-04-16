"use client";

import { useState } from "react";
import Link from "next/link";
import SouqMarketingHeader from "@/app/components/SouqMarketingHeader";

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
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <SouqMarketingHeader
        trailing={<span className="souq-badge-pill">Sign in</span>}
      />

      <main className="max-w-sm mx-auto p-4 mt-16 px-4">
        <h1 className="font-display text-2xl font-bold mb-6 text-center tracking-tight">
          Sign in to SOUQ.GG
        </h1>

        {error && (
          <div
            role="alert"
            className="bg-souq-error-bg border border-dashed border-souq-border text-souq-error-text text-sm p-3 rounded-sm mb-4"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-username"
              className="block text-xs font-bold mb-1 uppercase tracking-wide text-souq-muted"
            >
              Username
            </label>
            <input
              id="login-username"
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-dashed border-souq-border bg-souq-input text-souq-text p-3 rounded-sm text-sm min-h-11 focus:border-souq-terra focus:outline-none"
              placeholder="your_username"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-bold mb-1 uppercase tracking-wide text-souq-muted"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-dashed border-souq-border bg-souq-input text-souq-text p-3 rounded-sm text-sm min-h-11 focus:border-souq-terra focus:outline-none"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full retro-btn text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-souq-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-souq-terra font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
