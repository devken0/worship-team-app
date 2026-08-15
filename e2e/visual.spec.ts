import { test, expect } from "@playwright/test";
import { STORAGE_STATE, TEST_USER, useTheme } from "./helpers";

test.skip(!TEST_USER, "No test credentials configured — see playwright.config.ts");
test.use({ storageState: STORAGE_STATE });

/**
 * Both-theme screenshots of the design-system page. A single token edit in
 * `globals.css` reaches every screen, and eyeballing that across light and dark
 * is exactly the check people skip.
 *
 * Only `/design` is captured, deliberately. The real screens render live data —
 * this Sunday's service, the song list — so their baselines would go stale
 * every week and train everyone to re-accept diffs without reading them. A
 * screenshot test nobody trusts is worse than none. `/design` is static, and it
 * exercises every token, control and state the real screens are built from;
 * that those screens still render is covered by `smoke.spec.ts`.
 *
 * Baselines live in `e2e/visual.spec.ts-snapshots/`. Review the diff before
 * accepting one with `--update-snapshots`.
 */
for (const theme of ["light", "dark"] as const) {
  test(`design system — ${theme}`, async ({ page }) => {
    await useTheme(page, theme);
    await page.goto("/design");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.waitForLoadState("networkidle");

    // Hide the two fixed-position overlays. A full-page capture composites them
    // over the middle of the document, hiding whatever is behind them: the
    // bottom nav (its own rendering is covered by smoke.spec.ts) and the
    // Next.js dev-tools badge (dev-server only, never in the real app).
    await page.addStyleTag({
      content: `nav[aria-label="Primary"], nextjs-portal { display: none !important }`,
    });

    await expect(page).toHaveScreenshot(`design-system-${theme}.png`, {
      fullPage: true,
      animations: "disabled",
    });
  });
}

test("status bar colour follows the in-app theme, not the OS", async ({
  page,
}) => {
  await useTheme(page, "dark");
  await page.goto("/");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#17150f",
  );

  await useTheme(page, "light");
  await page.goto("/");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#faf8f4",
  );
});
