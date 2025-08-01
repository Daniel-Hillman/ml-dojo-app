'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  Copy,
  Share2,
  Settings,
  ChevronUp,
  ChevronDown,
  Code,
  Eye,
  AlertTriangle,
  Keyboard,
  Smartphone,
  Monitor
} from 'lucide-react';
import { CodeOutput } from './CodeOutput';
import { ExecutionStatusIndicator, ExecutionStatus } from './ExecutionStatusIndicator';
import { 
  CodeExecutionRequest, 
  CodeExecutionResult, 
  SupportedLanguage 
} from '@/lib/code-execution/types';
import { codeExecutor } from '@/lib/code-execution';

interface MobileLiveCodeBlockProps {
  initialCode: string;
  language: SupportedLanguage;
  onCodeChange?: (code: string) => void;
  onExecutionComplete?: (result: CodeExecutionResult) => void;
  className?: string;
  title?: string;
}

export const MobileLiveCodeBlock: React.FC<MobileLiveCodeBlockProps> = ({
  initialCode,
  language,
  onCodeChange,
  onExecutionComplete,
  className = '',
  title = 'Code Editor'
}) => {
  const [code, setCode] = useState(initialCode);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [executionTime, setExecutionTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePanel, setActivePanel] = useState<'code' | 'output'>('code');
  const [outputCollapsed, setOutputCollapsed] = useState(false);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setOrientation(isLandscape ? 'landscape' : 'portrait');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Handle virtual keyboard
  useEffect(() => {
    const handleViewportChange = () => {
      const viewport = window.visualViewport;
      if (viewport) {
        const keyboardHeight = window.innerHeight - viewport.height;
        setShowVirtualKeyboard(keyboardHeight > 100);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    }
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    onCodeChange?.(newCode);
  };

  const executeCode = async () => {
    if (!code.trim() || executionStatus === 'running') return;

    setExecutionStatus('running');
    setExecutionResult(null);
    const startTime = Date.now();

    try {
      const request: CodeExecutionRequest = {
        code,
        language,
        sessionId: `mobile_${Date.now()}`
      };

      const result = await codeExecutor.execute(request);
      
      setExecutionResult(result);
      setExecutionStatus(result.success ? 'completed' : 'error');
      setExecutionTime(Date.now() - startTime);
      
      // Auto-switch to output panel on mobile after execution
      if (window.innerWidth < 768) {
        setActivePanel('output');
      }

      onExecutionComplete?.(result);

    } catch (error) {
      const errorResult: CodeExecutionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      };
      
      setExecutionResult(errorResult);
      setExecutionStatus('error');
      setActivePanel('output');
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      // Could add toast notification
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const shareCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: code,
          url: window.location.href
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      copyCode();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  };

  const adjustFontSize = (delta: number) => {
    const newSize = Math.max(10, Math.min(20, fontSize + delta));
    setFontSize(newSize);
  };

  // Mobile-specific keyboard shortcuts
  const insertText = (text: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newCode = code.substring(0, start) + text + code.substring(end);
    
    handleCodeChange(newCode);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

  const renderMobileKeyboard = () => {
    const commonSymbols = [
      { label: '()', text: '()', offset: -1 },
      { label: '{}', text: '{}', offset: -1 },
      { label: '[]', text: '[]', offset: -1 },
      { label: ';', text: ';' },
      { label: ':', text: ':' },
      { label: '=', text: '=' },
      { label: '+', text: '+' },
      { label: '-', text: '-' },
      { label: '*', text: '*' },
      { label: '/', text: '/' },
      { label: '<', text: '<' },
      { label: '>', text: '>' },
      { label: '&', text: '&' },
      { label: '|', text: '|' },
      { label: '!', text: '!' },
      { label: '?', text: '?' }
    ];

    return (
      <div className="bg-gray-100 border-t p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">Quick Insert</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowVirtualKeyboard(false)}
            className="h-6 px-2"
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="grid grid-cols-8 gap-1">
          {commonSymbols.map((symbol, index) => (
            <Button
              key={index}
              size="sm"
              variant="outline"
              onClick={() => {
                insertText(symbol.text);
                if (symbol.offset && textareaRef.current) {
                  const textarea = textareaRef.current;
                  const newPos = textarea.selectionStart + symbol.offset;
                  textarea.selectionStart = textarea.selectionEnd = newPos;
                }
              }}
              className="h-8 text-xs p-0"
            >
              {symbol.label}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-1 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertText('  ')} // 2 spaces for indentation
            className="h-6 text-xs px-2"
          >
            Tab
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertText('\n')}
            className="h-6 text-xs px-2"
          >
            Enter
          </Button>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => adjustFontSize(-1)}
            className="h-6 text-xs px-2"
          >
            A-
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => adjustFontSize(1)}
            className="h-6 text-xs px-2"
          >
            A+
          </Button>
        </div>
      </div>
    );
  };

  const renderMobileLayout = () => {
    if (orientation === 'landscape') {
      // Landscape: side-by-side layout
      return (
        <div className="grid grid-cols-2 h-full">
          {/* Code Panel */}
          <div className="border-r">
            <div className="h-full flex flex-col">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="absolute inset-0 w-full h-full p-2 font-mono bg-gray-900 text-gray-100 border-none outline-none resize-none"
                  style={{ fontSize: `${fontSize}px` }}
                  placeholder={`Enter ${language} code here...`}
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          {/* Output Panel */}
          <div className="flex flex-col">
            {executionResult && (
              <div className="flex-1 overflow-hidden">
                <CodeOutput
                  result={executionResult}
                  language={language}
                  maxHeight="100%"
                  showMetadata={false}
                />
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // Portrait: tabbed layout
      return (
        <div className="h-full flex flex-col">
          {/* Tab Navigation */}
          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setActivePanel('code')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activePanel === 'code'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Code className="w-4 h-4 inline mr-1" />
              Code
            </button>
            <button
              onClick={() => setActivePanel('output')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activePanel === 'output'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              Output
              {executionResult && !executionResult.success && (
                <AlertTriangle className="w-3 h-3 inline ml-1 text-red-500" />
              )}
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {activePanel === 'code' ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="absolute inset-0 w-full h-full p-3 font-mono bg-gray-900 text-gray-100 border-none outline-none resize-none"
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.4 }}
                    placeholder={`Enter ${language} code here...`}
                    spellCheck={false}
                  />
                </div>
                
                {/* Mobile Keyboard Helper */}
                {!showVirtualKeyboard && (
                  <div className="border-t bg-gray-50 p-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowVirtualKeyboard(true)}
                      className="w-full h-8 text-xs"
                    >
                      <Keyboard className="w-3 h-3 mr-1" />
                      Show Coding Keyboard
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full">
                {executionResult ? (
                  <CodeOutput
                    result={executionResult}
                    language={language}
                    maxHeight="100%"
                    showMetadata={false}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Run your code to see output</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`mobile-live-code-block ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''} ${className}`}
    >
      <Card className="h-full">
        <CardHeader className="pb-2 px-3 py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base truncate">{title}</CardTitle>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {language}
              </Badge>
              <div className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {orientation}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                onClick={executeCode}
                disabled={executionStatus === 'running' || !code.trim()}
                className="h-7 px-2 text-xs"
              >
                {executionStatus === 'running' ? (
                  <Square className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                <span className="ml-1 hidden xs:inline">
                  {executionStatus === 'running' ? 'Stop' : 'Run'}
                </span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={copyCode}
                className="h-7 px-2 text-xs"
              >
                <Copy className="w-3 h-3" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={shareCode}
                className="h-7 px-2 text-xs"
              >
                <Share2 className="w-3 h-3" />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <ExecutionStatusIndicator
                status={executionStatus}
                executionTime={executionTime}
                canCancel={executionStatus === 'running'}
                className="scale-90"
              />

              <Button
                size="sm"
                variant="outline"
                onClick={toggleFullscreen}
                className="h-7 px-2 text-xs"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3 h-3" />
                ) : (
                  <Maximize2 className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="h-full">
            {renderMobileLayout()}
          </div>
        </CardContent>

        {/* Virtual Keyboard */}
        {showVirtualKeyboard && renderMobileKeyboard()}
      </Card>
    </div>
  );
};