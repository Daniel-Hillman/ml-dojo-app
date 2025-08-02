'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardNavigationProps {
  children: React.ReactNode;
}

// Global keyboard shortcuts
const GLOBAL_SHORTCUTS = {
  'ctrl+k': () => {
    // Open global search
    const searchButton = document.querySelector('[data-search-trigger]') as HTMLElement;
    searchButton?.click();
  },
  'ctrl+enter': () => {
    // Run code in active editor
    const runButton = document.querySelector('[data-run-code]') as HTMLElement;
    runButton?.click();
  },
  'ctrl+/': () => {
    // Toggle help/shortcuts panel
    const helpButton = document.querySelector('[data-help-trigger]') as HTMLElement;
    helpButton?.click();
  },
  'alt+n': () => {
    // New drill
    window.location.href = '/drills/create';
  },
  'alt+p': () => {
    // Go to playground
    window.location.href = '/playground';
  },
  'alt+d': () => {
    // Go to drills
    window.location.href = '/drills';
  },
  'alt+c': () => {
    // Go to community
    window.location.href = '/community';
  },
  'escape': () => {
    // Close modals/overlays
    const closeButtons = document.querySelectorAll('[data-close-modal]');
    closeButtons.forEach(button => (button as HTMLElement).click());
  }
};

export function KeyboardNavigation({ children }: KeyboardNavigationProps) {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey;
      const alt = event.altKey;
      const shift = event.shiftKey;

      // Build shortcut string
      let shortcut = '';
      if (ctrl) shortcut += 'ctrl+';
      if (alt) shortcut += 'alt+';
      if (shift) shortcut += 'shift+';
      shortcut += key;

      // Handle global shortcuts
      if (GLOBAL_SHORTCUTS[shortcut as keyof typeof GLOBAL_SHORTCUTS]) {
        event.preventDefault();
        GLOBAL_SHORTCUTS[shortcut as keyof typeof GLOBAL_SHORTCUTS]();
        return;
      }

      // Handle tab navigation
      if (key === 'tab') {
        handleTabNavigation(event);
      }

      // Handle arrow key navigation for custom components
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        handleArrowNavigation(event);
      }

      // Show shortcuts help
      if (key === 'f1' || (ctrl && key === '?')) {
        event.preventDefault();
        setShowShortcuts(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTabNavigation = (event: KeyboardEvent) => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (event.shiftKey) {
      // Shift+Tab - go backwards
      const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
      focusableElements[prevIndex]?.focus();
    } else {
      // Tab - go forwards
      const nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
      focusableElements[nextIndex]?.focus();
    }
  };

  const handleArrowNavigation = (event: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement;
    
    // Handle navigation in lists, grids, etc.
    if (activeElement?.dataset.navigable) {
      event.preventDefault();
      
      const container = activeElement.closest('[data-navigation-container]');
      if (!container) return;

      const items = Array.from(container.querySelectorAll('[data-navigable]')) as HTMLElement[];
      const currentIndex = items.indexOf(activeElement);

      let nextIndex = currentIndex;
      
      switch (event.key.toLowerCase()) {
        case 'arrowup':
          nextIndex = Math.max(0, currentIndex - 1);
          break;
        case 'arrowdown':
          nextIndex = Math.min(items.length - 1, currentIndex + 1);
          break;
        case 'arrowleft':
          nextIndex = Math.max(0, currentIndex - 1);
          break;
        case 'arrowright':
          nextIndex = Math.min(items.length - 1, currentIndex + 1);
          break;
      }

      items[nextIndex]?.focus();
    }
  };

  const getFocusableElements = (): HTMLElement[] => {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[data-focusable]'
    ].join(', ');

    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  };

  return (
    <>
      {children}
      
      {/* Keyboard shortcuts help overlay */}
      {showShortcuts && (
        <KeyboardShortcutsHelp onClose={() => setShowShortcuts(false)} />
      )}
      
      {/* Focus indicator */}
      <FocusIndicator />
    </>
  );
}

// Focus indicator for better visibility
function FocusIndicator() {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      setFocusedElement(event.target as HTMLElement);
    };

    const handleBlur = () => {
      setFocusedElement(null);
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  if (!focusedElement) return null;

  const rect = focusedElement.getBoundingClientRect();

  return (
    <div
      className="fixed pointer-events-none z-50 border-2 border-blue-500 rounded"
      style={{
        top: rect.top - 2,
        left: rect.left - 2,
        width: rect.width + 4,
        height: rect.height + 4,
        transition: 'all 0.1s ease'
      }}
    />
  );
}

// Keyboard shortcuts help panel
function KeyboardShortcutsHelp({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: 'Ctrl + K', description: 'Open global search' },
    { key: 'Ctrl + Enter', description: 'Run code' },
    { key: 'Ctrl + /', description: 'Toggle help' },
    { key: 'Alt + N', description: 'New drill' },
    { key: 'Alt + P', description: 'Go to playground' },
    { key: 'Alt + D', description: 'Go to drills' },
    { key: 'Alt + C', description: 'Go to community' },
    { key: 'Escape', description: 'Close modals' },
    { key: 'Tab', description: 'Navigate forward' },
    { key: 'Shift + Tab', description: 'Navigate backward' },
    { key: 'Arrow Keys', description: 'Navigate lists/grids' },
    { key: 'F1', description: 'Show this help' }
  ];

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            data-close-modal
          >
            ×
          </button>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {shortcut.description}
              </span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Press F1 or Ctrl+? to show this help anytime
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook for components that need keyboard navigation
export function useKeyboardNavigation() {
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsNavigating(true);
      }
    };

    const handleMouseDown = () => {
      setIsNavigating(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return { isNavigating };
}

// Focusable component wrapper
export function Focusable({ 
  children, 
  onFocus, 
  onBlur,
  navigable = false,
  ...props 
}: {
  children: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  navigable?: boolean;
  [key: string]: any;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      tabIndex={0}
      onFocus={onFocus}
      onBlur={onBlur}
      data-focusable
      data-navigable={navigable ? 'true' : undefined}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
      {...props}
    >
      {children}
    </div>
  );
}