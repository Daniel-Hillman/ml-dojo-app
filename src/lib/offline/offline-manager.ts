'use client';

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  actions: {
    key: string;
    value: {
      id: string;
      type: string;
      data: any;
      timestamp: number;
      retryCount: number;
    };
  };
  cache: {
    key: string;
    value: {
      key: string;
      data: any;
      timestamp: number;
      expiry?: number;
    };
  };
  userContent: {
    key: string;
    value: {
      id: string;
      type: 'drill' | 'code' | 'note';
      content: any;
      lastModified: number;
      synced: boolean;
    };
  };
}

class OfflineManager {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    this.initDB();
    this.setupEventListeners();
  }

  private async initDB() {
    try {
      this.db = await openDB<OfflineDB>('omnicode-offline', 1, {
        upgrade(db) {
          // Actions store for offline operations
          if (!db.objectStoreNames.contains('actions')) {
            db.createObjectStore('actions', { keyPath: 'id' });
          }
          
          // Cache store for API responses
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache', { keyPath: 'key' });
          }
          
          // User content store
          if (!db.objectStoreNames.contains('userContent')) {
            const store = db.createObjectStore('userContent', { keyPath: 'id' });
            store.createIndex('type', 'type');
            store.createIndex('synced', 'synced');
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
    }
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }

  // Queue action for offline execution
  async queueAction(type: string, data: any): Promise<string> {
    if (!this.db) return '';

    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const action = {
      id,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    await this.db.add('actions', action);
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncOfflineActions();
    }

    return id;
  }

  // Save user content locally
  async saveUserContent(id: string, type: 'drill' | 'code' | 'note', content: any): Promise<void> {
    if (!this.db) return;

    const item = {
      id,
      type,
      content,
      lastModified: Date.now(),
      synced: this.isOnline
    };

    await this.db.put('userContent', item);

    // Queue sync action if offline
    if (!this.isOnline) {
      await this.queueAction('sync-content', { id, type, content });
    }
  }

  // Get user content
  async getUserContent(id: string) {
    if (!this.db) return null;
    return await this.db.get('userContent', id);
  }

  // Get all user content by type
  async getUserContentByType(type: 'drill' | 'code' | 'note') {
    if (!this.db) return [];
    const tx = this.db.transaction('userContent', 'readonly');
    const index = tx.store.index('type');
    return await index.getAll(type);
  }

  // Cache API response
  async cacheResponse(key: string, data: any, expiry?: number): Promise<void> {
    if (!this.db) return;

    const cacheItem = {
      key,
      data,
      timestamp: Date.now(),
      expiry
    };

    await this.db.put('cache', cacheItem);
  }

  // Get cached response
  async getCachedResponse(key: string): Promise<any> {
    if (!this.db) return null;

    const cached = await this.db.get('cache', key);
    if (!cached) return null;

    // Check if expired
    if (cached.expiry && Date.now() > cached.expiry) {
      await this.db.delete('cache', key);
      return null;
    }

    return cached.data;
  }

  // Sync offline actions
  async syncOfflineActions(): Promise<void> {
    if (!this.db || this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;

    try {
      const actions = await this.db.getAll('actions');
      
      for (const action of actions) {
        try {
          await this.processAction(action);
          await this.db.delete('actions', action.id);
        } catch (error) {
          console.error('Failed to sync action:', action, error);
          
          // Increment retry count
          action.retryCount++;
          if (action.retryCount < 3) {
            await this.db.put('actions', action);
          } else {
            // Remove after 3 failed attempts
            await this.db.delete('actions', action.id);
          }
        }
      }

      // Sync unsynced user content
      await this.syncUserContent();
      
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processAction(action: any): Promise<void> {
    switch (action.type) {
      case 'create-drill':
        await fetch('/api/drills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        });
        break;
        
      case 'save-code':
        await fetch('/api/code-snippets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        });
        break;
        
      case 'sync-content':
        await this.syncContentItem(action.data);
        break;
        
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  private async syncUserContent(): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction('userContent', 'readwrite');
    const index = tx.store.index('synced');
    const unsyncedItems = await index.getAll(false);

    for (const item of unsyncedItems) {
      try {
        await this.syncContentItem(item);
        item.synced = true;
        await tx.store.put(item);
      } catch (error) {
        console.error('Failed to sync content item:', item, error);
      }
    }
  }

  private async syncContentItem(item: any): Promise<void> {
    const endpoint = this.getEndpointForContentType(item.type);
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.content)
    });
  }

  private getEndpointForContentType(type: string): string {
    switch (type) {
      case 'drill': return '/api/drills';
      case 'code': return '/api/code-snippets';
      case 'note': return '/api/notes';
      default: throw new Error(`Unknown content type: ${type}`);
    }
  }

  // Get offline status
  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      hasOfflineActions: this.hasOfflineActions(),
      hasUnsyncedContent: this.hasUnsyncedContent()
    };
  }

  private async hasOfflineActions(): Promise<boolean> {
    if (!this.db) return false;
    const actions = await this.db.getAll('actions');
    return actions.length > 0;
  }

  private async hasUnsyncedContent(): Promise<boolean> {
    if (!this.db) return false;
    const tx = this.db.transaction('userContent', 'readonly');
    const index = tx.store.index('synced');
    const unsyncedItems = await index.getAll(false);
    return unsyncedItems.length > 0;
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['actions', 'cache', 'userContent'], 'readwrite');
    await Promise.all([
      tx.objectStore('actions').clear(),
      tx.objectStore('cache').clear(),
      tx.objectStore('userContent').clear()
    ]);
  }

  // Export offline data for backup
  async exportOfflineData(): Promise<any> {
    if (!this.db) return null;

    const [actions, cache, userContent] = await Promise.all([
      this.db.getAll('actions'),
      this.db.getAll('cache'),
      this.db.getAll('userContent')
    ]);

    return {
      actions,
      cache,
      userContent,
      exportDate: new Date().toISOString()
    };
  }
}

// Singleton instance
export const offlineManager = new OfflineManager();

// React hook for offline functionality
export function useOffline() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveOffline = async (type: string, data: any) => {
    return await offlineManager.queueAction(type, data);
  };

  const syncNow = async () => {
    setSyncInProgress(true);
    try {
      await offlineManager.syncOfflineActions();
    } finally {
      setSyncInProgress(false);
    }
  };

  return {
    isOnline,
    syncInProgress,
    saveOffline,
    syncNow,
    offlineManager
  };
}