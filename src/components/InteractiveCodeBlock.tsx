"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';

interface InteractiveCodeBlockProps {
  content: {
    value: string;
    solution: string[];
    language?: string;
  };
  contentIndex: number;
  onAnswerChange: (contentIndex: number, answers: Record<string, string>) => void;
  onValidationChange: (contentIndex: number, isValid: boolean) => void;
}

type BlankStatus = 'empty' | 'correct' | 'incorrect' | 'partial';

export function InteractiveCodeBlock({ 
  content, 
  contentIndex, 
  onAnswerChange, 
  onValidationChange 
}: InteractiveCodeBlockProps) {
  const [blankValues, setBlankValues] = useState<Record<number, string>>({});
  const [blankStatuses, setBlankStatuses] = useState<Record<number, BlankStatus>>({});
  const [focusedBlank, setFocusedBlank] = useState<number | null>(null);

  // Parse the code to identify blanks and their positions
  const parseCodeWithBlanks = useCallback(() => {
    const parts = content.value.split('____');
    const blankCount = parts.length - 1;
    
    return {
      parts,
      blankCount,
      blanks: Array.from({ length: blankCount }, (_, i) => i)
    };
  }, [content.value]);

  const { parts, blankCount, blanks } = parseCodeWithBlanks();

  // Real-time validation function (like Mimo/Khan Academy)
  const validateBlank = useCallback((blankIndex: number, value: string) => {
    if (!content.solution || blankIndex >= content.solution.length) {
      return 'empty';
    }

    const correctAnswer = content.solution[blankIndex].trim();
    const userAnswer = value.trim();

    if (userAnswer === '') {
      return 'empty';
    }

    // Exact match (like W3Schools)
    if (userAnswer === correctAnswer) {
      return 'correct';
    }

    // Partial match for longer answers (like Khan Academy)
    if (correctAnswer.length > 3 && userAnswer.length >= 2) {
      if (correctAnswer.toLowerCase().startsWith(userAnswer.toLowerCase())) {
        return 'partial';
      }
    }

    return 'incorrect';
  }, [content.solution]);

  // Debounced validation to avoid excessive checks
  const debouncedValidation = useCallback(
    debounce((blankIndex: number, value: string) => {
      const status = validateBlank(blankIndex, value);
      setBlankStatuses(prev => ({ ...prev, [blankIndex]: status }));
      
      // Check if all blanks are correctly filled
      const allStatuses = { ...blankStatuses, [blankIndex]: status };
      const allCorrect = blanks.every(i => allStatuses[i] === 'correct');
      onValidationChange(contentIndex, allCorrect);
    }, 300),
    [validateBlank, blankStatuses, blanks, contentIndex, onValidationChange]
  );

  // Handle input changes with immediate visual feedback
  const handleBlankChange = (blankIndex: number, value: string) => {
    setBlankValues(prev => ({ ...prev, [blankIndex]: value }));
    
    // Immediate feedback for empty/non-empty states
    if (value.trim() === '') {
      setBlankStatuses(prev => ({ ...prev, [blankIndex]: 'empty' }));
    } else {
      // Show partial status immediately, then validate
      setBlankStatuses(prev => ({ ...prev, [blankIndex]: 'partial' }));
      debouncedValidation(blankIndex, value);
    }

    // Update parent component
    const newAnswers = { ...blankValues, [blankIndex]: value };
    onAnswerChange(contentIndex, newAnswers);
  };

  // Get status icon and styling
  const getBlankStyling = (blankIndex: number) => {
    const status = blankStatuses[blankIndex] || 'empty';
    const isFocused = focusedBlank === blankIndex;

    const baseClasses = "inline-flex items-center min-w-[120px] h-8 px-2 mx-1 text-sm font-mono transition-all duration-200";
    
    switch (status) {
      case 'correct':
        return {
          className: cn(baseClasses, "bg-green-500/20 border-2 border-green-500 text-green-300"),
          icon: <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
        };
      case 'incorrect':
        return {
          className: cn(baseClasses, "bg-red-500/20 border-2 border-red-500 text-red-300 animate-pulse"),
          icon: <XCircle className="w-4 h-4 text-red-500 ml-1" />
        };
      case 'partial':
        return {
          className: cn(baseClasses, "bg-yellow-500/20 border-2 border-yellow-500 text-yellow-300"),
          icon: <AlertCircle className="w-4 h-4 text-yellow-500 ml-1" />
        };
      default:
        return {
          className: cn(
            baseClasses, 
            "bg-gray-700/50 border-2 border-gray-600 text-gray-300",
            isFocused && "border-blue-500 bg-blue-500/10"
          ),
          icon: null
        };
    }
  };

  // Render the code with interactive blanks
  const renderInteractiveCode = () => {
    return (
      <div className="font-mono text-sm leading-relaxed bg-gray-900 p-4 rounded-lg overflow-x-auto">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span className="text-gray-300 whitespace-pre">{part}</span>
            {index < parts.length - 1 && (
              <span className="relative inline-block">
                <Input
                  value={blankValues[index] || ''}
                  onChange={(e) => handleBlankChange(index, e.target.value)}
                  onFocus={() => setFocusedBlank(index)}
                  onBlur={() => setFocusedBlank(null)}
                  className={getBlankStyling(index).className}
                  placeholder="____"
                  autoComplete="off"
                />
                {getBlankStyling(index).icon}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Progress indicator (like Mimo)
  const renderProgress = () => {
    const correctCount = blanks.filter(i => blankStatuses[i] === 'correct').length;
    const totalCount = blanks.length;
    const progressPercentage = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

    return (
      <div className="mt-3 mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-400">
            Progress: {correctCount}/{totalCount} blanks completed
          </span>
          <span className="text-sm text-gray-400">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  };

  // Hints system (like Khan Academy)
  const renderHints = () => {
    if (focusedBlank === null) return null;

    const status = blankStatuses[focusedBlank];
    const correctAnswer = content.solution?.[focusedBlank];

    if (status === 'correct') {
      return (
        <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-green-300 text-sm">
          ✅ Perfect! This blank is correct.
        </div>
      );
    }

    if (status === 'incorrect' && correctAnswer) {
      return (
        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm">
          ❌ Not quite right. Try again! 
          {correctAnswer.length <= 10 && (
            <span className="ml-2 text-gray-400">
              (Hint: {correctAnswer.length} characters)
            </span>
          )}
        </div>
      );
    }

    if (status === 'partial' && correctAnswer) {
      return (
        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-300 text-sm">
          🔄 You're on the right track! Keep typing...
        </div>
      );
    }

    return (
      <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-blue-300 text-sm">
        💡 Fill in this blank to continue
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="bg-gray-800 px-3 py-2 text-sm text-gray-300 border-b border-gray-700 flex items-center justify-between rounded-t-lg">
        <span>💻 Interactive Code - Fill in the blanks</span>
        <span className="text-xs">
          {blanks.filter(i => blankStatuses[i] === 'correct').length}/{blanks.length} correct
        </span>
      </div>
      
      {renderProgress()}
      {renderInteractiveCode()}
      {renderHints()}
    </div>
  );
}