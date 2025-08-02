/**
 * Resource Monitor for Code Execution System
 * Tracks and enforces resource limits and execution monitoring
 */

export interface ResourceUsage {
  executionTime: number;
  memoryUsage: number;
  cpuUsage?: number;
  networkRequests: number;
  storageUsage: number;
}

export interface ResourceLimits {
  maxExecutionTime: number;
  maxMemoryUsage: number;
  maxCpuUsage?: number;
  maxNetworkRequests: number;
  maxStorageUsage: number;
  maxConcurrentExecutions: number;
}

export interface ExecutionMetrics {
  id: string;
  language: string;
  startTime: number;
  endTime?: number;
  resourceUsage: ResourceUsage;
  violations: string[];
  status: 'running' | 'completed' | 'failed' | 'terminated';
}

export class ResourceMonitor {
  private static instance: ResourceMonitor;
  private activeExecutions: Map<string, ExecutionMetrics> = new Map();
  private executionHistory: ExecutionMetrics[] = [];
  private performanceObserver?: PerformanceObserver;
  private memoryCheckInterval?: NodeJS.Timeout;

  private constructor() {
    this.initializeMonitoring();
  }

  public static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }

  private initializeMonitoring(): void {
    // Set up Performance Observer for monitoring
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name.startsWith('code-execution-')) {
              const executionId = entry.name.replace('code-execution-', '');
              this.updateExecutionMetrics(executionId, {
                executionTime: entry.duration
              });
            }
          });
        });

        this.performanceObserver.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('Performance Observer not available:', error);
      }
    }

    // Set up memory monitoring
    this.startMemoryMonitoring();
  }

  private startMemoryMonitoring(): void {
    if ('memory' in performance) {
      this.memoryCheckInterval = setInterval(() => {
        const memoryInfo = (performance as any).memory;
        
        // Check all active executions for memory violations
        this.activeExecutions.forEach((metrics, id) => {
          const currentMemory = memoryInfo.usedJSHeapSize;
          metrics.resourceUsage.memoryUsage = currentMemory;
          
          // Check for memory limit violations
          const limits = this.getResourceLimits(metrics.language);
          if (currentMemory > limits.maxMemoryUsage) {
            metrics.violations.push(`Memory limit exceeded: ${currentMemory} > ${limits.maxMemoryUsage}`);
            this.terminateExecution(id, 'Memory limit exceeded');
          }
        });
      }, 1000); // Check every second
    }
  }

  /**
   * Start monitoring an execution
   */
  public startExecution(id: string, language: string): void {
    const metrics: ExecutionMetrics = {
      id,
      language,
      startTime: Date.now(),
      resourceUsage: {
        executionTime: 0,
        memoryUsage: 0,
        networkRequests: 0,
        storageUsage: 0
      },
      violations: [],
      status: 'running'
    };

    this.activeExecutions.set(id, metrics);

    // Start performance measurement
    if (typeof window !== 'undefined' && 'performance' in window && 'mark' in performance) {
      performance.mark(`code-execution-${id}-start`);
    }

    // Set up execution timeout
    const limits = this.getResourceLimits(language);
    setTimeout(() => {
      if (this.activeExecutions.has(id)) {
        this.terminateExecution(id, 'Execution timeout');
      }
    }, limits.maxExecutionTime);
  }

  /**
   * End monitoring an execution
   */
  public endExecution(id: string, success: boolean = true): ExecutionMetrics | null {
    const metrics = this.activeExecutions.get(id);
    if (!metrics) {
      return null;
    }

    metrics.endTime = Date.now();
    metrics.status = success ? 'completed' : 'failed';
    metrics.resourceUsage.executionTime = metrics.endTime - metrics.startTime;

    // End performance measurement
    if (typeof window !== 'undefined' && 'performance' in window && 'mark' in performance && 'measure' in performance) {
      try {
        performance.mark(`code-execution-${id}-end`);
        performance.measure(
          `code-execution-${id}`,
          `code-execution-${id}-start`,
          `code-execution-${id}-end`
        );
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }

    // Move to history
    this.executionHistory.push({ ...metrics });
    this.activeExecutions.delete(id);

    // Keep only last 100 executions in history
    if (this.executionHistory.length > 100) {
      this.executionHistory = this.executionHistory.slice(-100);
    }

    return metrics;
  }

  /**
   * Terminate an execution
   */
  public terminateExecution(id: string, reason: string): void {
    const metrics = this.activeExecutions.get(id);
    if (metrics) {
      metrics.status = 'terminated';
      metrics.violations.push(`Terminated: ${reason}`);
      this.endExecution(id, false);
    }
  }

  /**
   * Update execution metrics
   */
  public updateExecutionMetrics(id: string, updates: Partial<ResourceUsage>): void {
    const metrics = this.activeExecutions.get(id);
    if (metrics) {
      Object.assign(metrics.resourceUsage, updates);
    }
  }

  /**
   * Get current resource usage for an execution
   */
  public getResourceUsage(id: string): ResourceUsage | null {
    const metrics = this.activeExecutions.get(id);
    return metrics ? metrics.resourceUsage : null;
  }

  /**
   * Get resource limits for a language
   */
  public getResourceLimits(language: string): ResourceLimits {
    const limits: Record<string, ResourceLimits> = {
      javascript: {
        maxExecutionTime: 10000, // 10 seconds
        maxMemoryUsage: 50 * 1024 * 1024, // 50MB
        maxNetworkRequests: 0,
        maxStorageUsage: 0,
        maxConcurrentExecutions: 3
      },
      typescript: {
        maxExecutionTime: 10000,
        maxMemoryUsage: 50 * 1024 * 1024,
        maxNetworkRequests: 0,
        maxStorageUsage: 0,
        maxConcurrentExecutions: 3
      },
      html: {
        maxExecutionTime: 5000,
        maxMemoryUsage: 25 * 1024 * 1024,
        maxNetworkRequests: 0,
        maxStorageUsage: 0,
        maxConcurrentExecutions: 5
      },
      css: {
        maxExecutionTime: 5000,
        maxMemoryUsage: 25 * 1024 * 1024,
        maxNetworkRequests: 0,
        maxStorageUsage: 0,
        maxConcurrentExecutions: 5
      },
      python: {
        maxExecutionTime: 30000, // 30 seconds
        maxMemoryUsage: 100 * 1024 * 1024, // 100MB
        maxNetworkRequests: 0,
        maxStorageUsage: 0,
        maxConcurrentExecutions: 2
      },
      sql: {
        maxExecutionTime: 15000,
        maxMemoryUsage: 50 * 1024 * 1024,
        maxNetworkRequests: 0,
        maxStorageUsage: 10 * 1024 * 1024, // 10MB for database
        maxConcurrentExecutions: 3
      }
    };

    return limits[language] || limits.javascript;
  }

  /**
   * Check if concurrent execution limit is exceeded
   */
  public canStartExecution(language: string): boolean {
    const limits = this.getResourceLimits(language);
    const activeCount = Array.from(this.activeExecutions.values())
      .filter(metrics => metrics.language === language && metrics.status === 'running')
      .length;
    
    return activeCount < limits.maxConcurrentExecutions;
  }

  /**
   * Get active executions
   */
  public getActiveExecutions(): ExecutionMetrics[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get execution history
   */
  public getExecutionHistory(): ExecutionMetrics[] {
    return [...this.executionHistory];
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): {
    totalExecutions: number;
    averageExecutionTime: number;
    successRate: number;
    violationRate: number;
    memoryUsageStats: {
      average: number;
      peak: number;
    };
  } {
    const history = this.executionHistory;
    const totalExecutions = history.length;
    
    if (totalExecutions === 0) {
      return {
        totalExecutions: 0,
        averageExecutionTime: 0,
        successRate: 0,
        violationRate: 0,
        memoryUsageStats: { average: 0, peak: 0 }
      };
    }

    const successfulExecutions = history.filter(m => m.status === 'completed').length;
    const executionsWithViolations = history.filter(m => m.violations.length > 0).length;
    
    const totalExecutionTime = history.reduce((sum, m) => sum + m.resourceUsage.executionTime, 0);
    const averageExecutionTime = totalExecutionTime / totalExecutions;
    
    const memoryUsages = history.map(m => m.resourceUsage.memoryUsage).filter(m => m > 0);
    const averageMemory = memoryUsages.length > 0 ? 
      memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length : 0;
    const peakMemory = memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0;

    return {
      totalExecutions,
      averageExecutionTime,
      successRate: successfulExecutions / totalExecutions,
      violationRate: executionsWithViolations / totalExecutions,
      memoryUsageStats: {
        average: averageMemory,
        peak: peakMemory
      }
    };
  }

  /**
   * Clear execution history
   */
  public clearHistory(): void {
    this.executionHistory = [];
  }

  /**
   * Cleanup and destroy the monitor
   */
  public destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    
    this.activeExecutions.clear();
    this.executionHistory = [];
  }
}

// Export singleton instance getter (lazy initialization)
export const getResourceMonitor = () => ResourceMonitor.getInstance();