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
 "valor": número,
 "categoria": "string",
 "descricao": "string"
}

⚠️ Instruções obrigatórias:
- Não inclua data no JSON. A data será tratada no backend.
- Extraia apenas os campos: tipo, valor, categoria e descrição.
- Sempre responda apenas com o JSON puro, sem comentários, sem explicações, sem texto adicional.
- Categoria e descrição começar com a primeira letra maiúscula.
- Todos os campos devem estar preenchidos. Se não houver descrição, use uma string vazia "".
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
