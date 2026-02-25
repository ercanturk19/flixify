import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Plus, Star, ShieldCheck, Zap, Tv, CheckCircle } from 'lucide-react';

const CHANNELS = ['ESPN+', 'hulu', 'HBO max', 'DAZN', 'TNT', 'Paramount+', 'FOX', '24KITCHEN', 'EUROSPORT', 'NLZIET'];
const SPORTS = ['LaLiga', 'Premier League', 'Serie A', 'BUNDESLIGA', 'F1', 'CHAMPIONS LEAGUE', 'MotoGP', 'UFC'];

export function LandingPage() {
    // Pazarlama (Satış) sayfası olduğu için kullanıcı m3u logolarından bağımsız her zaman en yüksek kaliteli afişler gösterilir
    const movies = [
        { name: 'Oppenheimer', logo: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg' },
        { name: 'The Dark Knight', logo: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
        { name: 'Inception', logo: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg' },
        { name: 'Avatar', logo: 'https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg' },
        { name: 'Joker', logo: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg' },
        { name: 'Spider-Man', logo: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg' },
        { name: 'The Matrix', logo: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg' }
    ];
    // Spor odaklı devasa bir stadyum Hero arka planı
    const heroBg = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=3540&auto=format&fit=crop';


    return (
        <div className="min-h-screen bg-background text-white font-sans overflow-x-hidden selection:bg-primary/30">

            {/* Navbar - Flixify Tarzı */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-background/95 backdrop-blur-md border-b border-border">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
                    <Tv size={28} className="text-primary" />
                    <span className="text-xl md:text-2xl font-bold text-white tracking-tight">
                        FLIXIFY <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded ml-1 align-top tracking-normal font-bold">PRO</span>
                    </span>
                </Link>

                {/* Flixify Menüsü */}
                <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-300">
                    <Link to="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
                    <Link to="/filmler" className="hover:text-white transition-colors">Filmler</Link>
                    <Link to="/" className="hover:text-white transition-colors">Diziler</Link>
                    <Link to="/canli-tv" className="hover:text-white transition-colors">Canlı TV</Link>
                </div>

                {/* CTA Butonlar */}
                <div className="flex items-center gap-6">
                    <Link to="/giris-yap" className="text-gray-300 hover:text-white transition-colors text-sm font-semibold">
                        Giriş Yap
                    </Link>
                    <Link to="/kayit-ol" className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-md font-semibold text-sm transition-all shadow-lg shadow-primary/30">
                        Hesap Oluştur
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center px-6 md:px-16 pt-20">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-black/20 to-transparent z-10" />
                    {heroBg ? (
                        <img src={heroBg} alt="Hero" className="w-full h-full object-cover opacity-80" />
                    ) : (
                        <div className="w-full h-full bg-surface" />
                    )}
                </div>

                <div className="relative z-20 max-w-3xl mt-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold font-sans tracking-tight leading-[1.1] mb-6 block"
                    >
                        Sınırsız Eğlence <br /> Tek Bir Yerde.
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-300 mb-6"
                    >
                        <span className="flex items-center gap-1 text-primary"><Star size={16} fill="currentColor" /> 9.8</span>
                        <span>·</span>
                        <span>2026</span>
                        <span>·</span>
                        <span>Her Gün Güncel İçerik</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded text-xs border border-border">4K UHD</span>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-400 max-w-xl text-sm leading-relaxed mb-10"
                    >
                        Favori TV Şovlarınızı, Filmlerinizi, Canlı Yayınları, Haber Kanallarını, Spor Müsabakalarını, Canlı Etkinlikleri ve Çocuklarınız İçin Çizgi Filmleri 4K HD Kalitesinde donmadan izleyin.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-4"
                    >
                        <Link to="/kayit-ol" className="flex items-center gap-2 bg-primary hover:bg-primary-hover hover:scale-105 transition-transform text-white px-8 py-3.5 rounded-lg font-bold shadow-lg shadow-primary/20">
                            Hesap Oluştur <Play size={18} fill="currentColor" />
                        </Link>
                        <button className="w-12 h-12 flex items-center justify-center bg-surface hover:bg-surface-hover border border-border rounded-lg transition-colors">
                            <Plus size={24} />
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Marquee 1 */}
            <div className="border-y border-border bg-surface py-6 overflow-hidden flex whitespace-nowrap relative">
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-surface to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-surface to-transparent z-10" />
                <div className="animate-marquee flex gap-16 px-8 items-center opacity-70">
                    {[...CHANNELS, ...CHANNELS].map((ch, i) => (
                        <span key={i} className="text-xl md:text-2xl font-black italic tracking-tighter text-gray-400">{ch}</span>
                    ))}
                </div>
            </div>

            {/* Movies Row */}
            <section className="py-16 px-6 md:px-12 bg-background">
                <div className="text-center mb-10">
                    <h2 className="text-sm md:text-lg font-bold tracking-widest uppercase mb-4 text-white">En Güncel Filmler ve Diziler</h2>
                    <p className="text-xs text-gray-400 max-w-3xl mx-auto">
                        100.000'den fazla içerik düzenli olarak güncellenir ve yüksek kalitededir. Ekstra talepleriniz her zaman dikkate alınır. Mısırınızı patlatın ve arkanıza yaslanın!
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {movies.map((movie, idx) => (
                        <div key={idx} onClick={() => { }} className="aspect-[2/3] relative rounded overflow-hidden group cursor-pointer bg-surface border border-border">
                            <img src={movie.logo} alt={movie.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play size={32} fill="white" className="text-white drop-shadow-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Marquee 2 */}
            <div className="border-y border-border bg-surface py-6 overflow-hidden flex whitespace-nowrap relative">
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-surface to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-surface to-transparent z-10" />
                <div className="animate-marquee flex gap-16 px-8 items-center opacity-70" style={{ animationDirection: 'reverse' }}>
                    {[...SPORTS, ...SPORTS].map((ch, i) => (
                        <span key={i} className="text-2xl font-black uppercase tracking-tighter text-gray-400 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">🏆</span> {ch}
                        </span>
                    ))}
                </div>
            </div>
            <div className="text-center py-4 bg-surface border-b border-border">
                <p className="text-xs text-gray-400">Yüksek Çözünürlüklü 4K Spor Kanallarını Keşfedin</p>
            </div>

            {/* Pricing / Features Section */}
            <section className="bg-[#0a0a0a] py-20 px-6 md:px-12 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden border-b border-border">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/20 blur-[100px] rounded-full" />

                <div className="lg:w-1/2 relative z-10 text-center lg:text-left">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">YENİ NESİL YAYIN DENEYİMİYLE TANIŞIN!</h2>
                    <p className="text-gray-300 mb-8 max-w-lg mx-auto lg:mx-0">
                        Amerika, Avrupa ve Türkiye Seçkin Paketleri Bir Arada <br /><br />
                        Gizli kalmış efsane diziler, popüler reality şovlar, 4K Filmler ve Diziler, 20.000+ TV Kanalı ve ikonik favorilerle büyüyen kütüphanemizde sıradaki tutkunuzu bulun.
                    </p>
                    <div className="mb-8">
                        <span className="text-2xl md:text-4xl font-black text-white">AYLIK SADECE 200 TL'DEN BAŞLAYAN FİYATLARLA.</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                        <Link to="/kayit-ol" className="bg-primary hover:bg-primary-hover text-white px-8 py-3 font-bold rounded shadow-lg shadow-primary/20 uppercase tracking-wider text-sm transition-colors block text-center">
                            Hesap Oluştur
                        </Link>
                        <button className="bg-surface hover:bg-surface-hover border border-border text-white px-8 py-3 font-bold rounded shadow-lg uppercase tracking-wider text-sm transition-colors">
                            Kanal Listesi
                        </button>
                    </div>
                </div>

                <div className="lg:w-1/2 w-full relative z-10 flex justify-center">
                    {/* TV Mockup via CSS */}
                    <div className="w-full max-w-xl aspect-video bg-surface rounded-xl border-[8px] border-black shadow-2xl overflow-hidden relative flex">

                        {/* Sidebar */}
                        <div className="w-20 bg-black/80 border-r border-border flex flex-col py-6 items-center gap-6">
                            <div className="flex flex-col items-center gap-1 text-gray-400 hover:text-white cursor-pointer"><Tv size={24} /><span className="text-[9px]">CANLI TV</span></div>
                            <div className="flex flex-col items-center gap-1 text-white cursor-pointer"><Play size={24} fill="currentColor" /><span className="text-[9px]">FİLMLER</span></div>
                            <div className="flex flex-col items-center gap-1 text-gray-400 hover:text-white cursor-pointer"><Play size={24} /><span className="text-[9px]">DİZİLER</span></div>
                        </div>

                        {/* Content Grid */}
                        <div className="flex-1 p-4 grid grid-cols-4 grid-rows-3 gap-2 bg-background">
                            {/* Kanal Logoları Fake */}
                            <div className="bg-white rounded flex items-center justify-center p-2"><span className="text-blue-600 font-bold text-lg leading-none">1<br /><span className="text-[8px]">Das Erste</span></span></div>
                            <div className="bg-orange-500 rounded flex items-center justify-center"><span className="text-white font-bold text-xl">2DF</span></div>
                            <div className="bg-red-600 rounded flex items-center justify-center"><span className="text-white font-black text-xl">RTL</span></div>
                            <div className="bg-primary rounded flex items-center justify-center text-white font-bold text-2xl">Tv8</div>

                            {/* Posters Fake */}
                            {movies.slice(0, 4).map((m, i) => (
                                <div key={i} className="bg-surface rounded overflow-hidden border border-border">
                                    <img src={m.logo} className="w-full h-full object-cover" alt="" />
                                </div>
                            ))}

                            {/* Diğer Partnerler */}
                            <div className="bg-black border border-border rounded flex items-center justify-center"><span className="text-white font-black">DAZN</span></div>
                            <div className="bg-blue-600 rounded flex items-center justify-center"><span className="text-white font-black text-xl">EXXEN</span></div>
                            <div className="bg-black border border-border rounded flex items-center justify-center text-xs"><span className="text-blue-500">blutv</span></div>
                            <div className="bg-black border border-border rounded flex items-center justify-center"><span className="text-primary font-bold text-sm">NETFLIX</span></div>
                        </div>

                        {/* Video Player overlay effect */}
                        <div className="absolute bottom-2 left-20 right-2 px-4 flex items-center justify-between pointer-events-none opacity-50">
                            <div className="h-1 bg-white/20 w-48 rounded overflow-hidden"><div className="w-1/3 h-full bg-primary" /></div>
                            <div className="flex gap-2 text-white">
                                <div className="w-2 h-2 rounded bg-white/50" />
                                <div className="w-2 h-2 rounded bg-white/50" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Info Blocks */}
            <section className="py-20 bg-background">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-6">
                            <ShieldCheck size={32} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white">Güvenli Ödeme</h3>
                        <p className="text-gray-400 text-sm">Karmaşık faturalandırma süreçleri yok, tek tıkla anında abonelik.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-6">
                            <Zap size={32} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white">Anında Aktivasyon</h3>
                        <p className="text-gray-400 text-sm">Abonelik ödemesinin ardından anında otomatik aktivasyon imkanı.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-6">
                            <Tv size={32} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white">Kesintisiz Yayın</h3>
                        <p className="text-gray-400 text-sm">SD, HD, UHD ve 4K kalitesinde donmayan en kurumsal yayın altyapısı.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-6">
                            <CheckCircle size={32} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white">7/24 Destek</h3>
                        <p className="text-gray-400 text-sm">Aboneliğiniz boyunca Türkçe ve İngilizce 7/24 kesintisiz müşteri hizmetleri.</p>
                    </div>
                </div>
            </section>

            {/* Bottom Banner */}
            <section className="relative h-64 md:h-80 flex items-center justify-center border-t border-border">
                <div className="absolute inset-0 z-0 bg-black/60">
                    {heroBg ? (
                        <img src={heroBg} alt="Background" className="w-full h-full object-cover mix-blend-overlay opacity-30" />
                    ) : (
                        <div className="w-full h-full bg-background" />
                    )}
                </div>
                <div className="relative z-10 text-center">
                    <p className="text-sm font-bold tracking-[0.2em] mb-2 uppercase opacity-80 text-primary">Sıradaki Maceran</p>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-widest uppercase mb-4 drop-shadow-lg text-white">Yabancı Diziler</h2>
                    <p className="tracking-[0.3em] font-light text-sm md:text-base text-gray-300">EN YENİ FİLMLER VE DİZİLER BİR ARADA</p>
                </div>
            </section>

            {/* Footer Minimal */}
            <footer className="bg-background py-8 border-t border-border text-center">
                <div className="flex items-center justify-center gap-2 text-primary mb-4 opacity-70">
                    <Tv size={20} className="text-primary" />
                    <span className="text-lg font-bold text-white tracking-tight">
                        FLIXIFY
                    </span>
                </div>
                <p className="text-gray-500 text-sm">© {(new Date()).getFullYear()} Flixify. Tüm hakları saklıdır.</p>
                <Link to="/app" className="text-xs text-primary/70 hover:text-primary mt-4 inline-block underline">Müşteri Paneline (Uygulamaya) Geçiş Yap</Link>
            </footer>

        </div>
    );
}

