"use client";

import Link from "next/link";
import { useState } from "react";

type Profile = Record<string, any>;

export default function SettingsPageClient({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({
    display_name: profile.display_name || "",
    headline: profile.headline || "",
    bio: profile.bio || "",
    website: profile.website || "",
    twitter: profile.twitter || "",
    github: profile.github || "",
    location: profile.location || "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setMsg("✓ Saved");
      else setMsg("✗ Error saving");
    } catch {
      setMsg("✗ Network error");
    }
    setSaving(false);
  }

  function f(label: string, key: keyof typeof form, placeholder = "", type = "text") {
    return (
      <tr>
        <td style={{ color: "#828282", fontSize: "9pt", paddingRight: 12, paddingTop: 6, verticalAlign: "top", width: 100 }}>{label}</td>
        <td style={{ paddingTop: 6 }}>
          {key === "bio" ? (
            <textarea
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              rows={4}
              style={{ width: "100%", font: "inherit", fontSize: "9pt", padding: "4px 6px", border: "1px solid #ccc", borderRadius: 2, resize: "vertical" }}
            />
          ) : (
            <input
              type={type}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              style={{ width: "100%", font: "inherit", fontSize: "9pt", padding: "4px 6px", border: "1px solid #ccc", borderRadius: 2 }}
            />
          )}
        </td>
      </tr>
    );
  }

  const displayName = profile.display_name || profile.username;

  return (
    <div className="retro-container">
      {/* Breadcrumb */}
      <div className="retro-meta" style={{ padding: "4px 0", borderBottom: "1px solid #e0e0e0" }}>
        <Link href="/" style={{ color: "#828282" }}>home</Link>
        {" / "}
        <Link href={`/u/${profile.username}`} style={{ color: "#828282" }}>{displayName}</Link>
        {" / "}
        <span style={{ color: "#000" }}>settings</span>
      </div>

      <div style={{ marginTop: 8 }}>
        {/* Profile section */}
        <div className="retro-card" style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e0e0e0", paddingBottom: 4, marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: "10pt", fontWeight: 700 }}>Profile Settings</span>
              <span className="retro-meta" style={{ marginLeft: 8 }}>@{profile.username}</span>
            </div>
            <Link href={`/u/${profile.username}`} style={{ fontSize: "8pt", color: "#ff6600" }}>View Profile →</Link>
          </div>

          <table style={{ width: "100%", borderSpacing: 0 }}>
            <tbody>
              {f("Display Name", "display_name", "Your public name")}
              {f("Headline", "headline", "One-line bio")}
              {f("Bio", "bio", "Tell buyers about yourself")}
              {f("Website", "website", "https://...")}
              {f("Twitter", "twitter", "@handle")}
              {f("GitHub", "github", "username")}
              {f("Location", "location", "City, Country")}
            </tbody>
          </table>
        </div>

        {/* Save */}
        <div style={{ margin: "8px 0", display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={save} disabled={saving} className="retro-btn">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {msg && <span style={{ fontSize: "9pt", color: msg.startsWith("✓") ? "#3a9" : "#c33" }}>{msg}</span>}
        </div>

        {/* Account section */}
        <div className="retro-card" style={{ marginBottom: 4 }}>
          <div style={{ fontSize: "8pt", color: "#828282", fontWeight: 700, borderBottom: "1px solid #e0e0e0", paddingBottom: 2, marginBottom: 6 }}>ACCOUNT</div>
          <table style={{ width: "100%", borderSpacing: 0, fontSize: "9pt" }}>
            <tbody>
              <tr><td style={{ color: "#828282", width: 100, paddingRight: 12 }}>Email</td><td>{profile.email}</td></tr>
              <tr><td style={{ color: "#828282", paddingRight: 12 }}>Role</td><td style={{ textTransform: "capitalize" }}>{profile.role}</td></tr>
              <tr><td style={{ color: "#828282", paddingRight: 12 }}>Joined</td><td>{new Date(profile.created_at).toLocaleDateString()}</td></tr>
              <tr><td style={{ color: "#828282", paddingRight: 12 }}>Products</td><td>{profile.product_count}</td></tr>
              <tr><td style={{ color: "#828282", paddingRight: 12 }}>Sales</td><td>{profile.total_sales}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Danger zone */}
        <div className="retro-card" style={{ marginBottom: 4, borderColor: "#c33" }}>
          <div style={{ fontSize: "8pt", color: "#c33", fontWeight: 700, borderBottom: "1px solid #faa", paddingBottom: 2, marginBottom: 6 }}>DANGER ZONE</div>
          <div style={{ fontSize: "9pt", color: "#828282" }}>
            Account deletion and destructive actions not yet available.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "2px solid #ff6600", marginTop: 12, padding: "6px 0", fontSize: "8pt", color: "#828282" }}>
        <Link href="/">home</Link> |
        <Link href={`/u/${profile.username}`}> my profile</Link> |
        <Link href="/"> SOUQ.GG</Link>
        <br /><span style={{ fontSize: "7pt" }}>© 2026 SOUQ.GG</span>
      </div>
    </div>
  );
}