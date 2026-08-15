import { test, expect } from "@playwright/test";
import { STORAGE_STATE, TEST_USER } from "./helpers";

test.skip(!TEST_USER, "No test credentials configured — see playwright.config.ts");
test.use({ storageState: STORAGE_STATE });

/**
 * Does every tab still render for a signed-in member? This is the cheapest
 * possible guard against a refactor breaking a whole screen, and it runs on a
 * phone viewport because that's how the app is actually used.
 */
const TABS = [
  { name: "Sunday", path: "/" },
  { name: "Schedule", path: "/schedule" },
  { name: "Songs", path: "/songbook" },
  { name: "Recordings", path: "/recordings" },
];

for (const tab of TABS) {
  test(`${tab.name} tab renders`, async ({ page }) => {
    await page.goto(tab.path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  });
}

test("bottom nav navigates between tabs", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });

  await nav.getByRole("link", { name: "Songs" }).click();
  await page.waitForURL("/songbook");
  await expect(page.getByRole("heading", { name: "Song Book" })).toBeVisible();

  await nav.getByRole("link", { name: "Schedule" }).click();
  await page.waitForURL("/schedule");
});

test("marks the current tab for assistive tech", async ({ page }) => {
  await page.goto("/schedule");
  const current = page
    .getByRole("navigation", { name: "Primary" })
    .locator("[aria-current='page']");
  await expect(current).toHaveAttribute("href", "/schedule");
});

test("signed-out visitors are sent to login", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/schedule");
  await page.waitForURL(/\/login/);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});
