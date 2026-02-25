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
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const LIVE_DIR = '/opt/iptv-restream/live';
const PORT = 3000;

let activeStream = null;

function getChannelId(url) {
  return crypto.createHash('md5').update(url).digest('hex').substring(0, 12);
}

function log(msg) {
  const ts = new Date().toISOString();
  console.log('[' + ts + '] ' + msg);
}

function startRestream(sourceUrl) {
  const channelId = getChannelId(sourceUrl);
  
  if (activeStream && activeStream.id === channelId) {
    activeStream.viewers++;
    activeStream.lastActivity = Date.now();
    log('Mevcut stream devam: ' + channelId + ' (' + activeStream.viewers + ' izleyici)');
    return { id: channelId, status: 'active', playlist: '/live/' + channelId + '/playlist.m3u8' };
  }

  if (activeStream) {
    log('Kanal degistiriliyor: ' + activeStream.id + ' -> ' + channelId);
    stopCurrentStream();
  }

  const channelDir = path.join(LIVE_DIR, channelId);
  if (!fs.existsSync(channelDir)) {
    fs.mkdirSync(channelDir, { recursive: true });
  }

  log('FFmpeg baslatiliyor: ' + sourceUrl.substring(0, 80) + '...');

  const ffmpeg = spawn('ffmpeg', [
    '-hide_banner', '-loglevel', 'warning',
    '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    '-headers', 'Referer: http://rxurl.xyz/\\r\\n',
    '-reconnect', '1',
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',
    '-i', sourceUrl,
    '-c', 'copy',
    '-f', 'hls',
    '-hls_time', '3',
    '-hls_list_size', '6',
    '-hls_flags', 'delete_segments+omit_endlist',
    '-hls_segment_type', 'mpegts',
    '-hls_segment_filename', path.join(channelDir, 'seg_%03d.ts'),
    path.join(channelDir, 'playlist.m3u8')
  ]);

  activeStream = {
    id: channelId,
    source: sourceUrl,
    process: ffmpeg,
    viewers: 1,
    lastActivity: Date.now(),
    startTime: Date.now()
  };

  ffmpeg.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg && (msg.includes('error') || msg.includes('Error') || msg.includes('Warning') || msg.includes('403') || msg.includes('denied'))) {
      log('FFmpeg: ' + msg.substring(0, 200));
    }
  });

  ffmpeg.on('close', (code) => {
    log('FFmpeg kapandi (kod: ' + code + ') kanal: ' + channelId);
    if (activeStream && activeStream.id === channelId) {
      activeStream = null;
    }
    try {
      const files = fs.readdirSync(channelDir);
      files.forEach(f => fs.unlinkSync(path.join(channelDir, f)));
      fs.rmdirSync(channelDir);
    } catch(e) {}
  });

  return { id: channelId, status: 'starting', playlist: '/live/' + channelId + '/playlist.m3u8' };
}

function stopCurrentStream() {
  if (!activeStream) return;
  log('Stream durduruluyor: ' + activeStream.id);
  try {
    activeStream.process.kill('SIGTERM');
    setTimeout(() => {
      try { activeStream && activeStream.process.kill('SIGKILL'); } catch(e) {}
    }, 3000);
  } catch(e) {}
  activeStream = null;
}

setInterval(() => {
  if (activeStream && activeStream.viewers <= 0 && (Date.now() - activeStream.lastActivity > 60000)) {
    log('Inactivity timeout, stream kapatiliyor: ' + activeStream.id);
    stopCurrentStream();
  }
}, 10000);

app.post('/api/restream/start', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url gerekli' });
  try {
    const result = startRestream(url);
    res.json(result);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/restream/leave', (req, res) => {
  if (activeStream) {
    activeStream.viewers = Math.max(0, activeStream.viewers - 1);
    activeStream.lastActivity = Date.now();
  }
  res.json({ ok: true });
});

app.get('/api/restream/status', (req, res) => {
  if (!activeStream) return res.json({ active: false });
  res.json({
    active: true,
    id: activeStream.id,
    viewers: activeStream.viewers,
    uptime: Math.floor((Date.now() - activeStream.startTime) / 1000)
  });
});

app.use('/live', express.static(LIVE_DIR, {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (filePath.endsWith('.m3u8')) {
      res.setHeader('Cache-Control', 'no-cache, no-store');
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (filePath.endsWith('.ts')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Type', 'video/mp2t');
    }
  }
}));

app.get('/api/restream/health', (req, res) => { res.json({ ok: true }); });

app.listen(PORT, () => {
  log('IPTV Restream Server calisiyor: port ' + PORT);
});
`;

async function deployNewServerJs() {
    try {
        await ssh.connect(config);
        console.log('Sunucuya baglanildi. Kod yaziliyor...');

        // Geçici dosyaya yazıp mv yap (sed bozulmalarini engeller)
        await ssh.execCommand(`cat > /opt/iptv-restream/server_new.js << 'EOF'
${SERVER_CODE}
EOF`);

        await ssh.execCommand('mv /opt/iptv-restream/server_new.js /opt/iptv-restream/server.js');
        console.log('Dosya kopyalandi, servis yeniden baslatiliyor...');

        await ssh.execCommand('systemctl restart iptv-restream');

        // 3 sn bekle
        await new Promise(r => setTimeout(r, 3000));

        const checkService = await ssh.execCommand('systemctl is-active iptv-restream');
        console.log('Restream service status:', checkService.stdout.trim());

        const logs = await ssh.execCommand('cat /var/log/iptv-restream.log | tail -n 10');
        console.log('Son loglar:\\n', logs.stdout);

        ssh.dispose();
    } catch (err) {
        console.error('Hata:', err);
        process.exit(1);
    }
}

deployNewServerJs();
