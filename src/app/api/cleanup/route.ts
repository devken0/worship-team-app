import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runAllCleanup } from "@/lib/cleanup";

// Unattended storage cleanup, meant to be hit by a scheduler (Vercel Cron, a
// GitHub Actions cron, etc.). No user session is involved, so it's gated by a
// shared secret in the Authorization header: `Authorization: Bearer <secret>`.
// On Vercel, set an env var named CRON_SECRET to the same value and Vercel adds
// that header automatically for scheduled invocations.
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
  const summary = await runAllCleanup();
  return NextResponse.json(summary);
}

// GET supports Vercel Cron (which issues GET); POST is the explicit, semantic
// trigger for other schedulers and manual curls.
export const GET = handle;
export const POST = handle;
