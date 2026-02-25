import fs from 'fs';
import readline from 'readline';

function isLiveChannel(channel: any): boolean {
    const group = (channel.group || '').toLowerCase();
    const name = (channel.name || '').toLowerCase();
    const url = (channel.url || '').toLowerCase();

    if (url.includes('/movie/') || url.includes('/series/') || url.includes('/vod/')) return false;

    if (group.includes('film') || group.includes('movie') ||
        group.includes('sinema') || group.includes('cinema') ||
        name.includes('(film)') || name.includes('(movie)')) {
        return false;
    }

    if (group.includes('dizi') || group.includes('series') ||
        group.includes('show') || name.includes('(dizi)') ||
        name.includes('(series)')) {
        return false;
    }

    return true;
}

function isTurkishChannel(channel: any): boolean {
    const rawName = (channel.rawName || channel.name || '').toUpperCase();
    const name = (channel.name || '').toUpperCase();
    const group = (channel.group || '').toUpperCase();
    const countryCodeCh = (channel.countryCode || '').toUpperCase();

    if (
        name.includes('SINEMA') || name.includes('SİNEMA') ||
        name.includes('FILM') || name.includes('FİLM') ||
        name.includes('DIZI') || name.includes('DİZİ') ||
        name.includes('MOVIE') || name.includes('VOD')
    ) {
        return false;
    }

    if (
        group.includes('SINEMA') || group.includes('SİNEMA') ||
        group.includes('FILM') || group.includes('FİLM') ||
        group.includes('DIZI') || group.includes('DİZİ') ||
        group.includes('MOVIE') || group.includes('VOD')
    ) {
        return false;
    }

    if (countryCodeCh === 'TR') return true;
    if (rawName.startsWith('TR:')) return true;

    // "TÜRK", "TURK", "TÜRKİYE" içeren her şey veya "TR" grup içerenler
    if (
        group.includes('TÜRK') || group.includes('TURK') || group.includes('TURKEY') ||
        group.includes('TR ') || group.includes('TR-') || group.includes('TR.') || group.startsWith('TR') ||
        name.includes('TÜRK') || name.includes('TURK') || rawName.includes('TÜRK')
    ) {
        // Hala yabancı "TR" olmayan garip şeyler sızabiliyor diye ufak bir yabancı kontrolü koyalım
        const yabanciKodlar = ['RO:', 'RU:', 'IR:', 'IQ:', 'SY:', 'LB:', 'JO:', 'SA:', 'AE:', 'QA:', 'KW:', 'BH:', 'OM:', 'YE:', 'EG:', 'LY:', 'TN:', 'DZ:', 'MA:', 'US:', 'UK:', 'DE:', 'FR:', 'IT:', 'ES:', 'NL:', 'BE:', 'CH:', 'AT:', 'SE:', 'NO:', 'DK:', 'FI:', 'PL:', 'CZ:', 'HU:', 'BG:', 'HR:', 'RS:', 'BA:', 'AL:', 'GR:', 'UA:', 'BY:', 'MD:', 'EE:', 'LV:', 'LT:', 'GE:', 'AM:', 'AZ:', 'KZ:', 'UZ:', 'KG:', 'TJ:', 'TM:', 'CN:', 'JP:', 'KR:', 'IN:', 'PK:', 'TH:', 'VN:', 'ID:', 'MY:', 'PH:', 'SG:', 'AF:', 'AU:', 'CA:', 'BR:', 'AR:', 'MX:', 'ZA:', 'NG:', 'WS:'];
        let isForeign = false;
        for (const kod of yabanciKodlar) {
            if (rawName.startsWith(kod)) {
                isForeign = true;
                break;
            }
        }
        if (!isForeign) return true;
    }

    // Bein vs.
    if (name.includes('BEIN') || rawName.includes('BEIN')) {
        const yabanciKodlar = [
            'RO:', 'RU:', 'IR:', 'IQ:', 'SY:', 'LB:', 'JO:', 'SA:', 'AE:', 'QA:',
            'KW:', 'BH:', 'OM:', 'YE:', 'EG:', 'LY:', 'TN:', 'DZ:', 'MA:', 'US:',
            'UK:', 'DE:', 'FR:', 'IT:', 'ES:', 'NL:', 'BE:', 'CH:', 'AT:', 'SE:',
            'NO:', 'DK:', 'FI:', 'PL:', 'CZ:', 'HU:', 'BG:', 'HR:', 'RS:', 'BA:',
            'AL:', 'GR:', 'UA:', 'BY:', 'MD:', 'EE:', 'LV:', 'LT:', 'GE:', 'AM:',
            'AZ:', 'KZ:', 'UZ:', 'KG:', 'TJ:', 'TM:', 'CN:', 'JP:', 'KR:', 'IN:',
            'PK:', 'TH:', 'VN:', 'ID:', 'MY:', 'PH:', 'SG:', 'AF:', 'AU:', 'CA:',
            'BR:', 'AR:', 'MX:', 'ZA:', 'NG:', 'WS:'
        ];
        for (const kod of yabanciKodlar) {
            if (rawName.startsWith(kod)) return false;
        }
        return true;
    }

    return false;
}

