import fs from 'fs';
import readline from 'readline';

function isMovie(url: string, group: string): boolean {
    const lowerUrl = url.toLowerCase();
    const lowerGroup = group.toLowerCase();

    // Dizi/Series kanallarını ele
    if (lowerUrl.includes('/series/')) return false;
    if (lowerGroup.includes('dizi') || lowerGroup.includes('series')) return false;

    // Film (VOD) özellikleri taşıyor mu?
    if (lowerUrl.includes('/movie/')) return true;
    if (lowerGroup.includes('film') || lowerGroup.includes('sinema') || lowerGroup.includes('movie') || lowerGroup.includes('vod')) return true;

    return false;
}

async function run() {
    const fileStream = fs.createReadStream('public/playlist.m3u');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let totalLines = 0;
    let totalVod = 0;
    let totalTrDub = 0;

    let currentGroup = '';
    let currentName = '';

    const trDubGroups = new Set<string>();

    for await (const line of rl) {
        const trimmed = line.trim();
        totalLines++;
        if (!trimmed) continue;

        if (trimmed.startsWith('#EXTINF:')) {
            const groupMatch = trimmed.match(/group-title="([^"]+)"/);
            const commaIndex = trimmed.lastIndexOf(',');
            const rawName = commaIndex !== -1 ? trimmed.substring(commaIndex + 1).trim() : '';

            currentGroup = groupMatch ? groupMatch[1].toUpperCase() : 'DİĞER';
            currentName = rawName.toUpperCase();
        } else if (!trimmed.startsWith('#') && currentName) {
            if (isMovie(trimmed, currentGroup)) {
                totalVod++;

                // Türkçe Dublaj kontrolü (İsim veya Grupta)
                if (
                    currentName.includes('TR DUB') ||
                    currentName.includes('TÜRKÇE DUB') ||
                    currentName.includes('TURKCE DUB') ||
                    currentName.includes('DUBLAJ') ||
                    currentGroup.includes('DUB') ||
                    currentGroup.includes('TR FILM') ||
                    currentGroup.includes('TR FİLM') ||
                    currentGroup.includes('TÜRKÇE FİLM')
                ) {
                    totalTrDub++;
                    trDubGroups.add(currentGroup);
                }
            }
            currentName = '';
            currentGroup = '';
        }
    }

    console.log(`M3U Analiz Sonucu:`);
    console.log(`Toplam VOD (Film) Sayısı: ${totalVod}`);
    console.log(`Bulunan TR Dublaj/Türkçe Film Sayısı: ${totalTrDub}`);
    console.log(`İçinde TR Dublaj bulduğumuz klasör/grup isimleri (Örneklem):`);
    const grparr = Array.from(trDubGroups);
    grparr.slice(0, 30).forEach(g => console.log(` - ${g}`));
    if (grparr.length > 30) console.log(`   ...ve ${grparr.length - 30} grup daha.`);
}

run();
