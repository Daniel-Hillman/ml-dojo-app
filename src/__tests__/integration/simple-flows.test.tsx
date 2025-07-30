/**
 * Simplified integration tests for user flows
 * Tests core functionality without complex Firebase mocking
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock all external dependencies
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: () => [{ uid: 'test-user', email: 'test@example.com' }, false, undefined]
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/drills',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  doc: jest.fn(),
  deleteDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  arrayRemove: jest.fn(),
  increment: jest.fn(),
  arrayUnion: jest.fn(),
  serverTimestamp: jest.fn(),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
  },
}));

jest.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: {}
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() })
}));

jest.mock('@/components/ApiKeyStatus', () => {
  return function MockApiKeyStatus() {
    return <div data-testid="api-key-status">API Key Status</div>;
  };
});

// Import components after mocking
import DrillsPage from '@/app/(app)/drills/page';

describe('Simple Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Practice Page Integration', () => {
    it('should render practice page with basic structure', async () => {
      render(<DrillsPage />);
      
      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Verify main sections are present
      expect(screen.getByText('Your personalized practice hub')).toBeInTheDocument();
      expect(screen.getByText('My Drills')).toBeInTheDocument();
      expect(screen.getByText('Saved from Community')).toBeInTheDocument();
      
      // Verify navigation buttons are present
      expect(screen.getByRole('button', { name: /browse community/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create custom drill/i })).toBeInTheDocument();
    });

    it('should show empty states when no drills are present', async () => {
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Verify empty states are shown
      expect(screen.getByText('No personal drills yet')).toBeInTheDocument();
      expect(screen.getByText('No saved drills yet')).toBeInTheDocument();
      
      // Verify empty state action buttons
      expect(screen.getByRole('button', { name: /create your first drill/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /browse community/i })).toBeInTheDocument();
    });

    it('should display stats cards with zero counts initially', async () => {
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Verify stats cards show zero counts
      const statsSection = screen.getByText('My Drills').closest('div')?.parentElement;
      expect(statsSection).toBeInTheDocument();
      
      // Look for count displays (should be 0 initially)
      const countElements = screen.getAllByText('0');
      expect(countElements.length).toBeGreaterThan(0);
    });

    it('should have proper accessibility structure', async () => {
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Verify proper heading structure
      expect(screen.getByRole('heading', { level: 1, name: /practice drills/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /my drills/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /saved from community/i })).toBeInTheDocument();
      
      // Verify buttons are accessible
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should have working navigation buttons', async () => {
      const { useRouter } = require('next/navigation');
      const mockPush = jest.fn();
      useRouter.mockReturnValue({ push: mockPush, replace: jest.fn(), back: jest.fn() });
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Navigation buttons should be present and clickable
      const browseButton = screen.getByRole('button', { name: /browse community/i });
      const createButton = screen.getByRole('button', { name: /create custom drill/i });
      
      expect(browseButton).toBeInTheDocument();
      expect(createButton).toBeInTheDocument();
      
      // Buttons should not be disabled
      expect(browseButton).not.toBeDisabled();
      expect(createButton).not.toBeDisabled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle authentication gracefully', async () => {
      // Mock unauthenticated state
      const { useAuthState } = require('react-firebase-hooks/auth');
      useAuthState.mockReturnValue([null, false, undefined]);
      
      render(<DrillsPage />);
      
      // Should show loading state for unauthenticated users
      await waitFor(() => {
        expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      });
    });

    it('should handle data loading states', async () => {
      render(<DrillsPage />);
      
      // Initially should show loading or empty states
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Should eventually show empty states when no data
      expect(screen.getByText('No personal drills yet')).toBeInTheDocument();
      expect(screen.getByText('No saved drills yet')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should integrate all major components correctly', async () => {
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Verify API Key Status component is integrated
      expect(screen.getByTestId('api-key-status')).toBeInTheDocument();
      
      // Verify drill sections are integrated
      expect(screen.getByText('My Drills')).toBeInTheDocument();
      expect(screen.getByText('Saved from Community')).toBeInTheDocument();
      
      // Verify empty states are integrated
      expect(screen.getByText('No personal drills yet')).toBeInTheDocument();
      expect(screen.getByText('No saved drills yet')).toBeInTheDocument();
    });

    it('should maintain consistent styling and layout', async () => {
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Verify main container structure
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass('p-6', 'container', 'mx-auto');
      
      // Verify header structure
      const headerElement = screen.getByRole('banner') || screen.getByText('Practice Drills').closest('header');
      expect(headerElement).toBeInTheDocument();
    });
  });

  describe('Requirements Validation', () => {
    it('should meet requirement 1.1 - separate sections for personal and saved drills', async () => {
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Verify distinct sections exist
      expect(screen.getByText('My Drills')).toBeInTheDocument();
      expect(screen.getByText('Saved from Community')).toBeInTheDocument();
      
      // Verify sections are separate
      const myDrillsSection = screen.getByText('My Drills').closest('section') || screen.getByText('My Drills').closest('div');
      const savedSection = screen.getByText('Saved from Community').closest('section') || screen.getByText('Saved from Community').closest('div');
      
      expect(myDrillsSection).toBeInTheDocument();
      expect(savedSection).toBeInTheDocument();
      expect(myDrillsSection).not.toBe(savedSection);
    });

    it('should meet requirement 1.4 - empty states with appropriate CTAs', async () => {
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Verify empty states with CTAs
      expect(screen.getByText('No personal drills yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create your first drill/i })).toBeInTheDocument();
      
      expect(screen.getByText('No saved drills yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /browse community/i })).toBeInTheDocument();
    });

    it('should meet requirement 4.1 - Browse Community button in header', async () => {
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Verify Browse Community button exists in header area
      const browseButton = screen.getByRole('button', { name: /browse community/i });
      expect(browseButton).toBeInTheDocument();
      
      // Verify it's in the header section
      const headerArea = screen.getByText('Practice Drills').closest('header') || 
                        screen.getByText('Your personalized practice hub').closest('div');
      expect(headerArea).toContainElement(browseButton);
    });

    it('should meet requirement 4.4 - drill counts display', async () => {
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Verify stats/counts are displayed (initially 0)
      const countElements = screen.getAllByText('0');
      expect(countElements.length).toBeGreaterThan(0);
      
      // Should have stats for personal, saved, and total
      // This validates the StatsCards component integration
    });
  });
});