'use client';

import React, { useState } from 'react';
import { CodeExecutionResult, SupportedLanguage } from '@/lib/code-execution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Eye, Terminal, AlertTriangle, Code, BarChart3, Info, Copy, Download, Maximize2 } from 'lucide-react';

interface CodeOutputProps {
  result: CodeExecutionResult;
  language: SupportedLanguage;
  maxHeight?: string;
  showMetadata?: boolean;
  defaultTab?: 'console' | 'preview' | 'errors' | 'info';
  className?: string;
}

export const CodeOutput: React.FC<CodeOutputProps> = ({
  result,
  language,
  maxHeight = '400px',
  showMetadata = true,
  defaultTab,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (defaultTab) return defaultTab;
    if (result.error) return 'errors';
    if (result.visualOutput) return 'preview';
    return 'console';
  });

  // Determine which tabs should be available
  const availableTabs = {
    console: Boolean(result.output),
    preview: Boolean(result.visualOutput),
    errors: Boolean(result.error),
    info: showMetadata
  };
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatMemory = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${mb.toFixed(1)}MB`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadOutput = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderStatusBadge = () => (
    <Badge 
      variant={result.success ? "default" : "destructive"}
      className="flex items-center gap-1"
    >
      {result.success ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <AlertCircle className="w-3 h-3" />
      )}
      {result.success ? 'Success' : 'Error'}
    </Badge>
  );

  const renderExecutionTime = () => (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <Clock className="w-3 h-3" />
      {formatTime(result.executionTime)}
    </div>
  );

  const renderConsoleTab = () => {
    if (!result.output) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Terminal className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No console output</p>
          <p className="text-sm">Your code didn't produce any console output</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            <span className="font-medium">Console Output</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {result.output.split('\n').length} lines
            </Badge>
            <button
              onClick={() => copyToClipboard(result.output || '')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy output"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={() => downloadOutput(result.output || '', `output-${Date.now()}.txt`)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Download output"
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div 
          className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg font-mono text-xs sm:text-sm overflow-auto border relative group"
          style={{ maxHeight }}
        >
          <pre className="whitespace-pre-wrap leading-relaxed">{result.output}</pre>
        </div>
      </div>
    );
  };

  const renderPreviewTab = () => {
    if (!result.visualOutput) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Eye className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No visual output</p>
          <p className="text-sm">Your code didn't generate any visual content</p>
        </div>
      );
    }

    // For web languages, show iframe preview
    if (['html', 'css', 'javascript', 'typescript'].includes(language)) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="font-medium">Live Preview</span>
              <Badge variant="outline" className="text-xs">Interactive</Badge>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const iframe = document.querySelector('iframe[title="Code Preview"]') as HTMLIFrameElement;
                  if (iframe) {
                    const newWindow = window.open('', '_blank');
                    if (newWindow) {
                      newWindow.document.write(result.visualOutput || '');
                      newWindow.document.close();
                    }
                  }
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Open in new window"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => downloadOutput(result.visualOutput || '', `preview-${Date.now()}.html`)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Download HTML"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div 
            className="border rounded-lg overflow-hidden bg-white relative group"
            style={{ height: maxHeight }}
          >
            <iframe
              srcDoc={result.visualOutput}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              title="Code Preview"
              loading="lazy"
            />
            {/* Loading overlay */}
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                Interactive Preview
              </div>
            </div>
          </div>
        </div>
      );
    }

    // For other visual output (plots, charts, data tables, etc.)
    const hasPlots = result.metadata?.hasPlots;
    const hasDataFrames = result.metadata?.hasDataFrames;
    
    let visualTitle = 'Visual Output';
    if (hasPlots && hasDataFrames) {
      visualTitle = 'Data & Visualizations';
    } else if (hasPlots) {
      visualTitle = 'Plots & Charts';
    } else if (hasDataFrames) {
      visualTitle = 'Data Tables';
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="font-medium">{visualTitle}</span>
            {hasPlots && (
              <Badge variant="outline" className="text-xs">
                Interactive
              </Badge>
            )}
            {hasDataFrames && (
              <Badge variant="outline" className="text-xs">
                Data
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(result.visualOutput || '')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy HTML"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={() => downloadOutput(result.visualOutput || '', `visualization-${Date.now()}.html`)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Download visualization"
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div 
          className="border rounded-lg overflow-auto bg-white relative ml-visualization-container"
          style={{ maxHeight }}
        >
          <div 
            className="p-4"
            dangerouslySetInnerHTML={{ __html: result.visualOutput }}
          />
          {/* Add custom styles for better data table rendering */}
          <style jsx>{`
            .ml-visualization-container :global(table) {
              width: 100%;
              border-collapse: collapse;
              margin: 1rem 0;
              font-size: 0.875rem;
            }
            .ml-visualization-container :global(th),
            .ml-visualization-container :global(td) {
              padding: 0.5rem;
              text-align: left;
              border: 1px solid #e5e7eb;
            }
            .ml-visualization-container :global(th) {
              background-color: #f9fafb;
              font-weight: 600;
            }
            .ml-visualization-container :global(tr:nth-child(even)) {
              background-color: #f9fafb;
            }
            .ml-visualization-container :global(img) {
              max-width: 100%;
              height: auto;
              border-radius: 0.375rem;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }
            .ml-visualization-container :global(h4) {
              margin: 1rem 0 0.5rem 0;
              font-weight: 600;
              color: #374151;
            }
          `}</style>
        </div>
      </div>
    );
  };

  const renderErrorsTab = () => {
    if (!result.error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mb-4 opacity-50 text-green-500" />
          <p className="text-lg font-medium">No errors</p>
          <p className="text-sm">Your code executed successfully without errors</p>
        </div>
      );
    }

    // Enhanced error parsing and formatting with syntax highlighting
    const parseError = (error: string) => {
      const lines = error.split('\n');
      const errorType = lines[0]?.match(/^(\w+Error|\w+Exception|\w+Warning)/)?.[1] || 'Error';
      const message = lines[0]?.replace(/^(\w+Error|\w+Exception|\w+Warning):\s*/, '') || error;
      const stackTrace = lines.slice(1).filter(line => line.trim());

      // Extract line numbers and file references for better highlighting
      const lineNumberMatches = error.match(/line (\d+)/gi) || [];
      const fileMatches = error.match(/File "([^"]+)"/gi) || [];

      return { 
        errorType, 
        message, 
        stackTrace, 
        lineNumbers: lineNumberMatches,
        files: fileMatches 
      };
    };

    const { errorType, message, stackTrace, lineNumbers, files } = parseError(result.error);

    // Determine error severity for styling
    const isWarning = errorType.toLowerCase().includes('warning');
    const isSyntaxError = errorType.toLowerCase().includes('syntax');
    
    const errorColorClass = isWarning ? 'yellow' : 'red';
    const errorBgClass = isWarning ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
    const errorTextClass = isWarning ? 'text-yellow-700' : 'text-red-700';
    const errorHeaderClass = isWarning ? 'text-yellow-800' : 'text-red-800';

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${isWarning ? 'text-yellow-500' : 'text-red-500'}`} />
          <span className={`font-medium ${errorHeaderClass}`}>
            {isWarning ? 'Warning' : 'Execution Error'}
          </span>
          <Badge variant={isWarning ? "secondary" : "destructive"} className="text-xs">
            {errorType}
          </Badge>
          {isSyntaxError && (
            <Badge variant="outline" className="text-xs">
              Syntax Issue
            </Badge>
          )}
        </div>
        
        {/* Error message with enhanced formatting */}
        <div className={`${errorBgClass} rounded-lg p-3 sm:p-4`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${isWarning ? 'text-yellow-500' : 'text-red-500'} mt-0.5 flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium ${errorHeaderClass} mb-1 text-sm sm:text-base`}>
                {errorType}
              </h4>
              <p className={`${errorTextClass} text-xs sm:text-sm leading-relaxed break-words`}>
                {message}
              </p>
              
              {/* Show line numbers and files if available */}
              {(lineNumbers.length > 0 || files.length > 0) && (
                <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {lineNumbers.map((lineNum, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {lineNum}
                      </Badge>
                    ))}
                    {files.map((file, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs font-mono">
                        {file.replace(/File "([^"]+)"/, '$1')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stack trace with syntax highlighting */}
        {stackTrace.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Stack Trace</h4>
            <div 
              className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg font-mono text-xs overflow-auto border"
              style={{ maxHeight }}
            >
              <pre className="whitespace-pre-wrap leading-relaxed">
                {stackTrace.map((line, idx) => {
                  // Highlight file paths and line numbers in stack trace
                  const highlightedLine = line
                    .replace(/(File "([^"]+)")/g, '<span class="text-blue-300">$1</span>')
                    .replace(/(line \d+)/gi, '<span class="text-yellow-300">$1</span>')
                    .replace(/(\^+)/g, '<span class="text-red-400">$1</span>');
                  
                  return (
                    <div 
                      key={idx} 
                      dangerouslySetInnerHTML={{ __html: highlightedLine }}
                      className="mb-1"
                    />
                  );
                })}
              </pre>
            </div>
          </div>
        )}

        {/* Error suggestions for common issues */}
        {isSyntaxError && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-800 mb-1 text-sm">Suggestion</h4>
                <p className="text-blue-700 text-xs sm:text-sm">
                  Check for missing brackets, quotes, or semicolons. Make sure your syntax matches the language requirements.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInfoTab = () => {
    const metadata = result.metadata || {};
    const hasMetadata = Object.keys(metadata).length > 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span className="font-medium">Execution Information</span>
        </div>

        {/* Basic execution stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              <span className="font-medium text-blue-800 text-sm sm:text-base">Execution Time</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-blue-900">{formatTime(result.executionTime)}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              <span className="font-medium text-green-800 text-sm sm:text-base">Memory Usage</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-900">{formatMemory(result.memoryUsage)}</p>
          </div>
        </div>

        {/* Language and session info */}
        <div className="bg-gray-50 border rounded-lg p-3 sm:p-4">
          <h4 className="font-medium text-gray-800 mb-3 text-sm sm:text-base">Session Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Language:</span>
              <Badge variant="outline" className="text-xs">{language}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status:</span>
              <div className="scale-90 sm:scale-100">{renderStatusBadge()}</div>
            </div>
            {result.sessionId && (
              <div className="flex justify-between items-center sm:col-span-2">
                <span className="text-gray-600">Session ID:</span>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                  {result.sessionId.slice(0, 8)}...
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Additional metadata */}
        {hasMetadata && (
          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Additional Information</h4>
            <div className="space-y-2 text-sm">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                  </span>
                  <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                    {String(value)}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // If no tabs are available, show empty state
  const hasAnyOutput = Object.values(availableTabs).some(Boolean);
  
  if (!hasAnyOutput) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No output generated</p>
            <p className="text-sm">Run your code to see results here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg">Execution Result</CardTitle>
          <div className="flex items-center gap-3">
            {renderStatusBadge()}
            {renderExecutionTime()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-3 sm:px-6 pb-0">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:grid-cols-none lg:flex h-8 sm:h-10 gap-0.5 sm:gap-1">
              {availableTabs.console && (
                <TabsTrigger 
                  value="console" 
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                >
                  <Terminal className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline truncate">Console</span>
                  <span className="xs:hidden sm:hidden">C</span>
                </TabsTrigger>
              )}
              {availableTabs.preview && (
                <TabsTrigger 
                  value="preview" 
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline truncate">Preview</span>
                  <span className="xs:hidden sm:hidden">P</span>
                </TabsTrigger>
              )}
              {availableTabs.errors && (
                <TabsTrigger 
                  value="errors" 
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                >
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline truncate">Errors</span>
                  <span className="xs:hidden sm:hidden">E</span>
                </TabsTrigger>
              )}
              {availableTabs.info && (
                <TabsTrigger 
                  value="info" 
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                >
                  <Info className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline truncate">Info</span>
                  <span className="xs:hidden sm:hidden">I</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="px-6 pb-6 pt-4">
            {availableTabs.console && (
              <TabsContent value="console" className="mt-0">
                {renderConsoleTab()}
              </TabsContent>
            )}
            {availableTabs.preview && (
              <TabsContent value="preview" className="mt-0">
                {renderPreviewTab()}
              </TabsContent>
            )}
            {availableTabs.errors && (
              <TabsContent value="errors" className="mt-0">
                {renderErrorsTab()}
              </TabsContent>
            )}
            {availableTabs.info && (
              <TabsContent value="info" className="mt-0">
                {renderInfoTab()}
              </TabsContent>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};