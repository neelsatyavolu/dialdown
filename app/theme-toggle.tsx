"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

type Mode = "system" | "light" | "dark";

const ORDER: Mode[] = ["system", "light", "dark"];

const ICONS: Record<Mode, ReactNode> = {
  system: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="2" y="3" width="12" height="8" rx="1.5" />
      <path d="M6 14h4" />
    </svg>
  ),
  light: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6 13 13M3 13l1.4-1.4M11.6 4.4 13 3" />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" />
    </svg>
  ),
};

function readSaved(): Mode {
  try {
    const saved = localStorage.getItem("theme");
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

function apply(mode: Mode) {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
  try {
    localStorage.setItem("theme", mode);
  } catch {
    // Storage can be blocked; the choice then lasts for this page view only.
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  // Tracks the applied mode outside render so quick repeated clicks each advance one step.
  const current = useRef<Mode>("system");

  useEffect(() => {
    current.current = readSaved();
    setMode(current.current);
  }, []);

  const next = () => {
    const nextMode = ORDER[(ORDER.indexOf(current.current) + 1) % ORDER.length];
    current.current = nextMode;
    apply(nextMode);
    setMode(nextMode);
  };

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={next}
      aria-label={`Theme: ${mode}. Switch theme`}
      title={`Theme: ${mode}`}
    >
      {ICONS[mode]}
    </button>
  );
}
