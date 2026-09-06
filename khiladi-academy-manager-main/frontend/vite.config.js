import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("xlsx")) return "vendor-excel";
          if (id.includes("jspdf") || id.includes("html2canvas")) {
            return "vendor-pdf";
          }
          if (id.includes("recharts")) return "vendor-charts";
          if (
            id.includes("react/") ||
            id.includes("react-dom") ||
            id.includes("react-router")
          ) {
            return "vendor-react";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    headers: {
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    },
  },
});
