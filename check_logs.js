import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

const config = {
    host: '45.32.157.236',
    username: 'root',
    password: 'Ae9#FJk,KxeMw4Hz'
};

async function checkLogs() {
    try {
        await ssh.connect(config);
        
        // Flixify container loglarını al
        console.log('=== FLIXIFY CONTAINER LOGS ===\n');
        const logs = await ssh.execCommand('docker logs v4sk4w8k8og4s4s084gockgo-193508349394 2>&1 | tail -50');
        console.log(logs.stdout || logs.stderr);
        
        // Coolify proxy/network durumunu kontrol et
        console.log('\n=== COOLIFY NETWORK ===\n');
        const network = await ssh.execCommand('docker network ls');
        console.log(network.stdout);
        
        // Traefik var mı kontrol et
        console.log('\n=== ALL CONTAINERS ===\n');
        const all = await ssh.execCommand('docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"');
        console.log(all.stdout);
        
    } catch (err) {
        console.error('Hata:', err.message);
    } finally {
        ssh.dispose();
    }
}

checkLogs();
