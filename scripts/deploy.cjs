const { NodeSSH } = require('node-ssh');
const fs = require('fs');
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

    // 1. Eski siteyi yedekle
    console.log('📦 Eski site yedekleniyor...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
    await ssh.execCommand(`mv /var/www/flixify /var/www/flixify-backup-${timestamp} 2>/dev/null || true`);
    console.log('✅ Yedekleme tamamlandı');

    // 2. Zip dosyasını gönder
    console.log('📤 Dosyalar gönderiliyor...');
    const localZip = path.join(__dirname, '..', 'dist.zip');
    await ssh.putFile(localZip, '/tmp/flixify-update.zip');
    console.log('✅ Zip dosyası gönderildi');

    // 3. Sunucuda zip'i aç
    console.log('📂 Dosyalar açılıyor...');
    await ssh.execCommand('cd /tmp && unzip -o flixify-update.zip -d /var/www/flixify-temp');
    await ssh.execCommand('mv /var/www/flixify-temp /var/www/flixify');
    await ssh.execCommand('rm /tmp/flixify-update.zip');
    console.log('✅ Dosyalar yerleştirildi');

    // 4. İzinleri ayarla
    console.log('🔒 İzinler ayarlanıyor...');
    await ssh.execCommand('chown -R www-data:www-data /var/www/flixify');
    console.log('✅ İzinler ayarlandı');

    // 5. Nginx reload
    console.log('🔄 Nginx yeniden yükleniyor...');
    await ssh.execCommand('systemctl reload nginx');
    console.log('✅ Nginx yenilendi');

    console.log('\n🎉 DEPLOY BAŞARILI!');
    console.log('🌐 Site: http://45.63.40.225');

    ssh.dispose();
  } catch (error) {
    console.error('❌ HATA:', error.message);
    process.exit(1);
  }
}

deploy();
