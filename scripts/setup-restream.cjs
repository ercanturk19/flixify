const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

const config = {
    host: '45.63.40.225',
    username: 'root',
    password: '3,sNP}W8zke7[*4X',
    port: 22,
};

const SERVER_JS = `
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

// Aktif stream bilgisi (tek bağlantı hakkı = tek kanal)
let activeStream = null; // { id, source, process, viewers, lastActivity }

function getChannelId(url) {
  return crypto.createHash('md5').update(url).digest('hex').substring(0, 12);
}

function log(msg) {
  const ts = new Date().toISOString();
  console.log('[' + ts + '] ' + msg);
}

function startRestream(sourceUrl) {
  const channelId = getChannelId(sourceUrl);
  
  // Zaten bu kanal aktifse, sadece viewer artır
  if (activeStream && activeStream.id === channelId) {
    activeStream.viewers++;
    activeStream.lastActivity = Date.now();
    log('Mevcut stream devam: ' + channelId + ' (' + activeStream.viewers + ' izleyici)');
    return { id: channelId, status: 'active', playlist: '/live/' + channelId + '/playlist.m3u8' };
  }

  // Farklı kanal isteniyorsa, eskiyi durdur
  if (activeStream) {
    log('Kanal degistiriliyor: ' + activeStream.id + ' -> ' + channelId);
    stopCurrentStream();
  }

  // Yeni kanal dizini
  const channelDir = path.join(LIVE_DIR, channelId);
  if (!fs.existsSync(channelDir)) {
    fs.mkdirSync(channelDir, { recursive: true });
  }

  log('FFmpeg baslatiliyor: ' + sourceUrl.substring(0, 80) + '...');

  const ffmpeg = spawn('ffmpeg', [
    '-hide_banner', '-loglevel', 'warning',
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
    if (msg && (msg.includes('error') || msg.includes('Error') || msg.includes('Warning'))) {
      log('FFmpeg: ' + msg.substring(0, 200));
    }
  });

  ffmpeg.on('close', (code) => {
    log('FFmpeg kapandi (kod: ' + code + ') kanal: ' + channelId);
    if (activeStream && activeStream.id === channelId) {
      activeStream = null;
    }
    // Eski segmentleri temizle
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

// Inactivity checker - 60sn izleyici yoksa kapat
setInterval(() => {
  if (activeStream && activeStream.viewers <= 0 && (Date.now() - activeStream.lastActivity > 60000)) {
    log('Inactivity timeout, stream kapatiliyor: ' + activeStream.id);
    stopCurrentStream();
  }
}, 10000);

// API: Restream baslat
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

// API: Restream durdur (izleyici ayrildi)
app.post('/api/restream/leave', (req, res) => {
  if (activeStream) {
    activeStream.viewers = Math.max(0, activeStream.viewers - 1);
    activeStream.lastActivity = Date.now();
    log('Izleyici ayrildi: ' + activeStream.viewers + ' kaldi');
  }
  res.json({ ok: true });
});

// API: Durum
app.get('/api/restream/status', (req, res) => {
  if (!activeStream) return res.json({ active: false });
  res.json({
    active: true,
    id: activeStream.id,
    viewers: activeStream.viewers,
    uptime: Math.floor((Date.now() - activeStream.startTime) / 1000)
  });
});

// HLS dosya servisi
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

// Health check
app.get('/api/restream/health', (req, res) => { res.json({ ok: true }); });

app.listen(PORT, () => {
  log('IPTV Restream Server calisiyor: port ' + PORT);
});
`;

const SYSTEMD_SERVICE = `[Unit]
Description=IPTV Restream Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/iptv-restream
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
StandardOutput=append:/var/log/iptv-restream.log
StandardError=append:/var/log/iptv-restream.log
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;

const NGINX_RESTREAM = `
    # IPTV Restream API
    location /api/restream/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # HLS Live Streams
    location /live/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
        add_header Access-Control-Allow-Origin * always;
        add_header Cache-Control "no-cache" always;
    }
