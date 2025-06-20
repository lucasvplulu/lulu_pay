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
- Sempre responda no formato de um **array JSON**, mesmo que haja apenas uma transação.
- Nunca envie JSON fora do array. Sempre use colchetes [ ].
- A categoria deve obrigatoriamente ser uma dessas:
["Moradia", "Internet", "Energia", "Plano de celular", "Carro", "Caixinha Gabe", "IR", "Fast Food", "Super Mercado", "Recorrencia", "Saude", "Baba", "Educacao", "Emprestimo", "Musica", "Compras Online", "Dizmo", "Outros"].
- Se a categoria não estiver clara, utilize "Outros".
- Se não for informado o tipo de pagamento, utilize "Dinheiro".
- Não inclua data no JSON. A data será tratada no backend.
- Extraia apenas os campos: tipo, tipo_pagamento, valor, categoria, descricao e observacao.
- Se na mensagem for informado que é parcelado em X vezes, você deve gerar **uma linha para cada parcela**.
- Na chave "observacao" informe a parcela no formato "N/X", exemplo "2/5". Se não for parcelado, deixe como string vazia "".
- A categoria e a descricao devem começar com letra maiúscula.
- O campo descricao deve ser uma descrição curta e direta.
- Arredonde as parcelas de forma que a soma total seja exatamente igual ao valor informado.
- Nunca envie textos, comentários ou qualquer coisa fora do JSON. Apenas o JSON puro.`


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

    try {
    const parsed = JSON.parse(content);
    return parsed;
} catch (error) {
    throw new Error(`❌ Erro ao converter para JSON. Conteúdo: ${content}`);
}
}

module.exports = { interpretMessage };
