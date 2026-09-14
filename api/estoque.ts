import crypto from "crypto";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "19AoW0WmQB9Ei62eZJOff3ljyWlLGS34MB4xxG6_I9fg";
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "PetShop";

function base64url(texto: string): string {
  return Buffer.from(texto, "utf8").toString("base64url");
}

async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/G4+2cAtFzahT\nqEsqKRMvNUA9CuwxcfY5U3lmAmBYMc+yrovelag4I7QaKHvE6rW1F8Wu9yKFXb10\nE7O/jlv9ncmEeiazlpxnS4Xb9jCYAl9n23ZysTeO5+/VkRGENQ3PgaQk4WqxX0S0\na6wqpqbztdm2DXgWmXeOJNFRSt5aB097RauopcPHUiN54CjPYBjcusPCBaV36nyS\nxaTT/tsII/weUTGp7zg6jjieeHVs09huh3PK5yHkQ60Wk2CsGGSmlHjg92DaqAYc\n0Kl5u9AJG5dlY+P+fTfecysXJioHcZfknlA6Y+MY+EmfmT83dOWADcJj0IL24N3C\nrsvlU5gTAgMBAAECggEAEy4fdtZ48ykIX1kRLiqQL9k+2MGLYg0HgspjcT8Ez2U0\nbMEC7bSEfRnsPgHZJjLOSN4Za42HK+50EL3XeP6/Mc2Px5mA395aVS2pwiFL0D3Q\nuHo4wZsSseeKVRtpsCSo/a4LvN3Y2PNwUFFMJr2yHNyf/JsOdeoyKxR745ZJiaxs\nv/tqusTwF6EQ3Ol8DEudKl/urNSXKxi8Pr8QdFFhv1R20GETe82gX1EfDlifxVmq\nVadWxMMiHjxd+g7ihmsBzx8bOzbg361XcPmmC+GMHAlNfkYNOXitjxkJSI+QOqHe\nmNZ0BGushh66+ci0/5jJQ5T19fu6+BmZ+T5OJVQy1QKBgQDhkBGflCS8HphTQZsJ\nXQb2jsLbkiM8vxNEwYmvqGkLtaxFvkBu5LU1bI6p2y3CeMNXptC7hdlN+CrZgfUH\njHQNSdfN2SZdPyPPLLWDglw/7ICReuOSvuREv6pjwE4kVnAmFsgBvMi7IUrHLFr2\nBfhH64QSkKSRXnDhmoaIMN1oZwKBgQDY5ULtEpckZjlRQwSdEkQ3OYz9gVqxcBUb\nnr4AwPMAqkic6GiSKdABBDv8ng6o1cRs9QetdyEPKhkXNTrJPfC7xbWDLs+DIOiH\nGhkLtpYcR+h5UAEbB/vYfOP4JE+7CL+LCTVgL1lOADr7airucC0+EwVa8Po0gaqJ\nwYNN0a13dQKBgQCE2Frox1FTUhmYfz0WKKnfMHlm5AzIzChHCE1VHTSw5tCNSt2b\n8isfSc5ED4hFzuYNi3vH1a8EErL542YyifAXm3P0En5b0MIAVG6bA33dUCbwh5Xc\naXz7WH67vRjIoffvFt+41jzKqXLnFyKDX0S45uakIHgr/Zkx5dZyA4WC5QKBgBBK\n8IMUgWwHjciv6xnNdHhdh1zHqcNocv13KDiwRdDH+dpnjutj3q8k3Ui1qs49+Jpi\nsafzKfWUqPvYUMkrMPk5+c+X5ZipES6M5FK/7XjEYg8y1lJsgBucDhfmymJ3XsQX\n9f16sQ+t7sBSElWE8bEXBrD1JyZokyHz+mQPGyO9AoGBAKPQY+JR5jMVXTY0TFa6\nKQ3QOKuObcWyafdOYABayGTHD4012lcFL5fMS0q0nLOL6GiA/o5At7UPE+poGdsI\nCfEgwFjq7YlXYCxvn+rnLcWcjUxQUek3z3yfSMcrxARGoLKKli6Us4rCH2RcxyGV\nbTLd//RRQkSm5u4iTSvxws4u\n-----END PRIVATE KEY-----\n";
  privateKey = privateKey.replace(/\\n/g, "\n");

  if (!email) {
    throw new Error("Variavel GOOGLE_SERVICE_ACCOUNT_EMAIL nao configurada na Vercel.");
  }
  if (!privateKey) {
    throw new Error("Variavel GOOGLE_PRIVATE_KEY nao configurada na Vercel.");
  }

  const agora = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: agora + 3600,
      iat: agora,
    })
  );

  const assinatura = crypto
    .createSign("RSA-SHA256")
    .update(`${header}.${payload}`)
    .sign(privateKey);

  const jwt = `${header}.${payload}.${assinatura.toString("base64url")}`;

  const resposta = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const dados: any = await resposta.json();
  if (!dados.access_token) {
    throw new Error("Falha na autenticacao do Google: " + JSON.stringify(dados));
  }
  return dados.access_token;
}

