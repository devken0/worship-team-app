/**
 * Shared resolution of a song's *performed* key / tempo / chords from its
 * original + transposed fields. Used by both the song card and the rehearsal
 * viewer so the two never drift.
 */
export interface PerformedInput {
  originalChordsText: string | null;
  originalChordsImageUrl: string | null;
  originalChordsUrl: string | null;
  transposedChordsText?: string | null;
  transposedChordsImageUrl?: string | null;
  transposedChordsUrl?: string | null;
  originalKey?: string | null;
  originalBpm?: number | null;
  transposedKey?: string | null;
  transposedBpm?: number | null;
}

export interface Performed {
  origKey: string | null;
  performedKey: string | null;
  keyTransposed: boolean;
  origBpm: number | null;
  performedBpm: number | null;
  bpmTransposed: boolean;
  chordsText: string | null;
  chordsImageUrl: string | null;
  chordsUrl: string | null;
}

export function resolvePerformed(song: PerformedInput): Performed {
  // Performed value = transposed override when set, else the original.
  const origKey = song.originalKey?.trim() || null;
  const transKey = song.transposedKey?.trim() || null;
  const performedKey = transKey ?? origKey;
  const keyTransposed = !!(transKey && origKey && transKey !== origKey);

  const origBpm = song.originalBpm ?? null;
  const transBpm = song.transposedBpm ?? null;
  const performedBpm = transBpm ?? origBpm;
  const bpmTransposed =
    transBpm != null && origBpm != null && transBpm !== origBpm;

  // Performed chords = the transposed chart when present, else the original
  // (per field). But once the *key* is transposed, the original chart is in the
  // wrong key, so we don't fall back to it — a blank transposed field shows
  // nothing rather than misleading original-key chords. (A BPM-only change keeps
  // the chords valid, so the fallback still applies there.)
  const origChordsText = keyTransposed ? null : song.originalChordsText;
  const origChordsImageUrl = keyTransposed ? null : song.originalChordsImageUrl;
  const origChordsUrl = keyTransposed ? null : song.originalChordsUrl;

  const chordsText = song.transposedChordsText?.trim() || origChordsText;
  const chordsImageUrl = song.transposedChordsImageUrl ?? origChordsImageUrl;
  const chordsUrl = song.transposedChordsUrl?.trim() || origChordsUrl;

  return {
    origKey,
    performedKey,
    keyTransposed,
    origBpm,
    performedBpm,
    bpmTransposed,
    chordsText,
    chordsImageUrl,
    chordsUrl,
  };
}
