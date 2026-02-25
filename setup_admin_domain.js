import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

const config = {
    host: '45.63.40.225',
    username: 'root',
    password: '3,sNP}W8zke7[*4X'
};

const nginxConfig = `server {
    listen 80;
    server_name admin.flixify.pro;
    root /var/www/flixify;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}`;

async function setupAdmin() {
    try {
        console.log('Sunucuya bağlanılıyor...');
        await ssh.connect(config);
        console.log('Bağlantı başarılı!');

        console.log('Nginx konfigürasyonu hazırlanıyor...');
        
        // Write config to a temporary file first
        await ssh.execCommand(`echo '${nginxConfig}' > /tmp/admin-flixify`);
        
        // Move to sites-available
        await ssh.execCommand('mv /tmp/admin-flixify /etc/nginx/sites-available/admin-flixify');
        
        // Enable site (symlink)
        await ssh.execCommand('ln -sf /etc/nginx/sites-available/admin-flixify /etc/nginx/sites-enabled/');
        
        console.log('Nginx yeniden başlatılıyor...');
        const reload = await ssh.execCommand('systemctl reload nginx');
        
        if (reload.stderr) {
            console.error('Nginx Reload Hatası:', reload.stderr);
        } else {
            console.log('Nginx başarıyla güncellendi!');
        }

        console.log('SSL Sertifikası (Certbot) deneniyor...');
        // Try to obtain SSL certificate non-interactively
        // Assuming certbot is installed and using nginx plugin
        const certbot = await ssh.execCommand('certbot --nginx -d admin.flixify.pro --non-interactive --agree-tos -m admin@flixify.pro --redirect');
        
        console.log('Certbot Çıktısı:', certbot.stdout);
        if (certbot.stderr) console.error('Certbot Hatası (DNS kaydı yoksa hata verebilir):', certbot.stderr);

    } catch (err) {
        console.error('Kritik Hata:', err);
    } finally {
        ssh.dispose();
    }
}

setupAdmin();
