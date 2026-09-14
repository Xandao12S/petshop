import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Monta o caminho de cada página HTML do projeto
const pagina = (nome: string): string =>
  fileURLToPath(new URL(`./src/pages/${nome}.html`, import.meta.url));

export default defineConfig({
  root: "src",
  server: {
    open: "/pages/index.html",
    proxy: {
      "/api": {
        target: "https://petshop-vert-ten.vercel.app",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: pagina("index"),
        admin: pagina("admin"),
        produtos: pagina("produtos"),
        servicos: pagina("servicos"),
        contato: pagina("contato"),
        login: pagina("login"),
      },
    },
  },
});