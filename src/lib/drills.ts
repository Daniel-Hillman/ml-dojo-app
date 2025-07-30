/**
 * Enhanced drill types and loading functions for practice drills enhancement
 * Includes performance optimizations and client-side caching
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  deleteDoc,
  updateDoc,
  arrayRemove,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

// Client-side cache for drill data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class DrillCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache stats for debugging
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    const valid = entries.filter(([, entry]) => now <= entry.expiresAt);
    const expired = entries.length - valid.length;

    return {
      total: entries.length,
      valid: valid.length,
      expired,
      size: this.cache.size
    };
  }
}

// Global cache instance
const drillCache = new DrillCache();

// Base drill content type
export type DrillContent = {
  id: string;
  type: 'theory' | 'code' | 'mcq';
  value: string;
  language?: 'python';
  blanks?: number;
  choices?: any;
  answer?: number;
  solution?: any;
};

// Base drill type
export type Drill = {
  id: string;
  title: string;
  concept: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  drill_content?: DrillContent[];
  userId?: string;
  createdAt?: Date;
  language?: string;
};

// Enhanced drill type with source indicators and community metadata
export type EnhancedDrill = Drill & {
  source: 'personal' | 'community';
  originalAuthor?: string;
  originalAuthorAvatar?: string;
  savedAt?: Date;
  communityMetrics?: {
    likes: number;
    views: number;
    saves: number;
  };
};

// Saved drill document structure from Firestore
export interface SavedDrillDocument {
  drillId: string;
  savedAt: Timestamp;
  originalDrillData: {
    title: string;
    concept: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    description: string;
    language: string;
    content: DrillContent[];
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    createdAt: Timestamp;
    likes: number;
    views: number;
    saves: number;
  };
}

/**
 * Load personal drills created by the user with caching
 */
export async function loadPersonalDrills(userId: string): Promise<EnhancedDrill[]> {
  const cacheKey = `personal_drills_${userId}`;
  
  // Check cache first
  const cached = drillCache.get<EnhancedDrill[]>(cacheKey);
  if (cached) {
    console.log('Returning cached personal drills');
    return cached;
  }

  try {
    // Temporary fix: Use simple query without orderBy to avoid index requirement
    // TODO: Deploy the composite index and restore orderBy for better performance
    const q = query(
      collection(db, 'drills'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    
    const drills = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        concept: data.concept,
        difficulty: data.difficulty,
        description: data.description,
        drill_content: data.drill_content,
        userId: data.userId,
        createdAt: data.createdAt?.toDate(),
        language: data.language,
        source: 'personal' as const
      };
    }).sort((a, b) => {
      // Client-side sorting by creation date (newest first)
      const dateA = a.createdAt?.getTime() || 0;
      const dateB = b.createdAt?.getTime() || 0;
      return dateB - dateA;
    });

    // Cache the results
    drillCache.set(cacheKey, drills);
    console.log('Personal drills loaded and cached:', drills.length);
    
    return drills;
  } catch (error) {
    console.error('Error loading personal drills:', error);
    
    // Enhanced error handling with specific error types
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        throw new Error('You do not have permission to access your personal drills');
      }
      if (error.message.includes('unavailable') || error.message.includes('deadline-exceeded')) {
        throw new Error('Service is temporarily unavailable. Please try again in a moment');
      }
      if (error.message.includes('network')) {
        throw new Error('Network connection problem. Please check your internet connection');
      }
    }
    
    throw new Error('Failed to load personal drills. Please try again');
  }
}

/**
 * Load saved community drills from user's saved_drills subcollection with caching
 */
export async function loadSavedDrills(userId: string): Promise<EnhancedDrill[]> {
  const cacheKey = `saved_drills_${userId}`;
  
  // Check cache first
  const cached = drillCache.get<EnhancedDrill[]>(cacheKey);
  if (cached) {
    console.log('Returning cached saved drills');
    return cached;
  }

  try {
    // Optimized query with proper indexing
    const q = query(
      collection(db, `users/${userId}/saved_drills`),
      orderBy('savedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    const drills = snapshot.docs.map(doc => {
      const data = doc.data() as SavedDrillDocument;
      return transformSavedDrillToEnhanced(data);
    });

    // Cache the results
    drillCache.set(cacheKey, drills);
    console.log('Saved drills loaded and cached:', drills.length);
    
    return drills;
  } catch (error) {
    console.error('Error loading saved drills:', error);
    
    // Enhanced error handling with specific error types
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        throw new Error('You do not have permission to access your saved drills');
      }
      if (error.message.includes('unavailable') || error.message.includes('deadline-exceeded')) {
        throw new Error('Service is temporarily unavailable. Please try again in a moment');
      }
      if (error.message.includes('network')) {
        throw new Error('Network connection problem. Please check your internet connection');
      }
    }
    
    throw new Error('Failed to load saved drills. Please try again');
  }
}

