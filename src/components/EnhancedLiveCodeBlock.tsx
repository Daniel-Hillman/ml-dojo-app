'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Settings, 
  Maximize2, 
  Copy,
  Download,
  Loader2,
  AlertTriangle,
  BookOpen,
  Share2,
  Minimize2
} from 'lucide-react';
import { CodeOutput } from './CodeOutput';
import { ExecutionStatusIndicator, ExecutionStatus, DetailedExecutionStatus } from './ExecutionStatusIndicator';
import { ErrorSuggestions } from './ErrorSuggestions';
import { RetryMechanism, useRetryMechanism } from './RetryMechanism';
import { 
  CodeExecutionRequest, 
  CodeExecutionResult, 
  SupportedLanguage 
} from '@/lib/code-execution';
import { codeExecutor } from '@/lib/code-execution';
import { enhancedErrorService, UserFeedbackState } from '@/lib/code-execution/enhanced-error-service';
import { ProcessedError, errorHandler } from '@/lib/code-execution/error-handler';
import { executionManager } from '@/lib/code-execution/execution-controller';
import { performanceMetrics } from '@/lib/code-execution/performance-metrics';

interface EnhancedLiveCodeBlockProps {
  initialCode: string;
  language: SupportedLanguage;
  showOutput?: boolean;
  allowEdit?: boolean;
  height?: string;
  onCodeChange?: (code: string) => void;
  onExecutionComplete?: (result: CodeExecutionResult) => void;
  className?: string;
  title?: string;
  showLanguageSelector?: boolean;
  availableLanguages?: SupportedLanguage[];
  enableErrorHandling?: boolean;
  enableRetry?: boolean;
  showProgress?: boolean;
  showSuggestions?: boolean;
}

