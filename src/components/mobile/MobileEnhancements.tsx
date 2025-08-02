'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  Search,
  Menu,
  X,
  Play,
  Code,
  BookOpen,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useMobile } from '@/hooks/use-mobile';

// Enhanced mobile navigation with gestures
export function MobileTabNavigation({ 
  tabs, 
  activeTab, 
  onTabChange,
  className 
}: {
  tabs: Array<{ id: string; label: string; icon?: React.ComponentType<{ className?: string }> }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Touch gesture handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      
      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        onTabChange(tabs[currentIndex + 1].id);
      } else if (isRightSwipe && currentIndex > 0) {
        onTabChange(tabs[currentIndex - 1].id);
      }
    }
  };

  // Check scroll position
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScroll);
      return () => scrollElement.removeEventListener('scroll', checkScroll);
    }
  }, [tabs]);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -100, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 100, behavior: 'smooth' });
  };

  return (
    <div className={cn("relative", className)}>
      {/* Scroll buttons */}
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white shadow-md"
          onClick={scrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      
      {canScrollRight && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white shadow-md"
          onClick={scrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Scrollable tabs */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide gap-2 px-4 py-2"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-shrink-0 min-w-fit px-4 py-2 transition-all duration-200",
                isActive && "shadow-md"
              )}
            >
              {Icon && <Icon className="h-4 w-4 mr-2" />}
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Swipe indicator */}
      <div className="flex justify-center mt-2">
        <div className="flex gap-1">
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                tab.id === activeTab ? "bg-primary" : "bg-gray-300"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Mobile-optimized card with touch feedback
export function TouchCard({ 
  children, 
  onClick, 
  className,
  hapticFeedback = true 
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  hapticFeedback?: boolean;
}) {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = () => {
    setIsPressed(true);
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10); // Light haptic feedback
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <Card
      className={cn(
        "transition-all duration-150 cursor-pointer",
        isPressed ? "scale-95 shadow-sm" : "hover:shadow-md",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

// Mobile search overlay
export function MobileSearchOverlay({ 
  isOpen, 
  onClose 
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search drills, templates, examples..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="p-4">
        {query ? (
          <div className="space-y-3">
            {/* Mock search results */}
            {[
              { title: 'JavaScript Basics', type: 'template', language: 'JavaScript' },
              { title: 'Python Functions', type: 'drill', language: 'Python' },
              { title: 'HTML Structure', type: 'example', language: 'HTML' }
            ].map((result, index) => (
              <TouchCard key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{result.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {result.type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {result.language}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </TouchCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start typing to search...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Mobile quick actions menu
export function MobileQuickActions({ 
  isOpen, 
  onClose 
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const quickActions = [
    {
      href: '/playground',
      icon: Play,
      label: 'Try Live Code',
      description: 'Interactive coding environment',
      color: 'bg-blue-500'
    },
    {
      href: '/drills/create',
      icon: Target,
      label: 'Create Drill',
      description: 'Build custom practice',
      color: 'bg-green-500'
    },
    {
      href: '/learn',
      icon: BookOpen,
      label: 'Browse Examples',
      description: 'Code templates & tutorials',
      color: 'bg-purple-500'
    },
    {
      href: '/community',
      icon: Code,
      label: 'Community',
      description: 'Share & discover',
      color: 'bg-orange-500'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div 
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
        
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} onClick={onClose}>
                <TouchCard className="p-4 text-center">
                  <div className={`w-12 h-12 ${action.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-medium text-sm">{action.label}</h4>
                  <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                </TouchCard>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hook for mobile enhancements
export function useMobileEnhancements() {
  const isMobile = useMobile();
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  // Prevent body scroll when overlays are open
  useEffect(() => {
    if (searchOpen || quickActionsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [searchOpen, quickActionsOpen]);

  return {
    isMobile,
    searchOpen,
    setSearchOpen,
    quickActionsOpen,
    setQuickActionsOpen
  };
}