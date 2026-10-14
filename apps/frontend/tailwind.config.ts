import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { navy: "#101b36", purple: "#7254d5", ink: "#172033", mist: "#f6f7fb" } } }, plugins: [] } satisfies Config;
