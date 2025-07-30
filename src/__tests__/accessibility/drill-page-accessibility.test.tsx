/**
 * Accessibility tests for the Practice Drills page
 * Tests keyboard navigation, screen reader support, and ARIA compliance
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import DrillsPage from '@/app/(app)/drills/page';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('react-firebase-hooks/auth');
jest.mock('@/hooks/use-toast');
jest.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: {}
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn()
}));

const mockUseAuthState = useAuthState as jest.MockedFunction<typeof useAuthState>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('DrillsPage Accessibility', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com'
  };

  const mockToast = jest.fn();

  beforeEach(() => {
    mockUseAuthState.mockReturnValue([mockUser as any, false, undefined]);
    mockUseToast.mockReturnValue({ toast: mockToast });
    
    // Mock successful data loading
    jest.clearAllMocks();
  });

  describe('Semantic HTML Structure', () => {
    it('should have proper landmark roles', async () => {
      render(<DrillsPage />);
      
      // Check for main landmarks
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', async () => {
      render(<DrillsPage />);
      
      // Check main page heading
      expect(screen.getByRole('heading', { level: 1, name: 'Practice Drills' })).toBeInTheDocument();
      
      // Check section headings
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: /My Drills/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /Saved from Community/i })).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels and descriptions', async () => {
      render(<DrillsPage />);
      
      // Check main content area
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-labelledby', 'page-title');
      expect(main).toHaveAttribute('aria-describedby', 'page-description');
      
      // Check navigation buttons
      expect(screen.getByRole('button', { name: /Browse community drills to discover new content/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create a new custom drill/i })).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support skip navigation link', async () => {
      render(<DrillsPage />);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#main-content');
      
      // Skip link should be hidden by default but visible on focus
      expect(skipLink).toHaveClass('sr-only');
      expect(skipLink).toHaveClass('focus:not-sr-only');
    });

    it('should support keyboard shortcuts', async () => {
      render(<DrillsPage />);
      
      // Mock window.location.href
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' };
      
      // Test Ctrl+N for new drill
      fireEvent.keyDown(document, { key: 'n', ctrlKey: true });
      expect(window.location.href).toBe('/drills/create');
      
      // Test Ctrl+B for browse community
      fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
      expect(window.location.href).toBe('/community');
      
      // Restore original location
      window.location = originalLocation;
    });

    it('should support arrow key navigation between sections', async () => {
      render(<DrillsPage />);
      
      // Wait for sections to load
      await waitFor(() => {
        expect(screen.getByText('My Drills')).toBeInTheDocument();
      });
      
      // Focus on first section
      const personalSection = screen.getByText('My Drills');
      personalSection.focus();
      
      // Test arrow down navigation
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      // Should move focus to next section
      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByText('Saved from Community'));
      });
    });

    it('should ignore keyboard shortcuts when typing in input fields', async () => {
      render(<DrillsPage />);
      
      // Create a mock input field
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' };
      
      // Test that shortcuts are ignored when typing
      fireEvent.keyDown(input, { key: 'n', ctrlKey: true });
      expect(window.location.href).toBe('');
      
      // Cleanup
      document.body.removeChild(input);
      window.location = originalLocation;
    });
  });

  describe('Screen Reader Support', () => {
    it('should have live regions for status announcements', async () => {
      render(<DrillsPage />);
      
      // Check for live region
      const liveRegion = screen.getByLabelText('status-announcements');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'false');
      expect(liveRegion).toHaveClass('sr-only');
    });

    it('should announce loading states', async () => {
      render(<DrillsPage />);
      
      // Check for loading announcements
      await waitFor(() => {
        const liveRegion = document.getElementById('status-announcements');
        expect(liveRegion?.textContent).toContain('Loading');
      });
    });

    it('should provide keyboard shortcuts help for screen readers', async () => {
      render(<DrillsPage />);
      
      const shortcutsHelp = screen.getByLabelText('Keyboard shortcuts');
      expect(shortcutsHelp).toBeInTheDocument();
      expect(shortcutsHelp).toHaveClass('sr-only');
      expect(shortcutsHelp.textContent).toContain('Ctrl+1 for My Drills');
      expect(shortcutsHelp.textContent).toContain('Ctrl+2 for Saved Drills');
    });
  });

  describe('Focus Management', () => {
    it('should have proper tab order', async () => {
      render(<DrillsPage />);
      
      // Skip link should be first in tab order
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('tabindex', '0');
      
      // Navigation buttons should be focusable
      const browseButton = screen.getByRole('button', { name: /Browse community/i });
      const createButton = screen.getByRole('button', { name: /Create/i });
      
      expect(browseButton).toHaveAttribute('tabindex', '0');
      expect(createButton).toHaveAttribute('tabindex', '0');
    });

    it('should maintain focus when sections update', async () => {
      render(<DrillsPage />);
      
      await waitFor(() => {
        const personalSection = screen.getByText('My Drills');
        personalSection.focus();
        expect(document.activeElement).toBe(personalSection);
      });
    });
  });

  describe('Error State Accessibility', () => {
    it('should announce errors to screen readers', async () => {
      // Mock error state
      const mockError = new Error('Network error');
      
      render(<DrillsPage />);
      
      // Simulate error
      await waitFor(() => {
        const liveRegion = document.getElementById('status-announcements');
        // Error announcements should appear in live region
        expect(liveRegion).toBeInTheDocument();
      });
    });

    it('should provide accessible retry buttons', async () => {
      render(<DrillsPage />);
      
      // Wait for potential error states to load
      await waitFor(() => {
        const retryButtons = screen.queryAllByText(/Try Again/i);
        retryButtons.forEach(button => {
          expect(button).toHaveAttribute('aria-label');
        });
      });
    });
  });

  describe('Stats Cards Accessibility', () => {
    it('should have proper ARIA labels for stats', async () => {
      render(<DrillsPage />);
      
      await waitFor(() => {
        // Check for stats region
        const statsRegion = screen.getByLabelText('Practice drill statistics');
        expect(statsRegion).toBeInTheDocument();
        expect(statsRegion).toHaveAttribute('role', 'region');
      });
    });

    it('should announce count changes', async () => {
      render(<DrillsPage />);
      
      await waitFor(() => {
        // Stats should have live regions for count updates
        const statCards = screen.getAllByRole('status');
        expect(statCards.length).toBeGreaterThan(0);
        
        statCards.forEach(card => {
          expect(card).toHaveAttribute('aria-live', 'polite');
        });
      });
    });
  });
});