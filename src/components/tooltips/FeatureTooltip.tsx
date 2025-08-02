'use client';

import React, { useState, useEffect } from 'react';
import { X, HelpCircle } from 'lucide-react';

interface FeatureTooltipProps {
  children: React.ReactNode;
  content: string;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'auto';
  delay?: number;
  featureId: string;
  showOnFirstVisit?: boolean;
}

export function FeatureTooltip({
  children,
  content,
  title,
  position = 'top',
  trigger = 'hover',
  delay = 500,
  featureId,
  showOnFirstVisit = true
}: FeatureTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if user has seen this tooltip before
    const seenTooltips = JSON.parse(localStorage.getItem('seenTooltips') || '[]');
    const alreadySeen = seenTooltips.includes(featureId);
    setHasBeenSeen(alreadySeen);

    // Auto-show on first visit if enabled
    if (showOnFirstVisit && !alreadySeen && trigger === 'auto') {
      const autoShowTimeout = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(autoShowTimeout);
    }
  }, [featureId, showOnFirstVisit, trigger, delay]);

  const showTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => {
      setIsVisible(true);
    }, trigger === 'hover' ? delay : 0);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const markAsSeen = () => {
    const seenTooltips = JSON.parse(localStorage.getItem('seenTooltips') || '[]');
    if (!seenTooltips.includes(featureId)) {
      seenTooltips.push(featureId);
      localStorage.setItem('seenTooltips', JSON.stringify(seenTooltips));
    }
    setHasBeenSeen(true);
    hideTooltip();
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800';
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={trigger === 'hover' ? showTooltip : undefined}
        onMouseLeave={trigger === 'hover' ? hideTooltip : undefined}
        onClick={trigger === 'click' ? showTooltip : undefined}
        className="cursor-help"
      >
        {children}
        {!hasBeenSeen && showOnFirstVisit && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
        )}
      </div>

      {isVisible && (
        <>
          <div className="fixed inset-0 z-40" onClick={hideTooltip} />
          <div className={`absolute z-50 ${getPositionClasses()}`}>
            <div className="bg-gray-800 text-white text-sm rounded-lg p-3 shadow-lg max-w-xs">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {title && (
                    <div className="font-semibold mb-1 text-blue-300">{title}</div>
                  )}
                  <div className="text-gray-200">{content}</div>
                </div>
                <button
                  onClick={markAsSeen}
                  className="ml-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              {!hasBeenSeen && (
                <button
                  onClick={markAsSeen}
                  className="mt-2 text-xs text-blue-300 hover:text-blue-200 transition-colors"
                >
                  Got it, don't show again
                </button>
              )}
            </div>
            <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`} />
          </div>
        </>
      )}
    </div>
  );
}

// Helper component for contextual help icons
export function HelpTooltip({ content, title }: { content: string; title?: string }) {
  return (
    <FeatureTooltip
      content={content}
      title={title}
      trigger="hover"
      featureId={`help-${Math.random()}`}
      showOnFirstVisit={false}
    >
      <HelpCircle size={16} className="text-gray-400 hover:text-gray-600 transition-colors" />
    </FeatureTooltip>
  );
}