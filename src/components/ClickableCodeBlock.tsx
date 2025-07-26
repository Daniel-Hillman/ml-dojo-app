"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertCircle, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface ClickableCodeBlockProps {
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

export function ClickableCodeBlock({ 
  content, 
  contentIndex, 
  onAnswerChange, 
  onValidationChange 
}: ClickableCodeBlockProps) {
  const [blankValues, setBlankValues] = useState<Record<number, string>>({});
  const [blankStatuses, setBlankStatuses] = useState<Record<number, BlankStatus>>({});
  const [editingBlank, setEditingBlank] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState('');

  // Debug logging
  useEffect(() => {
    console.log('ClickableCodeBlock content:', content);
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
    const isEditing = editingBlank === blankIndex;
    
    let bgColor = 'bg-gray-700/50';
    let borderColor = 'border-gray-600';
    let textColor = 'text-gray-300';
    
    switch (status) {
      case 'correct':
        bgColor = 'bg-green-500/20';
        borderColor = 'border-green-500';
        textColor = 'text-green-300';
        break;
      case 'incorrect':
        bgColor = 'bg-red-500/20';
        borderColor = 'border-red-500';
        textColor = 'text-red-300';
        break;
      case 'partial':
        bgColor = 'bg-yellow-500/20';
        borderColor = 'border-yellow-500';
        textColor = 'text-yellow-300';
        break;
    }

    if (isEditing) {
      bgColor = 'bg-blue-500/20';
      borderColor = 'border-blue-500';
    }

    return { bgColor, borderColor, textColor };
  };

  // Render clickable blank
  const renderBlank = (blankIndex: number) => {
    const { bgColor, borderColor, textColor } = getBlankStyling(blankIndex);
    const value = blankValues[blankIndex] || '____';
    const status = blankStatuses[blankIndex] || 'empty';

    return (
      <span
        key={blankIndex}
        onClick={() => handleBlankClick(blankIndex)}
        className={cn(
          'inline-flex items-center px-2 py-1 mx-1 rounded border-2 cursor-pointer transition-all duration-200 hover:scale-105',
          bgColor,
          borderColor,
          textColor,
          'min-w-[60px] justify-center font-mono text-sm'
        )}
        title={`Click to edit blank ${blankIndex + 1}`}
      >
        {value}
        <Edit3 className="w-3 h-3 ml-1 opacity-50" />
        {status === 'correct' && <CheckCircle className="w-3 h-3 ml-1" />}
        {status === 'incorrect' && <XCircle className="w-3 h-3 ml-1" />}
        {status === 'partial' && <AlertCircle className="w-3 h-3 ml-1" />}
      </span>
    );
  };

  // Clean syntax highlighting that prevents nested spans
  const applySyntaxHighlighting = (code: string) => {
    // First, escape HTML entities
    let highlighted = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Apply highlighting in a specific order to prevent conflicts
    const patterns = [
      // Comments first (highest priority)
      { regex: /(#[^\r\n]*)/g, replacement: '<span class="text-green-500">$1</span>' },
      // Strings
      { regex: /("(?:[^"\\]|\\.)*)"/g, replacement: '<span class="text-yellow-300">$1</span>' },
      { regex: /('(?:[^'\\]|\\.)*')/g, replacement: '<span class="text-yellow-300">$1</span>' },
      // Numbers
      { regex: /\b(\d+(?:\.\d+)?)\b/g, replacement: '<span class="text-orange-400">$1</span>' },
      // Keywords
      { regex: /\b(def|class|if|elif|else|for|while|try|except|finally|with|import|from|as|return|yield|break|continue|pass|lambda|and|or|not|in|is|True|False|None)\b/g, replacement: '<span class="text-purple-400">$1</span>' },
      // Built-in functions
      { regex: /\b(print|len|range|str|int|float|list|dict|set|tuple|type|isinstance|hasattr|getattr|setattr)\b/g, replacement: '<span class="text-blue-400">$1</span>' },
      // Operators (last to avoid conflicts)
      { regex: /([+\-*/%=<>!&|^~])/g, replacement: '<span class="text-red-400">$1</span>' }
    ];

    // Apply each pattern only to text that hasn't been highlighted yet
    patterns.forEach(({ regex, replacement }) => {
      const parts = highlighted.split(/(<span[^>]*>.*?<\/span>)/);
      highlighted = parts.map(part => {
        // Only apply highlighting to parts that aren't already wrapped in spans
        if (part.startsWith('<span')) {
          return part;
        }
        return part.replace(regex, replacement);
      }).join('');
    });

    return highlighted;
  };

  // Get the display code for CodeMirror
  const getDisplayCode = useCallback(() => {
    if (!hasValidBlanks) {
      return content.value;
    }
    
    let code = parts[0] || '';
    for (let i = 0; i < parts.length - 1; i++) {
      const userInput = blankValues[i] || '____';
      code += userInput + (parts[i + 1] || '');
    }
    return code;
  }, [parts, blankValues, hasValidBlanks, content.value]);

  // Render the interactive code with CodeMirror + overlay
  const renderInteractiveCode = () => {
    const displayCode = getDisplayCode();
    
    if (!hasValidBlanks) {
      return (
        <CodeMirror
          value={displayCode}
          height="auto"
          extensions={[python()]}
          theme={vscodeDark}
          editable={false}
          className="rounded-lg"
        />
      );
    }

    return (
      <div className="relative">
        {/* CodeMirror for perfect syntax highlighting */}
        <CodeMirror
          value={displayCode}
          height="auto"
          extensions={[python()]}
          theme={vscodeDark}
          editable={false}
          className="rounded-lg"
        />
        
        {/* Overlay with clickable blanks */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="font-mono text-sm leading-relaxed p-4">
            {parts.map((part, index) => (
              <React.Fragment key={index}>
                {/* Invisible spacer for positioning */}
                <span className="invisible whitespace-pre">{part}</span>
                {index < parts.length - 1 && (
                  <span className="pointer-events-auto relative">
                    {renderBlank(index)}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
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
        <span>💻 Interactive Code - Click blanks to edit</span>
        {hasValidBlanks && (
          <span className="text-xs">
            {blanks.filter(i => blankStatuses[i] === 'correct').length}/{blanks.length} correct
          </span>
        )}
      </div>
      
      {renderProgress()}
      {renderInteractiveCode()}
      
      {/* Inline editing modal */}
      {editingBlank !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Edit Blank {editingBlank + 1}
            </h3>
            
            {content.solution?.[editingBlank] && (
              <p className="text-sm text-gray-400 mb-3">
                Expected: {content.solution[editingBlank].toString()}
              </p>
            )}
            
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder="Enter your answer..."
              className="mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitValue();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            
            <div className="flex space-x-2">
              <button
                onClick={handleSubmitValue}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                Submit
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}