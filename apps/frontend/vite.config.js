import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./", // This ensures relative paths work correctly
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: undefined, // Prevents chunk splitting issues
      },
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://143.198.95.2:5154",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
