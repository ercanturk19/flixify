import { useEffect, useRef } from 'react';
import { useChannelStore } from '../store/useChannelStore';
import { playlistCache, Channel } from '../lib/indexedDB';

const M3U_URL = 'https://iptv-provider.com/playlist.m3u'; // Replace with actual URL or prop
const PARSER_WORKER_PATH = new URL('../workers/m3uParser.worker.ts', import.meta.url);
const SEARCH_WORKER_PATH = new URL('../workers/search.worker.ts', import.meta.url);

export const useChannelLoader = () => {
  const { 
    setChannels, 
    setIsLoading, 
    setError, 
    setFilteredChannels,
    searchQuery
  } = useChannelStore((state) => ({
    setChannels: state.setChannels,
    setIsLoading: state.setIsLoading,
    setError: state.setError,
    setFilteredChannels: state.setFilteredChannels,
    searchQuery: state.searchQuery
  }));

  const searchWorkerRef = useRef<Worker | null>(null);

  // Initialize Search Worker
  useEffect(() => {
    searchWorkerRef.current = new Worker(SEARCH_WORKER_PATH, { type: 'module' });
    
    searchWorkerRef.current.onmessage = (e) => {
      const { type, results } = e.data;
      if (type === 'SEARCH_RESULT') {
        setFilteredChannels(results);
      }
    };

    return () => {
      searchWorkerRef.current?.terminate();
    };
  }, [setFilteredChannels]);

  // Handle Search Query Changes
  useEffect(() => {
    if (searchWorkerRef.current) {
      searchWorkerRef.current.postMessage({ type: 'SEARCH', payload: searchQuery });
    }
  }, [searchQuery]);

  // Load Channels
  useEffect(() => {
    const loadChannels = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Check Cache
        const cachedChannels = await playlistCache.getPlaylist('main-playlist');
        
        if (cachedChannels && cachedChannels.length > 0) {
          console.log('Loaded from cache:', cachedChannels.length);
          setChannels(cachedChannels);
          // Send to search worker
          searchWorkerRef.current?.postMessage({ type: 'SET_DATA', payload: cachedChannels });
          setIsLoading(false);
          return;
        }

        // 2. Fetch & Parse via Worker
        console.log('Cache miss, starting worker...');
        const parserWorker = new Worker(PARSER_WORKER_PATH, { type: 'module' });
        
        parserWorker.postMessage({ type: 'PARSE', url: M3U_URL });

        let allChannels: Channel[] = [];

        parserWorker.onmessage = (e) => {
          const { type, data, error, total } = e.data;

          if (type === 'CHUNK') {
            // Optimization: We could update UI incrementally, but for search worker consistency
            // we might want to wait or update periodically.
            // For now, let's accumulate.
            allChannels.push(...data);
            // Optional: Update UI with partial data (might cause flicker if not careful)
            // setChannels([...allChannels]); 
          } else if (type === 'DONE') {
            console.log('Parsing done. Total:', total);
            setChannels(allChannels);
            
            // Save to Cache
            playlistCache.savePlaylist('main-playlist', M3U_URL, allChannels)
              .catch(err => console.error('Cache save failed:', err));

            // Send to Search Worker
            searchWorkerRef.current?.postMessage({ type: 'SET_DATA', payload: allChannels });
            
            parserWorker.terminate();
            setIsLoading(false);
          } else if (type === 'ERROR') {
            console.error('Worker error:', error);
            setError(error);
            parserWorker.terminate();
            setIsLoading(false);
          }
        };

      } catch (err) {
        console.error('Loader error:', err);
        setError((err as Error).message);
        setIsLoading(false);
      }
    };

    loadChannels();
  }, [setChannels, setIsLoading, setError]); // Dependencies should be stable
};
