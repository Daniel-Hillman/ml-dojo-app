/**
 * Code Persistence System
 * Handles saving, loading, and managing code snippets and execution sessions
 */

import { SupportedLanguage, CodeExecutionResult } from './types';

export interface SavedCodeSnippet {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: SupportedLanguage;
  authorId?: string;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  forkCount: number;
  likeCount: number;
  viewCount: number;
  parentId?: string; // For forked snippets
  executionResults?: CodeExecutionResult[];
  metadata: {
    codeSize: number;
    complexity?: 'beginner' | 'intermediate' | 'advanced';
    category?: string;
    estimatedRunTime?: number;
  };
}

export interface CodeCollection {
  id: string;
  name: string;
  description?: string;
  authorId: string;
  isPublic: boolean;
  snippetIds: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionSession {
  id: string;
  userId?: string;
  code: string;
  language: SupportedLanguage;
  results: CodeExecutionResult[];
  createdAt: Date;
  lastExecutedAt: Date;
  isTemporary: boolean;
  expiresAt?: Date;
  metadata: {
    totalExecutions: number;
    successfulExecutions: number;
    averageExecutionTime: number;
    lastError?: string;
  };
}

export interface CodeVersion {
  id: string;
  snippetId: string;
  version: number;
  code: string;
  changeDescription?: string;
  createdAt: Date;
  authorId?: string;
  diff?: {
    added: number;
    removed: number;
    modified: number;
  };
}

export class CodePersistenceService {
  private static instance: CodePersistenceService;
  private dbName = 'omnicode_persistence';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  private constructor() {
    this.initializeDatabase();
  }

  public static getInstance(): CodePersistenceService {
    if (!CodePersistenceService.instance) {
      CodePersistenceService.instance = new CodePersistenceService();
    }
    return CodePersistenceService.instance;
  }

