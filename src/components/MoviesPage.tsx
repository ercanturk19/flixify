import { useEffect, useMemo, useState, useDeferredValue } from 'react';
import { Header } from './Header';
import { VideoPlayer } from './VideoPlayer';
import { useContentStore } from '../store/useContentStore';
import { Tv, Play, Info, ChevronDown, Filter, Film, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NetflixRow } from './NetflixRow';
import { getUserIptvUrl, fetchUserPlaylist } from '../lib/iptvService';
import { useAuth } from '../contexts/AuthContext';
import { UpgradePrompt } from './UpgradePrompt';

function getLanguageFromItem(item: any): string {
  const name = (item.rawName || item.name || '').toUpperCase();
  const group = (item.group || '').toUpperCase();

  if (name.startsWith('TR:') || group.includes('TR') || group.includes('TÜRK') || group.includes('TURK')) return "Türkçe";
  if (name.startsWith('EN:') || name.startsWith('UK:') || group.includes('ENG') || group.includes('UK') || group.includes('USA')) return "İngilizce";
  if (name.startsWith('DE:') || group.includes('GERMAN') || group.includes('DE ')) return "Almanca";
  if (name.startsWith('FR:') || group.includes('FRANCE') || group.includes('FRA ')) return "Fransızca";
  if (name.startsWith('NL:') || group.includes('NETHERLAND') || group.includes('DTCH')) return "Felemenkçe";
  if (name.startsWith('ES:') || group.includes('SPANISH') || group.includes('ESP ')) return "İspanyolca";
  if (name.startsWith('AR:') || group.includes('ARABIC') || group.includes('ARA ')) return "Arapça";
  if (name.startsWith('IT:') || group.includes('ITALY') || group.includes('ITA ')) return "İtalyanca";
  if (name.startsWith('RU:') || group.includes('RUSSIA') || group.includes('RUS ')) return "Rusça";
  if (group.includes('AZERBAIJAN') || group.includes('AZ ')) return "Azerice";
  if (group.includes('KURD') || group.includes('KU ')) return "Kürtçe";

  return "Diğer";
}

// M3U kanalını Netflix formatına çevir
function itemToMovie(item: any) {
  return {
    id: item.id,
    title: item.name,
    year: item.year || 2024,
    rating: item.rating || (Math.random() * 3 + 6).toFixed(1),
    duration: "2sa 15dk",
    genres: item.genres || [item.group || "Sinema"],
    description: item.description || `${item.name} - En yeni ve popüler filmler Flixify'da.`,
    poster: item.logo || item.poster || "",
    backdrop: item.backdrop || item.logo || "",
    isOriginal: false,
    isNew: item.isNew || false,
    match: Math.floor(Math.random() * 15) + 85,
    category: item.group || 'Sinema',
    type: item.type,
    url: item.url,
    language: getLanguageFromItem(item),
  };
}

const genres = ["Tümü", "Aksiyon", "Komedi", "Dram", "Bilim Kurgu", "Korku", "Romantik", "Belgesel"];

