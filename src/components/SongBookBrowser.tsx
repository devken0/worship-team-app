"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CategoryBadge, EmptyState } from "@/components/ui";
import { SearchIcon, MusicIcon, PlayIcon } from "@/components/icons";
import {
  SONG_CATEGORIES,
  SONG_CATEGORY_LABELS,
  SONG_CATEGORY_CHIP,
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
  /** YouTube video id, for the tile thumbnail; null falls back to a color band. */
  youtubeId: string | null;
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

/** Short, quiet play stat shown top-right of each tile. */
function statLabel(s: BrowserSong): string {
  return s.count === 0 ? "New" : `${s.count}×`;
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((s) => {
            const newSong = s.count === 0;
            return (
              <Link
                key={s.id}
                href={mode === "edit" ? `/manage/songs/${s.id}/edit` : `/songbook/${s.id}`}
                className="block transition hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                  <div className="relative aspect-video">
                    {s.youtubeId ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://i.ytimg.com/vi/${s.youtubeId}/mqdefault.jpg`}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
                            <PlayIcon size={18} />
                          </span>
                        </span>
                      </>
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center ${
                          s.category ? SONG_CATEGORY_CHIP[s.category] : "bg-brand-soft text-primary"
                        }`}
                      >
                        <MusicIcon size={26} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      {s.category ? (
                        <CategoryBadge category={s.category} />
                      ) : (
                        <span />
                      )}
                      <span
                        title={
                          s.lastPlayed
                            ? `${s.count}× · last played ${s.lastPlayed}`
                            : "Not played yet"
                        }
                        className={`shrink-0 text-[11px] font-semibold ${
                          newSong
                            ? "rounded-full bg-brand-soft px-2 py-0.5 text-primary"
                            : "text-muted"
                        }`}
                      >
                        {statLabel(s)}
                      </span>
                    </div>
                    <span className="line-clamp-2 font-medium">{s.title}</span>
                    {s.author && (
                      <span className="line-clamp-1 text-xs text-muted">
                        {s.author}
                      </span>
                    )}
                    {mode === "edit" && (
                      <span className="mt-auto pt-1 text-xs font-medium text-primary">
                        Edit ›
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE)}
              className="col-span-full w-full rounded-xl border border-border bg-card py-3 text-sm font-semibold text-primary transition hover:bg-brand-soft active:scale-[0.99]"
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
