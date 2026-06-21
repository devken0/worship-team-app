import Link from "next/link";
import Logo from "./Logo";
import { ChevronLeftIcon } from "./icons";

/**
 * Sticky top header for each screen, with an optional right-side action.
 * Pass `back` on nested screens (anything not reachable from the bottom nav)
 * so there's a visible way back — the app installs as a PWA with no browser
 * chrome. The back chevron takes the logo's place on those screens.
 */
export function PageHeader({
  title,
  subtitle,
  action,
  avatar,
  back,
}: {
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  /** Account affordance shown at the far right of top-level screens. */
  avatar?: React.ReactNode;
  back?: { href: string; label?: string };
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {back ? (
            <Link
              href={back.href}
              aria-label={back.label ?? "Go back"}
              className="-ml-1 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-brand-soft active:scale-90"
            >
              <ChevronLeftIcon size={22} />
            </Link>
          ) : (
            <Logo size={28} className="shrink-0" />
          )}
          <div className="min-w-0">
            <h1 className="truncate text-title font-semibold">{title}</h1>
            {subtitle && (
              <p className="truncate text-sm text-muted">{subtitle}</p>
            )}
          </div>
        </div>
        {(action || avatar) && (
          <div className="flex shrink-0 items-center gap-1.5">
            {action}
            {avatar}
          </div>
        )}
      </div>
    </header>
  );
}

/** Derive up-to-two-letter initials from a name, falling back to email. */
export function initials(name?: string | null, email?: string | null) {
  const source = (name || "").trim();
  if (source) {
    const parts = source.split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return (first + last).toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
}

/** Round initials avatar. Pass `as="link"` semantics by wrapping in a Link. */
export function Avatar({
  name,
  email,
  className = "",
}: {
  name?: string | null;
  email?: string | null;
  className?: string;
}) {
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-primary ring-1 ring-border ${className}`}
    >
      {initials(name, email)}
    </span>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-2xl px-4 py-4">{children}</main>;
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-4 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
      {/* Small gold tick ties each section back to the logo palette and breaks
          up otherwise-monotonous stacks of cards. */}
      <span aria-hidden="true" className="h-3.5 w-1 rounded-full bg-brand" />
      {children}
    </h2>
  );
}

/** A small swatch + label for the "what to wear" color. */
export function ColorChip({
  label,
  hex,
}: {
  label: string | null;
  hex: string | null;
}) {
  if (!label && !hex) return <span className="text-muted">—</span>;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm font-medium">
      <span
        className="h-4 w-4 rounded-full border border-black/10"
        style={{ backgroundColor: hex ?? "transparent" }}
      />
      {label ?? hex}
    </span>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-sm focus-visible:ring-primary",
  // Quiet, bordered neutral — lighter weight than a solid dark slab.
  secondary:
    "border border-border bg-card text-foreground hover:bg-brand-soft/60 focus-visible:ring-primary",
  ghost: "text-foreground hover:bg-brand-soft focus-visible:ring-primary",
  danger:
    "border border-danger/30 bg-card text-danger hover:bg-danger-soft focus-visible:ring-danger",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-4 py-3 text-base",
};

/** Shared button/link className. Use directly on `<Link>`; `<Button>` wraps it. */
export function buttonStyles({
  variant = "primary",
  size = "md",
  full = false,
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  className?: string;
} = {}) {
  return [
    "inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    full ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant,
  size,
  full,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}) {
  return (
    <button
      className={buttonStyles({ variant, size, full, className })}
      {...props}
    />
  );
}

export function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonStyles({ size: "sm" })}>
      {children}
    </Link>
  );
}

/** A pulsing placeholder block for loading skeletons. Pass sizing via className. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-border/70 ${className}`}
    />
  );
}

/**
 * Inline form feedback — the single source of truth for the red/green message
 * blocks scattered across forms. `tone` routes through semantic tokens so it
 * adapts to dark mode.
 */
export function FormMessage({
  tone = "error",
  children,
  className = "",
}: {
  tone?: "error" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    error: "bg-danger-soft text-danger",
    success: "bg-success-soft text-success",
  };
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg px-3 py-2 text-sm ${tones[tone]} ${className}`}
    >
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
      {icon && (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-primary">
          {icon}
        </div>
      )}
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
