// IndexedDB wrapper for better performance and larger storage
const DB_NAME = 'GweAIDB';
const DB_VERSION = 1;

interface DBStores {
  wallets: string;
  transactions: string;
  chatHistory: string;
  settings: string;
}

const STORES: DBStores = {
  wallets: 'wallets',
  transactions: 'transactions',
  chatHistory: 'chatHistory',
  settings: 'settings',
};

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.wallets)) {
          db.createObjectStore(STORES.wallets, { keyPath: 'address' });
        }
        if (!db.objectStoreNames.contains(STORES.transactions)) {
          const txStore = db.createObjectStore(STORES.transactions, {
            keyPath: 'id',
            autoIncrement: true,
          });
          txStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.chatHistory)) {
          const chatStore = db.createObjectStore(STORES.chatHistory, {
            keyPath: 'id',
            autoIncrement: true,
          });
          chatStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.settings)) {
          db.createObjectStore(STORES.settings, { keyPath: 'key' });
        }
      };
    });

    return this.initPromise;
  }

  async set<T>(storeName: keyof DBStores, key: string, value: T): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES[storeName]], 'readwrite');
      const store = transaction.objectStore(STORES[storeName]);
      const request = store.put({ key, value, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: keyof DBStores, key: string): Promise<T | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES[storeName]], 'readonly');
      const store = transaction.objectStore(STORES[storeName]);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: keyof DBStores): Promise<T[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES[storeName]], 'readonly');
      const store = transaction.objectStore(STORES[storeName]);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result.map((item) => item.value));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: keyof DBStores, key: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES[storeName]], 'readwrite');
      const store = transaction.objectStore(STORES[storeName]);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: keyof DBStores): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES[storeName]], 'readwrite');
      const store = transaction.objectStore(STORES[storeName]);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear wallet-specific data
  async clearWalletData(walletAddress: string): Promise<void> {
    await this.init();
    const lowerAddress = walletAddress.toLowerCase();
    
    // Clear from all stores where wallet data might exist
    const stores = ['wallets', 'transactions', 'chatHistory'] as (keyof DBStores)[];
    
    for (const storeName of stores) {
      try {
        const transaction = this.db!.transaction([STORES[storeName]], 'readwrite');
        const store = transaction.objectStore(STORES[storeName]);
        const request = store.openCursor();
        
        await new Promise<void>((resolve, reject) => {
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
              const value = cursor.value;
              // Check if this entry belongs to the wallet
              if (value.walletAddress?.toLowerCase() === lowerAddress || 
                  value.address?.toLowerCase() === lowerAddress ||
                  value.key?.includes(lowerAddress)) {
                cursor.delete();
              }
              cursor.continue();
            } else {
              resolve();
            }
          };
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error(`Failed to clear ${storeName} for wallet:`, error);
      }
    }
    
    // Also clear localStorage for this wallet
    const localStorageKey = `wallet_${lowerAddress}_transactions`;
    localStorage.removeItem(localStorageKey);
  }

  // Paginated query for large datasets
  async getPaginated<T>(
    storeName: keyof DBStores,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: T[]; hasMore: boolean }> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES[storeName]], 'readonly');
      const store = transaction.objectStore(STORES[storeName]);
      const request = store.openCursor();

      const results: T[] = [];
      let skipped = 0;
      const skip = (page - 1) * limit;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor) {
          if (skipped < skip) {
            skipped++;
            cursor.continue();
          } else if (results.length < limit) {
            results.push(cursor.value.value);
            cursor.continue();
          } else {
            resolve({ data: results, hasMore: true });
          }
        } else {
          resolve({ data: results, hasMore: false });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const indexedDBService = new IndexedDBService();

// Fallback to localStorage if IndexedDB is not available
export const storageService = {
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await indexedDBService.set('settings', key, value);
    } catch (error) {
      console.warn('IndexedDB failed, falling back to localStorage', error);
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      return await indexedDBService.get<T>('settings', key);
    } catch (error) {
      console.warn('IndexedDB failed, falling back to localStorage', error);
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await indexedDBService.delete('settings', key);
    } catch (error) {
      console.warn('IndexedDB failed, falling back to localStorage', error);
      localStorage.removeItem(key);
    }
  },

  async clear(): Promise<void> {
    try {
      await indexedDBService.clear('settings');
    } catch (error) {
      console.warn('IndexedDB failed, falling back to localStorage', error);
      localStorage.clear();
    }
  },

  async clearWallet(walletAddress: string): Promise<void> {
    try {
      await indexedDBService.clearWalletData(walletAddress);
    } catch (error) {
      console.warn('Failed to clear wallet data from IndexedDB', error);
      // Fallback to localStorage
      const lowerAddress = walletAddress.toLowerCase();
      const localStorageKey = `wallet_${lowerAddress}_transactions`;
      localStorage.removeItem(localStorageKey);
    }
  },
};
