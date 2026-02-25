import Client from 'ssh2-sftp-client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    host: '45.63.40.225',
    port: 22,
    username: 'root',
    password: '3,sNP}W8zke7[*4X'
};

const sftp = new Client();
const localDir = path.join(__dirname, 'dist');
const remoteDir = '/var/www/flixify';

async function main() {
    try {
        console.log('Sunucuya bağlanılıyor...');
        await sftp.connect(config);
        console.log('Bağlantı başarılı!');

        console.log('Dosyalar yükleniyor (eski dosyalar temizlenip)...');
        
        // Önce temizle (eğer varsa)
        const exists = await sftp.exists(remoteDir);
        if (exists) {
            await sftp.rmdir(remoteDir, true); // true = recursive delete
        }
        
        // Klasörü oluştur ve yükle
        await sftp.mkdir(remoteDir, true);
        await sftp.uploadDir(localDir, remoteDir);

        console.log('Yükleme BAŞARIYLA tamamlandı!');
        console.log('Siteyi test edebilirsiniz: https://flixify.pro');
    } catch (err) {
        console.error('Hata:', err);
    } finally {
        sftp.end();
    }
}

main();