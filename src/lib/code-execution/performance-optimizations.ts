/**
 * Performance Optimizations for Code Execution System
 * Includes lazy loading, caching, CDN integration, and offline capabilities
 */

import { SupportedLanguage, CodeExecutionResult } from './types';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  size: number; // Size in bytes
}

export interface PerformanceConfig {
  enableLazyLoading: boolean;
  enableCaching: boolean;
  enableCDN: boolean;
  enableOffline: boolean;
  cacheMaxSize: number; // Maximum cache size in bytes
  cacheTTL: number; // Default TTL in milliseconds
  preloadLanguages: SupportedLanguage[];
  cdnBaseUrl: string;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private loadedEngines: Set<string> = new Set();
  private preloadPromises: Map<string, Promise<any>> = new Map();
  private serviceWorker: ServiceWorker | null = null;
  private config: PerformanceConfig;

  private constructor() {
    this.config = {
      enableLazyLoading: true,
      enableCaching: true,
      enableCDN: true,
      enableOffline: true,
      cacheMaxSize: 50 * 1024 * 1024, // 50MB
      cacheTTL: 30 * 60 * 1000, // 30 minutes
      preloadLanguages: ['javascript', 'python'],
      cdnBaseUrl: 'https://cdn.jsdelivr.net'
    };

    this.initializeOptimizations();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private async initializeOptimizations(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Initialize service worker for offline capabilities
    if (this.config.enableOffline && 'serviceWorker' in navigator) {
      await this.initializeServiceWorker();
    }

    // Preload critical engines
    if (this.config.enableLazyLoading) {
      await this.preloadCriticalEngines();
    }

    // Set up cache cleanup
    this.setupCacheCleanup();

    // Monitor performance
    this.setupPerformanceMonitoring();
  }

  // Lazy Loading Implementation

  public async loadEngine(language: SupportedLanguage): Promise<any> {
    const engineKey = `engine_${language}`;
    
    if (this.loadedEngines.has(engineKey)) {
      return this.getCachedEngine(engineKey);
    }

    // Check if already loading
    if (this.preloadPromises.has(engineKey)) {
      return await this.preloadPromises.get(engineKey);
    }

    const loadPromise = this.loadEngineImplementation(language);
    this.preloadPromises.set(engineKey, loadPromise);

    try {
      const engine = await loadPromise;
      this.loadedEngines.add(engineKey);
      this.cacheEngine(engineKey, engine);
      return engine;
    } finally {
      this.preloadPromises.delete(engineKey);
    }
  }

  private async loadEngineImplementation(language: SupportedLanguage): Promise<any> {
    const startTime = performance.now();
    
    try {
      let engine;
      
      switch (language) {
        case 'python':
          engine = await this.loadPyodideEngine();
          break;
        case 'sql':
          engine = await this.loadSQLEngine();
          break;
        case 'javascript':
        case 'typescript':
        case 'html':
        case 'css':
          engine = await this.loadWebEngine();
          break;
        default:
          engine = await this.loadGenericEngine(language);
      }

      const loadTime = performance.now() - startTime;
      console.log(`✓ Loaded ${language} engine in ${loadTime.toFixed(2)}ms`);
      
      return engine;
    } catch (error) {
      console.error(`Failed to load ${language} engine:`, error);
      throw error;
    }
  }

  private async loadPyodideEngine(): Promise<any> {
    // Use CDN if enabled
    const pyodideUrl = this.config.enableCDN 
      ? `${this.config.cdnBaseUrl}/pyodide/v0.24.1/full/pyodide.js`
      : '/pyodide/pyodide.js';

    // Check cache first
    const cacheKey = 'pyodide_script';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = pyodideUrl;
      script.onload = async () => {
        try {
          const pyodide = await (window as any).loadPyodide({
            indexURL: this.config.enableCDN 
              ? `${this.config.cdnBaseUrl}/pyodide/v0.24.1/full/`
              : '/pyodide/',
            stdout: (text: string) => console.log(text),
            stderr: (text: string) => console.error(text)
          });
          
          this.setCache(cacheKey, pyodide, 60 * 60 * 1000); // Cache for 1 hour
          resolve(pyodide);
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private async loadSQLEngine(): Promise<any> {
    const sqlUrl = this.config.enableCDN
      ? `${this.config.cdnBaseUrl}/sql.js@1.8.0/dist/sql-wasm.js`
      : '/sql.js/sql-wasm.js';

    const cacheKey = 'sql_engine';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const { default: initSqlJs } = await import(sqlUrl);
    const SQL = await initSqlJs({
      locateFile: (file: string) => this.config.enableCDN
        ? `${this.config.cdnBaseUrl}/sql.js@1.8.0/dist/${file}`
        : `/sql.js/${file}`
    });

    this.setCache(cacheKey, SQL, 60 * 60 * 1000);
    return SQL;
  }

  private async loadWebEngine(): Promise<any> {
    // Web engine is lightweight and doesn't need external dependencies
    const engine = {
      execute: (code: string) => {
        // Implementation would be here
        return Promise.resolve({ success: true, output: 'Web engine loaded' });
      }
    };

    this.setCache('web_engine', engine, 60 * 60 * 1000);
    return engine;
  }

  private async loadGenericEngine(language: SupportedLanguage): Promise<any> {
    // Generic engine for languages that don't need special loading
    const engine = {
      language,
      execute: (code: string) => {
        return Promise.resolve({ 
          success: true, 
          output: `Generic engine for ${language}` 
        });
      }
    };

    this.setCache(`generic_engine_${language}`, engine, 60 * 60 * 1000);
    return engine;
  }

  private async preloadCriticalEngines(): Promise<void> {
    const preloadPromises = this.config.preloadLanguages.map(language => 
      this.loadEngine(language).catch(error => {
        console.warn(`Failed to preload ${language} engine:`, error);
      })
    );

    await Promise.allSettled(preloadPromises);
    console.log('✓ Critical engines preloaded');
  }

  // Caching Implementation

  public setCache<T>(key: string, data: T, ttl?: number): void {
    if (!this.config.enableCaching) return;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTTL,
      size: this.estimateSize(data)
    };

    // Check cache size limits
    if (this.getCacheSize() + entry.size > this.config.cacheMaxSize) {
      this.evictOldEntries();
    }

    this.cache.set(key, entry);
  }

  public getFromCache<T>(key: string): T | null {
    if (!this.config.enableCaching) return null;

    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheStats(): {
    size: number;
    entries: number;
    hitRate: number;
    memoryUsage: string;
  } {
    const size = this.getCacheSize();
    const entries = this.cache.size;
    
    return {
      size,
      entries,
      hitRate: 0, // Would track hits/misses in production
      memoryUsage: this.formatBytes(size)
    };
  }

  private getCacheSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  private evictOldEntries(): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  private estimateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 1024; // Default estimate
    }
  }

  private setupCacheCleanup(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  // Code Compilation Caching

  public cacheCompiledCode(code: string, language: SupportedLanguage, result: any): void {
    const cacheKey = `compiled_${language}_${this.hashCode(code)}`;
    this.setCache(cacheKey, result, 10 * 60 * 1000); // Cache for 10 minutes
  }

  public getCachedCompiledCode(code: string, language: SupportedLanguage): any | null {
    const cacheKey = `compiled_${language}_${this.hashCode(code)}`;
    return this.getFromCache(cacheKey);
  }

  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Service Worker for Offline Capabilities

  private async initializeServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.serviceWorker = registration.active;
      
      console.log('✓ Service Worker registered for offline capabilities');
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('Service Worker update available');
      });
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }

