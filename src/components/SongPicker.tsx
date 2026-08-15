"use client";

import { useMemo, useState } from "react";
import { SearchIcon, MusicIcon } from "@/components/icons";
import { SONG_CATEGORY_LABELS, type LibrarySong } from "@/lib/domain";

/**
 * Search-and-add control for pulling a song out of the song book into a service.
 *
 * Replaces a native <select> listing every song. A picker is a choice, not a
 * scroll: by the time the book holds a few dozen entries, finding "10,000
 * Reasons" in an OS dropdown is slower than typing it — and the alternative
 * (retyping fourteen fields into a blank song) is worse still. This is the path
 * admins should take most of the time, so it's the loud one.
 */
export default function SongPicker({
  songs,
  onPick,
  disabledIds,
}: {
  songs: LibrarySong[];
  onPick: (song: LibrarySong) => void;
  /** Song-book ids already on this service, shown as "added" rather than hidden. */
  disabledIds?: Set<string>;
}) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return songs
      .filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.author?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 8);
  }, [songs, query]);

  if (songs.length === 0) return null;

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
          <SearchIcon size={18} />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Add from the song book (${songs.length})`}
          aria-label="Search the song book to add a song"
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-brand-soft"
        />
      </div>

      {query.trim() && (
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card">
          {matches.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">
              Nothing in the song book matches “{query.trim()}”. Add it as a new
              song below.
            </p>
          ) : (
            <ul>
              {matches.map((s) => {
                const already = disabledIds?.has(s.id);
                return (
                  <li key={s.id} className="border-b border-border last:border-0">
                    <button
                      type="button"
                      disabled={already}
                      onClick={() => {
                        onPick(s);
                        setQuery("");
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-brand-soft disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-primary">
                        <MusicIcon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {s.title}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {[
                            s.author,
                            s.default_category
                              ? SONG_CATEGORY_LABELS[s.default_category]
                              : null,
                            s.song_key ? `Key ${s.song_key}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "In the song book"}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-primary">
                        {already ? "Added" : "Add"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
