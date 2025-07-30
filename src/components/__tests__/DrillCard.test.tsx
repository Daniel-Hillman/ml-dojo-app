import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DrillCard, BasicDrillCard } from '../DrillCard';
import { EnhancedDrill, Drill } from '@/lib/drills';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
  AvatarFallback: ({ children }: any) => <div>{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

const mockPersonalDrill: EnhancedDrill = {
  id: '1',
  title: 'Personal Test Drill',
  concept: 'Testing Concepts',
  difficulty: 'Beginner',
  description: 'A drill I created myself',
  source: 'personal',
  drill_content: [
    { id: '1', type: 'theory', value: 'Test theory' },
    { id: '2', type: 'code', value: 'print("hello")', language: 'python' },
    { id: '3', type: 'mcq', value: 'What is testing?', choices: ['A', 'B', 'C'], answer: 0 }
  ]
};

const mockCommunityDrill: EnhancedDrill = {
  id: '2',
  title: 'Community Test Drill',
  concept: 'Advanced Testing',
  difficulty: 'Advanced',
  description: 'A drill from the community',
  source: 'community',
  originalAuthor: 'John Doe',
  originalAuthorAvatar: 'https://example.com/avatar.jpg',
  communityMetrics: {
    likes: 15,
    views: 100,
    saves: 8
  },
  drill_content: [
    { id: '4', type: 'theory', value: 'Advanced theory' },
    { id: '5', type: 'code', value: 'def test(): pass', language: 'python' }
  ]
};

const mockBasicDrill: Drill = {
  id: '3',
  title: 'Basic Test Drill',
  concept: 'Basic Concepts',
  difficulty: 'Intermediate',
  description: 'A basic drill for testing',
  drill_content: [
    { id: '6', type: 'theory', value: 'Basic theory' }
  ]
};

describe('DrillCard', () => {
  it('renders personal drill with correct badges', () => {
    render(<DrillCard drill={mockPersonalDrill} />);

    expect(screen.getByText('Personal Test Drill')).toBeInTheDocument();
    expect(screen.getByText('Created by You')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Testing Concepts')).toBeInTheDocument();
    expect(screen.getByText('A drill I created myself')).toBeInTheDocument();
  });

  it('renders community drill with author info and metrics', () => {
    render(<DrillCard drill={mockCommunityDrill} />);

    expect(screen.getByText('Community Test Drill')).toBeInTheDocument();
    expect(screen.getByText('From Community')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('by John Doe')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // likes
    expect(screen.getByText('100')).toBeInTheDocument(); // views
    expect(screen.getByText('8')).toBeInTheDocument(); // saves
  });

  it('shows content statistics correctly', () => {
    render(<DrillCard drill={mockPersonalDrill} />);

    expect(screen.getByText('1 Theory')).toBeInTheDocument();
    expect(screen.getByText('1 Code')).toBeInTheDocument();
    expect(screen.getByText('1 MCQs')).toBeInTheDocument();
  });

  it('shows remove button for community drills when onRemoveSaved is provided', () => {
    const mockRemove = jest.fn();
    
    render(<DrillCard drill={mockCommunityDrill} onRemoveSaved={mockRemove} />);

    const removeButton = screen.getByText('Remove');
    expect(removeButton).toBeInTheDocument();
    
    fireEvent.click(removeButton);
    expect(mockRemove).toHaveBeenCalledWith('2');
  });

  it('does not show remove button for personal drills', () => {
    const mockRemove = jest.fn();
    
    render(<DrillCard drill={mockPersonalDrill} onRemoveSaved={mockRemove} />);

    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });

  it('shows review indicator when isReview is true', () => {
    render(<DrillCard drill={mockPersonalDrill} isReview={true} />);

    expect(screen.getByText('Review Due')).toBeInTheDocument();
  });

  it('has correct link to drill page', () => {
    render(<DrillCard drill={mockPersonalDrill} />);

    const startButton = screen.getByText('Start Drill');
    const link = startButton.closest('a');
    expect(link).toHaveAttribute('href', '/drills/1');
  });

  it('renders community drill without author avatar', () => {
    const drillWithoutAvatar: EnhancedDrill = {
      ...mockCommunityDrill,
      originalAuthorAvatar: undefined
    };

    render(<DrillCard drill={drillWithoutAvatar} />);

    expect(screen.getByText('by John Doe')).toBeInTheDocument();
    // Should still show author info but without avatar
    expect(screen.getByText('From Community')).toBeInTheDocument();
  });

  it('renders community drill without community metrics', () => {
    const drillWithoutMetrics: EnhancedDrill = {
      ...mockCommunityDrill,
      communityMetrics: undefined
    };

    render(<DrillCard drill={drillWithoutMetrics} />);

    expect(screen.getByText('Community Test Drill')).toBeInTheDocument();
    expect(screen.getByText('by John Doe')).toBeInTheDocument();
    // Should not show metrics
    expect(screen.queryByText('15')).not.toBeInTheDocument();
  });

  it('handles different difficulty levels with correct badge variants', () => {
    const beginnerDrill: EnhancedDrill = { ...mockPersonalDrill, difficulty: 'Beginner' };
    const intermediateDrill: EnhancedDrill = { ...mockPersonalDrill, difficulty: 'Intermediate' };
    const advancedDrill: EnhancedDrill = { ...mockPersonalDrill, difficulty: 'Advanced' };

    const { rerender } = render(<DrillCard drill={beginnerDrill} />);
    expect(screen.getByText('Beginner')).toBeInTheDocument();

    rerender(<DrillCard drill={intermediateDrill} />);
    expect(screen.getByText('Intermediate')).toBeInTheDocument();

    rerender(<DrillCard drill={advancedDrill} />);
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('shows correct content statistics for different content types', () => {
    const drillWithMixedContent: EnhancedDrill = {
      ...mockPersonalDrill,
      drill_content: [
        { id: '1', type: 'theory', value: 'Theory 1' },
        { id: '2', type: 'theory', value: 'Theory 2' },
        { id: '3', type: 'code', value: 'code 1', language: 'python' },
        { id: '4', type: 'code', value: 'code 2', language: 'javascript' },
        { id: '5', type: 'code', value: 'code 3', language: 'python' },
        { id: '6', type: 'mcq', value: 'Question 1', choices: ['A', 'B'], answer: 0 },
        { id: '7', type: 'mcq', value: 'Question 2', choices: ['A', 'B'], answer: 1 }
      ]
    };

    render(<DrillCard drill={drillWithMixedContent} />);

    expect(screen.getByText('2 Theory')).toBeInTheDocument();
    expect(screen.getByText('3 Code')).toBeInTheDocument();
    expect(screen.getByText('2 MCQs')).toBeInTheDocument();
  });

  it('handles drill with no content gracefully', () => {
    const drillWithNoContent: EnhancedDrill = {
      ...mockPersonalDrill,
      drill_content: []
    };

    render(<DrillCard drill={drillWithNoContent} />);

    expect(screen.getByText('0 Theory')).toBeInTheDocument();
    expect(screen.getByText('0 Code')).toBeInTheDocument();
    expect(screen.getByText('0 MCQs')).toBeInTheDocument();
  });

  it('handles drill with undefined content gracefully', () => {
    const drillWithUndefinedContent: EnhancedDrill = {
      ...mockPersonalDrill,
      drill_content: undefined as any
    };

    render(<DrillCard drill={drillWithUndefinedContent} />);

    expect(screen.getByText('0 Theory')).toBeInTheDocument();
    expect(screen.getByText('0 Code')).toBeInTheDocument();
    expect(screen.getByText('0 MCQs')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<DrillCard drill={mockPersonalDrill} />);

    const card = container.querySelector('.bg-card\\/50');
    expect(card).toHaveClass('backdrop-blur-sm', 'border-2', 'border-transparent', 'hover:border-primary/50');
  });

  it('shows author avatar with correct fallback', () => {
    render(<DrillCard drill={mockCommunityDrill} />);

    // Should show avatar (mocked as div)
    const avatarContainer = document.querySelector('.h-4.w-4');
    expect(avatarContainer).toBeInTheDocument();
    
    // Should show author name
    expect(screen.getByText('by John Doe')).toBeInTheDocument();
  });

  it('does not show remove button for community drills without onRemoveSaved', () => {
    render(<DrillCard drill={mockCommunityDrill} />);

    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });

  it('shows community metrics with correct icons', () => {
    render(<DrillCard drill={mockCommunityDrill} />);

    // Should show metrics with mocked icons
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument();
    
    // Should show metric values
    expect(screen.getByText('15')).toBeInTheDocument(); // likes
    expect(screen.getByText('100')).toBeInTheDocument(); // views
    expect(screen.getByText('8')).toBeInTheDocument(); // saves
  });

  it('handles long drill titles and descriptions', () => {
    const drillWithLongContent: EnhancedDrill = {
      ...mockPersonalDrill,
      title: 'This is a very long drill title that might wrap to multiple lines in the card layout',
      description: 'This is a very long description that contains a lot of text and might need to be truncated or wrapped properly in the card layout to maintain good visual appearance'
    };

    render(<DrillCard drill={drillWithLongContent} />);

    expect(screen.getByText(drillWithLongContent.title)).toBeInTheDocument();
    expect(screen.getByText(drillWithLongContent.description)).toBeInTheDocument();
  });

  it('maintains proper card structure with header, content, and footer', () => {
    const { container } = render(<DrillCard drill={mockPersonalDrill} />);

    // Should have the main card structure
    const card = container.querySelector('.bg-card\\/50');
    expect(card).toBeInTheDocument();
    
    // Should have title, description, and button
    expect(screen.getByText('Personal Test Drill')).toBeInTheDocument();
    expect(screen.getByText('A drill I created myself')).toBeInTheDocument();
    expect(screen.getByText('Start Drill')).toBeInTheDocument();
  });
});

describe('BasicDrillCard', () => {
  it('renders basic drill correctly', () => {
    render(<BasicDrillCard drill={mockBasicDrill} />);

    expect(screen.getByText('Basic Test Drill')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Basic Concepts')).toBeInTheDocument();
    expect(screen.getByText('A basic drill for testing')).toBeInTheDocument();
  });

  it('shows review indicator when isReview is true', () => {
    render(<BasicDrillCard drill={mockBasicDrill} isReview={true} />);

    expect(screen.getByText('Review Due')).toBeInTheDocument();
  });

  it('shows content statistics correctly', () => {
    render(<BasicDrillCard drill={mockBasicDrill} />);

    expect(screen.getByText('1 Theory')).toBeInTheDocument();
    expect(screen.getByText('0 Code')).toBeInTheDocument();
    expect(screen.getByText('0 MCQs')).toBeInTheDocument();
  });

  it('has correct link to drill page', () => {
    render(<BasicDrillCard drill={mockBasicDrill} />);

    const startButton = screen.getByText('Start Drill');
    const link = startButton.closest('a');
    expect(link).toHaveAttribute('href', '/drills/3');
  });
});