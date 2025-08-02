'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isHydrationError: boolean;
}

export class HydrationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      isHydrationError: false 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a hydration error
    const isHydrationError = 
      error.message.includes('hydration') ||
      error.message.includes('server HTML') ||
      error.message.includes('client properties') ||
      error.message.includes('Text content does not match');

    return {
      hasError: true,
      error,
      isHydrationError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by HydrationErrorBoundary:', error, errorInfo);
    
    // Log hydration errors with additional context
    if (this.state.isHydrationError) {
      console.error('Hydration Error Details:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
        url: typeof window !== 'undefined' ? window.location.href : 'SSR',
        timestamp: new Date().toISOString()
      });
    }

    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      isHydrationError: false 
    });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                {this.state.isHydrationError ? (
                  <RefreshCw className="w-8 h-8 text-red-600" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {this.state.isHydrationError ? 'Hydration Error' : 'Something went wrong'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {this.state.isHydrationError 
                  ? 'There was a mismatch between server and client rendering. This usually resolves after a refresh.'
                  : 'An unexpected error occurred. Please try again.'
                }
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={this.handleRetry} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              {this.state.isHydrationError && (
                <Button onClick={this.handleReload} size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
              )}
            </div>

            {this.props.showDetails && this.state.error && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  <Bug className="w-4 h-4 inline mr-1" />
                  Error Details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-left overflow-auto max-h-32">
                  <div className="text-red-600 dark:text-red-400 font-semibold">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <pre className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for error boundary context
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = () => setError(null);
  
  const handleError = (error: Error) => {
    setError(error);
    console.error('Error handled by useErrorHandler:', error);
  };

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return { handleError, resetError };
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <HydrationErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </HydrationErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specialized error boundary for specific error types
export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isHydrationError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isHydrationError: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Async Error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Failed to load content. Please try again.
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false })}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}