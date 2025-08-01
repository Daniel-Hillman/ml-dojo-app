'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCcw, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Zap,
  Timer
} from 'lucide-react';
import { ProcessedError } from '@/lib/code-execution/error-handler';

export interface RetryStrategy {
  shouldRetry: boolean;
  maxRetries: number;
  delay: number;
  backoffMultiplier: number;
  retryCondition?: (error: Error) => boolean;
}

export interface RetryState {
  isRetrying: boolean;
  currentAttempt: number;
  maxAttempts: number;
  nextRetryIn?: number;
  lastError?: ProcessedError;
  retryHistory: Array<{
    attempt: number;
    timestamp: number;
    success: boolean;
    error?: string;
    duration: number;
  }>;
}

interface RetryMechanismProps {
  retryState: RetryState;
  retryStrategy: RetryStrategy;
  onRetry: () => Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
}

export const RetryMechanism: React.FC<RetryMechanismProps> = ({
  retryState,
  retryStrategy,
  onRetry,
  onCancel,
  disabled = false,
  className = ''
}) => {
  const [countdown, setCountdown] = useState<number>(0);
  const [isCountingDown, setIsCountingDown] = useState(false);

  useEffect(() => {
    if (retryState.nextRetryIn && retryState.nextRetryIn > 0) {
      setCountdown(retryState.nextRetryIn);
      setIsCountingDown(true);

      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1000) {
            setIsCountingDown(false);
            clearInterval(interval);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [retryState.nextRetryIn]);

  const handleRetry = async () => {
    if (disabled || isCountingDown || retryState.isRetrying) return;
    
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const canRetry = () => {
    return (
      retryStrategy.shouldRetry &&
      retryState.currentAttempt < retryStrategy.maxRetries &&
      !retryState.isRetrying &&
      !isCountingDown &&
      !disabled
    );
  };

  const getRetryButtonText = () => {
    if (retryState.isRetrying) return 'Retrying...';
    if (isCountingDown) return `Retry in ${Math.ceil(countdown / 1000)}s`;
    if (retryState.currentAttempt === 0) return 'Retry';
    return `Retry (${retryState.currentAttempt}/${retryStrategy.maxRetries})`;
  };

  const getRetryButtonVariant = () => {
    if (retryState.currentAttempt === 0) return 'default';
    if (retryState.currentAttempt >= retryStrategy.maxRetries) return 'destructive';
    return 'secondary';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getSuccessRate = () => {
    if (retryState.retryHistory.length === 0) return 0;
    const successful = retryState.retryHistory.filter(h => h.success).length;
    return (successful / retryState.retryHistory.length) * 100;
  };

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {/* Retry Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className={`w-4 h-4 ${retryState.isRetrying ? 'animate-spin text-blue-500' : 'text-gray-500'}`} />
            <span className="font-medium text-sm">
              {retryState.isRetrying ? 'Retrying Execution' : 'Retry Options'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {retryState.currentAttempt}/{retryStrategy.maxRetries} attempts
            </Badge>
            {retryState.retryHistory.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {getSuccessRate().toFixed(0)}% success rate
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Bar for Current Retry */}
        {retryState.isRetrying && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Attempting retry...</span>
              <span>Attempt {retryState.currentAttempt + 1}</span>
            </div>
            <Progress value={undefined} className="h-2" />
          </div>
        )}

        {/* Countdown Timer */}
        {isCountingDown && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Next retry in:</span>
              <span className="font-mono">{Math.ceil(countdown / 1000)}s</span>
            </div>
            <Progress value={((retryState.nextRetryIn! - countdown) / retryState.nextRetryIn!) * 100} className="h-2" />
          </div>
        )}

        {/* Retry Strategy Information */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <h4 className="font-medium text-sm text-gray-800">Retry Strategy</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Max Retries:</span>
              <span className="font-medium">{retryStrategy.maxRetries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Base Delay:</span>
              <span className="font-medium">{retryStrategy.delay / 1000}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Backoff:</span>
              <span className="font-medium">{retryStrategy.backoffMultiplier}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Can Retry:</span>
              <span className={`font-medium ${retryStrategy.shouldRetry ? 'text-green-600' : 'text-red-600'}`}>
                {retryStrategy.shouldRetry ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Last Error Information */}
        {retryState.lastError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-red-800 text-sm mb-1">Last Error</h4>
                <p className="text-red-700 text-xs leading-relaxed">
                  {retryState.lastError.userFriendlyMessage}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {retryState.lastError.errorType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {retryState.lastError.severity} severity
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Retry History */}
        {retryState.retryHistory.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-800">Retry History</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {retryState.retryHistory.slice(-5).map((attempt, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                  <div className="flex items-center gap-2">
                    {attempt.success ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500" />
                    )}
                    <span>Attempt {attempt.attempt}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Timer className="w-3 h-3" />
                    <span>{formatDuration(attempt.duration)}</span>
                    <span>{new Date(attempt.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={getRetryButtonVariant()}
              onClick={handleRetry}
              disabled={!canRetry()}
              className="flex items-center gap-2"
            >
              {retryState.isRetrying ? (
                <RotateCcw className="w-3 h-3 animate-spin" />
              ) : isCountingDown ? (
                <Clock className="w-3 h-3" />
              ) : (
                <Zap className="w-3 h-3" />
              )}
              {getRetryButtonText()}
            </Button>

            {onCancel && (retryState.isRetrying || isCountingDown) && (
              <Button
                size="sm"
                variant="outline"
                onClick={onCancel}
                className="flex items-center gap-2"
              >
                <XCircle className="w-3 h-3" />
                Cancel
              </Button>
            )}
          </div>

          {/* Retry Statistics */}
          <div className="text-xs text-muted-foreground">
            {retryState.retryHistory.length > 0 && (
              <span>
                {retryState.retryHistory.filter(h => h.success).length} successful, {' '}
                {retryState.retryHistory.filter(h => !h.success).length} failed
              </span>
            )}
          </div>
        </div>

        {/* No More Retries Warning */}
        {retryState.currentAttempt >= retryStrategy.maxRetries && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-800 text-sm mb-1">
                  Maximum Retries Reached
                </h4>
                <p className="text-orange-700 text-xs">
                  You've reached the maximum number of retry attempts. 
                  Please check your code and try again manually.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Hook for managing retry state
export const useRetryMechanism = (
  initialStrategy: RetryStrategy
) => {
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    currentAttempt: 0,
    maxAttempts: initialStrategy.maxRetries,
    retryHistory: []
  });

  const [retryStrategy, setRetryStrategy] = useState<RetryStrategy>(initialStrategy);

  const startRetry = (error?: ProcessedError) => {
    setRetryState(prev => ({
      ...prev,
      isRetrying: true,
      lastError: error,
      nextRetryIn: undefined
    }));
  };

  const completeRetry = (success: boolean, duration: number, error?: string) => {
    setRetryState(prev => {
      const newAttempt = prev.currentAttempt + 1;
      const newHistory = [...prev.retryHistory, {
        attempt: newAttempt,
        timestamp: Date.now(),
        success,
        error,
        duration
      }];

      // Calculate next retry delay with backoff
      const nextDelay = success ? 0 : 
        retryStrategy.delay * Math.pow(retryStrategy.backoffMultiplier, newAttempt - 1);

      return {
        ...prev,
        isRetrying: false,
        currentAttempt: newAttempt,
        retryHistory: newHistory,
        nextRetryIn: success || newAttempt >= retryStrategy.maxRetries ? undefined : nextDelay
      };
    });
  };

  const resetRetries = () => {
    setRetryState({
      isRetrying: false,
      currentAttempt: 0,
      maxAttempts: retryStrategy.maxRetries,
      retryHistory: []
    });
  };

  const updateStrategy = (newStrategy: Partial<RetryStrategy>) => {
    setRetryStrategy(prev => ({ ...prev, ...newStrategy }));
  };

  return {
    retryState,
    retryStrategy,
    startRetry,
    completeRetry,
    resetRetries,
    updateStrategy
  };
};