  private async initializeDatabase(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not available, using fallback storage');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Code snippets store
        if (!db.objectStoreNames.contains('snippets')) {
          const snippetStore = db.createObjectStore('snippets', { keyPath: 'id' });
          snippetStore.createIndex('authorId', 'authorId', { unique: false });
          snippetStore.createIndex('language', 'language', { unique: false });
          snippetStore.createIndex('isPublic', 'isPublic', { unique: false });
          snippetStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          snippetStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Collections store
        if (!db.objectStoreNames.contains('collections')) {
          const collectionStore = db.createObjectStore('collections', { keyPath: 'id' });
          collectionStore.createIndex('authorId', 'authorId', { unique: false });
          collectionStore.createIndex('isPublic', 'isPublic', { unique: false });
        }

        // Execution sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('userId', 'userId', { unique: false });
          sessionStore.createIndex('language', 'language', { unique: false });
          sessionStore.createIndex('isTemporary', 'isTemporary', { unique: false });
          sessionStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        // Code versions store
        if (!db.objectStoreNames.contains('versions')) {
          const versionStore = db.createObjectStore('versions', { keyPath: 'id' });
          versionStore.createIndex('snippetId', 'snippetId', { unique: false });
          versionStore.createIndex('version', 'version', { unique: false });
        }
      };
    });
  }

  // Code Snippet Management

  public async saveCodeSnippet(snippet: Omit<SavedCodeSnippet, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = this.generateId();
    const now = new Date();
    
    const fullSnippet: SavedCodeSnippet = {
      ...snippet,
      id,
      createdAt: now,
      updatedAt: now,
      forkCount: 0,
      likeCount: 0,
      viewCount: 0,
      metadata: {
        ...snippet.metadata,
        codeSize: snippet.code.length
      }
    };

    await this.storeData('snippets', fullSnippet);
    
    // Create initial version
    await this.createCodeVersion(id, snippet.code, 'Initial version');
    
    return id;
  }

  public async updateCodeSnippet(id: string, updates: Partial<SavedCodeSnippet>): Promise<void> {
    const existing = await this.getCodeSnippet(id);
    if (!existing) {
      throw new Error('Code snippet not found');
    }

    const updated: SavedCodeSnippet = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    // If code changed, create a new version
    if (updates.code && updates.code !== existing.code) {
      await this.createCodeVersion(id, updates.code, 'Code updated');
    }

    await this.storeData('snippets', updated);
  }

  public async getCodeSnippet(id: string): Promise<SavedCodeSnippet | null> {
    return await this.getData('snippets', id);
  }

  public async deleteCodeSnippet(id: string): Promise<void> {
    await this.deleteData('snippets', id);
    
    // Delete all versions
    const versions = await this.getCodeVersions(id);
    for (const version of versions) {
      await this.deleteData('versions', version.id);
    }
  }

  public async searchCodeSnippets(query: {
    language?: SupportedLanguage;
    tags?: string[];
    authorId?: string;
    isPublic?: boolean;
    searchText?: string;
    limit?: number;
    offset?: number;
  }): Promise<SavedCodeSnippet[]> {
    const allSnippets = await this.getAllData<SavedCodeSnippet>('snippets');
    
    let filtered = allSnippets.filter(snippet => {
      if (query.language && snippet.language !== query.language) return false;
      if (query.authorId && snippet.authorId !== query.authorId) return false;
      if (query.isPublic !== undefined && snippet.isPublic !== query.isPublic) return false;
      
      if (query.tags && query.tags.length > 0) {
        const hasAllTags = query.tags.every(tag => snippet.tags.includes(tag));
        if (!hasAllTags) return false;
      }
      
      if (query.searchText) {
        const searchLower = query.searchText.toLowerCase();
        const matchesTitle = snippet.title.toLowerCase().includes(searchLower);
        const matchesDescription = snippet.description?.toLowerCase().includes(searchLower);
        const matchesCode = snippet.code.toLowerCase().includes(searchLower);
        
        if (!matchesTitle && !matchesDescription && !matchesCode) return false;
      }
      
      return true;
    });

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    
    return filtered.slice(offset, offset + limit);
  }

  public async forkCodeSnippet(id: string, newTitle?: string): Promise<string> {
    const original = await this.getCodeSnippet(id);
    if (!original) {
      throw new Error('Original snippet not found');
    }

    // Increment fork count
    await this.updateCodeSnippet(id, {
      forkCount: original.forkCount + 1
    });

    // Create fork
    const forkId = await this.saveCodeSnippet({
      title: newTitle || `Fork of ${original.title}`,
      description: original.description,
      code: original.code,
      language: original.language,
      isPublic: false, // Forks are private by default
      tags: [...original.tags],
      parentId: id,
      metadata: {
        ...original.metadata,
        complexity: original.metadata.complexity,
        category: original.metadata.category
      }
    });

    return forkId;
  }

  // Collection Management

  public async createCollection(collection: Omit<CodeCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = this.generateId();
    const now = new Date();
    
    const fullCollection: CodeCollection = {
      ...collection,
      id,
      createdAt: now,
      updatedAt: now
    };

    await this.storeData('collections', fullCollection);
    return id;
  }

  public async addToCollection(collectionId: string, snippetId: string): Promise<void> {
    const collection = await this.getData<CodeCollection>('collections', collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    if (!collection.snippetIds.includes(snippetId)) {
      collection.snippetIds.push(snippetId);
      collection.updatedAt = new Date();
      await this.storeData('collections', collection);
    }
  }

  public async removeFromCollection(collectionId: string, snippetId: string): Promise<void> {
    const collection = await this.getData<CodeCollection>('collections', collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    const index = collection.snippetIds.indexOf(snippetId);
    if (index > -1) {
      collection.snippetIds.splice(index, 1);
      collection.updatedAt = new Date();
      await this.storeData('collections', collection);
    }
  }

  public async getCollection(id: string): Promise<CodeCollection | null> {
    return await this.getData('collections', id);
  }

  public async getCollectionWithSnippets(id: string): Promise<{
    collection: CodeCollection;
    snippets: SavedCodeSnippet[];
  } | null> {
    const collection = await this.getCollection(id);
    if (!collection) return null;

    const snippets = await Promise.all(
      collection.snippetIds.map(snippetId => this.getCodeSnippet(snippetId))
    );

    return {
      collection,
      snippets: snippets.filter(Boolean) as SavedCodeSnippet[]
    };
  }

  // Session Management

  public async createSession(session: Omit<ExecutionSession, 'id' | 'createdAt' | 'lastExecutedAt' | 'metadata'>): Promise<string> {
    const id = this.generateId();
    const now = new Date();
    
    const fullSession: ExecutionSession = {
      ...session,
      id,
      createdAt: now,
      lastExecutedAt: now,
      metadata: {
        totalExecutions: 0,
        successfulExecutions: 0,
        averageExecutionTime: 0
      }
    };

    await this.storeData('sessions', fullSession);
    
    // Set up auto-cleanup for temporary sessions
    if (session.isTemporary) {
      this.scheduleSessionCleanup(id, session.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000));
    }
    
    return id;
  }

  public async updateSession(id: string, updates: Partial<ExecutionSession>): Promise<void> {
    const existing = await this.getData<ExecutionSession>('sessions', id);
    if (!existing) {
      throw new Error('Session not found');
    }

    const updated: ExecutionSession = {
      ...existing,
      ...updates,
      id,
      lastExecutedAt: new Date()
    };

    await this.storeData('sessions', updated);
  }

  public async addExecutionResult(sessionId: string, result: CodeExecutionResult): Promise<void> {
    const session = await this.getData<ExecutionSession>('sessions', sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.results.push(result);
    session.metadata.totalExecutions++;
    
    if (result.success) {
      session.metadata.successfulExecutions++;
    } else {
      session.metadata.lastError = result.error;
    }

    // Update average execution time
    const totalTime = session.results.reduce((sum, r) => sum + r.executionTime, 0);
    session.metadata.averageExecutionTime = totalTime / session.results.length;

    await this.updateSession(sessionId, session);
  }

  public async getSession(id: string): Promise<ExecutionSession | null> {
    return await this.getData('sessions', id);
  }

  public async getUserSessions(userId: string, includeTemporary = false): Promise<ExecutionSession[]> {
    const allSessions = await this.getAllData<ExecutionSession>('sessions');
    
    return allSessions.filter(session => 
      session.userId === userId && 
      (includeTemporary || !session.isTemporary)
    ).sort((a, b) => b.lastExecutedAt.getTime() - a.lastExecutedAt.getTime());
  }

  // Version Management

  public async createCodeVersion(snippetId: string, code: string, description?: string): Promise<string> {
    const versions = await this.getCodeVersions(snippetId);
    const nextVersion = versions.length + 1;
    
    const versionId = this.generateId();
    const version: CodeVersion = {
      id: versionId,
      snippetId,
      version: nextVersion,
      code,
      changeDescription: description,
      createdAt: new Date()
    };

    // Calculate diff if there's a previous version
    if (versions.length > 0) {
      const previousVersion = versions[versions.length - 1];
      version.diff = this.calculateDiff(previousVersion.code, code);
    }

    await this.storeData('versions', version);
    return versionId;
  }

  public async getCodeVersions(snippetId: string): Promise<CodeVersion[]> {
    const allVersions = await this.getAllData<CodeVersion>('versions');
    
    return allVersions
      .filter(version => version.snippetId === snippetId)
      .sort((a, b) => a.version - b.version);
  }

  public async getCodeVersion(snippetId: string, version: number): Promise<CodeVersion | null> {
    const versions = await this.getCodeVersions(snippetId);
    return versions.find(v => v.version === version) || null;
  }

  // Utility Methods

  public async exportUserData(userId: string): Promise<{
    snippets: SavedCodeSnippet[];
    collections: CodeCollection[];
    sessions: ExecutionSession[];
  }> {
    const snippets = await this.searchCodeSnippets({ authorId: userId });
    const allCollections = await this.getAllData<CodeCollection>('collections');
    const collections = allCollections.filter(c => c.authorId === userId);
    const sessions = await this.getUserSessions(userId, true);

    return { snippets, collections, sessions };
  }

  public async importUserData(data: {
    snippets: SavedCodeSnippet[];
    collections: CodeCollection[];
    sessions: ExecutionSession[];
  }): Promise<void> {
    // Import snippets
    for (const snippet of data.snippets) {
      await this.storeData('snippets', snippet);
    }

    // Import collections
    for (const collection of data.collections) {
      await this.storeData('collections', collection);
    }

    // Import sessions
    for (const session of data.sessions) {
      await this.storeData('sessions', session);
    }
  }

  public async cleanupExpiredSessions(): Promise<number> {
    const allSessions = await this.getAllData<ExecutionSession>('sessions');
    const now = new Date();
    let cleanedCount = 0;

    for (const session of allSessions) {
      if (session.isTemporary && session.expiresAt && session.expiresAt < now) {
        await this.deleteData('sessions', session.id);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // Private helper methods

  private async storeData<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) {
      // Fallback to localStorage
      this.storeInLocalStorage(storeName, data);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getData<T>(storeName: string, id: string): Promise<T | null> {
    if (!this.db) {
      // Fallback to localStorage
      return this.getFromLocalStorage<T>(storeName, id);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllData<T>(storeName: string): Promise<T[]> {
    if (!this.db) {
      // Fallback to localStorage
      return this.getAllFromLocalStorage<T>(storeName);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteData(storeName: string, id: string): Promise<void> {
    if (!this.db) {
      // Fallback to localStorage
      this.deleteFromLocalStorage(storeName, id);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // LocalStorage fallback methods
  private storeInLocalStorage<T>(storeName: string, data: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      const key = `${this.dbName}_${storeName}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const index = existing.findIndex((item: any) => item.id === (data as any).id);
      
      if (index >= 0) {
        existing[index] = data;
      } else {
        existing.push(data);
      }
      
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.warn('Failed to store in localStorage:', error);
    }
  }

  private getFromLocalStorage<T>(storeName: string, id: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const key = `${this.dbName}_${storeName}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      return existing.find((item: any) => item.id === id) || null;
    } catch (error) {
      console.warn('Failed to get from localStorage:', error);
      return null;
    }
  }

  private getAllFromLocalStorage<T>(storeName: string): T[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const key = `${this.dbName}_${storeName}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      console.warn('Failed to get all from localStorage:', error);
      return [];
    }
  }

  private deleteFromLocalStorage(storeName: string, id: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const key = `${this.dbName}_${storeName}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = existing.filter((item: any) => item.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch (error) {
      console.warn('Failed to delete from localStorage:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private calculateDiff(oldCode: string, newCode: string): { added: number; removed: number; modified: number } {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    
    let added = 0;
    let removed = 0;
    let modified = 0;
    
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];
      
      if (oldLine === undefined) {
        added++;
      } else if (newLine === undefined) {
        removed++;
      } else if (oldLine !== newLine) {
        modified++;
      }
    }
    
    return { added, removed, modified };
  }

  private scheduleSessionCleanup(sessionId: string, expiresAt: Date): void {
    const delay = expiresAt.getTime() - Date.now();
    
    if (delay > 0) {
      setTimeout(async () => {
        try {
          await this.deleteData('sessions', sessionId);
        } catch (error) {
          console.warn('Failed to cleanup expired session:', error);
        }
      }, delay);
    }
  }
}

// Export singleton instance
export const codePersistence = CodePersistenceService.getInstance();