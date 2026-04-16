"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

/**
 * Minimal header for auth, checkout, admin shells — matches souq-topbar tokens + theme toggle.
 */
export default function SouqMarketingHeader({
  trailing,
  dense,
}: {
  trailing?: React.ReactNode;
  dense?: boolean;
}) {
  return (
    <header
      className={`souq-topbar ${dense ? "py-1.5" : ""}`}
      aria-label="Site"
    >
      <Link
        href="/"
        className="font-display text-base font-bold tracking-tight"
        style={{ color: "inherit", textDecoration: "none" }}
      >
        SOUQ.GG
      </Link>
      <Link href="/newest">new</Link>
      <span style={{ opacity: 0.65 }} aria-hidden>
        |
      </span>
      <Link href="/categories">categories</Link>
      <Link href="/search">search</Link>
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <ThemeToggle />
        {trailing}
      </div>
    </header>
  );
}
