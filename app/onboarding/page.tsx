"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ userId: string; username: string; role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and already a seller
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        if (!data.userId) {
          router.push("/login");
          return;
        }
        setCurrentUser(data);
        if (data.role === "seller" || data.role === "admin") {
          router.push("/submit");
          return;
        }
        setCheckingAuth(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tosAccepted) {
      setError("You must accept the Terms of Service");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/role-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName, bio, tos_accepted: tosAccepted }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/submit");
      } else {
        setError(data.error || "Upgrade failed");
      }
    } catch {
      setError("Network error. Are you logged in?");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#f6f6ef] flex items-center justify-center">
        <p className="text-sm text-gray-500">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6ef] font-sans text-black">
      <nav className="bg-[#ff6600] px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-black overflow-x-auto whitespace-nowrap border-b border-[#e55c00]">
        <Link href="/" className="text-lg mr-2">SOUQ.GG</Link>
        <div className="ml-auto">
          <span className="bg-white px-2 py-0.5 rounded text-xs">Seller Onboarding</span>
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-4 mt-8">
        <h1 className="text-2xl font-bold mb-1">Become a Seller</h1>
        <p className="text-sm text-gray-600 mb-6">Set up your seller profile to start listing digital products on SOUQ.GG.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Profile Details</h2>
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wide">Display Name *</label>
              <input
                type="text"
                name="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded text-sm focus:border-[#ff6600] focus:outline-none"
                placeholder={currentUser?.username || "e.g. CodeWizard"}
                required
              />
              <p className="text-[10px] text-gray-400 mt-1">This is how buyers will see you. Leave blank to use your username.</p>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wide">Bio</label>
              <textarea
                name="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full border border-gray-300 p-2 rounded text-sm focus:border-[#ff6600] focus:outline-none resize-none"
                placeholder="Tell buyers about your expertise and what you sell..."
              />
              <p className="text-[10px] text-gray-400 mt-1 text-right">{bio.length}/500</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Payout Setup</h2>
            <p className="text-xs text-gray-500">We use Stripe Connect to handle payouts. You&apos;ll complete Stripe verification after this step.</p>
            <button
              type="button"
              className="w-full border border-gray-300 bg-white text-sm font-bold py-2 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
              disabled
            >
              <span>🔗 Connect Stripe Express</span>
            </button>
            <p className="text-[10px] text-gray-400">Stripe onboarding opens after seller profile creation.</p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Seller Agreement</h2>
            <div className="flex items-start gap-3">
              <input type="checkbox" id="tos" checked={tosAccepted} onChange={(e) => setTosAccepted(e.target.checked)} className="mt-1 accent-[#ff6600]" />
              <label htmlFor="tos" className="text-xs text-gray-600">
                I agree to the <Link href="/tos" className="text-[#ff6600] hover:underline">Seller Terms of Service</Link> and acknowledge that SOUQ.GG takes a platform fee on all transactions.
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !tosAccepted}
            className="w-full bg-[#ff6600] text-white font-bold py-3 rounded hover:bg-[#e55c00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up..." : "Complete Setup →"}
          </button>
        </form>
      </main>
    </div>
  );
}