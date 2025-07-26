"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface FinalSolutionProps {
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

export function FinalSolution({ 
  content, 
  contentIndex, 
  onAnswerChange, 
  onValidationChange 
}: FinalSolutionProps) {
  const [blankValues, setBlankValues] = useState<Record<number, string>>({});
  const [blankStatuses, setBlankStatuses] = useState<Record<number, BlankStatus>>({});
  const [editingBlank, setEditingBlank] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  // Parse the code to identify blanks
  const parseCodeWithBlanks = useCallback(() => {
    const codeValue = content.value || '';
    const parts = codeValue.split('____');
    const blankCount = parts.length - 1;
    
    console.log('Code value:', codeValue);
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

  // Get display code for CodeMirror (replace blanks with placeholder text)
  const getDisplayCode = useCallback(() => {
    if (!hasValidBlanks) {
      return content.value;
    }
    
    let code = parts[0] || '';
    for (let i = 0; i < parts.length - 1; i++) {
      // Use user input if available, otherwise use a placeholder that's easy to find
      const userInput = blankValues[i] || `___BLANK_${i}___`;
      code += userInput + (parts[i + 1] || '');
    }
    return code;
  }, [parts, blankValues, hasValidBlanks, content.value]);

  // Real-time validation
  const validateBlank = useCallback((blankIndex: number, value: string) => {
    if (!content.solution || blankIndex >= content.solution.length) {
      return 'empty';
    }

    const correctAnswer = content.solution[blankIndex]?.toString().trim() || '';
    const userAnswer = value.trim();

    if (userAnswer === '') return 'empty';
    if (userAnswer === correctAnswer) return 'correct';

    // Check alternatives
    const alternatives = ['data', 'df', 'dataset'].includes(correctAnswer.toLowerCase()) 
      ? ['data', 'df', 'dataset'] 
      : [];
    
    if (alternatives.includes(userAnswer.toLowerCase())) return 'correct';

    // Partial match
    if (correctAnswer.length > 3 && userAnswer.length >= 2) {
      if (correctAnswer.toLowerCase().startsWith(userAnswer.toLowerCase())) {
        return 'partial';
      }
    }

    return 'incorrect';
  }, [content.solution]);

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

  // Handle blank click
  const handleBlankClick = (blankIndex: number) => {
    setEditingBlank(blankIndex);
    setTempValue(blankValues[blankIndex] || '');
  };

  // Handle input submission
  const handleSubmitValue = () => {
    if (editingBlank !== null) {
      setBlankValues(prev => ({ ...prev, [editingBlank]: tempValue }));
      
      if (tempValue.trim() === '') {
        setBlankStatuses(prev => ({ ...prev, [editingBlank]: 'empty' }));
      } else {
        setBlankStatuses(prev => ({ ...prev, [editingBlank]: 'partial' }));
        debouncedValidation(editingBlank, tempValue);
      }

      const newAnswers = { ...blankValues, [editingBlank]: tempValue };
      onAnswerChange(contentIndex, newAnswers);
      
      setEditingBlank(null);
      setTempValue('');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditingBlank(null);
    setTempValue('');
  };

  // Find blank positions in the rendered CodeMirror
  const findBlankPositions = useCallback(() => {
    if (!editorRef.current || !hasValidBlanks) return [];

    const positions: Array<{x: number, y: number, width: number, blankIndex: number}> = [];
    
    // This is a simplified approach - in reality, you'd need to calculate exact positions
    // For now, we'll use a simple grid layout
    blanks.forEach((blankIndex, index) => {
      positions.push({
        x: 50 + (index % 4) * 150, // Simple grid positioning
        y: 30 + Math.floor(index / 4) * 25,
        width: 100,
        blankIndex
      });
    });

    return positions;
  }, [blanks, hasValidBlanks]);

  // Get blank styling
  const getBlankStyling = (blankIndex: number) => {
    const status = blankStatuses[blankIndex] || 'empty';
    
    switch (status) {
      case 'correct':
        return {
          bgColor: 'bg-green-500/30',
          borderColor: 'border-green-400',
          textColor: 'text-green-300'
        };
      case 'incorrect':
        return {
          bgColor: 'bg-red-500/30',
          borderColor: 'border-red-400',
          textColor: 'text-red-300'
        };
      case 'partial':
        return {
          bgColor: 'bg-yellow-500/30',
          borderColor: 'border-yellow-400',
          textColor: 'text-yellow-300'
        };
      default:
        return {
          bgColor: 'bg-gray-700/80',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-300'
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

  return (
    <div className="space-y-3">
      <div className="bg-gray-800 px-3 py-2 text-sm text-gray-300 border-b border-gray-700 flex items-center justify-between rounded-t-lg">
        <span>💻 Interactive Code - Click blanks to edit</span>
        {hasValidBlanks && (
          <span className="text-xs">
            {blanks.filter(i => blankStatuses[i] === 'correct').length}/{blanks.length} correct
          </span>
        )}
      </div>
      
      {renderProgress()}
      
      {/* CodeMirror with perfect syntax highlighting */}
      <div className="relative" ref={editorRef}>
        <CodeMirror
          value={getDisplayCode()}
          height="auto"
          extensions={[python()]}
          theme={vscodeDark}
          editable={false}
          className="rounded-lg"
        />
        
        {/* Overlay clickable areas for blanks */}
        {hasValidBlanks && (
          <div className="absolute inset-0 pointer-events-none">
            {findBlankPositions().map(({ x, y, width, blankIndex }) => {
              const { bgColor, borderColor, textColor } = getBlankStyling(blankIndex);
              const status = blankStatuses[blankIndex] || 'empty';
              
              return (
                <div
                  key={blankIndex}
                  onClick={() => handleBlankClick(blankIndex)}
                  className={cn(
                    'absolute pointer-events-auto cursor-pointer px-2 py-1 rounded border-2 transition-all duration-200 hover:scale-105 text-xs font-mono flex items-center',
                    bgColor,
                    borderColor,
                    textColor
                  )}
                  style={{
                    left: x,
                    top: y,
                    width: width,
                    minHeight: '24px'
                  }}
                  title={`Click to edit blank ${blankIndex + 1}`}
                >
                  {blankValues[blankIndex] || `Blank ${blankIndex + 1}`}
                  {status === 'correct' && <CheckCircle className="w-3 h-3 ml-1" />}
                  {status === 'incorrect' && <XCircle className="w-3 h-3 ml-1" />}
                  {status === 'partial' && <AlertCircle className="w-3 h-3 ml-1" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Simple fallback: show blanks below if positioning fails */}
      {hasValidBlanks && (
        <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-700">
          <div className="text-sm text-gray-400 mb-2">Quick access to blanks:</div>
          <div className="flex flex-wrap gap-2">
            {blanks.map((blankIndex) => {
              const { bgColor, borderColor, textColor } = getBlankStyling(blankIndex);
              const status = blankStatuses[blankIndex] || 'empty';
              
              return (
                <button
                  key={blankIndex}
                  onClick={() => handleBlankClick(blankIndex)}
                  className={cn(
                    'px-3 py-1 rounded border-2 transition-all duration-200 hover:scale-105 text-sm font-mono flex items-center',
                    bgColor,
                    borderColor,
                    textColor
                  )}
                >
                  Blank {blankIndex + 1}: {blankValues[blankIndex] || '____'}
                  {status === 'correct' && <CheckCircle className="w-3 h-3 ml-1" />}
                  {status === 'incorrect' && <XCircle className="w-3 h-3 ml-1" />}
                  {status === 'partial' && <AlertCircle className="w-3 h-3 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Modal for editing */}
      {editingBlank !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Edit Blank {editingBlank + 1}
            </h3>
            
            {content.solution?.[editingBlank] && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                <p className="text-sm text-blue-300">
                  💡 Expected: <span className="font-mono font-bold">{content.solution[editingBlank].toString()}</span>
                </p>
              </div>
            )}
            
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder="Enter your answer..."
              className="mb-4 font-mono"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitValue();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            
            <div className="flex space-x-2">
              <button
                onClick={handleSubmitValue}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors font-medium"
              >
                Submit (Enter)
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
              >
                Cancel (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}