const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('../keen-ascent-336412-629a88521dec.json');

async function addToSheet(entry) {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Registros'];

    await sheet.addRow({
        Data: entry.data,
        Tipo: entry.tipo,
        Categoria: entry.categoria,
        Descricao: entry.descricao,
        'Valor (R$)': entry.valor
    });
}

module.exports = { addToSheet };
