/**
 * Enhanced Error Service
 * Comprehensive error handling with user feedback, retry mechanisms, and analytics
 */

import { errorHandler, ProcessedError, ErrorContext } from './error-handler';
import { executionManager } from './execution-controller';
import { performanceMetrics } from './performance-metrics';

export interface ErrorFeedbackOptions {
  showSuggestions?: boolean;
  enableRetry?: boolean;
  showProgress?: boolean;
  notifyUser?: boolean;
  trackAnalytics?: boolean;
}

export interface UserFeedbackState {
  isVisible: boolean;
  error?: ProcessedError;
  retryState: {
    isRetrying: boolean;
    currentAttempt: number;
    maxAttempts: number;
    nextRetryIn?: number;
  };
  progressState: {
    isVisible: boolean;
    progress: number;
    message: string;
  };
}

export class EnhancedErrorService {
  private static instance: EnhancedErrorService;
  private feedbackCallbacks: Map<string, (state: UserFeedbackState) => void> = new Map();
  private retryCallbacks: Map<string, () => Promise<void>> = new Map();
  private activeRetries: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  public static getInstance(): EnhancedErrorService {
    if (!EnhancedErrorService.instance) {
      EnhancedErrorService.instance = new EnhancedErrorService();
    }
    return EnhancedErrorService.instance;
  }

  /**
   * Handle an error with comprehensive user feedback
   */
  public async handleError(
    error: Error,
    context: ErrorContext,
    options: ErrorFeedbackOptions = {}
  ): Promise<ProcessedError> {
    const {
      showSuggestions = true,
      enableRetry = true,
      showProgress = true,
      notifyUser = true,
      trackAnalytics = true
    } = options;

    // Process the error
    const processedError = errorHandler.processError(error, context);

    // Track analytics
    if (trackAnalytics) {
      errorHandler.trackErrorPattern(processedError);
      performanceMetrics.recordMetric({
        executionId: context.executionId,
        metricType: 'error',
        value: 1,
        unit: 'count',
        metadata: {
          errorType: processedError.errorType,
          severity: processedError.severity,
          language: context.language,
          canRetry: processedError.canRetry
        }
      });
    }

    // Update user feedback state
    if (notifyUser) {
      this.updateFeedbackState(context.executionId, {
        isVisible: true,
        error: processedError,
        retryState: {
          isRetrying: false,
          currentAttempt: 0,
          maxAttempts: errorHandler.getRetryStrategy(processedError).maxRetries
        },
        progressState: {
          isVisible: false,
          progress: 0,
          message: ''
        }
      });
    }

    // Show browser notification for critical errors
    if (typeof window !== 'undefined' && processedError.severity === 'critical' && 'Notification' in window) {
      this.showBrowserNotification(processedError);
    }

    return processedError;
  }

  /**
   * Execute code with comprehensive error handling
   */
  public async executeWithErrorHandling<T>(
    executionId: string,
    language: string,
    code: string,
    executeFunction: () => Promise<T>,
    options: ErrorFeedbackOptions = {}
  ): Promise<T> {
    const context: ErrorContext = {
      language,
      code,
      executionId,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };

    try {
      // Show progress
      if (options.showProgress) {
        this.updateProgressState(executionId, {
          isVisible: true,
          progress: 0,
          message: 'Starting execution...'
        });
      }

      // Execute with timeout and monitoring
      const result = await executionManager.startExecution(
        executionId,
        language,
        async () => {
          if (options.showProgress) {
            this.updateProgressState(executionId, {
              isVisible: true,
              progress: 50,
              message: 'Executing code...'
            });
          }
          
          return await executeFunction();
        },
        {
          onTimeout: () => {
            this.handleError(
              new Error('Execution timeout'),
              context,
              options
            );
          },
          onCancel: () => {
            this.updateProgressState(executionId, {
              isVisible: false,
              progress: 0,
              message: ''
            });
          }
        }
      );

      // Success - hide progress
      if (options.showProgress) {
        this.updateProgressState(executionId, {
          isVisible: true,
          progress: 100,
          message: 'Execution completed!'
        });

        // Hide after a short delay
        setTimeout(() => {
          this.updateProgressState(executionId, {
            isVisible: false,
            progress: 0,
            message: ''
          });
        }, 1000);
      }

      return result;

    } catch (error) {
      // Handle the error
      const processedError = await this.handleError(
        error as Error,
        context,
        options
      );

      // Hide progress on error
      if (options.showProgress) {
        this.updateProgressState(executionId, {
          isVisible: false,
          progress: 0,
          message: ''
        });
      }

      throw processedError;
    }
  }

  /**
   * Set up automatic retry for an execution
   */
  public setupAutoRetry(
    executionId: string,
    retryFunction: () => Promise<void>,
    processedError: ProcessedError
  ): void {
    const retryStrategy = errorHandler.getRetryStrategy(processedError);
    
    if (!retryStrategy.shouldRetry) {
      return;
    }

    // Store retry function
    this.retryCallbacks.set(executionId, retryFunction);

    // Update retry state
    this.updateRetryState(executionId, {
      isRetrying: false,
      currentAttempt: 0,
      maxAttempts: retryStrategy.maxRetries,
      nextRetryIn: retryStrategy.delay
    });

    // Set up automatic retry with backoff
    this.scheduleRetry(executionId, retryStrategy.delay, 0, retryStrategy);
  }

