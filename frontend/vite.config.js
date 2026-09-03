import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
    },
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router-dom/")
          ) {
            return "vendor-react";
          }
          if (id.includes("node_modules/framer-motion/")) {
            return "vendor-motion";
          }
          if (id.includes("node_modules/exceljs/")) {
            return "vendor-exceljs";
          }
          if (id.includes("node_modules/xlsx/")) {
            return "vendor-xlsx";
          }
          if (id.includes("node_modules/jspdf/") || id.includes("node_modules/jspdf-autotable/")) {
            return "vendor-jspdf";
          }
          if (id.includes("node_modules/html2canvas/")) {
            return "vendor-html2canvas";
          }
        },
      },
    },
  },
});
