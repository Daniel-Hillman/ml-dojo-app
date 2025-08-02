'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Code, BookOpen, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';

interface QuickAction {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: '/playground',
    icon: Play,
    label: 'Try Live Code',
    description: 'Interactive code playground',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    href: '/drills/create',
    icon: Plus,
    label: 'Create Drill',
    description: 'Build custom practice drill',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    href: '/learn',
    icon: BookOpen,
    label: 'Code Examples',
    description: 'Browse learning materials',
    color: 'bg-purple-500 hover:bg-purple-600'
  }
];

interface FloatingActionButtonProps {
  className?: string;
  primaryAction?: 'playground' | 'create' | 'learn';
}

export function FloatingActionButton({ 
  className,
  primaryAction = 'playground' 
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useMobile();

  // Don't show on mobile as we have bottom navigation
  if (isMobile) {
    return null;
  }

  const primaryActionData = QUICK_ACTIONS.find(action => 
    action.href.includes(primaryAction)
  ) || QUICK_ACTIONS[0];

  const secondaryActions = QUICK_ACTIONS.filter(action => 
    !action.href.includes(primaryAction)
  );

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3",
      className
    )}>
      {/* Secondary Actions */}
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200">
          {secondaryActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Button
                  size="sm"
                  className={cn(
                    "h-12 w-12 rounded-full shadow-lg transition-all duration-200 hover:scale-105",
                    action.color
                  )}
                  onClick={() => setIsExpanded(false)}
                  title={action.description}
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{action.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      )}

      {/* Primary Action Button */}
      <div className="relative">
        {/* Main Action */}
        <Link href={primaryActionData.href}>
          <Button
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all duration-200 hover:scale-105",
              primaryActionData.color,
              isExpanded && "scale-95"
            )}
            title={primaryActionData.description}
          >
            <primaryActionData.icon className="h-6 w-6" />
            <span className="sr-only">{primaryActionData.label}</span>
          </Button>
        </Link>

        {/* Expand/Collapse Button */}
        <Button
          size="sm"
          variant="secondary"
          className="absolute -top-1 -right-1 h-6 w-6 rounded-full shadow-md hover:scale-110 transition-all duration-200"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Hide quick actions" : "Show more quick actions"}
        >
          {isExpanded ? (
            <X className="h-3 w-3" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          <span className="sr-only">
            {isExpanded ? "Hide quick actions" : "Show more quick actions"}
          </span>
        </Button>
      </div>

      {/* Tooltip for primary action */}
      {!isExpanded && (
        <div className="absolute right-16 bottom-4 bg-black/80 text-white text-sm px-3 py-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          {primaryActionData.description}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-0 h-0 border-l-4 border-l-black/80 border-y-4 border-y-transparent"></div>
        </div>
      )}
    </div>
  );
}

// Keyboard shortcut handler
export function useFloatingActionKeyboard() {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Quick access shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'Enter':
            event.preventDefault();
            window.location.href = '/playground';
            break;
          case 'n':
            event.preventDefault();
            window.location.href = '/drills/create';
            break;
          case 'l':
            event.preventDefault();
            window.location.href = '/learn';
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}