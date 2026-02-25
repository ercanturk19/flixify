import { useEffect, useState } from 'react';
import { Play, Info, Volume2, VolumeX, Plus, Check } from 'lucide-react';
import { ContentItem, useContentStore } from '../store/useContentStore';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroProps {
    item?: ContentItem | null;
}

export function Hero({ item }: HeroProps) {
    const { featuredContent, setSelectedItem } = useContentStore();
    const [isMuted, setIsMuted] = useState(true);
    const [isInList, setIsInList] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const content = item || featuredContent;
    
    useEffect(() => {
        if (content) {
            setIsLoading(true);
            // Simulate loading for backdrop
            const timer = setTimeout(() => setIsLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [content?.id]);

    if (!content) {
        return (
            <div className="relative w-full h-[70vh] md:h-[85vh] bg-background flex items-center justify-center">
                <div className="animate-pulse text-foreground-muted">Yükleniyor...</div>
            </div>
        );
    }

    const handlePlay = () => {
        setSelectedItem(content);
    };

    const handleMoreInfo = () => {
        // Could open a modal with more details
        setSelectedItem(content);
    };

    const toggleList = () => {
        setIsInList(!isInList);
    };

    return (
        <div className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden">
            {/* Background Image/Video */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={content.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0"
                >
                    {/* Backdrop Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: `url(${content.backdrop || content.logo || '/placeholder-backdrop.jpg'})`,
                        }}
                    >
                        {/* Loading skeleton */}
                        {isLoading && (
                            <div className="absolute inset-0 bg-surface animate-pulse" />
                        )}
                    </div>
                    
                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/30 to-transparent" />
                    
                    {/* Vignette effect */}
                    <div className="absolute inset-0 bg-radial-gradient pointer-events-none" 
                         style={{
                             background: 'radial-gradient(ellipse at center, transparent 0%, rgba(20,20,20,0.4) 100%)'
                         }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-16 pb-24 md:pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="max-w-2xl"
                >
                    {/* Type Badge */}
                    <div className="flex items-center gap-3 mb-4">
                        {content.type === 'live' && (
                            <span className="px-3 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded">
                                CANLI TV
                            </span>
                        )}
                        {content.type === 'movie' && (
                            <span className="px-3 py-1 bg-accent text-black text-xs font-bold uppercase tracking-wider rounded">
                                FİLM
                            </span>
                        )}
                        {content.type === 'series' && (
                            <span className="px-3 py-1 bg-secondary text-white text-xs font-bold uppercase tracking-wider rounded">
                                DİZİ
                            </span>
                        )}
                        {content.rating && (
                            <span className="flex items-center gap-1 text-accent text-sm font-semibold">
                                <span className="text-yellow-400">★</span> {content.rating.toFixed(1)}
                            </span>
                        )}
                        {content.year && (
                            <span className="text-foreground-muted text-sm">{content.year}</span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight text-shadow-lg">
                        {content.name}
                    </h1>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-4 text-sm text-foreground-muted mb-6">
                        {content.genres?.slice(0, 3).map((genre, idx) => (
                            <span key={idx} className="flex items-center gap-2">
                                {idx > 0 && <span className="w-1 h-1 bg-foreground-dim rounded-full" />}
                                {genre}
                            </span>
                        ))}
                        {content.duration && (
                            <>
                                <span className="w-1 h-1 bg-foreground-dim rounded-full" />
                                <span>{content.duration}</span>
                            </>
                        )}
                    </div>

                    {/* Description */}
                    {content.description && (
                        <p className="text-lg text-foreground-muted mb-8 line-clamp-3 max-w-xl">
                            {content.description}
                        </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePlay}
                            className="flex items-center gap-2 px-8 py-3 bg-white text-black font-semibold rounded-md hover:bg-white/90 transition-all active:scale-95"
                        >
                            <Play size={24} fill="currentColor" />
                            <span>Oynat</span>
                        </button>
                        
                        <button
                            onClick={handleMoreInfo}
                            className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-md hover:bg-white/30 transition-all active:scale-95"
                        >
                            <Info size={24} />
                            <span>Daha Fazla Bilgi</span>
                        </button>
                        
                        <button
                            onClick={toggleList}
                            className={`p-3 rounded-full border-2 transition-all ${
                                isInList
                                    ? 'bg-white border-white text-black'
                                    : 'border-white/50 text-white hover:border-white'
                            }`}
                        >
                            {isInList ? <Check size={24} /> : <Plus size={24} />}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Age Rating & Mute */}
            <div className="absolute bottom-24 md:bottom-32 right-4 md:right-16 flex items-center gap-4">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-3 rounded-full border-2 border-white/50 text-white hover:border-white hover:bg-white/10 transition-all"
                >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                
                <div className="px-3 py-1 border-l-4 border-white/80 bg-black/40 text-white text-sm font-medium">
                    13+
                </div>
            </div>

            {/* Bottom Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </div>
    );
}

export default Hero;
