"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';
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

export function InteractiveCodeBlockV2({ 
  content, 
  contentIndex, 
  onAnswerChange, 
  onValidationChange 
}: InteractiveCodeBlockProps) {
  const [blankValues, setBlankValues] = useState<Record<number, string>>({});
  const [blankStatuses, setBlankStatuses] = useState<Record<number, BlankStatus>>({});
  const [focusedBlank, setFocusedBlank] = useState<number | null>(null);
  const [blankPositions, setBlankPositions] = useState<Array<{x: number, y: number, width: number}>>([]);
  const editorRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Parse the code to identify blanks
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

  // Get the code for CodeMirror display
  const getDisplayCode = useCallback(() => {
    let code = parts[0];
    for (let i = 0; i < parts.length - 1; i++) {
      const userInput = blankValues[i] || '____';
      code += userInput + (parts[i + 1] || '');
    }
    return code;
  }, [parts, blankValues]);

  // Calculate positions of blanks in the rendered CodeMirror
  const calculateBlankPositions = useCallback(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const codeLines = editor.querySelectorAll('.cm-line');
    const positions: Array<{x: number, y: number, width: number}> = [];
    
    let blankIndex = 0;
    let searchText = getDisplayCode();
    
    // Find each blank position by searching for the current values or ____
    for (let i = 0; i < blankCount; i++) {
      const currentValue = blankValues[i] || '____';
      const beforeText = parts.slice(0, i + 1).join('____').split('____')[i];
      
      // This is a simplified approach - in a real implementation, 
      // you'd need more sophisticated position calculation
      positions.push({
        x: 100 + (i * 150), // Simplified positioning
        y: 20 + (Math.floor(i / 3) * 25), // Simplified positioning
        width: Math.max(80, currentValue.length * 8 + 20)
      });
    }
    
    setBlankPositions(positions);
  }, [blankValues, parts, blankCount, getDisplayCode]);

  // Real-time validation function
  const validateBlank = useCallback((blankIndex: number, value: string) => {
    if (!content.solution || blankIndex >= content.solution.length) {
      return 'empty';
    }

    const correctAnswer = content.solution[blankIndex].trim();
    const userAnswer = value.trim();

    if (userAnswer === '') {
      return 'empty';
    }

    if (userAnswer === correctAnswer) {
      return 'correct';
    }

    // Check alternatives
    const alternatives = getAlternativeAnswers(correctAnswer);
    if (alternatives.includes(userAnswer.toLowerCase())) {
      return 'correct';
    }

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

    const baseClasses = "absolute font-mono text-sm transition-all duration-200 px-2 py-1 border-2 rounded";
    
    switch (status) {
      case 'correct':
        return {
          className: cn(baseClasses, "bg-green-500/20 border-green-500 text-green-300"),
          icon: <CheckCircle className="w-4 h-4 text-green-500" />
        };
      case 'incorrect':
        return {
          className: cn(baseClasses, "bg-red-500/20 border-red-500 text-red-300 animate-pulse"),
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

  // Update positions when content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateBlankPositions();
    }, 100);
    return () => clearTimeout(timer);
  }, [calculateBlankPositions]);

  // Progress indicator
  const renderProgress = () => {
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
      
      <div className="relative">
        {/* CodeMirror for syntax highlighting */}
        <div ref={editorRef}>
          <CodeMirror
            value={getDisplayCode()}
            height="auto"
            extensions={[python()]}
            theme={vscodeDark}
            editable={false}
            className="rounded-lg"
          />
        </div>
        
        {/* Overlay with interactive inputs - simplified approach */}
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-400 mb-2">Fill in the blanks:</div>
          {blanks.map((blankIndex) => (
            <div key={blankIndex} className="flex items-center space-x-2">
              <span className="text-sm text-gray-400 w-16">
                Blank {blankIndex + 1}:
              </span>
              <div className="relative flex items-center">
                <Input
                  value={blankValues[blankIndex] || ''}
                  onChange={(e) => handleBlankChange(blankIndex, e.target.value)}
                  onFocus={() => setFocusedBlank(blankIndex)}
                  onBlur={() => setFocusedBlank(null)}
                  className={getBlankStyling(blankIndex).className.replace('absolute', 'relative')}
                  placeholder="Enter your answer..."
                  autoComplete="off"
                />
                {getBlankStyling(blankIndex).icon && (
                  <div className="ml-2">
                    {getBlankStyling(blankIndex).icon}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {renderHints()}
    </div>
  );
}