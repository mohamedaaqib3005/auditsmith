import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checkSite from "./vite-plugin-check-site.js";
import runScripts from "./vite-plugin-run-scripts.js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), checkSite(), runScripts()],
});
