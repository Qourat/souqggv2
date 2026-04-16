"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminShellBar from "@/app/components/AdminShellBar";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in as admin
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.role === "admin" || String(data.username).toLowerCase() === "qourat") {
            window.location.href = "/admin";
          }
        }
      } catch {
        // Not logged in — show form
      }
    })();
  }, []);

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
        if (data.user?.role === "admin" || String(data.user?.username).toLowerCase() === "qourat") {
          window.location.href = "/admin";
        } else {
          setError("Admin access required. Your account does not have admin privileges.");
        }
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
      <AdminShellBar
        end={
          <Link href="/" className="hover:underline text-xs">
            Back to site
          </Link>
        }
      />

      <main className="max-w-sm mx-auto p-4 mt-20 px-4">
        <div className="text-center mb-8">
          <span className="souq-badge-pill text-xs mb-3 inline-block">Admin</span>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Admin Sign In
          </h1>
          <p className="text-sm text-souq-muted mt-2">
            Access the administration panel
          </p>
        </div>

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
              htmlFor="admin-username"
              className="block text-xs font-bold mb-1 uppercase tracking-wide text-souq-muted"
            >
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-dashed border-souq-border bg-souq-input text-souq-text p-3 rounded-sm text-sm min-h-11 focus:border-souq-terra focus:outline-none"
              placeholder="admin_username"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-bold mb-1 uppercase tracking-wide text-souq-muted"
            >
              Password
            </label>
            <input
              id="admin-password"
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
            {loading ? "Signing in..." : "Sign In to Admin"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-souq-muted hover:underline">
            Regular user login
          </Link>
        </div>
      </main>
    </div>
  );
}