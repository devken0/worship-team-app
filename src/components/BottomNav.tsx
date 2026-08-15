"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CalendarIcon,
  BookIcon,
  MicIcon,
  SettingsIcon,
} from "./icons";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  match: (path: string) => boolean;
}

const ICON_SIZE = 22;

const items: NavItem[] = [
  {
    href: "/",
    label: "Sunday",
    match: (p) => p === "/",
    icon: <HomeIcon size={ICON_SIZE} />,
  },
  {
    href: "/schedule",
    label: "Schedule",
    match: (p) => p.startsWith("/schedule"),
    icon: <CalendarIcon size={ICON_SIZE} />,
  },
  {
    href: "/songbook",
    label: "Songs",
    match: (p) => p.startsWith("/songbook"),
    icon: <BookIcon size={ICON_SIZE} />,
  },
  {
    href: "/recordings",
    label: "Recordings",
    match: (p) => p.startsWith("/recordings"),
    icon: <MicIcon size={ICON_SIZE} />,
  },
  {
    href: "/manage",
    label: "Manage",
    adminOnly: true,
    match: (p) => p.startsWith("/manage"),
    icon: <SettingsIcon size={ICON_SIZE} />,
  },
  // Profile lives as an initials avatar in the page header, not a nav tab.
];

export default function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  // A password-recovery link signs the user in before they reach /reset-password,
  // so the nav would otherwise show. Hide it: this is a focused step to finish
  // setting a new password, not a place to wander off into the app.
  if (pathname.startsWith("/reset-password")) return null;
  const visible = items.filter((i) => !i.adminOnly || isAdmin);

  return (
    <>
      {/* Spacer in normal flow keeps page content clear of the fixed nav.
          Rendered with the nav so both appear and disappear together. */}
      <div className="has-bottom-nav" aria-hidden />
      <nav
        aria-label="Primary"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
          {visible.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="group flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition active:opacity-60"
                >
                  <span
                    className={`flex items-center rounded-full px-4 py-1 transition active:scale-90 ${
                      active
                        ? "bg-brand-soft text-primary"
                        : "text-muted group-hover:bg-brand-soft/60 group-hover:text-primary"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`transition-colors ${
                      active
                        ? "text-foreground"
                        : "text-muted group-hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
