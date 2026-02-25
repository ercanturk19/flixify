// src/lib/indexedDB.ts

// Define the schema for our playlist entries
export interface Channel {
  id: string;
  name: string;
  logo?: string;
  url: string;
  group?: string;
}

interface PlaylistEntry {
  id: string;
  url: string;
  channels: Channel[];
  timestamp: number;
}

const DB_NAME = 'iptv-db';
const DB_VERSION = 1;
const STORE_NAME = 'playlists';
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export class PlaylistCache {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  async savePlaylist(id: string, url: string, channels: Channel[]): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const entry: PlaylistEntry = {
        id,
        url,
        channels,
        timestamp: Date.now(),
      };
      
      const request = store.put(entry);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPlaylist(id: string): Promise<Channel[] | null> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result as PlaylistEntry | undefined;
        
        if (!record) {
          resolve(null);
          return;
        }

        const isExpired = Date.now() - record.timestamp > TTL_MS;
        if (isExpired) {
          // Fire and forget delete if expired
          const deleteTx = db.transaction(STORE_NAME, 'readwrite');
          deleteTx.objectStore(STORE_NAME).delete(id);
          resolve(null);
        } else {
          resolve(record.channels);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clearCache(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const playlistCache = new PlaylistCache();
