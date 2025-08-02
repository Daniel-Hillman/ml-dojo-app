'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbsProps {
  className?: string;
  customItems?: BreadcrumbItem[];
}

export function Breadcrumbs({ className, customItems }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname if no custom items provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) return customItems;

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/', icon: Home }
    ];

    let currentPath = '';
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Convert segment to readable label
      let label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Special cases for better labels
      const labelMap: Record<string, string> = {
        'drills': 'Practice Drills',
        'create': 'Create Drill',
        'playground': 'Code Playground',
        'api-keys': 'API Keys',
        'live-code-demo': 'Live Code Demo',
        'community': 'Community',
        'learn': 'Learn & Examples',
        'profile': 'Profile',
        'settings': 'Settings'
      };

      if (labelMap[segment]) {
        label = labelMap[segment];
      }

      // Don't add dynamic IDs as breadcrumbs (they're usually UUIDs or similar)
      if (!segment.match(/^[a-f0-9-]{20,}$/i)) {
        breadcrumbs.push({
          label,
          href: currentPath
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on home page
  if (pathname === '/' || breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav 
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
      aria-label="Breadcrumb navigation"
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight 
                  className="h-4 w-4 mx-1 text-muted-foreground/50" 
                  aria-hidden="true"
                />
              )}
              
              {isLast ? (
                <span 
                  className="font-medium text-foreground flex items-center"
                  aria-current="page"
                >
                  {Icon && <Icon className="h-4 w-4 mr-1" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors flex items-center"
                >
                  {Icon && <Icon className="h-4 w-4 mr-1" />}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Hook for custom breadcrumb management
export function useBreadcrumbs() {
  const [customBreadcrumbs, setCustomBreadcrumbs] = React.useState<BreadcrumbItem[]>([]);

  const setBreadcrumbs = React.useCallback((items: BreadcrumbItem[]) => {
    setCustomBreadcrumbs(items);
  }, []);

  const addBreadcrumb = React.useCallback((item: BreadcrumbItem) => {
    setCustomBreadcrumbs(prev => [...prev, item]);
  }, []);

  const clearBreadcrumbs = React.useCallback(() => {
    setCustomBreadcrumbs([]);
  }, []);

  return {
    customBreadcrumbs,
    setBreadcrumbs,
    addBreadcrumb,
    clearBreadcrumbs
  };
}

// Breadcrumb context for complex navigation scenarios
interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  clearBreadcrumbs: () => void;
}

const BreadcrumbContext = React.createContext<BreadcrumbContextType | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const breadcrumbHook = useBreadcrumbs();

  return (
    <BreadcrumbContext.Provider value={breadcrumbHook}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  const context = React.useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumbContext must be used within a BreadcrumbProvider');
  }
  return context;
}