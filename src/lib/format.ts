// Display helpers. All dates are shown in Asia/Manila regardless of the
// viewer's device timezone, since this is a single-locale church team.

const TZ = "Asia/Manila";

export function formatServiceDate(dateStr: string): string {
  // dateStr is a plain date (YYYY-MM-DD); parse as Manila noon to avoid
  // off-by-one from UTC interpretation.
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-PH", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatServiceDateShort(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-PH", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
  });
}

export function formatRehearsal(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Today's date in Manila as YYYY-MM-DD, for "upcoming vs past" comparisons. */
export function todayInManila(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds < 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Philippines has no DST, so a fixed +08:00 offset is exact.
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

/** ISO timestamp → value for a <input type="datetime-local"> in Manila time. */
export function isoToManilaInput(iso: string | null): string {
  if (!iso) return "";
  const shifted = new Date(new Date(iso).getTime() + MANILA_OFFSET_MS);
  return shifted.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
}

/** datetime-local value (interpreted as Manila time) → ISO timestamp. */
export function manilaInputToISO(value: string): string | null {
  if (!value) return null;
  return new Date(`${value}:00+08:00`).toISOString();
}

/** Extract a YouTube video ID from common URL shapes. Returns null if none. */
export function youTubeId(url: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}
