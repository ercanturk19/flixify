// src/workers/search.worker.ts

interface Channel {
  id: string;
  name: string;
  logo?: string;
  url: string;
  group?: string;
}

type WorkerMessage = 
  | { type: 'SET_DATA'; payload: Channel[] }
  | { type: 'SEARCH'; payload: string }; // query string

let channels: Channel[] = [];
let searchTimeout: number | null = null;
const DEBOUNCE_MS = 300;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'SET_DATA':
      channels = payload as Channel[];
      // Reset search if data changes? Maybe re-run last search?
      // For now, just update data.
      break;

    case 'SEARCH':
      const query = payload as string;
      
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      searchTimeout = self.setTimeout(() => {
        performSearch(query);
      }, DEBOUNCE_MS);
      break;
  }
};

function performSearch(query: string) {
  if (!query || query.trim() === '') {
    self.postMessage({ type: 'SEARCH_RESULT', results: channels });
    return;
  }

  const lowerQuery = query.toLowerCase();
  
  // Optimization: If query length is 1, maybe limit results?
  // But for now, standard filter.
  const results = channels.filter(channel => 
    channel.name.toLowerCase().includes(lowerQuery) || 
    (channel.group && channel.group.toLowerCase().includes(lowerQuery))
  );

  self.postMessage({ type: 'SEARCH_RESULT', results });
}
