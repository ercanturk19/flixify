// m3uWorker.ts
// Web Worker for parsing and categorizing M3U playlists off the main thread

// --- Types ---

export interface M3UChannel {
    id: string;
    name: string;
    logo: string;
    group: string;
    url: string;
    countryCode?: string;
    countryName?: string;
}

export type ContentType = 'live' | 'movie' | 'series';

export interface ContentItem {
    id: string;
    name: string;
    logo?: string;
    backdrop?: string;
    poster?: string;
    description?: string;
    rating?: number;
    year?: number;
    duration?: string;
    genres?: string[];
    group?: string;
    url?: string;
    type: ContentType;
    seasons?: number;
    episodes?: number;
    isLive?: boolean;
}

export interface ContentCategory {
    id: string;
    title: string;
    type: ContentType;
    items: ContentItem[];
}

// --- Country Data ---
const countryMap: Record<string, { name: string; flag: string }> = {
    'TR': { name: 'Türkiye', flag: '🇹🇷' },
    'RU': { name: 'Rusya', flag: '🇷🇺' },
    'US': { name: 'ABD', flag: '🇺🇸' },
    'UK': { name: 'İngiltere', flag: '🇬🇧' },
    'DE': { name: 'Almanya', flag: '🇩🇪' },
    'FR': { name: 'Fransa', flag: '🇫🇷' },
    // ... (Add more if needed, kept minimal for performance)
};

// --- Helper Functions ---

const generateId = () => Math.random().toString(36).substring(2, 10);

function extractCountryCode(name: string): { code: string | null; cleanName: string } {
    const match = name.match(/^([A-Z]{2}):\s*/);
    if (match) {
        const code = match[1];
        const cleanName = name.substring(match[0].length).trim();
        return { code, cleanName };
    }
    return { code: null, cleanName: name };
}

function detectContentType(channel: M3UChannel): ContentType {
    const name = channel.name.toLowerCase();
    const group = (channel.group || '').toLowerCase();
    const url = channel.url.toLowerCase();

    if (group.includes('film') || group.includes('movie') ||
        group.includes('sinema') || group.includes('cinema') ||
        name.includes('(film)') || name.includes('(movie)') ||
        url.includes('/movie/') || url.includes('/vod/')) {
        return 'movie';
    }

    if (group.includes('dizi') || group.includes('series') ||
        group.includes('show') || name.includes('(dizi)') ||
        name.includes('(series)') || url.includes('/series/')) {
        return 'series';
    }

    return 'live';
}

function extractMetadata(channel: M3UChannel): Partial<ContentItem> {
    const name = channel.name;
    let year: number | undefined;
    let rating: number | undefined;

    const yearMatch = name.match(/\((\d{4})\)/);
    if (yearMatch) {
        year = parseInt(yearMatch[1]);
    }

    const ratingMatch = name.match(/\[([\d.]+)\]/);
    if (ratingMatch) {
        rating = parseFloat(ratingMatch[1]);
    }

    return { year, rating, poster: channel.logo, backdrop: channel.logo, description: '' };
}

// --- Main Parsing Logic ---

function parseM3U(content: string): M3UChannel[] {
    const lines = content.split('\n');
    const channels: M3UChannel[] = [];
    let currentChannel: Partial<M3UChannel> = {};

    // Pre-compile regex for performance
    const logoRegex = /tvg-logo="([^"]+)"/;
    const groupRegex = /group-title="([^"]+)"/;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF:')) {
            const logoMatch = logoRegex.exec(line);
            const groupMatch = groupRegex.exec(line);

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
                channels.push({
                    id: currentChannel.id || generateId(),
                    name: currentChannel.name,
                    logo: currentChannel.logo || '',
                    group: currentChannel.group || 'Diğer',
                    url: line,
                    countryCode: currentChannel.countryCode,
                    countryName: currentChannel.countryCode ? countryMap[currentChannel.countryCode]?.name : undefined,
                });
                currentChannel = {};
            }
        }
    }
    return channels;
}

