import { defineConfig } from "vite";

// Custom domain (spinzy.patriarxis.com) → root base
export default defineConfig({
  base: "/",
  publicDir: "public",
  // dragula/crossvent expect Node's `global` in the browser
  define: {
    global: "globalThis",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ["dragula", "konva"],
  },
});
