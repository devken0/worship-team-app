// Shared domain types and labels for the worship team app.
// These mirror the database enums in supabase/migrations/0001_init.sql.

export type UserRole = "admin" | "member";

/** Band / service roles stored in the `assignments` table. */
export type AssignmentRole =
  | "pianist"
  | "bassist"
  | "drummer"
  | "rhythm_guitar"
  | "lead_guitar"
  | "note_taker"
  | "bible_sharer"
  | "backup_singer";

/** Single-person roles, in display order. */
export const SINGLE_ROLES: AssignmentRole[] = [
  "pianist",
  "bassist",
  "drummer",
  "rhythm_guitar",
  "lead_guitar",
  "note_taker",
  "bible_sharer",
];

/** Roles that can have multiple people. */
export const MULTI_ROLES: AssignmentRole[] = ["backup_singer"];

export const ROLE_LABELS: Record<AssignmentRole, string> = {
  pianist: "Pianist",
  bassist: "Bassist",
  drummer: "Drummer",
  rhythm_guitar: "Rhythm Guitar",
  lead_guitar: "Lead Guitar",
  note_taker: "Note-taker (Evaluation)",
  bible_sharer: "Bible Sharer",
  backup_singer: "Backup Singer",
};

/** What a member can play/do — used as tags on their profile. */
export const INSTRUMENT_OPTIONS: string[] = [
  "Piano / Keys",
  "Bass",
  "Drums",
  "Rhythm Guitar",
  "Lead Guitar",
  "Song Leader",
  "Backup Singer",
];

export type SongCategory =
  | "warm_up"
  | "welcoming"
  | "praise"
  | "worship"
  | "closing";

export const SONG_CATEGORIES: SongCategory[] = [
  "warm_up",
  "welcoming",
  "praise",
  "worship",
  "closing",
];

export const SONG_CATEGORY_LABELS: Record<SongCategory, string> = {
  warm_up: "Warm Up",
  welcoming: "Welcoming",
  praise: "Praise",
  worship: "Worship",
  closing: "Closing",
};

/** Common attire colors for the "what to wear" picker (label + hex). */
export const WEAR_COLORS: { label: string; hex: string }[] = [
  { label: "White", hex: "#ffffff" },
  { label: "Black", hex: "#1f2937" },
  { label: "Red", hex: "#dc2626" },
  { label: "Maroon", hex: "#7f1d1d" },
  { label: "Blue", hex: "#2563eb" },
  { label: "Navy", hex: "#1e3a8a" },
  { label: "Green", hex: "#16a34a" },
  { label: "Yellow", hex: "#eab308" },
  { label: "Gold", hex: "#b59410" },
  { label: "Pink", hex: "#ec4899" },
  { label: "Purple", hex: "#7c3aed" },
  { label: "Gray", hex: "#6b7280" },
  { label: "Beige", hex: "#d6c7a1" },
];

// ---- Row shapes (subset of columns we read in the UI) ----

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  instruments: string[];
}

export interface Service {
  id: string;
  service_date: string; // YYYY-MM-DD
  rehearsal_at: string | null; // ISO timestamp
  rehearsal_location: string | null;
  wear_color_label: string | null;
  wear_color_hex: string | null;
  notes: string | null;
}

export interface Assignment {
  id: string;
  service_id: string;
  role_type: AssignmentRole;
  member_id: string | null;
}

export interface Song {
  id: string;
  service_id: string;
  title: string;
  category: SongCategory;
  position: number;
  song_leader_id: string | null;
  /** Songwriter or original artist; copied from the book or typed for a one-off. */
  author: string | null;
  /** Original musical key, e.g. "G" or "Bb" (DB column is `song_key`). */
  song_key: string | null;
  /** Original tempo in beats per minute. */
  bpm: number | null;
  /** Performed key when transposed off the original, or null to use the original. */
  transposed_key: string | null;
  /** Performed tempo when changed off the original, or null to use the original. */
  transposed_bpm: number | null;
  /** Free-text notes for the team (arrangement reminders, cues, etc.). */
  notes: string | null;
  youtube_url: string | null;
  chords_text: string | null;
  /** Storage path of the chord-chart photo in the public `chords` bucket. */
  chords_image_url: string | null;
  /** External link to published chords (clickable). */
  chords_url: string | null;
  /** Song-book entry this song was copied from, or null for a one-off. */
  library_song_id: string | null;
}

/** A reusable song in the team's song book (library), kept canonical. */
export interface LibrarySong {
  id: string;
  title: string;
  /** Optional default category, used as the picker's initial pick. */
  default_category: SongCategory | null;
  /** Songwriter or original artist. */
  author: string | null;
  /** Original musical key, e.g. "G" or "Bb" (DB column is `song_key`). */
  song_key: string | null;
  /** Original tempo in beats per minute. */
  bpm: number | null;
  /** Team-default performed key when transposed off the original, or null. */
  transposed_key: string | null;
  /** Team-default performed tempo when changed off the original, or null. */
  transposed_bpm: number | null;
  /** Free-text notes for the team (arrangement reminders, cues, etc.). */
  notes: string | null;
  youtube_url: string | null;
  chords_text: string | null;
  /** Storage path of the chord-chart photo in the public `chords` bucket. */
  chords_image_url: string | null;
  /** External link to published chords. */
  chords_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recording {
  id: string;
  service_id: string;
  title: string;
  storage_path: string | null;
  external_url: string | null;
  duration_seconds: number | null;
  created_by: string | null;
  created_at: string;
}

/** Evaluation meeting minutes for a service (one row per service). */
export interface Evaluation {
  id: string;
  service_id: string;
  comments: string;
  recommendations: string;
  action_items: string;
  problems: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** The four free-text sections of the minutes, in template order. */
export type EvaluationSectionKey =
  | "comments"
  | "recommendations"
  | "action_items"
  | "problems";

export const EVALUATION_SECTIONS: {
  key: EvaluationSectionKey;
  label: string;
}[] = [
  { key: "comments", label: "Comments (Positive & Negative)" },
  { key: "recommendations", label: "Recommendations and Suggestions" },
  { key: "action_items", label: "Assignment/s if applicable" },
  { key: "problems", label: "Problems to be solved" },
];
