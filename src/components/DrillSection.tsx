"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, RefreshCw, AlertCircle, AlertTriangle, WifiOff } from 'lucide-react';
import { EnhancedDrill } from '@/lib/drills';
import { DrillSectionErrorBoundary } from '@/components/ErrorBoundary';

// Empty state configuration interface
export interface EmptyStateConfig {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionButton: {
    text: string;
    href: string;
  };
}

// Error types for better error handling
export type ErrorType = 'network' | 'permission' | 'service' | 'unknown';

export interface ErrorState {
  message: string;
  type: ErrorType;
  retryable: boolean;
}

// DrillSection component props
export interface DrillSectionProps {
  title?: string;
  drills: EnhancedDrill[];
  loading: boolean;
  error?: string | null | ErrorState;
  emptyState: EmptyStateConfig;
  onRetry?: () => void;
  children?: (drill: EnhancedDrill) => React.ReactNode;
  enableErrorBoundary?: boolean;
  sectionId?: string;
}

// Enhanced loading skeleton component for drill cards with better perceived performance
function DrillCardSkeleton() {
  return (
    <Card className="animate-pulse bg-card/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="h-5 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-md w-3/4 animate-shimmer"></div>
          <div className="flex gap-2">
            <div className="h-4 bg-muted rounded-full w-16"></div>
            <div className="h-4 bg-muted rounded-full w-20"></div>
          </div>
        </div>
        <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
        {/* Author info skeleton for community drills */}
        <div className="flex items-center gap-2 mt-2">
          <div className="h-4 w-4 bg-muted rounded-full"></div>
          <div className="h-3 bg-muted rounded w-24"></div>
          <div className="flex gap-2 ml-2">
            <div className="h-3 bg-muted rounded w-8"></div>
            <div className="h-3 bg-muted rounded w-8"></div>
            <div className="h-3 bg-muted rounded w-8"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-muted rounded w-full"></div>
          <div className="h-3 bg-muted rounded w-4/5"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
        </div>
        <div className="flex space-x-4 mb-4">
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-12"></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-12"></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-12"></div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-muted rounded w-20"></div>
          <div className="h-10 bg-muted rounded flex-1"></div>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced error state component with better UX
function ErrorStateDisplay({ error, onRetry }: { error: string | ErrorState; onRetry?: () => void }) {
  const errorState: ErrorState = typeof error === 'string' 
    ? { message: error, type: 'unknown', retryable: true }
    : error;

  const getErrorIcon = (type: ErrorType) => {
    switch (type) {
      case 'network':
        return WifiOff;
      case 'permission':
        return AlertTriangle;
      case 'service':
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const getErrorTitle = (type: ErrorType) => {
    switch (type) {
      case 'network':
        return 'Connection Problem';
      case 'permission':
        return 'Access Denied';
      case 'service':
        return 'Service Error';
      default:
        return 'Error';
    }
  };

  const ErrorIcon = getErrorIcon(errorState.type);

  return (
    <Alert 
      className="mb-4" 
      variant={errorState.type === 'permission' ? 'destructive' : 'default'}
      role="alert"
      aria-live="assertive"
    >
      <ErrorIcon 
        className="h-4 w-4" 
        aria-hidden="true"
      />
      <AlertTitle>{getErrorTitle(errorState.type)}</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p>{errorState.message}</p>
          {errorState.retryable && onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              aria-label={`Retry loading after ${getErrorTitle(errorState.type).toLowerCase()}`}
            >
              <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
              Try Again
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Empty state component
function EmptyState({ config }: { config: EmptyStateConfig }) {
  const IconComponent = config.icon;
  
  return (
    <div 
      className="text-center text-muted-foreground py-12 border-2 border-dashed border-muted rounded-lg"
      role="status"
      aria-label="Empty state"
    >
      <div className="flex justify-center mb-4">
        <IconComponent 
          className="h-12 w-12 text-muted-foreground/50" 
          aria-hidden="true"
        />
      </div>
      <h3 className="text-lg font-semibold mb-2 font-code7x5">{config.title}</h3>
      <p className="text-sm mb-4 max-w-md mx-auto font-gontserrat">{config.description}</p>
      <Link href={config.actionButton.href}>
        <Button aria-label={`${config.actionButton.text} - ${config.description}`}>
          {config.actionButton.text}
        </Button>
      </Link>
    </div>
  );
}

// Main DrillSection component with enhanced error handling
export function DrillSection({
  title,
  drills,
  loading,
  error,
  emptyState,
  onRetry,
  children,
  enableErrorBoundary = true,
  sectionId
}: DrillSectionProps) {
  // Create unique IDs for accessibility
  const sectionAriaId = sectionId ? `drill-section-${sectionId}` : undefined;
  const headingId = sectionId ? `drill-section-heading-${sectionId}` : undefined;
  const gridId = sectionId ? `drill-grid-${sectionId}` : undefined;
  
  // Screen reader announcements for loading and error states
  const [announcement, setAnnouncement] = React.useState<string>('');
  
  React.useEffect(() => {
    if (loading && drills.length === 0) {
      setAnnouncement(`Loading ${title || 'drills'}...`);
    } else if (error) {
      const errorMessage = typeof error === 'string' ? error : error.message;
      setAnnouncement(`Error loading ${title || 'drills'}: ${errorMessage}`);
    } else if (!loading && drills.length > 0) {
      setAnnouncement(`${title || 'Drills'} loaded. ${drills.length} drill${drills.length === 1 ? '' : 's'} available.`);
    } else if (!loading && drills.length === 0 && !error) {
      setAnnouncement(`No ${title?.toLowerCase() || 'drills'} found.`);
    }
  }, [loading, error, drills.length, title]);

  const sectionContent = (
    <section 
      className={title ? "mb-12" : ""}
      id={sectionAriaId}
      aria-labelledby={headingId}
      role="region"
    >
      {/* Screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      
      {/* Section Header */}
      {title && (
        <h2 
          id={headingId}
          className="text-2xl font-bold font-code7x5 mb-4 flex items-center"
        >
          {title}
          {loading && (
            <LoaderCircle 
              className="ml-2 h-4 w-4 animate-spin" 
              aria-label="Loading"
            />
          )}
        </h2>
      )}
      
      {/* Error State */}
      {error && (
        <ErrorStateDisplay error={error} onRetry={onRetry} />
      )}
      
      {/* Enhanced Loading State with responsive grid */}
      {loading && drills.length === 0 ? (
        <div 
          className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          role="status"
          aria-label={`Loading ${title?.toLowerCase() || 'drills'}`}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <DrillCardSkeleton key={i} />
          ))}
        </div>
      ) : drills.length === 0 && !loading && !error ? (
        /* Empty State */
        <EmptyState config={emptyState} />
      ) : !error ? (
        /* Enhanced Drill Cards Grid with responsive breakpoints */
        <div 
          id={gridId}
          className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          role="grid"
          aria-label={`${title || 'Drills'} grid`}
        >
          {drills.map((drill, index) => (
            <div 
              key={drill.id}
              role="gridcell"
              aria-rowindex={Math.floor(index / 3) + 1}
              aria-colindex={(index % 3) + 1}
            >
              {children ? children(drill) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );

  // Wrap with error boundary if enabled
  if (enableErrorBoundary && title) {
    return (
      <DrillSectionErrorBoundary 
        sectionName={title} 
        onRetry={onRetry}
      >
        {sectionContent}
      </DrillSectionErrorBoundary>
    );
  }

  return sectionContent;
}

// Utility function to create error states
export function createErrorState(
  message: string, 
  type: ErrorType = 'unknown', 
  retryable: boolean = true
): ErrorState {
  return { message, type, retryable };
}

// Utility function to determine error type from error object
export function getErrorType(error: any): ErrorType {
  if (!error) return 'unknown';
  
  const errorMessage = error.message || error.toString().toLowerCase();
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'network';
  }
  
  if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    return 'permission';
  }
  
  if (errorMessage.includes('service') || errorMessage.includes('server')) {
    return 'service';
  }
  
  return 'unknown';
}