export function MoviesPage() {
  const {
    playlists,
    allChannels,
    movies,
    categories,
    selectedItem,
    setSelectedItem,
    parseAndCategorizeContent,
  } = useContentStore();

  const { user, profile } = useAuth();

  const [selectedGenre, setSelectedGenre] = useState("Tümü");
  const [selectedLanguage, setSelectedLanguage] = useState("Tümü");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(localSearchQuery);
  const [sortBy, setSortBy] = useState<"popularity" | "newest" | "rating">("popularity");
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Pagination State
  const [visibleCount, setVisibleCount] = useState(150);

  // Parse playlists
  useEffect(() => {
    if (playlists.length > 0 && allChannels.length === 0) {
      parseAndCategorizeContent();
    }
  }, [playlists, allChannels.length, parseAndCategorizeContent]);

  // Load specific user playlist
  useEffect(() => {
    if (playlists.length === 0 && user) {
      getUserIptvUrl(user.id)
        .then(async url => {
          if (!url) throw new Error("Abonelik yetkisi bulunamadı.");
          return fetchUserPlaylist(url);
        })
        .then(content => {
          if (!content) throw new Error("Oynatma listesi çekilemedi.");

          const lines = content.split('\n');
          const channels: any[] = [];
          let currentChannel: any = {};

          lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            if (line.startsWith('#EXTINF:')) {
              const logoMatch = line.match(/tvg-logo="([^"]+)"/);
              const groupMatch = line.match(/group-title="([^"]+)"/);
              const commaIndex = line.lastIndexOf(',');
              const rawName = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : '';

              currentChannel = {
                id: Math.random().toString(36).substring(2, 10),
                name: rawName,
                logo: logoMatch ? logoMatch[1] : '',
                group: groupMatch ? groupMatch[1] : 'Diğer',
              };
            } else if (!line.startsWith('#') && currentChannel.name) {
              channels.push({ ...currentChannel, url: line });
              currentChannel = {};
            }
          });

          if (channels.length > 0) {
            useContentStore.setState({
              playlists: [{
                name: 'Flixify Playlist',
                url: 'default',
                channels,
              }],
            });
          }
        })
        .catch(err => console.warn('Playlist yüklenemedi:', err));
    }
  }, [playlists.length, user]);

  // Film kategorileri
  const movieCategories = useMemo(() => {
    return categories.filter(c => c.type === 'movie');
  }, [categories]);

  // Tüm filmleri düz listeye çevir
  const allMovies = useMemo(() => {
    return movies.map(itemToMovie);
  }, [movies]);

  // Dinamik diller listesi
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    allMovies.forEach(m => {
      if (m.language) langs.add(m.language);
    });

    // "Tümü" en başta, sonra "Türkçe" (varsa), sonra diğerleri alfabetik
    const langArray = Array.from(langs);
    const hasTr = langArray.includes("Türkçe");
    const otherLangs = langArray.filter(l => l !== "Türkçe").sort();

    return [
      "Tümü",
      ...(hasTr ? ["Türkçe"] : []),
      ...otherLangs
    ];
  }, [allMovies]);

  // Filtrelenmiş ve sıralanmış filmler
  const filteredMovies = useMemo(() => {
    let filtered = allMovies;

    if (deferredSearchQuery.trim()) {
      const q = deferredSearchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
      );
    }

    if (selectedGenre !== "Tümü") {
      filtered = filtered.filter(m =>
        m.genres.some((g: string) => g.toLowerCase().includes(selectedGenre.toLowerCase()))
      );
    }

    if (selectedLanguage !== "Tümü") {
      filtered = filtered.filter(m => m.language === selectedLanguage);
    }

    // Sıralama
    switch (sortBy) {
      case "newest":
        filtered = [...filtered].sort((a, b) => b.year - a.year);
        break;
      case "rating":
        filtered = [...filtered].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        break;
      default:
        // Popülerlik (varsayılan)
        filtered = [...filtered].sort((a, b) => b.match - a.match);
    }

    return filtered;
  }, [allMovies, selectedGenre, sortBy, selectedLanguage, deferredSearchQuery]);

  // Öne çıkan film (hero section için)
  const featuredMovie = useMemo(() => {
    if (filteredMovies.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(20, filteredMovies.length));
      return filteredMovies[randomIndex];
    }
    return null;
  }, [filteredMovies]);

  // Check if user has M3U URL assigned
  if (playlists.length === 0 && !profile?.m3u_url && movies.length === 0) {
    return <UpgradePrompt />;
  }

  // Loading
  if (playlists.length === 0 || movies.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-foreground-muted text-lg">
          {playlists.length > 0 ? "Filmler hazırlanıyor..." : "İçerikler yükleniyor..."}
        </p>
      </div>
    );
  }

  // Search results handled by local localSearchQuery logic below instead of breaking the entire page flow.

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pb-16">
        {/* Hero Section */}
        {featuredMovie && (
          <div className="relative h-[70vh] w-full">
            {/* Backdrop */}
            <div className="absolute inset-0">
              {featuredMovie.backdrop ? (
                <img
                  src={featuredMovie.backdrop}
                  alt={featuredMovie.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-surface to-background" />
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>

            {/* Hero Content */}
            <div className="absolute inset-0 flex items-center px-4 md:px-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl"
              >
                <span className="text-red-500 font-semibold text-sm tracking-wider uppercase mb-2 block">
                  Filmler
                </span>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                  {featuredMovie.title}
                </h1>
                <div className="flex items-center gap-3 text-sm text-white/80 mb-4">
                  <span className="text-green-400 font-semibold">{featuredMovie.match}% Eşleşme</span>
                  <span>{featuredMovie.year}</span>
                  <span className="border border-white/40 px-1 rounded text-xs">{featuredMovie.rating}</span>
                  <span>{featuredMovie.duration}</span>
                </div>
                <p className="text-lg text-white/90 mb-6 line-clamp-3">
                  {featuredMovie.description}
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedItem(movies.find(m => m.id === featuredMovie.id) || null)}
                    className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-semibold hover:bg-white/90 transition-colors"
                  >
                    <Play size={20} fill="currentColor" />
                    Oynat
                  </button>
                  <button
                    onClick={() => setSelectedItem(movies.find(m => m.id === featuredMovie.id) || null)}
                    className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded font-semibold hover:bg-white/30 transition-colors"
                  >
                    <Info size={20} />
                    Daha Fazla Bilgi
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Filters & Content */}
        <div className="relative z-10 -mt-8 px-4 md:px-16">

          {/* HUGE AJAX SEARCH BAR */}
          <div className="relative mb-10 group max-w-4xl mx-auto shadow-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-red-500" />
            </div>
            <input
              type="text"
              placeholder="Film veya Dizi Ara..."
              value={localSearchQuery}
              onChange={(e) => {
                setLocalSearchQuery(e.target.value);
                setVisibleCount(150);
              }}
              className="block w-full pl-12 pr-4 py-4 md:py-5 border-2 border-white/10 rounded-xl leading-5 bg-surface text-white placeholder-white/50 focus:outline-none focus:border-red-500 disabled:opacity-50 transition-all font-medium text-lg md:text-xl shadow-inner focus:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            />
            {deferredSearchQuery !== localSearchQuery && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-500"></div>
              </div>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white">Filmler</h2>
              <span className="text-foreground-muted">({filteredMovies.length})</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Genre Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/20 rounded text-white text-sm hover:bg-surface-hover transition-colors"
                >
                  <Filter size={16} />
                  {selectedGenre}
                  <ChevronDown size={16} className={`transition-transform ${showGenreDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showGenreDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-40 bg-surface border border-white/20 rounded shadow-xl z-50 max-h-60 overflow-y-auto"
                    >
                      {genres.map(genre => (
                        <button
                          key={genre}
                          onClick={() => {
                            setSelectedGenre(genre);
                            setShowGenreDropdown(false);
                            setVisibleCount(150); // Tür değiştiğinde limiti sıfırla
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${selectedGenre === genre ? 'text-red-400' : 'text-white'
                            }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Language Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/20 rounded text-white text-sm hover:bg-surface-hover transition-colors"
                >
                  <Filter size={16} />
                  {selectedLanguage === "Tümü" ? "Diller" : selectedLanguage}
                  <ChevronDown size={16} className={`transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showLanguageDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-40 bg-surface border border-white/20 rounded shadow-xl z-50 max-h-60 overflow-y-auto scrollbar-thin"
                    >
                      {availableLanguages.map(lang => (
                        <button
                          key={lang}
                          onClick={() => {
                            setSelectedLanguage(lang);
                            setShowLanguageDropdown(false);
                            setVisibleCount(150); // Dil değiştiğinde limiti sıfırla
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${selectedLanguage === lang ? 'text-red-400' : 'text-white'
                            }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-surface border border-white/20 rounded text-white text-sm focus:outline-none focus:border-red-500"
              >
                <option value="popularity">Popülerlik</option>
                <option value="newest">En Yeni</option>
                <option value="rating">IMDb Puanı</option>
              </select>
            </div>
          </div>

          {/* Movies Content area */}
          {filteredMovies.length > 0 ? (
            selectedLanguage === "Tümü" && selectedGenre === "Tümü" ? (
              <div className="space-y-12 pb-20">
                {availableLanguages
                  .filter(lang => lang !== "Tümü")
                  .map(lang => {
                    const langMovies = filteredMovies
                      .filter(m => m.language === lang)
                      .slice(0, 30); // Satır başı gösterilecek film

                    if (langMovies.length === 0) return null;

                    return (
                      <motion.div
                        key={lang}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                      >
                        <NetflixRow
                          title={`${lang} Filmleri`}
                          movies={langMovies}
                          isTop10={false}
                          onSelectMovie={(movie) => setSelectedItem(movies.find(m => m.id === movie.id) || null)}
                        />
                      </motion.div>
                    );
                  })}
              </div>
            ) : (
              <div className="space-y-8 pb-20">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredMovies.slice(0, visibleCount).map((movie, idx) => (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (idx % 20) * 0.02 }}
                      onClick={() => setSelectedItem(movies.find(m => m.id === movie.id) || null)}
                      className="group cursor-pointer"
                    >
                      <div className="aspect-video bg-surface rounded-lg overflow-hidden relative">
                        {movie.poster ? (
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-background">
                            <Tv size={32} className="text-foreground-muted" />
                          </div>
                        )}
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                            <Play size={20} fill="white" className="text-white ml-1" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <h3 className="text-white text-sm font-medium truncate group-hover:text-red-400 transition-colors">
                          {movie.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-foreground-muted mt-1">
                          <span className="text-green-400">{movie.match}%</span>
                          <span>{movie.year}</span>
                          <span className="border border-white/30 px-1 rounded">{movie.rating}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Load More Button */}
                {visibleCount < filteredMovies.length && (
                  <div className="flex justify-center mt-12 mb-8">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 100)}
                      className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-medium transition-all hover:scale-105 active:scale-95"
                    >
                      Daha Fazla Göster ({filteredMovies.length - visibleCount} film kaldı)
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="text-center py-20">
              <Film size={48} className="mx-auto text-foreground-muted mb-4" />
              <p className="text-foreground-muted text-lg">Bu kriterlere uygun film bulunamadı.</p>
            </div>
          )}

          {/* Kategoriler (Row formatında) */}
          {movieCategories.length > 0 && selectedGenre === "Tümü" && (
            <div className="mt-16 space-y-8">
              <h3 className="text-xl font-bold text-white">Kategoriler</h3>
              {movieCategories.map((category: any) => (
                <div key={category.id} className="border-t border-white/10 pt-8">
                  <h4 className="text-lg font-semibold text-white mb-4">{category.title}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {category.items.slice(0, 6).map((item: any, idx: number) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedItem(item)}
                        className="aspect-video bg-surface rounded overflow-hidden cursor-pointer hover:scale-105 transition-transform relative group"
                      >
                        {item.logo ? (
                          <img src={item.logo} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <Tv size={24} className="text-foreground-muted" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-white text-xs truncate">{item.name}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-20 px-4 md:px-16 py-12 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Tv size={24} className="text-primary" />
              <span className="text-xl font-bold text-white">FLIXIFY</span>
            </div>
            <p className="text-sm text-foreground-dim">
              © 2025 Flixify. Tüm hakları gizlidir.
            </p>
          </div>
        </footer>
      </main>

      {selectedItem && (
        <VideoPlayer
          content={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

export default MoviesPage;