`;

async function setup() {
    try {
        console.log('🚀 Vultr sunucusuna bağlanılıyor...');
        await ssh.connect(config);
        console.log('✅ Bağlantı başarılı!');

        // 1. FFmpeg ve Node.js kontrolü
        console.log('🔍 FFmpeg ve Node.js kontrol ediliyor...');
        let result = await ssh.execCommand('which ffmpeg && which node && node -v');
        console.log('   Araçlar:', result.stdout.trim());

        if (!result.stdout.includes('ffmpeg')) {
            console.log('📦 FFmpeg kuruluyor...');
            await ssh.execCommand('apt update && apt install -y ffmpeg');
        }

        // 2. Dizinleri oluştur
        console.log('📂 Dizinler oluşturuluyor...');
        await ssh.execCommand('mkdir -p /opt/iptv-restream/live /opt/iptv-restream/logs');

        // 3. package.json oluştur
        console.log('📝 package.json oluşturuluyor...');
        await ssh.execCommand(`cat > /opt/iptv-restream/package.json << 'PKGEOF'
{
  "name": "iptv-restream",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
PKGEOF`);

        // 4. server.js oluştur
        console.log('📝 server.js oluşturuluyor...');
        await ssh.execCommand(`cat > /opt/iptv-restream/server.js << 'SRVEOF'
${SERVER_JS}
SRVEOF`);

        // 5. npm install
        console.log('📦 NPM paketleri kuruluyor...');
        result = await ssh.execCommand('cd /opt/iptv-restream && npm install --production', { cwd: '/opt/iptv-restream' });
        console.log('   npm:', result.stdout.includes('added') ? '✅ Paketler kuruldu' : result.stdout.substring(0, 100));
        if (result.stderr) console.log('   npm stderr:', result.stderr.substring(0, 200));

        // 6. Systemd servisi oluştur
        console.log('⚙️ Systemd servisi oluşturuluyor...');
        await ssh.execCommand(`cat > /etc/systemd/system/iptv-restream.service << 'SVCEOF'
${SYSTEMD_SERVICE}
SVCEOF`);

        await ssh.execCommand('systemctl daemon-reload');
        await ssh.execCommand('systemctl enable iptv-restream');

        // Eski process'i durdur ve yeniden başlat
        await ssh.execCommand('systemctl stop iptv-restream 2>/dev/null; systemctl start iptv-restream');
        console.log('✅ Restream servisi başlatıldı!');

        // 7. Nginx konfigürasyonuna restream bloğunu ekle
        console.log('🔧 Nginx yapılandırılıyor...');

        // Mevcut nginx conf'u oku
        result = await ssh.execCommand('cat /etc/nginx/sites-available/flixify 2>/dev/null || cat /etc/nginx/sites-enabled/default 2>/dev/null || echo "NOT_FOUND"');
        const currentNginx = result.stdout;

        if (currentNginx.includes('/api/restream')) {
            console.log('   ℹ️ Restream blokları zaten mevcut');
        } else {
            // location / bloğundan _önce_ restream location bloklarını ekle
            console.log('   📝 Restream location blokları ekleniyor...');

            // Nginx config dosyasının adını bul
            const confFile = await ssh.execCommand('ls /etc/nginx/sites-available/ | head -1');
            const confName = confFile.stdout.trim() || 'default';
            const confPath = `/etc/nginx/sites-available/${confName}`;

            // Restream blokları: "location /" satırının hemen ÖNÜNE ekle
            await ssh.execCommand(`sed -i '/location \\/ {/i \\
    # IPTV Restream API\\n\\
    location /api/restream/ {\\n\\
        proxy_pass http://127.0.0.1:3000;\\n\\
        proxy_http_version 1.1;\\n\\
        proxy_set_header Host \\$host;\\n\\
        proxy_set_header X-Real-IP \\$remote_addr;\\n\\
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;\\n\\
        proxy_connect_timeout 10s;\\n\\
        proxy_send_timeout 30s;\\n\\
        proxy_read_timeout 30s;\\n\\
    }\\n\\
\\n\\
    # HLS Live Streams\\n\\
    location /live/ {\\n\\
        proxy_pass http://127.0.0.1:3000;\\n\\
        proxy_http_version 1.1;\\n\\
        proxy_set_header Host \\$host;\\n\\
        proxy_set_header X-Real-IP \\$remote_addr;\\n\\
        proxy_buffering off;\\n\\
        add_header Access-Control-Allow-Origin * always;\\n\\
        add_header Cache-Control "no-cache" always;\\n\\
    }\\n' ${confPath}`);
        }

        // Nginx testi ve reload
        result = await ssh.execCommand('nginx -t 2>&1');
        if (result.stderr && result.stderr.includes('successful')) {
            await ssh.execCommand('systemctl reload nginx');
            console.log('✅ Nginx yeniden yüklendi!');
        } else {
            console.log('⚠️ Nginx test sonucu:', result.stderr || result.stdout);
        }

        // 8. Servis durumunu kontrol et
        console.log('\n🔍 Servis durumu kontrol ediliyor...');
        result = await ssh.execCommand('systemctl is-active iptv-restream');
        console.log('   Restream servisi:', result.stdout.trim());

        // Health check
        result = await ssh.execCommand('curl -s http://127.0.0.1:3000/api/restream/health 2>/dev/null || echo "NOT_READY"');
        console.log('   Health check:', result.stdout.trim());

        console.log('\n🎉 RESTREAM KURULUMU TAMAMLANDI!');
        console.log('   API: http://45.63.40.225/api/restream/health');
        console.log('   HLS: http://45.63.40.225/live/{id}/playlist.m3u8');

        ssh.dispose();
    } catch (error) {
        console.error('❌ HATA:', error.message);
        process.exit(1);
    }
}

setup();
