"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { debounce } from '@/lib/debounce';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';

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

// Custom widget for interactive blanks in CodeMirror
class BlankWidget extends WidgetType {
  constructor(
    public blankIndex: number,
    public value: string,
    public status: BlankStatus,
    public onValueChange: (index: number, value: string) => void,
    public onFocus: (index: number) => void,
    public onBlur: () => void
  ) {
    super();
  }

  eq(other: BlankWidget) {
    return other.blankIndex === this.blankIndex && 
           other.value === this.value && 
           other.status === this.status;
  }

  toDOM() {
    const container = document.createElement('span');
    container.className = 'inline-block relative';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = this.value;
    input.placeholder = '____';
    input.className = this.getInputClassName();
    input.style.cssText = `
      min-width: 80px;
      width: ${Math.max(80, this.value.length * 8 + 20)}px;
      height: 24px;
      padding: 2px 6px;
      font-family: inherit;
      font-size: inherit;
      border-radius: 4px;
      border: 2px solid;
      background: transparent;
      outline: none;
      margin: 0 2px;
    `;

    // Add status icon
    if (this.status !== 'empty') {
      const icon = document.createElement('span');
      icon.className = 'absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none';
      icon.innerHTML = this.getStatusIcon();
      container.appendChild(icon);
    }

    // Event listeners
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.onValueChange(this.blankIndex, target.value);
    });

    input.addEventListener('focus', () => {
      this.onFocus(this.blankIndex);
    });

    input.addEventListener('blur', () => {
      this.onBlur();
    });

    container.appendChild(input);
    return container;
  }

  private getInputClassName(): string {
    const baseClasses = 'font-mono text-sm transition-all duration-200';
    
    switch (this.status) {
      case 'correct':
        return `${baseClasses} border-green-500 bg-green-500/10 text-green-300`;
      case 'incorrect':
        return `${baseClasses} border-red-500 bg-red-500/10 text-red-300 animate-pulse`;
      case 'partial':
        return `${baseClasses} border-yellow-500 bg-yellow-500/10 text-yellow-300`;
      default:
        return `${baseClasses} border-gray-600 bg-gray-700/50 text-gray-300 focus:border-blue-500 focus:bg-blue-500/10`;
    }
  }

  private getStatusIcon(): string {
    switch (this.status) {
      case 'correct':
        return '<svg class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>';
      case 'incorrect':
        return '<svg class="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>';
      case 'partial':
        return '<svg class="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
      default:
        return '';
    }
  }
}

// State effect for updating blank decorations
const updateBlanksEffect = StateEffect.define<{
  blanks: Array<{index: number, pos: number, value: string, status: BlankStatus}>,
  onValueChange: (index: number, value: string) => void,
  onFocus: (index: number) => void,
  onBlur: () => void
}>();

// State field for managing blank decorations
const blankField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);
    
    for (let effect of tr.effects) {
      if (effect.is(updateBlanksEffect)) {
        const { blanks, onValueChange, onFocus, onBlur } = effect.value;
        const newDecorations = blanks.map(blank => 
          Decoration.widget({
            widget: new BlankWidget(blank.index, blank.value, blank.status, onValueChange, onFocus, onBlur),
            side: 1
          }).range(blank.pos)
        );
        decorations = Decoration.set(newDecorations);
      }
    }
    
    return decorations;
  },
  provide: f => EditorView.decorations.from(f)
});

// View plugin to handle blank interactions
const blankPlugin = ViewPlugin.fromClass(class {
  constructor(view: EditorView) {}
  
  update(update: ViewUpdate) {
    // Handle any updates if needed
  }
});

