'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink, Copy, Bug, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ErrorSuggestion {
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
  link?: string;
}

interface ContextualErrorProps {
  error: Error;
  context?: string;
  onRetry?: () => void;
  onReport?: (error: Error, context?: string) => void;
}

export function ContextualErrorHandler({ 
  error, 
  context, 
  onRetry, 
  onReport 
}: ContextualErrorProps) {
  const [suggestions, setSuggestions] = useState<ErrorSuggestion[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSuggestions(generateSuggestions(error, context));
  }, [error, context]);

  const generateSuggestions = (error: Error, context?: string): ErrorSuggestion[] => {
    const suggestions: ErrorSuggestion[] = [];
    const errorMessage = error.message.toLowerCase();

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      suggestions.push({
        title: 'Check Your Connection',
        description: 'This appears to be a network issue. Check your internet connection and try again.',
        action: () => window.location.reload(),
        actionLabel: 'Reload Page'
      });
    }

    // API key errors
    if (errorMessage.includes('api key') || errorMessage.includes('unauthorized')) {
      suggestions.push({
        title: 'API Key Issue',
        description: 'Your API key may be missing or invalid. Check your API key configuration.',
        action: () => window.open('/api-keys', '_blank'),
        actionLabel: 'Check API Keys'
      });
    }

    // Code execution errors
    if (context === 'code-execution') {
      if (errorMessage.includes('syntax')) {
        suggestions.push({
          title: 'Syntax Error',
          description: 'There\'s a syntax error in your code. Check for missing brackets, semicolons, or typos.',
          link: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors'
        });
      }

      if (errorMessage.includes('timeout')) {
        suggestions.push({
          title: 'Execution Timeout',
          description: 'Your code took too long to execute. Try optimizing your algorithm or reducing the input size.',
        });
      }

      if (errorMessage.includes('memory')) {
        suggestions.push({
          title: 'Memory Limit Exceeded',
          description: 'Your code used too much memory. Try using more efficient data structures or processing data in chunks.',
        });
      }
    }

    // Authentication errors
    if (errorMessage.includes('auth') || errorMessage.includes('login')) {
      suggestions.push({
        title: 'Authentication Required',
        description: 'You need to be logged in to perform this action.',
        action: () => window.location.href = '/login',
        actionLabel: 'Go to Login'
      });
    }

    // File/Resource errors
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      suggestions.push({
        title: 'Resource Not Found',
        description: 'The requested resource could not be found. It may have been moved or deleted.',
        action: () => window.history.back(),
        actionLabel: 'Go Back'
      });
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
      suggestions.push({
        title: 'Permission Denied',
        description: 'You don\'t have permission to access this resource. Contact an administrator if you believe this is an error.',
      });
    }

    // Generic suggestions if no specific ones found
    if (suggestions.length === 0) {
      suggestions.push({
        title: 'Try Again',
        description: 'This might be a temporary issue. Try refreshing the page or waiting a moment before trying again.',
        action: onRetry,
        actionLabel: 'Retry'
      });
    }

    return suggestions;
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const copyErrorDetails = async () => {
    const errorDetails = `
Error: ${error.message}
Context: ${context || 'Unknown'}
Stack: ${error.stack || 'No stack trace available'}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorDetails);
      toast({
        title: "Copied!",
        description: "Error details copied to clipboard",
      });
    } catch (clipboardError) {
      console.error('Failed to copy error details:', clipboardError);
    }
  };

  const reportError = () => {
    if (onReport) {
      onReport(error, context);
    } else {
      // Default error reporting
      console.error('Error reported:', { error, context });
      toast({
        title: "Error Reported",
        description: "Thank you for reporting this issue. We'll look into it.",
      });
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-red-500 mt-1" size={20} />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 dark:text-red-100">
            Something went wrong
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {error.message}
          </p>
          {context && (
            <Badge variant="outline" className="mt-2 text-xs">
              Context: {context}
            </Badge>
          )}
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Lightbulb size={16} />
          Suggestions
        </h4>
        {suggestions.map((suggestion, index) => (
          <Alert key={index} className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    {suggestion.title}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {suggestion.description}
                  </div>
                </div>
                {(suggestion.action || suggestion.link) && (
                  <div className="ml-3">
                    {suggestion.action ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={suggestion.action}
                        className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        {suggestion.actionLabel || 'Try This'}
                      </Button>
                    ) : suggestion.link ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(suggestion.link, '_blank')}
                        className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        <ExternalLink size={14} className="mr-1" />
                        Learn More
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t">
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-2"
          >
            <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={copyErrorDetails}
          className="flex items-center gap-2"
        >
          <Copy size={14} />
          Copy Details
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={reportError}
          className="flex items-center gap-2"
        >
          <Bug size={14} />
          Report Issue
        </Button>
      </div>
    </div>
  );
}

// Auto-recovery component
export function AutoRecoveryWrapper({ 
  children, 
  maxRetries = 3,
  retryDelay = 1000,
  onError 
}: {
  children: React.ReactNode;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error, retryCount: number) => void;
}) {
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = (error: Error) => {
    setError(error);
    onError?.(error, retryCount);

    // Auto-retry for certain types of errors
    if (retryCount < maxRetries && isRetriableError(error)) {
      setTimeout(() => {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        setError(null);
        setTimeout(() => setIsRetrying(false), 100);
      }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
    }
  };

  const isRetriableError = (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('fetch');
  };

  const manualRetry = () => {
    setError(null);
    setRetryCount(0);
  };

  if (error && retryCount >= maxRetries) {
    return (
      <ContextualErrorHandler
        error={error}
        context="auto-recovery"
        onRetry={manualRetry}
      />
    );
  }

  if (isRetrying) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-gray-600">
          <RefreshCw size={16} className="animate-spin" />
          Retrying... (Attempt {retryCount + 1}/{maxRetries})
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ContextualErrorHandler
          error={this.state.error}
          context="component-error"
          onRetry={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}