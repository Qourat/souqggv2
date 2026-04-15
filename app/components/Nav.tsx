"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

interface Category {
  id?: string;
  name?: string;
  slug?: string;
  [key: string]: unknown;
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
    <nav className="souq-nav" aria-label="Primary">
      <div className="souq-nav-inner">
        <Link href="/" className="souq-nav-logo">
          SOUQ<span className="accent">.GG</span>
        </Link>

        <Link href="/" className="souq-nav-link">
          home
        </Link>
        <Link href="/newest" className="souq-nav-link">
          new
        </Link>
        <Link href="/search" className="souq-nav-link">
          search
        </Link>

        <div ref={catRef} className="dropdown-parent">
          <button
            type="button"
            onClick={() => {
              setCatOpen(!catOpen);
              setUserOpen(false);
            }}
            className="souq-nav-btn"
            aria-expanded={catOpen}
            aria-haspopup="true"
          >
            categories {"\u25BE"}
          </button>
          {catOpen && categories.length > 0 && (
            <div className="souq-nav-dropdown" style={{ left: 0 }}>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categories?cat=${c.slug}`}
                  onClick={() => setCatOpen(false)}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/submit" className="souq-nav-link">
          submit
        </Link>

        <div style={{ flex: 1 }} />

        <ThemeToggle />

        {currentUser ? (
          <div ref={userRef} className="dropdown-parent">
            <button
              type="button"
              onClick={() => {
                setUserOpen(!userOpen);
                setCatOpen(false);
              }}
              className="souq-nav-btn"
              aria-expanded={userOpen}
              aria-haspopup="true"
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "var(--nav-fg-muted)",
                  display: "inline-block",
                  border: "1px solid var(--nav-border)",
                }}
                aria-hidden
              />
              {currentUser.display_name || currentUser.username} {"\u25BE"}
            </button>
            {userOpen && (
              <div className="souq-nav-dropdown" style={{ right: 0, left: "auto" }}>
                <Link href={`/u/${currentUser.username}`} onClick={() => setUserOpen(false)}>
                  my profile
                </Link>
                <Link href="/settings" onClick={() => setUserOpen(false)}>
                  settings
                </Link>
                <Link href="/agent/keys" onClick={() => setUserOpen(false)}>
                  agent keys
                </Link>
                <a href="/api/auth/logout" onClick={() => setUserOpen(false)}>
                  logout
                </a>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/login" className="souq-nav-link">
              login
            </Link>
            <Link href="/signup" className="souq-nav-link souq-nav-link-cta">
              sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
