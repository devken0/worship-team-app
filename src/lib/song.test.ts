import { describe, expect, it } from "vitest";
import { resolvePerformed, type PerformedInput } from "./song";

/**
 * `resolvePerformed` decides what the team actually plays on Sunday from the
 * song's original fields plus optional transposed overrides. The subtle rule —
 * and the reason this is tested — is that once the *key* is transposed, the
 * original chart is in the wrong key and must NOT be used as a fallback.
 */

const base: PerformedInput = {
  originalChordsText: "G  C  D",
  originalChordsImageUrl: "chords/original.png",
  originalChordsUrl: "https://example.com/original",
  originalKey: "G",
  originalBpm: 73,
};

describe("resolvePerformed — no transposition", () => {
  it("performs the original key, tempo and chords", () => {
    const r = resolvePerformed(base);
    expect(r.performedKey).toBe("G");
    expect(r.performedBpm).toBe(73);
    expect(r.chordsText).toBe("G  C  D");
    expect(r.chordsImageUrl).toBe("chords/original.png");
    expect(r.chordsUrl).toBe("https://example.com/original");
  });

  it("does not flag anything as transposed", () => {
    const r = resolvePerformed(base);
    expect(r.keyTransposed).toBe(false);
    expect(r.bpmTransposed).toBe(false);
  });

  it("treats a transposed value equal to the original as not transposed", () => {
    const r = resolvePerformed({ ...base, transposedKey: "G", transposedBpm: 73 });
    expect(r.keyTransposed).toBe(false);
    expect(r.bpmTransposed).toBe(false);
  });

  it("ignores whitespace-only overrides", () => {
    const r = resolvePerformed({ ...base, transposedKey: "   " });
    expect(r.performedKey).toBe("G");
    expect(r.keyTransposed).toBe(false);
  });
});

describe("resolvePerformed — key transposed", () => {
  const transposed: PerformedInput = { ...base, transposedKey: "A" };

  it("performs the transposed key while remembering the original", () => {
    const r = resolvePerformed(transposed);
    expect(r.performedKey).toBe("A");
    expect(r.origKey).toBe("G");
    expect(r.keyTransposed).toBe(true);
  });

  // The important one: original-key chords are wrong once the key moved, so a
  // blank transposed chart must show nothing rather than mislead the player.
  it("does not fall back to original-key chords", () => {
    const r = resolvePerformed(transposed);
    expect(r.chordsText).toBeNull();
    expect(r.chordsImageUrl).toBeNull();
    expect(r.chordsUrl).toBeNull();
  });

  it("uses the transposed chart when one is provided", () => {
    const r = resolvePerformed({
      ...transposed,
      transposedChordsText: "A  D  E",
      transposedChordsImageUrl: "chords/transposed.png",
    });
    expect(r.chordsText).toBe("A  D  E");
    expect(r.chordsImageUrl).toBe("chords/transposed.png");
  });

  it("still carries the original tempo when only the key moved", () => {
    const r = resolvePerformed(transposed);
    expect(r.performedBpm).toBe(73);
    expect(r.bpmTransposed).toBe(false);
  });
});

describe("resolvePerformed — tempo transposed", () => {
  const faster: PerformedInput = { ...base, transposedBpm: 80 };

  it("performs the new tempo and flags it", () => {
    const r = resolvePerformed(faster);
    expect(r.performedBpm).toBe(80);
    expect(r.origBpm).toBe(73);
    expect(r.bpmTransposed).toBe(true);
  });

  // A tempo change leaves the chords valid, so the fallback still applies here.
  it("keeps the original chords, unlike a key change", () => {
    const r = resolvePerformed(faster);
    expect(r.chordsText).toBe("G  C  D");
    expect(r.chordsImageUrl).toBe("chords/original.png");
  });
});

describe("resolvePerformed — sparse songs", () => {
  it("returns nulls rather than throwing when nothing is set", () => {
    const r = resolvePerformed({
      originalChordsText: null,
      originalChordsImageUrl: null,
      originalChordsUrl: null,
    });
    expect(r.performedKey).toBeNull();
    expect(r.performedBpm).toBeNull();
    expect(r.chordsText).toBeNull();
    expect(r.keyTransposed).toBe(false);
  });

  it("does not flag a transposed key when there is no original to compare", () => {
    const r = resolvePerformed({
      originalChordsText: null,
      originalChordsImageUrl: null,
      originalChordsUrl: null,
      transposedKey: "A",
    });
    expect(r.performedKey).toBe("A");
    expect(r.keyTransposed).toBe(false);
  });
});
