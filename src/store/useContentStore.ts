import { create } from 'zustand';
import { M3UChannel, M3UPlaylist } from '../lib/m3uParser';
import { getCachedM3UContent, cacheM3UContent, getCachedParsedData, cacheParsedData } from '../lib/db';

export type ContentType = 'live' | 'movie' | 'series' | 'all';

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

interface ContentState {
    activeContentType: ContentType;
    setActiveContentType: (type: ContentType) => void;
    playlists: M3UPlaylist[];
    allChannels: M3UChannel[];
    liveChannels: ContentItem[];
    movies: ContentItem[];
    series: ContentItem[];
    featuredContent: ContentItem | null;
    categories: ContentCategory[];
    selectedItem: ContentItem | null;
    isLoading: boolean;
    error: string | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: ContentItem[];
    loadFromM3uUrl: (url: string) => Promise<void>;
    setSelectedItem: (item: ContentItem | null) => void;
    clearContent: () => void;
}

// Pre-compiled regex patterns for better performance
const REGEX_PATTERNS = {
    year: /\((\d{4})\)/,
    rating: /\[([\d.]+)\]/,
    countryCode: /^([A-Z]{2}):\s*/,
    filmGroup: /film|movie|sinema|cinema/i,
    filmName: /\(film\)|\(movie\)/i,
    filmUrl: /\/movie\/|\/vod\//i,
    seriesGroup: /dizi|series|show/i,
    seriesName: /\(dizi\)|\(series\)/i,
    seriesUrl: /\/series\//i,
    trDubbed: /dublaj|tr dub|türkçe dub/i,
    trGroup: /dub|tr film|yerli/i,
};

// Cached filter function
function detectContentType(channel: M3UChannel): ContentType {
    const name = channel.name;
    const group = channel.group || '';
    const url = channel.url;

    if (REGEX_PATTERNS.filmGroup.test(group) || 
        REGEX_PATTERNS.filmName.test(name) ||
        REGEX_PATTERNS.filmUrl.test(url)) {
        return 'movie';
    }

    if (REGEX_PATTERNS.seriesGroup.test(group) || 
        REGEX_PATTERNS.seriesName.test(name) ||
        REGEX_PATTERNS.seriesUrl.test(url)) {
        return 'series';
    }

    return 'live';
}

function extractMetadata(channel: M3UChannel): Partial<ContentItem> {
    const name = channel.name;
    let year: number | undefined;
    let rating: number | undefined;

    const yearMatch = name.match(REGEX_PATTERNS.year);
    if (yearMatch) {
        year = parseInt(yearMatch[1]);
    }

    const ratingMatch = name.match(REGEX_PATTERNS.rating);
    if (ratingMatch) {
        rating = parseFloat(ratingMatch[1]);
    }

    return { year, rating, poster: channel.logo, backdrop: channel.logo, description: '' };
}

// Optimized categorization function - runs in batches to prevent blocking
function categorizeContentInBatches(
    allChannels: M3UChannel[],
    onProgress: (result: Partial<ContentState>) => void,
    batchSize = 1000
) {
    const liveChannels: ContentItem[] = [];
    const movies: ContentItem[] = [];
    const series: ContentItem[] = [];
    
    let index = 0;
    
    function processBatch() {
        const end = Math.min(index + batchSize, allChannels.length);
        
        for (let i = index; i < end; i++) {
            const channel = allChannels[i];
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
                const upperName = channel.name.toUpperCase();
                const upperGroup = (channel.group || '').toUpperCase();
                
                if (REGEX_PATTERNS.trDubbed.test(upperName) || REGEX_PATTERNS.trGroup.test(upperGroup)) {
                    movies.push(contentItem);
                }
            } else if (type === 'series') {
                series.push(contentItem);
            }
        }
        
        index = end;
        
        if (index < allChannels.length) {
            // Schedule next batch
            setTimeout(processBatch, 0);
        } else {
            // All done, build categories
            const categories = buildCategories(liveChannels, movies, series);
            
            let featured: ContentItem | null = null;
            if (movies.length > 0) featured = movies[0];
            else if (series.length > 0) featured = series[0];
            else if (liveChannels.length > 0) featured = liveChannels[0];

            onProgress({
                allChannels,
                liveChannels,
                movies,
                series,
                categories,
                featuredContent: featured,
                isLoading: false
            });
        }
    }
    
    processBatch();
}

function buildCategories(liveChannels: ContentItem[], movies: ContentItem[], series: ContentItem[]): ContentCategory[] {
    const categories: ContentCategory[] = [];

    // Movies
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

    // Live TV
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

    // Series
    if (series.length > 0) {
        categories.push({
            id: 'series-popular',
            title: 'Diziler',
            type: 'series',
            items: series.slice(0, 30),
        });
    }

    return categories;
}

// Debounced search function
function createDebouncedSearch() {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (
        query: string, 
        liveChannels: ContentItem[], 
        movies: ContentItem[], 
        series: ContentItem[],
        callback: (results: ContentItem[]) => void
    ) => {
        if (timeoutId) clearTimeout(timeoutId);
        
        if (!query.trim()) {
            callback([]);
            return;
        }
        
        timeoutId = setTimeout(() => {
            const lowerQuery = query.toLowerCase();
            const allItems = liveChannels.length + movies.length + series.length > 10000 
                ? [...liveChannels.slice(0, 1000), ...movies.slice(0, 1000), ...series.slice(0, 1000)]
                : [...liveChannels, ...movies, ...series];
                
            const results = allItems.filter(item =>
                item.name.toLowerCase().includes(lowerQuery) ||
                item.group?.toLowerCase().includes(lowerQuery)
            ).slice(0, 20);
            
            callback(results);
        }, 150); // 150ms debounce
    };
}

