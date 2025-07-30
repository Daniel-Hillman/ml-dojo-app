/**
 * Integration tests for save/unsave drill flows
 * Tests the complete flow from community page save to practice page management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  getDocs, addDoc, updateDoc, deleteDoc, increment, 
  arrayUnion, arrayRemove, serverTimestamp 
} from 'firebase/firestore';

import CommunityPage from '@/app/(app)/community/page';
import DrillsPage from '@/app/(app)/drills/page';

// Mock dependencies
jest.mock('react-firebase-hooks/auth');
jest.mock('next/navigation');
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase/client', () => ({ db: {}, auth: {} }));

const mockUseAuthState = useAuthState as jest.MockedFunction<typeof useAuthState>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockIncrement = increment as jest.MockedFunction<typeof increment>;
const mockArrayUnion = arrayUnion as jest.MockedFunction<typeof arrayUnion>;
const mockArrayRemove = arrayRemove as jest.MockedFunction<typeof arrayRemove>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;

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

const mockCommunityDrill = {
  id: 'community-drill-1',
  title: 'Advanced React Hooks',
  concept: 'React Hooks',
  difficulty: 'Advanced',
  description: 'Master advanced React hooks patterns',
  language: 'javascript',
  content: [
    { id: '1', type: 'theory', value: 'useCallback optimizes function references' },
    { id: '2', type: 'code', value: 'const memoizedCallback = useCallback(() => {}, []);' }
  ],
  authorId: 'author-456',
  authorName: 'React Expert',
  authorAvatar: 'https://example.com/expert.jpg',
  createdAt: new Date('2024-01-01'),
  likes: 45,
  views: 300,
  saves: 20,
  comments: 8,
  tags: ['react', 'hooks'],
  isPublic: true,
  likedBy: [],
  savedBy: []
};

describe('Save/Unsave Drill Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuthState.mockReturnValue([mockUser, false, undefined]);
    
    // Mock Firestore functions
    mockIncrement.mockImplementation(() => ({} as any));
    mockArrayUnion.mockImplementation(() => ({} as any));
    mockArrayRemove.mockImplementation(() => ({} as any));
    mockServerTimestamp.mockImplementation(() => ({} as any));
  });

  describe('Save Drill from Community', () => {
    it('should save a drill and update UI immediately', async () => {
      const user = userEvent.setup();
      
      // Mock community drills data
      const mockCommunitySnapshot = {
        docs: [{
          id: mockCommunityDrill.id,
          data: () => mockCommunityDrill
        }]
      };
      
      mockGetDocs.mockResolvedValue(mockCommunitySnapshot);
      mockUpdateDoc.mockResolvedValue(undefined);
      mockAddDoc.mockResolvedValue({ id: 'saved-doc-1' } as any);
      
      render(<CommunityPage />);
      
      // Wait for drill to load
      await waitFor(() => {
        expect(screen.getByText('Advanced React Hooks')).toBeInTheDocument();
      });
      
      // Find the drill card and save button
      const drillCard = screen.getByText('Advanced React Hooks').closest('[class*="card"]');
      expect(drillCard).toBeInTheDocument();
      
      const saveButton = within(drillCard!).getByText('Save');
      expect(saveButton).toBeInTheDocument();
      
      // Click save button
      await user.click(saveButton);
      
      // Verify Firestore operations were called
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
      
      // Verify UI updates (save count should increase)
      await waitFor(() => {
        expect(screen.getByText('21')).toBeInTheDocument(); // saves count increased
      });
    });

    it('should handle save operation failure', async () => {
      const user = userEvent.setup();
      
      const mockCommunitySnapshot = {
        docs: [{
          id: mockCommunityDrill.id,
          data: () => mockCommunityDrill
        }]
      };
      
      mockGetDocs.mockResolvedValue(mockCommunitySnapshot);
      mockUpdateDoc.mockRejectedValue(new Error('Network error'));
      
      render(<CommunityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Advanced React Hooks')).toBeInTheDocument();
      });
      
      const drillCard = screen.getByText('Advanced React Hooks').closest('[class*="card"]');
      const saveButton = within(drillCard!).getByText('Save');
      
      await user.click(saveButton);
      
      // Verify error toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: 'Failed to save drill',
            variant: 'destructive'
          })
        );
      });
      
      // Verify UI doesn't change on error
      expect(screen.getByText('20')).toBeInTheDocument(); // saves count unchanged
    });

    it('should toggle save state correctly', async () => {
      const user = userEvent.setup();
      
      // Mock drill that's already saved by user
      const savedDrill = {
        ...mockCommunityDrill,
        savedBy: [mockUser.uid],
        saves: 21
      };
      
      const mockCommunitySnapshot = {
        docs: [{
          id: savedDrill.id,
          data: () => savedDrill
        }]
      };
      
      mockGetDocs.mockResolvedValue(mockCommunitySnapshot);
      mockUpdateDoc.mockResolvedValue(undefined);
      
      render(<CommunityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Advanced React Hooks')).toBeInTheDocument();
      });
      
      const drillCard = screen.getByText('Advanced React Hooks').closest('[class*="card"]');
      const saveButton = within(drillCard!).getByText('Save');
      
      // Button should show as already saved (different styling)
      expect(saveButton).toHaveClass('text-blue-500');
      
      // Click to unsave
      await user.click(saveButton);
      
      // Verify unsave operations
      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            saves: expect.anything(), // decrement
            savedBy: expect.anything() // arrayRemove
          })
        );
      });
      
      // Verify unsave toast
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Removed from saved',
          description: 'Drill removed from your saved list'
        })
      );
    });

    it('should require authentication to save', async () => {
      const user = userEvent.setup();
      
      // Mock unauthenticated user
      mockUseAuthState.mockReturnValue([null, false, undefined]);
      
      const mockCommunitySnapshot = {
        docs: [{
          id: mockCommunityDrill.id,
          data: () => mockCommunityDrill
        }]
      };
      
      mockGetDocs.mockResolvedValue(mockCommunitySnapshot);
      
      render(<CommunityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Advanced React Hooks')).toBeInTheDocument();
      });
      
      const drillCard = screen.getByText('Advanced React Hooks').closest('[class*="card"]');
      const saveButton = within(drillCard!).getByText('Save');
      
      await user.click(saveButton);
      
      // Verify login required toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Login Required',
            description: 'Please log in to save drills',
            variant: 'destructive'
          })
        );
      });
      
      // Verify no Firestore operations were called
      expect(mockUpdateDoc).not.toHaveBeenCalled();
      expect(mockAddDoc).not.toHaveBeenCalled();
    });
  });

  describe('Remove Saved Drill from Practice', () => {
    it('should remove saved drill and update UI optimistically', async () => {
      const user = userEvent.setup();
      
      // Mock saved drill data in practice page
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
      
      // Mock initial data load for practice page
      mockGetDocs
        .mockResolvedValueOnce(mockEmptySnapshot) // Personal drills
        .mockResolvedValueOnce(mockSavedDrillSnapshot) // Saved drills
        .mockResolvedValueOnce(mockEmptySnapshot); // Review drills
      
      render(<DrillsPage />);
      
      // Wait for saved drill to appear
      await waitFor(() => {
        expect(screen.getByText('Advanced React Hooks')).toBeInTheDocument();
      });
      
      // Verify it's in the saved section
      const savedSection = screen.getByText('Saved from Community').closest('section');
      expect(within(savedSection!).getByText('Advanced React Hooks')).toBeInTheDocument();
      
      // Mock successful removal operations
      const mockRemovalSnapshot = {
        empty: false,
        docs: [{ id: 'saved-doc-1' }]
      };
      
      mockGetDocs.mockResolvedValueOnce(mockRemovalSnapshot); // Find saved drill
      mockDeleteDoc.mockResolvedValue(undefined);
      mockUpdateDoc.mockResolvedValue(undefined);
      
      // Find and click remove button
      const drillCard = within(savedSection!).getByText('Advanced React Hooks').closest('[class*="card"]');
      const removeButton = within(drillCard!).getByRole('button', { name: /remove|delete/i });
      
      await user.click(removeButton);
      
      // Verify optimistic UI update (drill disappears immediately)
      await waitFor(() => {
        const updatedSavedSection = screen.getByText('Saved from Community').closest('section');
        expect(within(updatedSavedSection!).queryByText('Advanced React Hooks')).not.toBeInTheDocument();
      });
      
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
          description: expect.stringContaining('Advanced React Hooks')
        })
      );
    });

    it('should handle removal failure and revert optimistic update', async () => {
      const user = userEvent.setup();
      
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
        expect(screen.getByText('Advanced React Hooks')).toBeInTheDocument();
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
      const drillCard = within(savedSection!).getByText('Advanced React Hooks').closest('[class*="card"]');
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
        expect(screen.getByText('Advanced React Hooks')).toBeInTheDocument();
      });
    });

    it('should handle drill not found error', async () => {
      const user = userEvent.setup();
      
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
        expect(screen.getByText('Advanced React Hooks')).toBeInTheDocument();
      });
      
      // Mock drill not found
      const mockNotFoundSnapshot = { empty: true, docs: [] };
      
      mockGetDocs.mockResolvedValueOnce(mockNotFoundSnapshot);
      
      const savedSection = screen.getByText('Saved from Community').closest('section');
      const drillCard = within(savedSection!).getByText('Advanced React Hooks').closest('[class*="card"]');
      const removeButton = within(drillCard!).getByRole('button', { name: /remove|delete/i });
      
      await user.click(removeButton);
      
      // Verify specific error message for not found
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Failed to remove drill',
            description: expect.stringContaining('no longer in your saved collection'),
            variant: 'destructive'
          })
        );
      });
    });
  });

  describe('Cross-Page Save State Consistency', () => {
    it('should maintain save state consistency between community and practice pages', async () => {
      // Test saving from community page
      const mockCommunitySnapshot = {
        docs: [{
          id: mockCommunityDrill.id,
          data: () => mockCommunityDrill
        }]
      };
      
      mockGetDocs.mockResolvedValue(mockCommunitySnapshot);
      mockUpdateDoc.mockResolvedValue(undefined);
      mockAddDoc.mockResolvedValue({ id: 'saved-doc-1' } as any);
      
      const { rerender } = render(<CommunityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Advanced React Hooks')).toBeInTheDocument();
      });
      
      const user = userEvent.setup();
      const drillCard = screen.getByText('Advanced React Hooks').closest('[class*="card"]');
      const saveButton = within(drillCard!).getByText('Save');
      
      await user.click(saveButton);
      
      // Now check practice page shows the saved drill
      const mockSavedDrillSnapshot = {
        docs: [{
          id: 'saved-doc-1',
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
        .mockResolvedValueOnce(mockEmptySnapshot) // Personal drills
        .mockResolvedValueOnce(mockSavedDrillSnapshot) // Saved drills
        .mockResolvedValueOnce(mockEmptySnapshot); // Review drills
      
      rerender(<DrillsPage />);
      
      // Verify drill appears in practice page
      await waitFor(() => {
        const savedSection = screen.getByText('Saved from Community').closest('section');
        expect(within(savedSection!).getByText('Advanced React Hooks')).toBeInTheDocument();
      });
    });

    it('should update save counts correctly across operations', async () => {
      const user = userEvent.setup();
      
      // Start with drill having 20 saves
      const mockCommunitySnapshot = {
        docs: [{
          id: mockCommunityDrill.id,
          data: () => ({ ...mockCommunityDrill, saves: 20 })
        }]
      };
      
      mockGetDocs.mockResolvedValue(mockCommunitySnapshot);
      mockUpdateDoc.mockResolvedValue(undefined);
      mockAddDoc.mockResolvedValue({ id: 'saved-doc-1' } as any);
      
      render(<CommunityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('20')).toBeInTheDocument(); // Initial save count
      });
      
      const drillCard = screen.getByText('Advanced React Hooks').closest('[class*="card"]');
      const saveButton = within(drillCard!).getByText('Save');
      
      await user.click(saveButton);
      
      // Verify save count increases
      await waitFor(() => {
        expect(screen.getByText('21')).toBeInTheDocument();
      });
    });
  });

  describe('Save State Visual Indicators', () => {
    it('should show correct visual state for saved drills', async () => {
      // Mock drill already saved by user
      const savedDrill = {
        ...mockCommunityDrill,
        savedBy: [mockUser.uid]
      };
      
      const mockCommunitySnapshot = {
        docs: [{
          id: savedDrill.id,
          data: () => savedDrill
        }]
      };
      
      mockGetDocs.mockResolvedValue(mockCommunitySnapshot);
      
      render(<CommunityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Advanced React Hooks')).toBeInTheDocument();
      });
      
      const drillCard = screen.getByText('Advanced React Hooks').closest('[class*="card"]');
      const saveButton = within(drillCard!).getByText('Save');
      
      // Verify saved state styling
      expect(saveButton).toHaveClass('text-blue-500');
      
      // Verify filled bookmark icon
      const bookmarkIcon = saveButton.querySelector('[data-testid="bookmark-plus-icon"]');
      expect(bookmarkIcon).toHaveClass('fill-current');
    });

    it('should show correct visual state for unsaved drills', async () => {
      const mockCommunitySnapshot = {
        docs: [{
          id: mockCommunityDrill.id,
          data: () => mockCommunityDrill
        }]
      };
      
      mockGetDocs.mockResolvedValue(mockCommunitySnapshot);
      
      render(<CommunityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Advanced React Hooks')).toBeInTheDocument();
      });
      
      const drillCard = screen.getByText('Advanced React Hooks').closest('[class*="card"]');
      const saveButton = within(drillCard!).getByText('Save');
      
      // Verify unsaved state styling (no special color class)
      expect(saveButton).not.toHaveClass('text-blue-500');
      
      // Verify unfilled bookmark icon
      const bookmarkIcon = saveButton.querySelector('[data-testid="bookmark-plus-icon"]');
      expect(bookmarkIcon).not.toHaveClass('fill-current');
    });
  });
});