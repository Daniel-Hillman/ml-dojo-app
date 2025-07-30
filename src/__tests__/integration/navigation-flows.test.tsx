/**
 * Integration tests for navigation flows between practice and community pages
 * Tests navigation buttons, URL changes, and state preservation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getDocs } from 'firebase/firestore';

import DrillsPage from '@/app/(app)/drills/page';
import CommunityPage from '@/app/(app)/community/page';

// Mock dependencies
jest.mock('react-firebase-hooks/auth');
jest.mock('next/navigation');
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase/client', () => ({ db: {}, auth: {} }));

const mockUseAuthState = useAuthState as jest.MockedFunction<typeof useAuthState>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;

const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

jest.mock('@/components/ApiKeyStatus', () => {
  return function MockApiKeyStatus() {
    return <div data-testid="api-key-status">API Key Status</div>;
  };
});

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User'
};

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn()
};

describe('Navigation Flows Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuthState.mockReturnValue([mockUser, false, undefined]);
    mockUseRouter.mockReturnValue(mockRouter);
    mockUsePathname.mockReturnValue('/drills');
    
    // Mock empty data by default
    mockGetDocs.mockResolvedValue({ docs: [] });
  });

  describe('Practice to Community Navigation', () => {
    it('should navigate from practice page to community page via Browse Community button', async () => {
      const user = userEvent.setup();
      
      render(<DrillsPage />);
      
      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Find Browse Community button in header
      const browseButton = screen.getByRole('button', { name: /browse community/i });
      expect(browseButton).toBeInTheDocument();
      
      // Click the button
      await user.click(browseButton);
      
      // Verify navigation was called
      expect(mockRouter.push).toHaveBeenCalledWith('/community');
    });

    it('should navigate from practice page to community page via empty state button', async () => {
      const user = userEvent.setup();
      
      render(<DrillsPage />);
      
      // Wait for empty state to appear
      await waitFor(() => {
        expect(screen.getByText('No saved drills yet')).toBeInTheDocument();
      });
      
      // Find Browse Community button in empty state
      const emptyStateBrowseButton = screen.getByRole('button', { name: /browse community/i });
      await user.click(emptyStateBrowseButton);
      
      // Verify navigation
      expect(mockRouter.push).toHaveBeenCalledWith('/community');
    });

    it('should show correct button states and icons', async () => {
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      const browseButton = screen.getByRole('button', { name: /browse community/i });
      
      // Verify button has correct icon
      expect(browseButton.querySelector('[data-testid="users-icon"]')).toBeInTheDocument();
      
      // Verify button is not disabled
      expect(browseButton).not.toBeDisabled();
    });
  });

  describe('Community to Practice Navigation', () => {
    it('should navigate from community page to practice page via My Practice button', async () => {
      const user = userEvent.setup();
      
      mockUsePathname.mockReturnValue('/community');
      
      render(<CommunityPage />);
      
      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Community Drills')).toBeInTheDocument();
      });
      
      // Find My Practice button in header
      const practiceButton = screen.getByRole('button', { name: /my practice/i });
      expect(practiceButton).toBeInTheDocument();
      
      // Click the button
      await user.click(practiceButton);
      
      // Verify navigation was called
      expect(mockRouter.push).toHaveBeenCalledWith('/drills');
    });

    it('should show correct button states and icons on community page', async () => {
      mockUsePathname.mockReturnValue('/community');
      
      render(<CommunityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Community Drills')).toBeInTheDocument();
      });
      
      const practiceButton = screen.getByRole('button', { name: /my practice/i });
      
      // Verify button has correct icon
      expect(practiceButton.querySelector('[data-testid="user-icon"]')).toBeInTheDocument();
      
      // Verify button is not disabled
      expect(practiceButton).not.toBeDisabled();
    });
  });

  describe('Create Drill Navigation', () => {
    it('should navigate to create drill page from practice page', async () => {
      const user = userEvent.setup();
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Find Create Custom Drill button
      const createButton = screen.getByRole('button', { name: /create custom drill/i });
      await user.click(createButton);
      
      // Verify navigation
      expect(mockRouter.push).toHaveBeenCalledWith('/drills/create');
    });

    it('should navigate to create drill page from community page', async () => {
      const user = userEvent.setup();
      
      mockUsePathname.mockReturnValue('/community');
      
      render(<CommunityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Community Drills')).toBeInTheDocument();
      });
      
      // Find Share Your Drill button
      const shareButton = screen.getByRole('button', { name: /share your drill/i });
      await user.click(shareButton);
      
      // Verify navigation
      expect(mockRouter.push).toHaveBeenCalledWith('/drills/create');
    });

    it('should navigate to create drill from empty state', async () => {
      const user = userEvent.setup();
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('No personal drills yet')).toBeInTheDocument();
      });
      
      // Find Create Drill button in empty state
      const emptyStateCreateButton = screen.getByRole('button', { name: /create drill/i });
      await user.click(emptyStateCreateButton);
      
      // Verify navigation
      expect(mockRouter.push).toHaveBeenCalledWith('/drills/create');
    });
  });

  describe('Navigation State Preservation', () => {
    it('should maintain user authentication state across navigation', async () => {
      // Test practice page
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Verify user-specific content is shown
      expect(screen.getByText('My Drills')).toBeInTheDocument();
      expect(screen.getByText('Saved from Community')).toBeInTheDocument();
      
      // Test community page
      mockUsePathname.mockReturnValue('/community');
      render(<CommunityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Community Drills')).toBeInTheDocument();
      });
      
      // Verify authenticated user features are available
      expect(screen.getByRole('button', { name: /my practice/i })).toBeInTheDocument();
    });

    it('should handle unauthenticated state consistently', async () => {
      // Mock unauthenticated user
      mockUseAuthState.mockReturnValue([null, false, undefined]);
      
      render(<DrillsPage />);
      
      // Should show loading state for unauthenticated user
      await waitFor(() => {
        expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      });
    });
  });

  describe('URL and Route Handling', () => {
    it('should handle direct URL access to practice page', async () => {
      mockUsePathname.mockReturnValue('/drills');
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Verify page-specific content is loaded
      expect(screen.getByText('Your personalized practice hub')).toBeInTheDocument();
    });

    it('should handle direct URL access to community page', async () => {
      mockUsePathname.mockReturnValue('/community');
      
      render(<CommunityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Community Drills')).toBeInTheDocument();
      });
      
      // Verify page-specific content is loaded
      expect(screen.getByText('Discover and share coding challenges with the community')).toBeInTheDocument();
    });
  });

  describe('Navigation Error Handling', () => {
    it('should handle navigation errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock router.push to throw an error
      mockRouter.push.mockImplementation(() => {
        throw new Error('Navigation failed');
      });
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      const browseButton = screen.getByRole('button', { name: /browse community/i });
      
      // Click should not crash the app
      await user.click(browseButton);
      
      // Page should still be functional
      expect(screen.getByText('Practice Drills')).toBeInTheDocument();
    });

    it('should handle missing router gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock router as undefined
      mockUseRouter.mockReturnValue(undefined as any);
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Navigation buttons should still be rendered
      expect(screen.getByRole('button', { name: /browse community/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility in Navigation', () => {
    it('should have proper ARIA labels for navigation buttons', async () => {
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      const browseButton = screen.getByRole('button', { name: /browse community/i });
      const createButton = screen.getByRole('button', { name: /create custom drill/i });
      
      // Verify buttons are accessible
      expect(browseButton).toHaveAttribute('type', 'button');
      expect(createButton).toHaveAttribute('type', 'button');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      const browseButton = screen.getByRole('button', { name: /browse community/i });
      
      // Focus the button with keyboard
      await user.tab();
      expect(browseButton).toHaveFocus();
      
      // Activate with Enter key
      await user.keyboard('{Enter}');
      
      // Verify navigation was triggered
      expect(mockRouter.push).toHaveBeenCalledWith('/community');
    });
  });
});