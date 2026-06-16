"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, EmptyState } from "@/components/ui";
import { SearchIcon, MusicIcon } from "@/components/icons";
import { formatServiceDateShort } from "@/lib/format";
import {
  SONG_CATEGORIES,
  SONG_CATEGORY_LABELS,
  type SongCategory,
} from "@/lib/domain";

/** One row in the browsable song book, with its play stats pre-computed. */
export interface BrowserSong {
  id: string;
  title: string;
  author: string | null;
  category: SongCategory | null;
  /** Times played (distinct services). */
  count: number;
  /** Last-played service date (YYYY-MM-DD), or null if never played. */
  lastPlayed: string | null;
}

type SortKey = "title" | "recent" | "least" | "most";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "title", label: "Title (A–Z)" },
  { key: "recent", label: "Recently played" },
  { key: "least", label: "Least recently played" },
  { key: "most", label: "Most played" },
];

const PAGE = 20;

/** Sort by last-played date, most recent first; never-played sinks to the end. */
function cmpRecent(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? 1 : -1;
}

/** "Due for rotation" first: never-played, then oldest last-played. */
function cmpLeast(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  return a < b ? -1 : 1;
}

function metaLine(s: BrowserSong): string {
  const parts: string[] = [];
  if (s.category) parts.push(SONG_CATEGORY_LABELS[s.category]);
  if (s.count === 0) {
    parts.push("Not played yet");
  } else {
    const times = `${s.count}×`;
    parts.push(
      s.lastPlayed
        ? `${times} · last ${formatServiceDateShort(s.lastPlayed)}`
        : times,
    );
  }
  return parts.join(" · ");
}

export default function SongBookBrowser({
  songs,
  mode,
}: {
  songs: BrowserSong[];
  /** "edit" links each row to the admin editor; "view" to the read-only page. */
  mode: "view" | "edit";
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SongCategory | null>(null);
  const [sort, setSort] = useState<SortKey>("title");
  const [limit, setLimit] = useState(PAGE);

  // Any change to the filter/sort starts the list back at the first page.
  const changeQuery = (v: string) => {
    setQuery(v);
    setLimit(PAGE);
  };
  const changeCategory = (c: SongCategory | null) => {
    setCategory(c);
    setLimit(PAGE);
  };
  const changeSort = (s: SortKey) => {
    setSort(s);
    setLimit(PAGE);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = songs.filter((s) => {
      if (category && s.category !== category) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        (s.author?.toLowerCase().includes(q) ?? false)
      );
    });
    return list.sort((a, b) => {
      switch (sort) {
        case "recent":
          return cmpRecent(a.lastPlayed, b.lastPlayed) || a.title.localeCompare(b.title);
        case "least":
          return cmpLeast(a.lastPlayed, b.lastPlayed) || a.title.localeCompare(b.title);
        case "most":
          return b.count - a.count || a.title.localeCompare(b.title);
        default:
          return a.title.localeCompare(b.title);
      }
    });
  }, [songs, query, category, sort]);

  const visible = filtered.slice(0, limit);
  const remaining = filtered.length - visible.length;
  const countLabel =
    filtered.length === songs.length
      ? `${songs.length}`
      : `${filtered.length} of ${songs.length}`;

  return (
    <div className="space-y-3">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
          <SearchIcon size={18} />
        </span>
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          placeholder="Search songs or authors"
          aria-label="Search songs or authors"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-brand-soft"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={category === null} onClick={() => changeCategory(null)}>
          All
        </Chip>
        {SONG_CATEGORIES.map((c) => (
          <Chip
            key={c}
            active={category === c}
            onClick={() => changeCategory(category === c ? null : c)}
          >
            {SONG_CATEGORY_LABELS[c]}
          </Chip>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Songs ({countLabel})
        </h2>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <span className="sr-only">Sort by</span>
          <select
            value={sort}
            onChange={(e) => changeSort(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MusicIcon size={24} />}
          title="No matches"
          hint="Try a different search or clear the category filter."
        />
      ) : (
        <div className="space-y-2">
          {visible.map((s) => (
            <Link
              key={s.id}
              href={mode === "edit" ? `/manage/songs/${s.id}/edit` : `/songbook/${s.id}`}
              className="block transition hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <Card className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{s.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {metaLine(s)}
                  </span>
                </span>
                <span className="shrink-0 text-muted">
                  {mode === "edit" ? "Edit ›" : "›"}
                </span>
              </Card>
            </Link>
          ))}
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE)}
              className="w-full rounded-xl border border-border bg-card py-3 text-sm font-semibold text-primary transition hover:bg-brand-soft active:scale-[0.99]"
            >
              Load {Math.min(PAGE, remaining)} more · {remaining} left
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition active:scale-95 ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "border border-border bg-card text-muted hover:bg-brand-soft hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
