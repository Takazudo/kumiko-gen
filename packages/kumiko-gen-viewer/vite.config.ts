import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/pj/kumiko-gen/",
  server: {
    host: "kumikogen.localhost",
    port: 1982,
  },
  preview: {
    host: "kumikogen.localhost",
    port: 1982,
  },
  resolve: {
    alias: {
      "kumiko-gen": path.resolve(__dirname, "../kumiko-gen/src"),
    },
  },
});
