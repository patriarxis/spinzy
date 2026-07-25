import { defineConfig } from "vite";

// Root base for Vercel (and any root-domain host)
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
