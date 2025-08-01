/**
 * Performance Metrics Collector
 * Comprehensive performance monitoring and analytics for code execution
 */

export interface PerformanceMetric {
  id: string;
  timestamp: number;
  executionId: string;
  language: string;
  metricType: 'execution' | 'memory' | 'cpu' | 'network' | 'error';
  value: number;
  unit: string;
  metadata?: Record<string, any>;
}

export interface ExecutionPerformanceData {
  executionId: string;
  language: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
  };
  cpuUsage?: number;
  codeSize: number;
  outputSize: number;
  success: boolean;
  errorType?: string;
  violations: string[];
}

export interface PerformanceStats {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  medianExecutionTime: number;
  averageMemoryUsage: number;
  peakMemoryUsage: number;
  errorRate: number;
  violationRate: number;
  languageStats: Record<string, {
    executions: number;
    averageTime: number;
    successRate: number;
    averageMemory: number;
  }>;
  timeSeriesData: Array<{
    timestamp: number;
    executions: number;
    averageTime: number;
    memoryUsage: number;
  }>;
}

export class PerformanceMetricsCollector {
  private static instance: PerformanceMetricsCollector;
  private metrics: PerformanceMetric[] = [];
  private executionData: Map<string, ExecutionPerformanceData> = new Map();
  private metricsBuffer: PerformanceMetric[] = [];
  private flushInterval?: NodeJS.Timeout;
  private memoryMonitorInterval?: NodeJS.Timeout;
  private performanceObserver?: PerformanceObserver;

  private constructor() {
    this.initializeMonitoring();
    this.startPeriodicCollection();
  }

  public static getInstance(): PerformanceMetricsCollector {
    if (!PerformanceMetricsCollector.instance) {
      PerformanceMetricsCollector.instance = new PerformanceMetricsCollector();
    }
    return PerformanceMetricsCollector.instance;
  }

