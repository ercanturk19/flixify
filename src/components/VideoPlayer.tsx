import { useEffect, useRef, useState, useCallback, memo } from 'react';
import Hls from 'hls.js';
import {
    Play, Pause, Maximize, Minimize, Volume2, VolumeX,
    Loader2, X, SkipBack, Settings, PictureInPicture2,
    AlertCircle
} from 'lucide-react';
import { ContentItem } from '../store/useContentStore';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPlayerProps {
    content: ContentItem;
    onClose: () => void;
}

// Memoized player to prevent re-renders
export const VideoPlayer = memo(function VideoPlayer({ content, onClose }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showControls, setShowControls] = useState(true);
    const [progress, setProgress] = useState(0);
    const [buffered, setBuffered] = useState(0);

    // Cleanup HLS on unmount
    useEffect(() => {
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, []);

    // Setup player when content changes
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !content.url) return;

        let isComponentMounted = true;

        // Cleanup previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        setIsLoading(true);
        setError('');

        const getPlayableUrl = (url: string): string => {
            if (url.match(/\/live\/.*\/\d+\.ts$/)) {
                return url.replace(/\.ts$/, '.m3u8');
            }
            return url;
        };

        const startPlayback = () => {
            video.play().catch(e => {
                console.warn("Autoplay blocked:", e);
                setIsPlaying(false);
            });
        };

        const setupPlayer = (streamUrl: string) => {
            if (!isComponentMounted) return;
            const playableUrl = getPlayableUrl(streamUrl);

            if (Hls.isSupported() && playableUrl.includes('.m3u8')) {
                hlsRef.current = new Hls({
                    maxBufferLength: 30,
                    liveSyncDurationCount: 3,
                    enableWorker: true,
                    debug: false,
                    // Performance optimizations
                    maxMaxBufferLength: 600,
                    liveMaxLatencyDurationCount: 10,
                });

                hlsRef.current.loadSource(playableUrl);
                hlsRef.current.attachMedia(video);

                hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (isComponentMounted) {
                        setIsLoading(false);
                        startPlayback();
                    }
                });

                hlsRef.current.on(Hls.Events.ERROR, (_event, data) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.warn("HLS Network Error", data);
                                hlsRef.current?.destroy();
                                hlsRef.current = null;
                                video.src = streamUrl;
                                video.load();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hlsRef.current?.recoverMediaError();
                                break;
                            default:
                                hlsRef.current?.destroy();
                                setError('Yayın oynatılamıyor.');
                                setIsLoading(false);
                        }
                    }
                });
            } else {
                video.src = playableUrl;
                video.load();

                video.onloadeddata = () => {
                    if (isComponentMounted) {
                        setIsLoading(false);
                        startPlayback();
                    }
                };

                video.onerror = () => {
                    setError('Yayın oynatılamadı.');
                    setIsLoading(false);
                };
            }
        };

        const initStream = async () => {
            try {
                const originalUrl = content.url!;

                if (content.type === 'live') {
                    const playableUrl = getPlayableUrl(originalUrl);
                    setupPlayer(playableUrl);
                } else {
                    setupPlayer(originalUrl);
                }
            } catch (err: any) {
                if (isComponentMounted) {
                    setError(`Bağlantı hatası: ${err.message}`);
                    setIsLoading(false);
                }
            }
        };

        initStream();

        // Event listeners
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleWaiting = () => setIsLoading(true);
        const handlePlaying = () => setIsLoading(false);
        const handleTimeUpdate = () => {
            if (video.duration) {
                setProgress((video.currentTime / video.duration) * 100);
            }
        };
        const handleProgress = () => {
            if (video.buffered.length > 0) {
                setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
            }
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('progress', handleProgress);

        return () => {
            isComponentMounted = false;
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('playing', handlePlaying);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('progress', handleProgress);
        };
    }, [content.url, content.type]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isFullscreen) {
                    document.exitFullscreen();
                } else {
                    onClose();
                }
            } else if (e.key === ' ') {
                e.preventDefault();
                togglePlay();
            } else if (e.key === 'f') {
                toggleFullscreen();
            } else if (e.key === 'm') {
                toggleMute();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen, onClose]);

    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
        }
    }, [isPlaying]);

    const toggleMute = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    }, [isMuted]);

    const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            setIsMuted(val === 0);
        }
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Fullscreen error: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    const handleMouseMove = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    }, [isPlaying]);

    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setProgress(val);
        if (videoRef.current && videoRef.current.duration) {
            videoRef.current.currentTime = (val / 100) * videoRef.current.duration;
        }
    }, []);

    const formatTime = (seconds: number): string => {
        if (!isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onClick={handleMouseMove}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                className="w-full h-full object-contain bg-black"
                onClick={togglePlay}
                playsInline
                crossOrigin="anonymous"
            />

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && !error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/60"
                    >
                        <Loader2 size={56} className="text-primary animate-spin mb-4" />
                        <p className="text-white/80 text-lg">Yükleniyor...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Overlay */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/90"
                    >
                        <div className="text-center max-w-md px-6">
                            <AlertCircle size={64} className="text-primary mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Oynatma Hatası</h2>
                            <p className="text-foreground-muted mb-6">{error}</p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                                >
                                    Yeniden Dene
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 bg-surface text-white rounded-lg hover:bg-surface-hover transition-colors"
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Controls */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
                className="absolute top-0 inset-x-0 p-4 md:p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"
                style={{ pointerEvents: showControls ? 'auto' : 'none' }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <div>
                            <h2 className="text-white font-semibold text-lg">{content.name}</h2>
                            {content.group && (
                                <p className="text-white/60 text-sm">{content.group}</p>
                            )}
                        </div>
                    </div>

                    {content.type === 'live' && (
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-primary/90 text-white text-sm font-semibold rounded-full">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            CANLI
                        </span>
                    )}
                </div>
            </motion.div>

            {/* Bottom Controls */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
                className="absolute bottom-0 inset-x-0 p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none"
                style={{ pointerEvents: showControls ? 'auto' : 'none' }}
            >
                {/* Progress Bar */}
                {content.type !== 'live' && (
                    <div className="mb-4">
                        <div className="relative h-1.5 bg-white/20 rounded-full overflow-hidden group cursor-pointer">
                            <div
                                className="absolute inset-y-0 left-0 bg-white/40 rounded-full"
                                style={{ width: `${buffered}%` }}
                            />
                            <div
                                className="absolute inset-y-0 left-0 bg-primary rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                onChange={handleSeek}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>
                )}

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={togglePlay}
                            className="p-3 rounded-full bg-white text-black hover:scale-110 transition-transform"
                        >
                            {isPlaying ? (
                                <Pause size={24} fill="currentColor" />
                            ) : (
                                <Play size={24} fill="currentColor" className="ml-0.5" />
                            )}
                        </button>

                        <button className="p-2 text-white/70 hover:text-white transition-colors">
                            <SkipBack size={20} />
                        </button>

                        <div className="flex items-center gap-2 group">
                            <button
                                onClick={toggleMute}
                                className="p-2 text-white hover:text-primary transition-colors"
                            >
                                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-0 group-hover:w-24 opacity-0 group-hover:opacity-100 transition-all duration-300 accent-primary"
                            />
                        </div>

                        {content.type !== 'live' && videoRef.current && (
                            <span className="text-white/80 text-sm">
                                {formatTime(videoRef.current.currentTime)} / {formatTime(videoRef.current.duration)}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="p-2 text-white/70 hover:text-white transition-colors">
                            <Settings size={20} />
                        </button>
                        <button className="p-2 text-white/70 hover:text-white transition-colors">
                            <PictureInPicture2 size={20} />
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 text-white hover:text-primary transition-colors"
                        >
                            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
});

export default VideoPlayer;
