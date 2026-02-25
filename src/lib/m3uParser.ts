export interface M3UChannel {
    id: string;
    name: string;
    rawName?: string; // Orijinal isim (TR:, RO: prefixleri dahil)
    logo: string;
    group: string;
    url: string;
    countryCode?: string; // TR, RU, US, vb.
    countryName?: string; // Türkiye, Rusya, ABD, vb.
}

export interface M3UPlaylist {
    name: string;
    url: string;
    channels: M3UChannel[];
}

export interface Country {
    code: string;
    name: string;
    flag: string;
    channelCount: number;
}

// Ülke kodları ve isimleri
const countryMap: Record<string, { name: string; flag: string }> = {
    'TR': { name: 'Türkiye', flag: '🇹🇷' },
    'RU': { name: 'Rusya', flag: '🇷🇺' },
    'US': { name: 'ABD', flag: '🇺🇸' },
    'UK': { name: 'İngiltere', flag: '🇬🇧' },
    'DE': { name: 'Almanya', flag: '🇩🇪' },
    'FR': { name: 'Fransa', flag: '🇫🇷' },
    'IT': { name: 'İtalya', flag: '🇮🇹' },
    'ES': { name: 'İspanya', flag: '🇪🇸' },
    'PT': { name: 'Portekiz', flag: '🇵🇹' },
    'NL': { name: 'Hollanda', flag: '🇳🇱' },
    'BE': { name: 'Belçika', flag: '🇧🇪' },
    'CH': { name: 'İsviçre', flag: '🇨🇭' },
    'AT': { name: 'Avusturya', flag: '🇦🇹' },
    'SE': { name: 'İsveç', flag: '🇸🇪' },
    'NO': { name: 'Norveç', flag: '🇳🇴' },
    'DK': { name: 'Danimarka', flag: '🇩🇰' },
    'FI': { name: 'Finlandiya', flag: '🇫🇮' },
    'PL': { name: 'Polonya', flag: '🇵🇱' },
    'CZ': { name: 'Çekya', flag: '🇨🇿' },
    'SK': { name: 'Slovakya', flag: '🇸🇰' },
    'HU': { name: 'Macaristan', flag: '🇭🇺' },
    'RO': { name: 'Romanya', flag: '🇷🇴' },
    'BG': { name: 'Bulgaristan', flag: '🇧🇬' },
    'HR': { name: 'Hırvatistan', flag: '🇭🇷' },
    'SI': { name: 'Slovenya', flag: '🇸🇮' },
    'RS': { name: 'Sırbistan', flag: '🇷🇸' },
    'BA': { name: 'Bosna Hersek', flag: '🇧🇦' },
    'ME': { name: 'Karadağ', flag: '🇲🇪' },
    'MK': { name: 'Kuzey Makedonya', flag: '🇲🇰' },
    'AL': { name: 'Arnavutluk', flag: '🇦🇱' },
    'GR': { name: 'Yunanistan', flag: '🇬🇷' },
    'CY': { name: 'Kıbrıs', flag: '🇨🇾' },
    'MT': { name: 'Malta', flag: '🇲🇹' },
    'IE': { name: 'İrlanda', flag: '🇮🇪' },
    'IS': { name: 'İzlanda', flag: '🇮🇸' },
    'UA': { name: 'Ukrayna', flag: '🇺🇦' },
    'BY': { name: 'Belarus', flag: '🇧🇾' },
    'MD': { name: 'Moldova', flag: '🇲🇩' },
    'EE': { name: 'Estonya', flag: '🇪🇪' },
    'LV': { name: 'Letonya', flag: '🇱🇻' },
    'LT': { name: 'Litvanya', flag: '🇱🇹' },
    'GE': { name: 'Gürcistan', flag: '🇬🇪' },
    'AM': { name: 'Ermenistan', flag: '🇦🇲' },
    'AZ': { name: 'Azerbaycan', flag: '🇦🇿' },
    'KZ': { name: 'Kazakistan', flag: '🇰🇿' },
    'UZ': { name: 'Özbekistan', flag: '🇺🇿' },
    'KG': { name: 'Kırgızistan', flag: '🇰🇬' },
    'TJ': { name: 'Tacikistan', flag: '🇹🇯' },
    'TM': { name: 'Türkmenistan', flag: '🇹🇲' },
    'CN': { name: 'Çin', flag: '🇨🇳' },
    'JP': { name: 'Japonya', flag: '🇯🇵' },
    'KR': { name: 'Güney Kore', flag: '🇰🇷' },
    'IN': { name: 'Hindistan', flag: '🇮🇳' },
    'PK': { name: 'Pakistan', flag: '🇵🇰' },
    'BD': { name: 'Bangladeş', flag: '🇧🇩' },
    'IR': { name: 'İran', flag: '🇮🇷' },
    'IQ': { name: 'Irak', flag: '🇮🇶' },
    'SY': { name: 'Suriye', flag: '🇸🇾' },
    'LB': { name: 'Lübnan', flag: '🇱🇧' },
    'JO': { name: 'Ürdün', flag: '🇯🇴' },
    'IL': { name: 'İsrail', flag: '🇮🇱' },
    'PS': { name: 'Filistin', flag: '🇵🇸' },
    'SA': { name: 'Suudi Arabistan', flag: '🇸🇦' },
    'AE': { name: 'Birleşik Arap Emirlikleri', flag: '🇦🇪' },
    'QA': { name: 'Katar', flag: '🇶🇦' },
    'KW': { name: 'Kuveyt', flag: '🇰🇼' },
    'BH': { name: 'Bahreyn', flag: '🇧🇭' },
    'OM': { name: 'Umman', flag: '🇴🇲' },
    'YE': { name: 'Yemen', flag: '🇾🇪' },
    'EG': { name: 'Mısır', flag: '🇪🇬' },
    'LY': { name: 'Libya', flag: '🇱🇾' },
    'TN': { name: 'Tunus', flag: '🇹🇳' },
    'DZ': { name: 'Cezayir', flag: '🇩🇿' },
    'MA': { name: 'Fas', flag: '🇲🇦' },
    'SD': { name: 'Sudan', flag: '🇸🇩' },
    'ET': { name: 'Etiyopya', flag: '🇪🇹' },
    'KE': { name: 'Kenya', flag: '🇰🇪' },
    'TZ': { name: 'Tanzanya', flag: '🇹🇿' },
    'UG': { name: 'Uganda', flag: '🇺🇬' },
    'RW': { name: 'Ruanda', flag: '🇷🇼' },
    'ZA': { name: 'Güney Afrika', flag: '🇿🇦' },
    'NG': { name: 'Nijerya', flag: '🇳🇬' },
    'GH': { name: 'Gana', flag: '🇬🇭' },
    'SN': { name: 'Senegal', flag: '🇸🇳' },
    'ML': { name: 'Mali', flag: '🇲🇱' },
    'BF': { name: 'Burkina Faso', flag: '🇧🇫' },
    'NE': { name: 'Nijer', flag: '🇳🇪' },
    'TD': { name: 'Çad', flag: '🇹🇩' },
    'CM': { name: 'Kamerun', flag: '🇨🇲' },
    'AU': { name: 'Avustralya', flag: '🇦🇺' },
    'NZ': { name: 'Yeni Zelanda', flag: '🇳🇿' },
    'CA': { name: 'Kanada', flag: '🇨🇦' },
    'MX': { name: 'Meksika', flag: '🇲🇽' },
    'BR': { name: 'Brezilya', flag: '🇧🇷' },
    'AR': { name: 'Arjantin', flag: '🇦🇷' },
    'CL': { name: 'Şili', flag: '🇨🇱' },
    'CO': { name: 'Kolombiya', flag: '🇨🇴' },
    'PE': { name: 'Peru', flag: '🇵🇪' },
    'VE': { name: 'Venezuela', flag: '🇻🇪' },
    'EC': { name: 'Ekvador', flag: '🇪🇨' },
    'BO': { name: 'Bolivya', flag: '🇧🇴' },
    'PY': { name: 'Paraguay', flag: '🇵🇾' },
    'UY': { name: 'Uruguay', flag: '🇺🇾' },
    'TH': { name: 'Tayland', flag: '🇹🇭' },
    'VN': { name: 'Vietnam', flag: '🇻🇳' },
    'ID': { name: 'Endonezya', flag: '🇮🇩' },
    'MY': { name: 'Malezya', flag: '🇲🇾' },
    'PH': { name: 'Filipinler', flag: '🇵🇭' },
    'SG': { name: 'Singapur', flag: '🇸🇬' },
    'AF': { name: 'Afganistan', flag: '🇦🇫' },
    'LK': { name: 'Sri Lanka', flag: '🇱🇰' },
    'NP': { name: 'Nepal', flag: '🇳🇵' },
    'MM': { name: 'Myanmar', flag: '🇲🇲' },
    'KH': { name: 'Kamboçya', flag: '🇰🇭' },
    'LA': { name: 'Laos', flag: '🇱🇦' },
    'MN': { name: 'Moğolistan', flag: '🇲🇳' },
    'KP': { name: 'Kuzey Kore', flag: '🇰🇵' },
    'TW': { name: 'Tayvan', flag: '🇹🇼' },
    'HK': { name: 'Hong Kong', flag: '🇭🇰' },
    'MO': { name: 'Makao', flag: '🇲🇴' },
    'BN': { name: 'Brunei', flag: '🇧🇳' },
};

