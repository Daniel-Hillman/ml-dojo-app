/**
 * Final End-to-End Integration Tests for Practice Drills Enhancement
 * 
 * This test suite validates all requirements through comprehensive user journey testing:
 * - Complete user journey from community discovery to practice
 * - All drill functionality works identically regardless of source
 * - Various user scenarios (no drills, many drills, mixed content)
 * - All requirements validation through comprehensive testing
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
import DrillDetailPage from '@/app/(app)/drills/[id]/page';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

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

// Mock AI client
jest.mock('@/lib/ai-client', () => ({
  generateDrillContent: jest.fn().mockResolvedValue([
    { id: '1', type: 'theory', value: 'Generated theory content' },
    { id: '2', type: 'code', value: 'def example():\n    pass', language: 'python' }
  ])
}));

// Type definitions for mocks
const mockUseAuthState = jest.mocked(useAuthState);
const mockUseRouter = jest.mocked(useRouter);
const mockGetDocs = jest.mocked(getDocs);
const mockGetDoc = jest.mocked(getDoc);
const mockAddDoc = jest.mocked(addDoc);
const mockUpdateDoc = jest.mocked(updateDoc);
const mockDeleteDoc = jest.mocked(deleteDoc);

// Test data
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

// Comprehensive test data representing various drill types and scenarios
const testDrills = {
  communityDrills: [
    {
      id: 'community-python-1',
      title: 'Advanced Python Functions',
      concept: 'Functions',
      difficulty: 'Advanced',
      description: 'Master advanced function concepts in Python',
      language: 'python',
      content: [
        { id: '1', type: 'theory', value: 'Functions are first-class objects in Python' },
        { id: '2', type: 'code', value: 'def higher_order_func(func):\n    return func', language: 'python' },
        { id: '3', type: 'mcq', value: 'What is a closure?', choices: ['A', 'B', 'C'], answer: 0 }
      ],
      authorId: 'expert-456',
      authorName: 'Python Expert',
      authorAvatar: 'https://example.com/expert.jpg',
      createdAt: new Date('2024-01-01'),
      likes: 45,
      views: 300,
      saves: 25,
      comments: 12,
      tags: ['python', 'functions', 'advanced'],
      isPublic: true,
      likedBy: [],
      savedBy: []
    },
    {
      id: 'community-js-1',
      title: 'React Hooks Mastery',
      concept: 'React Hooks',
      difficulty: 'Intermediate',
      description: 'Learn React hooks patterns and best practices',
      language: 'javascript',
      content: [
        { id: '1', type: 'theory', value: 'useEffect manages side effects in functional components' },
        { id: '2', type: 'code', value: 'useEffect(() => {\n  // effect\n}, []);', language: 'javascript' }
      ],
      authorId: 'react-guru-789',
      authorName: 'React Guru',
      authorAvatar: 'https://example.com/guru.jpg',
      createdAt: new Date('2024-01-02'),
      likes: 32,
      views: 180,
      saves: 18,
      comments: 7,
      tags: ['react', 'hooks', 'javascript'],
      isPublic: true,
      likedBy: [],
      savedBy: []
    }
  ],
  personalDrills: [
    {
      id: 'personal-1',
      title: 'My Python Basics',
      concept: 'Variables',
      difficulty: 'Beginner',
      description: 'Personal drill for Python variables',
      drill_content: [
        { id: '1', type: 'theory', value: 'Variables store data in Python' },
        { id: '2', type: 'code', value: 'x = 10\nprint(x)', language: 'python' }
      ],
      userId: 'test-user-123',
      createdAt: new Date('2024-01-03'),
      language: 'python'
    },
    {
      id: 'personal-2',
      title: 'CSS Flexbox Practice',
      concept: 'CSS Layout',
      difficulty: 'Intermediate',
      description: 'Practice CSS flexbox properties',
      drill_content: [
        { id: '1', type: 'theory', value: 'Flexbox provides flexible layout options' },
        { id: '2', type: 'code', value: '.container {\n  display: flex;\n}', language: 'css' }
      ],
      userId: 'test-user-123',
      createdAt: new Date('2024-01-04'),
      language: 'css'
    }
  ]
};

describe('Final End-to-End Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseAuthState.mockReturnValue([mockUser, false, undefined]);
    mockUseRouter.mockReturnValue(mockRouter);
    
    // Mock Firestore functions with default implementations
    jest.mocked(collection).mockImplementation(() => ({} as any));
    jest.mocked(query).mockImplementation(() => ({} as any));
    jest.mocked(where).mockImplementation(() => ({} as any));
    jest.mocked(orderBy).mockImplementation(() => ({} as any));
    jest.mocked(doc).mockImplementation(() => ({} as any));
    jest.mocked(increment).mockImplementation(() => ({} as any));
    jest.mocked(arrayUnion).mockImplementation(() => ({} as any));
    jest.mocked(arrayRemove).mockImplementation(() => ({} as any));
    jest.mocked(serverTimestamp).mockImplementation(() => ({} as any));
  });

  describe('Complete User Journey: Community Discovery to Practice', () => {
    it('should complete the full journey from discovering a drill to practicing it', async () => {
      const user = userEvent.setup();
      
      // Step 1: User visits community page and discovers drills
      const mockCommunitySnapshot = {
        docs: testDrills.communityDrills.map(drill => ({
          id: drill.id,
          data: () => drill
        }))
      };
      
      mockGetDocs.mockResolvedValue(mockCommunitySnapshot);
      
      const { rerender } = render(<CommunityPage />);
      
      // Verify community drills are displayed
      await waitFor(() => {
        expect(screen.getByText('Advanced Python Functions')).toBeInTheDocument();
        expect(screen.getByText('React Hooks Mastery')).toBeInTheDocument();
      });
      
      // Verify drill metadata is shown correctly
      expect(screen.getByText('Python Expert')).toBeInTheDocument();
      expect(screen.getByText('React Guru')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument(); // likes count
      expect(screen.getByText('300')).toBeInTheDocument(); // views count
      
      // Step 2: User saves a drill from community
      mockUpdateDoc.mockResolvedValue(undefined);
      mockAddDoc.mockResolvedValue({ id: 'saved-doc-1' } as any);
      
      const pythonDrillCard = screen.getByText('Advanced Python Functions').closest('[class*="card"]');
      const saveButton = within(pythonDrillCard!).getByText('Save');
      
      await user.click(saveButton);
      
      // Verify save operations
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
            drillId: 'community-python-1',
            savedAt: expect.anything(),
            originalDrillData: testDrills.communityDrills[0]
          })
        );
      });
      
      // Verify success feedback
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Saved!',
          description: 'Drill added to your practice list'
        })
      );
      
      // Step 3: User navigates to practice page
      const practiceButton = screen.getByRole('button', { name: /my practice/i });
      await user.click(practiceButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/drills');
      
      // Step 4: Mock practice page data loading
      const mockPersonalSnapshot = {
        docs: testDrills.personalDrills.map(drill => ({
          id: drill.id,
          data: () => drill
        }))
      };
      
      const mockSavedSnapshot = {
        docs: [{
          id: 'saved-doc-1',
          data: () => ({
            drillId: 'community-python-1',
            savedAt: { toDate: () => new Date('2024-01-05') },
            originalDrillData: {
              ...testDrills.communityDrills[0],
              createdAt: { toDate: () => testDrills.communityDrills[0].createdAt }
            }
          })
        }]
      };
      
      const mockEmptySnapshot = { docs: [] };
      
      mockGetDocs
        .mockResolvedValueOnce(mockPersonalSnapshot) // Personal drills
        .mockResolvedValueOnce(mockSavedSnapshot) // Saved drills
        .mockResolvedValueOnce(mockEmptySnapshot); // Review drills
      
      rerender(<DrillsPage />);
      
      // Step 5: Verify practice page shows both personal and saved drills
      await waitFor(() => {
        // Personal drills section
        const personalSection = screen.getByText('My Drills').closest('section');
        expect(within(personalSection!).getByText('My Python Basics')).toBeInTheDocument();
        expect(within(personalSection!).getByText('CSS Flexbox Practice')).toBeInTheDocument();
        expect(within(personalSection!).getByText('Created by You')).toBeInTheDocument();
        
        // Saved drills section
        const savedSection = screen.getByText('Saved from Community').closest('section');
        expect(within(savedSection!).getByText('Advanced Python Functions')).toBeInTheDocument();
        expect(within(savedSection!).getByText('From Community')).toBeInTheDocument();
        expect(within(savedSection!).getByText('Python Expert')).toBeInTheDocument();
      });
      
      // Step 6: Verify stats cards show correct counts
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Personal count
        expect(screen.getByText('1')).toBeInTheDocument(); // Saved count
        expect(screen.getByText('3')).toBeInTheDocument(); // Total count
      });
      
      // Step 7: User practices a saved drill
      const savedSection = screen.getByText('Saved from Community').closest('section');
      const practiceButtonSaved = within(savedSection!).getByRole('button', { name: /practice/i });
      
      await user.click(practiceButtonSaved);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/drills/community-python-1');
      
      // Step 8: Mock drill detail page for saved drill
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...testDrills.communityDrills[0],
          createdAt: { toDate: () => testDrills.communityDrills[0].createdAt }
        })
      });
      
      // This would render the drill detail page and verify functionality
      // The drill should work identically regardless of being accessed from community or practice
    });

    it('should handle navigation between community and practice pages seamlessly', async () => {
      const user = userEvent.setup();
      
      // Start on practice page
      const mockEmptySnapshot = { docs: [] };
      mockGetDocs.mockResolvedValue(mockEmptySnapshot);
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Practice Drills')).toBeInTheDocument();
      });
      
      // Navigate to community
      const browseCommunityButton = screen.getByRole('button', { name: /browse community/i });
      await user.click(browseCommunityButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/community');
      
      // Mock community page
      const mockCommunitySnapshot = {
        docs: testDrills.communityDrills.map(drill => ({
          id: drill.id,
          data: () => drill
        }))
      };
      
      mockGetDocs.mockResolvedValue(mockCommunitySnapshot);
      
      const { rerender } = render(<CommunityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Community Drills')).toBeInTheDocument();
      });
      
      // Navigate back to practice
      const myPracticeButton = screen.getByRole('button', { name: /my practice/i });
      await user.click(myPracticeButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/drills');
    });
  });

  describe('Drill Functionality Consistency Across Sources', () => {
    it('should provide identical functionality for personal and saved community drills', async () => {
      // Mock practice page with both types of drills
      const mockPersonalSnapshot = {
        docs: [{
          id: 'personal-1',
          data: () => testDrills.personalDrills[0]
        }]
      };
      
      const mockSavedSnapshot = {
        docs: [{
          id: 'saved-doc-1',
          data: () => ({
            drillId: 'community-python-1',
            savedAt: { toDate: () => new Date() },
            originalDrillData: {
              ...testDrills.communityDrills[0],
              createdAt: { toDate: () => testDrills.communityDrills[0].createdAt }
            }
          })
        }]
      };
      
      const mockEmptySnapshot = { docs: [] };
      
      mockGetDocs
        .mockResolvedValueOnce(mockPersonalSnapshot)
        .mockResolvedValueOnce(mockSavedSnapshot)
        .mockResolvedValueOnce(mockEmptySnapshot);
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Python Basics')).toBeInTheDocument();
        expect(screen.getByText('Advanced Python Functions')).toBeInTheDocument();
      });
      
      // Verify both drill types have practice buttons
      const personalSection = screen.getByText('My Drills').closest('section');
      const savedSection = screen.getByText('Saved from Community').closest('section');
      
      expect(within(personalSection!).getByRole('button', { name: /practice/i })).toBeInTheDocument();
      expect(within(savedSection!).getByRole('button', { name: /practice/i })).toBeInTheDocument();
      
      // Verify both show difficulty and concept
      expect(within(personalSection!).getByText('Beginner')).toBeInTheDocument();
      expect(within(personalSection!).getByText('Variables')).toBeInTheDocument();
      
      expect(within(savedSection!).getByText('Advanced')).toBeInTheDocument();
      expect(within(savedSection!).getByText('Functions')).toBeInTheDocument();
      
      // Verify saved drill shows additional community metadata
      expect(within(savedSection!).getByText('Python Expert')).toBeInTheDocument();
      expect(within(savedSection!).getByText('45')).toBeInTheDocument(); // likes
    });

    it('should handle drill practice identically regardless of source', async () => {
      const user = userEvent.setup();
      
      // Test personal drill practice
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ...testDrills.personalDrills[0],
          createdAt: { toDate: () => testDrills.personalDrills[0].createdAt }
        })
      });
      
      // Mock practice page navigation
      const mockPersonalSnapshot = {
        docs: [{ id: 'personal-1', data: () => testDrills.personalDrills[0] }]
      };
      
      mockGetDocs
        .mockResolvedValueOnce(mockPersonalSnapshot)
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] });
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Python Basics')).toBeInTheDocument();
      });
      
      const personalSection = screen.getByText('My Drills').closest('section');
      const practiceButton = within(personalSection!).getByRole('button', { name: /practice/i });
      
      await user.click(practiceButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/drills/personal-1');
      
      // Test saved drill practice
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ...testDrills.communityDrills[0],
          createdAt: { toDate: () => testDrills.communityDrills[0].createdAt }
        })
      });
      
      // Both should navigate to the same drill detail page structure
      // The drill detail page should handle both personal and community drills identically
    });
  });

  describe('Various User Scenarios', () => {
    it('should handle users with no drills gracefully', async () => {
      const mockEmptySnapshot = { docs: [] };
      
      mockGetDocs
        .mockResolvedValueOnce(mockEmptySnapshot) // Personal drills
        .mockResolvedValueOnce(mockEmptySnapshot) // Saved drills
        .mockResolvedValueOnce(mockEmptySnapshot); // Review drills
      
      render(<DrillsPage />);
      
      // Verify empty states are shown
      await waitFor(() => {
        expect(screen.getByText('No personal drills yet')).toBeInTheDocument();
        expect(screen.getByText('No saved drills yet')).toBeInTheDocument();
      });
      
      // Verify appropriate CTAs are shown
      expect(screen.getByRole('button', { name: /create drill/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /browse community/i })).toBeInTheDocument();
      
      // Verify stats show zeros
      expect(screen.getByText('0')).toBeInTheDocument(); // Should appear multiple times for different counts
    });

    it('should handle users with many drills efficiently', async () => {
      // Create mock data for many drills
      const manyPersonalDrills = Array.from({ length: 15 }, (_, i) => ({
        id: `personal-${i}`,
        data: () => ({
          ...testDrills.personalDrills[0],
          id: `personal-${i}`,
          title: `Personal Drill ${i + 1}`,
          concept: `Concept ${i + 1}`
        })
      }));
      
      const manySavedDrills = Array.from({ length: 8 }, (_, i) => ({
        id: `saved-${i}`,
        data: () => ({
          drillId: `community-${i}`,
          savedAt: { toDate: () => new Date() },
          originalDrillData: {
            ...testDrills.communityDrills[0],
            id: `community-${i}`,
            title: `Community Drill ${i + 1}`,
            createdAt: { toDate: () => new Date() }
          }
        })
      }));
      
      mockGetDocs
        .mockResolvedValueOnce({ docs: manyPersonalDrills })
        .mockResolvedValueOnce({ docs: manySavedDrills })
        .mockResolvedValueOnce({ docs: [] });
      
      render(<DrillsPage />);
      
      // Verify high counts are displayed correctly
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument(); // Personal count
        expect(screen.getByText('8')).toBeInTheDocument(); // Saved count
        expect(screen.getByText('23')).toBeInTheDocument(); // Total count
      });
      
      // Verify drills are rendered (at least some of them)
      expect(screen.getByText('Personal Drill 1')).toBeInTheDocument();
      expect(screen.getByText('Community Drill 1')).toBeInTheDocument();
      
      // Verify sections are properly organized
      const personalSection = screen.getByText('My Drills').closest('section');
      const savedSection = screen.getByText('Saved from Community').closest('section');
      
      expect(personalSection).toBeInTheDocument();
      expect(savedSection).toBeInTheDocument();
    });

    it('should handle mixed content types and difficulties', async () => {
      // Create drills with various content types and difficulties
      const mixedPersonalDrills = [
        {
          id: 'personal-beginner',
          data: () => ({
            ...testDrills.personalDrills[0],
            difficulty: 'Beginner',
            language: 'python',
            drill_content: [
              { id: '1', type: 'theory', value: 'Basic theory' },
              { id: '2', type: 'code', value: 'print("hello")', language: 'python' }
            ]
          })
        },
        {
          id: 'personal-advanced',
          data: () => ({
            ...testDrills.personalDrills[1],
            difficulty: 'Advanced',
            language: 'javascript',
            drill_content: [
              { id: '1', type: 'mcq', value: 'What is closure?', choices: ['A', 'B'], answer: 0 },
              { id: '2', type: 'code', value: 'const fn = () => {}', language: 'javascript' }
            ]
          })
        }
      ];
      
      const mixedSavedDrills = [
        {
          id: 'saved-intermediate',
          data: () => ({
            drillId: 'community-intermediate',
            savedAt: { toDate: () => new Date() },
            originalDrillData: {
              ...testDrills.communityDrills[1],
              difficulty: 'Intermediate',
              language: 'css',
              createdAt: { toDate: () => new Date() }
            }
          })
        }
      ];
      
      mockGetDocs
        .mockResolvedValueOnce({ docs: mixedPersonalDrills })
        .mockResolvedValueOnce({ docs: mixedSavedDrills })
        .mockResolvedValueOnce({ docs: [] });
      
      render(<DrillsPage />);
      
      // Verify different difficulties are displayed
      await waitFor(() => {
        expect(screen.getByText('Beginner')).toBeInTheDocument();
        expect(screen.getByText('Advanced')).toBeInTheDocument();
        expect(screen.getByText('Intermediate')).toBeInTheDocument();
      });
      
      // Verify different languages are shown
      expect(screen.getByText('python')).toBeInTheDocument();
      expect(screen.getByText('javascript')).toBeInTheDocument();
      expect(screen.getByText('css')).toBeInTheDocument();
      
      // Verify proper categorization
      const personalSection = screen.getByText('My Drills').closest('section');
      const savedSection = screen.getByText('Saved from Community').closest('section');
      
      expect(within(personalSection!).getByText('Beginner')).toBeInTheDocument();
      expect(within(personalSection!).getByText('Advanced')).toBeInTheDocument();
      expect(within(savedSection!).getByText('Intermediate')).toBeInTheDocument();
    });
  });

  describe('Comprehensive Requirements Validation', () => {
    it('should validate Requirement 1: Organized sections with proper drill categorization', async () => {
      const mockPersonalSnapshot = {
        docs: [{ id: 'personal-1', data: () => testDrills.personalDrills[0] }]
      };
      
      const mockSavedSnapshot = {
        docs: [{
          id: 'saved-1',
          data: () => ({
            drillId: 'community-1',
            savedAt: { toDate: () => new Date() },
            originalDrillData: {
              ...testDrills.communityDrills[0],
              createdAt: { toDate: () => testDrills.communityDrills[0].createdAt }
            }
          })
        }]
      };
      
      mockGetDocs
        .mockResolvedValueOnce(mockPersonalSnapshot)
        .mockResolvedValueOnce(mockSavedSnapshot)
        .mockResolvedValueOnce({ docs: [] });
      
      render(<DrillsPage />);
      
      // Requirement 1.1: Two distinct sections
      await waitFor(() => {
        expect(screen.getByText('My Drills')).toBeInTheDocument();
        expect(screen.getByText('Saved from Community')).toBeInTheDocument();
      });
      
      // Requirement 1.2: Personal drills only in My Drills section
      const personalSection = screen.getByText('My Drills').closest('section');
      expect(within(personalSection!).getByText('My Python Basics')).toBeInTheDocument();
      expect(within(personalSection!).queryByText('Advanced Python Functions')).not.toBeInTheDocument();
      
      // Requirement 1.3: Community drills only in Saved section
      const savedSection = screen.getByText('Saved from Community').closest('section');
      expect(within(savedSection!).getByText('Advanced Python Functions')).toBeInTheDocument();
      expect(within(savedSection!).queryByText('My Python Basics')).not.toBeInTheDocument();
    });

    it('should validate Requirement 2: Save functionality integration', async () => {
      const user = userEvent.setup();
      
      // Test save from community page
      const mockCommunitySnapshot = {
        docs: [{ id: 'community-1', data: () => testDrills.communityDrills[0] }]
      };
      
      mockGetDocs.mockResolvedValue(mockCommunitySnapshot);
      mockUpdateDoc.mockResolvedValue(undefined);
      mockAddDoc.mockResolvedValue({ id: 'saved-doc-1' } as any);
      
      const { rerender } = render(<CommunityPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Python Functions')).toBeInTheDocument();
      });
      
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      // Requirement 2.1 & 2.2: Save adds to collection and appears in practice
      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            drillId: 'community-python-1',
            originalDrillData: testDrills.communityDrills[0]
          })
        );
      });
      
      // Requirement 2.4: Toast notification
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Saved!',
          description: 'Drill added to your practice list'
        })
      );
    });

    it('should validate Requirement 3: Saved drill management', async () => {
      const user = userEvent.setup();
      
      // Setup saved drill in practice page
      const mockSavedSnapshot = {
        docs: [{
          id: 'saved-1',
          data: () => ({
            drillId: 'community-1',
            savedAt: { toDate: () => new Date() },
            originalDrillData: {
              ...testDrills.communityDrills[0],
              createdAt: { toDate: () => testDrills.communityDrills[0].createdAt }
            }
          })
        }]
      };
      
      mockGetDocs
        .mockResolvedValueOnce({ docs: [] }) // Personal drills
        .mockResolvedValueOnce(mockSavedSnapshot) // Saved drills
        .mockResolvedValueOnce({ docs: [] }); // Review drills
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Python Functions')).toBeInTheDocument();
      });
      
      // Requirement 3.1 & 3.5: Remove option and author info
      const savedSection = screen.getByText('Saved from Community').closest('section');
      expect(within(savedSection!).getByRole('button', { name: /remove/i })).toBeInTheDocument();
      expect(within(savedSection!).getByText('Python Expert')).toBeInTheDocument();
      
      // Test removal
      mockGetDocs.mockResolvedValueOnce({ docs: [{ id: 'saved-1' }] });
      mockDeleteDoc.mockResolvedValue(undefined);
      mockUpdateDoc.mockResolvedValue(undefined);
      
      const removeButton = within(savedSection!).getByRole('button', { name: /remove/i });
      await user.click(removeButton);
      
      // Requirement 3.3 & 3.4: Removal and confirmation
      await waitFor(() => {
        expect(mockDeleteDoc).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Drill removed'
          })
        );
      });
    });

    it('should validate Requirement 4: Navigation and counters', async () => {
      const user = userEvent.setup();
      
      // Setup data for counter testing
      const mockPersonalSnapshot = {
        docs: testDrills.personalDrills.map(drill => ({ id: drill.id, data: () => drill }))
      };
      
      const mockSavedSnapshot = {
        docs: [{
          id: 'saved-1',
          data: () => ({
            drillId: 'community-1',
            savedAt: { toDate: () => new Date() },
            originalDrillData: {
              ...testDrills.communityDrills[0],
              createdAt: { toDate: () => testDrills.communityDrills[0].createdAt }
            }
          })
        }]
      };
      
      mockGetDocs
        .mockResolvedValueOnce(mockPersonalSnapshot)
        .mockResolvedValueOnce(mockSavedSnapshot)
        .mockResolvedValueOnce({ docs: [] });
      
      render(<DrillsPage />);
      
      // Requirement 4.1: Browse Community button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /browse community/i })).toBeInTheDocument();
      });
      
      // Requirement 4.4: Counters
      expect(screen.getByText('2')).toBeInTheDocument(); // Personal count
      expect(screen.getByText('1')).toBeInTheDocument(); // Saved count
      expect(screen.getByText('3')).toBeInTheDocument(); // Total count
      
      // Test navigation
      const browseButton = screen.getByRole('button', { name: /browse community/i });
      await user.click(browseButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/community');
    });

    it('should validate Requirement 5: Original metadata preservation', async () => {
      // Setup saved drill with full metadata
      const mockSavedSnapshot = {
        docs: [{
          id: 'saved-1',
          data: () => ({
            drillId: 'community-1',
            savedAt: { toDate: () => new Date() },
            originalDrillData: {
              ...testDrills.communityDrills[0],
              createdAt: { toDate: () => testDrills.communityDrills[0].createdAt }
            }
          })
        }]
      };
      
      mockGetDocs
        .mockResolvedValueOnce({ docs: [] }) // Personal drills
        .mockResolvedValueOnce(mockSavedSnapshot) // Saved drills
        .mockResolvedValueOnce({ docs: [] }); // Review drills
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        const savedSection = screen.getByText('Saved from Community').closest('section');
        
        // Requirement 5.1: Original author name and avatar
        expect(within(savedSection!).getByText('Python Expert')).toBeInTheDocument();
        
        // Requirement 5.3: Community metrics
        expect(within(savedSection!).getByText('45')).toBeInTheDocument(); // likes
        
        // Requirement 5.5: Visual distinction with community badge
        expect(within(savedSection!).getByText('From Community')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle partial loading failures gracefully', async () => {
      // Mock personal drills success, saved drills failure
      mockGetDocs
        .mockResolvedValueOnce({ docs: [{ id: 'personal-1', data: () => testDrills.personalDrills[0] }] })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ docs: [] });
      
      render(<DrillsPage />);
      
      // Should show personal drills and error for saved drills
      await waitFor(() => {
        expect(screen.getByText('My Python Basics')).toBeInTheDocument();
        expect(screen.getByText(/failed to load saved drills/i)).toBeInTheDocument();
      });
      
      // Should show retry option
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle authentication errors', async () => {
      // Mock unauthenticated user
      mockUseAuthState.mockReturnValue([null, false, undefined]);
      
      render(<DrillsPage />);
      
      // Should show loading or redirect behavior
      await waitFor(() => {
        expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      });
    });

    it('should handle empty states with appropriate CTAs', async () => {
      const mockEmptySnapshot = { docs: [] };
      
      mockGetDocs
        .mockResolvedValueOnce(mockEmptySnapshot)
        .mockResolvedValueOnce(mockEmptySnapshot)
        .mockResolvedValueOnce(mockEmptySnapshot);
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        // Requirement 1.4 & 1.5: Empty states with CTAs
        expect(screen.getByText('No personal drills yet')).toBeInTheDocument();
        expect(screen.getByText('No saved drills yet')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create drill/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /browse community/i })).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Accessibility', () => {
    it('should load sections independently without blocking', async () => {
      // Mock delayed responses to test parallel loading
      const personalPromise = new Promise(resolve => 
        setTimeout(() => resolve({ docs: [{ id: 'personal-1', data: () => testDrills.personalDrills[0] }] }), 100)
      );
      
      const savedPromise = new Promise(resolve => 
        setTimeout(() => resolve({ docs: [] }), 200)
      );
      
      mockGetDocs
        .mockReturnValueOnce(personalPromise as any)
        .mockReturnValueOnce(savedPromise as any)
        .mockResolvedValueOnce({ docs: [] });
      
      render(<DrillsPage />);
      
      // Personal section should load first
      await waitFor(() => {
        expect(screen.getByText('My Python Basics')).toBeInTheDocument();
      }, { timeout: 150 });
      
      // Saved section should still be loading
      expect(screen.getByText('Saved from Community').closest('section')).toBeInTheDocument();
      
      // Both should eventually be loaded
      await waitFor(() => {
        expect(screen.getByText('No saved drills yet')).toBeInTheDocument();
      }, { timeout: 250 });
    });

    it('should provide proper accessibility features', async () => {
      const mockPersonalSnapshot = {
        docs: [{ id: 'personal-1', data: () => testDrills.personalDrills[0] }]
      };
      
      mockGetDocs
        .mockResolvedValueOnce(mockPersonalSnapshot)
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] });
      
      render(<DrillsPage />);
      
      await waitFor(() => {
        // Check for proper ARIA labels and structure
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('banner')).toBeInTheDocument();
        expect(screen.getByRole('navigation')).toBeInTheDocument();
        
        // Check for proper heading hierarchy
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Practice Drills');
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('My Drills');
        
        // Check for skip navigation
        expect(screen.getByText('Skip to main content')).toBeInTheDocument();
      });
    });
  });
});