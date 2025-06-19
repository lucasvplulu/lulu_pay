const { FormData } = require('formdata-node');
const { fileFromPath } = require('formdata-node/file-from-path');
const axios = require('axios');

async function transcribeAudio(filePath) {
    const formData = new FormData();
    formData.set('file', await fileFromPath(filePath));
    formData.set('model', 'whisper-1');

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.headers
        }
    });

    return response.data.text;
}

module.exports = { transcribeAudio };
