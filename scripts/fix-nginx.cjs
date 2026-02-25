const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const config = {
    host: '45.63.40.225',
    username: 'root',
    password: '3,sNP}W8zke7[*4X',
    port: 22,
};

async function fixNginx() {
    try {
        await ssh.connect(config);
        console.log('Sunucuya baglanildi. Nginx duzeltiliyor...');

        const nginxConf = `server {
    listen 80;
    server_name _;
    root /var/www/flixify;
    index index.html;

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

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 30d;
    }

    client_max_body_size 100M;
}`;

        await ssh.execCommand(`cat > /etc/nginx/sites-available/flixify << 'EOF'
${nginxConf}
EOF`);

        const reloadResult = await ssh.execCommand('nginx -t && systemctl reload nginx');
        console.log('Nginx reload:', reloadResult.stdout || reloadResult.stderr);

        const checkService = await ssh.execCommand('systemctl is-active iptv-restream');
        console.log('Restream service:', checkService.stdout.trim());

        if (checkService.stdout.trim() !== 'active') {
            const startResult = await ssh.execCommand('systemctl start iptv-restream');
            console.log('Service started', startResult.stderr);
        }

        ssh.dispose();
    } catch (err) {
        console.error('Hata:', err);
        process.exit(1);
    }
}

fixNginx();
