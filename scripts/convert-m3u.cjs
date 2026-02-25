// M3U dosyasını kompakt JSON'a çeviren script
const fs = require('fs');
const path = require('path');

const m3uPath = path.join(__dirname, '..', 'public', 'playlist_rick@abi_plus.m3u');
const jsonPath = path.join(__dirname, '..', 'public', 'channels.json');

console.log('📄 M3U dosyası okunuyor...');
const content = fs.readFileSync(m3uPath, 'utf-8');
const lines = content.split('\n');

const channels = [];
let currentChannel = {};
let id = 0;

lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    if (line.startsWith('#EXTINF:')) {
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const groupMatch = line.match(/group-title="([^"]+)"/);
        const commaIndex = line.lastIndexOf(',');
        const name = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : '';

        currentChannel = {
            i: String(id++),
            n: name || 'Bilinmeyen',
            l: logoMatch ? logoMatch[1] : '',
            g: groupMatch ? groupMatch[1] : 'Diğer',
        };
    } else if (!line.startsWith('#')) {
        if (currentChannel.n) {
            currentChannel.u = line;
            channels.push(currentChannel);
            currentChannel = {};
        }
    }
});

console.log(`✅ ${channels.length} kanal parse edildi`);

const json = JSON.stringify(channels);
fs.writeFileSync(jsonPath, json);

const sizeMB = (Buffer.byteLength(json) / (1024 * 1024)).toFixed(2);
console.log(`💾 channels.json oluşturuldu: ${sizeMB} MB`);