export function InteractiveCodeBlock({ 
  content, 
  contentIndex, 
  onAnswerChange, 
  onValidationChange 
}: InteractiveCodeBlockProps) {
  const [blankValues, setBlankValues] = useState<Record<number, string>>({});
  const [blankStatuses, setBlankStatuses] = useState<Record<number, BlankStatus>>({});
  const [focusedBlank, setFocusedBlank] = useState<number | null>(null);
  const editorRef = useRef<any>(null);

  // Parse the code to identify blanks and their positions
  const parseCodeWithBlanks = useCallback(() => {
    const parts = content.value.split('____');
    const blankCount = parts.length - 1;
    
    // Calculate positions for blanks in the reconstructed code
    const blanks = [];
    let currentPos = 0;
    
    for (let i = 0; i < blankCount; i++) {
      currentPos += parts[i].length;
      blanks.push({
        index: i,
        pos: currentPos,
        value: blankValues[i] || '',
        status: blankStatuses[i] || 'empty'
      });
      currentPos += (blankValues[i] || '____').length;
    }
    
    return {
      parts,
      blankCount,
      blanks
    };
  }, [content.value, blankValues, blankStatuses]);

  const { parts, blankCount, blanks } = parseCodeWithBlanks();

  // Reconstruct the code with current values for CodeMirror
  const getCodeForEditor = useCallback(() => {
    let code = parts[0];
    for (let i = 0; i < parts.length - 1; i++) {
      code += (blankValues[i] || '____') + (parts[i + 1] || '');
    }
    return code;
  }, [parts, blankValues]);

  // Real-time validation function with multiple valid answers support
  const validateBlank = useCallback((blankIndex: number, value: string) => {
    if (!content.solution || blankIndex >= content.solution.length) {
      return 'empty';
    }

    const correctAnswer = content.solution[blankIndex].trim();
    const userAnswer = value.trim();

    if (userAnswer === '') {
      return 'empty';
    }

    // Exact match (primary solution)
    if (userAnswer === correctAnswer) {
      return 'correct';
    }

    // Check for common alternative valid answers
    const alternativeAnswers = getAlternativeAnswers(correctAnswer, userAnswer);
    if (alternativeAnswers.includes(userAnswer.toLowerCase())) {
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

  // Function to get alternative valid answers
  const getAlternativeAnswers = (correctAnswer: string, userAnswer: string) => {
    const correct = correctAnswer.toLowerCase();
    const alternatives: string[] = [];

    // Common variable name alternatives
    const variableAlternatives: Record<string, string[]> = {
      'data': ['df', 'dataset', 'data_frame'],
      'df': ['data', 'dataset', 'dataframe'],
      'dataset': ['data', 'df', 'ds'],
      'i': ['index', 'idx', 'counter'],
      'x': ['value', 'val', 'item'],
      'result': ['res', 'output', 'answer'],
    };

    // File extension alternatives
    if (correct.endsWith('.csv')) {
      alternatives.push('data.csv', 'dataset.csv', 'file.csv');
    }

    // Boolean alternatives
    if (correct === 'true') alternatives.push('True');
    if (correct === 'false') alternatives.push('False');

    // Add specific alternatives for the correct answer
    if (correct in variableAlternatives) {
      alternatives.push(...variableAlternatives[correct]);
    }

    return alternatives;
  };

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

  // Robust syntax highlighting that prevents nested spans
  const applySyntaxHighlighting = (code: string) => {
    // Create tokens to track what's already been highlighted
    const tokens: Array<{start: number, end: number, className: string, content: string}> = [];
    
    // Helper function to add token if position is not already taken
    const addToken = (match: RegExpMatchArray, className: string) => {
      const start = match.index!;
      const end = start + match[0].length;
      
      // Check if this position overlaps with existing tokens
      const overlaps = tokens.some(token => 
        (start >= token.start && start < token.end) || 
        (end > token.start && end <= token.end) ||
        (start <= token.start && end >= token.end)
      );
      
      if (!overlaps) {
        tokens.push({ start, end, className, content: match[0] });
      }
    };

    // Find all matches in order of precedence
    // 1. Comments (highest priority)
    const commentMatches = [...code.matchAll(/(#.*$)/gm)];
    commentMatches.forEach(match => addToken(match, 'text-green-500'));

    // 2. Strings
    const stringMatches = [...code.matchAll(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g)];
    stringMatches.forEach(match => addToken(match, 'text-yellow-300'));

    // 3. Numbers
    const numberMatches = [...code.matchAll(/\b(\d+\.?\d*)\b/g)];
    numberMatches.forEach(match => addToken(match, 'text-orange-400'));

    // 4. Keywords
    const keywordMatches = [...code.matchAll(/\b(def|class|if|elif|else|for|while|try|except|finally|with|import|from|as|return|yield|break|continue|pass|lambda|and|or|not|in|is|True|False|None)\b/g)];
    keywordMatches.forEach(match => addToken(match, 'text-purple-400'));

    // 5. Built-in functions
    const functionMatches = [...code.matchAll(/\b(print|len|range|str|int|float|list|dict|set|tuple|type|isinstance|hasattr|getattr|setattr)\b/g)];
    functionMatches.forEach(match => addToken(match, 'text-blue-400'));

    // 6. Operators
    const operatorMatches = [...code.matchAll(/([+\-*/%=<>!&|^~])/g)];
    operatorMatches.forEach(match => addToken(match, 'text-red-400'));

    // Sort tokens by position
    tokens.sort((a, b) => a.start - b.start);

    // Build the highlighted string
    let result = '';
    let lastIndex = 0;

    tokens.forEach(token => {
      // Add text before this token
      result += code.slice(lastIndex, token.start)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      // Add the highlighted token
      result += `<span class="${token.className}">${token.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}</span>`;
      
      lastIndex = token.end;
    });

    // Add remaining text
    result += code.slice(lastIndex)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return result;
  };

  // Render the code with interactive blanks and clean syntax highlighting
  const renderInteractiveCode = () => {
    return (
      <div className="font-mono text-sm leading-relaxed bg-gray-900 p-4 rounded-lg overflow-x-auto">
        {parts.map((part, index) => {
          const highlightedPart = applySyntaxHighlighting(part);
          // Debug: log the highlighted part to see if it's working
          if (process.env.NODE_ENV === 'development' && part.includes('def') || part.includes('class')) {
            console.log('Original part:', part);
            console.log('Highlighted part:', highlightedPart);
          }
          
          return (
            <React.Fragment key={index}>
              <span 
                className="whitespace-pre"
                dangerouslySetInnerHTML={{ 
                  __html: highlightedPart
                }}
              />
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
          );
        })}
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