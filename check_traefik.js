import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

const config = {
    host: '45.32.157.236',
    username: 'root',
    password: 'Ae9#FJk,KxeMw4Hz'
};

async function checkTraefik() {
    try {
        await ssh.connect(config);
        
        console.log('=== COOLIFY PROXY LABELS ===\n');
        const labels = await ssh.execCommand('docker inspect coolify-proxy --format="{{json .Config.Labels}}" | jq .');
        console.log(labels.stdout || labels.stderr);
        
        console.log('\n=== FLIXIFY CONTAINER LABELS ===\n');
        const flixifyLabels = await ssh.execCommand('docker inspect $(docker ps -aq --filter "name=v4sk4w8k8og4s4s084gockgo") --format="{{json .Config.Labels}}" | jq .');
        console.log(flixifyLabels.stdout || 'Bulunamadı');
        
        console.log('\n=== TRAEFIK ROUTERS ===\n');
        const routers = await ssh.execCommand('docker exec coolify-proxy wget -qO- http://localhost:8080/api/http/routers 2>/dev/null || echo "Traefik API erisilemiyor"');
        console.log(routers.stdout);
        
        console.log('\n=== COOLIFY NETWORK CONNECT ===\n');
        const network = await ssh.execCommand('docker network inspect coolify --format="{{json .Containers}}" | jq .');
        console.log(network.stdout || 'Network yok');
        
    } catch (err) {
        console.error('Hata:', err.message);
    } finally {
        ssh.dispose();
    }
}

checkTraefik();
