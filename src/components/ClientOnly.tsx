'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import { SSRSafe } from './SSRSafe';

// Generic client-only wrapper
export function createClientOnlyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
) {
  return dynamic(importFn, {
    ssr: false,
    loading: () => <>{fallback}</>,
  });
}

// Pre-configured client-only components
export const ClientOnlyLiveCodeBlock = createClientOnlyComponent(
  () => import('@/components/LiveCodeBlock'),
  <div className="h-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <p className="text-sm text-gray-500">Loading code editor...</p>
    </div>
  </div>
);

export const ClientOnlySyntaxHighlightedEditor = createClientOnlyComponent(
  () => import('@/components/SyntaxHighlightedEditor'),
  <div className="h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <p className="text-sm text-gray-500">Loading editor...</p>
    </div>
  </div>
);

export const ClientOnlyVoiceCommands = createClientOnlyComponent(
  () => import('@/components/accessibility/VoiceCommands'),
  null
);

export const ClientOnlyHighContrastMode = createClientOnlyComponent(
  () => import('@/components/accessibility/HighContrastMode'),
  null
);

export const ClientOnlyKeyboardNavigation = createClientOnlyComponent(
  () => import('@/components/accessibility/KeyboardNavigation'),
  null
);

export const ClientOnlyCodeSharing = createClientOnlyComponent(
  () => import('@/components/social/CodeSharing'),
  <div className="text-center p-4">
    <p className="text-sm text-gray-500">Loading sharing options...</p>
  </div>
);

export const ClientOnlyFloatingActionButton = createClientOnlyComponent(
  () => import('@/components/FloatingActionButton'),
  null
);

// Hook for checking if component should render client-only features
export function useClientOnly() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

// Wrapper component for conditional client-only rendering
interface ClientOnlyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  suppressHydrationWarning?: boolean;
}

export function ClientOnlyWrapper({ 
  children, 
  fallback = null,
  suppressHydrationWarning = true 
}: ClientOnlyWrapperProps) {
  return (
    <SSRSafe fallback={fallback} suppressHydrationWarning={suppressHydrationWarning}>
      {children}
    </SSRSafe>
  );
}

// Export for backward compatibility
export { SSRSafe as ClientOnly };