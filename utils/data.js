function extrairData(texto) {
    texto = texto.toLowerCase();

    const regexData = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const match = texto.match(regexData);

    if (match) {
        const dia = match[1].padStart(2, '0');
        const mes = match[2].padStart(2, '0');
        const ano = match[3].length === 2 ? '20' + match[3] : match[3];
        return `${ano}-${mes}-${dia}`;
    }

    const hoje = new Date();

    if (texto.includes('hoje')) {
        return formatDate(hoje);
    }
    if (texto.includes('ontem')) {
        const d = new Date();
        d.setDate(hoje.getDate() - 1);
        return formatDate(d);
    }
    if (texto.includes('amanhã') || texto.includes('amanha')) {
        const d = new Date();
        d.setDate(hoje.getDate() + 1);
        return formatDate(d);
    }

    return formatDate(hoje);
}

function calcularCompetencia(dataStr, tipoPagamento, incrementoMeses = 0) {
    const [ano, mes, dia] = dataStr.split('-').map(Number);

    // Aplica o incremento logo no início
    const data = new Date(ano, mes - 1 + incrementoMeses, dia);

    const novoAno = data.getFullYear();
    const novoMes = data.getMonth(); // já está zero-based
    const novoDia = data.getDate();

    let competencia;

    if (tipoPagamento === 'Nubank') {
        competencia = novoDia >= 18 ? new Date(novoAno, novoMes + 1, 1) : new Date(novoAno, novoMes, 1);
    } else if (tipoPagamento === 'Santander') {
        competencia = novoDia >= 13 ? new Date(novoAno, novoMes + 1, 1) : new Date(novoAno, novoMes, 1);
    } else if (tipoPagamento === 'Viacredi') {
        competencia = novoDia >= 23 ? new Date(novoAno, novoMes + 2, 1) : new Date(novoAno, novoMes + 1, 1);
    } else {
        competencia = new Date(novoAno, novoMes, 1);
    }

    return formatDate(competencia);
}


function formatDate(date) {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

module.exports = { extrairData, calcularCompetencia, formatDate };
