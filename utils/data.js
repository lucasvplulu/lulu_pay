function extrairData(texto) {
    texto = texto.toLowerCase();

    // Procurar por datas no formato dd/mm/yyyy ou dd-mm-yyyy
    const regexData = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const match = texto.match(regexData);

    if (match) {
        const dia = match[1].padStart(2, '0');
        const mes = match[2].padStart(2, '0');
        const ano = match[3].length === 2 ? '20' + match[3] : match[3];
        return `${dia}/${mes}/${ano}`;
    }

    // Interpretar expressões como hoje, ontem, amanhã
    if (texto.includes('hoje')) {
        return new Date().toLocaleDateString('pt-BR');
    }
    if (texto.includes('ontem')) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toLocaleDateString('pt-BR');
    }
    if (texto.includes('amanhã') || texto.includes('amanha')) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toLocaleDateString('pt-BR');
    }

    // Se não encontrar nada, usa a data de hoje
    return new Date().toLocaleDateString('pt-BR');
}

module.exports = { extrairData };
