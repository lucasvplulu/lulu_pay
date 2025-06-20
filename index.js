require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const { transcribeAudio } = require('./utils/transcribe');
const { interpretMessage } = require('./utils/gpt');
const { addToSheet } = require('./utils/sheets');
const { extrairData } = require('./utils/data');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

console.log('🤖 Bot rodando...');

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    try {
        let userInput = '';

        if (msg.voice) {
            bot.sendMessage(chatId, '🎧 Recebi seu áudio. Transcrevendo...');

            const fileLink = await bot.getFileLink(msg.voice.file_id);
            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });

            const filePath = `./audio-${chatId}.ogg`;
            fs.writeFileSync(filePath, response.data);

            userInput = await transcribeAudio(filePath);

            fs.unlinkSync(filePath);

            bot.sendMessage(chatId, `📝 Transcrição: ${userInput}`);
        } else if (msg.text) {
            userInput = msg.text;
        } else {
            bot.sendMessage(chatId, '❌ Envie texto ou áudio para processar.');
            return;
        }

        const parsedData = await interpretMessage(userInput);
        parsedData.data = extrairData(userInput);

        for (const item of parsedData) {
    item.data = extrairData(userInput);
    item.competencia = calcularCompetencia(item.data, item.tipo_pagamento);
    await addToSheet(item);
}

        bot.sendMessage(chatId, `✅ Anotado: ${parsedData.tipo} de R$${parsedData.valor} em ${parsedData.categoria} (${parsedData.descricao}) na data ${parsedData.data}`);

    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
    }
});
