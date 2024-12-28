import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        main: "./tests/worker.ts",
        miniflare: {
          compatibilityDate: "2024-12-18",
          compatibilityFlags: ["nodejs_compat", "nodejs_compat_v2"],
          durableObjects: {
            test: {
              className: "TestDurableObject",
              useSQLite: true,
            },
          },
        },
      },
    },
  },
});
