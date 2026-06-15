import Link from "next/link";
import Logo from "./Logo";

/** Sticky top header for each screen, with an optional right-side action. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-md items-start justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <Logo size={28} className="shrink-0" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold leading-7">{title}</h1>
            {subtitle && (
              <p className="truncate text-sm text-muted">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-md px-4 py-4">{children}</main>;
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
    <h2 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
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

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-sm focus-visible:ring-primary",
  secondary: "bg-foreground text-background focus-visible:ring-foreground",
  ghost: "text-foreground hover:bg-brand-soft focus-visible:ring-primary",
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
      className={`animate-pulse rounded-md bg-border/70 ${className}`}
    />
  );
}

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
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
    </div>
  );
}
