import fs from 'fs';
import readline from 'readline';

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

function isMovie(url: string, group: string): boolean {
    const lowerUrl = url.toLowerCase();
    const lowerGroup = group.toLowerCase();
    if (lowerUrl.includes('/series/')) return false;
    if (lowerGroup.includes('dizi') || lowerGroup.includes('series')) return false;

    if (lowerUrl.includes('/movie/')) return true;
    if (lowerGroup.includes('film') || lowerGroup.includes('sinema') || lowerGroup.includes('movie') || lowerGroup.includes('vod')) return true;

    return false;
}

function isSeries(url: string, group: string, name: string): boolean {
    const lowerUrl = url.toLowerCase();
    const lowerGroup = group.toLowerCase();
    const lowerName = name.toLowerCase();

    if (lowerUrl.includes('/series/')) return true;
    if (lowerGroup.includes('dizi') || lowerGroup.includes('series')) return true;
    if (lowerName.includes('(dizi)') || lowerName.includes('sezon') || lowerName.includes('bolum')) return true;

    return false;
}

function getChannelOrder(name: string): number {
    const upper = name.trim().toUpperCase();
    if (upper.includes('TRT 1')) return 1;
    if (upper.includes('ATV')) return 2;
    if (upper.includes('KANAL D')) return 3;
    if (upper.includes('SHOW TV')) return 4;
    if (upper.includes('STAR TV')) return 5;
    if (upper.includes('TV 8') || upper.includes('TV8')) return 6;
    if (upper.includes('NOW')) return 7;
    if (upper.includes('KANAL 7')) return 8;
    return 999;
}