/**
 * Transform saved drill document to EnhancedDrill format
 */
export function transformSavedDrillToEnhanced(savedDrill: SavedDrillDocument): EnhancedDrill {
  const { originalDrillData } = savedDrill;
  
  return {
    id: savedDrill.drillId,
    title: originalDrillData.title,
    concept: originalDrillData.concept,
    difficulty: originalDrillData.difficulty,
    description: originalDrillData.description,
    drill_content: originalDrillData.content,
    language: originalDrillData.language,
    createdAt: originalDrillData.createdAt?.toDate(),
    source: 'community' as const,
    originalAuthor: originalDrillData.authorName,
    originalAuthorAvatar: originalDrillData.authorAvatar,
    savedAt: savedDrill.savedAt?.toDate(),
    communityMetrics: {
      likes: originalDrillData.likes || 0,
      views: originalDrillData.views || 0,
      saves: originalDrillData.saves || 0
    }
  };
}

/**
 * Remove a saved drill from user's collection with cache invalidation
 */
export async function removeSavedDrill(userId: string, drillId: string): Promise<void> {
  try {
    // Find the saved drill document
    const q = query(
      collection(db, `users/${userId}/saved_drills`),
      where('drillId', '==', drillId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('Saved drill not found in your collection');
    }
    
    // Delete from user's saved_drills collection
    const savedDrillDoc = snapshot.docs[0];
    await deleteDoc(doc(db, `users/${userId}/saved_drills`, savedDrillDoc.id));
    
    // Update community_drills savedBy array
    const communityDrillRef = doc(db, 'community_drills', drillId);
    await updateDoc(communityDrillRef, {
      savedBy: arrayRemove(userId)
    });

    // Invalidate cache for saved drills
    drillCache.invalidate(`saved_drills_${userId}`);
    console.log('Saved drill removed and cache invalidated');
    
  } catch (error) {
    console.error('Error removing saved drill:', error);
    
    // Enhanced error handling with specific error types
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new Error('This drill is no longer in your saved collection');
      }
      if (error.message.includes('permission-denied')) {
        throw new Error('You do not have permission to remove this drill');
      }
      if (error.message.includes('unavailable') || error.message.includes('deadline-exceeded')) {
        throw new Error('Service is temporarily unavailable. Please try again in a moment');
      }
      if (error.message.includes('network')) {
        throw new Error('Network connection problem. Please check your internet connection');
      }
    }
    
    throw new Error('Failed to remove saved drill. Please try again');
  }
}

/**
 * Load both personal and saved drills concurrently
 */
export async function loadAllUserDrills(userId: string): Promise<{
  personalDrills: EnhancedDrill[];
  savedDrills: EnhancedDrill[];
}> {
  try {
    const [personalDrills, savedDrills] = await Promise.all([
      loadPersonalDrills(userId),
      loadSavedDrills(userId)
    ]);
    
    return {
      personalDrills,
      savedDrills
    };
  } catch (error) {
    console.error('Error loading user drills:', error);
    throw error;
  }
}

/**
 * Get drill counts for stats display
 */
export function getDrillCounts(personalDrills: EnhancedDrill[], savedDrills: EnhancedDrill[]) {
  return {
    personalCount: personalDrills.length,
    savedCount: savedDrills.length,
    totalCount: personalDrills.length + savedDrills.length
  };
}

// Error classification types
export type DrillErrorType = 'network' | 'permission' | 'service' | 'not_found' | 'unknown';

export interface DrillError {
  message: string;
  type: DrillErrorType;
  retryable: boolean;
  timestamp: Date;
}

/**
 * Classify error type based on error message and properties
 */
