import { useEffect, useState, useMemo, useRef, useCallback, memo } from 'react';
import { Header } from './Header';
import { NetflixRow } from './NetflixRow';
import { VideoPlayer } from './VideoPlayer';
import { useContentStore } from '../store/useContentStore';
import { useAuth } from '../contexts/AuthContext';
import { Tv, Search, Play, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Memoized to prevent re-renders when parent changes
export const HomePage = memo(function HomePage() {
  // Select only needed state from store to prevent unnecessary re-renders
  const selectedItem = useContentStore(state => state.selectedItem);
  const setSelectedItem = useContentStore(state => state.setSelectedItem);
  const searchQuery = useContentStore(state => state.searchQuery);
  const setSearchQuery = useContentStore(state => state.setSearchQuery);
  const searchResults = useContentStore(state => state.searchResults);
  const loadFromM3uUrl = useContentStore(state => state.loadFromM3uUrl);
  const storeLoading = useContentStore(state => state.isLoading);
  const liveChannels = useContentStore(state => state.liveChannels);
  const movies = useContentStore(state => state.movies);
  const series = useContentStore(state => state.series);
  
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [m3uFetchInitiated, setM3uFetchInitiated] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load M3U only once when profile is available
  useEffect(() => {
    if (!profile || m3uFetchInitiated) return;

    if (profile.m3u_url) {
      setM3uFetchInitiated(true);
      loadFromM3uUrl(profile.m3u_url).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [profile, loadFromM3uUrl, m3uFetchInitiated]);

  // Memoized curated lists - Only recalculate when data changes
  const turkishChannels = useMemo(() => {
    if (!liveChannels.length) return [];
    const priority = ['TRT 1', 'ATV', 'KANAL D', 'STAR', 'SHOW', 'TV8', 'NOW', 'FOX', 'BEYAZ', 'HALK'];
    
    return liveChannels.filter(c => {
        const name = c.name.toUpperCase();
        return priority.some(p => name.includes(p));
    }).slice(0, 10);
  }, [liveChannels]);

  const featuredMovies = useMemo(() => {
      if (!movies.length) return [];
      return [...movies]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10);
  }, [movies]);

  const featuredSeries = useMemo(() => {
      if (!series.length) return [];
      return [...series].slice(0, 10);
  }, [series]);

  // Memoized handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearchFocused(true);
  }, [setSearchQuery]);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setIsSearchFocused(false);
  }, [setSearchQuery]);

  const handleItemSelect = useCallback((item: any) => {
    setSelectedItem(item);
    setIsSearchFocused(false);
  }, [setSelectedItem]);

  // Loading Skeleton
  if ((loading || storeLoading) && !turkishChannels.length) {
     return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
           <div className="w-full max-w-2xl space-y-8 animate-pulse">
              <div className="h-16 bg-surface/50 rounded-full w-full" />
              <div className="space-y-4">
                  <div className="h-8 w-48 bg-surface/30 rounded" />
                  <div className="flex gap-4 overflow-hidden">
                      {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-40 w-64 bg-surface/30 rounded-xl flex-shrink-0" />
                      ))}
                  </div>
              </div>
           </div>
        </div>
     );
  }

  // No Content
  if (!loading && !storeLoading && !profile?.m3u_url) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <Header />
        <div className="max-w-2xl w-full bg-gradient-to-br from-zinc-900/90 to-black/90 border border-white/10 p-10 rounded-3xl shadow-2xl backdrop-blur-xl mt-20 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-[0_0_30px_rgba(229,9,20,0.2)]">
              <Tv size={40} className="text-primary" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
              Henüz Bir Paketiniz Yok
            </h2>
            
            <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-lg mx-auto">
               Binlerce film, dizi ve canlı kanalı izlemeye başlamak için hesabınıza bir yayın paketi tanımlamanız gerekmektedir.
             </p>
 
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <button 
                 onClick={() => window.location.href = '/profil?tab=plans'}
                 className="w-full sm:w-auto px-10 py-4 bg-primary hover:bg-primary-hover text-white font-black text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-primary/25 flex items-center justify-center gap-3 uppercase tracking-wide"
               >
                 <Play size={24} fill="currentColor" />
                 PAKETLERİ İNCELE & SATIN AL
               </button>
             </div>
 
             <p className="mt-8 text-xs text-gray-500 font-medium">
               Satın alım sonrası erişiminiz anında açılacaktır. <br/>
               Sorularınız için destek hattımıza ulaşabilirsiniz.
             </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 w-full pb-20 pt-24">
        
        {/* --- SECTION 1: SEARCH --- */}
        <div className="w-full max-w-4xl mx-auto px-4 mb-16 relative z-30" ref={searchContainerRef}>
            <div className="text-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Hoşgeldin</h1>
                <p className="text-gray-400 text-sm">Favori içeriklerini saniyeler içinde bul.</p>
            </div>

            <div className="relative group">
                <div className="relative flex items-center shadow-[0_0_30px_rgba(229,9,20,0.15)] rounded-2xl transition-shadow duration-300 group-focus-within:shadow-[0_0_50px_rgba(229,9,20,0.3)]">
                    <input 
                        type="text" 
                        placeholder="Film, Dizi veya Kanal Ara..." 
                        className={`w-full bg-surface border border-white/10 rounded-2xl py-5 pl-16 pr-14 text-white placeholder-gray-500 text-lg focus:outline-none focus:border-primary/50 transition-all ${isSearchFocused && searchQuery.length > 1 ? 'rounded-b-none border-b-0' : ''}`}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => setIsSearchFocused(true)}
                    />
                    <Search className="absolute left-6 text-primary" size={24} />
                    {searchQuery && (
                        <button 
                            onClick={handleSearchClear}
                            className="absolute right-5 text-gray-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* LIVE SEARCH RESULTS DROPDOWN */}
                <AnimatePresence>
                    {isSearchFocused && searchQuery.length > 1 && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 bg-[#1a1a1a] border border-white/10 border-t-0 rounded-b-2xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto z-50 custom-scrollbar"
                        >
                            {searchResults.length > 0 ? (
                                <div className="py-2">
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                                        En İyi Eşleşmeler ({searchResults.length})
                                    </div>
                                    {searchResults.slice(0, 10).map((item: any) => (
                                        <SearchResultItem 
                                            key={item.id} 
                                            item={item} 
                                            onSelect={handleItemSelect} 
                                        />
                                    ))}
                                    {searchResults.length > 10 && (
                                        <div className="px-4 py-3 text-center border-t border-white/10 bg-white/5">
                                            <button className="text-primary text-xs font-bold hover:underline flex items-center justify-center gap-1 mx-auto">
                                                TÜM SONUÇLARI GÖR <ChevronRight size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    "{searchQuery}" için sonuç bulunamadı.
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* --- SECTION 2: TV CHANNELS CAROUSEL --- */}
        {turkishChannels.length > 0 && (
            <div className="mb-12">
                <div className="px-4 md:px-12 mb-4 flex items-center gap-3">
                    <div className="w-1 h-6 bg-red-600 rounded-full" />
                    <h2 className="text-xl font-bold text-white tracking-wide">Öne Çıkan TV Kanalları</h2>
                </div>
                
                <div className="relative group px-4 md:px-12">
                     <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {turkishChannels.map((channel: any) => (
                            <ChannelCard 
                                key={channel.id} 
                                channel={channel} 
                                onSelect={handleItemSelect}
                            />
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* --- SECTION 3: MOVIES CAROUSEL --- */}
        {featuredMovies.length > 0 && (
            <div className="mb-12">
                <NetflixRow 
                    title="Öne Çıkan Filmler" 
                    movies={featuredMovies} 
                    isTop10={false}
                    onSelectMovie={handleItemSelect}
                />
            </div>
        )}

        {/* --- SECTION 4: SERIES CAROUSEL --- */}
        {featuredSeries.length > 0 && (
            <div className="mb-4">
                <NetflixRow 
                    title="Popüler Diziler" 
                    movies={featuredSeries} 
                    isTop10={false}
                    onSelectMovie={handleItemSelect}
                />
            </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[10px] text-zinc-600 border-t border-white/5 bg-background">
        <p>Flixify Pro &copy; 2026</p>
      </footer>

      {selectedItem && (
        <VideoPlayer
          content={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
});

// Memoized search result item
const SearchResultItem = memo(function SearchResultItem({ item, onSelect }: { item: any, onSelect: (item: any) => void }) {
  return (
    <div 
        onClick={() => onSelect(item)}
        className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0 text-left group"
    >
        <div className="w-10 h-14 bg-zinc-800 rounded overflow-hidden flex-shrink-0 shadow-sm relative">
            <img src={item.logo || item.poster} alt={item.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={12} className="text-white" fill="white" />
            </div>
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="text-white text-sm font-medium truncate group-hover:text-primary transition-colors">{item.name}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold uppercase ${
                    item.type === 'live' ? 'bg-red-900/40 text-red-400' : 'bg-blue-900/40 text-blue-400'
                }`}>
                    {item.type === 'live' ? 'Canlı' : item.type === 'movie' ? 'Film' : 'Dizi'}
                </span>
                {item.year && <span>{item.year}</span>}
            </div>
        </div>
    </div>
  );
});

// Memoized channel card for TV channels section
const ChannelCard = memo(function ChannelCard({ channel, onSelect }: { channel: any, onSelect: (item: any) => void }) {
  return (
    <div 
        onClick={() => onSelect(channel)}
        className="flex-none w-40 md:w-56 aspect-video bg-[#1a1a1a] border border-white/5 rounded-lg flex items-center justify-center p-4 snap-start cursor-pointer hover:border-red-600 hover:scale-105 transition-all duration-300 relative overflow-hidden group/card shadow-lg"
    >
        <img 
            src={channel.logo} 
            alt={channel.name} 
            className="max-h-12 md:max-h-16 max-w-full object-contain filter grayscale group-hover/card:grayscale-0 transition-all duration-300" 
            loading="lazy"
            decoding="async"
        />
        <div className="absolute top-2 right-2 flex gap-1">
            <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">CANLI</div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
            <span className="text-white text-xs font-semibold">{channel.name}</span>
        </div>
    </div>
  );
});

export default HomePage;
