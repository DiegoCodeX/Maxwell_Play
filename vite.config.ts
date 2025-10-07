import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error: Vite soporta 'url' en tiempo de ejecución aunque TypeScript no lo encuentre
import { fileURLToPath, URL } from "url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
