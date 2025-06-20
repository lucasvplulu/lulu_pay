const axios = require('axios');

async function interpretMessage(text) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: `Você é um assistente financeiro.

Sua função é transformar qualquer texto em um JSON no seguinte formato:

{
 "tipo": "receita ou despesa",
 "tipo_pagamento": "Dinheiro, Nubank, Santander ou Pix",
 "valor": número,
 "categoria": "string",
 "descricao": "string"
}

⚠️ Instruções obrigatórias:
- A categoria deve obrigatoriamente ser uma dessas:
["Moradia", "Internet", "Energia", "Plano de celular", "Carro", "Caixinha Gabe", "IR", "Fast Food", "Super Mercado", "Recorrencia", "Saude", "Baba", "Educacao", "Emprestimo", "Musica", "Compras Online", "Dizmo", "Outros"].
- Se a categoria não estiver clara, use "Outros".
- Não inclua data no JSON. A data será tratada no backend.
- Extraia apenas os campos: tipo, tipo_pagamento, valor, categoria e descrição.
- Se não for informado o tipo de pagamento, coloque "Dinheiro".
- Categoria e descrição devem começar com letra maiúscula.
- Todos os campos devem estar preenchidos. Se não houver descrição, use "".
- Sempre responda apenas com o JSON puro, sem comentários, sem explicações, sem texto adicional.`


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
