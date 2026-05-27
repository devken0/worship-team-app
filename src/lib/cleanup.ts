// Storage cleanup for the Supabase free tier. In-app audio recordings are the
// only data that meaningfully consumes the 1 GB storage / 5 GB-egress limits;
// they're treated as temporary review material, so old ones auto-expire. Two
// orphan sweeps reclaim files left behind by failed uploads, abandoned chord-
// photo picks, or out-of-band deletions.
//
// SERVER-ONLY: everything here uses the service-role admin client, which
// bypasses RLS so it can remove any object/row regardless of owner.
import { createAdminClient } from "@/lib/supabase/server";

type AdminClient = ReturnType<typeof createAdminClient>;

/** In-app recordings older than this are auto-deleted (file + DB row). */
export const RECORDING_RETENTION_DAYS = 90;

/**
 * Orphan objects younger than this are left alone, so a sweep never races an
 * in-progress upload whose DB row hasn't been written yet (the Recorder uploads
 * the file first, then inserts the row).
 */
const ORPHAN_MIN_AGE_HOURS = 24;

const RECORDINGS_BUCKET = "recordings";
const CHORDS_BUCKET = "chords";
const PAGE_SIZE = 100;

export interface CleanupSummary {
  /** Expired in-app recordings whose file + row were removed. */
  expiredRecordings: number;
  /** Orphaned objects removed from the recordings bucket. */
  recordingOrphans: number;
  /** Orphaned objects removed from the chords bucket. */
  chordOrphans: number;
  errors: string[];
}

function olderThan(iso: string | null | undefined, hours: number): boolean {
  if (!iso) return false; // unknown age → don't touch it, stay safe
  return Date.now() - new Date(iso).getTime() > hours * 3_600_000;
}

/** List every entry under a bucket prefix, paging past the 100-item cap. */
async function listFolder(
  admin: AdminClient,
  bucket: string,
  prefix: string,
) {
  const out: { name: string; id: string | null; created_at: string | null }[] =
    [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(prefix, { limit: PAGE_SIZE, offset });
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return out;
}

/** Remove storage objects in chunks; returns the number removed. */
async function removeObjects(
  admin: AdminClient,
  bucket: string,
  paths: string[],
): Promise<number> {
  let removed = 0;
  for (let i = 0; i < paths.length; i += PAGE_SIZE) {
    const chunk = paths.slice(i, i + PAGE_SIZE);
    const { error } = await admin.storage.from(bucket).remove(chunk);
    if (error) throw new Error(error.message);
    removed += chunk.length;
  }
  return removed;
}

/**
 * Delete in-app recordings older than the retention window — both the storage
 * file and the row. External-link recordings (no storage_path) cost nothing and
 * are left untouched.
 */
export async function pruneExpiredRecordings(
  admin: AdminClient,
): Promise<number> {
  const cutoff = new Date(
    Date.now() - RECORDING_RETENTION_DAYS * 86_400_000,
  ).toISOString();

  const { data, error } = await admin
    .from("recordings")
    .select("id, storage_path")
    .not("storage_path", "is", null)
    .lt("created_at", cutoff);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return 0;

  const paths = data
    .map((r) => r.storage_path as string | null)
    .filter((p): p is string => !!p);
  if (paths.length > 0) await removeObjects(admin, RECORDINGS_BUCKET, paths);

  const ids = data.map((r) => r.id as string);
  const { error: delErr } = await admin
    .from("recordings")
    .delete()
    .in("id", ids);
  if (delErr) throw new Error(delErr.message);

  return ids.length;
}

/**
 * Remove objects in the recordings bucket that no `recordings` row references
 * (e.g. an upload whose row insert failed). Stored as `{serviceId}/{ts}.ext`,
 * so we list one folder level deep.
 */
export async function sweepRecordingOrphans(
  admin: AdminClient,
): Promise<number> {
  const { data: rows, error } = await admin
    .from("recordings")
    .select("storage_path")
    .not("storage_path", "is", null);
  if (error) throw new Error(error.message);
  const referenced = new Set(
    (rows ?? []).map((r) => r.storage_path as string),
  );

  const orphans: string[] = [];
  for (const entry of await listFolder(admin, RECORDINGS_BUCKET, "")) {
    if (entry.id !== null) continue; // a stray root file, not a service folder
    for (const file of await listFolder(admin, RECORDINGS_BUCKET, entry.name)) {
      if (file.id === null) continue; // nested folder, skip
      const path = `${entry.name}/${file.name}`;
      if (!referenced.has(path) && olderThan(file.created_at, ORPHAN_MIN_AGE_HOURS)) {
        orphans.push(path);
      }
    }
  }
  return orphans.length > 0
    ? removeObjects(admin, RECORDINGS_BUCKET, orphans)
    : 0;
}

/**
 * Remove objects in the public chords bucket that neither a per-service `songs`
 * row nor a `library_songs` row references — catches photos uploaded on file
 * pick in a service/library form that was then abandoned without saving.
 */
export async function sweepChordOrphans(admin: AdminClient): Promise<number> {
  const [songRefs, libRefs] = await Promise.all([
    admin.from("songs").select("chords_image_url").not("chords_image_url", "is", null),
    admin
      .from("library_songs")
      .select("chords_image_url")
      .not("chords_image_url", "is", null),
  ]);
  if (songRefs.error) throw new Error(songRefs.error.message);
  if (libRefs.error) throw new Error(libRefs.error.message);
  const referenced = new Set([
    ...(songRefs.data ?? []).map((r) => r.chords_image_url as string),
    ...(libRefs.data ?? []).map((r) => r.chords_image_url as string),
  ]);

  // Chord photos live flat at the bucket root, named `{uuid}.{ext}`, which is
  // exactly the path stored in chords_image_url.
  const orphans = (await listFolder(admin, CHORDS_BUCKET, ""))
    .filter(
      (f) =>
        f.id !== null &&
        !referenced.has(f.name) &&
        olderThan(f.created_at, ORPHAN_MIN_AGE_HOURS),
    )
    .map((f) => f.name);

  return orphans.length > 0 ? removeObjects(admin, CHORDS_BUCKET, orphans) : 0;
}

/**
 * Run all three cleanup tasks. Each is isolated: a failure is recorded and the
 * rest still run, so one bad task never blocks the others.
 */
export async function runAllCleanup(): Promise<CleanupSummary> {
  const admin = createAdminClient();
  const summary: CleanupSummary = {
    expiredRecordings: 0,
    recordingOrphans: 0,
    chordOrphans: 0,
    errors: [],
  };

  type CountKey = Exclude<keyof CleanupSummary, "errors">;
  const tasks: [CountKey, (a: AdminClient) => Promise<number>][] = [
    ["expiredRecordings", pruneExpiredRecordings],
    ["recordingOrphans", sweepRecordingOrphans],
    ["chordOrphans", sweepChordOrphans],
  ];
  for (const [key, fn] of tasks) {
    try {
      summary[key] = await fn(admin);
    } catch (e) {
      summary.errors.push(
        `${key}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  return summary;
}
