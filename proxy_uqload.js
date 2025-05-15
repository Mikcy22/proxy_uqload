const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const { PassThrough } = require('stream');

const app = express();
app.use(cors()); // permite llamadas desde tu app web o móvil

// Ruta principal
app.get('/stream', async (req, res) => {
    const embedUrl = req.query.url;

    if (!embedUrl || !embedUrl.includes('uqload.net/embed-')) {
        return res.status(400).send('❌ URL no válida');
    }

    try {
        // 1. Cargar la página embed de uqload
        const response = await axios.get(embedUrl);
        const $ = cheerio.load(response.data);

        let videoUrl = null;

        $('script').each((i, el) => {
            const scriptContent = $(el).html();
            if (scriptContent.includes('Clappr.Player')) {
                const match = scriptContent.match(/sources:\s*\["(.*?)"\]/);
                if (match && match[1]) {
                    videoUrl = match[1];
                }
            }
        });

        if (!videoUrl) {
            return res.status(500).send('❌ No se pudo obtener el enlace del vídeo');
        }

        // 2. Proxificar el vídeo desde el mismo servidor
        const videoResponse = await axios.get(videoUrl, {
          responseType: 'stream',
          headers: {
            'Referer': embedUrl,
            'User-Agent': 'Mozilla/5.0',
            'Cookie': 'tu_cookie_si_la_tienes'
          }
        });

        // 3. Retransmitir al cliente
        res.setHeader('Content-Type', 'video/mp4');
        videoResponse.data.pipe(res);

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).send('❌ Error al procesar la URL');
    }
});

// Puerto del servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Proxy de Uqload escuchando en http://localhost:${PORT}`);
});
