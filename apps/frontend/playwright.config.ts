import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser", workers: 1, fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:3100", headless: true, screenshot: "off", trace: "off" },
  webServer: [
    { command: "node tests/synthetic-api.mjs", port: 54329, reuseExistingServer: false },
    { command: "npm run build && npm run start -- --hostname 127.0.0.1 --port 3100", port: 3100, timeout: 120000, reuseExistingServer: false, env: { NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329", NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-public-key" } },
  ],
});
