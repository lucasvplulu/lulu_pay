const axios = require('axios');

async function interpretMessage(text) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: `Você é um assistente financeiro.

Sua função é transformar qualquer texto em um JSON no seguinte formato:

[
 {
  "tipo": "receita ou despesa",
  "tipo_pagamento": "Dinheiro, Nubank, Santander ou Pix",
  "valor": número,
  "categoria": "string",
  "descricao": "string",
  "observacao": "string"
 }
]

⚠️ Instruções obrigatórias:
- A categoria deve obrigatoriamente ser uma dessas:
["Moradia", "Internet", "Energia", "Plano de celular", "Carro", "Caixinha Gabe", "IR", "Fast Food", "Super Mercado", "Recorrencia", "Saude", "Baba", "Educacao", "Emprestimo", "Musica", "Compras Online", "Dizmo", "Outros"].
- Se a categoria não estiver clara, use "Outros".
- Não inclua data no JSON. A data será tratada no backend.
- Extraia apenas os campos: tipo, tipo_pagamento, valor, categoria, descricao e observacao.
- Se não for informado o tipo de pagamento, coloque "Dinheiro".
- Categoria e descricao devem começar com letra maiúscula.
- Todos os campos devem estar preenchidos. Se não houver descrição, use "" (string vazia).
- Se houver informação de parcelamento no texto (ex.: "parcelado em 6x", "em 10 vezes", "3 de 12", etc.), crie **um objeto para cada parcela** no JSON.
  - O campo "valor" deve ser o valor da parcela (valor total dividido pelo número de parcelas, arredondado com duas casas decimais).
  - O campo "observacao" deve indicar a parcela no formato "1/6", "2/6", ..., "6/6".
- Se **não houver parcelamento**, o campo "observacao" deve ser uma string vazia "" ou o que achar interessante por ali.
- Sempre responda apenas com o JSON puro, no formato de **array**, sem comentários, sem explicações e sem texto adicional.
`


            },
            { role: "user", content: text }
        ]
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    const content = response.data.choices[0].message.content.trim();

    console.log('🧠 Resposta do GPT:', content);

    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
        throw new Error(`❌ JSON não encontrado na resposta do GPT. Resposta: ${content}`);
    }

    try {
        const parsed = JSON.parse(match[0]);
        return parsed;
    } catch (error) {
        throw new Error(`❌ Erro ao converter para JSON. Conteúdo: ${match[0]}`);
    }
}

module.exports = { interpretMessage };
