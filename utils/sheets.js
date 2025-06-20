const { GoogleSpreadsheet } = require("google-spreadsheet");
require("dotenv").config();
const { calcularCompetencia } = require("./data");

async function addToSheet(entry) {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["Registros"];

    const dataCompetencia = calcularCompetencia(entry.data, entry.tipo_pagamento);

    await sheet.addRow({
        "Data": entry.data,
        "Data Comp.": dataCompetencia,
        "Tipo": entry.tipo,
        "Tipo Pag.": entry.tipo_pagamento,
        "Categoria": validarCategoria(entry.categoria),
        "Descrição": entry.descricao,
        "Valor": entry.valor,
        "Observação": entry.observacao || "",
    });
}

const categoriasValidas = [
    "Moradia",
    "Internet",
    "Energia",
    "Plano de celular",
    "Carro",
    "Caixinha Gabe",
    "IR",
    "Fast Food",
    "Super Mercado",
    "Recorrencia",
    "Saude",
    "Baba",
    "Educacao",
    "Emprestimo",
    "Musica",
    "Compras Online",
    "Dizmo",
    "Outros",
];

function validarCategoria(categoria) {
    if (categoriasValidas.includes(categoria)) {
        return categoria;
    }
    return "Outros";
}


module.exports = { addToSheet };
