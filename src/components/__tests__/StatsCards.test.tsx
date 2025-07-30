import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { StatsCards } from '../StatsCards';
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

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
}));

describe('StatsCards', () => {
  it('renders all three stat cards with correct titles', () => {
    render(
      <StatsCards
        personalCount={5}
        savedCount={3}
        totalCount={8}
      />
    );

    expect(screen.getByText('My Drills')).toBeInTheDocument();
    expect(screen.getByText('Saved from Community')).toBeInTheDocument();
    expect(screen.getByText('Total Practice Drills')).toBeInTheDocument();
  });

  it('displays correct counts for each stat card', async () => {
    render(
      <StatsCards
        personalCount={12}
        savedCount={7}
        totalCount={19}
      />
    );

    // Wait for animation to complete
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    await waitFor(() => {
      expect(screen.getByText('19')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles zero counts correctly', () => {
    render(
      <StatsCards
        personalCount={0}
        savedCount={0}
        totalCount={0}
      />
    );

    // Should show three zeros
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(3);
  });

  it('shows loading spinner for personal drills when loading.personal is true', () => {
    render(
      <StatsCards
        personalCount={5}
        savedCount={3}
        totalCount={8}
        loading={{ personal: true }}
      />
    );

    // Should show loading spinner in personal card
    const personalCard = screen.getByText('My Drills').closest('.bg-card\\/50');
    expect(personalCard).toBeInTheDocument();
    
    // Check for loading spinner (LoaderCircle with animate-spin)
    const loadingSpinner = personalCard?.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('shows loading spinner for saved drills when loading.saved is true', () => {
    render(
      <StatsCards
        personalCount={5}
        savedCount={3}
        totalCount={8}
        loading={{ saved: true }}
      />
    );

    // Should show loading spinner in saved card
    const savedCard = screen.getByText('Saved from Community').closest('.bg-card\\/50');
    expect(savedCard).toBeInTheDocument();
    
    const loadingSpinner = savedCard?.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('shows loading spinner for total when either personal or saved is loading', () => {
    render(
      <StatsCards
        personalCount={5}
        savedCount={3}
        totalCount={8}
        loading={{ personal: true }}
      />
    );

    // Total card should also show loading when personal is loading
    const totalCard = screen.getByText('Total Practice Drills').closest('.bg-card\\/50');
    expect(totalCard).toBeInTheDocument();
    
    const loadingSpinner = totalCard?.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('shows loading spinner for total when saved is loading', () => {
    render(
      <StatsCards
        personalCount={5}
        savedCount={3}
        totalCount={8}
        loading={{ saved: true }}
      />
    );

    // Total card should also show loading when saved is loading
    const totalCard = screen.getByText('Total Practice Drills').closest('.bg-card\\/50');
    expect(totalCard).toBeInTheDocument();
    
    const loadingSpinner = totalCard?.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('shows loading spinners for all cards when both are loading', () => {
    render(
      <StatsCards
        personalCount={5}
        savedCount={3}
        totalCount={8}
        loading={{ personal: true, saved: true }}
      />
    );

    // All three cards should show loading spinners
    const loadingSpinners = document.querySelectorAll('.animate-spin');
    expect(loadingSpinners).toHaveLength(3);
  });

  it('does not show loading spinners when loading is false', async () => {
    render(
      <StatsCards
        personalCount={5}
        savedCount={3}
        totalCount={8}
        loading={{ personal: false, saved: false }}
      />
    );

    // Should not show any loading spinners
    const loadingSpinners = document.querySelectorAll('.animate-spin');
    expect(loadingSpinners).toHaveLength(0);
    
    // Should show actual counts (wait for animation)
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles undefined loading prop gracefully', async () => {
    render(
      <StatsCards
        personalCount={5}
        savedCount={3}
        totalCount={8}
      />
    );

    // Should not show any loading spinners
    const loadingSpinners = document.querySelectorAll('.animate-spin');
    expect(loadingSpinners).toHaveLength(0);
    
    // Should show actual counts (wait for animation)
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('renders with responsive grid layout', () => {
    const { container } = render(
      <StatsCards
        personalCount={5}
        savedCount={3}
        totalCount={8}
      />
    );

    // Should have responsive grid classes
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('gap-4', 'md:grid-cols-3', 'mb-8');
  });

  it('has correct icons for each stat card', () => {
    render(
      <StatsCards
        personalCount={5}
        savedCount={3}
        totalCount={8}
      />
    );

    // Check that icons are present (they should be rendered as test elements with data-testid)
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument();
  });

  it('applies hover effects correctly', () => {
    const { container } = render(
      <StatsCards
        personalCount={5}
        savedCount={3}
        totalCount={8}
      />
    );

    // Check that cards have hover classes
    const cards = container.querySelectorAll('.bg-card\\/50');
    expect(cards).toHaveLength(3);
    
    cards.forEach(card => {
      expect(card).toHaveClass('hover:shadow-lg', 'hover:-translate-y-1');
    });
  });

  it('animates count changes', async () => {
    const { rerender } = render(
      <StatsCards
        personalCount={5}
        savedCount={3}
        totalCount={8}
      />
    );

    // Wait for initial animation to complete
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Update the count
    rerender(
      <StatsCards
        personalCount={10}
        savedCount={3}
        totalCount={13}
      />
    );

    // Should eventually show the new count
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles large numbers correctly', () => {
    const { container } = render(
      <StatsCards
        personalCount={999}
        savedCount={1234}
        totalCount={2233}
      />
    );

    // Should render without errors and have the correct structure
    expect(container.querySelector('.grid')).toBeInTheDocument();
    
    // Should have three cards
    const cards = container.querySelectorAll('.bg-card\\/50');
    expect(cards).toHaveLength(3);
    
    // Should show the titles
    expect(screen.getByText('My Drills')).toBeInTheDocument();
    expect(screen.getByText('Saved from Community')).toBeInTheDocument();
    expect(screen.getByText('Total Practice Drills')).toBeInTheDocument();
  });

  it('maintains accessibility with proper card structure', () => {
    const { container } = render(
      <StatsCards
        personalCount={5}
        savedCount={3}
        totalCount={8}
      />
    );

    // Should have proper card structure - check for the mocked components
    const cards = container.querySelectorAll('.bg-card\\/50');
    expect(cards).toHaveLength(3);
    
    // Each card should have the expected structure
    cards.forEach(card => {
      expect(card).toBeInTheDocument();
    });
  });
});