import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

const config = {
    host: '45.32.157.236',
    username: 'root',
    password: 'Ae9#FJk,KxeMw4Hz'
};

async function checkStatus() {
    try {
        await ssh.connect(config);
        
        console.log('=== DOCKER CONTAINERS ===\n');
        const ps = await ssh.execCommand('docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"');
        console.log(ps.stdout);
        
        console.log('\n=== FLIXIFY CONTAINER LOGS (son 30 satır) ===\n');
        const logs = await ssh.execCommand('docker logs $(docker ps -aq --filter "name=v4sk4w8k8og4s4s084gockgo") 2>&1 | tail -30');
        console.log(logs.stdout || logs.stderr || 'Log yok');
        
        console.log('\n=== NGINX CONFIG ICERIGI ===\n');
        const nginx = await ssh.execCommand('docker exec $(docker ps -aq --filter "name=v4sk4w8k8og4s4s084gockgo") cat /etc/nginx/conf.d/default.conf 2>/dev/null || echo "Container erisilemiyor"');
        console.log(nginx.stdout);
        
        console.log('\n=== HTML DOSYALARI ===\n');
        const html = await ssh.execCommand('docker exec $(docker ps -aq --filter "name=v4sk4w8k8og4s4s084gockgo") ls -la /usr/share/nginx/html/ 2>/dev/null || echo "Container erisilemiyor"');
        console.log(html.stdout);
        
    } catch (err) {
        console.error('Hata:', err.message);
    } finally {
        ssh.dispose();
    }
}

checkStatus();
