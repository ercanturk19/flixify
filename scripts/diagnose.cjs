const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const config = {
    host: '45.63.40.225',
    username: 'root',
    password: '3,sNP}W8zke7[*4X',
    port: 22,
};

async function diagnose() {
    try {
        await ssh.connect(config);
        console.log('Connected!\n');

        // 1. Check proxy server running
        const r1 = await ssh.execCommand('curl -s http://127.0.0.1:3001/');
        console.log('[1] Proxy:', r1.stdout);

        // 2. Direct curl to IPTV M3U
        const r2 = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" "http://rxurl.xyz:8080/get.php?username=8ef82bd6&password=4dd71af6&type=m3u_plus&output=ts" --max-time 15');
        console.log('[2] Direct M3U status:', r2.stdout);

        // 3. Via proxy
        const r3 = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3001/proxy?url=http%3A%2F%2Frxurl.xyz%3A8080%2Fget.php%3Fusername%3D8ef82bd6%26password%3D4dd71af6%26type%3Dm3u_plus%26output%3Dts" --max-time 15');
        console.log('[3] Proxy M3U status:', r3.stdout);

        // 4. Via nginx
        const r4 = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1/api/proxy?url=http%3A%2F%2Frxurl.xyz%3A8080%2Fget.php%3Fusername%3D8ef82bd6%26password%3D4dd71af6%26type%3Dm3u_plus%26output%3Dts" --max-time 15');
        console.log('[4] Nginx proxy status:', r4.stdout);

        // 5. First 3 lines of M3U
        const r5 = await ssh.execCommand('curl -s "http://rxurl.xyz:8080/get.php?username=8ef82bd6&password=4dd71af6&type=m3u_plus&output=ts" --max-time 15 | head -3');
        console.log('[5] M3U content:', r5.stdout);

        // 6. Proxy logs
        const r6 = await ssh.execCommand('tail -10 /var/log/flixify-proxy.log 2>/dev/null');
        console.log('[6] Proxy logs:\n', r6.stdout);

        // 7. Check if proxy process exists
        const r7 = await ssh.execCommand('ps aux | grep "node.*server.js" | grep -v grep');
        console.log('[7] Proxy process:', r7.stdout);

        ssh.dispose();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

diagnose();
