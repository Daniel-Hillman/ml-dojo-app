'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  RotateCcw,
  Settings,
  Maximize2,
  Minimize2,
  Code2 as PythonIcon
} from 'lucide-react';
import { 
  codeExecutor, 
  CodeExecutionResult 
} from '@/lib/code-execution';
import { PythonCodeEditor } from './PythonCodeEditor';
import { PythonDataInspector } from './PythonDataInspector';
import { PythonOutputPanel } from './PythonOutputPanel';

interface PythonIDEProps {
  initialCode?: string;
  height?: string;
  showDataInspector?: boolean;
  className?: string;
  onCodeChange?: (code: string) => void;
  onExecutionComplete?: (result: CodeExecutionResult) => void;
}

export const PythonIDE: React.FC<PythonIDEProps> = ({
  initialCode = '',
  height = '600px',
  showDataInspector = true,
  className = '',
  onCodeChange,
  onExecutionComplete
}) => {
  const [code, setCode] = useState(initialCode);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionId] = useState(() => `python_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Handle code changes
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    onCodeChange?.(newCode);
  }, [onCodeChange]);

  // Execute Python code
  const executeCode = useCallback(async () => {
    if (!code.trim() || isExecuting) return;

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const result = await codeExecutor.execute({
        code,
        language: 'python',
        sessionId,
        options: {
          timeout: 30000,
          packages: ['numpy', 'pandas', 'matplotlib', 'scikit-learn', 'scipy']
        }
      });

      setExecutionResult(result);
      onExecutionComplete?.(result);

    } catch (error) {
      const errorResult: CodeExecutionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: 0
      };
      setExecutionResult(errorResult);
    } finally {
      setIsExecuting(false);
    }
  }, [code, sessionId, isExecuting, onExecutionComplete]);

  // Stop execution (placeholder - actual implementation would need to be in the engine)
  const stopExecution = useCallback(() => {
    setIsExecuting(false);
    // In a real implementation, this would cancel the execution
  }, []);

  // Reset session
  const resetSession = useCallback(async () => {
    try {
      const engine = (codeExecutor as any).engines?.get('pyodide');
      if (engine && typeof engine.cleanup === 'function') {
        await engine.cleanup();
      }
      setExecutionResult(null);
    } catch (error) {
      console.error('Failed to reset session:', error);
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            executeCode();
            break;
          case 'r':
            e.preventDefault();
            resetSession();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [executeCode, resetSession]);

  const renderExecutionStatus = () => {
    if (isExecuting) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 animate-pulse">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
          Executing...
        </Badge>
      );
    }

    if (executionResult) {
      return (
        <Badge 
          variant={executionResult.success ? "default" : "destructive"}
          className="flex items-center gap-1"
        >
          <div className={`w-2 h-2 rounded-full ${
            executionResult.success ? 'bg-green-500' : 'bg-red-500'
          }`} />
          {executionResult.success ? 'Success' : 'Error'}
          <span className="text-xs ml-1">
            ({executionResult.executionTime}ms)
          </span>
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full" />
        Ready
      </Badge>
    );
  };

  return (
    <div className={`python-ide ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''} ${className}`}>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <PythonIcon className="w-5 h-5 text-blue-600" />
              Python IDE
              <Badge variant="outline" className="text-xs">
                Pyodide
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-3">
              {renderExecutionStatus()}
              <div className="flex items-center gap-1">
                <Button
                  onClick={isExecuting ? stopExecution : executeCode}
                  disabled={!code.trim()}
                  variant={isExecuting ? "destructive" : "default"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isExecuting ? (
                    <>
                      <Square className="w-4 h-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSession}
                  title="Reset Python session"
                >
                  <RotateCcw className="w-4 h-4" />
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
          </div>
          
          <div className="text-sm text-muted-foreground">
            Enhanced Python environment with ML libraries, data inspection, and visualization tools
            <span className="ml-2">• Ctrl+Enter to run • Ctrl+R to reset</span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">
            {/* Code Editor - Takes up 2/3 on large screens */}
            <div className="lg:col-span-2 border-r">
              <PythonCodeEditor
                code={code}
                onCodeChange={handleCodeChange}
                height={height}
                className="h-full"
              />
            </div>

            {/* Right Panel - Output and Data Inspector */}
            <div className="flex flex-col h-full">
              {/* Output Panel */}
              <div className="flex-1 border-b">
                {executionResult ? (
                  <PythonOutputPanel
                    result={executionResult}
                    maxHeight="300px"
                    className="h-full"
                  />
                ) : (
                  <Card className="h-full">
                    <CardContent className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <PythonIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Ready to execute</p>
                        <p className="text-sm">Run your Python code to see results</p>
                        <div className="mt-4 space-y-2 text-xs">
                          <p>✓ NumPy, Pandas, Matplotlib</p>
                          <p>✓ Scikit-learn, SciPy</p>
                          <p>✓ Data visualization & ML support</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Data Inspector */}
              {showDataInspector && (
                <div className="flex-1">
                  <PythonDataInspector
                    executionResult={executionResult}
                    onRefresh={executeCode}
                    className="h-full"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen overlay styles */}
      {isFullscreen && (
        <style jsx global>{`
          body {
            overflow: hidden;
          }
        `}</style>
      )}
    </div>
  );
};