"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SongCardData } from "./SongCard";
import { SONG_CATEGORY_LABELS, SONG_CATEGORY_CHIP } from "@/lib/domain";
import { resolvePerformed } from "@/lib/song";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { XIcon } from "./icons";

const MIN_SCALE = 0.85;
const MAX_SCALE = 2.4;
const STEP = 0.15;
const FONT_KEY = "rehearsalFontScale";
const ACCENT_KEY = "rehearsalAccent";
const BEATS_KEY = "rehearsalBeats";
const BEATS_OPTIONS = [4, 3, 6, 2];

const clampScale = (n: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(n * 100) / 100));

/**
 * A scheduling metronome built on the Web Audio clock (not setInterval, which
 * drifts). Ticks at `bpm`; the AudioContext is created/resumed inside the user
 * gesture in start() so mobile browsers allow the sound.
 */
function useMetronome(
  bpm: number | null,
  accent: boolean,
  beatsPerBar: number,
) {
  const [running, setRunning] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nextTickRef = useRef(0);
  const beatRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running || !bpm) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const secondsPerBeat = 60 / bpm;
    nextTickRef.current = ctx.currentTime + 0.06;
    beatRef.current = 0;
    const tick = () => {
      while (nextTickRef.current < ctx.currentTime + 0.12) {
        const t = nextTickRef.current;
        // Accent the first beat of each bar — higher pitch, a touch louder.
        const downbeat =
          accent && beatsPerBar > 0 && beatRef.current % beatsPerBar === 0;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = downbeat ? 1600 : 1100;
        const peak = downbeat ? 0.55 : 0.35;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(peak, t + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.06);
        nextTickRef.current += secondsPerBeat;
        beatRef.current += 1;
      }
      timerRef.current = window.setTimeout(tick, 25);
    };
    tick();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [running, bpm, accent, beatsPerBar]);

  useEffect(
    () => () => {
      void ctxRef.current?.close();
    },
    [],
  );

  const start = () => {
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      ctxRef.current = new Ctor();
    }
    void ctxRef.current.resume();
    setRunning(true);
  };
  const stop = () => setRunning(false);
  const toggle = () => (running ? stop() : start());

  return { running, toggle, stop };
}

/** Keep the screen on while the viewer is open, re-acquiring after tab switches. */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    type Sentinel = { release: () => Promise<void> };
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<Sentinel> };
    };
    if (!nav.wakeLock) return;
    let sentinel: Sentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        const s = await nav.wakeLock!.request("screen");
        if (cancelled) void s.release();
        else sentinel = s;
      } catch {
        /* user may have denied, or tab is hidden — harmless */
      }
    };
    void acquire();
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release();
    };
  }, [active]);
}

