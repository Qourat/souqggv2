"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Category {
  id?: string;
  name?: string;
  slug?: string;
  [key: string]: any;
}

interface NavProps {
  categories?: Category[];
  currentUser?: {
    username: string;
    display_name?: string;
  } | null;
}

export default function Nav({ categories = [], currentUser = null }: NavProps) {
  const [catOpen, setCatOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav style={{ background: "#ff6600", padding: "2px 8px", borderBottom: "1px solid #e65c00" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Link href="/" style={{ fontWeight: 700, color: "#000", fontSize: 13, marginRight: 8, textDecoration: "none" }}>
          SOUQ<span style={{ color: "#fff" }}>.GG</span>
        </Link>

        <Link href="/" style={navLinkStyle}>home</Link>
        <Link href="/newest" style={navLinkStyle}>new</Link>

        {/* Categories Dropdown */}
        <div ref={catRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setCatOpen(!catOpen); setUserOpen(false); }}
            style={{ ...navLinkStyle, cursor: "pointer", background: "none", border: "none", font: "inherit" }}
          >
            categories ▾
          </button>
          {catOpen && categories.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, zIndex: 100,
              background: "#f6f6ef", border: "1px solid #bbb", borderRadius: 2,
              boxShadow: "2px 2px 4px rgba(0,0,0,0.15)", minWidth: 180, marginTop: 2,
            }}>
              {categories.map((c) => (
                <Link key={c.id} href={`/categories?cat=${c.slug}`}
                      onClick={() => setCatOpen(false)}
                      style={{ display: "block", padding: "4px 10px", color: "#828282", fontSize: 12, textDecoration: "none" }}>
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/submit" style={navLinkStyle}>submit</Link>

        <div style={{ flex: 1 }} />

        {currentUser ? (
          <div ref={userRef} style={{ position: "relative" }}>
            <button
              onClick={() => { setUserOpen(!userOpen); setCatOpen(false); }}
              style={{ ...navLinkStyle, cursor: "pointer", background: "none", border: "none", font: "inherit", display: "flex", alignItems: "center", gap: 4 }}
            >
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#ff6600", display: "inline-block", border: "1px solid #e65c00" }} />
              {currentUser.display_name || currentUser.username} ▾
            </button>
            {userOpen && (
              <div style={{
                position: "absolute", top: "100%", right: 0, zIndex: 100,
                background: "#f6f6ef", border: "1px solid #bbb", borderRadius: 2,
                boxShadow: "2px 2px 4px rgba(0,0,0,0.15)", minWidth: 150, marginTop: 2,
              }}>
                <Link href={`/u/${currentUser.username}`}
                      onClick={() => setUserOpen(false)}
                      style={{ display: "block", padding: "4px 10px", color: "#828282", fontSize: 12, textDecoration: "none" }}>
                  my profile
                </Link>
                <Link href="/settings"
                      onClick={() => setUserOpen(false)}
                      style={{ display: "block", padding: "4px 10px", color: "#828282", fontSize: 12, textDecoration: "none" }}>
                  settings
                </Link>
                <a href="/api/auth/logout"
                      onClick={() => setUserOpen(false)}
                      style={{ display: "block", padding: "4px 10px", color: "#828282", fontSize: 12, textDecoration: "none" }}>
                  logout
                </a>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/login" style={navLinkStyle}>login</Link>
            <Link href="/signup" style={{ ...navLinkStyle, background: "#fff", padding: "1px 6px", borderRadius: 2, color: "#ff6600" }}>sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const navLinkStyle: React.CSSProperties = {
  color: "#fff",
  fontSize: 12,
  textDecoration: "none",
  padding: "2px 6px",
  whiteSpace: "nowrap",
};