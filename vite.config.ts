import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "https://petshop-vert-ten.vercel.app",
        changeOrigin: true,
      },
    },
  },
});