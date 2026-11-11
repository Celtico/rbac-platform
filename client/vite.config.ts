import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
const { version } = JSON.parse(readFileSync("../server/package.json", "utf-8")) as { version: string };

// https://vite.dev/config/
export default defineConfig({
  // A GitHub Pages l'app pot viure sota /<repositori>/; el workflow ho passa a BASE_PATH.
  base: process.env.BASE_PATH ? `${process.env.BASE_PATH.replace(/\/+$/, "")}/` : "/",
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/socket.io": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true,
      },
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/api/docs": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
