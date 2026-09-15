import fs from "fs";
import crypto from "crypto";

// Lê o .env.local da raiz do projeto
const envTexto = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const linha of envTexto.split(/\r?\n/)) {
  const limpa = linha.trim();
  if (!limpa || limpa.startsWith("#")) continue;
  const pos = limpa.indexOf("=");
  if (pos === -1) continue;
  const chave = limpa.slice(0, pos).trim();
  let valor = limpa.slice(pos + 1).trim();
  if (
    (valor.startsWith('"') && valor.endsWith('"')) ||
    (valor.startsWith("'") && valor.endsWith("'"))
  ) {
    valor = valor.slice(1, -1);
  }
  env[chave] = valor;
}

const SPREADSHEET_ID = env.GOOGLE_SPREADSHEET_ID || "";
const SHEET_NAME = env.GOOGLE_SHEET_NAME || "PetShop";
const EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
let privateKey = env.GOOGLE_PRIVATE_KEY || "";
privateKey = privateKey.replace(/\\n/g, "\n");

console.log("1) Variaveis do .env.local:");
console.log("   GOOGLE_SPREADSHEET_ID:", SPREADSHEET_ID ? "ok" : "FALTANDO");
console.log("   GOOGLE_SHEET_NAME:", SHEET_NAME);
console.log("   GOOGLE_SERVICE_ACCOUNT_EMAIL:", EMAIL ? "ok" : "FALTANDO");
console.log(
  "   GOOGLE_PRIVATE_KEY:",
  privateKey.includes("BEGIN PRIVATE KEY") ? "ok" : "FALTANDO/INVALIDA"
);

function base64url(texto) {
  return Buffer.from(texto, "utf8").toString("base64url");
}

async function main() {
  const agora = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: agora + 3600,
      iat: agora,
    })
  );

  let jwt;
  try {
    const assinatura = crypto
      .createSign("RSA-SHA256")
      .update(`${header}.${payload}`)
      .sign(privateKey);
    jwt = `${header}.${payload}.${assinatura.toString("base64url")}`;
    console.log("2) Chave privada valida para assinar: ok");
  } catch (e) {
    console.log("2) ERRO AO ASSINAR (formato da chave):", e.message);
    return;
  }

  const resposta = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const dados = await resposta.json();
  if (!dados.access_token) {
    console.log("3) ERRO NA AUTENTICACAO GOOGLE:", JSON.stringify(dados));
    return;
  }
  console.log("3) Token de acesso obtido: ok");

  const base = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;
  const respostaAbas = await fetch(base, {
    headers: { Authorization: `Bearer ${dados.access_token}` },
  });
  const dadosAbas = await respostaAbas.json();
  if (!respostaAbas.ok) {
    console.log(
      "4) ERRO AO ABRIR A PLANILHA:",
      respostaAbas.status,
      JSON.stringify(dadosAbas)
    );
    return;
  }
  const abas = (dadosAbas.sheets || []).map((s) => s.properties.title);
  console.log("4) Planilha aberta. Abas encontradas:", abas.join(", "));

  if (!abas.includes(SHEET_NAME)) {
    console.log(`5) ERRO: a aba "${SHEET_NAME}" nao existe. Abas validas: ${abas.join(", ")}`);
    return;
  }

  const respostaValores = await fetch(
    `${base}/values/${encodeURIComponent(SHEET_NAME + "!A3:H")}`,
    { headers: { Authorization: `Bearer ${dados.access_token}` } }
  );
  const dadosValores = await respostaValores.json();
  if (!respostaValores.ok) {
    console.log(
      "6) ERRO AO LER OS DADOS:",
      respostaValores.status,
      JSON.stringify(dadosValores)
    );
    return;
  }
  const linhas = dadosValores.values || [];
  console.log(`6) Leitura OK! ${linhas.length} linhas encontradas.`);
  linhas.slice(0, 5).forEach((l, i) =>
    console.log(`   linha ${i + 3}:`, JSON.stringify(l))
  );
}

main().catch((e) => console.log("ERRO INESPERADO:", e.message));