  /**
   * Manually trigger a retry
   */
  public async manualRetry(executionId: string): Promise<void> {
    const retryFunction = this.retryCallbacks.get(executionId);
    if (!retryFunction) {
      throw new Error('No retry function available for this execution');
    }

    // Cancel any scheduled retry
    const scheduledRetry = this.activeRetries.get(executionId);
    if (scheduledRetry) {
      clearTimeout(scheduledRetry);
      this.activeRetries.delete(executionId);
    }

    // Update state to show retrying
    this.updateRetryState(executionId, {
      isRetrying: true,
      currentAttempt: 0,
      maxAttempts: 3
    });

    try {
      await retryFunction();
      
      // Success - clear retry state
      this.clearRetryState(executionId);
      
    } catch (error) {
      // Retry failed - update state
      this.updateRetryState(executionId, {
        isRetrying: false,
        currentAttempt: 1,
        maxAttempts: 3
      });
      
      throw error;
    }
  }

  /**
   * Cancel a retry
   */
  public cancelRetry(executionId: string): void {
    const scheduledRetry = this.activeRetries.get(executionId);
    if (scheduledRetry) {
      clearTimeout(scheduledRetry);
      this.activeRetries.delete(executionId);
    }

    this.retryCallbacks.delete(executionId);
    this.clearRetryState(executionId);
  }

  /**
   * Register a callback for feedback state updates
   */
  public onFeedbackStateChange(
    executionId: string,
    callback: (state: UserFeedbackState) => void
  ): void {
    this.feedbackCallbacks.set(executionId, callback);
  }

  /**
   * Unregister feedback callback
   */
  public offFeedbackStateChange(executionId: string): void {
    this.feedbackCallbacks.delete(executionId);
  }

  /**
   * Get current error analytics
   */
  public getErrorAnalytics() {
    return errorHandler.getErrorAnalytics();
  }

  /**
   * Generate error report
   */
  public generateErrorReport(executionId: string, processedError: ProcessedError): string {
    const report = {
      executionId,
      timestamp: new Date().toISOString(),
      error: {
        type: processedError.errorType,
        severity: processedError.severity,
        message: processedError.userFriendlyMessage,
        technicalDetails: processedError.technicalDetails,
        canRetry: processedError.canRetry
      },
      context: processedError.context,
      suggestions: processedError.suggestions.map(s => ({
        type: s.type,
        title: s.title,
        description: s.description,
        priority: s.priority
      })),
      systemInfo: {
        userAgent: navigator.userAgent,
        language: processedError.context.language,
        timestamp: processedError.context.timestamp
      }
    };

    return JSON.stringify(report, null, 2);
  }

  // Private methods

  private scheduleRetry(
    executionId: string,
    delay: number,
    attempt: number,
    strategy: ReturnType<typeof errorHandler.getRetryStrategy>
  ): void {
    const timeout = setTimeout(async () => {
      const retryFunction = this.retryCallbacks.get(executionId);
      if (!retryFunction) return;

      // Update state to show retrying
      this.updateRetryState(executionId, {
        isRetrying: true,
        currentAttempt: attempt + 1,
        maxAttempts: strategy.maxRetries
      });

      try {
        await retryFunction();
        
        // Success - clear retry state
        this.clearRetryState(executionId);
        
      } catch (error) {
        const nextAttempt = attempt + 1;
        
        if (nextAttempt < strategy.maxRetries) {
          // Schedule next retry with backoff
          const nextDelay = delay * strategy.backoffMultiplier;
          
          this.updateRetryState(executionId, {
            isRetrying: false,
            currentAttempt: nextAttempt,
            maxAttempts: strategy.maxRetries,
            nextRetryIn: nextDelay
          });
          
          this.scheduleRetry(executionId, nextDelay, nextAttempt, strategy);
        } else {
          // Max retries reached
          this.updateRetryState(executionId, {
            isRetrying: false,
            currentAttempt: nextAttempt,
            maxAttempts: strategy.maxRetries
          });
        }
      }
    }, delay);

    this.activeRetries.set(executionId, timeout);
  }

  private updateFeedbackState(executionId: string, state: UserFeedbackState): void {
    const callback = this.feedbackCallbacks.get(executionId);
    if (callback) {
      callback(state);
    }
  }

  private updateRetryState(
    executionId: string,
    retryState: UserFeedbackState['retryState']
  ): void {
    const callback = this.feedbackCallbacks.get(executionId);
    if (callback) {
      callback({
        isVisible: true,
        retryState,
        progressState: {
          isVisible: false,
          progress: 0,
          message: ''
        }
      });
    }
  }

  private updateProgressState(
    executionId: string,
    progressState: UserFeedbackState['progressState']
  ): void {
    const callback = this.feedbackCallbacks.get(executionId);
    if (callback) {
      callback({
        isVisible: true,
        retryState: {
          isRetrying: false,
          currentAttempt: 0,
          maxAttempts: 0
        },
        progressState
      });
    }
  }

  private clearRetryState(executionId: string): void {
    this.retryCallbacks.delete(executionId);
    this.activeRetries.delete(executionId);
    
    const callback = this.feedbackCallbacks.get(executionId);
    if (callback) {
      callback({
        isVisible: false,
        retryState: {
          isRetrying: false,
          currentAttempt: 0,
          maxAttempts: 0
        },
        progressState: {
          isVisible: false,
          progress: 0,
          message: ''
        }
      });
    }
  }

  private async showBrowserNotification(processedError: ProcessedError): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Request permission if needed
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const notification = errorHandler.generateErrorNotification(processedError);
      
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `error-${processedError.context.executionId}`,
        requireInteraction: processedError.severity === 'critical'
      });
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    // Clear all active retries
    for (const timeout of this.activeRetries.values()) {
      clearTimeout(timeout);
    }
    
    this.activeRetries.clear();
    this.retryCallbacks.clear();
    this.feedbackCallbacks.clear();
  }
}

// Export singleton instance
export const enhancedErrorService = EnhancedErrorService.getInstance();