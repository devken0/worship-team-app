// Branded HTML email layout for app notifications, matching the Supabase auth
// templates in supabase/templates/ (same palette, logo, rounded card). Keep the
// two visually in sync if either changes — they're the team's whole email look.
//
// Email HTML is its own dialect: table-based layout, inline styles, no external
// CSS. Everything dynamic MUST go through esc()/escMultiline() — these strings
// are rendered as HTML by mail clients, so unescaped user content (song titles,
// service notes) would break or inject markup.

const BRAND = {
  bg: "#faf8f4",
  orange: "#d9620a",
  card: "#ffffff",
  border: "#ece6dd",
  ink: "#1c1a17",
  muted: "#857c6e",
  font: "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
} as const;

/** Escape a single line of user/text content for safe HTML interpolation. */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape, then turn newlines into <br> (for multi-line notes/action items). */
export function escMultiline(s: string): string {
  return esc(s).replace(/\r?\n/g, "<br />");
}

/** A body paragraph. Pass muted for secondary text. */
export function paragraph(html: string, opts?: { muted?: boolean }): string {
  const color = opts?.muted ? BRAND.muted : BRAND.ink;
  return `<p style="margin:0 0 16px; font-family:${BRAND.font}; font-size:16px; line-height:1.55; color:${color};">${html}</p>`;
}

/** A small section heading like "Assignments". */
export function subheading(text: string): string {
  return `<p style="margin:18px 0 8px; font-family:${BRAND.font}; font-size:13px; font-weight:700; letter-spacing:0.03em; text-transform:uppercase; color:${BRAND.muted};">${esc(text)}</p>`;
}

/** Rows of "Label: value" (e.g. role assignments). Values may contain HTML. */
export function labeledRows(rows: { label: string; value: string }[]): string {
  const items = rows
    .map(
      (r) =>
        `<p style="margin:0 0 6px; font-family:${BRAND.font}; font-size:15px; line-height:1.5; color:${BRAND.ink};"><strong>${esc(r.label)}:</strong> ${r.value}</p>`,
    )
    .join("");
  return items;
}

/** An ordered list (e.g. the song set). Items may contain HTML. */
export function orderedList(items: string[]): string {
  const lis = items
    .map(
      (i) =>
        `<li style="margin:0 0 5px;">${i}</li>`,
    )
    .join("");
  return `<ol style="margin:0 0 16px; padding-left:20px; font-family:${BRAND.font}; font-size:15px; line-height:1.6; color:${BRAND.ink};">${lis}</ol>`;
}

export interface EmailContent {
  /** Inbox-preview text, hidden in the body. */
  preheader: string;
  /** Card title (may include an emoji). */
  heading: string;
  /** Inner HTML beneath the heading — build with the helpers above. */
  bodyHtml: string;
  /** Primary call-to-action. */
  button?: { label: string; href: string };
  /** Override the default footer note. */
  footerNote?: string;
}

/**
 * Wrap content in the full branded email document. `siteUrl` resolves the logo
 * and the "manage email" link; pass the already-trimmed origin.
 */
export function renderEmail(content: EmailContent, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  const button = content.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 4px;">
                  <tr>
                    <td align="center" bgcolor="${BRAND.orange}" style="border-radius:9999px;">
                      <a href="${esc(content.button.href)}" style="display:inline-block; padding:14px 32px; font-family:${BRAND.font}; font-size:16px; font-weight:600; line-height:1; color:#ffffff; text-decoration:none; border-radius:9999px;">${esc(content.button.label)}</a>
                    </td>
                  </tr>
                </table>`
    : "";

  const footer =
    content.footerNote ??
    `You're getting this because you're on the worship team. To stop these emails, turn off "Email me reminders" in <a href="${base}/profile" style="color:${BRAND.muted}; text-decoration:underline;">your profile</a>.`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>${esc(content.heading)}</title>
    <style>
      @media only screen and (max-width: 600px) {
        .card { padding: 28px 22px !important; }
        .wrap { padding: 20px 12px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:${BRAND.bg}; -webkit-text-size-adjust:100%;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:${BRAND.bg}; font-size:1px; line-height:1px;">${esc(content.preheader)}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.bg};">
      <tr>
        <td align="center" class="wrap" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%;">

            <tr>
              <td align="center" style="padding:8px 0 20px;">
                <img src="${base}/logo.png" width="56" height="56" alt="Worship Team" style="display:block; border:0; outline:none; text-decoration:none; width:56px; height:auto; margin:0 auto 10px;" />
                <div style="font-family:${BRAND.font}; font-size:18px; font-weight:700; letter-spacing:-0.01em; color:${BRAND.orange};">Worship Team</div>
              </td>
            </tr>

            <tr>
              <td class="card" style="background-color:${BRAND.card}; border:1px solid ${BRAND.border}; border-radius:18px; padding:36px 34px;">
                <h1 style="margin:0 0 16px; font-family:${BRAND.font}; font-size:23px; line-height:1.25; font-weight:700; letter-spacing:-0.015em; color:${BRAND.ink};">${esc(content.heading)}</h1>
                ${content.bodyHtml}
                ${button}
              </td>
            </tr>

            <tr>
              <td style="padding:22px 10px 8px;">
                <p style="margin:0; font-family:${BRAND.font}; font-size:12px; line-height:1.5; color:${BRAND.muted}; text-align:center;">${footer}</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
