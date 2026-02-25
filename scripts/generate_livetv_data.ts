import fs from 'fs';
import readline from 'readline';

// Ülke tanıma kuralları
const COUNTRY_RULES = [
    { code: 'TR', name: 'Türkiye', flag: '🇹🇷', keywords: ['TR', 'TURK', 'TÜRK', 'TURKEY', 'TÜRKİYE'] },
    { code: 'DE', name: 'Almanya', flag: '🇩🇪', keywords: ['DE', 'GERMAN', 'ALMAN'] },
    { code: 'US', name: 'ABD', flag: '🇺🇸', keywords: ['US', 'USA', 'AMERICAN'] },
    { code: 'UK', name: 'İngiltere', flag: '🇬🇧', keywords: ['UK', 'ENG', 'BRITISH'] },
    { code: 'FR', name: 'Fransa', flag: '🇫🇷', keywords: ['FR', 'FRANCE', 'FRENCH'] },
    { code: 'IT', name: 'İtalya', flag: '🇮🇹', keywords: ['IT', 'ITALY', 'ITALIAN'] },
    { code: 'ES', name: 'İspanya', flag: '🇪🇸', keywords: ['ES', 'SPAIN', 'SPANISH'] },
    { code: 'RU', name: 'Rusya', flag: '🇷🇺', keywords: ['RU', 'RUSSIA', 'RUSSIAN'] },
    { code: 'NL', name: 'Hollanda', flag: '🇳🇱', keywords: ['NL', 'NETHERLAND', 'DUTCH'] },
    { code: 'AZ', name: 'Azerbaycan', flag: '🇦🇿', keywords: ['AZ', 'AZERBAIJAN', 'AZERI'] },
    { code: 'AR', name: 'Arjantin', flag: '🇦🇷', keywords: ['AR', 'ARGENTINA'] },
    { code: 'PL', name: 'Polonya', flag: '🇵🇱', keywords: ['PL', 'POLAND', 'POLISH'] },
    { code: 'CZ', name: 'Çekya', flag: '🇨🇿', keywords: ['CZ', 'CZECH'] },
    { code: 'AL', name: 'Arnavutluk', flag: '🇦🇱', keywords: ['AL', 'ALBANIA'] },
    { code: 'IR', name: 'İran', flag: '🇮🇷', keywords: ['IR', 'IRAN'] },
    { code: 'RS', name: 'Sırbistan', flag: '🇷🇸', keywords: ['RS', 'SERBIA'] }
];

function isLiveChannel(url: string, group: string, name: string): boolean {
    const lowerUrl = url.toLowerCase();
    const lowerGroup = group.toLowerCase();
    const lowerName = name.toLowerCase();

    if (lowerUrl.includes('/movie/') || lowerUrl.includes('/series/') || lowerUrl.includes('/vod/')) return false;
    if (lowerGroup.includes('film') || lowerGroup.includes('sinema') || lowerGroup.includes('movie') || lowerGroup.includes('vod')) return false;
    if (lowerGroup.includes('dizi') || lowerGroup.includes('series')) return false;
    if (lowerName.includes('(film)') || lowerName.includes('(movie)') || lowerName.includes('(dizi)') || lowerName.includes('(series)')) return false;

    return true;
}

async function run() {
    const fileStream = fs.createReadStream('public/playlist.m3u');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const countryCounts: Record<string, number> = {};
    const countryChannels: Record<string, any[]> = {};
    let turkishChannelCount = 0;

    let currentChannel: any = {};

    console.log("Live TV verileri taranıyor...");

    for await (const line of rl) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('#EXTINF:')) {
            const logoMatch = trimmed.match(/tvg-logo="([^"]+)"/);
            const groupMatch = trimmed.match(/group-title="([^"]+)"/);
            const commaIndex = trimmed.lastIndexOf(',');
            const rawName = commaIndex !== -1 ? trimmed.substring(commaIndex + 1).trim() : '';

            currentChannel = {
                name: rawName,
                logo: logoMatch ? logoMatch[1] : '',
                group: groupMatch ? groupMatch[1] : 'Diğer',
            };
        } else if (!trimmed.startsWith('#') && currentChannel.name) {
            currentChannel.url = trimmed;
            currentChannel.id = Math.random().toString(36).substring(2, 10);

            if (isLiveChannel(currentChannel.url, currentChannel.group, currentChannel.name)) {

                let detectedCode = 'OTHER';
                const nameUpper = currentChannel.name.toUpperCase();
                const groupUpper = currentChannel.group.toUpperCase();

                if (
                    nameUpper.startsWith('TR:') ||
                    groupUpper === 'TÜRKİYE' ||
                    groupUpper === 'TURKEY' ||
                    groupUpper.includes('TR ') ||
                    nameUpper.includes('TÜRK') ||
                    groupUpper.includes('TÜRK')
                ) {
                    detectedCode = 'TR';
                    turkishChannelCount++;
                } else {
                    for (const rule of COUNTRY_RULES) {
                        if (rule.code === 'TR') continue; // Zaten kontrol edildi
                        const match = rule.keywords.some(kw =>
                            nameUpper.startsWith(kw + ':') ||
                            groupUpper.includes(kw) ||
                            groupUpper === kw
                        );
                        if (match) {
                            detectedCode = rule.code;
                            break;
                        }
                    }
                }

                if (detectedCode !== 'OTHER') {
                    if (!countryCounts[detectedCode]) {
                        countryCounts[detectedCode] = 0;
                        countryChannels[detectedCode] = [];
                    }
                    countryCounts[detectedCode]++;

                    // Frontend gecikmesini önlemek için kanalları da build alıyoruz.
                    countryChannels[detectedCode].push({
                        ...currentChannel,
                        type: 'live',
                        isLive: true
                    });
                }
            }

            currentChannel = {};
        }
    }

    const finalCountries = COUNTRY_RULES.map(rule => ({
        code: rule.code,
        name: rule.name,
        flag: rule.flag,
        channelCount: countryCounts[rule.code] || 0
    })).filter(c => c.channelCount > 0);

    // En çok kanalı olanları başa alıyoruz, TR hariç (TR sabit en başa)
    const sortedCountries = [
        finalCountries.find(c => c.code === 'TR'),
        ...finalCountries.filter(c => c.code !== 'TR').sort((a, b) => b.channelCount - a.channelCount)
    ].filter(Boolean);

    const livestreamData = {
        turkishChannelCount: turkishChannelCount,
        countries: sortedCountries,
        // countryChannels: countryChannels // Kanalları tek dosyaya gömersen 5MB olabilir, istemciyi yorabilirsek ayırırız.
    };

    fs.writeFileSync('public/livetv_data.json', JSON.stringify(livestreamData, null, 2), 'utf-8');

    // Ayrıca canlı kanalları da JSON'a basalım, böylece tıklanıldığında saniyesinde açılır
    // Ancak 78MB olmaması için sadece Live olanları ayıklıyoruz.
    fs.writeFileSync('public/livetv_channels_cache.json', JSON.stringify(countryChannels, null, 2), 'utf-8');

    console.log(`Live TV JSON oluşturuldu. Toplam Bulunan TR: ${turkishChannelCount}`);
}

run();
