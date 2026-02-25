import fs from 'fs';
import readline from 'readline';

async function run() {
    const fileStream = fs.createReadStream('public/playlist.m3u');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const groups = new Set<string>();
    let totalLines = 0;

    for await (const line of rl) {
        const trimmed = line.trim();
        totalLines++;
        if (!trimmed) continue;

        if (trimmed.startsWith('#EXTINF:')) {
            const groupMatch = trimmed.match(/group-title="([^"]+)"/);
            if (groupMatch) {
                const group = groupMatch[1].toUpperCase();
                if (group.includes('TR') || group.includes('TÜRK') || group.includes('TURK') || group.includes('ULUSAL')) {
                    groups.add(groupMatch[1]);
                }
            }
        }
    }

    console.log("Bulunan TR/Türk/Ulusal içeren gruplar:");
    Array.from(groups).sort().forEach(g => console.log(g));
}

run();