  public async cacheForOffline(urls: string[]): Promise<void> {
    if (!this.serviceWorker) return;

    try {
      const cache = await caches.open('code-execution-v1');
      await cache.addAll(urls);
      console.log('✓ Resources cached for offline use');
    } catch (error) {
      console.warn('Failed to cache resources:', error);
    }
  }

  // Performance Monitoring

  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('code-execution')) {
            console.log(`Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  public measurePerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `${name}-duration`;

    if (typeof performance !== 'undefined') {
      performance.mark(startMark);
    }

    return fn().finally(() => {
      if (typeof performance !== 'undefined') {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
      }
    });
  }

  // Resource Optimization

  public async optimizeResources(): Promise<void> {
    // Preload critical resources
    await this.preloadCriticalResources();
    
    // Optimize images and assets
    this.optimizeAssets();
    
    // Set up resource hints
    this.addResourceHints();
  }

  private async preloadCriticalResources(): Promise<void> {
    const criticalResources = [
      '/fonts/code-font.woff2',
      '/css/syntax-highlighting.css'
    ];

    const preloadPromises = criticalResources.map(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = url.endsWith('.woff2') ? 'font' : 'style';
      if (url.endsWith('.woff2')) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);

      return new Promise((resolve) => {
        link.onload = resolve;
        link.onerror = resolve; // Don't fail on missing resources
      });
    });

    await Promise.allSettled(preloadPromises);
  }

  private optimizeAssets(): void {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  }

  private addResourceHints(): void {
    const hints = [
      { rel: 'dns-prefetch', href: '//cdn.jsdelivr.net' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }
    ];

    hints.forEach(({ rel, href, crossorigin }) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (crossorigin) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });
  }

  // Utility Methods

  private getCachedEngine(engineKey: string): any {
    return this.getFromCache(engineKey);
  }

  private cacheEngine(engineKey: string, engine: any): void {
    this.setCache(engineKey, engine, 60 * 60 * 1000); // Cache for 1 hour
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Public API

  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  public async warmupSystem(): Promise<void> {
    console.log('🚀 Warming up code execution system...');
    
    await Promise.all([
      this.preloadCriticalEngines(),
      this.optimizeResources(),
      this.cacheForOffline([
        '/',
        '/manifest.json',
        '/offline.html'
      ])
    ]);
    
    console.log('✅ System warmup complete');
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();