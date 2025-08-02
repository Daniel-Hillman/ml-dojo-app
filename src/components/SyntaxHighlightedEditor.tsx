'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { EditorView, keymap, placeholder as placeholderExtension } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion } from '@codemirror/autocomplete';
import { lintGutter } from '@codemirror/lint';
import { searchKeymap } from '@codemirror/search';
import { SupportedLanguage } from '@/lib/code-execution';

interface SyntaxHighlightedEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: SupportedLanguage;
  height?: string;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
  placeholder?: string;
  onExecute?: () => void;
  className?: string;
}

// Language extension mapping
const getLanguageExtension = (language: SupportedLanguage): Extension => {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return javascript({ typescript: language === 'typescript' });
    case 'html':
      return html();
    case 'css':
      return css();
    case 'python':
      return python();
    case 'sql':
      return sql();
    case 'json':
      return json();
    case 'yaml':
      return yaml();
    case 'markdown':
      return markdown();
    default:
      return javascript();
  }
};

export const SyntaxHighlightedEditor: React.FC<SyntaxHighlightedEditorProps> = ({
  value,
  onChange,
  language,
  height = '400px',
  theme = 'dark',
  readOnly = false,
  placeholder = '',
  onExecute,
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Create editor extensions
  const createExtensions = useCallback((): Extension[] => {
    try {
      const extensions: Extension[] = [
        // Language support
        getLanguageExtension(language),
        
        // Basic editor features
        EditorView.lineWrapping,
        autocompletion(),
        lintGutter(),
        
        // Keymaps - with safe fallbacks
        keymap.of([
          ...(Array.isArray(defaultKeymap) ? defaultKeymap : []),
          ...(Array.isArray(searchKeymap) ? searchKeymap : []),
          ...(indentWithTab ? [indentWithTab] : []),
          // Custom execute keymap
          {
            key: 'Ctrl-Enter',
            mac: 'Cmd-Enter',
            run: () => {
              onExecute?.();
              return true;
            }
          }
        ]),
      
      // Update listener
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          onChange(newValue);
        }
      }),
      
      // Theme
      ...(theme === 'dark' ? [oneDark] : []),
      
      // Read-only state
      EditorState.readOnly.of(readOnly),
      
      // Placeholder
      ...(placeholder ? [placeholderExtension(placeholder)] : []),
      
      // Custom styling
      EditorView.theme({
        '&': {
          height: height,
          fontSize: '14px',
          fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace'
        },
        '.cm-content': {
          padding: '16px',
          minHeight: height
        },
        '.cm-focused': {
          outline: 'none'
        },
        '.cm-editor': {
          borderRadius: '6px'
        },
        '.cm-scroller': {
          fontFamily: 'inherit'
        }
      })
      ];

      return extensions;
    } catch (error) {
      console.error('Error creating CodeMirror extensions:', error);
      // Return minimal extensions as fallback
      return [
        getLanguageExtension(language),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            onChange(newValue);
          }
        })
      ];
    }
  }, [language, height, theme, readOnly, placeholder, onChange, onExecute]);

  // Initialize editor
  useEffect(() => {
    if (!editorRef.current || !isClient) return;

    try {
      const state = EditorState.create({
        doc: value,
        extensions: createExtensions()
      });

      const view = new EditorView({
        state,
        parent: editorRef.current
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize CodeMirror editor:', error);
    }
  }, [isClient]); // Only run when client is ready

  // Update editor when props change
  useEffect(() => {
    if (!viewRef.current || !isClient) return;

    try {
      const currentValue = viewRef.current.state.doc.toString();
      if (currentValue !== value) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: viewRef.current.state.doc.length,
            insert: value
          }
        });
      }
    } catch (error) {
      console.error('Failed to update editor value:', error);
    }
  }, [value, isClient]);

  // Update extensions when language or other props change
  useEffect(() => {
    if (!viewRef.current || !isClient) return;

    try {
      viewRef.current.dispatch({
        effects: EditorState.reconfigure.of(createExtensions())
      });
    } catch (error) {
      console.error('Failed to reconfigure editor extensions:', error);
    }
  }, [createExtensions, isClient]);

  // Show loading state during SSR or before client hydration
  if (!isClient) {
    return (
      <div 
        className={`syntax-highlighted-editor ${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800 border rounded-md`}
        style={{ height }}
      >
        <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
      </div>
    );
  }

  return (
    <div 
      ref={editorRef} 
      className={`syntax-highlighted-editor ${className}`}
      style={{ height }}
    />
  );
};

export default SyntaxHighlightedEditor;