const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const config = {
    host: '45.63.40.225',
    username: 'root',
    password: '3,sNP}W8zke7[*4X',
    port: 22,
};

async function checkLogs() {
    try {
        await ssh.connect(config);
        const result = await ssh.execCommand('tail -n 100 /var/log/iptv-restream.log');
        console.log(result.stdout || result.stderr);
        ssh.dispose();
    } catch (err) {
        console.error('Hata:', err);
        process.exit(1);
    }
}

checkLogs();
