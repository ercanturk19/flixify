import { create } from 'zustand';
import { M3UChannel } from '../lib/m3uParser';
import { isTurkishChannel, sortTurkishChannels } from '../lib/turkishChannels';
import { supabase } from '../lib/supabase';
import { getUserIptvUrl, fetchUserPlaylist } from '../lib/iptvService';

// Kanalın Canlı TV olup olmadığını kontrol et (VOD'ları harici tut)
function isLiveChannel(channel: Partial<M3UChannel>): boolean {
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
  'HU': { name: 'Macaristan', flag: '🇭🇺' },
  'RO': { name: 'Romanya', flag: '🇷🇴' },
  'BG': { name: 'Bulgaristan', flag: '🇧🇬' },
  'HR': { name: 'Hırvatistan', flag: '🇭🇷' },
  'RS': { name: 'Sırbistan', flag: '🇷🇸' },
  'BA': { name: 'Bosna Hersek', flag: '🇧🇦' },
  'AL': { name: 'Arnavutluk', flag: '🇦🇱' },
  'GR': { name: 'Yunanistan', flag: '🇬🇷' },
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
  'IR': { name: 'İran', flag: '🇮🇷' },
  'IQ': { name: 'Irak', flag: '🇮🇶' },
  'SY': { name: 'Suriye', flag: '🇸🇾' },
  'LB': { name: 'Lübnan', flag: '🇱🇧' },
  'JO': { name: 'Ürdün', flag: '🇯🇴' },
  'IL': { name: 'İsrail', flag: '🇮🇱' },
  'SA': { name: 'Suudi Arabistan', flag: '🇸🇦' },
  'AE': { name: 'BAE', flag: '🇦🇪' },
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
  'ZA': { name: 'Güney Afrika', flag: '🇿🇦' },
  'NG': { name: 'Nijerya', flag: '🇳🇬' },
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
  'TH': { name: 'Tayland', flag: '🇹🇭' },
  'VN': { name: 'Vietnam', flag: '🇻🇳' },
  'ID': { name: 'Endonezya', flag: '🇮🇩' },
  'MY': { name: 'Malezya', flag: '🇲🇾' },
  'PH': { name: 'Filipinler', flag: '🇵🇭' },
  'SG': { name: 'Singapur', flag: '🇸🇬' },
  'AF': { name: 'Afganistan', flag: '🇦🇫' },
};

interface Country {
  code: string;
  name: string;
  flag: string;
  channelCount: number;
}

interface PlaylistCacheState {
  isLoaded: boolean;
  isLoading: boolean;
  progress: number;
  allChannels: M3UChannel[];
  countries: Country[];
  turkishChannelCount: number;
  channelsByCountry: Map<string, M3UChannel[]>;
  loadPlaylist: () => Promise<void>;
  getChannelsByCountry: (countryCode: string) => M3UChannel[];
  clearCache: () => void;
}

export const usePlaylistCache = create<PlaylistCacheState>()((set, get) => ({
  isLoaded: false,
  isLoading: false,
  progress: 0,
  allChannels: [],
  countries: [],
  turkishChannelCount: 0,
  channelsByCountry: new Map(),

  loadPlaylist: async () => {
    const state = get();

    if (state.isLoaded || state.isLoading) {
      return;
    }

    set({ isLoading: true, progress: 0 });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Giriş yapılmış bir kullanıcı bulunamadı.");

      const url = await getUserIptvUrl(user.id);
      if (!url) throw new Error("Bu kullanıcı için tanımlı IPTV bağlantısı bulunamadı.");

      const content = await fetchUserPlaylist(url);
      if (!content) throw new Error("Oynatma listesi indirilemedi.");

      const lines = content.split('\n');
      const channels: M3UChannel[] = [];
      const countryCounts = new Map<string, number>();
      const channelsByCountry = new Map<string, M3UChannel[]>();

      let currentChannel: Partial<M3UChannel> = {};
      let processedLines = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        processedLines++;

        if (processedLines % 5000 === 0) {
          set({ progress: Math.round((processedLines / lines.length) * 100) });
        }

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
            id: Math.random().toString(36).substring(2, 10),
            name: cleanName,
            rawName: rawName,
            logo: logoMatch ? logoMatch[1] : '',
            group: groupMatch ? groupMatch[1] : 'Diğer',
            countryCode: countryCode || undefined,
          };
        } else if (!trimmed.startsWith('#') && currentChannel.name) {
          const channel = { ...currentChannel, url: trimmed } as M3UChannel;

          // Sadece Canlı TV ise (Film/Dizi değilse) listeye ekle
          if (isLiveChannel(channel)) {
            channels.push(channel);

            if (channel.countryCode) {
              countryCounts.set(channel.countryCode, (countryCounts.get(channel.countryCode) || 0) + 1);
              const countryChannels = channelsByCountry.get(channel.countryCode) || [];
              countryChannels.push(channel);
              channelsByCountry.set(channel.countryCode, countryChannels);
            }
          }

          currentChannel = {};
        }
      }

      // Doğru Türk kanalı sayısını hesapla (isTurkishChannel kullanarak)
      // Artık sadece Live TV'ler filtreye girdiği için sayı çok daha güvenilir
      const realTurkishCount = channels.filter(ch => isTurkishChannel(ch)).length;

      // Ülke listesi oluştur
      const countries: Country[] = [];
      countryCounts.forEach((count, code) => {
        const info = countryMap[code];
        if (info) {
          countries.push({ code, name: info.name, flag: info.flag, channelCount: count });
        }
      });

      // TR ve RU'yu öne al
      countries.sort((a, b) => {
        if (a.code === 'TR') return -1;
        if (b.code === 'TR') return 1;
        if (a.code === 'RU') return -1;
        if (b.code === 'RU') return 1;
        return b.channelCount - a.channelCount;
      });

      set({
        isLoaded: true,
        isLoading: false,
        progress: 100,
        allChannels: channels,
        countries,
        turkishChannelCount: realTurkishCount,
        channelsByCountry,
      });

    } catch (err) {
      console.error('Playlist yükleme hatası:', err);
      set({ isLoading: false, progress: 0 });
    }
  },

  getChannelsByCountry: (countryCode: string) => {
    const { allChannels, channelsByCountry } = get();

    // TÜRKİYE İÇİN ÖZEL: SADECE GERÇEK TÜRK KANALLARI VE BEIN KANALLARI
    if (countryCode === 'TR') {
      // TÜRKİYE İÇİN ÖZEL: SADECE GERÇEK TÜRK KANALLARI (VOD, Film, Yabancı vs Elendi)
      const turkishChannels = allChannels.filter(ch => isTurkishChannel(ch));

      // Sırala ve döndür
      return sortTurkishChannels(turkishChannels).map(ch => ({
        ...ch,
        countryCode: 'TR',
        group: ch.group?.toUpperCase().includes('TR') ? ch.group : 'Türkiye'
      }));
    }

    return channelsByCountry.get(countryCode) || [];
  },

  clearCache: () => {
    set({
      isLoaded: false,
      isLoading: false,
      progress: 0,
      allChannels: [],
      countries: [],
      turkishChannelCount: 0,
      channelsByCountry: new Map(),
    });
  },
}));

export default usePlaylistCache;
