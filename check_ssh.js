import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

const config = {
    host: '45.63.40.225',
    username: 'root',
    password: '3,sNP}W8zke7[*4X'
};

async function checkServer() {
    try {
        console.log('Sunucuya bağlanılıyor (SSH)...');
        await ssh.connect(config);
        console.log('Bağlantı başarılı!');
        
        const result = await ssh.execCommand('nginx -v');
        console.log('Nginx Sürümü:', result.stderr || result.stdout);
        
        const sites = await ssh.execCommand('ls /etc/nginx/sites-available');
        console.log('Mevcut Siteler:', sites.stdout);

    } catch (err) {
        console.error('Hata:', err);
    } finally {
        ssh.dispose();
    }
}

checkServer();