  private initializeMonitoring(): void {
    // Set up Performance Observer
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name.startsWith('code-execution-')) {
              const executionId = entry.name.replace('code-execution-', '');
              this.recordMetric({
                executionId,
                metricType: 'execution',
                value: entry.duration,
                unit: 'ms',
                metadata: {
                  entryType: entry.entryType,
                  startTime: entry.startTime
                }
              });
            }
          });
        });

        this.performanceObserver.observe({ 
          entryTypes: ['measure', 'navigation', 'resource', 'paint'] 
        });
      } catch (error) {
        console.warn('Performance Observer not available:', error);
      }
    }

    // Set up memory monitoring
    this.startMemoryMonitoring();
  }

  private startMemoryMonitoring(): void {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      this.memoryMonitorInterval = setInterval(() => {
        const memoryInfo = (performance as any).memory;
        
        this.recordMetric({
          executionId: 'system',
          metricType: 'memory',
          value: memoryInfo.usedJSHeapSize,
          unit: 'bytes',
          metadata: {
            totalJSHeapSize: memoryInfo.totalJSHeapSize,
            jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
            percentage: (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100
          }
        });
      }, 1000); // Every second
    }
  }

  private startPeriodicCollection(): void {
    // Flush metrics buffer every 5 seconds
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 5000);
  }

  /**
   * Start tracking an execution
   */
  public startExecution(
    executionId: string, 
    language: string, 
    codeSize: number
  ): void {
    const initialMemory = this.getCurrentMemoryUsage();
    
    const executionData: ExecutionPerformanceData = {
      executionId,
      language,
      startTime: Date.now(),
      memoryUsage: {
        initial: initialMemory,
        peak: initialMemory,
        final: 0
      },
      codeSize,
      outputSize: 0,
      success: false,
      violations: []
    };

    this.executionData.set(executionId, executionData);

    // Start performance measurement
    if (typeof window !== 'undefined' && 'performance' in window && 'mark' in performance) {
      performance.mark(`code-execution-${executionId}-start`);
    }

    this.recordMetric({
      executionId,
      metricType: 'execution',
      value: 0,
      unit: 'start',
      metadata: {
        language,
        codeSize,
        timestamp: Date.now()
      }
    });
  }

  /**
   * End tracking an execution
   */
  public endExecution(
    executionId: string,
    success: boolean,
    outputSize: number = 0,
    errorType?: string,
    violations: string[] = []
  ): ExecutionPerformanceData | null {
    const executionData = this.executionData.get(executionId);
    if (!executionData) {
      return null;
    }

    const endTime = Date.now();
    const finalMemory = this.getCurrentMemoryUsage();

    executionData.endTime = endTime;
    executionData.duration = endTime - executionData.startTime;
    executionData.memoryUsage.final = finalMemory;
    executionData.outputSize = outputSize;
    executionData.success = success;
    executionData.errorType = errorType;
    executionData.violations = violations;

    // End performance measurement
    if (typeof window !== 'undefined' && 'performance' in window && 'measure' in performance) {
      try {
        performance.mark(`code-execution-${executionId}-end`);
        performance.measure(
          `code-execution-${executionId}`,
          `code-execution-${executionId}-start`,
          `code-execution-${executionId}-end`
        );
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }

    // Record final metrics
    this.recordMetric({
      executionId,
      metricType: 'execution',
      value: executionData.duration,
      unit: 'ms',
      metadata: {
        language: executionData.language,
        success,
        memoryUsed: finalMemory - executionData.memoryUsage.initial,
        outputSize,
        errorType,
        violations: violations.length
      }
    });

    // Move to historical data
    this.executionData.delete(executionId);
    
    return executionData;
  }

  /**
   * Update memory peak for an execution
   */
  public updateMemoryPeak(executionId: string): void {
    const executionData = this.executionData.get(executionId);
    if (executionData) {
      const currentMemory = this.getCurrentMemoryUsage();
      if (currentMemory > executionData.memoryUsage.peak) {
        executionData.memoryUsage.peak = currentMemory;
      }
    }
  }

  /**
   * Record a custom metric
   */
  public recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      id: this.generateMetricId(),
      timestamp: Date.now(),
      ...metric
    };

    this.metricsBuffer.push(fullMetric);

    // If buffer is getting large, flush immediately
    if (this.metricsBuffer.length > 100) {
      this.flushMetrics();
    }
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(timeRange?: { start: number; end: number }): PerformanceStats {
    let relevantMetrics = this.metrics;
    
    if (timeRange) {
      relevantMetrics = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    const executionMetrics = relevantMetrics.filter(m => m.metricType === 'execution' && m.unit === 'ms');
    const totalExecutions = executionMetrics.length;
    
    if (totalExecutions === 0) {
      return this.getEmptyStats();
    }

    // Calculate basic stats
    const executionTimes = executionMetrics.map(m => m.value);
    const successfulExecutions = executionMetrics.filter(
      m => m.metadata?.success === true
    ).length;
    
    const averageExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / totalExecutions;
    const sortedTimes = [...executionTimes].sort((a, b) => a - b);
    const medianExecutionTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
    
    // Memory stats
    const memoryMetrics = relevantMetrics.filter(m => m.metricType === 'memory');
    const memoryValues = memoryMetrics.map(m => m.value);
    const averageMemoryUsage = memoryValues.length > 0 ? 
      memoryValues.reduce((sum, mem) => sum + mem, 0) / memoryValues.length : 0;
    const peakMemoryUsage = memoryValues.length > 0 ? Math.max(...memoryValues) : 0;

    // Error and violation stats
    const errorExecutions = executionMetrics.filter(m => m.metadata?.success === false).length;
    const violationExecutions = executionMetrics.filter(
      m => m.metadata?.violations && m.metadata.violations > 0
    ).length;

    // Language-specific stats
    const languageStats: Record<string, any> = {};
    const languageGroups = this.groupBy(executionMetrics, m => m.metadata?.language || 'unknown');
    
    for (const [language, metrics] of Object.entries(languageGroups)) {
      const langTimes = metrics.map(m => m.value);
      const langSuccessful = metrics.filter(m => m.metadata?.success === true).length;
      const langMemory = metrics
        .map(m => m.metadata?.memoryUsed || 0)
        .filter(m => m > 0);
      
      languageStats[language] = {
        executions: metrics.length,
        averageTime: langTimes.reduce((sum, time) => sum + time, 0) / langTimes.length,
        successRate: langSuccessful / metrics.length,
        averageMemory: langMemory.length > 0 ? 
          langMemory.reduce((sum, mem) => sum + mem, 0) / langMemory.length : 0
      };
    }

    // Time series data (hourly buckets)
    const timeSeriesData = this.generateTimeSeriesData(executionMetrics);

    return {
      totalExecutions,
      successRate: successfulExecutions / totalExecutions,
      averageExecutionTime,
      medianExecutionTime,
      averageMemoryUsage,
      peakMemoryUsage,
      errorRate: errorExecutions / totalExecutions,
      violationRate: violationExecutions / totalExecutions,
      languageStats,
      timeSeriesData
    };
  }

  /**
   * Get real-time metrics
   */
  public getRealTimeMetrics(): {
    activeExecutions: number;
    currentMemoryUsage: number;
    memoryPercentage: number;
    recentExecutionTime: number;
    recentSuccessRate: number;
  } {
    const currentMemory = this.getCurrentMemoryUsage();
    const memoryPercentage = this.getMemoryPercentage();
    
    // Get metrics from last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const recentMetrics = this.metrics.filter(
      m => m.timestamp >= fiveMinutesAgo && m.metricType === 'execution' && m.unit === 'ms'
    );
    
    const recentExecutionTime = recentMetrics.length > 0 ?
      recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length : 0;
    
    const recentSuccessful = recentMetrics.filter(m => m.metadata?.success === true).length;
    const recentSuccessRate = recentMetrics.length > 0 ? 
      recentSuccessful / recentMetrics.length : 1;

    return {
      activeExecutions: this.executionData.size,
      currentMemoryUsage: currentMemory,
      memoryPercentage,
      recentExecutionTime,
      recentSuccessRate
    };
  }

  /**
   * Export metrics data
   */
  public exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportAsCSV();
    }
    
    return JSON.stringify({
      metrics: this.metrics,
      stats: this.getPerformanceStats(),
      exportTime: Date.now()
    }, null, 2);
  }

  /**
   * Clear all metrics data
   */
  public clearMetrics(): void {
    this.metrics = [];
    this.metricsBuffer = [];
    this.executionData.clear();
  }

  // Private methods

  private getCurrentMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private getMemoryPercentage(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memInfo = (performance as any).memory;
      return (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;
    }
    return 0;
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private flushMetrics(): void {
    if (this.metricsBuffer.length === 0) return;
    
    this.metrics.push(...this.metricsBuffer);
    this.metricsBuffer = [];
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private generateTimeSeriesData(metrics: PerformanceMetric[]): Array<{
    timestamp: number;
    executions: number;
    averageTime: number;
    memoryUsage: number;
  }> {
    // Group by hour
    const hourlyGroups = this.groupBy(metrics, m => {
      const hour = new Date(m.timestamp);
      hour.setMinutes(0, 0, 0);
      return hour.getTime().toString();
    });

    return Object.entries(hourlyGroups).map(([timestamp, hourMetrics]) => {
      const times = hourMetrics.map(m => m.value);
      const memoryValues = hourMetrics
        .map(m => m.metadata?.memoryUsed || 0)
        .filter(m => m > 0);
      
      return {
        timestamp: parseInt(timestamp),
        executions: hourMetrics.length,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
        memoryUsage: memoryValues.length > 0 ?
          memoryValues.reduce((sum, mem) => sum + mem, 0) / memoryValues.length : 0
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }

  private getEmptyStats(): PerformanceStats {
    return {
      totalExecutions: 0,
      successRate: 0,
      averageExecutionTime: 0,
      medianExecutionTime: 0,
      averageMemoryUsage: 0,
      peakMemoryUsage: 0,
      errorRate: 0,
      violationRate: 0,
      languageStats: {},
      timeSeriesData: []
    };
  }

  private exportAsCSV(): string {
    const headers = ['id', 'timestamp', 'executionId', 'language', 'metricType', 'value', 'unit'];
    const rows = this.metrics.map(metric => [
      metric.id,
      metric.timestamp,
      metric.executionId,
      metric.language,
      metric.metricType,
      metric.value,
      metric.unit
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Cleanup and destroy the collector
   */
  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    this.clearMetrics();
  }
}

// Export singleton instance
export const performanceMetrics = PerformanceMetricsCollector.getInstance();