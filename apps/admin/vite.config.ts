import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [basicSsl(), react()],
  server: {
    https: {},
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});