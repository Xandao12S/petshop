import type { Request, Response } from "express";
import { google } from "googleapis";

const SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID || "19AoW0WmQB9Ei62eZJOff3ljyWlLGS34MB4xxG6_I9fg";
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Página1";

function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || "";

  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export default async function handler(req: Request, res: Response) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    // 1. LISTAR ESTOQUE (GET)
    if (req.method === "GET") {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A3:H`,
      });

      const rows = response.data.values || [];
      const estoque = rows
        .map((row, index) => ({
          linha: index + 3,
          produto: row[0] || "",
          marca: row[1] || "",
          categoria: row[2] || "",
          quantidade: row[3] || "0",
          preco: row[4] || "",
          desconto: row[5] || "",
          percentual: row[6] || "",
          imagem: row[7] || "",
        }))
        .filter((item) => item.produto.trim() !== "");

      return res.status(200).json(estoque);
    }

    // 2. ADICIONAR NOVO PRODUTO (POST)
    if (req.method === "POST") {
      const {
        produto,
        marca,
        categoria,
        quantidade,
        preco,
        desconto,
        percentual,
        imagem,
      } = req.body;

      if (!produto) {
        return res.status(400).json({ error: "O nome do produto é obrigatório." });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:H`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [
            [
              produto,
              marca || "",
              categoria || "",
              quantidade || "0",
              preco || "",
              desconto || "",
              percentual || "",
              imagem || "",
            ],
          ],
        },
      });

      return res.status(201).json({ message: "Produto inserido com sucesso na planilha!" });
    }

    // 3. EDITAR PRODUTO (PUT)
    if (req.method === "PUT") {
      const { linha, produto, marca, categoria, quantidade, preco, desconto, percentual, imagem } =
        req.body;

      const numLinha = Number(linha);
      if (!numLinha || numLinha < 3) {
        return res.status(400).json({ error: "Linha da planilha inválida para alteração." });
      }

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${numLinha}:H${numLinha}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [
            [
              produto || "",
              marca || "",
              categoria || "",
              quantidade || "0",
              preco || "",
              desconto || "",
              percentual || "",
              imagem || "",
            ],
          ],
        },
      });

      return res.status(200).json({ message: "Produto atualizado na planilha!" });
    }

    // 4. EXCLUIR PRODUTO (DELETE)
    if (req.method === "DELETE") {
      const linha = Number(req.query.linha);
      if (!linha || linha < 3) {
        return res.status(400).json({ error: "Número da linha é obrigatório para exclusão." });
      }

      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${linha}:H${linha}`,
      });

      return res.status(200).json({ message: "Produto removido da planilha!" });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (error: any) {
    console.error("Erro na integração com Google Sheets:", error);
    return res.status(500).json({
      error: error?.message || "Erro interno no servidor ao processar planilha.",
    });
  }
}