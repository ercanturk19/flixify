const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const config = {
    host: '45.63.40.225',
    username: 'root',
    password: '3,sNP}W8zke7[*4X',
    port: 22,
};

async function testProxy() {
    try {
        await ssh.connect(config);

        // 1. Start isteği atalım
        const startCmd = await ssh.execCommand('curl -s -X POST http://127.0.0.1:3000/api/restream/start -H "Content-Type: application/json" -d \'{"url":"http://188.3.15.71:8888/http://rxurl.xyz:80/1vKx59u13V/d7y0Xq8b7B/35790"}\'');
        console.log('Start Res:', startCmd.stdout);

        // 2. M3U8 proxy'yi çağır
        const proxyCmd = await ssh.execCommand('curl -s -I http://127.0.0.1:3000/live/proxy.m3u8');
        console.log('Proxy Headers:', proxyCmd.stdout);

        const proxyBodyCmd = await ssh.execCommand('curl -s http://127.0.0.1:3000/live/proxy.m3u8 | head -n 10');
        console.log('Proxy Body:\\n', proxyBodyCmd.stdout);

        ssh.dispose();
    } catch (err) {
        console.error('Hata:', err);
        process.exit(1);
    }
}

testProxy();
