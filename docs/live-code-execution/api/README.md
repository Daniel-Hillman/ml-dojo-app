# API Reference

## Core Executor

### `codeExecutor.execute(request: CodeExecutionRequest)`

Executes code in the specified language and returns the result.

#### Parameters

```typescript
interface CodeExecutionRequest {
  code: string;                    // The code to execute
  language: SupportedLanguage;     // Programming language
  sessionId?: string;              // Optional session identifier
  options?: ExecutionOptions;      // Execution configuration
}

interface ExecutionOptions {
  timeout?: number;                // Execution timeout in milliseconds
  memoryLimit?: number;            // Memory limit in bytes
  packages?: string[];             // Additional packages to load (Python)
  allowNetworkAccess?: boolean;    // Allow network requests (disabled by default)
}
```

#### Returns

```typescript
interface CodeExecutionResult {
  success: boolean;                // Whether execution succeeded
  output?: string;                 // Standard output
  error?: string;                  // Error message if failed
  visualOutput?: string;           // HTML output for visualization
  executionTime: number;           // Execution time in milliseconds
  sessionId: string;               // Session identifier
  metadata?: ExecutionMetadata;    // Additional execution metadata
}

interface ExecutionMetadata {
  language: string;
  codeSize: number;
  hasInteractivity?: boolean;
  hasPlots?: boolean;
  loadedPackages?: string[];
  memoryUsage?: number;
}
```

#### Example

```typescript
const result = await codeExecutor.execute({
  code: `
    import matplotlib.pyplot as plt
    import numpy as np
    
    x = np.linspace(0, 10, 100)
    y = np.sin(x)
    
    plt.plot(x, y)
    plt.title('Sine Wave')
    plt.show()
  `,
  language: 'python',
  sessionId: 'data-viz-session',
  options: {
    timeout: 30000,
    packages: ['matplotlib', 'numpy']
  }
});

if (result.success) {
  console.log('Output:', result.output);
  console.log('Plot HTML:', result.visualOutput);
} else {
  console.error('Error:', result.error);
}
```

## Language Engines

### WebExecutionEngine

Executes HTML, CSS, and JavaScript code in a sandboxed iframe.

```typescript
const webEngine = new WebExecutionEngine();

// Execute HTML with CSS and JavaScript
const result = await webEngine.execute({
  code: `
    <div style="padding: 20px; background: #f0f0f0;">
      <h1>Interactive Demo</h1>
      <button onclick="alert('Hello!')">Click Me</button>
    </div>
  `,
  language: 'html'
});
```

### PythonExecutionEngine

Executes Python code using Pyodide WebAssembly runtime.

```typescript
const pythonEngine = new PythonExecutionEngine();

// Execute Python with data science libraries
const result = await pythonEngine.execute({
  code: `
    import pandas as pd
    
    data = {'name': ['Alice', 'Bob'], 'age': [25, 30]}
    df = pd.DataFrame(data)
    print(df)
  `,
  language: 'python',
  options: {
    packages: ['pandas']
  }
});
```

### SqlExecutionEngine

Executes SQL queries using SQLite in the browser.

```typescript
const sqlEngine = new SqlExecutionEngine();

// Execute SQL queries
const result = await sqlEngine.execute({
  code: `
    CREATE TABLE users (id INTEGER, name TEXT);
    INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob');
    SELECT * FROM users;
  `,
  language: 'sql'
});
```

## Components

### LiveCodeBlock

Interactive code editor with execution capabilities.

```typescript
interface LiveCodeBlockProps {
  initialCode?: string;            // Initial code content
  language?: SupportedLanguage;    // Programming language
  showLineNumbers?: boolean;       // Show line numbers
  allowLanguageChange?: boolean;   // Allow language switching
  readOnly?: boolean;              // Read-only mode
  theme?: 'light' | 'dark';       // Editor theme
  onCodeChange?: (code: string) => void;
  onExecute?: (result: CodeExecutionResult) => void;
  className?: string;
}

// Usage
<LiveCodeBlock
  initialCode="console.log('Hello, World!');"
  language="javascript"
  showLineNumbers={true}
  allowLanguageChange={true}
  onExecute={(result) => console.log(result)}
/>
```

