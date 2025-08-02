'use client';

import React, { useState, useEffect } from 'react';

interface SSRSafeProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  suppressHydrationWarning?: boolean;
}

/**
 * Component that only renders its children on the client side
 * Prevents hydration mismatches for components that use browser-specific APIs
 */
export function SSRSafe({ 
  children, 
  fallback = null, 
  suppressHydrationWarning = false 
}: SSRSafeProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div suppressHydrationWarning={suppressHydrationWarning}>{fallback}</div>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component that makes any component SSR-safe
 */
export function withSSRSafe<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const SSRSafeComponent = (props: P) => (
    <SSRSafe fallback={fallback}>
      <Component {...props} />
    </SSRSafe>
  );

  SSRSafeComponent.displayName = `withSSRSafe(${Component.displayName || Component.name})`;
  
  return SSRSafeComponent;
}

/**
 * Component for conditionally rendering content based on client/server
 */
interface ConditionalRenderProps {
  client?: React.ReactNode;
  server?: React.ReactNode;
  suppressHydrationWarning?: boolean;
}

export function ConditionalRender({ 
  client, 
  server, 
  suppressHydrationWarning = false 
}: ConditionalRenderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div suppressHydrationWarning={suppressHydrationWarning}>
      {isClient ? client : server}
    </div>
  );
}

/**
 * Component that delays rendering until after hydration
 */
interface DelayedRenderProps {
  children: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
}

export function DelayedRender({ 
  children, 
  delay = 0, 
  fallback = null 
}: DelayedRenderProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component that handles hydration-safe date/time rendering
 */
interface SafeDateProps {
  date: Date | string | number;
  format?: Intl.DateTimeFormatOptions;
  locale?: string;
  fallback?: string;
}

export function SafeDate({ 
  date, 
  format = {}, 
  locale = 'en-US', 
  fallback = 'Loading...' 
}: SafeDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>(fallback);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const dateObj = new Date(date);
      const formatted = dateObj.toLocaleDateString(locale, format);
      setFormattedDate(formatted);
    } catch (error) {
      console.warn('Error formatting date:', error);
      setFormattedDate('Invalid Date');
    }
  }, [date, format, locale]);

  return <span suppressHydrationWarning={!isClient}>{formattedDate}</span>;
}

/**
 * Component for safe random content that won't cause hydration mismatches
 */
interface SafeRandomProps {
  children: (value: number) => React.ReactNode;
  seed?: number;
}

export function SafeRandom({ children, seed }: SafeRandomProps) {
  const [randomValue, setRandomValue] = useState(seed || 0);

  useEffect(() => {
    setRandomValue(Math.random());
  }, []);

  return <>{children(randomValue)}</>;
}

/**
 * Hook for safe random values
 */
export function useSafeRandom(seed?: number): number {
  const [randomValue, setRandomValue] = useState(seed || 0);

  useEffect(() => {
    setRandomValue(Math.random());
  }, []);

  return randomValue;
}