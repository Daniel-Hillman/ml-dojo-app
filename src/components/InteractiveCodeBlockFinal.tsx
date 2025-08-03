"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { debounce } from '@/lib/debounce';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

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

export function InteractiveCodeBlockFinal({ 
  content, 
  contentIndex, 
  onAnswerChange, 
  onValidationChange 
}: InteractiveCodeBlockProps) {
  const [blankValues, setBlankValues] = useState<Record<number, string>>({});
  const [blankStatuses, setBlankStatuses] = useState<Record<number, BlankStatus>>({});
  const [focusedBlank, setFocusedBlank] = useState<number | null>(null);

  // Debug: Log the content to see what we're getting
  useEffect(() => {
    console.log('InteractiveCodeBlock received content:', content);
    console.log('Code value:', content.value);
    console.log('Solutions:', content.solution);
    console.log('Blank count:', (content.value.match(/____/g) || []).length);
  }, [content]);

  // Parse the code to identify blanks and their positions
  const parseCodeWithBlanks = useCallback(() => {
    const codeValue = content.value || '';
    const parts = codeValue.split('____');
    const blankCount = parts.length - 1;
    
    console.log('Parsing code:', codeValue);
    console.log('Parts:', parts);
    console.log('Blank count:', blankCount);
    
    return {
      parts,
      blankCount,
      blanks: Array.from({ length: blankCount }, (_, i) => i),
      hasValidBlanks: blankCount > 0
    };
  }, [content.value]);

  const { parts, blankCount, blanks, hasValidBlanks } = parseCodeWithBlanks();

  // Get the display code with user inputs
  const getDisplayCode = useCallback(() => {
    if (!hasValidBlanks) {
      return content.value; // Return original if no blanks
    }
    
    let code = parts[0] || '';
    for (let i = 0; i < parts.length - 1; i++) {
      const userInput = blankValues[i] || '____';
      code += userInput + (parts[i + 1] || '');
    }
    return code;
  }, [parts, blankValues, hasValidBlanks, content.value]);

  // Real-time validation function
  const validateBlank = useCallback((blankIndex: number, value: string) => {
    if (!content.solution || blankIndex >= content.solution.length) {
      return 'empty';
    }

    const correctAnswer = content.solution[blankIndex]?.toString().trim() || '';
    const userAnswer = value.trim();

    if (userAnswer === '') {
      return 'empty';
    }

    // Exact match
    if (userAnswer === correctAnswer) {
      return 'correct';
    }

    // Alternative answers
    const alternatives = getAlternativeAnswers(correctAnswer);
    if (alternatives.includes(userAnswer.toLowerCase())) {
      return 'correct';
    }

    // Partial match for longer answers
    if (correctAnswer.length > 3 && userAnswer.length >= 2) {
      if (correctAnswer.toLowerCase().startsWith(userAnswer.toLowerCase())) {
        return 'partial';
      }
    }

    return 'incorrect';
  }, [content.solution]);

  // Get alternative valid answers
  const getAlternativeAnswers = (correctAnswer: string) => {
    const correct = correctAnswer.toLowerCase();
    const alternatives: string[] = [];

    const variableAlternatives: Record<string, string[]> = {
      'data': ['df', 'dataset', 'data_frame'],
      'df': ['data', 'dataset', 'dataframe'],
      'dataset': ['data', 'df', 'ds'],
      'i': ['index', 'idx', 'counter'],
      'x': ['value', 'val', 'item'],
      'result': ['res', 'output', 'answer'],
    };

    if (correct.endsWith('.csv')) {
      alternatives.push('data.csv', 'dataset.csv', 'file.csv');
    }

    if (correct === 'true') alternatives.push('True');
    if (correct === 'false') alternatives.push('False');

    if (correct in variableAlternatives) {
      alternatives.push(...variableAlternatives[correct]);
    }

    return alternatives;
  };

  // Debounced validation
  const debouncedValidation = useCallback(
    debounce((blankIndex: number, value: string) => {
      const status = validateBlank(blankIndex, value);
      setBlankStatuses(prev => ({ ...prev, [blankIndex]: status }));
      
      const allStatuses = { ...blankStatuses, [blankIndex]: status };
      const allCorrect = blanks.every(i => allStatuses[i] === 'correct');
      onValidationChange(contentIndex, allCorrect);
    }, 300),
    [validateBlank, blankStatuses, blanks, contentIndex, onValidationChange]
  );

  // Handle input changes
  const handleBlankChange = (blankIndex: number, value: string) => {
    setBlankValues(prev => ({ ...prev, [blankIndex]: value }));
    
    if (value.trim() === '') {
      setBlankStatuses(prev => ({ ...prev, [blankIndex]: 'empty' }));
    } else {
      setBlankStatuses(prev => ({ ...prev, [blankIndex]: 'partial' }));
      debouncedValidation(blankIndex, value);
    }

    const newAnswers = { ...blankValues, [blankIndex]: value };
    onAnswerChange(contentIndex, newAnswers);
  };

  // Get input styling based on status
  const getBlankStyling = (blankIndex: number) => {
    const status = blankStatuses[blankIndex] || 'empty';
    const isFocused = focusedBlank === blankIndex;

    const baseClasses = "w-full font-mono text-sm transition-all duration-200 px-3 py-2 border-2 rounded";
    
    switch (status) {
      case 'correct':
        return {
          className: cn(baseClasses, "bg-green-500/20 border-green-500 text-green-300"),
          icon: <CheckCircle className="w-4 h-4 text-green-500" />
        };
      case 'incorrect':
        return {
          className: cn(baseClasses, "bg-red-500/20 border-red-500 text-red-300"),
          icon: <XCircle className="w-4 h-4 text-red-500" />
        };
      case 'partial':
        return {
          className: cn(baseClasses, "bg-yellow-500/20 border-yellow-500 text-yellow-300"),
          icon: <AlertCircle className="w-4 h-4 text-yellow-500" />
        };
      default:
        return {
          className: cn(
            baseClasses, 
            "bg-gray-700/50 border-gray-600 text-gray-300",
            isFocused && "border-blue-500 bg-blue-500/10"
          ),
          icon: null
        };
    }
  };

  // Progress indicator
  const renderProgress = () => {
    if (!hasValidBlanks) return null;
    
    const correctCount = blanks.filter(i => blankStatuses[i] === 'correct').length;
    const totalCount = blanks.length;
    const progressPercentage = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

    return (
      <div className="mb-3">
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

  // Hints system
  const renderHints = () => {
    if (focusedBlank === null || !hasValidBlanks) return null;

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
          {correctAnswer.toString().length <= 10 && (
            <span className="ml-2 text-gray-400">
              (Hint: {correctAnswer.toString().length} characters)
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

  // If no blanks, show read-only code
  if (!hasValidBlanks) {
    return (
      <div className="space-y-3">
        <div className="bg-gray-800 px-3 py-2 text-sm text-gray-300 border-b border-gray-700 flex items-center justify-between rounded-t-lg">
          <span>💻 Code Example</span>
          <span className="text-xs text-yellow-400">No blanks to fill</span>
        </div>
        
        <CodeMirror
          value={content.value}
          height="auto"
          extensions={[python()]}
          theme={vscodeDark}
          editable={false}
          className="rounded-lg"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-gray-800 px-3 py-2 text-sm text-gray-300 border-b border-gray-700 flex items-center justify-between rounded-t-lg">
        <span>💻 Interactive Code - Fill in the blanks</span>
        <span className="text-xs">
          {blanks.filter(i => blankStatuses[i] === 'correct').length}/{blanks.length} correct
        </span>
      </div>
      
      {renderProgress()}
      
      {/* Code Display */}
      <div className="mb-4">
        <CodeMirror
          value={getDisplayCode()}
          height="auto"
          extensions={[python()]}
          theme={vscodeDark}
          editable={false}
          className="rounded-lg"
        />
      </div>
      
      {/* Interactive Blanks */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-300 mb-2">
          Fill in the blanks:
        </div>
        {blanks.map((blankIndex) => (
          <div key={blankIndex} className="space-y-1">
            <label className="text-sm text-gray-400">
              Blank {blankIndex + 1}
              {content.solution?.[blankIndex] && (
                <span className="ml-2 text-xs text-gray-500">
                  (Expected: {content.solution[blankIndex].toString()})
                </span>
              )}
            </label>
            <div className="flex items-center space-x-2">
              <Input
                value={blankValues[blankIndex] || ''}
                onChange={(e) => handleBlankChange(blankIndex, e.target.value)}
                onFocus={() => setFocusedBlank(blankIndex)}
                onBlur={() => setFocusedBlank(null)}
                className={getBlankStyling(blankIndex).className}
                placeholder="Enter your answer..."
                autoComplete="off"
              />
              {getBlankStyling(blankIndex).icon && (
                <div className="flex-shrink-0">
                  {getBlankStyling(blankIndex).icon}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {renderHints()}
    </div>
  );
}