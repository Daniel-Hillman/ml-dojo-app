'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Play, 
  BookOpen, 
  Target, 
  X,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface WelcomeBannerProps {
  userName?: string;
  onStartTour: () => void;
  onDismiss: () => void;
  className?: string;
}

export function WelcomeBanner({ 
  userName, 
  onStartTour, 
  onDismiss, 
  className 
}: WelcomeBannerProps) {
  const quickActions = [
    {
      href: '/playground',
      icon: Play,
      label: 'Try Live Code',
      description: 'Start coding instantly',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      href: '/drills',
      icon: Target,
      label: 'Practice Drills',
      description: 'Build your skills',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      href: '/learn',
      icon: BookOpen,
      label: 'Browse Examples',
      description: 'Learn from templates',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <Card className={cn(
      "border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Welcome to OmniCode{userName ? `, ${userName}` : ''}! 🚀
              </h2>
              <p className="text-gray-600 mt-1">
                Ready to start your interactive coding journey?
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{action.label}</h3>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={onStartTour}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Take the Tour
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Badge variant="outline" className="text-xs">
                New
              </Badge>
              <span>5-minute guided tour</span>
            </div>
          </div>

          <Link href="/playground">
            <Button variant="outline" className="group">
              Jump to Playground
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Features highlight */}
        <div className="mt-6 pt-6 border-t border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: '🚀', label: 'Live Execution', desc: 'Run code instantly' },
              { icon: '📚', label: 'Multiple Languages', desc: 'JS, Python, HTML+' },
              { icon: '🎯', label: 'Practice Drills', desc: 'Skill-building exercises' },
              { icon: '👥', label: 'Community', desc: 'Share & learn together' }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl mb-2">{feature.icon}</div>
                <h4 className="font-medium text-sm text-gray-900">{feature.label}</h4>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for managing welcome banner state
export function useWelcomeBanner() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('welcome-banner-dismissed');
    const onboardingCompleted = localStorage.getItem('onboarding-main-completed');
    
    // Show banner if not dismissed and onboarding not completed
    if (dismissed !== 'true' && onboardingCompleted !== 'true') {
      setIsVisible(true);
    }
    
    setIsDismissed(dismissed === 'true');
  }, []);

  const dismissBanner = () => {
    localStorage.setItem('welcome-banner-dismissed', 'true');
    setIsVisible(false);
    setIsDismissed(true);
  };

  const resetBanner = () => {
    localStorage.removeItem('welcome-banner-dismissed');
    setIsVisible(true);
    setIsDismissed(false);
  };

  return {
    isVisible,
    isDismissed,
    dismissBanner,
    resetBanner
  };
}