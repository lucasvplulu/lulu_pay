const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();

async function addToSheet(entry) {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Registros'];

    await sheet.addRow({
        Data: entry.data,
        Tipo: entry.tipo,
        Categoria: entry.categoria,
        Descricao: entry.descricao,
        'Valor (R$)': entry.valor,
    });
}

module.exports = { addToSheet };
