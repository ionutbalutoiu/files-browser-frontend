import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import { resolve } from "path"

export default defineConfig({
  plugins: [svelte()],
  base: "/ui/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        "runtime-config": resolve(__dirname, "src/runtime-config.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "runtime-config") {
            return "assets/runtime-config.js"
          }
          return "assets/[name]-[hash].js"
        },
      },
    },
  },
})