function cleanChannelName(name: string): string {
    if (name.startsWith('TR:')) {
        return name.substring(3).trim();
    }
    return name.trim();
}

function getChannelOrder(name: string): number {
    const upper = cleanChannelName(name).toUpperCase();

    // Ulusal - Ana Akım Kanallar
    if (upper === 'TRT 1' || upper === 'TRT 1 HD' || upper === 'TRT1') return 1;
    if (upper === 'ATV' || upper === 'ATV HD') return 2;
    if (upper === 'KANAL D' || upper === 'KANAL D HD' || upper === 'KANALD') return 3;
    if (upper === 'SHOW TV' || upper === 'SHOW TV HD' || upper === 'SHOW') return 4;
    if (upper === 'STAR TV' || upper === 'STAR TV HD' || upper === 'STAR') return 5;
    if (upper === 'TV 8' || upper === 'TV 8 HD' || upper === 'TV8') return 6;
    if (upper === 'NOW' || upper === 'NOW TV' || upper === 'NOW HD') return 7;
    if (upper === 'KANAL 7' || upper === 'KANAL 7 HD' || upper === 'KANAL7') return 8;
    if (upper === 'TRT 2' || upper === 'TRT 2 HD' || upper === 'TRT2') return 9;
    if (upper === 'TRT Haber' || upper === 'TRT HABER') return 10;

    // Geri kalan Ulusal/Tematik popülerler
    if (upper.includes('BEYAZ')) return 11;
    if (upper.includes('TEVE2')) return 12;
    if (upper.includes('A2')) return 13;
    if (upper.includes('TLC')) return 14;
    if (upper.includes('DMAX')) return 15;
    if (upper.includes('TV8.5') || upper.includes('TV 8.5')) return 16;
    if (upper.includes('360')) return 17;
    if (upper.includes('A HABER')) return 18;
    if (upper.includes('CNN TÜRK') || upper.includes('CNNTÜRK')) return 19;
    if (upper.includes('HABERTÜRK') || upper.includes('HABER TÜRK')) return 20;
    if (upper.includes('NTV')) return 21;
    if (upper.includes('TGRT')) return 22;
    if (upper.includes('HALK TV')) return 23;
    if (upper.includes('SÖZCÜ') || upper.includes('SOZCU')) return 24;
    if (upper.includes('TELE 1') || upper.includes('TELE1')) return 25;
    if (upper.includes('KRT')) return 26;

    // Bebekler & Çocuk
    if (upper.includes('TRT ÇOCUK') || upper.includes('TRT COCUK')) return 30;
    if (upper.includes('MINIKA')) return 31;
    if (upper.includes('CARTOON NETWORK')) return 32;

    // Belgesel
    if (upper.includes('TRT BELGESEL')) return 40;
    if (upper.includes('DISCOVERY')) return 41;
    if (upper.includes('NAT GEO') || upper.includes('NATIONAL GEOGRAPHIC')) return 42;

    // Spor
    if (upper.includes('TRT SPOR')) return 50;
    if (upper.includes('A SPOR')) return 51;
    if (upper.includes('BEIN SPORTS HABER')) return 52;

    // Premium Spor (BEIN, S Sport vb.)
    if (upper.includes('BEIN SPORTS 1')) return 60;
    if (upper.includes('BEIN SPORTS 2')) return 61;
    if (upper.includes('BEIN SPORTS 3')) return 62;
    if (upper.includes('BEIN SPORTS 4')) return 63;
    if (upper.includes('BEIN SPORTS 5')) return 64;
    if (upper.includes('BEIN SPORTS MAX 1')) return 65;
    if (upper.includes('BEIN SPORTS MAX 2')) return 66;
    if (upper.includes('S SPORT 1') || upper === 'S SPORT') return 67;
    if (upper.includes('S SPORT 2')) return 68;
    if (upper.includes('TİVİBU SPOR 1') || upper === 'TİVİBU SPOR') return 69;
    if (upper.includes('TİVİBU SPOR 2')) return 70;

    // Dini
    if (upper.includes('DİYANET') || upper.includes('DIYANET')) return 80;
    if (upper.includes('TRT KURDİ') || upper.includes('TRT KURDI')) return 81;

    // TRT Uzantıları
    if (upper.includes('TRT')) return 90;

    // Diğer Genel
    return 999;
}

