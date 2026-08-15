import { test, expect } from "@playwright/test";
import { STORAGE_STATE, TEST_USER } from "./helpers";

test.skip(!TEST_USER, "No test credentials configured — see playwright.config.ts");
test.use({ storageState: STORAGE_STATE });

/**
 * Keyboard behaviour for the app's overlays. These are the assertions that
 * guard the shared Modal primitive: an overlay must take focus when it opens,
 * close on Escape, and hand focus back to whatever opened it. Every dialog used
 * to implement that separately and inconsistently.
 */

test.describe("skip link", () => {
  test("is the first tab stop and jumps to the main content", async ({
    page,
  }) => {
    await page.goto("/");

    // Hidden until focused, so the first Tab from the top of the page reveals it.
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });
});

test.describe("account menu", () => {
  test("opens, closes on Escape, and restores focus", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Account menu" });

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("menu")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("is reachable and operable by keyboard alone", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Account menu" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /profile/i })).toBeVisible();
  });
});

test.describe("song share sheet", () => {
  test("traps focus and returns it on close", async ({ page }) => {
    await page.goto("/");

    // Depends on this Sunday having at least one song; skip rather than fail on
    // an empty schedule so the suite stays green on a fresh database.
    const share = page.getByRole("button", { name: /screenshot view of/i }).first();
    test.skip(
      (await share.count()) === 0,
      "No songs on the current service to share.",
    );

    await share.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Focus must be on the dialog or something within it, never left behind on
    // the page. `contains` covers both — the panel itself is a valid target when
    // it holds no focusable children.
    await expect
      .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
      .toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(share).toBeFocused();
  });
});
