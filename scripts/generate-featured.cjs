const fs = require('fs');
const path = require('path');

// M3U parse eden basit bir fonksiyon (sadece film arıyoruz)
function parseAndGenerateFeatured() {
    const m3uPath = path.join(__dirname, '..', 'public', 'playlist_rick@abi_plus.m3u');
    const outPath = path.join(__dirname, '..', 'public', 'featured.json');
    console.log('🎬 Premium filmler ayrıştırılıyor...');

    if (!fs.existsSync(m3uPath)) {
        console.error('❌ M3U dosyası bulunamadı:', m3uPath);
        return;
    }

    const content = fs.readFileSync(m3uPath, 'utf8');
    const lines = content.split('\n');

    let currentChannel = {};
    const movies = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('#EXTINF:')) {
            const tvgLogoMatch = line.match(/tvg-logo="([^"]+)"/);
            const groupTitleMatch = line.match(/group-title="([^"]+)"/);

            const nameParts = line.split(',');
            const name = nameParts.length > 1 ? nameParts[1].trim() : '';

            currentChannel = {
                name: name,
                logo: tvgLogoMatch ? tvgLogoMatch[1] : '',
                group: groupTitleMatch ? groupTitleMatch[1] : '',
            };
        } else if (line && !line.startsWith('#')) {
            currentChannel.url = line;

            // Sadece görseli (logo) olan içerikleri al
            if (currentChannel.logo && currentChannel.logo.trim() !== '' && currentChannel.name) {
                // İsim ve gruptan film olup olmadığını anla
                const nameLower = currentChannel.name.toLowerCase();
                const groupLower = (currentChannel.group || '').toLowerCase();

                let isMovie =
                    groupLower.includes('film') ||
                    groupLower.includes('movie') ||
                    groupLower.includes('sinema') ||
                    groupLower.includes('cinema') ||
                    groupLower.includes('vod') ||
                    nameLower.includes('(film)') ||
                    nameLower.includes('(movie)');

                // Kalitesiz isimleri ele (Tr:, XXX vs)
                if (nameLower.startsWith('tr:') || nameLower.includes('xxx')) {
                    isMovie = false;
                }

                if (isMovie) {
                    // İsim temizliği
                    const cleanName = currentChannel.name.replace(/\s*\(\d{4}\).*/, '').replace(/\s*\[[\d.]+].*/, '').replace(/^TR:\s*/i, '').trim();

                    // Sahte veriler (Puan, yıl vb.)
                    const randomYear = Math.floor(Math.random() * (2024 - 2010 + 1)) + 2010;
                    const randomRating = (Math.random() * (9.5 - 6.0) + 6.0).toFixed(1);
                    const randomMatch = Math.floor(Math.random() * 15) + 85;
                    const duration = Math.floor(Math.random() * 60) + 90 + ' dk';

                    movies.push({
                        id: currentChannel.url, // URL'yi ID olarak kullan
                        title: cleanName,
                        poster: currentChannel.logo,
                        backdrop: currentChannel.logo, // Posterin aynısı kapak
                        year: randomYear,
                        rating: parseFloat(randomRating),
                        duration: duration,
                        genres: [currentChannel.group || 'Sinema'],
                        description: `${cleanName} filmini kesintisiz ve yüksek kalitede izleyin.`,
                        match: randomMatch,
                        url: currentChannel.url,
                        type: 'movie',
                        category: 'featured'
                    });
                }
            }
            currentChannel = {}; // Sıfırla
        }
    }

    // Filmleri kategorilere ayırarak sadece en iyi 20'yi (iki satır onarlı) alacağız
    // Örn: Rastgele karıştır, ilk 20'yi al
    const shuffled = movies.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 20);

    const featuredData = {
        hero: selected[0], // En baştaki hero film
        categories: [
            {
                id: 'new-releases',
                title: 'Günün Popüler Filmleri',
                items: selected.slice(1, 11) // 10 film
            },
            {
                id: 'for-you',
                title: 'Sizin İçin Seçilenler',
                items: selected.slice(11, 21) // 10 film (Toplam 1+9+10 = 20 veya 1+10+9) aslında 20 tane alıyoruz hero hariç toplamı az olabilir, 
                // hero zaten listede olacak, bu yüzden slice(0, 10) yapalım
            }
        ]
    };

    // Düzeltme
    featuredData.categories[0].items = selected.slice(0, 10);
    featuredData.categories[1].items = selected.slice(10, 20);

    fs.writeFileSync(outPath, JSON.stringify(featuredData, null, 2), 'utf8');
    console.log(`✅ Başarılı! ${outPath} içerisine premium vip içerikler eklendi.`);
}

parseAndGenerateFeatured();
