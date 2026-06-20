import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sendWeeklyReminder } from "@/lib/notify";

// Weekly reminder, meant to be hit by the same external scheduler that drives
// `/api/cleanup`. No user session is involved, so it's gated by a shared secret
// in the Authorization header: `Authorization: Bearer <secret>`. We reuse
// CLEANUP_SECRET so the deploy manages one token for both cron endpoints.
//
// Schedule it for Saturday morning Manila time; since cron usually runs in UTC,
// that's roughly `0 0 * * 6` (Sat 00:00 UTC ≈ Sat 08:00 Manila).
export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CLEANUP_SECRET;
  if (!secret) return false;
  const provided = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

async function handle(request: NextRequest) {
  if (!process.env.CLEANUP_SECRET) {
    return NextResponse.json(
      { error: "CLEANUP_SECRET is not configured" },
      { status: 503 },
    );
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await sendWeeklyReminder();
  return NextResponse.json(summary);
}

// GET supports schedulers that issue GET (e.g. Vercel Cron); POST is the
// explicit trigger for other schedulers and manual curls.
export const GET = handle;
export const POST = handle;
