'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Database, 
  BarChart3, 
  Info, 
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Copy,
  Download
} from 'lucide-react';
import { CodeExecutionResult } from '@/lib/code-execution';

interface PythonDataInspectorProps {
  executionResult: CodeExecutionResult | null;
  onRefresh?: () => void;
  className?: string;
}

interface VariableInfo {
  name: string;
  type: string;
  value: string;
  shape?: string;
  size?: number;
  dtype?: string;
  memory?: string;
  preview?: string;
  isDataFrame?: boolean;
  isArray?: boolean;
  isPlot?: boolean;
}

export const PythonDataInspector: React.FC<PythonDataInspectorProps> = ({
  executionResult,
  onRefresh,
  className = ''
}) => {
  const [variables, setVariables] = useState<VariableInfo[]>([]);
  const [expandedVariables, setExpandedVariables] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'variables' | 'dataframes' | 'plots'>('variables');

  // Extract variable information from execution result
  useEffect(() => {
    if (!executionResult?.success || !executionResult.metadata) {
      setVariables([]);
      return;
    }

    // Parse variables from metadata if available
    const metadata = executionResult.metadata;
    const extractedVars: VariableInfo[] = [];

    // Check for DataFrames
    if (metadata.hasDataFrames) {
      extractedVars.push({
        name: 'DataFrame Variables',
        type: 'pandas.DataFrame',
        value: 'Multiple DataFrames detected',
        isDataFrame: true,
        preview: 'Use df.head() to preview data'
      });
    }

    // Check for plots
    if (metadata.hasPlots) {
      extractedVars.push({
        name: 'Matplotlib Figures',
        type: 'matplotlib.figure.Figure',
        value: 'Plot(s) generated',
        isPlot: true,
        preview: 'Visual output available in Preview tab'
      });
    }

    // Add loaded packages as "variables"
    if (metadata.loadedPackages && Array.isArray(metadata.loadedPackages)) {
      metadata.loadedPackages.forEach(pkg => {
        extractedVars.push({
          name: pkg,
          type: 'module',
          value: `Imported package: ${pkg}`,
          preview: `Available functions and classes from ${pkg}`
        });
      });
    }

    setVariables(extractedVars);
  }, [executionResult]);

  const toggleVariableExpansion = (varName: string) => {
    const newExpanded = new Set(expandedVariables);
    if (newExpanded.has(varName)) {
      newExpanded.delete(varName);
    } else {
      newExpanded.add(varName);
    }
    setExpandedVariables(newExpanded);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const generateInspectionCode = (varName: string, varType: string) => {
    if (varType.includes('DataFrame')) {
      return `# Inspect DataFrame
print(f"Shape: {${varName}.shape}")
print(f"Columns: {list(${varName}.columns)}")
print(f"Data types:\\n{${varName}.dtypes}")
print(f"Memory usage: {${varName}.memory_usage(deep=True).sum()} bytes")
print(f"\\nFirst 5 rows:")
print(${varName}.head())
print(f"\\nBasic statistics:")
print(${varName}.describe())`;
    } else if (varType.includes('ndarray') || varType.includes('array')) {
      return `# Inspect NumPy array
print(f"Shape: {${varName}.shape}")
print(f"Data type: {${varName}.dtype}")
print(f"Size: {${varName}.size}")
print(f"Memory usage: {${varName}.nbytes} bytes")
print(f"\\nArray preview:")
print(${varName})`;
    } else {
      return `# Inspect variable
print(f"Type: {type(${varName})}")
print(f"Value: {${varName}}")
if hasattr(${varName}, '__len__'):
    print(f"Length: {len(${varName})}")`;
    }
  };

  const renderVariableCard = (variable: VariableInfo) => {
    const isExpanded = expandedVariables.has(variable.name);
    
    return (
      <Card key={variable.name} className="mb-3">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
                onClick={() => toggleVariableExpansion(variable.name)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
              <div>
                <CardTitle className="text-base font-mono">{variable.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {variable.type}
                  </Badge>
                  {variable.shape && (
                    <Badge variant="secondary" className="text-xs">
                      Shape: {variable.shape}
                    </Badge>
                  )}
                  {variable.size && (
                    <Badge variant="secondary" className="text-xs">
                      Size: {variable.size}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
                onClick={() => copyToClipboard(generateInspectionCode(variable.name, variable.type))}
                title="Copy inspection code"
              >
                <Copy className="w-3 h-3" />
              </Button>
              {variable.isDataFrame && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto"
                  title="DataFrame operations"
                >
                  <Database className="w-3 h-3" />
                </Button>
              )}
              {variable.isPlot && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto"
                  title="Plot operations"
                >
                  <BarChart3 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">Value Preview</h4>
                <pre className="text-xs font-mono bg-card p-2 rounded border overflow-x-auto">
                  {variable.preview || variable.value}
                </pre>
              </div>
              
              {variable.isDataFrame && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">DataFrame Operations</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => copyToClipboard(`${variable.name}.head()`)}
                    >
                      .head()
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => copyToClipboard(`${variable.name}.info()`)}
                    >
                      .info()
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => copyToClipboard(`${variable.name}.describe()`)}
                    >
                      .describe()
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => copyToClipboard(`${variable.name}.shape`)}
                    >
                      .shape
                    </Button>
                  </div>
                </div>
              )}
              
              {variable.isArray && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Array Operations</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => copyToClipboard(`${variable.name}.shape`)}
                    >
                      .shape
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => copyToClipboard(`${variable.name}.dtype`)}
                    >
                      .dtype
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => copyToClipboard(`${variable.name}.mean()`)}
                    >
                      .mean()
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => copyToClipboard(`${variable.name}.std()`)}
                    >
                      .std()
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  const renderVariablesTab = () => {
    const regularVars = variables.filter(v => !v.isDataFrame && !v.isPlot);
    
    if (regularVars.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No variables detected</p>
          <p className="text-sm">Run your Python code to see variable information here</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {regularVars.map(renderVariableCard)}
      </div>
    );
  };

  const renderDataFramesTab = () => {
    const dataFrameVars = variables.filter(v => v.isDataFrame);
    
    if (dataFrameVars.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No DataFrames detected</p>
          <p className="text-sm">Create pandas DataFrames to see them here</p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(`import pandas as pd
df = pd.DataFrame({
    'A': [1, 2, 3, 4],
    'B': [5, 6, 7, 8],
    'C': ['x', 'y', 'z', 'w']
})
print(df)`)}
            >
              Insert Sample DataFrame Code
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {dataFrameVars.map(renderVariableCard)}
        
        {/* DataFrame helper tools */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">DataFrame Helper Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('df.head(10)')}
              >
                View First 10 Rows
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('df.tail(10)')}
              >
                View Last 10 Rows
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('df.info()')}
              >
                Data Info
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('df.describe()')}
              >
                Statistics
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('df.isnull().sum()')}
              >
                Missing Values
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('df.dtypes')}
              >
                Data Types
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPlotsTab = () => {
    const plotVars = variables.filter(v => v.isPlot);
    
    if (plotVars.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No plots detected</p>
          <p className="text-sm">Create matplotlib plots to see them here</p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(`import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, label='sin(x)')
plt.xlabel('X values')
plt.ylabel('Y values')
plt.title('Sine Wave')
plt.legend()
plt.grid(True)
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
        {plotVars.map(renderVariableCard)}
        
        {/* Plot helper tools */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plot Helper Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('plt.figure(figsize=(12, 8))')}
              >
                Set Figure Size
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('plt.savefig("plot.png", dpi=300, bbox_inches="tight")')}
              >
                Save Plot
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('plt.grid(True, alpha=0.3)')}
              >
                Add Grid
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('plt.legend()')}
              >
                Add Legend
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('plt.tight_layout()')}
              >
                Tight Layout
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('plt.close("all")')}
              >
                Close All Plots
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!executionResult) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No execution data</p>
            <p className="text-sm">Run your Python code to see variable information</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Data Inspector
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {variables.length} items
            </Badge>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <div className="px-6 pb-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="variables" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Variables
              </TabsTrigger>
              <TabsTrigger value="dataframes" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                DataFrames
              </TabsTrigger>
              <TabsTrigger value="plots" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Plots
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-6 pb-6 pt-4 max-h-96 overflow-y-auto">
            <TabsContent value="variables" className="mt-0">
              {renderVariablesTab()}
            </TabsContent>
            <TabsContent value="dataframes" className="mt-0">
              {renderDataFramesTab()}
            </TabsContent>
            <TabsContent value="plots" className="mt-0">
              {renderPlotsTab()}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};