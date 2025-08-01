/**
 * Execution Controller
 * Advanced execution control with timeouts, cancellation, and monitoring
 */

export interface ExecutionController {
  id: string;
  language: string;
  startTime: number;
  timeout: number;
  abortController: AbortController;
  timeoutId: NodeJS.Timeout;
  status: 'running' | 'completed' | 'cancelled' | 'timeout' | 'error';
  onCancel?: () => void;
  onTimeout?: () => void;
}

export interface ExecutionLimits {
  maxExecutionTime: number;
  maxMemoryUsage: number;
  maxConcurrentExecutions: number;
  maxOutputSize: number;
  maxCpuUsage?: number;
}

export class ExecutionManager {
  private static instance: ExecutionManager;
  private activeExecutions: Map<string, ExecutionController> = new Map();
  private executionQueue: Array<{ id: string; priority: number; execute: () => Promise<void> }> = [];
  private isProcessingQueue = false;
  private performanceMonitor?: PerformanceObserver;

  private constructor() {
    this.initializePerformanceMonitoring();
    this.startQueueProcessor();
  }

  public static getInstance(): ExecutionManager {
    if (!ExecutionManager.instance) {
      ExecutionManager.instance = new ExecutionManager();
    }
    return ExecutionManager.instance;
  }

  private initializePerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.performanceMonitor = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name.startsWith('execution-')) {
              const executionId = entry.name.replace('execution-', '');
              const controller = this.activeExecutions.get(executionId);
              if (controller) {
                // Update performance metrics
                console.log(`Execution ${executionId} performance:`, {
                  duration: entry.duration,
                  startTime: entry.startTime
                });
              }
            }
          });
        });

        this.performanceMonitor.observe({ 
          entryTypes: ['measure', 'navigation', 'resource'] 
        });
      } catch (error) {
        console.warn('Performance monitoring not available:', error);
      }
    }
  }

  /**
   * Create and start an execution with timeout and cancellation support
   */
  public async startExecution(
    id: string,
    language: string,
    executeFunction: () => Promise<any>,
    options: {
      timeout?: number;
      priority?: number;
      onCancel?: () => void;
      onTimeout?: () => void;
    } = {}
  ): Promise<any> {
    const {
      timeout = this.getDefaultTimeout(language),
      priority = 0,
      onCancel,
      onTimeout
    } = options;

    // Check concurrent execution limits
    const limits = this.getExecutionLimits(language);
    const activeCount = this.getActiveExecutionCount(language);
    
    if (activeCount >= limits.maxConcurrentExecutions) {
      // Queue the execution
      return new Promise((resolve, reject) => {
        this.executionQueue.push({
          id,
          priority,
          execute: async () => {
            try {
              const result = await this.executeWithController(
                id, language, executeFunction, { timeout, onCancel, onTimeout }
              );
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }
        });
        
        // Sort queue by priority (higher priority first)
        this.executionQueue.sort((a, b) => b.priority - a.priority);
      });
    }

    return this.executeWithController(id, language, executeFunction, {
      timeout, onCancel, onTimeout
    });
  }

  private async executeWithController(
    id: string,
    language: string,
    executeFunction: () => Promise<any>,
    options: {
      timeout: number;
      onCancel?: () => void;
      onTimeout?: () => void;
    }
  ): Promise<any> {
    const { timeout, onCancel, onTimeout } = options;
    const abortController = new AbortController();
    
    // Create execution controller
    const controller: ExecutionController = {
      id,
      language,
      startTime: Date.now(),
      timeout,
      abortController,
      timeoutId: setTimeout(() => {
        this.handleTimeout(id);
      }, timeout),
      status: 'running',
      onCancel,
      onTimeout
    };

    this.activeExecutions.set(id, controller);

    // Start performance measurement
    if (typeof window !== 'undefined' && 'performance' in window && 'mark' in performance) {
      performance.mark(`execution-${id}-start`);
    }

    try {
      // Execute with abort signal
      const result = await Promise.race([
        executeFunction(),
        this.createAbortPromise(abortController.signal)
      ]);

      // Successful completion
      controller.status = 'completed';
      clearTimeout(controller.timeoutId);
      
      // End performance measurement
      if (typeof window !== 'undefined' && 'performance' in window && 'measure' in performance) {
        try {
          performance.mark(`execution-${id}-end`);
          performance.measure(`execution-${id}`, `execution-${id}-start`, `execution-${id}-end`);
        } catch (error) {
          console.warn('Performance measurement failed:', error);
        }
      }

      return result;

    } catch (error) {
      // Handle different error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          controller.status = 'cancelled';
        } else if (error.message.includes('timeout')) {
          controller.status = 'timeout';
        } else {
          controller.status = 'error';
        }
      }
      
      clearTimeout(controller.timeoutId);
      throw error;

    } finally {
      // Cleanup
      this.activeExecutions.delete(id);
      this.processQueue();
    }
  }

  /**
   * Cancel an execution
   */
  public cancelExecution(id: string): boolean {
    const controller = this.activeExecutions.get(id);
    if (!controller) {
      return false;
    }

    controller.status = 'cancelled';
    controller.abortController.abort();
    clearTimeout(controller.timeoutId);
    
    if (controller.onCancel) {
      controller.onCancel();
    }

    this.activeExecutions.delete(id);
    this.processQueue();
    
    return true;
  }

  /**
   * Cancel all executions for a specific language
   */
  public cancelExecutionsByLanguage(language: string): number {
    let cancelledCount = 0;
    
    for (const [id, controller] of this.activeExecutions.entries()) {
      if (controller.language === language) {
        this.cancelExecution(id);
        cancelledCount++;
      }
    }
    
    return cancelledCount;
  }

  /**
   * Cancel all active executions
   */
  public cancelAllExecutions(): number {
    const count = this.activeExecutions.size;
    
    for (const id of this.activeExecutions.keys()) {
      this.cancelExecution(id);
    }
    
    return count;
  }

  /**
   * Get active execution count for a language
   */
  public getActiveExecutionCount(language?: string): number {
    if (!language) {
      return this.activeExecutions.size;
    }
    
    return Array.from(this.activeExecutions.values())
      .filter(controller => controller.language === language)
      .length;
  }

  /**
   * Get active executions
   */
  public getActiveExecutions(): ExecutionController[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): {
    queueLength: number;
    isProcessing: boolean;
    nextExecution?: string;
  } {
    return {
      queueLength: this.executionQueue.length,
      isProcessing: this.isProcessingQueue,
      nextExecution: this.executionQueue[0]?.id
    };
  }

  /**
   * Get execution limits for a language
   */
  public getExecutionLimits(language: string): ExecutionLimits {
    const limits: Record<string, ExecutionLimits> = {
      javascript: {
        maxExecutionTime: 10000, // 10 seconds
        maxMemoryUsage: 50 * 1024 * 1024, // 50MB
        maxConcurrentExecutions: 3,
        maxOutputSize: 10000, // 10k characters
        maxCpuUsage: 80 // 80% CPU
      },
      typescript: {
        maxExecutionTime: 10000,
        maxMemoryUsage: 50 * 1024 * 1024,
        maxConcurrentExecutions: 3,
        maxOutputSize: 10000,
        maxCpuUsage: 80
      },
      html: {
        maxExecutionTime: 5000,
        maxMemoryUsage: 25 * 1024 * 1024,
        maxConcurrentExecutions: 5,
        maxOutputSize: 50000, // HTML can be larger
        maxCpuUsage: 60
      },
      css: {
        maxExecutionTime: 5000,
        maxMemoryUsage: 25 * 1024 * 1024,
        maxConcurrentExecutions: 5,
        maxOutputSize: 50000,
        maxCpuUsage: 60
      },
      python: {
        maxExecutionTime: 30000, // 30 seconds
        maxMemoryUsage: 100 * 1024 * 1024, // 100MB
        maxConcurrentExecutions: 2,
        maxOutputSize: 20000,
        maxCpuUsage: 90
      },
      sql: {
        maxExecutionTime: 15000,
        maxMemoryUsage: 50 * 1024 * 1024,
        maxConcurrentExecutions: 3,
        maxOutputSize: 15000,
        maxCpuUsage: 70
      }
    };

    return limits[language] || limits.javascript;
  }

  /**
   * Monitor system resources
   */
  public getSystemResourceUsage(): {
    memoryUsage?: {
      used: number;
      total: number;
      percentage: number;
    };
    cpuUsage?: number;
    activeExecutions: number;
    queuedExecutions: number;
  } {
    let memoryUsage;
    
    // Get memory usage if available
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memInfo = (performance as any).memory;
      memoryUsage = {
        used: memInfo.usedJSHeapSize,
        total: memInfo.totalJSHeapSize,
        percentage: (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100
      };
    }

    return {
      memoryUsage,
      activeExecutions: this.activeExecutions.size,
      queuedExecutions: this.executionQueue.length
    };
  }

  // Private methods

  private handleTimeout(id: string): void {
    const controller = this.activeExecutions.get(id);
    if (!controller) return;

    controller.status = 'timeout';
    controller.abortController.abort();
    
    if (controller.onTimeout) {
      controller.onTimeout();
    }

    this.activeExecutions.delete(id);
    this.processQueue();
  }

  private createAbortPromise(signal: AbortSignal): Promise<never> {
    return new Promise((_, reject) => {
      signal.addEventListener('abort', () => {
        reject(new Error('Execution was cancelled'));
      });
    });
  }

  private getDefaultTimeout(language: string): number {
    const limits = this.getExecutionLimits(language);
    return limits.maxExecutionTime;
  }

  private startQueueProcessor(): void {
    // Process queue every 100ms
    setInterval(() => {
      this.processQueue();
    }, 100);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Check if we can start more executions
      const nextExecution = this.executionQueue[0];
      if (nextExecution) {
        const limits = this.getExecutionLimits('javascript'); // Default limits for queue check
        const totalActive = this.activeExecutions.size;
        
        if (totalActive < limits.maxConcurrentExecutions * 2) { // Allow some buffer
          const execution = this.executionQueue.shift();
          if (execution) {
            // Execute without awaiting to allow concurrent processing
            execution.execute().catch(error => {
              console.error(`Queued execution ${execution.id} failed:`, error);
            });
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Cleanup and destroy the manager
   */
  public destroy(): void {
    // Cancel all active executions
    this.cancelAllExecutions();
    
    // Clear queue
    this.executionQueue = [];
    
    // Disconnect performance observer
    if (this.performanceMonitor) {
      this.performanceMonitor.disconnect();
    }
  }
}

// Export singleton instance
export const executionManager = ExecutionManager.getInstance();