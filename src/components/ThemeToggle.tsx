"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon, MonitorIcon } from "./icons";
import { applyResolvedTheme, THEME_STORAGE_KEY } from "@/lib/theme";

type Theme = "light" | "dark" | "system";

/** Resolve a choice to the concrete theme and apply it to <html>. */
function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  applyResolvedTheme(dark);
}

const OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <SunIcon size={16} /> },
  { value: "dark", label: "Dark", icon: <MoonIcon size={16} /> },
  { value: "system", label: "Auto", icon: <MonitorIcon size={16} /> },
];

/**
 * Segmented Light / Dark / Auto control. Persists the choice to localStorage and
 * applies it immediately; the no-FOUC script in the root layout reads the same
 * key on the next load. While on "Auto" it tracks live OS theme changes.
 */
export default function ThemeToggle() {
  // Lazy init from storage. Safe here because the toggle only mounts client-side
  // (inside the account dropdown), so there's no SSR hydration mismatch.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  });

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const choose = (next: Theme) => {
    setTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex gap-1 rounded-xl bg-background p-1"
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(opt.value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              active
                ? "bg-card text-primary shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
