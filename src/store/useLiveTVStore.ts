import { create } from 'zustand';
import { M3UChannel, Country, extractCountries, getChannelsByCountry } from '../lib/m3uParser';

interface LiveTVState {
    // Tüm kanallar
    allChannels: M3UChannel[];
    
    // Ülkeler
    countries: Country[];
    selectedCountry: string | null; // null = tüm ülkeler
    
    // Filtrelenmiş kanallar
    filteredChannels: M3UChannel[];
    
    // Arama
    searchQuery: string;
    
    // Seçili kanal (oynatma için)
    selectedChannel: M3UChannel | null;
    
    // Loading
    isLoading: boolean;
    
    // Actions
    setChannels: (channels: M3UChannel[]) => void;
    selectCountry: (countryCode: string | null) => void;
    setSearchQuery: (query: string) => void;
    setSelectedChannel: (channel: M3UChannel | null) => void;
    filterChannels: () => void;
}

export const useLiveTVStore = create<LiveTVState>()((set, get) => ({
    allChannels: [],
    countries: [],
    selectedCountry: null,
    filteredChannels: [],
    searchQuery: '',
    selectedChannel: null,
    isLoading: true,
    
    setChannels: (channels) => {
        const countries = extractCountries(channels);
        set({ 
            allChannels: channels, 
            countries,
            isLoading: false 
        });
        get().filterChannels();
    },
    
    selectCountry: (countryCode) => {
        set({ selectedCountry: countryCode });
        get().filterChannels();
    },
    
    setSearchQuery: (query) => {
        set({ searchQuery: query });
        get().filterChannels();
    },
    
    setSelectedChannel: (channel) => set({ selectedChannel: channel }),
    
    filterChannels: () => {
        const { allChannels, selectedCountry, searchQuery } = get();
        
        let filtered = allChannels;
        
        // Ülke filtresi
        if (selectedCountry) {
            filtered = getChannelsByCountry(filtered, selectedCountry);
        }
        
        // Arama filtresi
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(channel => 
                channel.name.toLowerCase().includes(query) ||
                channel.group.toLowerCase().includes(query)
            );
        }
        
        set({ filteredChannels: filtered });
    },
}));

export default useLiveTVStore;
