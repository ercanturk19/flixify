import { openDB, DBSchema } from 'idb';

interface FlixifyDB extends DBSchema {
  m3uCache: {
    key: string;
    value: {
      url: string;
      content: string;
      timestamp: number;
    };
  };
  parsedCache: {
    key: string;
    value: {
      url: string;
      data: any; // Parsed result from worker
      timestamp: number;
    };
  };
}

const DB_NAME = 'flixify-db';
const VERSION = 2; // Version bumped
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export async function initDB() {
  return openDB<FlixifyDB>(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('m3uCache')) {
        db.createObjectStore('m3uCache', { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains('parsedCache')) {
        db.createObjectStore('parsedCache', { keyPath: 'url' });
      }
    },
  });
}

export async function cacheM3UContent(url: string, content: string) {
  const db = await initDB();
  await db.put('m3uCache', {
    url,
    content,
    timestamp: Date.now(),
  });
}

export async function getCachedM3UContent(url: string) {
  const db = await initDB();
  const cached = await db.get('m3uCache', url);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('[CACHE] M3U content found and valid.');
    return cached.content;
  }
  return null;
}

export async function cacheParsedData(url: string, data: any) {
  const db = await initDB();
  await db.put('parsedCache', {
    url,
    data,
    timestamp: Date.now(),
  });
  console.log('[CACHE] Parsed data saved.');
}

export async function getCachedParsedData(url: string) {
  const db = await initDB();
  const cached = await db.get('parsedCache', url);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('[CACHE] Parsed data found and valid.');
    return cached.data;
  }
  return null;
}

export async function clearM3UCache() {
    const db = await initDB();
    await db.clear('m3uCache');
    await db.clear('parsedCache');
}