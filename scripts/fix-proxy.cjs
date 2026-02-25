const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const config = {
    host: '45.63.40.225',
    username: 'root',
    password: '3,sNP}W8zke7[*4X',
    port: 22,
};

const SERVER_CODE = `
const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const URL = require('url').URL;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

let activeStreamUrl = null;
let activeClients = 0;
let streamTimeout = null;

function log(msg) {
  const ts = new Date().toISOString();
  console.log('[' + ts + '] ' + msg);
}

// 1. İstemci video oynamak istiyince başlat
app.post('/api/restream/start', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url gerekli' });

  // İstemciler aynı kanalı izliyorsa yeni url üretmeye gerek yok
  activeStreamUrl = url;
  
  // FFmpeg HLS yerine doğrudan proxy rotasına yönlendir
  res.json({ id: 'proxy', status: 'ready', playlist: '/live/proxy.m3u8' });
});

app.post('/api/restream/leave', (req, res) => {
  res.json({ ok: true });
});

// 2. Doğrudan m3u8 proxy (HLS.js bunu çağıracak)
app.get('/live/proxy.m3u8', (req, res) => {
  if (!activeStreamUrl) return res.status(404).send('Stream yok');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  
  const client = activeStreamUrl.startsWith('https') ? https : http;
  
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'http://rxurl.xyz/',
      'Accept': '*/* '
    }
  };

  const reqUrl = new URL(activeStreamUrl);
  
  const proxyReq = client.get(activeStreamUrl, options, (proxyRes) => {
    // Playlist içindeki TS (segment) yollarını bizim proxy'mize yönlendir
    let body = '';
    proxyRes.on('data', chunk => { body += chunk; });
    proxyRes.on('end', () => {
      // .ts dosyalarını "/live/segment?url=..." formatına dönüştür
      let modifiedPlaylist = body.split('\\n').map(line => {
        if (line.trim().endsWith('.ts') || line.trim().endsWith('.m3u8')) {
          let absoluteSegmentUrl = line;
          if (!line.startsWith('http')) {
             absoluteSegmentUrl = new URL(line, activeStreamUrl).href;
          }
          return '/live/segment?url=' + encodeURIComponent(absoluteSegmentUrl);
        }
        return line;
      }).join('\\n');
      
      res.send(modifiedPlaylist);
    });
  });
  
  proxyReq.on('error', (err) => {
    log('M3U8 Hata: ' + err.message);
    res.status(500).send('Hata');
  });
});

// 3. Segment (TS) Proxy (Gerçek videoyu çeker)
app.get('/live/segment', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('bad req');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'video/mp2t');

  const client = url.startsWith('https') ? https : http;
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'http://rxurl.xyz/'
    }
  };

  const proxyReq = client.get(url, options, (proxyRes) => {
      proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    res.status(500).send('Seg Hata');
  });
});

app.get('/api/restream/health', (req, res) => res.json({ ok: true, type: 'proxy' }));

app.listen(PORT, () => {
  log('IPTV HTTP Proxy Server calisiyor: port ' + PORT);
});
`;

async function deployProxyServer() {
    try {
        await ssh.connect(config);
        console.log('Sunucuya baglanildi. Yeni PROXY kodu yaziliyor...');

        await ssh.execCommand(`cat > /opt/iptv-restream/server_new.js << 'EOF'
${SERVER_CODE}
EOF`);

        await ssh.execCommand('mv /opt/iptv-restream/server_new.js /opt/iptv-restream/server.js');
        console.log('Dosya kopyalandi, servis yeniden baslatiliyor...');

        await ssh.execCommand('systemctl restart iptv-restream');

        await new Promise(r => setTimeout(r, 2000));

        const checkService = await ssh.execCommand('systemctl is-active iptv-restream');
        console.log('Restream service status:', checkService.stdout.trim());

        ssh.dispose();
    } catch (err) {
        console.error('Hata:', err);
        process.exit(1);
    }
}

deployProxyServer();
