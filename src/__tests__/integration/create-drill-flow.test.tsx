/**
 * Integration tests for create personal drill flow
 * Tests the complete flow from drill creation to appearance in practice page
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

import CreateDrillPage from '@/app/(app)/drills/create/page';
import DrillsPage from '@/app/(app)/drills/page';

// Mock dependencies
jest.mock('react-firebase-hooks/auth');
jest.mock('next/navigation');
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase/client', () => ({ db: {}, auth: {} }));

const mockUseAuthState = useAuthState as jest.MockedFunction<typeof useAuthState>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
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

// Mock AI client for drill generation
jest.mock('@/lib/ai-client', () => ({
  generateDrillContent: jest.fn().mockResolvedValue([
    { id: '1', type: 'theory', value: 'Generated theory content' },
    { id: '2', type: 'code', value: 'def example():\n    pass', language: 'python' }
  ])
}));

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

describe('Create Personal Drill Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuthState.mockReturnValue([mockUser, false, undefined]);
    mockUseRouter.mockReturnValue(mockRouter);
    mockServerTimestamp.mockImplementation(() => ({} as any));
  });

  describe('Manual Drill Creation Flow', () => {
    it('should create a drill manually and show it in practice page', async () => {
      const user = userEvent.setup();
      
      // Mock successful drill creation
      mockAddDoc.mockResolvedValue({ id: 'new-drill-123' } as any);
      
      render(<CreateDrillPage />);
      
      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create.*drill/i })).toBeInTheDocument();
      });
      
      // Fill out the basic drill information
      const titleInput = screen.getByLabelText(/title/i);
      const conceptInput = screen.getByLabelText(/concept/i);
      const difficultySelect = screen.getByLabelText(/difficulty/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const languageSelect = screen.getByLabelText(/language/i);
      
      await user.type(titleInput, 'My Python Functions Drill');
      await user.type(conceptInput, 'Functions');
      await user.selectOptions(difficultySelect, 'Intermediate');
      await user.type(descriptionInput, 'Practice Python function concepts');
      await user.selectOptions(languageSelect, 'python');
      
      // Add manual content sections
      const addSectionButton = screen.getByRole('button', { name: /add.*section/i });
      await user.click(addSectionButton);
      
      // Add theory section
      const sectionTypeSelect = screen.getByLabelText(/section.*type/i);
      await user.selectOptions(sectionTypeSelect, 'theory');
      
      const theoryContent = screen.getByLabelText(/content/i);
      await user.type(theoryContent, 'Functions are reusable blocks of code that perform specific tasks.');
      
      // Add another section for code
      await user.click(addSectionButton);
      
      const codeSectionSelects = screen.getAllByLabelText(/section.*type/i);
      await user.selectOptions(codeSectionSelects[1], 'code');
      
      const codeContent = screen.getAllByLabelText(/content/i)[1];
      await user.type(codeContent, 'def greet(name):\n    return f"Hello, {name}!"');
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create.*drill/i });
      await user.click(submitButton);
      
      // Verify drill creation was called with correct data
      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            title: 'My Python Functions Drill',
            concept: 'Functions',
            difficulty: 'Intermediate',
            description: 'Practice Python function concepts',
            language: 'python',
            userId: mockUser.uid,
            drill_content: expect.arrayContaining([
              expect.objectContaining({
                type: 'theory',
                value: 'Functions are reusable blocks of code that perform specific tasks.'
              }),
              expect.objectContaining({
                type: 'code',
                value: 'def greet(name):\n    return f"Hello, {name}!"'
              })
            ]),
            createdAt: expect.anything()
          })
        );
      });
      
      // Verify success toast
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Drill created successfully!',
          description: expect.stringContaining('My Python Functions Drill')
        })
      );
      
      // Verify navigation to practice page
      expect(mockRouter.push).toHaveBeenCalledWith('/drills');
      
      // Now test that the drill appears in practice page
      const mockPersonalDrillSnapshot = {
        docs: [{
          id: 'new-drill-123',
          data: () => ({
            id: 'new-drill-123',
            title: 'My Python Functions Drill',
            concept: 'Functions',
            difficulty: 'Intermediate',
            description: 'Practice Python function concepts',
            language: 'python',
            userId: mockUser.uid,
            createdAt: { toDate: () => new Date() },
            drill_content: [
              { id: '1', type: 'theory', value: 'Functions are reusable blocks of code that perform specific tasks.' },
              { id: '2', type: 'code', value: 'def greet(name):\n    return f"Hello, {name}!"' }
            ]
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
        expect(screen.getByText('My Python Functions Drill')).toBeInTheDocument();
      });
      
      // Verify it's in the "My Drills" section
      const personalSection = screen.getByText('My Drills').closest('section');
      expect(personalSection).toBeInTheDocument();
      expect(within(personalSection!).getByText('My Python Functions Drill')).toBeInTheDocument();
      
      // Verify personal drill badge
      expect(within(personalSection!).getByText('Created by You')).toBeInTheDocument();
      
      // Verify drill details are displayed
      expect(within(personalSection!).getByText('Functions')).toBeInTheDocument();
      expect(within(personalSection!).getByText('Intermediate')).toBeInTheDocument();
      expect(within(personalSection!).getByText('Practice Python function concepts')).toBeInTheDocument();
    });

    it('should handle drill creation errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock creation failure
      mockAddDoc.mockRejectedValue(new Error('Permission denied'));
      
      render(<CreateDrillPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create.*drill/i })).toBeInTheDocument();
      });
      
      // Fill out minimal form
      await user.type(screen.getByLabelText(/title/i), 'Test Drill');
      await user.type(screen.getByLabelText(/concept/i), 'Testing');
      await user.selectOptions(screen.getByLabelText(/difficulty/i), 'Beginner');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      
      const submitButton = screen.getByRole('button', { name: /create.*drill/i });
      await user.click(submitButton);
      
      // Verify error toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error creating drill',
            description: expect.stringContaining('Permission denied'),
            variant: 'destructive'
          })
        );
      });
      
      // Verify no navigation occurred
      expect(mockRouter.push).not.toHaveBeenCalled();
      
      // Verify form is still visible for retry
      expect(screen.getByRole('button', { name: /create.*drill/i })).toBeInTheDocument();
    });

    it('should validate required fields before submission', async () => {
      const user = userEvent.setup();
      
      render(<CreateDrillPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create.*drill/i })).toBeInTheDocument();
      });
      
      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /create.*drill/i });
      await user.click(submitButton);
      
      // Verify validation errors appear
      await waitFor(() => {
        expect(screen.getByText(/title.*required/i)).toBeInTheDocument();
        expect(screen.getByText(/concept.*required/i)).toBeInTheDocument();
        expect(screen.getByText(/description.*required/i)).toBeInTheDocument();
      });
      
      // Verify no API call was made
      expect(mockAddDoc).not.toHaveBeenCalled();
    });
  });

  describe('AI-Generated Drill Creation Flow', () => {
    it('should create a drill using AI generation and show it in practice page', async () => {
      const user = userEvent.setup();
      
      mockAddDoc.mockResolvedValue({ id: 'ai-drill-456' } as any);
      
      render(<CreateDrillPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create.*drill/i })).toBeInTheDocument();
      });
      
      // Fill out basic information
      await user.type(screen.getByLabelText(/title/i), 'AI Generated Python Drill');
      await user.type(screen.getByLabelText(/concept/i), 'Variables');
      await user.selectOptions(screen.getByLabelText(/difficulty/i), 'Beginner');
      await user.type(screen.getByLabelText(/description/i), 'Learn Python variables with AI help');
      await user.selectOptions(screen.getByLabelText(/language/i), 'python');
      
      // Use AI generation
      const generateButton = screen.getByRole('button', { name: /generate.*ai/i });
      await user.click(generateButton);
      
      // Wait for AI generation to complete
      await waitFor(() => {
        expect(screen.getByText('Generated theory content')).toBeInTheDocument();
        expect(screen.getByText('def example():')).toBeInTheDocument();
      });
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create.*drill/i });
      await user.click(submitButton);
      
      // Verify drill creation with AI-generated content
      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            title: 'AI Generated Python Drill',
            concept: 'Variables',
            difficulty: 'Beginner',
            description: 'Learn Python variables with AI help',
            language: 'python',
            userId: mockUser.uid,
            drill_content: expect.arrayContaining([
              expect.objectContaining({
                type: 'theory',
                value: 'Generated theory content'
              }),
              expect.objectContaining({
                type: 'code',
                value: 'def example():\n    pass'
              })
            ])
          })
        );
      });
      
      // Verify navigation
      expect(mockRouter.push).toHaveBeenCalledWith('/drills');
    });

    it('should handle AI generation failures gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock AI generation failure
      const { generateDrillContent } = require('@/lib/ai-client');
      generateDrillContent.mockRejectedValue(new Error('AI service unavailable'));
      
      render(<CreateDrillPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create.*drill/i })).toBeInTheDocument();
      });
      
      // Fill out basic information
      await user.type(screen.getByLabelText(/title/i), 'Test Drill');
      await user.type(screen.getByLabelText(/concept/i), 'Testing');
      await user.selectOptions(screen.getByLabelText(/difficulty/i), 'Beginner');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      
      // Try AI generation
      const generateButton = screen.getByRole('button', { name: /generate.*ai/i });
      await user.click(generateButton);
      
      // Verify error toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'AI Generation Failed',
            description: expect.stringContaining('AI service unavailable'),
            variant: 'destructive'
          })
        );
      });
      
      // Verify form is still usable for manual creation
      expect(screen.getByRole('button', { name: /create.*drill/i })).toBeInTheDocument();
    });
  });

  describe('Drill Content Management', () => {
    it('should allow adding and removing content sections', async () => {
      const user = userEvent.setup();
      
      render(<CreateDrillPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create.*drill/i })).toBeInTheDocument();
      });
      
      // Add first section
      const addSectionButton = screen.getByRole('button', { name: /add.*section/i });
      await user.click(addSectionButton);
      
      expect(screen.getByLabelText(/section.*type/i)).toBeInTheDocument();
      
      // Add second section
      await user.click(addSectionButton);
      
      const sectionSelects = screen.getAllByLabelText(/section.*type/i);
      expect(sectionSelects).toHaveLength(2);
      
      // Remove first section
      const removeButtons = screen.getAllByRole('button', { name: /remove.*section/i });
      await user.click(removeButtons[0]);
      
      // Verify section was removed
      const remainingSectionSelects = screen.getAllByLabelText(/section.*type/i);
      expect(remainingSectionSelects).toHaveLength(1);
    });

    it('should handle different content types correctly', async () => {
      const user = userEvent.setup();
      
      mockAddDoc.mockResolvedValue({ id: 'multi-content-drill' } as any);
      
      render(<CreateDrillPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create.*drill/i })).toBeInTheDocument();
      });
      
      // Fill basic info
      await user.type(screen.getByLabelText(/title/i), 'Multi-Content Drill');
      await user.type(screen.getByLabelText(/concept/i), 'Mixed Content');
      await user.selectOptions(screen.getByLabelText(/difficulty/i), 'Advanced');
      await user.type(screen.getByLabelText(/description/i), 'Drill with multiple content types');
      
      // Add theory section
      const addSectionButton = screen.getByRole('button', { name: /add.*section/i });
      await user.click(addSectionButton);
      
      await user.selectOptions(screen.getByLabelText(/section.*type/i), 'theory');
      await user.type(screen.getByLabelText(/content/i), 'Theory explanation here');
      
      // Add code section
      await user.click(addSectionButton);
      
      const sectionSelects = screen.getAllByLabelText(/section.*type/i);
      await user.selectOptions(sectionSelects[1], 'code');
      
      const contentInputs = screen.getAllByLabelText(/content/i);
      await user.type(contentInputs[1], 'print("Hello, World!")');
      
      // Add MCQ section
      await user.click(addSectionButton);
      
      const allSectionSelects = screen.getAllByLabelText(/section.*type/i);
      await user.selectOptions(allSectionSelects[2], 'mcq');
      
      const allContentInputs = screen.getAllByLabelText(/content/i);
      await user.type(allContentInputs[2], 'What is the output of print("Hello")?');
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /create.*drill/i });
      await user.click(submitButton);
      
      // Verify all content types were included
      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            drill_content: expect.arrayContaining([
              expect.objectContaining({ type: 'theory', value: 'Theory explanation here' }),
              expect.objectContaining({ type: 'code', value: 'print("Hello, World!")' }),
              expect.objectContaining({ type: 'mcq', value: 'What is the output of print("Hello")?' })
            ])
          })
        );
      });
    });
  });

  describe('Form State Management', () => {
    it('should preserve form data during AI generation', async () => {
      const user = userEvent.setup();
      
      render(<CreateDrillPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create.*drill/i })).toBeInTheDocument();
      });
      
      // Fill out form
      const titleInput = screen.getByLabelText(/title/i);
      const conceptInput = screen.getByLabelText(/concept/i);
      
      await user.type(titleInput, 'Preserved Title');
      await user.type(conceptInput, 'Preserved Concept');
      
      // Trigger AI generation
      const generateButton = screen.getByRole('button', { name: /generate.*ai/i });
      await user.click(generateButton);
      
      // Wait for generation to complete
      await waitFor(() => {
        expect(screen.getByText('Generated theory content')).toBeInTheDocument();
      });
      
      // Verify form data is preserved
      expect(titleInput).toHaveValue('Preserved Title');
      expect(conceptInput).toHaveValue('Preserved Concept');
    });

    it('should handle form reset correctly', async () => {
      const user = userEvent.setup();
      
      render(<CreateDrillPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create.*drill/i })).toBeInTheDocument();
      });
      
      // Fill out form
      await user.type(screen.getByLabelText(/title/i), 'Test Title');
      await user.type(screen.getByLabelText(/concept/i), 'Test Concept');
      
      // Add content section
      const addSectionButton = screen.getByRole('button', { name: /add.*section/i });
      await user.click(addSectionButton);
      
      await user.type(screen.getByLabelText(/content/i), 'Test content');
      
      // Reset form
      const resetButton = screen.getByRole('button', { name: /reset|clear/i });
      await user.click(resetButton);
      
      // Verify form is cleared
      expect(screen.getByLabelText(/title/i)).toHaveValue('');
      expect(screen.getByLabelText(/concept/i)).toHaveValue('');
      expect(screen.queryByLabelText(/content/i)).not.toBeInTheDocument();
    });
  });

  describe('Authentication and Permissions', () => {
    it('should require authentication to create drills', async () => {
      // Mock unauthenticated user
      mockUseAuthState.mockReturnValue([null, false, undefined]);
      
      render(<CreateDrillPage />);
      
      // Should redirect to login or show auth required message
      await waitFor(() => {
        expect(screen.getByText(/login.*required|authentication.*required/i)).toBeInTheDocument();
      });
      
      // Verify no form is shown
      expect(screen.queryByRole('button', { name: /create.*drill/i })).not.toBeInTheDocument();
    });

    it('should include user ID in created drills', async () => {
      const user = userEvent.setup();
      
      mockAddDoc.mockResolvedValue({ id: 'user-drill-789' } as any);
      
      render(<CreateDrillPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create.*drill/i })).toBeInTheDocument();
      });
      
      // Fill minimal form
      await user.type(screen.getByLabelText(/title/i), 'User Drill');
      await user.type(screen.getByLabelText(/concept/i), 'Testing');
      await user.selectOptions(screen.getByLabelText(/difficulty/i), 'Beginner');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      
      const submitButton = screen.getByRole('button', { name: /create.*drill/i });
      await user.click(submitButton);
      
      // Verify user ID is included
      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            userId: mockUser.uid
          })
        );
      });
    });
  });
});