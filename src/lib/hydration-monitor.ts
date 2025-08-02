'use client';

interface HydrationError {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  userId?: string;
}

interface HydrationMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByComponent: Record<string, number>;
  lastError?: HydrationError;
  hydrationTime?: number;
}

class HydrationMonitor {
  private metrics: HydrationMetrics = {
    totalErrors: 0,
    errorsByType: {},
    errorsByComponent: {}
  };
  
  private hydrationStartTime?: number;
  private isMonitoring = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    this.hydrationStartTime = performance.now();
    this.isMonitoring = true;

    // Monitor for hydration completion
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.recordHydrationComplete();
      });
    } else {
      // DOM already loaded
      setTimeout(() => this.recordHydrationComplete(), 0);
    }

    // Listen for React hydration errors
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));

    // Monitor console errors for hydration-specific messages
    this.interceptConsoleError();
  }

  private recordHydrationComplete() {
    if (this.hydrationStartTime) {
      this.metrics.hydrationTime = performance.now() - this.hydrationStartTime;
      console.log(`Hydration completed in ${this.metrics.hydrationTime.toFixed(2)}ms`);
    }
  }

  private handleError(event: ErrorEvent) {
    const error = event.error;
    if (this.isHydrationError(error)) {
      this.recordHydrationError({
        message: error.message,
        stack: error.stack,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  }

  private handlePromiseRejection(event: PromiseRejectionEvent) {
    const error = event.reason;
    if (error instanceof Error && this.isHydrationError(error)) {
      this.recordHydrationError({
        message: error.message,
        stack: error.stack,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  }

  private interceptConsoleError() {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (this.isHydrationErrorMessage(message)) {
        this.recordHydrationError({
          message,
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });
      }
      originalError.apply(console, args);
    };
  }

  private isHydrationError(error: Error): boolean {
    return this.isHydrationErrorMessage(error.message);
  }

  private isHydrationErrorMessage(message: string): boolean {
    const hydrationKeywords = [
      'hydration',
      'server rendered HTML',
      'client properties',
      'text content does not match',
      'server HTML',
      'hydrated but some attributes',
      'suppressHydrationWarning'
    ];

    return hydrationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private recordHydrationError(error: HydrationError) {
    this.metrics.totalErrors++;
    this.metrics.lastError = error;

    // Categorize error type
    const errorType = this.categorizeError(error.message);
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;

    // Extract component name from stack if available
    if (error.componentStack) {
      const componentMatch = error.componentStack.match(/at (\w+)/);
      if (componentMatch) {
        const componentName = componentMatch[1];
        this.metrics.errorsByComponent[componentName] = 
          (this.metrics.errorsByComponent[componentName] || 0) + 1;
      }
    }

    // Log error for debugging
    console.error('Hydration Error Recorded:', error);

    // Send to monitoring service (if configured)
    this.sendToMonitoringService(error);
  }

  private categorizeError(message: string): string {
    if (message.includes('text content')) return 'text-mismatch';
    if (message.includes('attributes')) return 'attribute-mismatch';
    if (message.includes('server HTML')) return 'html-structure-mismatch';
    if (message.includes('hydration')) return 'general-hydration';
    return 'unknown';
  }

  private sendToMonitoringService(error: HydrationError) {
    // In a real application, you would send this to your monitoring service
    // For now, we'll just store it locally for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('hydration-errors') || '[]');
      errors.push(error);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('hydration-errors', JSON.stringify(errors));
    } catch (e) {
      console.warn('Failed to store hydration error:', e);
    }
  }

  // Public API
  getMetrics(): HydrationMetrics {
    return { ...this.metrics };
  }

  getStoredErrors(): HydrationError[] {
    try {
      return JSON.parse(localStorage.getItem('hydration-errors') || '[]');
    } catch {
      return [];
    }
  }

  clearStoredErrors(): void {
    try {
      localStorage.removeItem('hydration-errors');
    } catch (e) {
      console.warn('Failed to clear stored errors:', e);
    }
  }

  generateReport(): string {
    const metrics = this.getMetrics();
    const storedErrors = this.getStoredErrors();

    return `
# Hydration Error Report

## Summary
- Total Errors: ${metrics.totalErrors}
- Hydration Time: ${metrics.hydrationTime?.toFixed(2) || 'N/A'}ms
- Last Error: ${metrics.lastError?.timestamp.toISOString() || 'None'}

## Error Types
${Object.entries(metrics.errorsByType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

## Component Errors
${Object.entries(metrics.errorsByComponent)
  .map(([component, count]) => `- ${component}: ${count}`)
  .join('\n')}

## Recent Errors
${storedErrors.slice(-5).map((error, index) => `
### Error ${index + 1}
- Time: ${error.timestamp.toISOString()}
- Message: ${error.message}
- URL: ${error.url}
`).join('\n')}

Generated at: ${new Date().toISOString()}
    `.trim();
  }

  // Health check
  isHealthy(): boolean {
    const metrics = this.getMetrics();
    const recentErrors = this.getStoredErrors()
      .filter(error => Date.now() - new Date(error.timestamp).getTime() < 5 * 60 * 1000); // Last 5 minutes

    return recentErrors.length === 0 && metrics.totalErrors < 10;
  }

  // Performance monitoring
  measureHydrationPerformance(): Promise<PerformanceEntry[]> {
    return new Promise((resolve) => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        // Wait for performance entries to be available
        setTimeout(() => {
          const entries = performance.getEntriesByType('navigation');
          resolve(entries);
        }, 1000);
      } else {
        resolve([]);
      }
    });
  }
}

// Singleton instance
export const hydrationMonitor = new HydrationMonitor();

// React hook for monitoring
export function useHydrationMonitor() {
  const [metrics, setMetrics] = React.useState<HydrationMetrics>(() => 
    hydrationMonitor.getMetrics()
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(hydrationMonitor.getMetrics());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    getStoredErrors: hydrationMonitor.getStoredErrors.bind(hydrationMonitor),
    clearStoredErrors: hydrationMonitor.clearStoredErrors.bind(hydrationMonitor),
    generateReport: hydrationMonitor.generateReport.bind(hydrationMonitor),
    isHealthy: hydrationMonitor.isHealthy.bind(hydrationMonitor)
  };
}

// Development helper component
export function HydrationDebugPanel() {
  const { metrics, getStoredErrors, clearStoredErrors, generateReport, isHealthy } = useHydrationMonitor();
  const [showPanel, setShowPanel] = React.useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-4 left-4 z-50 bg-red-600 text-white px-3 py-2 rounded text-xs"
        style={{ display: metrics.totalErrors > 0 ? 'block' : 'none' }}
      >
        Hydration Errors: {metrics.totalErrors}
      </button>

      {showPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Hydration Debug Panel</h3>
              <button
                onClick={() => setShowPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className={`p-3 rounded ${isHealthy() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                Status: {isHealthy() ? 'Healthy' : 'Issues Detected'}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Total Errors:</strong> {metrics.totalErrors}
                </div>
                <div>
                  <strong>Hydration Time:</strong> {metrics.hydrationTime?.toFixed(2) || 'N/A'}ms
                </div>
              </div>

              {metrics.lastError && (
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                  <strong>Last Error:</strong>
                  <pre className="text-xs mt-2 overflow-auto">
                    {metrics.lastError.message}
                  </pre>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const report = generateReport();
                    navigator.clipboard.writeText(report);
                    alert('Report copied to clipboard');
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  Copy Report
                </button>
                <button
                  onClick={clearStoredErrors}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                >
                  Clear Errors
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Add React import
import React from 'react';