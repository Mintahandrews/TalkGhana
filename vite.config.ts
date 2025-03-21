import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    {
      name: "error-reporter",
      configureServer(server) {
        // Report build errors
        server.middlewares.use((err, req, res, next) => {
          if (err) {
            console.error("Build error:", err);
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ["@tensorflow/tfjs-node"],
  },
});
