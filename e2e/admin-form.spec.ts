import { test, expect } from "@playwright/test";
import { STORAGE_STATE, TEST_USER } from "./helpers";

test.skip(!TEST_USER, "No test credentials configured — see playwright.config.ts");
test.use({ storageState: STORAGE_STATE });

/**
 * The admin service form is the app's biggest and most-edited screen, and the
 * one a refactor is most likely to quietly break. These cover the three things
 * that changed: the song-book picker, collapsible song blocks, and the sticky
 * save bar.
 *
 * Requires the test account to have the admin role. Skips (rather than fails)
 * when it doesn't, so the suite still runs against a member-only account.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/manage/service/new");
  test.skip(
    !page.url().includes("/manage"),
    "Test account is not an admin — cannot reach /manage.",
  );
  // Let the client bundle land. Typing into a controlled input before React
  // hydrates sets the DOM value without firing onChange, so the component's
  // state never sees it and the field silently reverts to being ignored.
  await page.waitForLoadState("networkidle");
});

test("the song-book picker sits above the song list and searches", async ({
  page,
}) => {
  const search = page.getByLabel("Search the song book to add a song");
  await expect(search).toBeVisible();

  // Nothing is listed until you type — a picker, not a wall of options.
  await expect(page.getByRole("button", { name: /^Add$/ })).toHaveCount(0);

  await search.fill("a");
  const results = page.getByRole("button", { name: /Add$/ });
  expect(await results.count()).toBeGreaterThan(0);
});

test("picking a song adds it expanded, and it can be collapsed", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));

  await page.getByLabel("Search the song book to add a song").fill("a");
  await page.getByRole("button", { name: /Add$/ }).first().click();

  // A song you just added is open, because you're about to fill it in.
  const title = page.locator("#song-0-title");
  await expect(title).toBeVisible();
  await expect(title).not.toHaveValue("");

  // And it collapses to a summary row.
  // Scoped to main: the page header's account menu also has aria-expanded.
  const toggle = page.locator("main button[aria-expanded]").first();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(title).toBeHidden();

  // Collapsing must not discard what was entered.
  await toggle.click();
  await expect(page.locator("#song-0-title")).not.toHaveValue("");

  expect(errors).toEqual([]);
});

test("an already-added song is offered as Added, not Add", async ({ page }) => {
  const search = page.getByLabel("Search the song book to add a song");
  await search.fill("a");
  await page.getByRole("button", { name: /Add$/ }).first().click();

  // Searching again offers the same song as already added, so an admin can't
  // silently put the same song on a service twice.
  await search.fill("a");
  await expect(
    page.getByRole("button", { name: /Added$/ }).first(),
  ).toBeDisabled();
});

test("the save bar stays reachable and reports unsaved changes", async ({
  page,
}) => {
  const save = page.getByRole("button", { name: /Create schedule/ });
  await expect(save).toBeVisible();
  await expect(page.getByText("You have unsaved changes")).toHaveCount(0);

  // Clear before filling on each attempt: if an earlier keystroke landed
  // pre-hydration the field already reads "2026-12-27", and re-filling the same
  // value fires no change event at all.
  await expect(async () => {
    await page.locator("#date").fill("");
    await page.locator("#date").fill("2026-12-27");
    await expect(page.getByText("You have unsaved changes")).toBeVisible({
      timeout: 1000,
    });
  }).toPass({ timeout: 15_000 });

  // Still on screen after scrolling to the bottom of a long form.
  await page.mouse.wheel(0, 4000);
  await expect(save).toBeInViewport();
});
