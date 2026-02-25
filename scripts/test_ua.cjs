const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const config = {
    host: '45.63.40.225',
    username: 'root',
    password: '3,sNP}W8zke7[*4X',
    port: 22,
};

async function testUAs() {
    try {
        await ssh.connect(config);
        const m3uUrl = "http://rxurl.xyz:8080/get.php?username=8ef82bd6&password=4dd71af6&type=m3u_plus&output=ts";

        const uas = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "VLC/3.0.18 LibVLC/3.0.18",
            "IPTVSmartersPlayer",
            "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Mobile Safari/537.36"
        ];

        for (const ua of uas) {
            console.log(`Testing UA: ${ua}`);
            const res = await ssh.execCommand(`curl -s -I -A "${ua}" "${m3uUrl}" --max-time 10 | grep "HTTP/"`);
            console.log(`Result: ${res.stdout.trim() || "No response"}`);
        }

        ssh.dispose();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testUAs();