export const EnhancedLiveCodeBlock: React.FC<EnhancedLiveCodeBlockProps> = ({
  initialCode,
  language,
  showOutput = true,
  allowEdit = true,
  height = '400px',
  onCodeChange,
  onExecutionComplete,
  className = '',
  title = 'Live Code Editor',
  showLanguageSelector = true,
  availableLanguages = ['javascript', 'typescript', 'html', 'css', 'python', 'sql'],
  enableErrorHandling = true,
  enableRetry = true,
  showProgress = true,
  showSuggestions = true
}) => {
  const [code, setCode] = useState(initialCode);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(language);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [processedError, setProcessedError] = useState<ProcessedError | null>(null);
  const [feedbackState, setFeedbackState] = useState<UserFeedbackState>({
    isVisible: false,
    retryState: {
      isRetrying: false,
      currentAttempt: 0,
      maxAttempts: 0
    },
    progressState: {
      isVisible: false,
      progress: 0,
      message: ''
    }
  });
  const [executionTime, setExecutionTime] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState<number | undefined>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'preview' | 'errors' | 'suggestions' | 'retry'>('console');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const executionIdRef = useRef<string>('');
  const startTimeRef = useRef<number>(0);

  // Initialize retry mechanism
  const {
    retryState,
    retryStrategy,
    startRetry,
    completeRetry,
    resetRetries,
    updateStrategy
  } = useRetryMechanism({
    shouldRetry: true,
    maxRetries: 3,
    delay: 1000,
    backoffMultiplier: 1.5
  });

  // Generate execution ID
  const generateExecutionId = useCallback(() => {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Handle code changes
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    onCodeChange?.(newCode);
    
    // Reset error state when code changes
    if (processedError) {
      setProcessedError(null);
      setExecutionStatus('idle');
    }
  }, [onCodeChange, processedError]);

  // Handle language changes
  const handleLanguageChange = useCallback((newLanguage: SupportedLanguage) => {
    setCurrentLanguage(newLanguage);
    resetRetries();
    setProcessedError(null);
    setExecutionStatus('idle');
  }, [resetRetries]);

  // Execute code with enhanced error handling
  const executeCode = useCallback(async () => {
    if (!code.trim() || executionStatus === 'running') return;

    const executionId = generateExecutionId();
    executionIdRef.current = executionId;
    startTimeRef.current = Date.now();

    setExecutionStatus('running');
    setExecutionResult(null);
    setProcessedError(null);
    setExecutionTime(0);
    resetRetries();

    // Start performance tracking
    performanceMetrics.startExecution(executionId, currentLanguage, code.length);

    // Set up feedback state callback
    if (enableErrorHandling) {
      enhancedErrorService.onFeedbackStateChange(executionId, setFeedbackState);
    }

    try {
      const result = await enhancedErrorService.executeWithErrorHandling(
        executionId,
        currentLanguage,
        code,
        async () => {
          const request: CodeExecutionRequest = {
            code,
            language: currentLanguage,
            sessionId: executionId
          };
          return await codeExecutor.execute(request);
        },
        {
          showSuggestions: enableErrorHandling && showSuggestions,
          enableRetry: enableErrorHandling && enableRetry,
          showProgress,
          notifyUser: enableErrorHandling,
          trackAnalytics: true
        }
      );

      // Success
      setExecutionResult(result);
      setExecutionStatus('completed');
      setExecutionTime(Date.now() - startTimeRef.current);
      
      // Update memory usage
      if (typeof window !== 'undefined' && 'memory' in performance) {
        const memInfo = (performance as any).memory;
        setMemoryUsage(memInfo.usedJSHeapSize);
      }

      // End performance tracking
      performanceMetrics.endExecution(
        executionId,
        true,
        result.output?.length || 0
      );

      // Auto-switch to appropriate tab
      if (result.visualOutput) {
        setActiveTab('preview');
      } else if (result.output) {
        setActiveTab('console');
      }

      onExecutionComplete?.(result);

    } catch (error) {
      // Handle error with enhanced error service
      const processedErr = error as ProcessedError;
      setProcessedError(processedErr);
      setExecutionStatus('error');
      setExecutionTime(Date.now() - startTimeRef.current);

      // End performance tracking with error
      performanceMetrics.endExecution(
        executionId,
        false,
        0,
        processedErr.errorType,
        [processedErr.errorType]
      );

      // Create error result for display
      const errorResult: CodeExecutionResult = {
        success: false,
        error: processedErr.technicalDetails,
        executionTime: Date.now() - startTimeRef.current,
        sessionId: executionId
      };
      setExecutionResult(errorResult);

      // Auto-switch to errors tab
      setActiveTab('errors');

      // Set up retry if possible
      if (enableRetry && processedErr.canRetry) {
        const strategy = errorHandler.getRetryStrategy(processedErr);
        updateStrategy(strategy);
        
        enhancedErrorService.setupAutoRetry(
          executionId,
          () => executeCode(),
          processedErr
        );
      }
    } finally {
      // Cleanup feedback callback
      if (enableErrorHandling) {
        enhancedErrorService.offFeedbackStateChange(executionId);
      }
    }
  }, [
    code,
    currentLanguage,
    executionStatus,
    generateExecutionId,
    resetRetries,
    enableErrorHandling,
    showSuggestions,
    enableRetry,
    showProgress,
    onExecutionComplete,
    updateStrategy
  ]);

  // Cancel execution
  const cancelExecution = useCallback(() => {
    if (executionIdRef.current) {
      executionManager.cancelExecution(executionIdRef.current);
      enhancedErrorService.cancelRetry(executionIdRef.current);
      setExecutionStatus('cancelled');
    }
  }, []);

  // Manual retry
  const handleRetry = useCallback(async () => {
    if (executionIdRef.current) {
      try {
        await enhancedErrorService.manualRetry(executionIdRef.current);
      } catch (error) {
        console.error('Manual retry failed:', error);
      }
    } else {
      // Fallback to regular execution
      await executeCode();
    }
  }, [executeCode]);

  // Apply suggestion
  const handleApplySuggestion = useCallback((suggestion: any) => {
    if (suggestion.code && allowEdit) {
      setCode(suggestion.code);
      onCodeChange?.(suggestion.code);
    }
  }, [allowEdit, onCodeChange]);

  // Copy code to clipboard
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }, [code]);

  // Share code
  const shareCode = useCallback(() => {
    const shareData = {
      title: `${currentLanguage} Code`,
      text: code,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(code);
    }
  }, [code, currentLanguage]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            executeCode();
            break;
          case 'Escape':
            if (executionStatus === 'running') {
              cancelExecution();
            }
            break;
        }
      }
    };

    if (allowEdit) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [allowEdit, executeCode, cancelExecution, executionStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (executionIdRef.current) {
        enhancedErrorService.offFeedbackStateChange(executionIdRef.current);
        enhancedErrorService.cancelRetry(executionIdRef.current);
      }
    };
  }, []);

  return (
    <div className={`enhanced-live-code-block ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''} ${className}`}>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              {showLanguageSelector && (
                <select
                  value={currentLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                  className="px-2 py-1 text-xs border rounded"
                >
                  {availableLanguages.map(lang => (
                    <option key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              )}

              {/* Control Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                title="Copy code"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareCode}
                title="Share code"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Execution Controls and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={executeCode}
                disabled={executionStatus === 'running' || !code.trim()}
                className="flex items-center gap-2"
              >
                {executionStatus === 'running' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {executionStatus === 'running' ? 'Running...' : 'Run Code'}
              </Button>

              {executionStatus === 'running' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelExecution}
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Cancel
                </Button>
              )}

              <span className="text-sm text-muted-foreground">
                Ctrl+Enter to run • Ctrl+Esc to cancel
              </span>
            </div>

            {/* Enhanced Status Indicator */}
            <DetailedExecutionStatus
              status={executionStatus}
              executionTime={executionTime}
              language={currentLanguage}
              memoryUsage={memoryUsage}
              canCancel={executionStatus === 'running'}
              canRetry={processedError?.canRetry && executionStatus === 'error'}
              onCancel={cancelExecution}
              onRetry={handleRetry}
              showDetails={true}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className={`grid ${showOutput ? 'grid-cols-2' : 'grid-cols-1'} h-full`}>
            {/* Code Editor */}
            <div className="border-r">
              <div className="relative" style={{ height }}>
                {allowEdit ? (
                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-gray-900 text-gray-100 border-none outline-none resize-none"
                    placeholder={`Enter ${currentLanguage} code here...`}
                    spellCheck={false}
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-gray-900 text-gray-100 overflow-auto">
                    <pre className="whitespace-pre-wrap">{code}</pre>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Output Panel */}
            {showOutput && (
              <div className="flex flex-col" style={{ height }}>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="console">Console</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="errors">
                      Errors
                      {processedError && (
                        <Badge variant="destructive" className="ml-1 text-xs">
                          !
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="suggestions" disabled={!processedError?.suggestions?.length}>
                      Suggestions
                      {processedError?.suggestions?.length && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {processedError.suggestions.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="retry" disabled={!processedError?.canRetry}>
                      Retry
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-auto">
                    <TabsContent value="console" className="h-full m-0">
                      {executionResult && (
                        <CodeOutput
                          result={executionResult}
                          language={currentLanguage}
                          maxHeight="100%"
                          defaultTab="console"
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="preview" className="h-full m-0">
                      {executionResult && (
                        <CodeOutput
                          result={executionResult}
                          language={currentLanguage}
                          maxHeight="100%"
                          defaultTab="preview"
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="errors" className="h-full m-0 p-4">
                      {executionResult && (
                        <CodeOutput
                          result={executionResult}
                          language={currentLanguage}
                          maxHeight="100%"
                          defaultTab="errors"
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="suggestions" className="h-full m-0 p-4">
                      {processedError && (
                        <ErrorSuggestions
                          processedError={processedError}
                          onApplySuggestion={handleApplySuggestion}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="retry" className="h-full m-0 p-4">
                      {processedError && (
                        <RetryMechanism
                          retryState={retryState}
                          retryStrategy={retryStrategy}
                          onRetry={handleRetry}
                          onCancel={() => enhancedErrorService.cancelRetry(executionIdRef.current)}
                        />
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};