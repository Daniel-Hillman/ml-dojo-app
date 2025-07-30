/**
 * Accessibility tests for DrillCard component
 * Tests keyboard navigation, ARIA compliance, and screen reader support
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DrillCard, BasicDrillCard } from '@/components/DrillCard';
import { EnhancedDrill, Drill } from '@/lib/drills';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('DrillCard Accessibility', () => {
  const mockEnhancedDrill: EnhancedDrill = {
    id: 'test-drill-1',
    title: 'Test JavaScript Drill',
    concept: 'Variables and Functions',
    difficulty: 'Beginner' as const,
    description: 'Learn about JavaScript variables and functions',
    source: 'personal' as const,
    drill_content: [
      { id: '1', type: 'theory', value: 'Theory content' },
      { id: '2', type: 'mcq', value: 'MCQ content', choices: [], answer: 0 },
      { id: '3', type: 'code', value: 'Code content', language: 'python' }
    ]
  };

  const mockCommunityDrill: EnhancedDrill = {
    ...mockEnhancedDrill,
    id: 'test-drill-2',
    source: 'community' as const,
    originalAuthor: 'John Doe',
    originalAuthorAvatar: 'https://example.com/avatar.jpg',
    communityMetrics: {
      likes: 25,
      views: 150,
      saves: 10
    }
  };

  const mockBasicDrill: Drill = {
    id: 'test-drill-3',
    title: 'Basic Test Drill',
    concept: 'Basic Concepts',
    difficulty: 'Intermediate' as const,
    description: 'A basic test drill',
    drill_content: [
      { id: '1', type: 'theory', value: 'Theory content' }
    ]
  };

  describe('Enhanced DrillCard Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<DrillCard drill={mockEnhancedDrill} />);
      
      // Should be an article with proper ARIA attributes
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-labelledby', 'drill-title-test-drill-1');
      expect(card).toHaveAttribute('aria-describedby', 'drill-description-test-drill-1');
      expect(card).toHaveAttribute('tabindex', '0');
    });

    it('should have proper heading structure', () => {
      render(<DrillCard drill={mockEnhancedDrill} />);
      
      const title = screen.getByRole('heading', { name: 'Test JavaScript Drill' });
      expect(title).toHaveAttribute('id', 'drill-title-test-drill-1');
    });

    it('should have accessible badges and metadata', () => {
      render(<DrillCard drill={mockEnhancedDrill} />);
      
      // Source badge should have proper ARIA label
      const sourceBadge = screen.getByLabelText('Drill source: Created by you');
      expect(sourceBadge).toBeInTheDocument();
      
      // Difficulty badge should have proper ARIA label
      const difficultyBadge = screen.getByLabelText('Difficulty level: Beginner');
      expect(difficultyBadge).toBeInTheDocument();
    });

    it('should have accessible content statistics', () => {
      render(<DrillCard drill={mockEnhancedDrill} />);
      
      // Content stats should have proper ARIA labels
      expect(screen.getByLabelText('1 theory sections')).toBeInTheDocument();
      expect(screen.getByLabelText('1 multiple choice questions')).toBeInTheDocument();
      expect(screen.getByLabelText('1 code exercises')).toBeInTheDocument();
      
      // Icons should be hidden from screen readers
      const icons = screen.getAllByRole('img', { hidden: true });
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should have accessible start drill button', () => {
      render(<DrillCard drill={mockEnhancedDrill} />);
      
      const startButton = screen.getByRole('button', { 
        name: 'Start practicing "Test JavaScript Drill" - Beginner level Variables and Functions drill' 
      });
      expect(startButton).toHaveAttribute('data-drill-start');
      expect(startButton).toHaveAttribute('aria-describedby');
    });

    it('should support keyboard navigation', () => {
      const mockOnRemove = jest.fn();
      render(<DrillCard drill={mockCommunityDrill} onRemoveSaved={mockOnRemove} />);
      
      const card = screen.getByRole('article');
      
      // Test Enter key activation
      fireEvent.keyDown(card, { key: 'Enter' });
      // Should trigger start drill action
      
      // Test Space key activation
      fireEvent.keyDown(card, { key: ' ' });
      // Should trigger start drill action
    });

    it('should handle remove button keyboard navigation', () => {
      const mockOnRemove = jest.fn();
      render(<DrillCard drill={mockCommunityDrill} onRemoveSaved={mockOnRemove} />);
      
      const removeButton = screen.getByRole('button', { 
        name: 'Remove "Test JavaScript Drill" from saved drills' 
      });
      
      // Test Enter key on remove button
      fireEvent.keyDown(removeButton, { key: 'Enter' });
      expect(mockOnRemove).toHaveBeenCalledWith('test-drill-2');
      
      // Test Space key on remove button
      mockOnRemove.mockClear();
      fireEvent.keyDown(removeButton, { key: ' ' });
      expect(mockOnRemove).toHaveBeenCalledWith('test-drill-2');
    });
  });

  describe('Community Drill Accessibility', () => {
    it('should have accessible author information', () => {
      render(<DrillCard drill={mockCommunityDrill} />);
      
      // Author section should have proper grouping
      const authorGroup = screen.getByLabelText('Original author and community metrics');
      expect(authorGroup).toHaveAttribute('role', 'group');
      
      // Avatar should have proper alt text
      const avatar = screen.getByAltText("John Doe's avatar");
      expect(avatar).toBeInTheDocument();
    });

    it('should have accessible community metrics', () => {
      render(<DrillCard drill={mockCommunityDrill} />);
      
      // Metrics should have proper ARIA labels
      expect(screen.getByLabelText('25 likes')).toBeInTheDocument();
      expect(screen.getByLabelText('150 views')).toBeInTheDocument();
      expect(screen.getByLabelText('10 saves')).toBeInTheDocument();
      
      // Metrics group should be properly labeled
      const metricsGroup = screen.getByLabelText('Community engagement metrics');
      expect(metricsGroup).toHaveAttribute('role', 'group');
    });

    it('should have accessible remove button', () => {
      const mockOnRemove = jest.fn();
      render(<DrillCard drill={mockCommunityDrill} onRemoveSaved={mockOnRemove} />);
      
      const removeButton = screen.getByLabelText(
        'Remove "Test JavaScript Drill" from saved drills'
      );
      expect(removeButton).toBeInTheDocument();
      expect(removeButton).toHaveAttribute('aria-describedby');
      
      // Button should be properly associated with author info
      const authorId = 'drill-author-test-drill-2';
      expect(removeButton).toHaveAttribute('aria-describedby', expect.stringContaining(authorId));
    });
  });

  describe('Review State Accessibility', () => {
    it('should announce review status', () => {
      render(<DrillCard drill={mockEnhancedDrill} isReview />);
      
      const reviewIndicator = screen.getByRole('status', { 
        name: 'This drill is due for review' 
      });
      expect(reviewIndicator).toBeInTheDocument();
      expect(reviewIndicator.textContent).toBe('Review Due');
    });
  });

  describe('BasicDrillCard Accessibility', () => {
    it('should maintain basic accessibility features', () => {
      render(<BasicDrillCard drill={mockBasicDrill} />);
      
      // Should have proper heading
      const title = screen.getByRole('heading', { name: 'Basic Test Drill' });
      expect(title).toBeInTheDocument();
      
      // Should have start button
      const startButton = screen.getByRole('button', { name: /Start Drill/i });
      expect(startButton).toBeInTheDocument();
    });

    it('should support review state', () => {
      render(<BasicDrillCard drill={mockBasicDrill} isReview />);
      
      const reviewIndicator = screen.getByText('Review Due');
      expect(reviewIndicator).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should manage focus properly on card interaction', () => {
      render(<DrillCard drill={mockEnhancedDrill} />);
      
      const card = screen.getByRole('article');
      card.focus();
      expect(document.activeElement).toBe(card);
    });

    it('should prevent event bubbling on remove button', () => {
      const mockOnRemove = jest.fn();
      render(<DrillCard drill={mockCommunityDrill} onRemoveSaved={mockOnRemove} />);
      
      const removeButton = screen.getByRole('button', { name: /Remove/i });
      
      // Mock stopPropagation
      const mockStopPropagation = jest.fn();
      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
        stopPropagation: mockStopPropagation
      };
      
      fireEvent.keyDown(removeButton, mockEvent);
      expect(mockStopPropagation).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should handle missing drill content gracefully', () => {
      const drillWithoutContent = { ...mockEnhancedDrill, drill_content: undefined };
      render(<DrillCard drill={drillWithoutContent} />);
      
      // Should show 0 for all content types
      expect(screen.getByLabelText('0 theory sections')).toBeInTheDocument();
      expect(screen.getByLabelText('0 multiple choice questions')).toBeInTheDocument();
      expect(screen.getByLabelText('0 code exercises')).toBeInTheDocument();
    });

    it('should handle missing community metrics gracefully', () => {
      const drillWithoutMetrics = { 
        ...mockCommunityDrill, 
        communityMetrics: undefined 
      };
      render(<DrillCard drill={drillWithoutMetrics} />);
      
      // Should still show author info without metrics
      expect(screen.getByText('by John Doe')).toBeInTheDocument();
      expect(screen.queryByLabelText(/likes/)).not.toBeInTheDocument();
    });
  });
});