const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();

const config = {
  host: '45.63.40.225',
  username: 'root',
  password: '3,sNP}W8zke7[*4X',
  port: 22,
};

async function deploy() {
  try {
    console.log('🚀 Sunucuya bağlanılıyor...');
    await ssh.connect(config);
    console.log('✅ Bağlantı başarılı!');

    // 1. Zip dosyasını gönder
    console.log('📤 Dosyalar gönderiliyor...');
    const localZip = path.join(__dirname, '..', 'dist-update.zip');
    await ssh.putFile(localZip, '/tmp/flixify-update.zip');
    console.log('✅ Zip dosyası gönderildi');

    // 2. Mevcut dosyaları yedekle ve yenisini çıkar
    console.log('📂 Dosyalar güncelleniyor...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
    await ssh.execCommand(`cp -r /var/www/flixify /var/www/flixify-backup-${timestamp} 2>/dev/null || true`);
    await ssh.execCommand('cd /tmp && rm -rf /var/www/flixify && unzip -o flixify-update.zip -d /var/www/flixify');
    await ssh.execCommand('rm /tmp/flixify-update.zip');
    console.log('✅ Dosyalar yerleştirildi');

    // 3. İzinleri ayarla
    console.log('🔒 İzinler ayarlanıyor...');
    await ssh.execCommand('chown -R www-data:www-data /var/www/flixify');
    console.log('✅ İzinler ayarlandı');

    // 4. Nginx reload
    console.log('🔄 Nginx yeniden yükleniyor...');
    await ssh.execCommand('systemctl reload nginx');
    console.log('✅ Nginx yenilendi');

    console.log('\n🎉 DEPLOY BAŞARILI!');
    console.log('🌐 Yeni özellikler:');
    console.log('   • Ana sayfa: http://45.63.40.225/');
    console.log('   • Canlı TV (Ülke bazlı): http://45.63.40.225/canli-tv');

    ssh.dispose();
  } catch (error) {
    console.error('❌ HATA:', error.message);
    process.exit(1);
  }
}

deploy();