// Güvenli ID oluşturucu
const generateId = () => Math.random().toString(36).substring(2, 10);

// Kanal adından ülke kodunu çıkar
function extractCountryCode(name: string): { code: string | null; cleanName: string } {
    // TR: Kanal Adı, RU: Channel Name, US: Channel Name formatları
    const match = name.match(/^([A-Z]{2}):\s*/);
    if (match) {
        const code = match[1];
        const cleanName = name.substring(match[0].length).trim();
        return { code, cleanName };
    }
    return { code: null, cleanName: name };
}

export function parseM3U(content: string): M3UChannel[] {
    const lines = content.split('\n');
    const channels: M3UChannel[] = [];

    let currentChannel: Partial<M3UChannel> = {};

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        if (line.startsWith('#EXTINF:')) {
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            const groupMatch = line.match(/group-title="([^"]+)"/);

            const commaIndex = line.lastIndexOf(',');
            let nameMatch = '';
            if (commaIndex !== -1) {
                nameMatch = line.substring(commaIndex + 1);
            } else {
                nameMatch = line.split(',')[1] || '';
            }

            const rawName = nameMatch ? nameMatch.trim() : 'Bilinmeyen Kanal';
            const { code, cleanName } = extractCountryCode(rawName);

            currentChannel = {
                id: generateId(),
                name: cleanName,
                logo: logoMatch ? logoMatch[1] : '',
                group: groupMatch ? groupMatch[1] : 'Diğer',
                countryCode: code || undefined,
            };
        } else if (!line.startsWith('#')) {
            if (currentChannel.name) {
                const code = currentChannel.countryCode;
                channels.push({
                    id: currentChannel.id || generateId(),
                    name: currentChannel.name,
                    logo: currentChannel.logo || '',
                    group: currentChannel.group || 'Diğer',
                    url: line,
                    countryCode: code,
                    countryName: code ? countryMap[code]?.name : undefined,
                });
                currentChannel = {};
            }
        }
    });

    return channels;
}

// Ülke listesini kanallardan çıkar
export function extractCountries(channels: M3UChannel[]): Country[] {
    const countryCounts = new Map<string, number>();
    
    channels.forEach(channel => {
        if (channel.countryCode) {
            const count = countryCounts.get(channel.countryCode) || 0;
            countryCounts.set(channel.countryCode, count + 1);
        }
    });

    const countries: Country[] = [];
    countryCounts.forEach((count, code) => {
        const countryInfo = countryMap[code];
        if (countryInfo) {
            countries.push({
                code,
                name: countryInfo.name,
                flag: countryInfo.flag,
                channelCount: count,
            });
        }
    });

    // Kanal sayısına göre sırala (en çoktan en aza)
    return countries.sort((a, b) => b.channelCount - a.channelCount);
}

// Belirli bir ülkenin kanallarını filtrele
export function getChannelsByCountry(channels: M3UChannel[], countryCode: string): M3UChannel[] {
    return channels.filter(channel => channel.countryCode === countryCode);
}

export default parseM3U;
