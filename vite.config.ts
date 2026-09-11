import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "src",
  server: {
    open: "/pages/index.html",
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "src/pages/index.html"),
        admin: resolve(import.meta.dirname, "src/pages/admin.html"),
        servicos: resolve(import.meta.dirname, "src/pages/servicos.html"),
        contato: resolve(import.meta.dirname, "src/pages/contato.html"),
        login: resolve(import.meta.dirname, "src/pages/login.html"),
        produtos: resolve(import.meta.dirname, "src/pages/produtos.html"),
      },
    },
  },
});