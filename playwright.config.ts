import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

/**
 * End-to-end suite. Deliberately small: it covers the things unit tests can't
 * reach — that each tab renders signed in, that modals behave for a keyboard
 * user, and that neither theme has regressed visually.
 *
 * Requires a throwaway member account on the Supabase project. Put its
 * credentials in `.env.test.local` (gitignored):
 *
 *     TEST_USER_EMAIL=...
 *     TEST_USER_PASSWORD=...
 *
 * Without them the whole suite skips rather than failing, so `npm run test:e2e`
 * stays safe to run on a fresh clone.
 *
 * `channel: "chrome"` drives the locally installed Chrome instead of
 * Playwright's bundled Chromium, which has no build for macOS 12.
 */

// Playwright doesn't read Next's env files, so load the test credentials here.
if (existsSync(".env.test.local")) process.loadEnvFile(".env.test.local");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    channel: "chrome",
  },

  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      // A phone viewport — this is a mobile-first PWA, so that's the case that
      // matters. Desktop layout is a widened version of the same tree.
      use: { ...devices["Pixel 7"], channel: "chrome" },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
