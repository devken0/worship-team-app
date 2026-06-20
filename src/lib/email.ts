// Thin Resend wrapper. SERVER-ONLY. The rest of the app talks to this, never to
// Resend directly, so the provider can be swapped without touching call sites.
//
// Deliberately fail-soft: every path here returns rather than throws, and when
// RESEND_API_KEY is unset (local dev, preview) it no-ops with a warning. Email
// is a side-effect of a save, never a precondition — a mail outage must not break
// assigning a member or saving minutes.
import { Resend } from "resend";

export interface SendEmailInput {
  /** One or more recipient addresses. Empty/blank entries are dropped. */
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult {
  sent: boolean;
  skipped?: "no-key" | "no-recipients";
  error?: string;
}

function recipients(to: string | string[]): string[] {
  return (Array.isArray(to) ? to : [to]).map((s) => s.trim()).filter(Boolean);
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  // Resend's free tier only delivers from onboarding@resend.dev until a domain
  // is verified; EMAIL_FROM lets the deploy point at a verified sender.
  const from = process.env.EMAIL_FROM ?? "Worship Team <onboarding@resend.dev>";

  const to = recipients(input.to);
  if (to.length === 0) return { sent: false, skipped: "no-recipients" };

  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping "${input.subject}" to ${to.length} recipient(s)`,
    );
    return { sent: false, skipped: "no-key" };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    });
    if (error) {
      console.error(`[email] send failed for "${input.subject}":`, error);
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (err) {
    console.error(`[email] send threw for "${input.subject}":`, err);
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}
