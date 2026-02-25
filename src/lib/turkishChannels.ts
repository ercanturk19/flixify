// Türk kanalları için gelişmiş tespit ve sıralama

export interface TurkishChannel {
  id: string;
  name: string;
  displayName: string;
  logo: string;
  group: string;
  url: string;
  quality?: string;
  order: number;
  category: 'ulusal' | 'haber' | 'spor' | 'film' | 'cocuk' | 'belgesel' | 'dini' | 'muzik' | 'yerel' | 'diger';
}

// BİR KANALIN TÜRK KANALI OLUP OLMADIĞINI TESPİT ET
export function isTurkishChannel(channel: any): boolean {
  const rawName = (channel.rawName || channel.name || '').toUpperCase();
  const name = (channel.name || '').toUpperCase();
  const group = (channel.group || '').toUpperCase();
  const countryCodeCh = (channel.countryCode || '').toUpperCase();

  // Eğer kanal ismi VOD/Sinema/Dizi ise kesinlikle hariç tut
  if (
    name.includes('SINEMA') || name.includes('SİNEMA') ||
    name.includes('FILM') || name.includes('FİLM') ||
    name.includes('DIZI') || name.includes('DİZİ') ||
    name.includes('MOVIE') || name.includes('VOD')
  ) {
    return false;
  }

  // Eğer kanal grup ismi VOD/Sinema/Dizi ise kesinlikle hariç tut
  if (
    group.includes('SINEMA') || group.includes('SİNEMA') ||
    group.includes('FILM') || group.includes('FİLM') ||
    group.includes('DIZI') || group.includes('DİZİ') ||
    group.includes('MOVIE') || group.includes('VOD')
  ) {
    return false;
  }

  // 1. countryCode TR ise KESİN olarak kabul et
  if (countryCodeCh === 'TR') return true;

  // 2. TR: ile başlıyorsa KESİN olarak kabul et
  if (rawName.startsWith('TR:')) return true;

  // 3. "TÜRK", "TURK", "TÜRKİYE" içeren her şey veya "TR" grup içerenler
  if (
    group.includes('TÜRK') || group.includes('TURK') || group.includes('TURKEY') ||
    group.includes('TR ') || group.includes('TR-') || group.includes('TR.') || group.startsWith('TR') ||
    name.includes('TÜRK') || name.includes('TURK') || rawName.includes('TÜRK')
  ) {
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

  // 4. BEIN içeriyorsa ama YABANCI ülke kodu YOKSA kabul et
  if (name.includes('BEIN') || rawName.includes('BEIN')) {
    // Yabancı ülke kodları
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
      if (rawName.startsWith(kod)) {
        return false; // Yabancı kodlu BEIN'leri hariç tut
      }
    }
    return true; // Türk BEIN'leri kabul et
  }

  // DİĞER TÜM KANALLARI REDDET
  return false;
}

// Kanal ismine göre kategori belirle
export function detectChannelCategory(name: string): 'ulusal' | 'haber' | 'spor' | 'film' | 'cocuk' | 'belgesel' | 'dini' | 'muzik' | 'yerel' | 'diger' {
  const upper = name.toUpperCase();

  // Spor
  if (upper.includes('SPOR') || upper.includes('SPORT')) return 'spor';
  if (upper.includes('FB TV') || upper.includes('GS TV') || upper.includes('BJK TV')) return 'spor';
  if (upper.includes('BEIN')) return 'spor';

  // Haber
  if (upper.includes('HABER') || upper.includes('NEWS')) return 'haber';
  if (upper.includes('CNN')) return 'haber';

  // Film/Dizi
  if (upper.includes('MOVIE') || upper.includes('FİLM') || upper.includes('FILM')) return 'film';
  if (upper.includes('CINE') || upper.includes('DIZI')) return 'film';

  // Çocuk
  if (upper.includes('ÇOCUK') || upper.includes('COCUK') || upper.includes('KIDS')) return 'cocuk';
  if (upper.includes('NICK') || upper.includes('DISNEY') || upper.includes('MINIKA')) return 'cocuk';

  // Belgesel
  if (upper.includes('BELGESEL') || upper.includes('NAT GEO') || upper.includes('DISCOVERY')) return 'belgesel';

  // Müzik
  if (upper.includes('MÜZİK') || upper.includes('MUSIC') || upper.includes('KRAL')) return 'muzik';

  // Dini
  if (upper.includes('DİNİ') || upper.includes('DINI') || upper.includes('DIYANET')) return 'dini';

  // Yerel
  if (upper.includes('YEREL')) return 'yerel';

  // Ulusal
  if (upper.includes('TRT') || upper.includes('ATV') || upper.includes('SHOW') || upper.includes('STAR')) return 'ulusal';
  if (upper.includes('KANAL D') || upper.includes('NOW') || upper.includes('TV 8') || upper.includes('KANAL 7')) return 'ulusal';

  return 'diger';
}

// Kanal ismini temizle
export function cleanChannelName(name: string): string {
  if (name.startsWith('TR:')) {
    return name.substring(3).trim();
  }
  return name.trim();
}

// Türk kanallarını filtrele
export function filterTurkishChannels(channels: any[]): any[] {
  return channels.filter(isTurkishChannel).map(ch => ({
    ...ch,
    cleanName: cleanChannelName(ch.name),
    category: detectChannelCategory(ch.name),
  }));
}

// Kategorilere göre grupla
export function groupTurkishChannelsByCategory(channels: any[]) {
  const turkish = filterTurkishChannels(channels);

  const groups: Record<string, any[]> = {
    ulusal: [], haber: [], spor: [], film: [], cocuk: [],
    belgesel: [], muzik: [], dini: [], yerel: [], diger: [],
  };

  turkish.forEach(ch => {
    const cat = ch.category || 'diger';
    if (groups[cat]) groups[cat].push(ch);
    else groups.diger.push(ch);
  });

  return groups;
}

// Kanal sıralama puanı - POPÜLER KANALLAR ÖNCE
export function getChannelOrder(name: string): number {
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

// Türk kanallarını sırala - Popülerler önce
export function sortTurkishChannels(channels: any[]): any[] {
  const turkish = filterTurkishChannels(channels);
  return turkish.sort((a, b) => getChannelOrder(a.name) - getChannelOrder(b.name));
}

// Kategori başlıkları
export const categoryTitles: Record<string, string> = {
  ulusal: 'Ulusal Kanallar',
  haber: 'Haber Kanalları',
  spor: 'Spor Kanalları',
  film: 'Film ve Dizi Kanalları',
  cocuk: 'Çocuk Kanalları',
  belgesel: 'Belgesel Kanalları',
  muzik: 'Müzik Kanalları',
  dini: 'Dini Kanallar',
  yerel: 'Yerel Kanallar',
  diger: 'Diğer Türk Kanalları',
};

export default {
  isTurkishChannel,
  filterTurkishChannels,
  groupTurkishChannelsByCategory,
  sortTurkishChannels,
  detectChannelCategory,
  cleanChannelName,
  categoryTitles,
};