function categorizeContent(allChannels: M3UChannel[]) {
    const liveChannels: ContentItem[] = [];
    const movies: ContentItem[] = [];
    const series: ContentItem[] = [];

    for (const channel of allChannels) {
        const type = detectContentType(channel);
        const metadata = extractMetadata(channel);

        const contentItem: ContentItem = {
            id: channel.id,
            name: channel.name.replace(/\s*\(\d{4}\).*/, '').replace(/\s*\[[\d.]+\].*/, '').trim(),
            logo: channel.logo,
            group: channel.group,
            url: channel.url,
            type,
            isLive: type === 'live',
            genres: channel.group ? [channel.group] : undefined,
            ...metadata,
        };

        if (type === 'live') {
            liveChannels.push(contentItem);
        } else if (type === 'movie') {
            // OPTIMIZED FILTER: Only include TR dubbed or local content
            const upperName = channel.name.toUpperCase();
            const upperGroup = (channel.group || '').toUpperCase();
            
            const isTrDubbed =
                upperName.includes('DUBLAJ') ||
                upperName.includes('TR DUB') ||
                upperName.includes('TÜRKÇE DUB') ||
                upperGroup.includes('DUB') ||
                upperGroup.includes('TR FİLM') ||
                upperGroup.includes('TR FILM') ||
                upperGroup.includes('YERLİ') ||
                upperGroup.includes('YERLI');

            if (isTrDubbed) {
                movies.push(contentItem);
            }
        } else if (type === 'series') {
            series.push(contentItem);
        }
    }

    // --- CATEGORIZATION LOGIC ---
    const categories: ContentCategory[] = [];

    // 1. Movies
    const movieGroupMap = new Map<string, ContentItem[]>();
    for (const item of movies) {
        let group = item.group || 'Genel';
        if (group.includes('▹')) group = group.split('▹')[1].trim();
        else if (group.includes('|')) group = group.split('|')[1].trim();
        
        if (!movieGroupMap.has(group)) movieGroupMap.set(group, []);
        movieGroupMap.get(group)!.push(item);
    }

    const movieCategories: ContentCategory[] = [];
    movieGroupMap.forEach((items, groupName) => {
        if (items.length >= 3) {
            movieCategories.push({
                id: `movie-${groupName}`,
                title: groupName,
                type: 'movie',
                items: items.slice(0, 30),
            });
        }
    });
    movieCategories.sort((a, b) => b.items.length - a.items.length);
    categories.push(...movieCategories);

    // 2. Live TV
    const liveGroupMap = new Map<string, ContentItem[]>();
    for (const item of liveChannels) {
        const group = item.group || 'Diğer';
        if (!liveGroupMap.has(group)) liveGroupMap.set(group, []);
        liveGroupMap.get(group)!.push(item);
    }

    const priorityGroups = ['Ulusal', 'Spor', 'Belgesel', 'Haber', 'Çocuk'];
    priorityGroups.forEach(groupName => {
        if (liveGroupMap.has(groupName)) {
            const items = liveGroupMap.get(groupName)!;
            if (items.length > 0) {
                categories.push({
                    id: `live-${groupName}`,
                    title: groupName,
                    type: 'live',
                    items: items.slice(0, 20),
                });
            }
            liveGroupMap.delete(groupName);
        }
    });

    liveGroupMap.forEach((items, groupName) => {
        if (items.length >= 5) {
            categories.push({
                id: `live-${groupName}`,
                title: groupName,
                type: 'live',
                items: items.slice(0, 20),
            });
        }
    });

    // 3. Series
    if (series.length > 0) {
        categories.push({
            id: 'series-popular',
            title: 'Diziler',
            type: 'series',
            items: series.slice(0, 30),
        });
    }

    return { allChannels, liveChannels, movies, series, categories };
}

// --- Worker Event Handler ---

self.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data;

    if (type === 'PARSE_AND_CATEGORIZE') {
        try {
            const { content } = payload;
            const allChannels = parseM3U(content);
            const result = categorizeContent(allChannels);
            
            // @ts-ignore
            self.postMessage({ type: 'SUCCESS', result });
        } catch (err: any) {
            // @ts-ignore
            self.postMessage({ type: 'ERROR', error: err.message });
        }
    }
};