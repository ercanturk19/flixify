const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();

const config = {
    host: '45.63.40.225',
    username: 'root',
    password: '3,sNP}W8zke7[*4X',
    port: 22,
};

async function setupProxy() {
    try {
        console.log('🚀 Sunucuya bağlanılıyor...');
        await ssh.connect(config);
        console.log('✅ Bağlantı başarılı!');

        // 1. Upload nginx config
        console.log('📤 Nginx konfigürasyonu yükleniyor...');
        const nginxConfPath = path.join(__dirname, '..', 'proxy-server', 'flixify.nginx.conf');
        await ssh.putFile(nginxConfPath, '/etc/nginx/sites-available/flixify');

        // Create symlink if not exists
        await ssh.execCommand('ln -sf /etc/nginx/sites-available/flixify /etc/nginx/sites-enabled/flixify');
        // Remove default if exists
        await ssh.execCommand('rm -f /etc/nginx/sites-enabled/default');
        console.log('✅ Nginx konfigürasyonu güncellendi');

        // 2. Test nginx config
        console.log('🔍 Nginx konfigürasyonu test ediliyor...');
        const testResult = await ssh.execCommand('nginx -t');
        console.log(testResult.stdout || testResult.stderr);

        if (testResult.stderr && testResult.stderr.includes('test is successful')) {
            console.log('✅ Nginx test başarılı');
        } else if (testResult.stderr && !testResult.stderr.includes('test is successful')) {
            console.error('❌ Nginx konfigürasyon hatası!');
            console.error(testResult.stderr);
            ssh.dispose();
            return;
        }

        // 3. Upload proxy server files
        console.log('📤 Proxy server dosyaları yükleniyor...');
        await ssh.execCommand('mkdir -p /opt/flixify-proxy');

        const proxyServerPath = path.join(__dirname, '..', 'proxy-server', 'server.js');
        const proxyPackagePath = path.join(__dirname, '..', 'proxy-server', 'package.json');
        await ssh.putFile(proxyServerPath, '/opt/flixify-proxy/server.js');
        await ssh.putFile(proxyPackagePath, '/opt/flixify-proxy/package.json');
        console.log('✅ Proxy server dosyaları yüklendi');

        // 4. Install dependencies
        console.log('📦 Bağımlılıklar yükleniyor...');
        const installResult = await ssh.execCommand('cd /opt/flixify-proxy && npm install --production', { cwd: '/opt/flixify-proxy' });
        console.log(installResult.stdout || '(npm output empty)');
        if (installResult.stderr) console.log('npm stderr:', installResult.stderr);
        console.log('✅ Bağımlılıklar yüklendi');

        // 5. Stop any existing proxy process
        console.log('🛑 Eski proxy process durduruluyor...');
        await ssh.execCommand('pkill -f "node /opt/flixify-proxy/server.js" || true');
        await ssh.execCommand('sleep 1');

        // 6. Start proxy server with nohup
        console.log('🚀 Proxy server başlatılıyor...');
        await ssh.execCommand('cd /opt/flixify-proxy && nohup node server.js > /var/log/flixify-proxy.log 2>&1 &');
        await ssh.execCommand('sleep 2');

        // Check if it's running
        const checkResult = await ssh.execCommand('curl -s http://127.0.0.1:3001/ || echo "PROXY_NOT_RUNNING"');
        console.log('Proxy durumu:', checkResult.stdout);

        if (checkResult.stdout.includes('PROXY_NOT_RUNNING')) {
            console.error('❌ Proxy server başlatılamadı! Log kontrol ediliyor...');
            const logResult = await ssh.execCommand('tail -20 /var/log/flixify-proxy.log');
            console.log(logResult.stdout);
        } else {
            console.log('✅ Proxy server çalışıyor (port 3001)');
        }

        // 7. Reload nginx
        console.log('🔄 Nginx yeniden yükleniyor...');
        await ssh.execCommand('systemctl reload nginx');
        console.log('✅ Nginx yenilendi');

        console.log('\n🎉 PROXY KURULUMU TAMAMLANDI!');
        console.log('🌐 Site: http://45.63.40.225');
        console.log('🔧 Proxy: http://45.63.40.225/api/proxy?url=...');

        ssh.dispose();
    } catch (error) {
        console.error('❌ HATA:', error.message);
        process.exit(1);
    }
}

setupProxy();
