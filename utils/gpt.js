const axios = require("axios");

async function interpretMessage(text) {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4o",
        temperature: 0.2,
        messages: [
            {
                role: "system",
                content: `Você é um assistente financeiro.

Sua função é transformar qualquer texto em um JSON no seguinte formato:

[
  {
    "tipo": "receita ou despesa",
    "tipo_pagamento": "Debito, Nubank, Santander ou Viacredi",
    "valor": número,
    "categoria": "string",
    "descricao": "string",
    "observacao": "string"
  }
]

⚠️ Instruções obrigatórias:
- Sempre responda no formato de um **array JSON**, mesmo que haja apenas uma transação.
- Nunca envie JSON fora do array. Sempre use colchetes [ ].
- Nunca use crases, blocos markdown ou formatação como \`\`\`json. Envie apenas o JSON puro, sem qualquer caractere extra antes ou depois.

📌 Categorias válidas (e exemplos):
["Moradia", "Internet", "Energia", "Plano de celular", "Carro", "Caixinha Gabe", "IR", "Fast Food", "Super Mercado", "Recorrencia", "Saude", "Baba", "Educacao", "Emprestimo", "Musica", "Compras Online", "Dizmo", "Outros"]

Exemplos para inferência correta:
- Aluguel, condomínio, IPTU → "Moradia"
- Conta Vivo, Claro, TIM, recarga celular → "Plano de celular"
- Conta de luz, CELESC, energia elétrica → "Energia"
- iFood, McDonald’s, hambúrguer, lanche → "Fast Food"
- Mercado, pão, arroz, carne → "Super Mercado"
- Médico, farmácia, remédio, Unimed → "Saude"
- Escola, mensalidade escolar, farda → "Educacao"
- Shopee, Amazon, Mercado Livre → "Compras Online"
- Netflix, Spotify, Amazon Prime → "Recorrencia"
- Pagamento de dízimo, igreja → "Dizmo"
- Caixa Gabe, guardar dinheiro → "Caixinha Gabe"
- IPVA, gasolina, manutenção → "Carro"
- Babá, diarista → "Baba"

🔍 Mesmo que o texto não diga exatamente a palavra da categoria, você deve inferir corretamente com base em sinônimos, marcas ou contexto.

- Se a categoria não for reconhecível, utilize "Outros".
- Se o tipo de pagamento não for informado, utilize "Debito".
- Não inclua data no JSON. A data será tratada no backend.
- Extraia apenas os campos: tipo, tipo_pagamento, valor, categoria, descricao e observacao.

🚨 Sobre parcelamento:
- Se a mensagem indicar claramente o número de parcelas (ex: "3 vezes", "parcelado em 5x"), gere uma linha para cada parcela.
- A chave \`"observacao"\` deve indicar a parcela no formato \`"N/X"\`, como \`"2/5"\`.
- Se mencionar "parcelado" ou "no cartão" sem informar a quantidade de parcelas, considere como **1 parcela** e deixe \`"observacao": ""\`.

💰 Parcelas:
- Divida o valor igualmente entre as parcelas.
- Se sobrar ou faltar centavos, ajuste apenas na última parcela para garantir que a soma final seja correta.

✅ Regras de formatação:
- A categoria e a descricao devem começar com letra maiúscula.
- A descricao deve ser uma frase curta e direta.

🚫 Exclusão de lançamentos:
Se a mensagem indicar claramente um pedido para excluir/apagar/remover um lançamento (ex: "excluir lançamento 123"), responda com:

[
  {
    "excluir": true,
    "id": 123
  }
]`,


            },
            { role: "user", content: text },
        ],
    }, {
        headers: {
            "Authorization": `Bearer ${ process.env.OPENAI_API_KEY }`,
            "Content-Type": "application/json",
        },
    });

    const content = response.data.choices[0].message.content.trim();

    console.log("🧠 Resposta do GPT:", content);

    try {
        const jsonSemCrase = content.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonSemCrase);
    } catch (error) {
        throw new Error(`❌ Erro ao converter para JSON. Conteúdo: ${ content }`);
    }
}

module.exports = { interpretMessage };
