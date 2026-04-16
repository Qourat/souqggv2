"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

/** Admin / ops header: brand, badge, link cluster, theme toggle. */
export default function AdminShellBar({ end }: { end: React.ReactNode }) {
  return (
    <header className="souq-topbar" aria-label="Admin">
      <Link
        href="/"
        className="font-display text-base font-bold tracking-tight"
        style={{ color: "inherit", textDecoration: "none" }}
      >
        SOUQ.GG
      </Link>
      <span className="souq-badge-pill">Admin</span>
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {end}
        <ThemeToggle />
      </div>
    </header>
  );
}