### CodeOutput

Displays execution results with formatted output.

```typescript
interface CodeOutputProps {
  result: CodeExecutionResult;     // Execution result to display
  showMetadata?: boolean;          // Show execution metadata
  maxHeight?: string;              // Maximum output height
  className?: string;
}

// Usage
<CodeOutput
  result={executionResult}
  showMetadata={true}
  maxHeight="400px"
/>
```

## Utilities

### Session Management

```typescript
import { sessionManager } from '@/lib/code-execution/session-manager';

// Create a new session
const sessionId = await sessionManager.createSession({
  code: 'print("Hello")',
  language: 'python',
  userId: 'user-123'
});

// Get session data
const session = await sessionManager.getSession(sessionId);

// Update session
await sessionManager.updateSession(sessionId, {
  code: 'print("Updated code")'
});

// Delete session
await sessionManager.deleteSession(sessionId);
```

### Error Handling

```typescript
import { errorHandler } from '@/lib/code-execution/error-handler';

// Process execution errors
const processedError = errorHandler.processError(
  new Error('Syntax error'),
  {
    language: 'python',
    code: 'print("Hello"',
    line: 1,
    column: 15
  }
);

console.log(processedError.userFriendlyMessage);
console.log(processedError.suggestions);
```

### Performance Metrics

```typescript
import { performanceMetrics } from '@/lib/code-execution/performance-metrics';

// Start tracking execution
performanceMetrics.startExecution('exec-123', 'python', 150);

// End tracking
const metrics = performanceMetrics.endExecution('exec-123', true, 50);

// Get performance trends
const trends = performanceMetrics.getPerformanceTrends('python');
```

## Configuration

### Language Configuration

```typescript
import { configureLanguage } from '@/lib/code-execution/config';

// Configure Python
configureLanguage('python', {
  timeout: 60000,
  memoryLimit: 200 * 1024 * 1024,
  packages: ['numpy', 'pandas', 'matplotlib', 'scikit-learn'],
  enablePlotting: true
});

// Configure JavaScript
configureLanguage('javascript', {
  timeout: 10000,
  memoryLimit: 50 * 1024 * 1024,
  allowConsoleAccess: true
});
```

### Security Configuration

```typescript
import { configureSecurity } from '@/lib/code-execution/security';

configureSecurity({
  enableSandboxing: true,
  blockNetworkAccess: true,
  maxConcurrentExecutions: 5,
  resourceLimits: {
    memory: 100 * 1024 * 1024,
    cpu: 30000,
    execution: 60000
  }
});
```

## Events

### Execution Events

```typescript
import { executionEvents } from '@/lib/code-execution/events';

// Listen for execution start
executionEvents.on('executionStart', (data) => {
  console.log('Execution started:', data.sessionId);
});

// Listen for execution complete
executionEvents.on('executionComplete', (data) => {
  console.log('Execution completed:', data.result);
});

// Listen for execution error
executionEvents.on('executionError', (data) => {
  console.error('Execution error:', data.error);
});
```

## Types

### Core Types

```typescript
type SupportedLanguage = 
  | 'javascript' 
  | 'typescript' 
  | 'python' 
  | 'sql' 
  | 'html' 
  | 'css' 
  | 'json' 
  | 'yaml' 
  | 'markdown' 
  | 'regex';

interface ExecutionEngine {
  name: string;
  supportedLanguages: SupportedLanguage[];
  execute(request: CodeExecutionRequest): Promise<CodeExecutionResult>;
  validateCode(code: string): Promise<boolean>;
  cleanup(sessionId?: string): Promise<void>;
}
```

### Error Types

```typescript
interface ProcessedError {
  originalError: Error;
  userFriendlyMessage: string;
  suggestions: string[];
  category: 'syntax' | 'runtime' | 'timeout' | 'memory' | 'security';
  severity: 'error' | 'warning' | 'info';
}
```

### Performance Types

```typescript
interface PerformanceMetrics {
  executionId: string;
  language: string;
  startTime: number;
  endTime: number;
  duration: number;
  codeSize: number;
  outputSize: number;
  memoryUsage?: number;
  success: boolean;
}
```