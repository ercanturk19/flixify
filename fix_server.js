import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

const config = {
    host: '45.32.157.236',
    username: 'root',
    password: 'Ae9#FJk,KxeMw4Hz'
};

async function fixServer() {
    try {
        console.log('Sunucuya bağlanılıyor...');
        await ssh.connect(config);
        console.log('✅ Bağlantı başarılı!');
        
        // System nginx'i durdur ve devre dışı bırak
        console.log('\n1. System nginx durduruluyor...');
        await ssh.execCommand('systemctl stop nginx');
        await ssh.execCommand('systemctl disable nginx');
        console.log('✅ Nginx durduruldu');
        
        // Docker container'ları kontrol et
        console.log('\n2. Docker containerlar kontrol ediliyor...');
        const dockerPs = await ssh.execCommand('docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"');
        console.log(dockerPs.stdout);
        
        // Coolify'ı yeniden başlat
        console.log('\n3. Coolify yeniden başlatılıyor...');
        await ssh.execCommand('cd /data/coolify && docker-compose restart');
        console.log('✅ Coolify yeniden başlatıldı');
        
        // Traefik container'ını kontrol et
        console.log('\n4. Traefik proxy kontrol ediliyor...');
        const traefik = await ssh.execCommand('docker ps | grep traefik');
        if (traefik.stdout) {
            console.log('✅ Traefik çalışıyor:');
            console.log(traefik.stdout);
        } else {
            console.log('⚠️ Traefik bulunamadı');
        }
        
        // Flixify container'ını kontrol et
        console.log('\n5. Flixify container kontrol ediliyor...');
        const flixify = await ssh.execCommand('docker ps | grep flixify');
        if (flixify.stdout) {
            console.log('✅ Flixify çalışıyor:');
            console.log(flixify.stdout);
        } else {
            console.log('⚠️ Flixify container bulunamadı');
        }
        
        console.log('\n🎉 İşlem tamamlandı!');
        console.log('Siteye erişmeyi deneyin: http://45.32.157.236');
        
    } catch (err) {
        console.error('❌ Hata:', err.message);
    } finally {
        ssh.dispose();
    }
}

fixServer();
