import "./style.css";
import { catalogoProdutos, criarCardProduto } from "./catalogo";
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
      },
    },
  },
});


const mapaCategorias: Array<{ palavras: string[]; categoria: string }> = [
  { palavras: ["cão", "cao", "cachorro"], categoria: "cachorro" },
  { palavras: ["gato"], categoria: "gato" },
  { palavras: ["pássaro", "passaro"], categoria: "passaro" },
  { palavras: ["peixe"], categoria: "peixe" },
  { palavras: ["outros"], categoria: "outros" },
  { palavras: ["casa"], categoria: "casa" },
  { palavras: ["jardim"], categoria: "jardim" },
  { palavras: ["piscina"], categoria: "piscina" },
];

function categoriaDaSecao(secao: HTMLElement): string {
  const titulo =
    secao.querySelector<HTMLElement>(".titulo-secao")?.textContent?.toLowerCase() ||
    "";

  for (const item of mapaCategorias) {
    if (item.palavras.some((palavra) => titulo.includes(palavra))) {
      return item.categoria;
    }
  }

  return "";
}

const secoes = document.querySelectorAll<HTMLElement>(".secao-vitrine");

secoes.forEach((secao) => {
  const categoria = categoriaDaSecao(secao);

  if (categoria === "") {
    return;
  }

  const linha = secao.querySelector<HTMLElement>(".linha-produtos");

  if (!linha) {
    return;
  }

  // Remove os cards fixos que estavam escritos no HTML
  linha.querySelectorAll("article.card-produto").forEach((cardAntigo) => {
    cardAntigo.remove();
  });

  // Coloca no lugar os cards vindos do catálogo (com as imagens)
  const produtosDaCategoria = catalogoProdutos.filter(
    (produto) => produto.categoria === categoria
  );

  produtosDaCategoria.forEach((produto) => {
    linha.appendChild(criarCardProduto(produto));
  });
});