// Standalone vitest config: the Cloudflare plugin in vite.config.ts rejects
// vitest's SSR environment settings, so tests run in plain jsdom instead.
import { defineConfig } from "vitest/config";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [viteReact()],
  test: {
    environment: "jsdom",
    passWithNoTests: true,
  },
});
