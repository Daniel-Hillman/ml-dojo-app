'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedLiveCodeBlock } from '@/components/EnhancedLiveCodeBlock';
import { enhancedErrorService } from '@/lib/code-execution/enhanced-error-service';
import { errorHandler } from '@/lib/code-execution/error-handler';
import { 
  AlertTriangle, 
  CheckCircle, 
  BarChart3, 
  RefreshCw,
  Bug,
  Zap,
  Clock,
  Shield
} from 'lucide-react';

const errorExamples = {
  javascript: {
    syntax: `// Syntax Error Example
console.log("Hello World"
// Missing closing parenthesis`,
    
    runtime: `// Runtime Error Example
let obj = null;
console.log(obj.property); // Cannot read property of null`,
    
    reference: `// Reference Error Example
console.log(undefinedVariable); // Variable not defined`,
    
    type: `// Type Error Example
let num = 42;
num.toUpperCase(); // toUpperCase is not a function`,
    
    timeout: `// Timeout Error Example (infinite loop)
while (true) {
  console.log("This will timeout");
}`
  },
  
  python: {
    syntax: `# Syntax Error Example
print("Hello World"
# Missing closing parenthesis`,
    
    indentation: `# Indentation Error Example
if True:
print("This should be indented")`,
    
    name: `# Name Error Example
print(undefined_variable)  # Variable not defined`,
    
    type: `# Type Error Example
num = 42
num.upper()  # 'int' object has no attribute 'upper'`,
    
    import: `# Import Error Example
import nonexistent_module`
  },
  
  sql: {
    table: `-- Table Not Found Error
SELECT * FROM nonexistent_table;`,
    
    column: `-- Column Not Found Error
CREATE TABLE users (id INTEGER, name TEXT);
SELECT nonexistent_column FROM users;`,
    
    syntax: `-- Syntax Error Example
SELCT * FROM users;  -- Typo in SELECT`
  }
};

export default function TestErrorHandlingPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'python' | 'sql'>('javascript');
  const [selectedExample, setSelectedExample] = useState<string>('syntax');
  const [analytics, setAnalytics] = useState(errorHandler.getErrorAnalytics());

  const refreshAnalytics = () => {
    setAnalytics(errorHandler.getErrorAnalytics());
  };

  const clearAnalytics = () => {
    localStorage.removeItem('code_execution_errors');
    setAnalytics(errorHandler.getErrorAnalytics());
  };

  const getCurrentCode = () => {
    const examples = errorExamples[selectedLanguage] as Record<string, string>;
    return examples[selectedExample] || examples[Object.keys(examples)[0]];
  };

  const getExampleOptions = () => {
    return Object.keys(errorExamples[selectedLanguage]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Error Handling & User Feedback Test</h1>
        <p className="text-muted-foreground">
          Test comprehensive error handling, user feedback, retry mechanisms, and progress indicators
        </p>
      </div>

      {/* Error Analytics Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Error Analytics Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={refreshAnalytics}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={clearAnalytics}>
                Clear Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalErrors}</div>
              <div className="text-sm text-blue-800">Total Errors</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(analytics.successRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-green-800">Success Rate</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{analytics.retryableErrors}</div>
              <div className="text-sm text-orange-800">Retryable Errors</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.averageSuggestions.toFixed(1)}
              </div>
              <div className="text-sm text-purple-800">Avg Suggestions</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Errors by Type */}
            <div>
              <h4 className="font-medium mb-2">Errors by Type</h4>
              <div className="space-y-1">
                {Object.entries(analytics.errorsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center text-sm">
                    <span className="capitalize">{type}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Errors by Language */}
            <div>
              <h4 className="font-medium mb-2">Errors by Language</h4>
              <div className="space-y-1">
                {Object.entries(analytics.errorsByLanguage).map(([lang, count]) => (
                  <div key={lang} className="flex justify-between items-center text-sm">
                    <span className="capitalize">{lang}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Errors by Severity */}
            <div>
              <h4 className="font-medium mb-2">Errors by Severity</h4>
              <div className="space-y-1">
                {Object.entries(analytics.errorsBySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between items-center text-sm">
                    <span className="capitalize">{severity}</span>
                    <Badge 
                      variant={severity === 'critical' ? 'destructive' : 'outline'}
                    >
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Error Examples
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Language:</label>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value as any);
                  setSelectedExample(Object.keys(errorExamples[e.target.value as keyof typeof errorExamples])[0]);
                }}
                className="px-2 py-1 text-sm border rounded"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="sql">SQL</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Error Type:</label>
              <select
                value={selectedExample}
                onChange={(e) => setSelectedExample(e.target.value)}
                className="px-2 py-1 text-sm border rounded"
              >
                {getExampleOptions().map(option => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)} Error
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EnhancedLiveCodeBlock
            initialCode={getCurrentCode()}
            language={selectedLanguage}
            height="500px"
            enableErrorHandling={true}
            enableRetry={true}
            showProgress={true}
            showSuggestions={true}
            onExecutionComplete={(result) => {
              console.log('Execution completed:', result);
              // Refresh analytics after execution
              setTimeout(refreshAnalytics, 1000);
            }}
          />
        </CardContent>
      </Card>

      {/* Feature Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <h3 className="font-medium mb-1">Error Detection</h3>
            <p className="text-xs text-muted-foreground">
              Comprehensive error classification and user-friendly messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <h3 className="font-medium mb-1">Smart Suggestions</h3>
            <p className="text-xs text-muted-foreground">
              Context-aware suggestions with code examples and fixes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <h3 className="font-medium mb-1">Retry Mechanism</h3>
            <p className="text-xs text-muted-foreground">
              Automatic and manual retry with exponential backoff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <h3 className="font-medium mb-1">Progress Tracking</h3>
            <p className="text-xs text-muted-foreground">
              Real-time execution status and progress indicators
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Testing Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">How to Test Error Handling:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Select a language and error type from the dropdowns above</li>
                <li>Click "Run Code" to trigger the error</li>
                <li>Observe the error detection, status indicators, and user feedback</li>
                <li>Check the "Errors" tab for detailed error information</li>
                <li>View the "Suggestions" tab for contextual help and fixes</li>
                <li>Use the "Retry" tab to test automatic and manual retry mechanisms</li>
                <li>Monitor the analytics dashboard to see error patterns</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">Features to Test:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Error classification and severity</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>User-friendly error messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Contextual suggestions and fixes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Automatic retry with backoff</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Manual retry mechanisms</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Execution progress indicators</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Error analytics and tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Performance metrics collection</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}