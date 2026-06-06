import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the link in Supabase invite / recovery emails. Verifies the one-time
// token to establish a session, then sends the user on to `next`.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/welcome";

  // Build redirects from the public origin, never the request host: behind a
  // reverse proxy (Cloudflare Tunnel) the request reaches the container with
  // its internal host (0.0.0.0:3000), and resolving against that would send the
  // user there. Fall back to the request origin only in local dev (no env set).
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  // `next` is a query param, so only allow a local path — guards against an
  // open redirect to an attacker-supplied absolute URL.
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/welcome";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, base));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=invalid_or_expired_link", base),
  );
}
