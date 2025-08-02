'use client';

import React from 'react';
import { FeatureTooltip, HelpTooltip } from './FeatureTooltip';
import { Code, Play, Search, Bookmark, Settings, Users } from 'lucide-react';

// Contextual help for different app sections
export function CodePlaygroundHelp() {
  return (
    <FeatureTooltip
      content="Try live code execution with multiple languages. Press Ctrl+Enter to run code quickly!"
      title="Live Code Playground"
      featureId="code-playground"
      trigger="auto"
      position="bottom"
    >
      <div className="inline-flex items-center gap-2">
        <Code size={20} />
        <span>Code Playground</span>
      </div>
    </FeatureTooltip>
  );
}

export function GlobalSearchHelp() {
  return (
    <FeatureTooltip
      content="Search across all drills, templates, and code examples. Use Ctrl+K for quick access!"
      title="Global Search"
      featureId="global-search"
      trigger="auto"
      position="bottom"
    >
      <Search size={20} />
    </FeatureTooltip>
  );
}

export function FloatingActionHelp() {
  return (
    <FeatureTooltip
      content="Quick access to create new drills or try live code from anywhere in the app"
      title="Quick Actions"
      featureId="floating-action"
      trigger="hover"
      position="left"
    >
      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
        <Play size={20} className="text-white" />
      </div>
    </FeatureTooltip>
  );
}

export function DrillCreationHelp() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HelpTooltip 
          content="Choose a programming language for your drill. This affects syntax highlighting and execution."
          title="Language Selection"
        />
        <span>Programming Language</span>
      </div>
      
      <div className="flex items-center gap-2">
        <HelpTooltip 
          content="Set the difficulty level to help users find appropriate challenges for their skill level."
          title="Difficulty Level"
        />
        <span>Difficulty</span>
      </div>
      
      <div className="flex items-center gap-2">
        <HelpTooltip 
          content="Add tags to make your drill discoverable. Use relevant keywords like 'algorithms', 'beginner', etc."
          title="Tags"
        />
        <span>Tags</span>
      </div>
    </div>
  );
}

export function PersonalizationHelp() {
  return (
    <FeatureTooltip
      content="Customize your learning experience based on your preferred languages and skill level"
      title="Personalized Dashboard"
      featureId="personalization"
      trigger="auto"
      position="top"
    >
      <div className="flex items-center gap-2">
        <Settings size={16} />
        <span>Customize</span>
      </div>
    </FeatureTooltip>
  );
}

export function CommunityHelp() {
  return (
    <FeatureTooltip
      content="Connect with other learners, share your code, and get feedback on your solutions"
      title="Community Features"
      featureId="community"
      trigger="auto"
      position="bottom"
    >
      <div className="flex items-center gap-2">
        <Users size={16} />
        <span>Community</span>
      </div>
    </FeatureTooltip>
  );
}

// Onboarding sequence for new users
export function OnboardingTooltips() {
  const tooltips = [
    {
      id: 'welcome',
      content: 'Welcome to OmniCode! Let\'s take a quick tour of the key features.',
      title: 'Welcome! 👋',
      element: '.main-content'
    },
    {
      id: 'playground',
      content: 'Start here to try live code execution with multiple programming languages.',
      title: 'Code Playground',
      element: '[data-tour="playground"]'
    },
    {
      id: 'search',
      content: 'Use global search (Ctrl+K) to quickly find drills, templates, and examples.',
      title: 'Global Search',
      element: '[data-tour="search"]'
    },
    {
      id: 'drills',
      content: 'Practice with coding drills or create your own to share with the community.',
      title: 'Practice Drills',
      element: '[data-tour="drills"]'
    },
    {
      id: 'floating-action',
      content: 'Use this button for quick access to create content or try live code.',
      title: 'Quick Actions',
      element: '[data-tour="floating-action"]'
    }
  ];

  return (
    <div className="onboarding-tooltips">
      {/* This would be managed by the OnboardingTour component */}
    </div>
  );
}