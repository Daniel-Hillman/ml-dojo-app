"use client";

import { PlusCircle, Users, FileText, History } from 'lucide-react';
import { EmptyStateConfig } from './DrillSection';

// Empty state configurations for different drill sections
export const DRILL_EMPTY_STATES: Record<string, EmptyStateConfig> = {
  // Personal drills empty state
  personal: {
    icon: PlusCircle,
    title: 'No personal drills yet',
    description: 'Create your first custom drill to start building your personalized practice collection.',
    actionButton: {
      text: 'Create Your First Drill',
      href: '/drills/create'
    }
  },

  // Saved community drills empty state
  saved: {
    icon: Users,
    title: 'No saved community drills yet',
    description: 'Explore the community to discover and save drills created by other learners.',
    actionButton: {
      text: 'Browse Community Drills',
      href: '/community'
    }
  },

  // Review queue empty state
  review: {
    icon: History,
    title: 'No drills due for review',
    description: 'Complete some drills to build your review queue and strengthen your knowledge.',
    actionButton: {
      text: 'Practice Drills',
      href: '/drills'
    }
  },

  // General drills empty state
  general: {
    icon: FileText,
    title: 'No drills available',
    description: 'Start by creating your own drill or exploring the community for inspiration.',
    actionButton: {
      text: 'Get Started',
      href: '/drills/create'
    }
  }
};

// Helper function to get empty state config by key
export function getEmptyStateConfig(key: keyof typeof DRILL_EMPTY_STATES): EmptyStateConfig {
  return DRILL_EMPTY_STATES[key] || DRILL_EMPTY_STATES.general;
}