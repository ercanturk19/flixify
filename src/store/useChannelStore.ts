import { create } from 'zustand';
import { Channel } from '../lib/indexedDB';

// Define the state shape
interface ChannelState {
  channels: Channel[];
  filteredChannels: Channel[];
  searchQuery: string;
  isSearching: boolean;
  isLoading: boolean;
  error: string | null;
}

// Define the actions
interface ChannelActions {
  setChannels: (channels: Channel[]) => void;
  setSearchQuery: (query: string) => void;
  setFilteredChannels: (channels: Channel[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// Create the store
export const useChannelStore = create<ChannelState & ChannelActions>((set) => ({
  // Initial State
  channels: [],
  filteredChannels: [],
  searchQuery: '',
  isSearching: false,
  isLoading: false,
  error: null,

  // Actions
  setChannels: (channels) => set({ channels, filteredChannels: channels }), // Initially filtered is same as all
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilteredChannels: (filteredChannels) => set({ filteredChannels }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

// Selectors for optimization (Components should use these)
export const useChannels = () => useChannelStore((state) => state.channels);
export const useFilteredChannels = () => useChannelStore((state) => state.filteredChannels);
export const useSearchQuery = () => useChannelStore((state) => state.searchQuery);
export const useIsSearching = () => useChannelStore((state) => state.isSearching);
export const useIsLoading = () => useChannelStore((state) => state.isLoading);
export const useChannelActions = () => {
  const setChannels = useChannelStore((state) => state.setChannels);
  const setSearchQuery = useChannelStore((state) => state.setSearchQuery);
  const setFilteredChannels = useChannelStore((state) => state.setFilteredChannels);
  const setIsSearching = useChannelStore((state) => state.setIsSearching);
  const setIsLoading = useChannelStore((state) => state.setIsLoading);
  const setError = useChannelStore((state) => state.setError);
  
  return { setChannels, setSearchQuery, setFilteredChannels, setIsSearching, setIsLoading, setError };
};
