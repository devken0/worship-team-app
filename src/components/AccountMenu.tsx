"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "./ui";
import { ShieldIcon, LogOutIcon } from "./icons";
import ThemeToggle from "./ThemeToggle";
import { signOut } from "@/app/profile/actions";

/** Small inline user glyph for the Profile row. */
function UserGlyph() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
    </svg>
  );
}

/**
 * Header account menu: the initials avatar opens a small dropdown with the
 * signed-in identity, a link to the full Profile page, and a one-tap Sign out.
 * Closes on outside-click or Escape.
 */
export default function AccountMenu({
  name,
  email,
  isAdmin,
}: {
  name: string | null;
  email: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // The avatar is persistent chrome, so it stays on /profile too — but the menu
  // shouldn't link you to the page you're already on. Mark it as current instead.
  const onProfile = usePathname() === "/profile";

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menuItem =
    "flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition hover:bg-brand-soft active:bg-brand-soft";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="-mr-1 flex h-10 w-10 items-center justify-center rounded-full transition active:scale-90"
      >
        <Avatar name={name} email={email} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{name || "Member"}</p>
            {email && <p className="truncate text-xs text-muted">{email}</p>}
            {isAdmin && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                <ShieldIcon size={12} />
                Admin
              </span>
            )}
          </div>

          {onProfile ? (
            <div
              role="menuitem"
              aria-current="page"
              aria-disabled="true"
              className={`${menuItem} cursor-default text-muted hover:bg-transparent active:bg-transparent`}
            >
              <UserGlyph />
              Profile
            </div>
          ) : (
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={menuItem}
            >
              <UserGlyph />
              Profile
            </Link>
          )}

          <div className="border-t border-border px-3 py-2.5">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Theme
            </p>
            <ThemeToggle />
          </div>

          <form action={signOut} className="border-t border-border">
            <button type="submit" role="menuitem" className={`${menuItem} text-danger`}>
              <LogOutIcon size={18} />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
