import { useState } from 'react';
import { useContentStore } from '../store/useContentStore';
import { PlusCircle, Link, Type, Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddPlaylistModalProps {
    onClose: () => void;
}

export function AddPlaylistModal({ onClose }: AddPlaylistModalProps) {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { addPlaylist, parseAndCategorizeContent } = useContentStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!name || !url) {
            setError('Lütfen liste adı ve URL girin.');
            return;
        }

        setLoading(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            let content = '';

            try {
                // Direct fetch
                const response = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`Ağ hatası: Status ${response.status}`);
                }
                content = await response.text();
            } catch (fetchErr: any) {
                clearTimeout(timeoutId);

                if (fetchErr.name === 'AbortError') {
                    throw new Error('Bağlantı zaman aşımına uğradı.');
                }

                // Try proxy
                console.warn('Doğrudan istek başarısız, proxy deneniyor...');
                const proxyUrl = `http://45.63.40.225:3001/proxy?url=${encodeURIComponent(url)}`;
                
                const proxyController = new AbortController();
                const proxyTimeoutId = setTimeout(() => proxyController.abort(), 120000);

                try {
                    const proxyResponse = await fetch(proxyUrl, { signal: proxyController.signal });
                    clearTimeout(proxyTimeoutId);

                    if (proxyResponse.ok) {
                        content = await proxyResponse.text();
                    } else {
                        throw new Error('Proxy bağlantısı başarısız.');
                    }
                } catch (e) {
                    clearTimeout(proxyTimeoutId);
                    throw new Error('IPTV sunucusuna erişilemiyor. CORS kısıtlaması olabilir.');
                }
            }

            // Parse M3U
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
                    const channelName = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : '';

                    currentChannel = {
                        id: Math.random().toString(36).substring(2, 10),
                        name: channelName || 'Bilinmeyen Kanal',
                        logo: logoMatch ? logoMatch[1] : '',
                        group: groupMatch ? groupMatch[1] : 'Diğer',
                    };
                } else if (!line.startsWith('#')) {
                    if (currentChannel.name) {
                        channels.push({ ...currentChannel, url: line });
                        currentChannel = {};
                    }
                }
            });

            if (channels.length === 0) {
                throw new Error('Girilen bağlantıda geçerli IPTV kanalı bulunamadı.');
            }

            addPlaylist(name, url, channels);

            // Re-parse to categorize
            await parseAndCategorizeContent(content);

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err: any) {
            setError(err?.message || 'Liste eklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="p-4 bg-primary/20 rounded-2xl">
                        <PlusCircle size={40} className="text-primary" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Yeni Liste Ekle</h2>
                    <p className="text-foreground-muted text-sm mb-6">
                        M3U/M3U8 formatındaki IPTV listenizi ekleyin
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white flex items-center gap-2">
                                <Type size={16} className="text-foreground-muted" />
                                Liste Adı
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Örn: Ev Sineması"
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white 
                                         placeholder-foreground-dim focus:outline-none focus:border-primary/50 
                                         focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        {/* URL Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white flex items-center gap-2">
                                <Link size={16} className="text-foreground-muted" />
                                M3U URL
                            </label>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="http://example.com/playlist.m3u"
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white 
                                         placeholder-foreground-dim focus:outline-none focus:border-primary/50 
                                         focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                                >
                                    <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-400 text-sm">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Success Message */}
                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3"
                                >
                                    <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-green-400 text-sm">
                                        Liste başarıyla eklendi!
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl border border-border text-white 
                                         hover:bg-surface-hover transition-colors font-medium"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={loading || success}
                                className="flex-[2] py-3 px-4 rounded-xl bg-primary text-white font-medium
                                         hover:bg-primary-hover transition-all flex items-center justify-center gap-2
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Yükleniyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle size={20} />
                                        <span>Listeyi Ekle</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Info */}
                    <div className="mt-6 pt-6 border-t border-border">
                        <p className="text-foreground-dim text-xs text-center">
                            Desteklenen formatlar: M3U, M3U8
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default AddPlaylistModal;