async function run() {
    const fileStream = fs.createReadStream('public/playlist.m3u');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const channels: any[] = [];
    let currentChannel: any = {};
    let totalLines = 0;
    let skippedVod = 0;

    console.log("Tarama başlatıldı. Lütfen bekleyin...");

    for await (const line of rl) {
        const trimmed = line.trim();
        totalLines++;
        if (!trimmed) continue;

        if (trimmed.startsWith('#EXTINF:')) {
            const logoMatch = trimmed.match(/tvg-logo="([^"]+)"/);
            const groupMatch = trimmed.match(/group-title="([^"]+)"/);
            const commaIndex = trimmed.lastIndexOf(',');
            const rawName = commaIndex !== -1 ? trimmed.substring(commaIndex + 1).trim() : '';

            const countryMatch = rawName.match(/^([A-Z]{2}):\s*/);
            const countryCode = countryMatch ? countryMatch[1] : null;
            const cleanName = countryMatch ? rawName.substring(countryMatch[0].length).trim() : rawName;

            currentChannel = {
                name: cleanName,
                rawName: rawName,
                logo: logoMatch ? logoMatch[1] : '',
                group: groupMatch ? groupMatch[1] : 'Diğer',
                countryCode: countryCode || undefined,
                extinfLine: trimmed // Orjinal satırı korumak için
            };
        } else if (!trimmed.startsWith('#') && currentChannel.name) {
            currentChannel.url = trimmed;

            if (!isLiveChannel(currentChannel)) {
                skippedVod++;
            } else if (isTurkishChannel(currentChannel)) {
                channels.push(currentChannel);
            }
            currentChannel = {};
        }
    }

    console.log(`Tarama bitti.`);
    console.log(`Okunan toplam satır: ${totalLines}`);
    console.log(`Atlanan VOD / Dizi / Sinema: ${skippedVod}`);
    console.log(`Bulunan TR Canlı Kanal: ${channels.length}`);

    // Sırala
    channels.sort((a, b) => getChannelOrder(a.name) - getChannelOrder(b.name));

    let outputM3u = '#EXTM3U\n';
    channels.forEach(ch => {
        outputM3u += `${ch.extinfLine}\n${ch.url}\n`;
    });

    fs.writeFileSync('public/playlist_tr.m3u', outputM3u, 'utf-8');
    console.log("Tüm Türkçe kanallar popülerlik sırasına göre 'public/playlist_tr.m3u' dosyasına başarıyla kaydedildi.");
}

run();
