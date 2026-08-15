import { describe, expect, it } from "vitest";
import { initials } from "@/components/ui";
import { noteTakerId } from "./services";
import type { Assignment } from "./domain";

describe("initials", () => {
  it("takes first and last initials from a full name", () => {
    expect(initials("Juan Dela Cruz", null)).toBe("JC");
  });

  it("uses a single letter for a one-word name", () => {
    expect(initials("Madonna", null)).toBe("M");
  });

  it("ignores extra whitespace", () => {
    expect(initials("  Ana   Reyes  ", null)).toBe("AR");
  });

  it("falls back to the email when there is no name", () => {
    expect(initials(null, "grace@example.com")).toBe("G");
    expect(initials("", "grace@example.com")).toBe("G");
    expect(initials("   ", "grace@example.com")).toBe("G");
  });

  it("degrades to a placeholder when it has nothing to work with", () => {
    expect(initials(null, null)).toBe("?");
  });
});

describe("noteTakerId", () => {
  const assignment = (role: string, member: string) =>
    ({ role_type: role, member_id: member }) as Assignment;

  it("finds the note taker among other roles", () => {
    expect(
      noteTakerId([
        assignment("drummer", "d-1"),
        assignment("note_taker", "n-1"),
        assignment("vocalist", "v-1"),
      ]),
    ).toBe("n-1");
  });

  it("returns null when nobody is taking notes", () => {
    expect(noteTakerId([assignment("drummer", "d-1")])).toBeNull();
    expect(noteTakerId([])).toBeNull();
  });
});
