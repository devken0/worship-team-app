import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Raw Tailwind palette colors (bg-gray-500, text-red-600, …) don't adapt to the
 * dark theme, so anything using them looks correct in light mode and wrong in
 * dark. That's how the share and reminder cards ended up pinned to white. The
 * design tokens in `globals.css` — bg-card, text-muted, border-border and the
 * rest — are the supported way to reach a color.
 *
 * Deliberate exceptions live behind an eslint-disable comment explaining why:
 * the record button and the YouTube play button are conventions rather than
 * theme colors, and white-on-scrim controls sit above a dim overlay where the
 * page tokens don't apply.
 */
const PALETTE =
  "(gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)";
const PALETTE_CLASS = new RegExp(
  `\\b(bg|text|border|ring|from|via|to|divide|outline|decoration|shadow|accent|caret|fill|stroke)-${PALETTE}-(50|\\d{3})\\b`,
);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=/${PALETTE_CLASS.source}/]`,
          message:
            "Use a design token (bg-card, text-muted, border-border, …) instead of a raw Tailwind palette color — raw palette colors don't adapt to the dark theme. If the color is genuinely fixed (a brand mark, or white on a dim scrim), add an eslint-disable-next-line with the reason.",
        },
        {
          selector: `TemplateElement[value.raw=/${PALETTE_CLASS.source}/]`,
          message:
            "Use a design token (bg-card, text-muted, border-border, …) instead of a raw Tailwind palette color — raw palette colors don't adapt to the dark theme. If the color is genuinely fixed (a brand mark, or white on a dim scrim), add an eslint-disable-next-line with the reason.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
