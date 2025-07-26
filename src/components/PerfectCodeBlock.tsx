"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertCircle, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface PerfectCodeBlockProps {
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

export function PerfectCodeBlock({ 
  content, 
  contentIndex, 
  onAnswerChange, 
  onValidationChange 
}: PerfectCodeBlockProps) {
  const [blankValues, setBlankValues] = useState<Record<number, string>>({});
  const [blankStatuses, setBlankStatuses] = useState<Record<number, BlankStatus>>({});
  const [editingBlank, setEditingBlank] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState('');

  // Debug logging
  useEffect(() => {
    console.log('PerfectCodeBlock content:', content);
    const blankCount = (content.value.match(/____/g) || []).length;
    console.log('Detected blanks:', blankCount);
  }, [content]);

  // Parse the code to identify blanks
  const parseCodeWithBlanks = useCallback(() => {
    const codeValue = content.value || '';
    const parts = codeValue.split('____');
    const blankCount = parts.length - 1;
    
    return {
      parts,
      blankCount,
      blanks: Array.from({ length: blankCount }, (_, i) => i),
      hasValidBlanks: blankCount > 0
    };
  }, [content.value]);

  const { parts, blankCount, blanks, hasValidBlanks } = parseCodeWithBlanks();

  // Get the display code for CodeMirror
  const getDisplayCode = useCallback(() => {
    if (!hasValidBlanks) {
      return content.value;
    }
    
    let code = parts[0] || '';
    for (let i = 0; i < parts.length - 1; i++) {
      const userInput = blankValues[i] || `[BLANK_${i + 1}]`;
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

  // Get blank styling
  const getBlankStyling = (blankIndex: number) => {
    const status = blankStatuses[blankIndex] || 'empty';
    
    switch (status) {
      case 'correct':
        return {
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500',
          textColor: 'text-green-300',
          icon: <CheckCircle className="w-4 h-4 text-green-500" />
        };
      case 'incorrect':
        return {
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500',
          textColor: 'text-red-300',
          icon: <XCircle className="w-4 h-4 text-red-500" />
        };
      case 'partial':
        return {
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-300',
          icon: <AlertCircle className="w-4 h-4 text-yellow-500" />
        };
      default:
        return {
          bgColor: 'bg-gray-700/50',
          borderColor: 'border-gray-600',
          textColor: 'text-gray-300',
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

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 px-3 py-2 text-sm text-gray-300 border-b border-gray-700 flex items-center justify-between rounded-t-lg">
        <span>💻 Interactive Code - Click blanks below to edit</span>
        {hasValidBlanks && (
          <span className="text-xs">
            {blanks.filter(i => blankStatuses[i] === 'correct').length}/{blanks.length} correct
          </span>
        )}
      </div>
      
      {renderProgress()}
      
      {/* Perfect CodeMirror Display */}
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
      
      {/* Interactive Blanks Section */}
      {hasValidBlanks && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-300 border-t border-gray-700 pt-3">
            Click to fill in the blanks:
          </div>
          
          <div className="grid gap-3">
            {blanks.map((blankIndex) => {
              const { bgColor, borderColor, textColor, icon } = getBlankStyling(blankIndex);
              const value = blankValues[blankIndex] || `[BLANK_${blankIndex + 1}]`;
              
              return (
                <div
                  key={blankIndex}
                  onClick={() => handleBlankClick(blankIndex)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02]',
                    bgColor,
                    borderColor,
                    textColor
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium">
                      Blank {blankIndex + 1}:
                    </span>
                    <span className="font-mono text-sm">
                      {value}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {icon}
                    <Edit3 className="w-4 h-4 opacity-50" />
                  </div>
                </div>
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
                  💡 Expected answer: <span className="font-mono">{content.solution[editingBlank].toString()}</span>
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