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

function calcularCompetencia(dataStr, tipoPagamento) {
    const [ano, mes, dia] = dataStr.split('-').map(Number);

    const data = new Date(ano, mes - 1, dia);

    if (tipoPagamento === 'Nubank') {
        if (dia >= 18) {
            return formatDate(new Date(ano, mes, 1)); // mês +1
        } else {
            return formatDate(new Date(ano, mes - 1, 1)); // mês atual
        }
    }

    if (tipoPagamento === 'Santander') {
        if (dia >= 13) {
            return formatDate(new Date(ano, mes, 1)); // mês +1
        } else {
            return formatDate(new Date(ano, mes - 1, 1)); // mês atual
        }
    }

    // Se não for cartão, usa a própria data
    return dataStr;
}

function formatDate(date) {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

module.exports = { extrairData, calcularCompetencia };
