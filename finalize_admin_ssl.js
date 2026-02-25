import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

const config = {
    host: '45.63.40.225',
    username: 'root',
    password: '3,sNP}W8zke7[*4X'
};

async function finalizeSSL() {
    try {
        console.log('Sunucuya bağlanılıyor...');
        await ssh.connect(config);
        console.log('Bağlantı başarılı!');

        console.log('SSL Sertifikası (Certbot) tekrar deneniyor...');
        
        // Retry obtaining SSL certificate
        // We use --nginx plugin which automates the config update
        const certbot = await ssh.execCommand('certbot --nginx -d admin.flixify.pro --non-interactive --agree-tos -m admin@flixify.pro --redirect');
        
        console.log('Certbot Çıktısı:', certbot.stdout);
        
        if (certbot.stderr) {
            console.error('Certbot Hata/Uyarı:', certbot.stderr);
            
            // If it fails, it might be due to propagation or Cloudflare proxy.
            // We can check if nginx is at least running on port 80
            if (certbot.stderr.includes('Certificate Authority failed to verify')) {
                console.log('--- BİLGİLENDİRME ---');
                console.log('Cloudflare Proxy (Turuncu Bulut) açık olduğu için doğrulama bazen gecikebilir.');
                console.log('Ancak Nginx şu an HTTP (Port 80) üzerinden çalışıyor olmalı.');
            }
        } else {
            console.log('SSL Başarıyla Kuruldu! 🔒');
        }

        console.log('Nginx Reload...');
        await ssh.execCommand('systemctl reload nginx');

    } catch (err) {
        console.error('Kritik Hata:', err);
    } finally {
        ssh.dispose();
    }
}

finalizeSSL();
