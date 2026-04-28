import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const backendTarget = "http://127.0.0.1:4000";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    manifest: true
  },
  server: {
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true
      },
      "/vendor": {
        target: backendTarget,
        changeOrigin: true
      },
      "^/(?!@vite|@fs|src/|node_modules/|assets/|favicon\\.ico|index\\.html$).*": {
        target: backendTarget,
        changeOrigin: true
      }
    }
  }
});
