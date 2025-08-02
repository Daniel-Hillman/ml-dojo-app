// Lazy loading utilities for code execution engines

interface EngineModule {
  execute: (code: string, options?: any) => Promise<any>;
  initialize?: () => Promise<void>;
  cleanup?: () => void;
}

interface LoadedEngine {
  module: EngineModule;
  loadTime: number;
  lastUsed: number;
}

class LazyEngineLoader {
  private loadedEngines = new Map<string, LoadedEngine>();
  private loadingPromises = new Map<string, Promise<EngineModule>>();
  private maxCacheSize = 5; // Maximum number of engines to keep in memory
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async loadEngine(language: string): Promise<EngineModule> {
    // Check if already loaded
    const cached = this.loadedEngines.get(language);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached.module;
    }

    // Check if currently loading
    const loadingPromise = this.loadingPromises.get(language);
    if (loadingPromise) {
      return loadingPromise;
    }

    // Start loading
    const promise = this.dynamicImport(language);
    this.loadingPromises.set(language, promise);

    try {
      const module = await promise;
      
      // Initialize if needed
      if (module.initialize) {
        await module.initialize();
      }

      // Cache the loaded module
      this.cacheEngine(language, module);
      
      // Clean up loading promise
      this.loadingPromises.delete(language);
      
      return module;
    } catch (error) {
      this.loadingPromises.delete(language);
      throw error;
    }
  }

  private async dynamicImport(language: string): Promise<EngineModule> {
    switch (language.toLowerCase()) {
      case 'python':
      case 'py':
        return import('../engines/python-engine').then(m => m.default || m);
      
      case 'javascript':
      case 'js':
        return import('../engines/web-engine').then(m => m.default || m);
      
      case 'typescript':
      case 'ts':
        return import('../engines/web-engine').then(m => ({
          ...m.default || m,
          execute: (code: string, options?: any) => (m.default || m).execute(code, { ...options, typescript: true })
        }));
      
      case 'html':
        return import('../engines/web-engine').then(m => ({
          ...m.default || m,
          execute: (code: string, options?: any) => (m.default || m).execute(code, { ...options, type: 'html' })
        }));
      
      case 'css':
        return import('../engines/web-engine').then(m => ({
          ...m.default || m,
          execute: (code: string, options?: any) => (m.default || m).execute(code, { ...options, type: 'css' })
        }));
      
      case 'sql':
        return import('../engines/sql-engine').then(m => m.default || m);
      
      case 'json':
        return import('../engines/json-engine').then(m => m.default || m);
      
      case 'yaml':
      case 'yml':
        return import('../engines/yaml-engine').then(m => m.default || m);
      
      case 'markdown':
      case 'md':
        return import('../engines/markdown-engine').then(m => m.default || m);
      
      case 'regex':
      case 'regexp':
        return import('../engines/regex-engine').then(m => m.default || m);
      
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private cacheEngine(language: string, module: EngineModule) {
    const now = Date.now();
    
    // Clean up old engines if cache is full
    if (this.loadedEngines.size >= this.maxCacheSize) {
      this.cleanupOldEngines();
    }

    this.loadedEngines.set(language, {
      module,
      loadTime: now,
      lastUsed: now
    });
  }

  private cleanupOldEngines() {
    const now = Date.now();
    const entries = Array.from(this.loadedEngines.entries());
    
    // Sort by last used time (oldest first)
    entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    
    // Remove oldest engines or those that haven't been used recently
    for (const [language, engine] of entries) {
      if (now - engine.lastUsed > this.cacheTimeout || this.loadedEngines.size > this.maxCacheSize) {
        if (engine.module.cleanup) {
          engine.module.cleanup();
        }
        this.loadedEngines.delete(language);
      }
      
      if (this.loadedEngines.size <= this.maxCacheSize) {
        break;
      }
    }
  }

  // Preload commonly used engines
  async preloadEngines(languages: string[]) {
    const preloadPromises = languages.map(lang => 
      this.loadEngine(lang).catch(error => {
        console.warn(`Failed to preload engine for ${lang}:`, error);
      })
    );
    
    await Promise.allSettled(preloadPromises);
  }

  // Get loading status
  getLoadingStatus() {
    return {
      loaded: Array.from(this.loadedEngines.keys()),
      loading: Array.from(this.loadingPromises.keys()),
      cacheSize: this.loadedEngines.size,
      maxCacheSize: this.maxCacheSize
    };
  }

  // Clear all cached engines
  clearCache() {
    for (const [language, engine] of this.loadedEngines) {
      if (engine.module.cleanup) {
        engine.module.cleanup();
      }
    }
    this.loadedEngines.clear();
    this.loadingPromises.clear();
  }

  // Update cache settings
  updateCacheSettings(maxSize: number, timeout: number) {
    this.maxCacheSize = maxSize;
    this.cacheTimeout = timeout;
    
    // Clean up if new max size is smaller
    if (this.loadedEngines.size > maxSize) {
      this.cleanupOldEngines();
    }
  }
}

// Singleton instance
export const lazyEngineLoader = new LazyEngineLoader();

// Hook for React components
export function useEngineLoader() {
  const [loadingEngines, setLoadingEngines] = React.useState<string[]>([]);
  const [loadedEngines, setLoadedEngines] = React.useState<string[]>([]);

  const loadEngine = async (language: string) => {
    setLoadingEngines(prev => [...prev, language]);
    
    try {
      await lazyEngineLoader.loadEngine(language);
      setLoadedEngines(prev => [...prev, language]);
    } finally {
      setLoadingEngines(prev => prev.filter(lang => lang !== language));
    }
  };

  const getStatus = () => lazyEngineLoader.getLoadingStatus();

  return {
    loadEngine,
    loadingEngines,
    loadedEngines,
    getStatus,
    preloadEngines: lazyEngineLoader.preloadEngines.bind(lazyEngineLoader),
    clearCache: lazyEngineLoader.clearCache.bind(lazyEngineLoader)
  };
}

// Performance monitoring
export class EnginePerformanceMonitor {
  private metrics = new Map<string, {
    loadTime: number;
    executionTimes: number[];
    errorCount: number;
    successCount: number;
  }>();

  recordLoad(language: string, loadTime: number) {
    const metric = this.metrics.get(language) || {
      loadTime: 0,
      executionTimes: [],
      errorCount: 0,
      successCount: 0
    };
    
    metric.loadTime = loadTime;
    this.metrics.set(language, metric);
  }

  recordExecution(language: string, executionTime: number, success: boolean) {
    const metric = this.metrics.get(language) || {
      loadTime: 0,
      executionTimes: [],
      errorCount: 0,
      successCount: 0
    };
    
    metric.executionTimes.push(executionTime);
    if (success) {
      metric.successCount++;
    } else {
      metric.errorCount++;
    }
    
    // Keep only last 100 execution times
    if (metric.executionTimes.length > 100) {
      metric.executionTimes = metric.executionTimes.slice(-100);
    }
    
    this.metrics.set(language, metric);
  }

  getMetrics(language?: string) {
    if (language) {
      return this.metrics.get(language);
    }
    
    const allMetrics: Record<string, any> = {};
    for (const [lang, metric] of this.metrics) {
      const avgExecutionTime = metric.executionTimes.length > 0
        ? metric.executionTimes.reduce((a, b) => a + b, 0) / metric.executionTimes.length
        : 0;
      
      allMetrics[lang] = {
        ...metric,
        avgExecutionTime,
        totalExecutions: metric.successCount + metric.errorCount,
        successRate: metric.successCount / (metric.successCount + metric.errorCount) || 0
      };
    }
    
    return allMetrics;
  }

  reset() {
    this.metrics.clear();
  }
}

export const performanceMonitor = new EnginePerformanceMonitor();