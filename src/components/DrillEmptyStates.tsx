"use client";

import React from 'react';
import { PlusCircle, Users, FileText, History, Play, BookOpen, Sparkles, Target, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { EmptyStateConfig } from './DrillSection';

// Enhanced empty state configurations with multiple actions and tips
export const DRILL_EMPTY_STATES: Record<string, EmptyStateConfig & {
  tips?: string[];
  secondaryActions?: Array<{
    text: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
  encouragement?: string;
}> = {
  // Personal drills empty state
  personal: {
    icon: PlusCircle,
    title: 'Ready to create your first drill? 🚀',
    description: 'Build personalized coding challenges that match your learning goals and skill level.',
    actionButton: {
      text: 'Create Your First Drill',
      href: '/drills/create'
    },
    secondaryActions: [
      {
        text: 'Try Live Code',
        href: '/playground',
        icon: Play,
        variant: 'outline'
      },
      {
        text: 'Browse Examples',
        href: '/learn',
        icon: BookOpen,
        variant: 'ghost'
      }
    ],
    tips: [
      'Start with a simple concept you want to practice',
      'Use fill-in-the-blank format for interactive learning',
      'Add multiple choice questions to test understanding'
    ],
    encouragement: 'Every expert was once a beginner. Start your journey today!'
  },

  // Saved community drills empty state
  saved: {
    icon: Users,
    title: 'Discover amazing community drills! ✨',
    description: 'Thousands of developers have shared their knowledge. Find drills that match your interests and save them for practice.',
    actionButton: {
      text: 'Explore Community',
      href: '/community'
    },
    secondaryActions: [
      {
        text: 'Create Your Own',
        href: '/drills/create',
        icon: PlusCircle,
        variant: 'outline'
      },
      {
        text: 'Try Playground',
        href: '/playground',
        icon: Code,
        variant: 'ghost'
      }
    ],
    tips: [
      'Use filters to find drills in your preferred language',
      'Look for drills with high ratings and good reviews',
      'Save drills that challenge you at the right level'
    ],
    encouragement: 'Learning from others accelerates your growth!'
  },

  // Review queue empty state
  review: {
    icon: History,
    title: 'Your review queue is empty! 📚',
    description: 'Complete some practice drills to build your spaced repetition queue and reinforce your learning.',
    actionButton: {
      text: 'Start Practicing',
      href: '/drills'
    },
    secondaryActions: [
      {
        text: 'Browse Community',
        href: '/community',
        icon: Users,
        variant: 'outline'
      },
      {
        text: 'Quick Practice',
        href: '/playground',
        icon: Target,
        variant: 'ghost'
      }
    ],
    tips: [
      'Complete drills to add them to your review schedule',
      'Reviews help strengthen long-term memory',
      'Consistent practice leads to mastery'
    ],
    encouragement: 'Spaced repetition is the key to lasting knowledge!'
  },

  // General drills empty state
  general: {
    icon: FileText,
    title: 'Let\'s get you started! 🎯',
    description: 'Choose your path: create custom drills, explore community content, or jump straight into coding.',
    actionButton: {
      text: 'Create First Drill',
      href: '/drills/create'
    },
    secondaryActions: [
      {
        text: 'Browse Community',
        href: '/community',
        icon: Users,
        variant: 'outline'
      },
      {
        text: 'Try Live Code',
        href: '/playground',
        icon: Play,
        variant: 'ghost'
      }
    ],
    tips: [
      'Start with topics you\'re curious about',
      'Practice regularly for best results',
      'Join the community to learn from others'
    ],
    encouragement: 'Your coding journey starts with a single step!'
  }
};

// Enhanced empty state component
export function EnhancedEmptyState({ 
  config, 
  className 
}: { 
  config: typeof DRILL_EMPTY_STATES[keyof typeof DRILL_EMPTY_STATES];
  className?: string;
}) {
  const Icon = config.icon;

  return (
    <Card className={`border-dashed border-2 border-gray-200 bg-gray-50/50 ${className}`}>
      <CardContent className="p-8 text-center">
        {/* Icon and Title */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {config.title}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
            {config.description}
          </p>
        </div>

        {/* Primary Action */}
        <div className="mb-6">
          <Link href={config.actionButton.href}>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8">
              {config.actionButton.text}
            </Button>
          </Link>
        </div>

        {/* Secondary Actions */}
        {config.secondaryActions && (
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {config.secondaryActions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <Link key={index} href={action.href}>
                  <Button variant={action.variant || 'outline'} size="sm">
                    {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
                    {action.text}
                  </Button>
                </Link>
              );
            })}
          </div>
        )}

        {/* Tips Section */}
        {config.tips && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <Badge variant="outline" className="text-xs">
                Quick Tips
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
              {config.tips.map((tip, index) => (
                <div key={index} className="text-sm text-gray-600 bg-white rounded-lg p-3 border">
                  <span className="font-medium text-blue-600">💡</span> {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Encouragement */}
        {config.encouragement && (
          <div className="text-sm text-gray-500 italic">
            {config.encouragement}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to get empty state config by key
export function getEmptyStateConfig(key: keyof typeof DRILL_EMPTY_STATES): EmptyStateConfig {
  return DRILL_EMPTY_STATES[key] || DRILL_EMPTY_STATES.general;
}