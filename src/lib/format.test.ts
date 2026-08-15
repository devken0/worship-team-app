import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatDuration,
  formatRehearsal,
  formatServiceDate,
  formatServiceDateShort,
  isoToManilaInput,
  manilaInputToISO,
  todayInManila,
  youTubeId,
} from "./format";

/**
 * The whole point of these helpers is that everyone on the team sees the same
 * Manila date regardless of what timezone their phone thinks it's in. The suite
 * therefore runs under a non-Manila timezone on purpose (see the `test` script,
 * which pins TZ=America/Los_Angeles) — under Asia/Manila these would pass even
 * when the underlying logic is device-dependent.
 */

describe("formatServiceDate", () => {
  it("names the correct weekday from a plain date", () => {
    expect(formatServiceDate("2026-08-16")).toBe("Sunday, August 16, 2026");
  });

  // Regression: the date string used to be parsed as noon in the *device's*
  // timezone, so on a US phone a Sunday service rendered as "Monday, August 17".
  it("does not roll the date forward on a device west of Manila", () => {
    expect(formatServiceDate("2026-08-16")).toContain("Sunday");
    expect(formatServiceDate("2026-08-16")).toContain("16");
  });

  it("handles a year boundary", () => {
    expect(formatServiceDate("2027-01-01")).toBe("Friday, January 1, 2027");
  });

  it("formats the short variant without the weekday or year", () => {
    expect(formatServiceDateShort("2026-08-16")).toBe("Aug 16");
  });
});

describe("todayInManila", () => {
  afterEach(() => vi.useRealTimers());

  it("returns the Manila date, not the UTC one, late in the UTC day", () => {
    // 20:00 UTC is already 04:00 the next morning in Manila.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T20:00:00Z"));
    expect(todayInManila()).toBe("2026-08-16");
  });

  it("returns the Manila date early in the UTC day", () => {
    // 01:00 UTC is 09:00 the same morning in Manila.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T01:00:00Z"));
    expect(todayInManila()).toBe("2026-08-15");
  });

  it("is always a zero-padded YYYY-MM-DD", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T00:00:00Z"));
    expect(todayInManila()).toBe("2026-03-05");
  });
});

describe("datetime-local round trip", () => {
  it("survives ISO -> input -> ISO unchanged", () => {
    const iso = "2026-08-14T11:00:00.000Z"; // 19:00 Manila
    const input = isoToManilaInput(iso);
    expect(input).toBe("2026-08-14T19:00");
    expect(manilaInputToISO(input)).toBe(iso);
  });

  it("treats the input value as Manila wall-clock time", () => {
    expect(manilaInputToISO("2026-08-14T19:00")).toBe("2026-08-14T11:00:00.000Z");
  });

  it("passes empty values straight through", () => {
    expect(isoToManilaInput(null)).toBe("");
    expect(manilaInputToISO("")).toBeNull();
  });
});

describe("formatRehearsal", () => {
  it("renders an absolute timestamp in Manila time", () => {
    // 11:00 UTC on Friday is 19:00 Manila the same day.
    expect(formatRehearsal("2026-08-14T11:00:00.000Z")).toBe(
      "Fri, Aug 14, 7:00 PM",
    );
  });

  it("returns null when unset", () => {
    expect(formatRehearsal(null)).toBeNull();
  });
});

describe("formatDuration", () => {
  it("zero-pads the seconds", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(600)).toBe("10:00");
  });

  it("renders nothing for missing or nonsense values", () => {
    expect(formatDuration(null)).toBe("");
    expect(formatDuration(0)).toBe("");
    expect(formatDuration(-5)).toBe("");
  });
});

describe("youTubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s", "dQw4w9WgXcQ"],
  ])("extracts the id from %s", (url, id) => {
    expect(youTubeId(url)).toBe(id);
  });

  it("returns null for non-YouTube or missing links", () => {
    expect(youTubeId(null)).toBeNull();
    expect(youTubeId("https://example.com/song")).toBeNull();
  });
});
