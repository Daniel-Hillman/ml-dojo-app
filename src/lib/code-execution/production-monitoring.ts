/**
 * Production Monitoring System for Live Code Execution
 * Provides comprehensive monitoring, alerting, and analytics
 */

interface MonitoringConfig {
  enableMetrics: boolean;
  enableAlerts: boolean;
  enableAnalytics: boolean;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    memoryUsage: number;
    concurrentExecutions: number;
  };
  metricsRetention: number; // days
}

interface ExecutionMetrics {
  timestamp: number;
  executionId: string;
  language: string;
  duration: number;
  success: boolean;
  errorType?: string;
  memoryUsage: number;
  codeSize: number;
  userId?: string;
  sessionId: string;
}

interface SystemMetrics {
  timestamp: number;
  activeExecutions: number;
  totalMemoryUsage: number;
  cpuUsage: number;
  errorRate: number;
  averageResponseTime: number;
  throughput: number; // executions per minute
}

interface Alert {
  id: string;
  type: 'error_rate' | 'performance' | 'resource' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  metadata: Record<string, any>;
}

class ProductionMonitor {
  private config: MonitoringConfig;
  private executionMetrics: ExecutionMetrics[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];
  private metricsInterval?: NodeJS.Timeout;
  private alertsInterval?: NodeJS.Timeout;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.startMonitoring();
  }

  private startMonitoring(): void {
    if (this.config.enableMetrics) {
      // Collect system metrics every 30 seconds
      this.metricsInterval = setInterval(() => {
        this.collectSystemMetrics();
      }, 30000);
    }

    if (this.config.enableAlerts) {
      // Check for alerts every minute
      this.alertsInterval = setInterval(() => {
        this.checkAlerts();
      }, 60000);
    }

    // Cleanup old metrics daily
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 24 * 60 * 60 * 1000);
  }

  recordExecution(metrics: ExecutionMetrics): void {
    if (!this.config.enableMetrics) return;

    this.executionMetrics.push(metrics);

    // Log execution for analytics
    if (this.config.enableAnalytics) {
      this.logAnalyticsEvent('code_execution', {
        language: metrics.language,
        duration: metrics.duration,
        success: metrics.success,
        codeSize: metrics.codeSize,
        userId: metrics.userId
      });
    }

    // Check for immediate alerts
    this.checkExecutionAlerts(metrics);
  }

  private collectSystemMetrics(): void {
    const now = Date.now();
    const recentExecutions = this.executionMetrics.filter(
      m => now - m.timestamp < 60000 // Last minute
    );

    const systemMetrics: SystemMetrics = {
      timestamp: now,
      activeExecutions: this.getActiveExecutions(),
      totalMemoryUsage: this.getTotalMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
      errorRate: this.calculateErrorRate(recentExecutions),
      averageResponseTime: this.calculateAverageResponseTime(recentExecutions),
      throughput: recentExecutions.length
    };

    this.systemMetrics.push(systemMetrics);

    // Log system metrics
    console.log('System Metrics:', {
      activeExecutions: systemMetrics.activeExecutions,
      errorRate: `${(systemMetrics.errorRate * 100).toFixed(2)}%`,
      avgResponseTime: `${systemMetrics.averageResponseTime.toFixed(2)}ms`,
      throughput: `${systemMetrics.throughput}/min`,
      memoryUsage: `${(systemMetrics.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB`
    });
  }

  private checkAlerts(): void {
    const latestMetrics = this.systemMetrics[this.systemMetrics.length - 1];
    if (!latestMetrics) return;

    // Check error rate alert
    if (latestMetrics.errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert({
        type: 'error_rate',
        severity: latestMetrics.errorRate > 0.5 ? 'critical' : 'high',
        message: `High error rate detected: ${(latestMetrics.errorRate * 100).toFixed(2)}%`,
        metadata: { errorRate: latestMetrics.errorRate }
      });
    }

    // Check response time alert
    if (latestMetrics.averageResponseTime > this.config.alertThresholds.responseTime) {
      this.createAlert({
        type: 'performance',
        severity: latestMetrics.averageResponseTime > 10000 ? 'critical' : 'medium',
        message: `High response time detected: ${latestMetrics.averageResponseTime.toFixed(2)}ms`,
        metadata: { responseTime: latestMetrics.averageResponseTime }
      });
    }

    // Check memory usage alert
    if (latestMetrics.totalMemoryUsage > this.config.alertThresholds.memoryUsage) {
      this.createAlert({
        type: 'resource',
        severity: 'high',
        message: `High memory usage detected: ${(latestMetrics.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
        metadata: { memoryUsage: latestMetrics.totalMemoryUsage }
      });
    }

    // Check concurrent executions alert
    if (latestMetrics.activeExecutions > this.config.alertThresholds.concurrentExecutions) {
      this.createAlert({
        type: 'resource',
        severity: 'medium',
        message: `High concurrent executions: ${latestMetrics.activeExecutions}`,
        metadata: { activeExecutions: latestMetrics.activeExecutions }
      });
    }
  }

  private checkExecutionAlerts(metrics: ExecutionMetrics): void {
    // Check for suspicious patterns
    if (metrics.duration > 30000) { // 30 seconds
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        message: `Long-running execution detected: ${metrics.duration}ms`,
        metadata: { 
          executionId: metrics.executionId,
          language: metrics.language,
          duration: metrics.duration
        }
      });
    }

    // Check for potential security issues
    if (metrics.errorType === 'SecurityError') {
      this.createAlert({
        type: 'security',
        severity: 'high',
        message: `Security error detected in execution`,
        metadata: {
          executionId: metrics.executionId,
          language: metrics.language,
          userId: metrics.userId
        }
      });
    }

    // Check for memory issues
    if (metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      this.createAlert({
        type: 'resource',
        severity: 'medium',
        message: `High memory usage in single execution: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        metadata: {
          executionId: metrics.executionId,
          memoryUsage: metrics.memoryUsage
        }
      });
    }
  }

  private createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      resolved: false,
      ...alertData
    };

    this.alerts.push(alert);

    // Log alert
    console.warn(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`, alert.metadata);

    // Send to external monitoring service
    this.sendAlertToExternalService(alert);
  }

  private sendAlertToExternalService(alert: Alert): void {
    // In production, this would send to services like:
    // - Slack/Discord webhooks
    // - Email notifications
    // - PagerDuty
    // - DataDog/New Relic
    
    if (typeof window !== 'undefined') {
      // Browser environment - could send to analytics service
      console.log('Would send alert to monitoring service:', alert);
    } else {
      // Server environment - could send to logging service
      console.log('Would send alert to server monitoring:', alert);
    }
  }

  private logAnalyticsEvent(event: string, data: Record<string, any>): void {
    // In production, this would send to analytics services like:
    // - Google Analytics
    // - Mixpanel
    // - Amplitude
    // - Custom analytics endpoint

    const analyticsData = {
      event,
      timestamp: Date.now(),
      ...data
    };

    console.log('Analytics Event:', analyticsData);

    // Example: Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', event, data);
    }
  }

  // Utility methods for metrics calculation
  private getActiveExecutions(): number {
    // In a real implementation, this would track active executions
    return Math.floor(Math.random() * 10); // Simulated
  }

  private getTotalMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return Math.floor(Math.random() * 100 * 1024 * 1024); // Simulated
  }

  private getCpuUsage(): number {
    // Browser doesn't have direct CPU usage access
    // In Node.js, you could use process.cpuUsage()
    return Math.random() * 100; // Simulated
  }

  private calculateErrorRate(executions: ExecutionMetrics[]): number {
    if (executions.length === 0) return 0;
    const errors = executions.filter(e => !e.success).length;
    return errors / executions.length;
  }

  private calculateAverageResponseTime(executions: ExecutionMetrics[]): number {
    if (executions.length === 0) return 0;
    const totalTime = executions.reduce((sum, e) => sum + e.duration, 0);
    return totalTime / executions.length;
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - (this.config.metricsRetention * 24 * 60 * 60 * 1000);
    
    this.executionMetrics = this.executionMetrics.filter(m => m.timestamp > cutoffTime);
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoffTime);
    
    // Keep alerts for longer (30 days)
    const alertCutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => a.timestamp > alertCutoff);

    console.log('Cleaned up old metrics and alerts');
  }

  // Public API methods
  getExecutionMetrics(timeRange?: { start: number; end: number }): ExecutionMetrics[] {
    let metrics = this.executionMetrics;
    
    if (timeRange) {
      metrics = metrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }
    
    return metrics;
  }

  getSystemMetrics(timeRange?: { start: number; end: number }): SystemMetrics[] {
    let metrics = this.systemMetrics;
    
    if (timeRange) {
      metrics = metrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }
    
    return metrics;
  }

  getAlerts(resolved?: boolean): Alert[] {
    let alerts = this.alerts;
    
    if (resolved !== undefined) {
      alerts = alerts.filter(a => a.resolved === resolved);
    }
    
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`Alert resolved: ${alert.message}`);
      return true;
    }
    return false;
  }

  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    checks: Record<string, boolean>;
    metrics: Partial<SystemMetrics>;
  } {
    const latestMetrics = this.systemMetrics[this.systemMetrics.length - 1];
    const activeAlerts = this.getAlerts(false);
    
    const checks = {
      lowErrorRate: !latestMetrics || latestMetrics.errorRate < this.config.alertThresholds.errorRate,
      goodResponseTime: !latestMetrics || latestMetrics.averageResponseTime < this.config.alertThresholds.responseTime,
      memoryOk: !latestMetrics || latestMetrics.totalMemoryUsage < this.config.alertThresholds.memoryUsage,
      noActiveAlerts: activeAlerts.length === 0
    };

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.values(checks).length;
    
    let status: 'healthy' | 'warning' | 'critical';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.7) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      status,
      checks,
      metrics: latestMetrics || {}
    };
  }

  generateReport(timeRange: { start: number; end: number }): {
    summary: {
      totalExecutions: number;
      successRate: number;
      averageResponseTime: number;
      totalAlerts: number;
    };
    languageBreakdown: Record<string, {
      executions: number;
      successRate: number;
      averageResponseTime: number;
    }>;
    trends: {
      executionsOverTime: Array<{ timestamp: number; count: number }>;
      errorRateOverTime: Array<{ timestamp: number; rate: number }>;
    };
  } {
    const executions = this.getExecutionMetrics(timeRange);
    const alerts = this.alerts.filter(a => 
      a.timestamp >= timeRange.start && a.timestamp <= timeRange.end
    );

    // Summary
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.success).length;
    const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;
    const averageResponseTime = totalExecutions > 0 
      ? executions.reduce((sum, e) => sum + e.duration, 0) / totalExecutions 
      : 0;

    // Language breakdown
    const languageBreakdown: Record<string, any> = {};
    const languageGroups = executions.reduce((groups, exec) => {
      if (!groups[exec.language]) groups[exec.language] = [];
      groups[exec.language].push(exec);
      return groups;
    }, {} as Record<string, ExecutionMetrics[]>);

    Object.entries(languageGroups).forEach(([language, langExecutions]) => {
      const successful = langExecutions.filter(e => e.success).length;
      languageBreakdown[language] = {
        executions: langExecutions.length,
        successRate: successful / langExecutions.length,
        averageResponseTime: langExecutions.reduce((sum, e) => sum + e.duration, 0) / langExecutions.length
      };
    });

    // Trends (hourly buckets)
    const hourlyBuckets = new Map<number, { executions: ExecutionMetrics[]; errors: number }>();
    executions.forEach(exec => {
      const hour = Math.floor(exec.timestamp / (60 * 60 * 1000)) * (60 * 60 * 1000);
      if (!hourlyBuckets.has(hour)) {
        hourlyBuckets.set(hour, { executions: [], errors: 0 });
      }
      const bucket = hourlyBuckets.get(hour)!;
      bucket.executions.push(exec);
      if (!exec.success) bucket.errors++;
    });

    const executionsOverTime = Array.from(hourlyBuckets.entries()).map(([timestamp, data]) => ({
      timestamp,
      count: data.executions.length
    }));

    const errorRateOverTime = Array.from(hourlyBuckets.entries()).map(([timestamp, data]) => ({
      timestamp,
      rate: data.executions.length > 0 ? data.errors / data.executions.length : 0
    }));

    return {
      summary: {
        totalExecutions,
        successRate,
        averageResponseTime,
        totalAlerts: alerts.length
      },
      languageBreakdown,
      trends: {
        executionsOverTime,
        errorRateOverTime
      }
    };
  }

  stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.alertsInterval) {
      clearInterval(this.alertsInterval);
    }
    console.log('Production monitoring stopped');
  }
}

// Default configuration
const defaultConfig: MonitoringConfig = {
  enableMetrics: true,
  enableAlerts: true,
  enableAnalytics: true,
  alertThresholds: {
    errorRate: 0.1, // 10%
    responseTime: 5000, // 5 seconds
    memoryUsage: 500 * 1024 * 1024, // 500MB
    concurrentExecutions: 20
  },
  metricsRetention: 7 // 7 days
};

// Global monitor instance
export const productionMonitor = new ProductionMonitor(defaultConfig);

// Export types and classes
export type { 
  MonitoringConfig, 
  ExecutionMetrics, 
  SystemMetrics, 
  Alert 
};
export { ProductionMonitor };