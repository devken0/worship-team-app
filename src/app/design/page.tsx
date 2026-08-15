import { notFound } from "next/navigation";
import {
  Avatar,
  Button,
  Card,
  CategoryBadge,
  ColorChip,
  EmptyState,
  FormMessage,
  Page,
  PageHeader,
  SectionTitle,
  Skeleton,
  buttonStyles,
} from "@/components/ui";
import { Input, Select, Textarea } from "@/components/form";
import { CalendarIcon, MusicIcon } from "@/components/icons";
import { SONG_CATEGORY_LABELS, type SongCategory } from "@/lib/domain";

/**
 * Every design-system primitive on one screen, so a token change can be checked
 * in both themes at a glance instead of by crawling the app. Also the target of
 * the Playwright both-theme screenshots.
 *
 * Dev-only: this is a workbench, not a feature. Delete it if the design system
 * ever stops changing.
 */
export const metadata = { title: "Design system" };

/**
 * Token swatches, grouped the way `globals.css` groups them. The classes are
 * spelled out in full rather than built from the token name — Tailwind scans
 * source text, so an interpolated `bg-${token}` would never be generated.
 */
const SURFACE_TOKENS: [string, string][] = [
  ["background", "bg-background"],
  ["card", "bg-card"],
  ["border", "bg-border"],
  ["muted", "bg-muted"],
  ["foreground", "bg-foreground"],
];
const BRAND_TOKENS: [string, string][] = [
  ["primary", "bg-primary"],
  ["accent", "bg-accent"],
  ["brand", "bg-brand"],
  ["brand-soft", "bg-brand-soft"],
];
const FEEDBACK_TOKENS: [string, string][] = [
  ["danger", "bg-danger"],
  ["danger-soft", "bg-danger-soft"],
  ["success", "bg-success"],
  ["success-soft", "bg-success-soft"],
  ["hero-start", "bg-hero-start"],
  ["hero-end", "bg-hero-end"],
];

function Swatch({ token, className }: { token: string; className: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-8 w-8 shrink-0 rounded-lg border border-border ${className}`}
      />
      <code className="truncate text-xs text-muted">{token}</code>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const categories = Object.keys(SONG_CATEGORY_LABELS) as SongCategory[];

  return (
    <>
      <PageHeader
        title="Design system"
        subtitle="Every primitive, both themes"
        back={{ href: "/", label: "Back to dashboard" }}
      />
      <Page>
        <SectionTitle>Surfaces</SectionTitle>
        <Card className="grid grid-cols-2 gap-3">
          {SURFACE_TOKENS.map(([token, cls]) => (
            <Swatch key={token} token={token} className={cls} />
          ))}
        </Card>

        <SectionTitle>Brand</SectionTitle>
        <Card className="grid grid-cols-2 gap-3">
          {BRAND_TOKENS.map(([token, cls]) => (
            <Swatch key={token} token={token} className={cls} />
          ))}
        </Card>

        <SectionTitle>Feedback</SectionTitle>
        <Card className="grid grid-cols-2 gap-3">
          {FEEDBACK_TOKENS.map(([token, cls]) => (
            <Swatch key={token} token={token} className={cls} />
          ))}
        </Card>

        <SectionTitle>Type scale</SectionTitle>
        <Card className="space-y-1">
          <p className="text-display font-extrabold">Display</p>
          <p className="text-title font-semibold">Title</p>
          <p className="text-base">Body — the default reading size.</p>
          <p className="text-sm text-muted">Small, muted secondary text.</p>
          <p className="text-xs text-muted">Extra small caption.</p>
        </Card>

        <SectionTitle>Buttons</SectionTitle>
        <Card className="space-y-3">
          <Row>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </Row>
          <Row>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button disabled>Disabled</Button>
          </Row>
          <Button full>Full width</Button>
          <a href="#" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Link styled as a button
          </a>
        </Card>

        <SectionTitle>Form fields</SectionTitle>
        <Card className="space-y-3">
          <Input label="Text input" placeholder="e.g. 10,000 Reasons" />
          <Input label="Required field" required placeholder="Needed" />
          <Input
            label="With a hint"
            hint="Explains what goes here."
            placeholder="Optional"
          />
          <Input
            label="With an error"
            error="This field is required."
            defaultValue="Bad value"
          />
          <Input label="Disabled" disabled defaultValue="Can't edit" />
          <Select label="Select">
            <option>Praise</option>
            <option>Worship</option>
          </Select>
          <Textarea label="Textarea" rows={3} placeholder="Longer text…" />
        </Card>

        <SectionTitle>Messages</SectionTitle>
        <Card className="space-y-2">
          <FormMessage tone="error">Something went wrong.</FormMessage>
          <FormMessage tone="success">Saved.</FormMessage>
        </Card>

        <SectionTitle>Badges &amp; chips</SectionTitle>
        <Card className="space-y-3">
          <Row>
            {categories.map((c) => (
              <CategoryBadge key={c} category={c} />
            ))}
          </Row>
          <Row>
            <ColorChip label="Maroon" hex="#7b1f2b" />
            <ColorChip label="White" hex="#ffffff" />
            <ColorChip label={null} hex={null} />
          </Row>
          <Row>
            <Avatar name="Juan Dela Cruz" />
            <Avatar name="Madonna" />
            <Avatar email="grace@example.com" />
          </Row>
        </Card>

        <SectionTitle>Empty states</SectionTitle>
        <div className="space-y-2">
          <EmptyState
            icon={<CalendarIcon size={24} />}
            title="No schedules yet"
            hint="Tap “+ New” to create the first Sunday service."
          />
          <EmptyState
            icon={<MusicIcon size={24} />}
            title="With an action"
            hint="Empty states can offer the next step."
            action={<Button size="sm">Do the thing</Button>}
          />
        </div>

        <SectionTitle>Loading</SectionTitle>
        <Card className="space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </Card>

        <SectionTitle>Focus rings</SectionTitle>
        <Card className="space-y-2">
          <p className="text-sm text-muted">
            Tab through these — the ring offset must match the page background in
            both themes, never a white halo.
          </p>
          <Row>
            <Button variant="primary">Focus me</Button>
            <Button variant="secondary">And me</Button>
            <Button variant="danger">And me</Button>
          </Row>
        </Card>
      </Page>
    </>
  );
}