export function classifyDrillError(error: any): DrillError {
  const timestamp = new Date();
  
  if (!error) {
    return {
      message: 'Unknown error occurred',
      type: 'unknown',
      retryable: true,
      timestamp
    };
  }

  const errorMessage = error.message || error.toString();
  const lowerMessage = errorMessage.toLowerCase();

  // Network errors
  if (lowerMessage.includes('network') || 
      lowerMessage.includes('fetch') || 
      lowerMessage.includes('connection')) {
    return {
      message: errorMessage,
      type: 'network',
      retryable: true,
      timestamp
    };
  }

  // Permission errors
  if (lowerMessage.includes('permission') || 
      lowerMessage.includes('unauthorized') || 
      lowerMessage.includes('access denied')) {
    return {
      message: errorMessage,
      type: 'permission',
      retryable: false,
      timestamp
    };
  }

  // Service errors
  if (lowerMessage.includes('unavailable') || 
      lowerMessage.includes('deadline-exceeded') || 
      lowerMessage.includes('service') ||
      lowerMessage.includes('server')) {
    return {
      message: errorMessage,
      type: 'service',
      retryable: true,
      timestamp
    };
  }

  // Not found errors
  if (lowerMessage.includes('not found') || 
      lowerMessage.includes('does not exist')) {
    return {
      message: errorMessage,
      type: 'not_found',
      retryable: false,
      timestamp
    };
  }

  // Default to unknown
  return {
    message: errorMessage,
    type: 'unknown',
    retryable: true,
    timestamp
  };
}

/**
 * Load drills with comprehensive error handling and classification
 */
export async function loadDrillsWithErrorHandling(userId: string): Promise<{
  personalDrills: EnhancedDrill[];
  savedDrills: EnhancedDrill[];
  errors: {
    personal: DrillError | null;
    saved: DrillError | null;
  };
}> {
  const errors = {
    personal: null as DrillError | null,
    saved: null as DrillError | null
  };

  let personalDrills: EnhancedDrill[] = [];
  let savedDrills: EnhancedDrill[] = [];

  // Load personal drills with error handling
  try {
    personalDrills = await loadPersonalDrills(userId);
  } catch (error) {
    console.error('Error loading personal drills:', error);
    errors.personal = classifyDrillError(error);
  }

  // Load saved drills with error handling
  try {
    savedDrills = await loadSavedDrills(userId);
  } catch (error) {
    console.error('Error loading saved drills:', error);
    errors.saved = classifyDrillError(error);
  }

  return {
    personalDrills,
    savedDrills,
    errors
  };
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on permission errors
      const classified = classifyDrillError(error);
      if (!classified.retryable) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Check if all critical data sources have failed
 */
export function hasGlobalFailure(errors: {
  personal: DrillError | null;
  saved: DrillError | null;
}): boolean {
  return !!(errors.personal && errors.saved);
}

/**
 * Get user-friendly error message for display
 */
export function getDisplayErrorMessage(error: DrillError): string {
  switch (error.type) {
    case 'network':
      return 'Connection problem. Please check your internet connection and try again.';
    case 'permission':
      return 'You do not have permission to access this content.';
    case 'service':
      return 'Service is temporarily unavailable. Please try again in a moment.';
    case 'not_found':
      return 'The requested content could not be found.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Cache management functions for performance optimization
 */
export const cacheManager = {
  /**
   * Clear all cached drill data
   */
  clearAll(): void {
    drillCache.clear();
    console.log('All drill cache cleared');
  },

  /**
   * Clear cache for specific user
   */
  clearUserCache(userId: string): void {
    drillCache.invalidatePattern(userId);
    console.log(`Cache cleared for user: ${userId}`);
  },

  /**
   * Get cache statistics for debugging
   */
  getStats() {
    return drillCache.getStats();
  },

  /**
   * Preload drill data for better performance
   */
  async preloadUserDrills(userId: string): Promise<void> {
    try {
      console.log('Preloading drill data for user:', userId);
      await Promise.all([
        loadPersonalDrills(userId),
        loadSavedDrills(userId)
      ]);
      console.log('Drill data preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload drill data:', error);
    }
  },

  /**
   * Invalidate cache when user creates a new drill
   */
  invalidateOnDrillCreate(userId: string): void {
    drillCache.invalidate(`personal_drills_${userId}`);
    console.log('Personal drills cache invalidated after drill creation');
  },

  /**
   * Invalidate cache when user saves a community drill
   */
  invalidateOnDrillSave(userId: string): void {
    drillCache.invalidate(`saved_drills_${userId}`);
    console.log('Saved drills cache invalidated after drill save');
  }
};

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  /**
   * Measure query performance
   */
  async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await queryFn();
      const endTime = performance.now();
      console.log(`Query "${queryName}" took ${endTime - startTime}ms`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`Query "${queryName}" failed after ${endTime - startTime}ms:`, error);
      throw error;
    }
  },

  /**
   * Log cache hit/miss statistics
   */
  logCacheStats(): void {
    const stats = drillCache.getStats();
    console.log('Cache Statistics:', {
      hitRate: stats.valid / (stats.total || 1) * 100,
      ...stats
    });
  }
};