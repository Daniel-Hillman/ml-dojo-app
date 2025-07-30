"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys have changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys![index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset error state if any props have changed (when resetOnPropsChange is true)
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    // Clear any existing timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
    
    // Add a small delay to prevent immediate re-error
    this.resetTimeoutId = window.setTimeout(() => {
      // Force a re-render by updating state
      this.forceUpdate();
    }, 100);
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <Alert className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-2">
              <p>
                {error?.message || 'An unexpected error occurred while loading this section.'}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={this.handleRetry}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Try Again
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return children;
  }
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    captureError,
    resetError
  };
}

// Specific error boundary for drill sections
interface DrillSectionErrorBoundaryProps {
  children: ReactNode;
  sectionName: string;
  onRetry?: () => void;
}

export function DrillSectionErrorBoundary({ 
  children, 
  sectionName, 
  onRetry 
}: DrillSectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <Alert className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading {sectionName}</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-2">
              <p>
                There was a problem loading your {sectionName.toLowerCase()}. 
                Other sections may still be available.
              </p>
              {onRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry {sectionName}
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      }
      onError={(error, errorInfo) => {
        console.error(`Error in ${sectionName} section:`, error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}