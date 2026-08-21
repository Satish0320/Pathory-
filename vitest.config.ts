import { defineConfig } from "vitest/config";
import path from "path";

// Runs the tests CLAUDE.md §7 requires: recommendation-engine unit tests,
// coc-api integration tests against a mocked Supercell API (msw), base-link
// decoder fixture tests. See fixtures/base-links/README.md for test data.
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next"],
    // Without this, `vitest run` exits with code 1 when zero test files exist
    // yet — which is exactly the state this project starts in per
    // BUILD_PLAN.md. A CI pipeline wired up before the first test file lands
    // would fail on every commit for no real reason. Once real tests exist
    // (starting at BUILD_PLAN.md 1B), this stops mattering either way.
    passWithNoTests: true,
    coverage: {
      // Deliberately not enforcing a blanket % target — CLAUDE.md §7 asks for
      // rigor specifically in recommendation-engine and the API client, not
      // uniform coverage padding across UI files.
      include: ["lib/recommendation-engine/**", "lib/coc-api/**", "lib/cr-api/**"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
