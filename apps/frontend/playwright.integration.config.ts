import { defineConfig } from "@playwright/test";
import { readFileSync,mkdirSync } from "node:fs";
import { resolve } from "node:path";
const privateDirectory=(process.env.CBC_DEMO_DIRECTORY || resolve(__dirname,"../../.local/cbc-test"));
const status=JSON.parse(readFileSync(resolve(privateDirectory,"status.json"),"utf8"));
const endpoint=new URL(status.env.API_URL);
if(endpoint.hostname!=="127.0.0.1"||endpoint.port!=="56421")throw new Error("Integration suite refuses a non-local demo endpoint.");
mkdirSync(resolve(privateDirectory,"browser-results"),{recursive:true,mode:0o700});
export default defineConfig({
 testDir:"./tests/integration-browser",workers:1,fullyParallel:false,timeout:60000,
 reporter:[["./tests/integration-reporter.ts"]],outputDir:resolve(privateDirectory,"browser-results"),
 use:{baseURL:"http://127.0.0.1:3142",headless:true,screenshot:"off",trace:"off",video:"off"},
 webServer:{command:"npm run build && npm run start -- --hostname 127.0.0.1 --port 3142",port:3142,timeout:120000,reuseExistingServer:false,env:{NODE_ENV:"production",NEXT_PUBLIC_SUPABASE_URL:status.env.API_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY:status.env.ANON_KEY}},
});
