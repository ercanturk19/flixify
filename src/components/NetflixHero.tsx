import { useState } from 'react';
import { Play, Info, Volume2, VolumeX, Plus, Check, ChevronDown } from 'lucide-react';
import { ContentItem } from '../store/useContentStore';
import { motion, AnimatePresence } from 'framer-motion';

interface NetflixHeroProps {
  movie: ContentItem | any;
}

export function NetflixHero({ movie }: NetflixHeroProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isInList, setIsInList] = useState(false);
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="relative w-full h-[95vh] md:h-[100vh] overflow-hidden">
      {/* Backdrop Image with Gradient */}
      <div className="absolute inset-0">
        <img
          src={movie.backdrop}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        {/* Netflix-style gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-4 md:px-16 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          {/* Logo or Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-4 drop-shadow-2xl tracking-tight">
            {movie.title}
          </h1>

          {/* Metadata */}
          <div className="flex items-center gap-3 mb-4 text-sm md:text-base">
            <span className="text-green-400 font-bold">{movie.match}% Eşleşme</span>
            <span className="text-foreground-muted">{movie.year}</span>
            <span className="px-2 py-0.5 border border-foreground-muted/50 text-foreground-muted text-xs">{movie.duration}</span>
            <span className="px-2 py-0.5 border border-foreground-muted/50 text-foreground-muted text-xs">HD</span>
          </div>

          {/* Genres */}
          <div className="flex items-center gap-2 mb-6">
            {movie.genres?.map((genre: string, idx: number) => (
              <span key={genre} className="text-white/90">
                {genre}
                {idx < (movie.genres?.length || 0) - 1 && <span className="mx-2 text-white/40">•</span>}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-lg text-white/90 mb-8 line-clamp-3 drop-shadow-lg">
            {movie.description}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-3 px-8 py-3 bg-white text-black font-bold rounded hover:bg-white/90 transition-colors">
              <Play size={28} fill="currentColor" />
              <span className="text-lg">Oynat</span>
            </button>

            <button
              onClick={() => setShowMore(true)}
              className="flex items-center gap-3 px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-bold rounded hover:bg-white/30 transition-colors"
            >
              <Info size={28} />
              <span className="text-lg">Daha Fazla Bilgi</span>
            </button>

            <button
              onClick={() => setIsInList(!isInList)}
              className={`p-3 rounded-full border-2 transition-all ${isInList ? 'bg-white border-white text-black' : 'border-white/50 text-white hover:border-white'
                }`}
            >
              {isInList ? <Check size={24} /> : <Plus size={24} />}
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 rounded-full border-2 border-white/50 text-white hover:border-white transition-colors"
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background via-background/90 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-background" />

      {/* More Info Modal */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowMore(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface rounded-2xl overflow-hidden max-w-3xl w-full"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header with Image */}
              <div className="relative h-64 md:h-80">
                <img src={movie.backdrop} alt={movie.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                <button
                  onClick={() => setShowMore(false)}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <ChevronDown size={24} className="rotate-180" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-4xl font-bold text-white mb-2">{movie.title}</h2>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-400 font-bold">{movie.match}% Eşleşme</span>
                    <span className="text-foreground-muted">{movie.year}</span>
                    <span className="px-2 py-0.5 border border-foreground-muted/50 text-foreground-muted">{movie.duration}</span>
                    <span className="px-2 py-0.5 border border-foreground-muted/50 text-foreground-muted">HD</span>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <button className="flex items-center gap-2 px-6 py-2 bg-white text-black font-bold rounded hover:bg-white/90">
                    <Play size={20} fill="currentColor" />
                    Oynat
                  </button>
                  <button className="p-2 border-2 border-white/50 rounded-full text-white hover:border-white">
                    <Plus size={20} />
                  </button>
                </div>

                <p className="text-white/90 text-lg mb-4">{movie.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-foreground-muted">Tür:</span>{' '}
                    <span className="text-white">{movie.genres?.join(', ') || (movie as any).group || 'Sinema'}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">Yıl:</span>{' '}
                    <span className="text-white">{movie.year}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">Süre:</span>{' '}
                    <span className="text-white">{movie.duration}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">IMDB:</span>{' '}
                    <span className="text-white">{movie.rating}/10</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NetflixHero;
