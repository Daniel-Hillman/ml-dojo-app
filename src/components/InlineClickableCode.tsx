"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';

interface InlineClickableCodeProps {
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

export function InlineClickableCode({ 
  content, 
  contentIndex, 
  onAnswerChange, 
  onValidationChange 
}: InlineClickableCodeProps) {
  const [blankValues, setBlankValues] = useState<Record<number, string>>({});
  const [blankStatuses, setBlankStatuses] = useState<Record<number, BlankStatus>>({});
  const [editingBlank, setEditingBlank] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState('');

  // Parse the code to identify blanks
  const parseCodeWithBlanks = useCallback(() => {
    const codeValue = content.value || '';
    const parts = codeValue.split('____');
    const blankCount = parts.length - 1;
    
    console.log('Code parts:', parts);
    console.log('Blank count:', blankCount);
    
    return {
      parts,
      blankCount,
      blanks: Array.from({ length: blankCount }, (_, i) => i),
      hasValidBlanks: blankCount > 0
    };
  }, [content.value]);

  const { parts, blankCount, blanks, hasValidBlanks } = parseCodeWithBlanks();

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

  // Apply clean syntax highlighting
  const applySyntaxHighlighting = (text: string) => {
    // Simple, safe highlighting that won't create nested spans
    let highlighted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Apply highlighting patterns one by one, safely
    const patterns = [
      // Comments
      { pattern: /(#[^\r\n]*)/g, className: 'text-green-500' },
      // Strings
      { pattern: /("(?:[^"\\]|\\.)*")/g, className: 'text-yellow-300' },
      { pattern: /('(?:[^'\\]|\\.)*')/g, className: 'text-yellow-300' },
      // Numbers
      { pattern: /\b(\d+(?:\.\d+)?)\b/g, className: 'text-orange-400' },
      // Keywords
      { pattern: /\b(def|class|if|elif|else|for|while|try|except|finally|with|import|from|as|return|yield|break|continue|pass|lambda|and|or|not|in|is|True|False|None)\b/g, className: 'text-purple-400' },
      // Built-ins
      { pattern: /\b(print|len|range|str|int|float|list|dict|set|tuple|type|isinstance|hasattr|getattr|setattr)\b/g, className: 'text-blue-400' },
      // Operators
      { pattern: /([+\-*/%=<>!&|^~])/g, className: 'text-red-400' }
    ];

    patterns.forEach(({ pattern, className }) => {
      highlighted = highlighted.replace(pattern, `<span class="${className}">$1</span>`);
    });

    return highlighted;
  };

  // Render clickable blank
  const renderClickableBlank = (blankIndex: number) => {
    const status = blankStatuses[blankIndex] || 'empty';
    const value = blankValues[blankIndex] || '____';
    
    let bgColor = 'bg-gray-700/80';
    let borderColor = 'border-gray-500';
    let textColor = 'text-gray-300';
    
    switch (status) {
      case 'correct':
        bgColor = 'bg-green-500/30';
        borderColor = 'border-green-400';
        textColor = 'text-green-300';
        break;
      case 'incorrect':
        bgColor = 'bg-red-500/30';
        borderColor = 'border-red-400';
        textColor = 'text-red-300';
        break;
      case 'partial':
        bgColor = 'bg-yellow-500/30';
        borderColor = 'border-yellow-400';
        textColor = 'text-yellow-300';
        break;
    }

    return (
      <span
        onClick={() => handleBlankClick(blankIndex)}
        className={cn(
          'inline-flex items-center px-2 py-1 mx-1 rounded border-2 cursor-pointer transition-all duration-200 hover:scale-105 font-mono text-sm',
          bgColor,
          borderColor,
          textColor,
          'min-w-[50px] justify-center'
        )}
        title={`Click to edit (Expected: ${content.solution?.[blankIndex] || 'unknown'})`}
      >
        {value}
        {status === 'correct' && <CheckCircle className="w-3 h-3 ml-1" />}
        {status === 'incorrect' && <XCircle className="w-3 h-3 ml-1" />}
        {status === 'partial' && <AlertCircle className="w-3 h-3 ml-1" />}
      </span>
    );
  };

  // Render the code with inline clickable blanks
  const renderCodeWithBlanks = () => {
    if (!hasValidBlanks) {
      return (
        <div className="font-mono text-sm leading-relaxed bg-gray-900 p-4 rounded-lg whitespace-pre-wrap">
          <span dangerouslySetInnerHTML={{ __html: applySyntaxHighlighting(content.value) }} />
        </div>
      );
    }

    return (
      <div className="font-mono text-sm leading-relaxed bg-gray-900 p-4 rounded-lg">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span 
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: applySyntaxHighlighting(part) }} 
            />
            {index < parts.length - 1 && renderClickableBlank(index)}
          </React.Fragment>
        ))}
      </div>
    );
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
        <span>💻 Interactive Code - Click the highlighted blanks in the code</span>
        {hasValidBlanks && (
          <span className="text-xs">
            {blanks.filter(i => blankStatuses[i] === 'correct').length}/{blanks.length} correct
          </span>
        )}
      </div>
      
      {renderProgress()}
      {renderCodeWithBlanks()}
      
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