import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser", workers: 1, fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:3130", headless: true, screenshot: "off", trace: "off" },
  webServer: [
    { command: "node tests/synthetic-api.mjs", port: 54339, env:{CBC_SYNTHETIC_API_PORT:"54339",CBC_SYNTHETIC_APP_ORIGIN:"http://127.0.0.1:3130"}, reuseExistingServer: false },
    { command: "npm run build && npm run start -- --hostname 127.0.0.1 --port 3130", port: 3130, timeout: 120000, reuseExistingServer: false, env: { NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54339", NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-public-key" } },
  ],
});
