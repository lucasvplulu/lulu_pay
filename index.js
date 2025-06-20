require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
const { transcribeAudio } = require("./utils/transcribe");
const { interpretMessage } = require("./utils/gpt");
const { addToSheet, excluirLancamentoPorId, getProximoIdentificador } = require("./utils/sheets");
const { extrairData, calcularCompetencia } = require("./utils/data");

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
console.log("🤖 Bot rodando...");

const estadosPendentes = {}; // Armazena estados pendentes por chatId

// 🔍 Verifica se há palavra indicando cartão ou parcelamento
function contemPalavraChaveCartaoOuParcelamento(texto) {
    const textoLower = texto.toLowerCase();
    return (
        textoLower.includes("cartao") ||
        textoLower.includes("cartão") ||
        textoLower.includes("cartao de credito") ||
        textoLower.includes("cartão de crédito") ||
        textoLower.includes("credito") ||
        textoLower.includes("crédito") ||
        textoLower.includes("parcelado") ||
        textoLower.includes("parcela") ||
        textoLower.includes("vezes")
    );
}

// 🎧 Processa mensagens de áudio
async function processarAudio(msg, chatId) {
    const fileLink = await bot.getFileLink(msg.voice.file_id);
    const response = await axios.get(fileLink, { responseType: "arraybuffer" });

    const filePath = `./audio-${chatId}.ogg`;
    fs.writeFileSync(filePath, response.data);

    const texto = await transcribeAudio(filePath);
    fs.unlinkSync(filePath);

    await bot.sendMessage(chatId, `📝 Transcrição: ${texto}`);
    return texto;
}

// 📝 Processa e grava os dados no Google Sheets
async function processarLancamento({ chatId, dados, dataInformada, tipoCartao = null }) {
    const identificador = await getProximoIdentificador(); // 🔥 Gera antes do loop
    let mensagem = `✅ Lançamento #${identificador} anotado:\n`;
    console.log('🔄 Processando lançamento...');
    console.log('📑 Dados recebidos para lançamento:', JSON.stringify(dados, null, 2));
    console.log('📅 Data informada:', dataInformada);
    console.log('💳 Tipo de cartão recebido (se houver):', tipoCartao);

    for (const item of dados) {
        if (tipoCartao) {
            item.tipo_pagamento = tipoCartao;
        }

        item.data = dataInformada;
        item.competencia = calcularCompetencia(item.data, item.tipo_pagamento);

        console.log('➡️ Lançamento individual:', item);

        await addToSheet(item, identificador);

        mensagem += `• ${item.tipo} de R$${item.valor} em ${item.categoria} (${item.descricao}) no cartão ${item.tipo_pagamento} na data ${item.data}\n`;
    }

    await bot.sendMessage(chatId, mensagem);
}

// 🚦 Handler de mensagens
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    let texto = "";

    if (msg.voice) {
        await bot.sendMessage(chatId, "🎧 Recebi seu áudio. Transcrevendo...");
        texto = await processarAudio(msg, chatId);
    } else if (msg.text) {
        texto = msg.text;
    } else {
        await bot.sendMessage(chatId, "❌ Envie texto ou áudio para processar.");
        return;
    }

    try {

        const regexExcluir = /\b(excluir|apagar|remover|deletar)?\s*(o\s*)?lan[cç]amento\s*(\d{1,6})\b/i;
        const matchExcluir = texto.match(regexExcluir);

        if (matchExcluir) {
            const idParaExcluir = matchExcluir[3];

            const resultado = await excluirLancamentoPorId(idParaExcluir);

            if (resultado.sucesso) {
                await bot.sendMessage(
                    chatId,
                    `🗑️ Lançamento #${idParaExcluir} excluído com sucesso. (${resultado.quantidade} linha(s) removida(s))`
                );
            } else {
                await bot.sendMessage(
                    chatId,
                    `❌ Lançamento #${idParaExcluir} não encontrado.`
                );
            }

            return; // 🔥 Importante! Para não continuar o fluxo normal.
        }


        // ✅ Se aguardando a escolha do cartão
        if (estadosPendentes[chatId]?.esperandoCartao) {
            await bot.sendMessage(chatId, "❌ Por favor, selecione o cartão nos botões abaixo.");
            return;
        }

        const parsedData = await interpretMessage(texto);
        const dataInformada = extrairData(texto);

        console.log('🧠 Texto recebido:', texto);
        console.log('🧠 Dados interpretados:', JSON.stringify(parsedData, null, 2));
        console.log('📅 Data extraída:', dataInformada);

        const palavraChaveDetectada = contemPalavraChaveCartaoOuParcelamento(texto);
        console.log('💳 Palavra-chave cartão detectada?', palavraChaveDetectada);

        if (palavraChaveDetectada) {
            estadosPendentes[chatId] = {
                esperandoCartao: true,
                dados: parsedData,
                data: dataInformada
            };

            await bot.sendMessage(chatId, "💳 Detectei que você mencionou 'cartão' ou 'parcelado'.\nSelecione o cartão:", {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Nubank", callback_data: "cartao_Nubank" },
                            { text: "Santander", callback_data: "cartao_Santander" }
                        ],
                        [
                            { text: "Viacredi", callback_data: "cartao_Viacredi" },
                            { text: "Debito", callback_data: "debito" },
                        ]
                    ]
                }
            });
            return;
        }

        await processarLancamento({ chatId, dados: parsedData, dataInformada });

    } catch (error) {
        console.error(error);
        await bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
    }
});

// ✅ Handler dos botões (callback)
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    if (data.startsWith('cartao_')) {
        const tipoCartao = data.replace('cartao_', '');
        const estado = estadosPendentes[chatId];

        if (!estado) {
            await bot.sendMessage(chatId, "❌ Nenhuma operação pendente.");
            await bot.answerCallbackQuery(callbackQuery.id);
            return;
        }

        console.log('💳 Cartão selecionado pelo botão:', tipoCartao);

        // ✅ Remove os botões da mensagem imediatamente
        await bot.editMessageReplyMarkup(
            { inline_keyboard: [] },
            {
                chat_id: chatId,
                message_id: messageId
            }
        );

        await bot.answerCallbackQuery(callbackQuery.id, { text: `Cartão selecionado: ${tipoCartao}`, show_alert: false });

        // 🚀 Só depois processa os lançamentos
        await processarLancamento({
            chatId,
            dados: estado.dados,
            dataInformada: estado.data,
            tipoCartao
        });

        delete estadosPendentes[chatId];
    }
});


