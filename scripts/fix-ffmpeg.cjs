const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const config = {
    host: '45.63.40.225',
    username: 'root',
    password: '3,sNP}W8zke7[*4X',
    port: 22,
};

async function updateFFmpeg() {
    try {
        await ssh.connect(config);
        console.log('Sunucuya baglanildi. server.js duzeltiliyor...');

        // server.js içindeki FFmpeg argümanlarını User-Agent ile güncelle
        await ssh.execCommand(`sed -i "s/'-hide_banner', '-loglevel', 'warning',/'-hide_banner', '-loglevel', 'warning', '-user_agent', 'Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/91.0.4472.124 Safari\\/537.36', '-headers', 'Referer: http:\\/\\/rxurl.xyz\\/\\r\\n',/g" /opt/iptv-restream/server.js`);

        console.log('Dosya guncellendi, servis yeniden baslatiliyor...');
        await ssh.execCommand('systemctl restart iptv-restream');

        const checkService = await ssh.execCommand('systemctl is-active iptv-restream');
        console.log('Restream service:', checkService.stdout.trim());

        // Yeni loglari kontrol et
        const logCheck = await ssh.execCommand('cat /var/log/iptv-restream.log | tail -n 10');
        console.log('Loglar:', logCheck.stdout);

        ssh.dispose();
    } catch (err) {
        console.error('Hata:', err);
        process.exit(1);
    }
}

updateFFmpeg();