export default function RehearsalMode({
  songs,
  title,
  onClose,
}: {
  songs: SongCardData[];
  title?: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(() => {
    if (typeof window === "undefined") return 1.1;
    const saved = Number(localStorage.getItem(FONT_KEY));
    return saved ? clampScale(saved) : 1.1;
  });
  const [accent, setAccent] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(ACCENT_KEY) === "1";
  });
  const [beatsPerBar, setBeatsPerBar] = useState(() => {
    if (typeof window === "undefined") return 4;
    const saved = Number(localStorage.getItem(BEATS_KEY));
    return BEATS_OPTIONS.includes(saved) ? saved : 4;
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useFocusTrap(overlayRef, true);
  useWakeLock(true);

  const count = songs.length;
  const song = songs[index];
  const perf = resolvePerformed(song);
  const { running, toggle, stop } = useMetronome(
    perf.performedBpm,
    accent,
    beatsPerBar,
  );

  const toggleAccent = () =>
    setAccent((a) => {
      const next = !a;
      localStorage.setItem(ACCENT_KEY, next ? "1" : "0");
      return next;
    });
  const cycleBeats = () =>
    setBeatsPerBar((b) => {
      const next = BEATS_OPTIONS[(BEATS_OPTIONS.indexOf(b) + 1) % BEATS_OPTIONS.length];
      localStorage.setItem(BEATS_KEY, String(next));
      return next;
    });

  const go = useCallback(
    (next: number) => {
      stop();
      setIndex((i) => {
        const target = Math.min(count - 1, Math.max(0, next));
        return target === i ? i : target;
      });
    },
    [count, stop],
  );

  // Jump back to the top of the chart when the song changes.
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [index]);

  // Lock background scroll while open.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Keyboard: arrows navigate, Escape exits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go, onClose]);

  const changeScale = (delta: number) =>
    setScale((s) => {
      const next = clampScale(s + delta);
      localStorage.setItem(FONT_KEY, String(next));
      return next;
    });

  // Horizontal swipe to move between songs.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go(index + (dx < 0 ? 1 : -1));
    }
    touch.current = null;
  };

  const navBtn =
    "flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-40";
  const ctrlBtn =
    "flex h-10 min-w-10 items-center justify-center rounded-lg border border-border bg-card px-2.5 text-sm font-semibold transition active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Rehearsal${title ? ` — ${title}` : ""}`}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground outline-none"
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between gap-2 border-b border-border px-2 py-2"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Exit rehearsal"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-brand-soft active:scale-90"
        >
          <XIcon size={22} />
        </button>
        <p className="text-sm font-semibold tabular-nums">
          {index + 1} <span className="text-muted">/ {count}</span>
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </div>

      {/* Song + chords */}
      <div
        ref={contentRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="flex-1 overflow-y-auto px-4 py-5"
      >
        <div className="mx-auto max-w-2xl">
          {song.category && (
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${SONG_CATEGORY_CHIP[song.category]}`}
            >
              {SONG_CATEGORY_LABELS[song.category]}
            </span>
          )}
          <h1 className="mt-2 text-display font-bold">{song.title}</h1>
          {song.leaderName && (
            <p className="mt-1 text-sm text-muted">Led by {song.leaderName}</p>
          )}

          {(perf.performedKey || perf.performedBpm != null) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {perf.performedKey && (
                <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-muted ring-1 ring-border">
                  Key {perf.performedKey}
                  {perf.keyTransposed && (
                    <span className="font-normal"> (orig. {perf.origKey})</span>
                  )}
                </span>
              )}
              {perf.performedBpm != null && (
                <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-muted ring-1 ring-border">
                  {perf.performedBpm} BPM
                </span>
              )}
            </div>
          )}

          <div className="mt-5">
            {perf.chordsText ? (
              <pre
                className="whitespace-pre-wrap break-words font-mono leading-relaxed"
                style={{ fontSize: `${scale}rem` }}
              >
                {perf.chordsText}
              </pre>
            ) : perf.chordsImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={perf.chordsImageUrl}
                alt={`Chord chart for ${song.title}`}
                className="w-full rounded-xl border border-border"
              />
            ) : perf.chordsUrl ? (
              <a
                href={perf.chordsUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary"
              >
                Open chord link ↗
              </a>
            ) : (
              <p className="text-muted">No chords for this song.</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div
        className="border-t border-border px-3 pt-2.5"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-2xl space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => changeScale(-STEP)}
              disabled={scale <= MIN_SCALE}
              aria-label="Smaller chords"
              className={ctrlBtn}
            >
              A−
            </button>
            <button
              type="button"
              onClick={() => changeScale(STEP)}
              disabled={scale >= MAX_SCALE}
              aria-label="Larger chords"
              className={`${ctrlBtn} text-base`}
            >
              A+
            </button>
            {perf.performedBpm != null && (
              <>
                <button
                  type="button"
                  onClick={toggle}
                  aria-pressed={running}
                  aria-label={running ? "Stop metronome" : "Start metronome"}
                  className={`${ctrlBtn} gap-1.5 ${
                    running
                      ? "border-primary bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  <span className={running ? "animate-pulse" : ""}>♩</span>
                  {perf.performedBpm}
                </button>
                <button
                  type="button"
                  onClick={toggleAccent}
                  aria-pressed={accent}
                  aria-label="Accent the downbeat"
                  className={`${ctrlBtn} ${
                    accent ? "border-primary text-primary" : ""
                  }`}
                >
                  Accent
                </button>
                {accent && (
                  <button
                    type="button"
                    onClick={cycleBeats}
                    aria-label={`Beats per bar: ${beatsPerBar}`}
                    className={`${ctrlBtn} tabular-nums`}
                  >
                    {beatsPerBar}/4
                  </button>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              className={navBtn}
            >
              ‹ Prev
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === count - 1}
              className={navBtn}
            >
              Next ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
