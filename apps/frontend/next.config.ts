import type { NextConfig } from "next";
const allowedOrigins = new Set(["localhost:3000", "127.0.0.1:3000"]);
const codespaceName = process.env.CODESPACE_NAME;
const codespacesDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || "app.github.dev";
if (codespaceName) allowedOrigins.add(`${codespaceName}-3000.${codespacesDomain}`);
if (process.env.NEXT_SERVER_ACTION_ALLOWED_ORIGINS) {
  process.env.NEXT_SERVER_ACTION_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean).forEach((origin) => allowedOrigins.add(origin));
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { allowedOrigins: [...allowedOrigins] } },
};
export default nextConfig;
