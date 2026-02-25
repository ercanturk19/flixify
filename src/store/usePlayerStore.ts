import { create } from 'zustand';
import { M3UChannel, M3UPlaylist } from '../lib/m3uParser';

interface PlayerState {
    playlists: M3UPlaylist[];
    activePlaylist: M3UPlaylist | null;
    activeChannel: M3UChannel | null;

    addPlaylist: (playlist: M3UPlaylist) => void;
    removePlaylist: (url: string) => void;
    setActivePlaylist: (url: string) => void;
    setActiveChannel: (channel: M3UChannel | null) => void;
}

export const usePlayerStore = create<PlayerState>()((set) => ({
    playlists: [],
    activePlaylist: null,
    activeChannel: null,

    addPlaylist: (playlist) => set((state) => ({
        playlists: [...state.playlists, playlist],
        // Eğer ilk eklenen listeyse otomatik olarak onu aktif yap
        activePlaylist: state.playlists.length === 0 ? playlist : state.activePlaylist
    })),

    removePlaylist: (url) => set((state) => {
        const newPlaylists = state.playlists.filter(p => p.url !== url);
        return {
            playlists: newPlaylists,
            activePlaylist: state.activePlaylist?.url === url
                ? (newPlaylists[0] || null)
                : state.activePlaylist
        }
    }),

    setActivePlaylist: (url) => set((state) => ({
        activePlaylist: state.playlists.find(p => p.url === url) || null
    })),

    setActiveChannel: (channel) => set({ activeChannel: channel }),
}));
