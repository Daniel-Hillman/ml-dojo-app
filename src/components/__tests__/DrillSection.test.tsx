import React from 'react';
import { render, screen } from '@testing-library/react';
import { DrillSection } from '../DrillSection';
import { getEmptyStateConfig } from '../DrillEmptyStates';
import { EnhancedDrill } from '@/lib/drills';
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
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className }: any) => <div className={className}>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
  AlertTitle: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ErrorBoundary', () => ({
  DrillSectionErrorBoundary: ({ children }: any) => <div>{children}</div>,
}));

const mockDrills: EnhancedDrill[] = [
  {
    id: '1',
    title: 'Test Drill 1',
    concept: 'Testing',
    difficulty: 'Beginner',
    description: 'A test drill',
    source: 'personal',
    drill_content: [
      { id: '1', type: 'theory', value: 'Test theory' },
      { id: '2', type: 'code', value: 'print("hello")', language: 'python' }
    ]
  },
  {
    id: '2',
    title: 'Test Drill 2',
    concept: 'Advanced Testing',
    difficulty: 'Advanced',
    description: 'An advanced test drill',
    source: 'community',
    originalAuthor: 'Test Author',
    communityMetrics: { likes: 5, views: 10, saves: 3 },
    drill_content: [
      { id: '3', type: 'mcq', value: 'What is testing?', choices: ['A', 'B', 'C'], answer: 0 }
    ]
  }
];

describe('DrillSection', () => {
  it('renders section title correctly', () => {
    render(
      <DrillSection
        title="Test Section"
        drills={mockDrills}
        loading={false}
        emptyState={getEmptyStateConfig('personal')}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    render(
      <DrillSection
        title="Test Section"
        drills={[]}
        loading={true}
        emptyState={getEmptyStateConfig('personal')}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    // Should show loading spinner in title
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    // Should show skeleton cards (they have animate-pulse class)
    const skeletonCards = document.querySelectorAll('.animate-pulse');
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it('shows empty state when no drills and not loading', () => {
    render(
      <DrillSection
        title="Test Section"
        drills={[]}
        loading={false}
        emptyState={getEmptyStateConfig('personal')}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    expect(screen.getByText('No personal drills yet')).toBeInTheDocument();
    expect(screen.getByText('Create Your First Drill')).toBeInTheDocument();
  });

  it('renders drill cards when drills are provided', () => {
    render(
      <DrillSection
        title="Test Section"
        drills={mockDrills}
        loading={false}
        emptyState={getEmptyStateConfig('personal')}
      >
        {(drill) => <div key={drill.id} data-testid={`drill-${drill.id}`}>{drill.title}</div>}
      </DrillSection>
    );

    expect(screen.getByTestId('drill-1')).toBeInTheDocument();
    expect(screen.getByTestId('drill-2')).toBeInTheDocument();
    expect(screen.getByText('Test Drill 1')).toBeInTheDocument();
    expect(screen.getByText('Test Drill 2')).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    const mockRetry = jest.fn();
    
    render(
      <DrillSection
        title="Test Section"
        drills={[]}
        loading={false}
        error="Failed to load drills"
        emptyState={getEmptyStateConfig('personal')}
        onRetry={mockRetry}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    expect(screen.getByText('Failed to load drills')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('works without title (for custom headers)', () => {
    render(
      <DrillSection
        drills={mockDrills}
        loading={false}
        emptyState={getEmptyStateConfig('personal')}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    // Should not render a default title
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    // But should still render the drills
    expect(screen.getByText('Test Drill 1')).toBeInTheDocument();
  });

  it('shows different empty states based on configuration', () => {
    const { rerender } = render(
      <DrillSection
        title="Personal Section"
        drills={[]}
        loading={false}
        emptyState={getEmptyStateConfig('personal')}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    expect(screen.getByText('No personal drills yet')).toBeInTheDocument();
    expect(screen.getByText('Create Your First Drill')).toBeInTheDocument();

    // Test saved drills empty state
    rerender(
      <DrillSection
        title="Saved Section"
        drills={[]}
        loading={false}
        emptyState={getEmptyStateConfig('saved')}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    expect(screen.getByText('No saved community drills yet')).toBeInTheDocument();
    expect(screen.getByText('Browse Community Drills')).toBeInTheDocument();
  });

  it('handles different error types correctly', () => {
    const mockRetry = jest.fn();
    const networkError = {
      message: 'Network connection failed',
      type: 'network' as const,
      retryable: true
    };
    
    render(
      <DrillSection
        title="Test Section"
        drills={[]}
        loading={false}
        error={networkError}
        emptyState={getEmptyStateConfig('personal')}
        onRetry={mockRetry}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('handles permission errors without retry button', () => {
    const permissionError = {
      message: 'Access denied',
      type: 'permission' as const,
      retryable: false
    };
    
    render(
      <DrillSection
        title="Test Section"
        drills={[]}
        loading={false}
        error={permissionError}
        emptyState={getEmptyStateConfig('personal')}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('Access denied')).toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('shows loading spinner in title when loading with existing drills', () => {
    render(
      <DrillSection
        title="Test Section"
        drills={mockDrills}
        loading={true}
        emptyState={getEmptyStateConfig('personal')}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    // Should show loading spinner in title even with existing drills
    const titleElement = screen.getByText('Test Section');
    const titleContainer = titleElement.parentElement;
    const loadingSpinner = titleContainer?.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
    
    // Should still show existing drills
    expect(screen.getByText('Test Drill 1')).toBeInTheDocument();
    expect(screen.getByText('Test Drill 2')).toBeInTheDocument();
  });

  it('renders responsive grid layout correctly', () => {
    const { container } = render(
      <DrillSection
        title="Test Section"
        drills={mockDrills}
        loading={false}
        emptyState={getEmptyStateConfig('personal')}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('gap-6', 'md:grid-cols-2', 'lg:grid-cols-3');
  });

  it('does not render drill cards when there is an error', () => {
    render(
      <DrillSection
        title="Test Section"
        drills={mockDrills}
        loading={false}
        error="Something went wrong"
        emptyState={getEmptyStateConfig('personal')}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    // Should show error but not drill cards
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('Test Drill 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Drill 2')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const mockRetry = jest.fn();
    
    render(
      <DrillSection
        title="Test Section"
        drills={[]}
        loading={false}
        error="Failed to load"
        emptyState={getEmptyStateConfig('personal')}
        onRetry={mockRetry}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    const retryButton = screen.getByText('Try Again');
    retryButton.click();
    
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('handles section without children gracefully', () => {
    render(
      <DrillSection
        title="Test Section"
        drills={mockDrills}
        loading={false}
        emptyState={getEmptyStateConfig('personal')}
      />
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    // Should render the grid container but without content
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
  });

  it('applies correct section spacing with title', () => {
    const { container } = render(
      <DrillSection
        title="Test Section"
        drills={mockDrills}
        loading={false}
        emptyState={getEmptyStateConfig('personal')}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    // Look for the div with mb-12 class
    const sectionWithSpacing = container.querySelector('.mb-12');
    expect(sectionWithSpacing).toBeInTheDocument();
  });

  it('does not apply section spacing without title', () => {
    const { container } = render(
      <DrillSection
        drills={mockDrills}
        loading={false}
        emptyState={getEmptyStateConfig('personal')}
      >
        {(drill) => <div key={drill.id}>{drill.title}</div>}
      </DrillSection>
    );

    // Should not have mb-12 class when no title
    const sectionWithSpacing = container.querySelector('.mb-12');
    expect(sectionWithSpacing).not.toBeInTheDocument();
  });
});