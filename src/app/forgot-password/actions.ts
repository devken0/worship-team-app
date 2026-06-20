"use server";

import { createClient } from "@/lib/supabase/server";

export interface ForgotPasswordState {
  error?: string;
  sent?: boolean;
}

export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Please enter your email address." };

  const supabase = await createClient();

  // The recovery email links through /auth/confirm (it verifies the OTP and
  // establishes a session) then on to /reset-password. The recovery email
  // template must point at /auth/confirm with token_hash/type, mirroring the
  // invite template — see README.
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/confirm?next=/reset-password`,
  });

  // Don't reveal whether the address belongs to a real account — always report
  // success so the page can't be used to probe for members.
  if (error && error.status && error.status >= 500) {
    return { error: "Something went wrong. Please try again." };
  }
  return { sent: true };
}
