import type { Page } from "@playwright/test";

/** Where the signed-in session from `auth.setup.ts` is cached. */
export const STORAGE_STATE = "e2e/.auth/state.json";

/**
 * Credentials for the throwaway member account, or null when they aren't
 * configured — in which case the suite skips instead of failing.
 */
export const TEST_USER =
  process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD
    ? {
        email: process.env.TEST_USER_EMAIL,
        password: process.env.TEST_USER_PASSWORD,
      }
    : null;

/**
 * Force a theme before the app's pre-paint script runs, so screenshots are
 * deterministic rather than inheriting whatever the runner's OS prefers.
 */
export async function useTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((t) => {
    window.localStorage.setItem("theme", t);
  }, theme);
}
