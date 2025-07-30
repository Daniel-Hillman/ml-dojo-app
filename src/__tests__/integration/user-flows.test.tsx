/**
 * Integration tests for complete user flows in practice drills enhancement
 * Tests the end-to-end user journeys across community and practice pages
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  collection, query, where, orderBy, getDocs, doc, getDoc, 
  addDoc, updateDoc, deleteDoc, increment, arrayUnion, arrayRemove,
  serverTimestamp 
} from 'firebase/firestore';

// Import components to test
import DrillsPage from '@/app/(app)/drills/page';
import CommunityPage from '@/app/(app)/community/page';

// Mock Firebase and Next.js dependencies
jest.mock('react-firebase-hooks/auth');
jest.mock('next/navigation');
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: {}
}));

// Mock toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock components that might cause issues in tests
jest.mock('@/components/ApiKeyStatus', () => {
  return function MockApiKeyStatus() {
    return <div data-testid="api-key-status">API Key Status</div>;
  };
});

// Type definitions for mocks
const mockUseAuthState = useAuthState as jest.MockedFunction<typeof useAuthState>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockIncrement = increment as jest.MockedFunction<typeof increment>;
const mockArrayUnion = arrayUnion as jest.MockedFunction<typeof arrayUnion>;
const mockArrayRemove = arrayRemove as jest.MockedFunction<typeof arrayRemove>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;

// Test data
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User'
};

const mockCommunityDrill = {
  id: 'community-drill-1',
  title: 'Advanced Python Functions',
  concept: 'Functions',
  difficulty: 'Advanced',
  description: 'Learn advanced function concepts',
  language: 'python',
  content: [
    { id: '1', type: 'theory', value: 'Functions are first-class objects in Python' },
    { id: '2', type: 'code', value: 'def higher_order_func():\n    pass', language: 'python' }
  ],
  authorId: 'author-456',
  authorName: 'Jane Smith',
  authorAvatar: 'https://example.com/jane.jpg',
  createdAt: new Date('2024-01-01'),
  likes: 25,
  views: 200,
  saves: 12,
  comments: 5,
  tags: ['functions', 'advanced'],
  isPublic: true,
  likedBy: [],
  savedBy: []
};

const mockPersonalDrill = {
  id: 'personal-drill-1',
  title: 'My Python Basics',
  concept: 'Variables',
  difficulty: 'Beginner',
  description: 'Basic variable concepts',
  drill_content: [
    { id: '1', type: 'theory', value: 'Variables store data' }
  ],
  userId: 'test-user-123',
  createdAt: new Date('2024-01-02'),
  language: 'python'
};

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn()
};

describe('Integration Tests - Complete User Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseAuthState.mockReturnValue([mockUser, false, undefined]);
    mockUseRouter.mockReturnValue(mockRouter);
    
    // Mock Firestore functions
    mockCollection.mockImplementation(() => ({} as any));
    mockQuery.mockImplementation(() => ({} as any));
    mockWhere.mockImplementation(() => ({} as any));
    mockOrderBy.mockImplementation(() => ({} as any));
    mockDoc.mockImplementation(() => ({} as any));
    mockIncrement.mockImplementation(() => ({} as any));
    mockArrayUnion.mockImplementation(() => ({} as any));
    mockArrayRemove.mockImplementation(() => ({} as any));
    mockServerTimestamp.mockImplementation(() => ({} as any));
  });

  describe('Save from Community to Practice Flow', () => {
    it('should save a drill from community page and show it in practice page', async () => {
      const user = userEvent.setup();
      
      // Mock community drills data
      const mockCommunitySnapshot = {
        docs: [{
          id: mockCommunityDrill.id,
          data: () => mockCommunityDrill
        }]
      };
      
      // Mock empty personal and saved drills initially
      const mockEmptySnapshot = { docs: [] };
      
      mockGetDocs
        .mockResolvedValueOnce(mockCommunitySnapshot) // Community drills
        .mockResolvedValueOnce(mockEmptySnapshot) // Personal drills
        .mockResolvedValueOnce(mockEmptySnapshot); // Saved drills initially
      
      // Mock successful save operations
      mockUpdateDoc.mockResolvedValue(undefined);
      mockAddDoc.mockResolvedValue({ id: 'saved-doc-1' } as any);
      
      // Render community page
      render(<CommunityPage />);
      
      // Wait for community drills to load
      await waitFor(() => {
        expect(screen.getByText('Advanced Python Functions')).toBeInTheDocument();
      });
      
      // Find and click the save button
      const drillCard = screen.getByText('Advanced Python Functions').closest('[class*="card"]');
      expect(drillCard).toBeInTheDocument();
      
      const saveButton = within(drillCard!).getByText('Save');
      await user.click(saveButton);
      
      // Verify save operations were called
      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            saves: expect.anything(),
            savedBy: expect.anything()
          })
        );
        expect(mockAddDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            drillId: mockCommunityDrill.id,
            savedAt: expect.anything(),
            originalDrillData: mockCommunityDrill
          })
        );
      });
      
      // Verify success toast
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Saved!',
          description: 'Drill added to your practice list'
        })
      );
      
      // Now test that the drill appears in practice page
      // Mock the saved drill data for practice page
      const mockSavedDrillSnapshot = {
        docs: [{
          id: 'saved-doc-1',
          data: () => ({
            drillId: mockCommunityDrill.id,
            savedAt: { toDate: () => new Date('2024-01-03') },
            originalDrillData: {
              ...mockCommunityDrill,
              createdAt: { toDate: () => mockCommunityDrill.createdAt }
            }
          })
        }]
      };
      
      mockGetDocs
        .mockResolvedValueOnce(mockEmptySnapshot) // Personal drills
        .mockResolvedValueOnce(mockSavedDrillSnapshot) // Saved drills
        .mockResolvedValueOnce(mockEmptySnapshot); // Review drills
      
      // Render practice page
      render(<DrillsPage />);
      
      // Wait for saved drill to appear in practice page
      await waitFor(() => {
        expect(screen.getByText('Advanced Python Functions')).toBeInTheDocument();
      });
      
      // Verify it's in the "Saved from Community" section
      const savedSection = screen.getByText('Saved from Community').closest('section');
      expect(savedSection).toBeInTheDocument();
      expect(within(savedSection!).getByText('Advanced Python Functions')).toBeInTheDocument();
      
      // Verify community badge is shown
      expect(within(savedSection!).getByText('From Community')).toBeInTheDocument();
      
      // Verify author information is displayed
      expect(within(savedSection!).getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should handle save operation errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock community drills data
      const mockCommunitySnapshot = {
        docs: [{
          id: mockCommunityDrill.id,
          data: () => mockCommunityDrill
        }]
      };
      
      mockGetDocs.mockResolvedValue(mockCommunitySnapshot);
      
      // Mock save operation failure
      mockUpdateDoc.mockRejectedValue(new Error('Network error'));
      
      render(<CommunityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Python Functions')).toBeInTheDocument();
      });
      
      const drillCard = screen.getByText('Advanced Python Functions').closest('[class*="card"]');
      const saveButton = within(drillCard!).getByText('Save');
      
      await user.click(saveButton);
      
      // Verify error toast is shown
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: 'Failed to save drill',
            variant: 'destructive'
          })
        );
      });
    });
  });

  describe('Remove Saved Drill Flow', () => {
    it('should remove a saved drill from practice page and update UI', async () => {
      const user = userEvent.setup();
      
      // Mock saved drill data
      const mockSavedDrillSnapshot = {
        docs: [{
          id: 'saved-doc-1',
          data: () => ({
            drillId: mockCommunityDrill.id,
            savedAt: { toDate: () => new Date('2024-01-03') },
            originalDrillData: {
              ...mockCommunityDrill,
              createdAt: { toDate: () => mockCommunityDrill.createdAt }
            }
          })
        }]
      };
      
      const mockEmptySnapshot = { docs: [] };
      
      // Mock initial data load
      mockGetDocs
        .mockResolvedValueOnce(mockEmptySnapshot) // Personal drills
        .mockResolvedValueOnce(mockSavedDrillSnapshot) // Saved drills
        .mockResolvedValueOnce(mockEmptySnapshot); // Review drills
      
      render(<DrillsPage />);
      
      // Wait for saved drill to appear
      await waitFor(() => {
        expect(screen.getByText('Advanced Python Functions')).toBeInTheDocument();
      });
      
      // Mock successful removal operations
      const mockRemovalSnapshot = {
        empty: false,
        docs: [{ id: 'saved-doc-1' }]
      };
      
      mockGetDocs.mockResolvedValueOnce(mockRemovalSnapshot); // Find saved drill
      mockDeleteDoc.mockResolvedValue(undefined);
      mockUpdateDoc.mockResolvedValue(undefined);
      
      // Find and click remove button
      const savedSection = screen.getByText('Saved from Community').closest('section');
      const drillCard = within(savedSection!).getByText('Advanced Python Functions').closest('[class*="card"]');
      
      // Look for remove button (might be in a dropdown or as an icon)
      const removeButton = within(drillCard!).getByRole('button', { name: /remove|delete/i });
      await user.click(removeButton);
      
      // Verify removal operations were called
      await waitFor(() => {
        expect(mockDeleteDoc).toHaveBeenCalled();
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            savedBy: expect.anything()
          })
        );
      });
      
      // Verify success toast
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Drill removed',
          description: expect.stringContaining('Advanced Python Functions')
        })
      );
      
      // Verify drill is removed from UI (optimistic update)
      await waitFor(() => {
        const updatedSavedSection = screen.getByText('Saved from Community').closest('section');
        expect(within(updatedSavedSection!).queryByText('Advanced Python Functions')).not.toBeInTheDocument();
      });
    });

    it('should handle removal errors and revert optimistic updates', async () => {
      const user = userEvent.setup();
      
      // Mock saved drill data
      const mockSavedDrillSnapshot = {
        docs: [{
          id: 'saved-doc-1',
          data: () => ({
            drillId: mockCommunityDrill.id,
            savedAt: { toDate: () => new Date('2024-01-03') },
            originalDrillData: {
              ...mockCommunityDrill,
              createdAt: { toDate: () => mockCommunityDrill.createdAt }
            }
          })
        }]
      };
      
      const mockEmptySnapshot = { docs: [] };
      
      mockGetDocs
        .mockResolvedValueOnce(mockEmptySnapshot) // Personal drills
        .mockResolvedValueOnce(mockSavedDrillSnapshot) // Saved drills
        .mockResolvedValueOnce(mockEmptySnapshot); // Review drills
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Python Functions')).toBeInTheDocument();
      });
      
      // Mock removal failure
      const mockRemovalSnapshot = {
        empty: false,
        docs: [{ id: 'saved-doc-1' }]
      };
      
      mockGetDocs
        .mockResolvedValueOnce(mockRemovalSnapshot) // Find saved drill
        .mockResolvedValueOnce(mockSavedDrillSnapshot); // Reload after error
      
      mockDeleteDoc.mockRejectedValue(new Error('Permission denied'));
      
      const savedSection = screen.getByText('Saved from Community').closest('section');
      const drillCard = within(savedSection!).getByText('Advanced Python Functions').closest('[class*="card"]');
      const removeButton = within(drillCard!).getByRole('button', { name: /remove|delete/i });
      
      await user.click(removeButton);
      
      // Verify error toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Failed to remove drill',
            variant: 'destructive'
          })
        );
      });
      
      // Verify drill is restored in UI after error
      await waitFor(() => {
        expect(screen.getByText('Advanced Python Functions')).toBeInTheDocument();
      });
    });
  });

  describe('Create Personal Drill Flow', () => {
    it('should simulate drill creation and show it in practice page', async () => {
      // Mock successful drill creation (simulating the flow without the actual create page)
      const mockPersonalDrillSnapshot = {
        docs: [{
          id: 'new-drill-123',
          data: () => ({
            ...mockPersonalDrill,
            id: 'new-drill-123',
            title: 'My New Drill',
            concept: 'Testing',
            description: 'A test drill I created'
          })
        }]
      };
      
      const mockEmptySnapshot = { docs: [] };
      
      mockGetDocs
        .mockResolvedValueOnce(mockPersonalDrillSnapshot) // Personal drills
        .mockResolvedValueOnce(mockEmptySnapshot) // Saved drills
        .mockResolvedValueOnce(mockEmptySnapshot); // Review drills
      
      render(<DrillsPage />);
      
      // Wait for personal drill to appear
      await waitFor(() => {
        expect(screen.getByText('My New Drill')).toBeInTheDocument();
      });
      
      // Verify it's in the "My Drills" section
      const personalSection = screen.getByText('My Drills').closest('section');
      expect(personalSection).toBeInTheDocument();
      expect(within(personalSection!).getByText('My New Drill')).toBeInTheDocument();
      
      // Verify personal badge is shown
      expect(within(personalSection!).getByText('Created by You')).toBeInTheDocument();
    });
  });

  describe('Navigation Between Practice and Community Pages', () => {
    it('should navigate from practice page to community page', async () => {
      const user = userEvent.setup();
      
      // Mock empty data for practice page
      const mockEmptySnapshot = { docs: [] };
      mockGetDocs
        .mockResolvedValue(mockEmptySnapshot);
      
      render(<DrillsPage />);
      
      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Find and click "Browse Community" button
      const browseButton = screen.getByRole('button', { name: /browse community/i });
      await user.click(browseButton);
      
      // Verify navigation
      expect(mockRouter.push).toHaveBeenCalledWith('/community');
    });

    it('should navigate from community page to practice page', async () => {
      const user = userEvent.setup();
      
      // Mock empty community data
      const mockEmptySnapshot = { docs: [] };
      mockGetDocs.mockResolvedValue(mockEmptySnapshot);
      
      render(<CommunityPage />);
      
      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Community Drills')).toBeInTheDocument();
      });
      
      // Find and click "My Practice" button
      const practiceButton = screen.getByRole('button', { name: /my practice/i });
      await user.click(practiceButton);
      
      // Verify navigation
      expect(mockRouter.push).toHaveBeenCalledWith('/drills');
    });

    it('should show correct drill counts in stats cards', async () => {
      // Mock data with both personal and saved drills
      const mockPersonalSnapshot = {
        docs: [
          { id: 'personal-1', data: () => mockPersonalDrill },
          { id: 'personal-2', data: () => ({ ...mockPersonalDrill, id: 'personal-2' }) }
        ]
      };
      
      const mockSavedSnapshot = {
        docs: [{
          id: 'saved-1',
          data: () => ({
            drillId: mockCommunityDrill.id,
            savedAt: { toDate: () => new Date() },
            originalDrillData: {
              ...mockCommunityDrill,
              createdAt: { toDate: () => mockCommunityDrill.createdAt }
            }
          })
        }]
      };
      
      const mockEmptySnapshot = { docs: [] };
      
      mockGetDocs
        .mockResolvedValueOnce(mockPersonalSnapshot) // Personal drills
        .mockResolvedValueOnce(mockSavedSnapshot) // Saved drills
        .mockResolvedValueOnce(mockEmptySnapshot); // Review drills
      
      render(<DrillsPage />);
      
      // Wait for stats to load and verify counts
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Personal count
        expect(screen.getByText('1')).toBeInTheDocument(); // Saved count
        expect(screen.getByText('3')).toBeInTheDocument(); // Total count
      });
    });

    it('should handle empty states correctly', async () => {
      // Mock empty data
      const mockEmptySnapshot = { docs: [] };
      mockGetDocs.mockResolvedValue(mockEmptySnapshot);
      
      render(<DrillsPage />);
      
      // Wait for empty states to appear
      await waitFor(() => {
        expect(screen.getByText('No personal drills yet')).toBeInTheDocument();
        expect(screen.getByText('No saved drills yet')).toBeInTheDocument();
      });
      
      // Verify empty state action buttons
      expect(screen.getByRole('button', { name: /create drill/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /browse community/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling in User Flows', () => {
    it('should handle authentication errors gracefully', async () => {
      // Mock unauthenticated user
      mockUseAuthState.mockReturnValue([null, false, undefined]);
      
      render(<DrillsPage />);
      
      // Should show loading or redirect to login
      // The exact behavior depends on your auth implementation
      await waitFor(() => {
        expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      });
    });

    it('should handle network errors during drill loading', async () => {
      // Mock network error
      mockGetDocs.mockRejectedValue(new Error('Network connection failed'));
      
      render(<DrillsPage />);
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/connection problem/i)).toBeInTheDocument();
      });
      
      // Verify retry button is available
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle partial failures gracefully', async () => {
      const mockPersonalSnapshot = {
        docs: [{ id: 'personal-1', data: () => mockPersonalDrill }]
      };
      
      const mockEmptySnapshot = { docs: [] };
      
      // Mock personal drills success, saved drills failure
      mockGetDocs
        .mockResolvedValueOnce(mockPersonalSnapshot) // Personal drills success
        .mockRejectedValueOnce(new Error('Saved drills failed')) // Saved drills failure
        .mockResolvedValueOnce(mockEmptySnapshot); // Review drills success
      
      render(<DrillsPage />);
      
      // Should show personal drills and error for saved drills
      await waitFor(() => {
        expect(screen.getByText('My Python Basics')).toBeInTheDocument();
        expect(screen.getByText(/failed to load saved drills/i)).toBeInTheDocument();
      });
    });
  });
});