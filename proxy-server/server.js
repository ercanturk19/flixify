const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3001;

// Tüm origin'lerden gelen isteklere izin ver
app.use(cors({ origin: '*' }));

// Playlist endpoint - statik dosyayı sun
app.get('/playlist', (req, res) => {
    const playlistPath = path.join(__dirname, 'playlist.m3u');
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(playlistPath, (err) => {
        if (err) {
            console.error('[PLAYLIST] Dosya gönderilemedi:', err.message);
            res.status(500).json({ error: 'Playlist dosyası bulunamadı' });
        }
    });
});

// Proxy endpoint
app.get('/proxy', async (req, res) => {
    let targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: 'URL parametresi eksik.' });
    }

    // Trim whitespace from targetUrl
    targetUrl = targetUrl.trim();

    try {
        console.log(`[PROXY] İstek: ${targetUrl.substring(0, 80)}...`);

        // Parse target URL for referer
        const urlObj = new URL(targetUrl);
        const referer = `${urlObj.protocol}//${urlObj.host}/`;

        // Realistic browser headers to avoid 403 blocking
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate',
                'Referer': referer,
                'Origin': referer,
                'Connection': 'keep-alive',
                'DNT': '1'
            },
            redirect: 'follow',
        });

        if (!response.ok) {
            console.error(`[PROXY] Hedef sunucu hatası: ${response.status} - ${targetUrl}`);
            const errorText = await response.text().catch(() => '');
            console.error(`[PROXY] Hata gövdesi: ${errorText.substring(0, 200)}`);

            return res.status(response.status).send(`Hedef sunucu hatası: ${response.status} ${errorText.substring(0, 100)}`);
        }

        // Gelen Content-Type başlığını olduğu gibi aktar
        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        // CORS başlıklarını ayarla
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Expose-Headers', '*');

        // Body'yi doğrudan pipe et (bellek tasarrufu)
        const reader = response.body.getReader();

        const pump = async () => {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    res.end();
                    break;
                }
                res.write(Buffer.from(value));
            }
        };

        pump().catch(err => {
            console.error('[PROXY] Stream hatası:', err.message);
            if (!res.headersSent) {
                res.status(500).send('Stream hatası');
            }
        });

    } catch (error) {
        console.error('[PROXY] Bağlantı hatası:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Proxy bağlantı hatası: ' + error.message });
        }
    }
});

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'Flixify IPTV Proxy' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Flixify Proxy sunucusu çalışıyor: http://0.0.0.0:${PORT}`);
});