// Fisher-Yates shuffle algorithm for randomizing arrays
function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function run() {
    const fileStream = fs.createReadStream('public/playlist.m3u');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const topLiveChannels: any[] = [];

    // Kategorik Veri Havuzları
    const allMovies: any[] = [];
    const trDubbedMovies: any[] = [];
    const trLocalMovies: any[] = [];
    const kidsMovies: any[] = [];
    const seriesList: any[] = [];

    let currentChannel: any = {};

    console.log("Premium Ana Sayfa verileri için tarama başlatıldı...");

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

            // 1. CANLI TV (Türkiye Editör Seçimi)
            const isTrLive = isLiveChannel(currentChannel.url, currentChannel.group, currentChannel.name) &&
                (
                    currentChannel.name.toUpperCase().startsWith('TR:') ||
                    currentChannel.group.toUpperCase() === 'TÜRKİYE' ||
                    currentChannel.group.toUpperCase() === 'TURKEY' ||
                    currentChannel.group.toUpperCase().includes('TR ') ||
                    currentChannel.name.toUpperCase().includes('TÜRK') ||
                    currentChannel.group.toUpperCase().includes('TÜRK')
                );

            if (isTrLive && getChannelOrder(currentChannel.name) < 10 && currentChannel.logo) {
                if (!topLiveChannels.find(c => c.name === currentChannel.name) && topLiveChannels.length < 20) {
                    topLiveChannels.push({ ...currentChannel, type: 'live', isLive: true });
                }
            }

            // 2. FİLMLER & DİZİLER (Sadece afişi olan kaliteli içerikler)
            if (currentChannel.logo && currentChannel.logo.startsWith('http')) {
                let cleanName = currentChannel.name.trim();
                const yearMatch = cleanName.match(/\((\d{4})\)/);
                const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

                cleanName = cleanName.replace(/\s*\(\d{4}\).*/, '').replace(/\s*\[[\d.]+\].*/, '').trim();

                // Sabit Puan Ataması (Gerçekçi Görünüm)
                const mockMatch = Math.floor(Math.random() * 20) + 80; // 80-99
                const mockDuration = Math.floor(Math.random() * 60) + 90 + " dk";
                const isAdult = cleanName.toUpperCase().includes('KORKU') || cleanName.toUpperCase().includes('GERILIM');

                const contentItem = {
                    id: currentChannel.id,
                    name: cleanName,
                    url: currentChannel.url,
                    logo: currentChannel.logo,
                    group: currentChannel.group,
                    type: 'movie', // Default
                    isLive: false,
                    backdrop: currentChannel.logo,
                    poster: currentChannel.logo,
                    year: year || new Date().getFullYear(),
                    match: mockMatch,
                    duration: mockDuration,
                    ageLimit: isAdult ? '18+' : '13+',
                    genres: [currentChannel.group]
                };

                // DİZİ KONTROLÜ
                if (isSeries(currentChannel.url, currentChannel.group, currentChannel.name)) {
                    contentItem.type = 'series';
                    contentItem.duration = (Math.floor(Math.random() * 3) + 1) + " Sezon";
                    seriesList.push(contentItem);
                }
                // FİLM KONTROLÜ
                else if (isMovie(currentChannel.url, currentChannel.group)) {
                    allMovies.push(contentItem);

                    const groupUp = currentChannel.group.toUpperCase();
                    const nameUp = currentChannel.name.toUpperCase();

                    // Türkçe Dublaj
                    if (groupUp.includes('DUB') || nameUp.includes('DUBLAJ')) {
                        trDubbedMovies.push(contentItem);
                    }
                    // Yerli (Türk Yapımı)
                    if (groupUp.includes('YERL') || groupUp.includes('TURK FILM') || groupUp.includes('TR FILM')) {
                        trLocalMovies.push(contentItem);
                    }
                    // Çocuklar İçin (Animasyon / Aile)
                    if (groupUp.includes('ANIMASYON') || groupUp.includes('COCUK') || groupUp.includes('AILE') || nameUp.includes('ANIMASYON')) {
                        kidsMovies.push(contentItem);
                    }
                }
            }

            currentChannel = {};
        }
    }

    topLiveChannels.sort((a, b) => getChannelOrder(a.name) - getChannelOrder(b.name));

    // Canlı TV Eşsizleştirme
    const finalChannels = [];
    const addedNames = new Set();
    for (const ch of topLiveChannels) {
        let coreName = ch.name;
        const upper = ch.name.toUpperCase();
        if (upper.includes('TRT 1')) coreName = 'TRT 1';
        else if (upper.includes('ATV')) coreName = 'ATV';
        else if (upper.includes('KANAL D')) coreName = 'KANAL D';
        else if (upper.includes('SHOW')) coreName = 'SHOW TV';
        else if (upper.includes('STAR')) coreName = 'STAR TV';
        else if (upper.includes('TV 8') || upper.includes('TV8')) coreName = 'TV 8';
        else if (upper.includes('NOW')) coreName = 'NOW';
        else if (upper.includes('KANAL 7')) coreName = 'KANAL 7';

        if (!addedNames.has(coreName) && finalChannels.length < 8) {
            finalChannels.push(ch);
            addedNames.add(coreName);
        }
    }

    // Seçilmiş İçerikler (Satırlar için karıştırılmış ve kesilmiş listeler)
    // Yeni Eklenenler (Tüm filmler arasından rastgele 30 tane)
    const newArrivals = shuffleArray([...allMovies]).slice(0, 30);

    // Trend Olanlar (Dizi ve Film karışık 30 tane)
    const trends = shuffleArray([...trDubbedMovies.slice(0, 15), ...seriesList.slice(0, 15)]);

    // Popüler Diziler
    const popularSeries = shuffleArray([...seriesList]).slice(0, 30);

    // Türkçe Dublaj Filmler
    const dubbedList = shuffleArray([...trDubbedMovies]).slice(0, 30);

    // Yerli (Türkiye) Filmleri
    const localList = shuffleArray([...trLocalMovies]).slice(0, 20);

    // Çocuklar İçin
    const kidsList = shuffleArray([...kidsMovies]).slice(0, 25);

    // Hero Banner için çok kaliteli (genellikle TR dublajlı veya popüler bir film/dizi) seçimi
    let heroContent = null;
    if (newArrivals.length > 0) {
        heroContent = newArrivals[Math.floor(Math.random() * newArrivals.length)];
        // Hero'ya özel kısa açıklama
        heroContent.description = "Müzik, aksiyon ve maceranın kalbine yolculuk yapın. Dünyanın en iyi film arşivinden sizin için özenle seçilmiş bu eşsiz yapımı hemen şimdi Türkçe dublaj veya altyazı seçenekleriyle kesintisiz izlemeye başlayın.";
    }

    // Ana Sayfa Veri Yapısı (Kategori satır düzeni)
    const categories = [
        { id: 'row-trends', title: '🔥 Trend Olan İçerikler', type: 'mixed', items: trends },
        { id: 'row-new', title: '🎬 Yeni Eklenenler', type: 'movie', items: newArrivals },
        { id: 'row-series', title: '📺 Popüler Diziler', type: 'series', items: popularSeries },
        { id: 'row-dubbed', title: '🇹🇷 Kesintisiz Türkçe Dublaj', type: 'movie', items: dubbedList },
        { id: 'row-local', title: '🌍 Türk Yapımları', type: 'movie', items: localList },
        { id: 'row-kids', title: '🧒 Çocuklar İçin', type: 'movie', items: kidsList }
    ].filter(cat => cat.items.length > 0); // Boş kategorileri gizle

    const homepageData = {
        hero: heroContent,
        liveChannels: finalChannels,
        categories: categories
    };

    fs.writeFileSync('public/homepage_data.json', JSON.stringify(homepageData, null, 2), 'utf-8');

    console.log(`✅ Premium Ana Sayfa JSON oluşturuldu!`);
    console.log(`   - Kategori Sayısı: ${categories.length}`);
    console.log(`   - Trendler: ${trends.length}, Diziler: ${popularSeries.length}`);
}

run();
