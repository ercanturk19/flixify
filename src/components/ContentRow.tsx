import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, Info } from 'lucide-react';
import { ContentItem, useContentStore } from '../store/useContentStore';
import { motion } from 'framer-motion';

interface ContentRowProps {
    title: string;
    items: ContentItem[];
    type?: 'channel' | 'poster';
}

export function ContentRow({ title, items, type = 'poster' }: ContentRowProps) {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const { setSelectedItem } = useContentStore();

    if (!items || items.length === 0) return null;

    const scroll = (direction: 'left' | 'right') => {
        if (!sliderRef.current) return;
        
        const scrollAmount = type === 'channel' ? 300 : 400;
        const newScrollLeft = sliderRef.current.scrollLeft + 
            (direction === 'left' ? -scrollAmount : scrollAmount);
        
        sliderRef.current.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth',
        });
    };

    const handleScroll = () => {
        if (!sliderRef.current) return;
        
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    return (
        <div className="relative mb-8 md:mb-12 group/row">
            {/* Title */}
            <div className="flex items-center justify-between px-4 md:px-16 mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-white flex items-center gap-2 group cursor-pointer">
                    {title}
                    <ChevronRight 
                        size={20} 
                        className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary"
                    />
                </h2>
                <span className="text-sm text-foreground-muted">
                    {items.length} içerik
                </span>
            </div>

            {/* Slider Container */}
            <div className="relative">
                {/* Left Arrow */}
                {showLeftArrow && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 md:left-12 top-0 bottom-0 z-20 w-16 md:w-24 
                                   bg-gradient-to-r from-background to-transparent
                                   flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
                    >
                        <div className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
                            <ChevronLeft size={28} />
                        </div>
                    </button>
                )}

                {/* Right Arrow */}
                {showRightArrow && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 md:right-12 top-0 bottom-0 z-20 w-16 md:w-24 
                                   bg-gradient-to-l from-background to-transparent
                                   flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
                    >
                        <div className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
                            <ChevronRight size={28} />
                        </div>
                    </button>
                )}

                {/* Slider */}
                <div
                    ref={sliderRef}
                    onScroll={handleScroll}
                    className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-16 py-4"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {items.map((item, index) => (
                        <ContentCard
                            key={item.id}
                            item={item}
                            type={type}
                            index={index}
                            onClick={() => setSelectedItem(item)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

interface ContentCardProps {
    item: ContentItem;
    type: 'channel' | 'poster';
    index: number;
    onClick: () => void;
}

function ContentCard({ item, type, index, onClick }: ContentCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    if (type === 'channel') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={onClick}
                className="relative flex-shrink-0 w-40 md:w-52 aspect-video rounded-lg overflow-hidden
                           bg-surface cursor-pointer group"
                style={{ scrollSnapAlign: 'start' }}
            >
                {/* Image */}
                <div className="absolute inset-0 bg-surface">
                    {item.logo && (
                        <img
                            src={item.logo}
                            alt={item.name}
                            loading="lazy"
                            onLoad={() => setImageLoaded(true)}
                            className={`w-full h-full object-contain p-3 transition-opacity duration-300 ${
                                imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        />
                    )}
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-foreground-dim text-xs text-center px-2">
                                {item.name.slice(0, 20)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Live Badge */}
                {item.isLive && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded">
                        CANLI
                    </div>
                )}

                {/* Hover Overlay */}
                <div className={`absolute inset-0 bg-black/80 flex flex-col items-center justify-center
                                transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <button className="p-3 rounded-full bg-primary text-white mb-2 hover:scale-110 transition-transform">
                        <Play size={20} fill="currentColor" />
                    </button>
                    <span className="text-white text-xs font-medium text-center px-2 line-clamp-2">
                        {item.name}
                    </span>
                    {item.group && (
                        <span className="text-foreground-muted text-[10px] mt-1">
                            {item.group}
                        </span>
                    )}
                </div>

                {/* Bottom Info Bar (always visible) */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                    <p className="text-white text-xs font-medium truncate">
                        {item.name}
                    </p>
                </div>
            </motion.div>
        );
    }

    // Poster card (for movies/series)
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
            className="relative flex-shrink-0 w-32 md:w-48 aspect-[2/3] rounded-lg overflow-hidden
                       bg-surface cursor-pointer group"
            style={{ scrollSnapAlign: 'start' }}
        >
            {/* Image */}
            <div className="absolute inset-0 bg-surface">
                {(item.poster || item.logo) ? (
                    <img
                        src={item.poster || item.logo}
                        alt={item.name}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full h-full object-cover transition-all duration-500 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                        } ${isHovered ? 'scale-110' : 'scale-100'}`}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-foreground-dim text-xs text-center px-2">
                            {item.name.slice(0, 20)}
                        </span>
                    </div>
                )}
                {!imageLoaded && (item.poster || item.logo) && (
                    <div className="absolute inset-0 bg-surface animate-pulse" />
                )}
            </div>

            {/* Rating Badge */}
            {item.rating && item.rating > 0 && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-accent text-black text-[10px] font-bold rounded flex items-center gap-0.5">
                    <span>★</span>
                    <span>{item.rating.toFixed(1)}</span>
                </div>
            )}

            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent
                            transition-opacity duration-300 ${isHovered ? 'opacity-90' : 'opacity-0'}`} />

            {/* Hover Content */}
            <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 ${
                isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
                {/* Action Buttons */}
                <div className="flex items-center gap-2 mb-2">
                    <button className="p-2 rounded-full bg-white text-black hover:scale-110 transition-transform">
                        <Play size={16} fill="currentColor" />
                    </button>
                    <button className="p-2 rounded-full border border-white/50 text-white hover:border-white transition-colors">
                        <Plus size={16} />
                    </button>
                    <button className="p-2 rounded-full border border-white/50 text-white hover:border-white transition-colors ml-auto">
                        <Info size={16} />
                    </button>
                </div>

                {/* Title */}
                <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">
                    {item.name}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-2 text-[10px] text-foreground-muted">
                    {item.year && <span>{item.year}</span>}
                    {item.genres && item.genres.length > 0 && (
                        <>
                            <span className="w-0.5 h-0.5 bg-foreground-muted rounded-full" />
                            <span className="truncate max-w-[100px]">{item.genres[0]}</span>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default ContentRow;
