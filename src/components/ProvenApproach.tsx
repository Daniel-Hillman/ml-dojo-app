"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { debounce } from '@/lib/debounce';
import dynamic from 'next/dynamic';

// Lazy load CodeMirror for better performance
const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
  loading: () => (
    <div className="flex items-center justify-center h-32 bg-muted/50 border rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-xs text-muted-foreground">Loading editor...</p>
      </div>
    </div>
  ),
  ssr: false
});
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { php } from '@codemirror/lang-php';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { sql } from '@codemirror/lang-sql';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { markdown } from '@codemirror/lang-markdown';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView } from '@codemirror/view';

interface ProvenApproachProps {
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

export function ProvenApproach({ 
  content, 
  contentIndex, 
  onAnswerChange, 
  onValidationChange 
}: ProvenApproachProps) {
  // Add custom CSS for gentle pulse animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gentle-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      .gentle-pulse {
        animation: gentle-pulse 4s ease-in-out infinite;
      }
      @keyframes input-glow {
        0%, 100% { 
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
          border-color: rgba(59, 130, 246, 0.5);
        }
        50% { 
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.6);
          border-color: rgba(59, 130, 246, 0.8);
        }
      }
      .input-glow {
        animation: input-glow 3s ease-in-out infinite;
      }
      
      /* Match playground code block styling */
      .syntax-highlighted-code .cm-editor {
        background-color: #1e1e1e !important;
        border-radius: 6px;
        overflow: hidden;
      }
      
      .syntax-highlighted-code .cm-content {
        color: #d4d4d4 !important;
        padding: 16px;
        font-size: 14px;
        font-family: 'JetBrains Mono', Consolas, Monaco, 'Courier New', monospace;
      }
      
      .syntax-highlighted-code .cm-focused {
        outline: none;
      }
      
      .syntax-highlighted-code .cm-scroller {
        font-family: 'JetBrains Mono', Consolas, Monaco, 'Courier New', monospace;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e0 #f7fafc;
        scrollbar-gutter: stable;
      }
      
      .syntax-highlighted-code .cm-scroller::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      .syntax-highlighted-code .cm-scroller::-webkit-scrollbar-track {
        background: #f7fafc;
        border-radius: 4px;
      }
      
      .syntax-highlighted-code .cm-scroller::-webkit-scrollbar-thumb {
        background: #cbd5e0;
        border-radius: 4px;
      }
      
      .syntax-highlighted-code .cm-scroller::-webkit-scrollbar-thumb:hover {
        background: #a0aec0;
      }
      
      .syntax-highlighted-code .cm-scroller::-webkit-scrollbar-corner {
        background: #f7fafc;
      }
      
      /* Preserve VS Code syntax highlighting colors to match playground */
      .syntax-highlighted-code .cm-keyword { color: #569cd6 !important; }
      .syntax-highlighted-code .cm-string { color: #ce9178 !important; }
      .syntax-highlighted-code .cm-comment { color: #6a9955 !important; }
      .syntax-highlighted-code .cm-number { color: #b5cea8 !important; }
      .syntax-highlighted-code .cm-operator { color: #d4d4d4 !important; }
      .syntax-highlighted-code .cm-punctuation { color: #d4d4d4 !important; }
      .syntax-highlighted-code .cm-property { color: #9cdcfe !important; }
      .syntax-highlighted-code .cm-variableName { color: #9cdcfe !important; }
      .syntax-highlighted-code .cm-typeName { color: #4ec9b0 !important; }
      .syntax-highlighted-code .cm-function { color: #dcdcaa !important; }
      .syntax-highlighted-code .cm-tag { color: #569cd6 !important; }
      .syntax-highlighted-code .cm-attribute { color: #9cdcfe !important; }
      .syntax-highlighted-code .cm-attributeValue { color: #ce9178 !important; }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [blankValues, setBlankValues] = useState<Record<number, string>>({});
  const [blankStatuses, setBlankStatuses] = useState<Record<number, BlankStatus>>({});
  const [currentBlankIndex, setCurrentBlankIndex] = useState(0);
  const [isChangingBlank, setIsChangingBlank] = useState(false);

  // Handle blank navigation with visual feedback
  const navigateToBlank = (newIndex: number) => {
    setIsChangingBlank(true);
    setCurrentBlankIndex(newIndex);
    setTimeout(() => setIsChangingBlank(false), 300);
  };

  // Get the appropriate language extension for CodeMirror
  const getLanguageExtension = useCallback(() => {
    const language = content.language?.toLowerCase() || 'python';
    
    switch (language) {
      case 'python':
      case 'py':
        return python();
      case 'javascript':
      case 'js':
      case 'jsx':
        return javascript({ jsx: true });
      case 'typescript':
      case 'ts':
      case 'tsx':
        return javascript({ typescript: true, jsx: true });
      case 'html':
      case 'htm':
        return html();
      case 'css':
        return css();
      case 'java':
        return java();
      case 'cpp':
      case 'c++':
      case 'c':
        return cpp();
      case 'php':
        return php();
      case 'rust':
      case 'rs':
        return rust();
      case 'go':
        return go();
      case 'sql':
        return sql();
      case 'json':
        return json();
      case 'xml':
        return xml();
      case 'markdown':
      case 'md':
        return markdown();
      default:
        return python(); // Default fallback
    }
  }, [content.language]);

  // Format code with proper indentation and spacing
  const formatCode = useCallback((code: string) => {
    const language = content.language?.toLowerCase() || 'python';
    
    // Basic formatting rules for different languages
    let formatted = code;
    
    // HTML formatting
    if (language === 'html' || language === 'htm') {
      formatted = formatted
        .replace(/></g, '>\n<') // Add newlines between tags
        .replace(/^\s+/gm, '') // Remove existing indentation
        .split('\n')
        .map((line, index, lines) => {
          let indent = 0;
          
          // Calculate indentation based on tag nesting
          for (let i = 0; i < index; i++) {
            const prevLine = lines[i];
            const openTags = (prevLine.match(/<[^\/][^>]*>/g) || []).length;
            const closeTags = (prevLine.match(/<\/[^>]*>/g) || []).length;
            const selfClosing = (prevLine.match(/<[^>]*\/>/g) || []).length;
            indent += openTags - closeTags - selfClosing;
          }
          
          // Adjust for current line
          if (line.trim().startsWith('</')) {
            indent -= 1;
          }
          
          return '  '.repeat(Math.max(0, indent)) + line.trim();
        })
        .join('\n');
    }
    
    // CSS formatting
    else if (language === 'css') {
      formatted = formatted
        .replace(/\{/g, ' {\n  ')
        .replace(/\}/g, '\n}\n')
        .replace(/;/g, ';\n  ')
        .replace(/,/g, ',\n')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    }
    
    // JavaScript/TypeScript formatting
    else if (['javascript', 'js', 'typescript', 'ts'].includes(language)) {
      formatted = formatted
        .replace(/\{/g, ' {\n  ')
        .replace(/\}/g, '\n}')
        .replace(/;/g, ';\n')
        .replace(/,/g, ', ')
        .trim();
    }
    
    // Python formatting (basic)
    else if (language === 'python' || language === 'py') {
      formatted = formatted
        .replace(/:/g, ':\n    ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    }
    
    return formatted;
  }, [content.language]);

  // Debug: Log what we receive
  useEffect(() => {
    console.log('ProvenApproach received:', content);
    const blankCount = (content.value.match(/____/g) || []).length;
    console.log('Detected blanks:', blankCount);
    console.log('Language:', content.language);
    console.log('Solutions:', content.solution);
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

  // Render code with blanks highlighted
  const renderCodeWithBlanks = useCallback(() => {
    if (!hasValidBlanks) {
      return formatCode(content.value);
    }

    let result = '';
    parts.forEach((part, index) => {
      result += part;
      if (index < parts.length - 1) {
        const blankIndex = index;
        const userValue = blankValues[blankIndex] || '';
        const isCurrentBlank = blankIndex === currentBlankIndex;
        
        if (userValue) {
          // Show user's answer
          result += userValue;
        } else {
          // Show placeholder for empty blank
          result += isCurrentBlank ? '____' : '____';
        }
      }
    });

    return formatCode(result);
  }, [parts, blankValues, currentBlankIndex, hasValidBlanks, content.value, formatCode]);

  // Get display code with user inputs and proper formatting
  const getDisplayCode = useCallback(() => {
    if (!hasValidBlanks) {
      return formatCode(content.value);
    }
    
    let code = parts[0] || '';
    for (let i = 0; i < parts.length - 1; i++) {
      const userInput = blankValues[i] || '____';
      code += userInput + (parts[i + 1] || '');
    }
    return formatCode(code);
  }, [parts, blankValues, hasValidBlanks, content.value, formatCode]);

  // Get display code with highlighting for current blank
  const getHighlightedDisplayCode = useCallback(() => {
    if (!hasValidBlanks) {
      return content.value;
    }
    
    let code = parts[0] || '';
    for (let i = 0; i < parts.length - 1; i++) {
      const userInput = blankValues[i] || '____';
      
      // Add special markers around the current blank for highlighting
      if (i === currentBlankIndex) {
        code += `⟨${userInput}⟩` + (parts[i + 1] || '');
      } else {
        code += userInput + (parts[i + 1] || '');
      }
    }
    return code;
  }, [parts, blankValues, hasValidBlanks, content.value, currentBlankIndex]);

  // Create CodeMirror theme extension for highlighting current blank
  const highlightTheme = EditorView.theme({
    '.cm-highlight-current-blank': {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      padding: '2px 4px',
      borderRadius: '4px',
      fontWeight: 'bold'
    }
  });

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

  // Get input styling
  const getInputStyling = (blankIndex: number) => {
    const status = blankStatuses[blankIndex] || 'empty';
    
    const baseClasses = "w-full font-mono text-sm px-3 py-2 border-2 rounded transition-all duration-200";
    
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
          className: cn(baseClasses, "bg-gray-700/50 border-gray-600 text-gray-300 focus:border-blue-500 focus:bg-blue-500/10"),
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
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">
            Progress: {correctCount}/{totalCount} blanks completed
          </span>
          <span className="text-sm text-gray-400">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  };

  // If no blanks, show read-only code
  if (!hasValidBlanks) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 border-b border-gray-700 rounded-t-lg flex items-center justify-between">
          <span>💻 Code Example</span>
          <span className="text-xs bg-gray-700 px-2 py-1 rounded">
            {content.language?.toUpperCase() || 'PYTHON'}
          </span>
        </div>
        <CodeMirror
          value={formatCode(content.value)}
          height="auto"
          extensions={[
            getLanguageExtension(),
            EditorView.theme({
              '&': {
                fontSize: '14px',
                fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace'
              },
              '.cm-content': {
                padding: '16px',
                fontSize: '14px',
                lineHeight: '1.6',
                fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
                minHeight: '100px'
              },
              '.cm-focused': {
                outline: 'none'
              },
              '.cm-editor': {
                backgroundColor: '#1e1e1e !important',
                borderRadius: '6px',
                overflow: 'hidden'
              },
              '.cm-scroller': {
                fontFamily: 'inherit',
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e0 #f7fafc',
                scrollbarGutter: 'stable'
              }
            })
          ]}
          theme={vscodeDark}
          editable={false}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: false,
            bracketMatching: true,
            closeBrackets: false,
            autocompletion: false,
            highlightSelectionMatches: false,
            searchKeymap: false
          }}
          className="rounded-lg syntax-highlighted-code"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 text-sm text-gray-300 border-b border-gray-700 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-medium">💻 Interactive Coding Exercise</span>
            <span className="text-xs bg-gray-700 px-2 py-1 rounded">
              {content.language?.toUpperCase() || 'PYTHON'}
            </span>
          </div>
          <span className="text-xs">
            {blanks.filter(i => blankStatuses[i] === 'correct').length}/{blanks.length} correct
          </span>
        </div>
      </div>

      {/* Progress */}
      {renderProgress()}

      {/* Code Display with Current Blank Highlighting */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-300">📖 Code Preview:</h3>
          <div className="text-xs text-blue-400 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 gentle-pulse"></div>
            Currently editing blank {currentBlankIndex + 1}
          </div>
        </div>
        
        {/* Beautiful syntax-highlighted code display with integrated blanks */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <CodeMirror
            value={renderCodeWithBlanks()}
            height="auto"
            extensions={[
              getLanguageExtension(),
              EditorView.theme({
                '&': {
                  fontSize: '14px',
                  fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace'
                },
                '.cm-content': {
                  padding: '16px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
                  minHeight: '100px'
                },
                '.cm-focused': {
                  outline: 'none'
                },
                '.cm-editor': {
                  backgroundColor: '#1e1e1e !important',
                  borderRadius: '6px',
                  overflow: 'hidden'
                },
                '.cm-scroller': {
                  fontFamily: 'inherit',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e0 #f7fafc',
                  scrollbarGutter: 'stable'
                },
                '&.cm-editor.cm-focused': {
                  outline: 'none'
                }
              })
            ]}
            theme={vscodeDark}
            editable={false}
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              dropCursor: false,
              allowMultipleSelections: false,
              indentOnInput: false,
              bracketMatching: true,
              closeBrackets: false,
              autocompletion: false,
              highlightSelectionMatches: false,
              searchKeymap: false
            }}
            className="syntax-highlighted-code"
          />
        </div>
      </div>

      {/* Interactive Form - One Blank at a Time */}
      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300">
            ✏️ Fill in Blank {currentBlankIndex + 1} of {blanks.length}
          </h3>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => {
                // Loop to last blank if at the beginning
                const prevIndex = currentBlankIndex === 0 ? blanks.length - 1 : currentBlankIndex - 1;
                navigateToBlank(prevIndex);
              }}
              variant="outline"
              size="sm"
              title="Previous blank (Shift+Tab or ↑)"
            >
              ← Previous
            </Button>
            <Button
              onClick={() => {
                // Loop to first blank if at the end
                const nextIndex = currentBlankIndex === blanks.length - 1 ? 0 : currentBlankIndex + 1;
                navigateToBlank(nextIndex);
              }}
              variant="outline"
              size="sm"
              title="Next blank (Tab, Enter, or ↓)"
            >
              Next →
            </Button>
          </div>
        </div>

        {/* Current Blank Input */}
        {blanks.length > 0 && (
          <div className="space-y-4">
            {(() => {
              const blankIndex = currentBlankIndex;
              const { className, icon } = getInputStyling(blankIndex);
              
              return (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="block text-lg font-medium text-gray-200">
                      What should go in blank {blankIndex + 1}?
                    </label>
                    <div className="text-xs text-gray-400 flex items-center gap-4">
                      <span>💡 Navigation: Tab/↓ (next) • Shift+Tab/↑ (previous) • Enter (next)</span>
                      <span className="text-blue-400">Loops automatically!</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Input
                      value={blankValues[blankIndex] || ''}
                      onChange={(e) => handleBlankChange(blankIndex, e.target.value)}
                      placeholder="Type your answer here..."
                      className={cn(className, "text-lg py-3 input-glow")}
                      autoComplete="off"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Tab' && !e.shiftKey) {
                          e.preventDefault();
                          // Loop to first blank if at the end
                          const nextIndex = currentBlankIndex === blanks.length - 1 ? 0 : currentBlankIndex + 1;
                          navigateToBlank(nextIndex);
                        } else if (e.key === 'Tab' && e.shiftKey) {
                          e.preventDefault();
                          // Loop to last blank if at the beginning
                          const prevIndex = currentBlankIndex === 0 ? blanks.length - 1 : currentBlankIndex - 1;
                          navigateToBlank(prevIndex);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          // Move to next blank on Enter, loop to first if at end
                          const nextIndex = currentBlankIndex === blanks.length - 1 ? 0 : currentBlankIndex + 1;
                          navigateToBlank(nextIndex);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          // Move to next blank with arrow down, loop to first if at end
                          const nextIndex = currentBlankIndex === blanks.length - 1 ? 0 : currentBlankIndex + 1;
                          navigateToBlank(nextIndex);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          // Move to previous blank with arrow up, loop to last if at beginning
                          const prevIndex = currentBlankIndex === 0 ? blanks.length - 1 : currentBlankIndex - 1;
                          navigateToBlank(prevIndex);
                        }
                      }}
                    />
                    {icon && (
                      <div className="flex-shrink-0">
                        {icon}
                      </div>
                    )}
                  </div>

                  {/* Status message */}
                  {blankStatuses[blankIndex] === 'correct' && (
                    <div className="text-green-400 text-sm flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Correct! Great job!
                    </div>
                  )}
                  {blankStatuses[blankIndex] === 'incorrect' && (
                    <div className="text-red-400 text-sm flex items-center">
                      <XCircle className="w-4 h-4 mr-2" />
                      Not quite right. Try again!
                    </div>
                  )}
                  {blankStatuses[blankIndex] === 'partial' && (
                    <div className="text-yellow-400 text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      You're on the right track! Keep going...
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Quick Jump to Other Blanks */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">Quick jump to:</div>
          <div className="flex flex-wrap gap-2">
            {blanks.map((blankIndex) => {
              const status = blankStatuses[blankIndex] || 'empty';
              const isCurrent = blankIndex === currentBlankIndex;
              
              let bgColor = 'bg-gray-700';
              let textColor = 'text-gray-300';
              
              if (status === 'correct') {
                bgColor = 'bg-green-600';
                textColor = 'text-white';
              } else if (status === 'incorrect') {
                bgColor = 'bg-red-600';
                textColor = 'text-white';
              } else if (status === 'partial') {
                bgColor = 'bg-yellow-600';
                textColor = 'text-white';
              }
              
              if (isCurrent) {
                bgColor = 'bg-blue-600';
                textColor = 'text-white';
              }
              
              return (
                <button
                  key={blankIndex}
                  onClick={() => navigateToBlank(blankIndex)}
                  className={cn(
                    'px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105',
                    bgColor,
                    textColor,
                    isCurrent && 'ring-2 ring-blue-400 scale-110'
                  )}
                >
                  {blankIndex + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}