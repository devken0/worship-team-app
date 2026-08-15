import { test as setup, expect } from "@playwright/test";
import { STORAGE_STATE, TEST_USER } from "./helpers";

/**
 * Signs in once and saves the session for every other spec to reuse, so the
 * suite pays the auth cost a single time.
 */
setup("authenticate", async ({ page }) => {
  setup.skip(
    !TEST_USER,
    "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test.local to run the e2e suite.",
  );

  await page.goto("/login");
  // Located by form field name: the visible "Password" label is also matched by
  // the show/hide toggle's "Show password" button.
  await page.locator('input[name="email"]').fill(TEST_USER!.email);
  await page.locator('input[name="password"]').fill(TEST_USER!.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Landing on the dashboard is the proof the session took.
  await page.waitForURL("/");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
});
