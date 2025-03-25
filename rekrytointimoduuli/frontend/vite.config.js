import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Explicitly resolve node_modules to the shared directory
      node_modules: path.resolve(__dirname, "../../../node_modules"),
    },
  },
});
