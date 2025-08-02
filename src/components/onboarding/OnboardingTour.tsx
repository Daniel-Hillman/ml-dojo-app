'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  Target, 
  BookOpen, 
  Users,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    type: 'click' | 'navigate' | 'highlight';
    target?: string;
    url?: string;
  };
  icon?: React.ComponentType<{ className?: string }>;
  skippable?: boolean;
}

interface OnboardingTourProps {
  steps: OnboardingStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  tourId: string;
}

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to OmniCode! 🚀',
    description: 'Let\'s take a quick tour to help you get started with interactive coding.',
    target: 'body',
    position: 'center',
    icon: Sparkles,
    skippable: true
  },
  {
    id: 'playground',
    title: 'Code Playground',
    description: 'This is where the magic happens! Write and run code instantly in your browser.',
    target: '[href="/playground"]',
    position: 'bottom',
    icon: Play,
    action: {
      type: 'highlight',
      target: '[href="/playground"]'
    }
  },
  {
    id: 'drills',
    title: 'Practice Drills',
    description: 'Build your skills with structured coding exercises and challenges.',
    target: '[href="/drills"]',
    position: 'bottom',
    icon: Target,
    action: {
      type: 'highlight',
      target: '[href="/drills"]'
    }
  },
  {
    id: 'learn',
    title: 'Learning Resources',
    description: 'Explore code templates, examples, and tutorials to accelerate your learning.',
    target: '[href="/learn"]',
    position: 'bottom',
    icon: BookOpen,
    action: {
      type: 'highlight',
      target: '[href="/learn"]'
    }
  },
  {
    id: 'community',
    title: 'Join the Community',
    description: 'Share your work, get feedback, and learn from other developers.',
    target: '[href="/community"]',
    position: 'bottom',
    icon: Users,
    action: {
      type: 'highlight',
      target: '[href="/community"]'
    }
  },
  {
    id: 'search',
    title: 'Global Search',
    description: 'Use Ctrl+K to quickly find drills, templates, and examples anywhere in the app.',
    target: '.global-search, [placeholder*="Search"]',
    position: 'bottom',
    action: {
      type: 'highlight',
      target: '.global-search, [placeholder*="Search"]'
    }
  },
  {
    id: 'complete',
    title: 'You\'re All Set! ✨',
    description: 'Ready to start coding? Click below to jump into the playground and begin your journey.',
    target: 'body',
    position: 'center',
    icon: CheckCircle,
    action: {
      type: 'navigate',
      url: '/playground'
    }
  }
];

export function OnboardingTour({ 
  steps = DEFAULT_STEPS, 
  isOpen, 
  onClose, 
  onComplete,
  tourId 
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Find target element and calculate position
  useEffect(() => {
    if (!isOpen || !step) return;

    const findTarget = () => {
      if (step.target === 'body') {
        setTargetElement(document.body);
        return;
      }

      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        
        // Scroll element into view
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
        
        // Calculate tooltip position
        const rect = element.getBoundingClientRect();
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        
        let top = 0;
        let left = 0;
        
        switch (step.position) {
          case 'top':
            top = rect.top - tooltipHeight - 20;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            break;
          case 'bottom':
            top = rect.bottom + 20;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            break;
          case 'left':
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.left - tooltipWidth - 20;
            break;
          case 'right':
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.right + 20;
            break;
          case 'center':
            top = window.innerHeight / 2 - tooltipHeight / 2;
            left = window.innerWidth / 2 - tooltipWidth / 2;
            break;
        }
        
        // Ensure tooltip stays within viewport
        top = Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20));
        left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20));
        
        setTooltipPosition({ top, left });
      }
    };

    // Try to find target immediately
    findTarget();
    
    // If not found, try again after a short delay (for dynamic content)
    const timeout = setTimeout(findTarget, 100);
    
    return () => clearTimeout(timeout);
  }, [isOpen, step, currentStep]);

  // Handle step actions
  useEffect(() => {
    if (!isOpen || !step?.action || !targetElement) return;

    switch (step.action.type) {
      case 'highlight':
        const highlightTarget = step.action.target 
          ? document.querySelector(step.action.target) as HTMLElement
          : targetElement;
        
        if (highlightTarget) {
          highlightTarget.style.outline = '2px solid #3b82f6';
          highlightTarget.style.outlineOffset = '4px';
          highlightTarget.style.borderRadius = '8px';
          
          return () => {
            highlightTarget.style.outline = '';
            highlightTarget.style.outlineOffset = '';
            highlightTarget.style.borderRadius = '';
          };
        }
        break;
    }
  }, [isOpen, step, targetElement]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
        case 'Enter':
          if (!isLastStep) {
            handleNext();
          } else {
            handleComplete();
          }
          break;
        case 'ArrowLeft':
          if (!isFirstStep) {
            handlePrevious();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, isLastStep, isFirstStep]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Execute final action if present
    if (step?.action?.type === 'navigate' && step.action.url) {
      window.location.href = step.action.url;
    }
    
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
        onClick={step?.position === 'center' ? undefined : onClose}
      />
      
      {/* Tooltip */}
      <Card 
        className="fixed z-50 w-80 shadow-2xl border-2 border-blue-200 bg-white"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: step?.position === 'center' ? 'translate(-50%, -50%)' : undefined
        }}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {step?.icon && (
                <div className="p-2 bg-blue-100 rounded-lg">
                  <step.icon className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {step?.title}
                </h3>
                <Badge variant="outline" className="text-xs mt-1">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {step?.description}
          </p>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progress</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>
              )}
              
              {step?.skippable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-gray-500"
                >
                  Skip Tour
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isLastStep ? (
                <Button
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Use arrow keys to navigate • Press Esc to close
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Spotlight effect for highlighted elements */}
      {targetElement && step?.position !== 'center' && (
        <div 
          className="fixed z-40 pointer-events-none"
          style={{
            top: targetElement.getBoundingClientRect().top - 8,
            left: targetElement.getBoundingClientRect().left - 8,
            width: targetElement.getBoundingClientRect().width + 16,
            height: targetElement.getBoundingClientRect().height + 16,
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '12px',
            transition: 'all 0.3s ease'
          }}
        />
      )}
    </>
  );
}

// Hook for managing onboarding state
export function useOnboarding(tourId: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    // Check if user has completed this tour
    const completed = localStorage.getItem(`onboarding-${tourId}-completed`);
    setHasCompleted(completed === 'true');
  }, [tourId]);

  const startTour = () => {
    setIsOpen(true);
  };

  const closeTour = () => {
    setIsOpen(false);
  };

  const completeTour = () => {
    localStorage.setItem(`onboarding-${tourId}-completed`, 'true');
    setHasCompleted(true);
    setIsOpen(false);
  };

  const resetTour = () => {
    localStorage.removeItem(`onboarding-${tourId}-completed`);
    setHasCompleted(false);
  };

  return {
    isOpen,
    hasCompleted,
    startTour,
    closeTour,
    completeTour,
    resetTour
  };
}