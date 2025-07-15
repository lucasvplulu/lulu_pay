const { GoogleSpreadsheet } = require("google-spreadsheet");
require("dotenv").config();
const { calcularCompetencia } = require("./data");


async function excluirLancamentoPorId(id) {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Registros'];
    const rows = await sheet.getRows();

    // 🔍 Filtra todas as linhas com aquele identificador
    const linhasParaExcluir = rows.filter(r => Number(r.Identificador) === Number(id));

    if (linhasParaExcluir.length === 0) {
        console.log(`❌ Lançamento ${id} não encontrado.`);
        return { sucesso: false };
    }

    // 🔥 Importante: percorrer de trás pra frente
    for (let i = linhasParaExcluir.length - 1; i >= 0; i--) {
        try {
            await linhasParaExcluir[i].delete();
            console.log(`🗑️ Linha com ID ${id} excluída.`);
        } catch (err) {
            console.error(`❌ Erro ao excluir linha com ID ${id}:`, err);
        }
    }

    console.log(`🗑️ Todas as linhas com ID ${id} foram excluídas.`);
    return { sucesso: true, quantidade: linhasParaExcluir.length };
}


async function getProximoIdentificador() {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["Registros"];

    const rows = await sheet.getRows();

    const ultimoId = rows.reduce((max, row) => {
        const id = Number(row.Identificador);
        return !isNaN(id) && id > max ? id : max;
    }, 0);

    return ultimoId + 1;
}

async function addToSheet(entry, identificador) {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["Registros"];

    await sheet.addRow({
        "Identificador": identificador,
        "Data": entry.data,
        "Data Comp.": entry.competencia,
        "Tipo": entry.tipo,
        "Tipo Pag.": entry.tipo_pagamento,
        "Categoria": validarCategoria(entry.categoria),
        "Descrição": entry.descricao,
        "Valor": entry.valor,
        "Observação": entry.observacao || "",
    });

    console.log(`✅ Registro adicionado com ID: ${identificador}`);
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


module.exports = { addToSheet, excluirLancamentoPorId, getProximoIdentificador };
