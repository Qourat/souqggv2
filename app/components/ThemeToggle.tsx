"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

/** Toggles light/dark. Persists an explicit preference (not “system”). */
export default function ThemeToggle() {
  const { resolved, setMode } = useTheme();

  return (
    <button
      type="button"
      className="souq-theme-toggle"
      onClick={() => setMode(resolved === "dark" ? "light" : "dark")}
      aria-label={
        resolved === "dark"
          ? "Switch to light theme"
          : "Switch to dark theme"
      }
      title={resolved === "dark" ? "Light mode" : "Dark mode"}
    >
      {resolved === "dark" ? (
        <Sun className="souq-theme-toggle-icon" aria-hidden />
      ) : (
        <Moon className="souq-theme-toggle-icon" aria-hidden />
      )}
    </button>
  );
}
