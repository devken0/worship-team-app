import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit tests for pure logic only — date/format helpers, song resolution, small
 * derivations. No React, no Supabase, no mocks; anything needing a browser or a
 * signed-in session belongs in the Playwright suite instead.
 *
 * The `@/*` alias is resolved here by hand rather than via a plugin, to avoid
 * pulling in another dependency for one line.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