const debouncedSearch = createDebouncedSearch();

export const useContentStore = create<ContentState>()((set, get) => ({
    activeContentType: 'all',
    playlists: [],
    allChannels: [],
    liveChannels: [],
    movies: [],
    series: [],
    featuredContent: null,
    categories: [],
    selectedItem: null,
    isLoading: false,
    error: null,
    searchQuery: '',
    searchResults: [],

    setActiveContentType: (type) => set({ activeContentType: type }),

    setSelectedItem: (item) => set({ selectedItem: item }),

    clearContent: () => set({
        playlists: [],
        allChannels: [],
        liveChannels: [],
        movies: [],
        series: [],
        categories: [],
        featuredContent: null,
        selectedItem: null,
        searchResults: [],
    }),

    setSearchQuery: (query) => {
        set({ searchQuery: query });
        
        const { liveChannels, movies, series } = get();
        
        debouncedSearch(query, liveChannels, movies, series, (results) => {
            set({ searchResults: results });
        });
    },

    loadFromM3uUrl: async (url: string) => {
        set({ isLoading: true, error: null });
        const trimmedUrl = url.trim();

        try {
            // 0. Try Parsed Cache (Fastest path)
            try {
                const parsedData = await getCachedParsedData(trimmedUrl);
                if (parsedData) {
                    console.log('[CONTENT_STORE] 🚀 Loaded from cache');
                    const { allChannels, liveChannels, movies, series, categories } = parsedData;
                    
                    let featured = null;
                    if (movies.length > 0) featured = movies[0];
                    else if (series.length > 0) featured = series[0];
                    else if (liveChannels.length > 0) featured = liveChannels[0];

                    set({
                        playlists: [{ name: 'Hesap Listesi', url: trimmedUrl, channels: allChannels }],
                        allChannels,
                        liveChannels,
                        movies,
                        series,
                        categories,
                        featuredContent: featured,
                        isLoading: false
                    });
                    return;
                }
            } catch (err) {
                console.warn('[CONTENT_STORE] Cache read failed:', err);
            }

            let content: string | null = null;

            // 1. Try Content Cache
            try {
                content = await getCachedM3UContent(trimmedUrl);
                if (content) {
                    console.log('[CONTENT_STORE] Using cached M3U content');
                }
            } catch (err) {
                console.warn('[CONTENT_STORE] Content cache read failed:', err);
            }

            // 2. Fetch from network if not cached
            if (!content) {
                const proxyServers = [
                    { name: 'Flixify Proxy', url: `/api/proxy?url=${encodeURIComponent(trimmedUrl)}` },
                    { name: 'AllOrigins', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(trimmedUrl)}` },
                    { name: 'CORS Proxy', url: `https://cors-anywhere.azm.workers.dev/${trimmedUrl}` },
                ];

                for (const proxy of proxyServers) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 20000);

                        const response = await fetch(proxy.url, {
                            signal: controller.signal,
                            credentials: proxy.name === 'Flixify Proxy' ? 'same-origin' : 'omit'
                        });

                        clearTimeout(timeoutId);

                        if (response.ok) {
                            const fetchedContent = await response.text();
                            if (fetchedContent && fetchedContent.includes('#EXTM3U')) {
                                console.log(`[CONTENT_STORE] Fetched from ${proxy.name}`);
                                content = fetchedContent;
                                break;
                            }
                        }
                    } catch (err: any) {
                        console.warn(`[CONTENT_STORE] ${proxy.name} failed:`, err.message);
                    }
                }

                if (!content) {
                    throw new Error('M3U listesi yüklenemedi. Lütfen URL\'yi kontrol edin.');
                }

                cacheM3UContent(trimmedUrl, content).catch(console.warn);
            }

            // 3. Parse and categorize in batches (non-blocking)
            console.log('[CONTENT_STORE] Starting batch processing...');
            
            // Create worker for parsing
            const worker = new Worker(new URL('../workers/m3uWorker.ts', import.meta.url), { type: 'module' });

            worker.postMessage({
                type: 'PARSE_AND_CATEGORIZE',
                payload: { content }
            });

            worker.onmessage = (e) => {
                const { type, result, error } = e.data;

                if (type === 'SUCCESS') {
                    const { allChannels, liveChannels, movies, series, categories } = result;

                    // Cache parsed data
                    cacheParsedData(trimmedUrl, result).catch(console.warn);

                    let featured = null;
                    if (movies.length > 0) featured = movies[0];
                    else if (series.length > 0) featured = series[0];
                    else if (liveChannels.length > 0) featured = liveChannels[0];

                    set({
                        playlists: [{ name: 'Hesap Listesi', url: trimmedUrl, channels: allChannels }],
                        allChannels,
                        liveChannels,
                        movies,
                        series,
                        categories,
                        featuredContent: featured,
                        isLoading: false
                    });
                    
                    worker.terminate();
                } else {
                    console.error('[CONTENT_STORE] Worker Error:', error);
                    set({ isLoading: false, error: error });
                    worker.terminate();
                }
            };

            worker.onerror = (err) => {
                console.error('[CONTENT_STORE] Worker Fatal Error:', err);
                set({ isLoading: false, error: 'İçerik işlenirken hata oluştu.' });
                worker.terminate();
            };

        } catch (err: any) {
            console.error('M3U Yükleme Hatası:', err);
            set({ isLoading: false, error: err.message });
        }
    }
}));

export default useContentStore;
