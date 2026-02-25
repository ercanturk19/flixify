import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

const config = {
    host: '45.63.40.225',
    username: 'root',
    password: '3,sNP}W8zke7[*4X'
};

async function fixNginx() {
    try {
        console.log('Sunucuya bağlanılıyor...');
        await ssh.connect(config);
        
        console.log('Nginx konfigürasyonu okunuyor...');
        const result = await ssh.execCommand('cat /etc/nginx/sites-available/admin-flixify');
        console.log('Mevcut Config:', result.stdout);
        
        // Cloudflare Flexible SSL Loop Fix
        // If Cloudflare sends request as HTTP (Flexible mode), but Nginx redirects to HTTPS, it loops.
        // We will modify the config to allow HTTP traffic without redirecting, 
        // OR we can try to detect X-Forwarded-Proto.
        
        // Simpler approach for now: Comment out the redirect if it exists.
        // Actually, best practice with Cloudflare + Certbot is to ensure we listen on 443 but also accept 80 without forced redirect if Cloudflare is Flexible.
        
        // Let's just overwrite with a "safe" config that works with both Flexible and Full modes.
        // We will listen on 80 and 443, but NOT force redirect if it causes loop.
        
        const safeConfig = `server {
    listen 80;
    server_name admin.flixify.pro;
    root /var/www/flixify;
    index index.html;

    # Cloudflare Loop Fix: Do not force HTTPS redirect if Cloudflare is used
    # location / {
    #    return 301 https://$host$request_uri;
    # }

    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 443 ssl; 
    server_name admin.flixify.pro;
    root /var/www/flixify;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/admin.flixify.pro/fullchain.pem; 
    ssl_certificate_key /etc/letsencrypt/live/admin.flixify.pro/privkey.pem; 
    include /etc/letsencrypt/options-ssl-nginx.conf; 
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; 

    location / {
        try_files $uri $uri/ /index.html;
    }
}`;

        console.log('Nginx konfigürasyonu döngü düzeltmesi için güncelleniyor...');
        await ssh.execCommand(`echo '${safeConfig}' > /etc/nginx/sites-available/admin-flixify`);
        
        console.log('Nginx Reload...');
        await ssh.execCommand('systemctl reload nginx');
        console.log('Düzeltme uygulandı.');

    } catch (err) {
        console.error('Hata:', err);
    } finally {
        ssh.dispose();
    }
}

fixNginx();
