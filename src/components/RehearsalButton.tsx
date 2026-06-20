"use client";

import { useState } from "react";
import type { SongCardData } from "./SongCard";
import RehearsalMode from "./RehearsalMode";
import { buttonStyles } from "./ui";
import { PlayIcon } from "./icons";

/**
 * Launches the full-screen rehearsal viewer for a service's songs (in set
 * order). Renders nothing when there are no songs.
 */
export default function RehearsalButton({
  songs,
  title,
}: {
  songs: SongCardData[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  if (songs.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonStyles({ variant: "primary", full: true })}
      >
        <PlayIcon size={18} />
        Rehearse · {songs.length} song{songs.length > 1 ? "s" : ""}
      </button>
      {open && (
        <RehearsalMode
          songs={songs}
          title={title}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
