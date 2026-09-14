import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "PetShop";
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

function obterClienteAutenticado() {
  if (!SPREADSHEET_ID) {
    throw new Error("A variável GOOGLE_SPREADSHEET_ID não foi configurada.");
  }

  if (!SERVICE_ACCOUNT_EMAIL) {
    throw new Error(
      "A variável GOOGLE_SERVICE_ACCOUNT_EMAIL não foi configurada."
    );
  }

  if (!PRIVATE_KEY) {
    throw new Error("A variável GOOGLE_PRIVATE_KEY não foi configurada.");
  }

  const privateKey = PRIVATE_KEY.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function obterLinhaComoProduto(row: string[], index: number) {
  return {
    linha: index + 3,
    produto: String(row[0] ?? ""),
    marca: String(row[1] ?? ""),
    categoria: String(row[2] ?? ""),
    quantidade: String(row[3] ?? "0"),
    preco: String(row[4] ?? ""),
    desconto: String(row[5] ?? ""),
    percentual: String(row[6] ?? ""),
    imagem: String(row[7] ?? ""),
  };
}

function obterValoresDoProduto(body: any) {
  return [
    String(body.produto ?? ""),
    String(body.marca ?? ""),
    String(body.categoria ?? ""),
    String(body.quantidade ?? "0"),
    String(body.preco ?? ""),
    String(body.desconto ?? ""),
    String(body.percentual ?? ""),
    String(body.imagem ?? ""),
  ];
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const auth = obterClienteAutenticado();

    await auth.authorize();

    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    // restante do seu código permanece igual

    if (req.method === "GET") {
      const resposta = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A3:H`,
        majorDimension: "ROWS",
      });

      const linhas = resposta.data.values ?? [];

      const estoque = linhas
        .map((row, index) => obterLinhaComoProduto(row, index))
        .filter((item) => item.produto.trim() !== "");

      return res.status(200).json(estoque);
    }

    if (req.method === "POST") {
      const valores = obterValoresDoProduto(req.body);

      if (!valores[0].trim()) {
        return res
          .status(400)
          .json({ error: "O nome do produto é obrigatório." });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:H`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [valores] },
      });

      return res
        .status(201)
        .json({ message: "Produto inserido com sucesso na planilha!" });
    }

    if (req.method === "PUT") {
      const { linha } = req.body;
      const numLinha = Number(linha);

      if (!numLinha || numLinha < 3) {
        return res
          .status(400)
          .json({ error: "Linha da planilha inválida para alteração." });
      }

      const valores = obterValoresDoProduto(req.body);

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${numLinha}:H${numLinha}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [valores] },
      });

      return res.status(200).json({ message: "Produto atualizado na planilha!" });
    }

    if (req.method === "DELETE") {
      const numLinha = Number(req.query.linha || req.body?.linha);

      if (!numLinha || numLinha < 3) {
        return res
          .status(400)
          .json({ error: "Linha da planilha inválida para exclusão." });
      }

      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${numLinha}:H${numLinha}`,
      });

      return res.status(200).json({ message: "Produto removido da planilha!" });
    }

    return res.status(405).json({ error: "Método não permitido." });
  } catch (erro: any) {
    console.error(erro);
    return res
      .status(500)
      .json({ error: "Erro ao acessar a planilha: " + erro.message });
  }
}