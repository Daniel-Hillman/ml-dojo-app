'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Database, 
  Terminal, 
  AlertTriangle,
  Download,
  Maximize2,
  Copy,
  Eye,
  Info,
  Zap,
  TrendingUp
} from 'lucide-react';
import { CodeExecutionResult } from '@/lib/code-execution';

interface PythonOutputPanelProps {
  result: CodeExecutionResult;
  maxHeight?: string;
  className?: string;
}

export const PythonOutputPanel: React.FC<PythonOutputPanelProps> = ({
  result,
  maxHeight = '500px',
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (result.error) return 'errors';
    if (result.visualOutput && result.metadata?.hasPlots) return 'plots';
    if (result.visualOutput && result.metadata?.hasDataFrames) return 'data';
    return 'console';
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadContent = (content: string, filename: string, type: string = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openInNewWindow = (content: string) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(content);
      newWindow.document.close();
    }
  };

  // Determine available tabs
  const availableTabs = {
    console: Boolean(result.output),
    plots: Boolean(result.visualOutput && result.metadata?.hasPlots),
    data: Boolean(result.visualOutput && result.metadata?.hasDataFrames),
    errors: Boolean(result.error),
    info: Boolean(result.metadata)
  };

  const renderConsoleTab = () => {
    if (!result.output) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Terminal className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No console output</p>
          <p className="text-sm">Your Python code didn't produce any console output</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            <span className="font-medium">Console Output</span>
            <Badge variant="outline" className="text-xs">
              {result.output.split('\n').length} lines
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(result.output || '')}
              title="Copy output"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadContent(result.output || '', `python-output-${Date.now()}.txt`)}
              title="Download output"
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div 
          className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto border"
          style={{ maxHeight }}
        >
          <pre className="whitespace-pre-wrap leading-relaxed">
            {result.output.split('\n').map((line, idx) => (
              <div key={idx} className={`${
                line.includes('Error') || line.includes('Exception') ? 'text-red-400' :
                line.includes('Warning') ? 'text-yellow-400' :
                line.match(/^\d+/) ? 'text-blue-400' :
                line.includes('>>>') || line.includes('...') ? 'text-green-400' :
                'text-gray-100'
              }`}>
                {line || '\u00A0'}
              </div>
            ))}
          </pre>
        </div>
      </div>
    );
  };

  const renderPlotsTab = () => {
    if (!result.visualOutput || !result.metadata?.hasPlots) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No plots generated</p>
          <p className="text-sm">Use matplotlib to create visualizations</p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(`import matplotlib.pyplot as plt
import numpy as np

# Sample plot
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', linewidth=2, label='sin(x)')
plt.xlabel('X values')
plt.ylabel('Y values')
plt.title('Sample Sine Wave Plot')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()`)}
            >
              Insert Sample Plot Code
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="font-medium">Plots & Visualizations</span>
            <Badge variant="outline" className="text-xs">
              Interactive
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openInNewWindow(result.visualOutput || '')}
              title="Open in new window"
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadContent(result.visualOutput || '', `python-plots-${Date.now()}.html`, 'text/html')}
              title="Download plots"
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div 
          className="border rounded-lg overflow-auto bg-white relative plot-container"
          style={{ maxHeight }}
        >
          <div 
            className="p-4"
            dangerouslySetInnerHTML={{ __html: result.visualOutput }}
          />
          
          {/* Enhanced styling for plots */}
          <style jsx>{`
            .plot-container :global(img) {
              max-width: 100%;
              height: auto;
              border-radius: 0.375rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              margin: 1rem 0;
            }
            .plot-container :global(h4) {
              margin: 1.5rem 0 0.75rem 0;
              font-weight: 600;
              color: #374151;
              font-size: 1.1rem;
            }
            .plot-container :global(.space-y-4 > div) {
              margin-bottom: 2rem;
            }
          `}</style>
        </div>

        {/* Plot enhancement tools */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Plot Enhancement Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => copyToClipboard('plt.figure(figsize=(12, 8))')}
              >
                Larger Figure
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => copyToClipboard('plt.style.use("ggplot")')}
              >
                GGPlot Style
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => copyToClipboard('plt.grid(True, alpha=0.3)')}
              >
                Add Grid
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => copyToClipboard('plt.tight_layout()')}
              >
                Tight Layout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDataTab = () => {
    if (!result.visualOutput || !result.metadata?.hasDataFrames) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Database className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No data tables</p>
          <p className="text-sm">Create pandas DataFrames to see data visualizations</p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(`import pandas as pd
import numpy as np

# Sample DataFrame
df = pd.DataFrame({
    'Name': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
    'Age': [25, 30, 35, 28, 32],
    'City': ['New York', 'London', 'Tokyo', 'Paris', 'Sydney'],
    'Salary': [50000, 60000, 70000, 55000, 65000]
})

print("DataFrame created:")
print(df)
print("\\nBasic info:")
print(df.info())`)}
            >
              Insert Sample DataFrame Code
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span className="font-medium">Data Tables</span>
            <Badge variant="outline" className="text-xs">
              Pandas DataFrames
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(result.visualOutput || '')}
              title="Copy HTML"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadContent(result.visualOutput || '', `python-data-${Date.now()}.html`, 'text/html')}
              title="Download data tables"
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div 
          className="border rounded-lg overflow-auto bg-white relative data-container"
          style={{ maxHeight }}
        >
          <div 
            className="p-4"
            dangerouslySetInnerHTML={{ __html: result.visualOutput }}
          />
          
          {/* Enhanced styling for data tables */}
          <style jsx>{`
            .data-container :global(table) {
              width: 100%;
              border-collapse: collapse;
              margin: 1rem 0;
              font-size: 0.875rem;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }
            .data-container :global(th),
            .data-container :global(td) {
              padding: 0.75rem 0.5rem;
              text-align: left;
              border: 1px solid #e5e7eb;
            }
            .data-container :global(th) {
              background-color: #f8fafc;
              font-weight: 600;
              color: #374151;
              position: sticky;
              top: 0;
              z-index: 1;
            }
            .data-container :global(tr:nth-child(even)) {
              background-color: #f9fafb;
            }
            .data-container :global(tr:hover) {
              background-color: #f3f4f6;
            }
            .data-container :global(h4) {
              margin: 1.5rem 0 0.75rem 0;
              font-weight: 600;
              color: #374151;
              font-size: 1.1rem;
              padding: 0.5rem;
              background-color: #f8fafc;
              border-left: 4px solid #3b82f6;
            }
            .data-container :global(.space-y-4 > div) {
              margin-bottom: 2rem;
            }
          `}</style>
        </div>

        {/* Data analysis tools */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Data Analysis Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => copyToClipboard('df.groupby("column").mean()')}
              >
                Group By Mean
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => copyToClipboard('df.corr()')}
              >
                Correlation Matrix
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => copyToClipboard('df.value_counts()')}
              >
                Value Counts
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => copyToClipboard('df.pivot_table(values="value", index="index", columns="column")')}
              >
                Pivot Table
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderErrorsTab = () => {
    if (!result.error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Eye className="w-12 h-12 mb-4 opacity-50 text-green-500" />
          <p className="text-lg font-medium">No errors</p>
          <p className="text-sm">Your Python code executed successfully</p>
        </div>
      );
    }

    // Enhanced Python error parsing
    const parseError = (error: string) => {
      const lines = error.split('\n');
      const errorType = lines[0]?.match(/^(\w+Error|\w+Exception|\w+Warning)/)?.[1] || 'Error';
      const message = lines[0]?.replace(/^(\w+Error|\w+Exception|\w+Warning):\s*/, '') || error;
      const stackTrace = lines.slice(1).filter(line => line.trim());

      // Extract line numbers and file references
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

    const { errorType, message, stackTrace } = parseError(result.error);
    const isWarning = errorType.toLowerCase().includes('warning');
    const isSyntaxError = errorType.toLowerCase().includes('syntax');

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${isWarning ? 'text-yellow-500' : 'text-red-500'}`} />
          <span className={`font-medium ${isWarning ? 'text-yellow-800' : 'text-red-800'}`}>
            Python {isWarning ? 'Warning' : 'Error'}
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
        
        <div className={`${isWarning ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} rounded-lg p-4`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 ${isWarning ? 'text-yellow-500' : 'text-red-500'} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <h4 className={`font-medium ${isWarning ? 'text-yellow-800' : 'text-red-800'} mb-1`}>
                {errorType}
              </h4>
              <p className={`${isWarning ? 'text-yellow-700' : 'text-red-700'} text-sm leading-relaxed`}>
                {message}
              </p>
            </div>
          </div>
        </div>

        {stackTrace.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Stack Trace</h4>
            <div 
              className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-auto border"
              style={{ maxHeight: '200px' }}
            >
              <pre className="whitespace-pre-wrap leading-relaxed">
                {stackTrace.join('\n')}
              </pre>
            </div>
          </div>
        )}

        {/* Python-specific error suggestions */}
        {isSyntaxError && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                Python Syntax Help
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-blue-700 text-sm mb-3">
                Common Python syntax issues and fixes:
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Missing colon after if/for/def:</span>
                  <code className="bg-blue-100 px-2 py-1 rounded">if condition:</code>
                </div>
                <div className="flex justify-between">
                  <span>Incorrect indentation:</span>
                  <code className="bg-blue-100 px-2 py-1 rounded">Use 4 spaces</code>
                </div>
                <div className="flex justify-between">
                  <span>Unmatched parentheses:</span>
                  <code className="bg-blue-100 px-2 py-1 rounded">print("hello")</code>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderInfoTab = () => {
    const metadata = result.metadata || {};
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span className="font-medium">Execution Information</span>
        </div>

        {/* Execution stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800 text-sm">Execution Time</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{result.executionTime}ms</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800 text-sm">Memory Usage</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {result.memoryUsage ? `${(result.memoryUsage / 1024 / 1024).toFixed(1)}MB` : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Python-specific info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Python Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Python Version:</span>
                <Badge variant="outline" className="text-xs">
                  {metadata.pythonVersion || 'Pyodide'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Loaded Packages:</span>
                <span className="text-xs">
                  {metadata.loadedPackages?.length || 0} packages
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Has DataFrames:</span>
                <Badge variant={metadata.hasDataFrames ? "default" : "secondary"} className="text-xs">
                  {metadata.hasDataFrames ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Has Plots:</span>
                <Badge variant={metadata.hasPlots ? "default" : "secondary"} className="text-xs">
                  {metadata.hasPlots ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loaded packages */}
        {metadata.loadedPackages && metadata.loadedPackages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loaded Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {metadata.loadedPackages.map((pkg: string) => (
                  <Badge key={pkg} variant="outline" className="text-xs">
                    {pkg}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Python Output</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
              {result.success ? 'Success' : 'Error'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {result.executionTime}ms
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pb-0">
            <TabsList className="grid w-full grid-cols-5 h-10">
              {availableTabs.console && (
                <TabsTrigger value="console" className="flex items-center gap-1 text-xs px-2">
                  <Terminal className="w-3 h-3" />
                  Console
                </TabsTrigger>
              )}
              {availableTabs.plots && (
                <TabsTrigger value="plots" className="flex items-center gap-1 text-xs px-2">
                  <BarChart3 className="w-3 h-3" />
                  Plots
                </TabsTrigger>
              )}
              {availableTabs.data && (
                <TabsTrigger value="data" className="flex items-center gap-1 text-xs px-2">
                  <Database className="w-3 h-3" />
                  Data
                </TabsTrigger>
              )}
              {availableTabs.errors && (
                <TabsTrigger value="errors" className="flex items-center gap-1 text-xs px-2">
                  <AlertTriangle className="w-3 h-3" />
                  Errors
                </TabsTrigger>
              )}
              {availableTabs.info && (
                <TabsTrigger value="info" className="flex items-center gap-1 text-xs px-2">
                  <Info className="w-3 h-3" />
                  Info
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
            {availableTabs.plots && (
              <TabsContent value="plots" className="mt-0">
                {renderPlotsTab()}
              </TabsContent>
            )}
            {availableTabs.data && (
              <TabsContent value="data" className="mt-0">
                {renderDataTab()}
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