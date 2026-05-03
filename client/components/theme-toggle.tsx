"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pc_theme";

type ThemeMode = "dark" | "light";

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    const nextTheme: ThemeMode =
      storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";

    applyTheme(nextTheme);
    setTheme(nextTheme);
    setMounted(true);
  }, []);

  function handleToggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} theme` : "Toggle theme"}
      className="fixed right-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-slate-100 shadow-xl shadow-slate-950/30 backdrop-blur transition hover:border-cyan-300/40 hover:text-cyan-100 sm:right-6 sm:top-6"
    >
      {theme === "dark" ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2.2" />
          <path d="M12 19.3v2.2" />
          <path d="M21.5 12h-2.2" />
          <path d="M4.7 12H2.5" />
          <path d="m18.7 5.3-1.6 1.6" />
          <path d="m6.9 17.1-1.6 1.6" />
          <path d="m18.7 18.7-1.6-1.6" />
          <path d="M6.9 6.9 5.3 5.3" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.8A8.8 8.8 0 1 1 11.2 3a7.2 7.2 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}
