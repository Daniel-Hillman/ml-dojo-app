"use client";

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface GlobalErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  showHelpButton?: boolean;
  retryText?: string;
}

export function GlobalErrorState({
  title = "Unable to load practice drills",
  message = "We're having trouble loading your practice drills. This might be due to a network issue or temporary service problem.",
  onRetry,
  showHomeButton = true,
  showHelpButton = false,
  retryText = "Try Again"
}: GlobalErrorStateProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">{title}</h2>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {message}
          </p>
          
          <div className="flex flex-col gap-2">
            {onRetry && (
              <Button onClick={onRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                {retryText}
              </Button>
            )}
            
            {showHomeButton && (
              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
              </Link>
            )}
            
            {showHelpButton && (
              <Link href="/help" className="w-full">
                <Button variant="ghost" className="w-full">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Get Help
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Specific error state for authentication issues
export function AuthErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <GlobalErrorState
      title="Authentication Required"
      message="You need to be signed in to view your practice drills. Please sign in and try again."
      onRetry={onRetry}
      retryText="Sign In"
      showHomeButton={true}
      showHelpButton={false}
    />
  );
}

// Specific error state for network issues
export function NetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <GlobalErrorState
      title="Connection Problem"
      message="We're having trouble connecting to our servers. Please check your internet connection and try again."
      onRetry={onRetry}
      retryText="Retry Connection"
      showHomeButton={true}
      showHelpButton={false}
    />
  );
}

// Specific error state for service unavailable
export function ServiceErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <GlobalErrorState
      title="Service Temporarily Unavailable"
      message="Our practice drill service is temporarily unavailable. We're working to fix this issue. Please try again in a few minutes."
      onRetry={onRetry}
      retryText="Try Again"
      showHomeButton={true}
      showHelpButton={true}
    />
  );
}