async function chamarSheets(token: string, url: string, opcoes: any = {}) {
  const resposta = await fetch(url, {
    ...opcoes,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opcoes.headers || {}),
    },
  });
  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(`Google Sheets (${resposta.status}): ${JSON.stringify(dados)}`);
  }
  return dados;
}

function montarProduto(row: string[], numeroLinha: number) {
  return {
    linha: numeroLinha,
    produto: row[0] || "",
    marca: row[1] || "",
    categoria: row[2] || "",
    quantidade: row[3] || "",
    preco: row[4] || "",
    desconto: row[5] || "",
    percentual: row[6] || "",
    imagem: row[7] || "",
  };
}

async function obterSheetId(token: string, base: string): Promise<number> {
  const dados = await chamarSheets(token, base);
  const abas = dados.sheets || [];
  const aba = abas.find((s: any) => s.properties.title === SHEET_NAME);
  if (!aba) {
    throw new Error(
      `A aba "${SHEET_NAME}" nao existe. Abas encontradas: ${abas
        .map((s: any) => s.properties.title)
        .join(", ")}`
    );
  }
  return aba.properties.sheetId;
}

export default async function handler(req: any, res: any) {
  try {
    const token = await getAccessToken();
    const base = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;
    const metodo = req.method || "GET";

    if (metodo === "GET") {
      const url = `${base}/values/${encodeURIComponent(`${SHEET_NAME}!A3:H`)}`;
      const dados = await chamarSheets(token, url);
      const linhas: string[][] = dados.values || [];
      const estoque = linhas
        .map((row, index) => montarProduto(row, index + 3))
        .filter((p) => p.produto.trim() !== "");
      return res.status(200).json(estoque);
    }

    const corpo =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    if (metodo === "POST") {
      const linha = [
        corpo.produto, corpo.marca, corpo.categoria, corpo.quantidade,
        corpo.preco, corpo.desconto, corpo.percentual, corpo.imagem,
      ].map((v) => String(v ?? ""));
      const url = `${base}/values/${encodeURIComponent(
        `${SHEET_NAME}!A3:H`
      )}/append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
      await chamarSheets(token, url, {
        method: "POST",
        body: JSON.stringify({ values: [linha] }),
      });
      return res.status(200).json({ ok: true });
    }

    if (metodo === "PATCH") {
      const numeroLinha = Number(corpo.linha);
      if (!numeroLinha) {
        return res.status(400).json({ erro: "Informe o numero da linha." });
      }
      const linha = [
        corpo.produto, corpo.marca, corpo.categoria, corpo.quantidade,
        corpo.preco, corpo.desconto, corpo.percentual, corpo.imagem,
      ].map((v) => String(v ?? ""));
      const url = `${base}/values/${encodeURIComponent(
        `${SHEET_NAME}!A${numeroLinha}:H${numeroLinha}`
      )}?valueInputOption=USER_ENTERED`;
      await chamarSheets(token, url, {
        method: "PUT",
        body: JSON.stringify({ values: [linha] }),
      });
      return res.status(200).json({ ok: true });
    }

    if (metodo === "DELETE") {
      const numeroLinha = Number(corpo.linha);
      if (!numeroLinha) {
        return res.status(400).json({ erro: "Informe o numero da linha." });
      }
      const sheetId = await obterSheetId(token, base);
      await chamarSheets(token, `${base}/batchUpdate`, {
        method: "POST",
        body: JSON.stringify({
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: numeroLinha - 1,
                  endIndex: numeroLinha,
                },
              },
            },
          ],
        }),
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ erro: "Metodo nao permitido." });
  } catch (erro: any) {
    return res.status(500).json({ erro: String(erro?.message || erro) });
  }
}