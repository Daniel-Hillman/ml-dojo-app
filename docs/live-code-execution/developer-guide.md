# Developer Guide

This guide covers how to extend, customize, and contribute to the Live Code Execution System.

## Architecture Overview

The system follows a modular architecture with clear separation of concerns:

```
src/lib/code-execution/
├── executor.ts              # Universal code executor (orchestrator)
├── engines/                 # Language-specific execution engines
│   ├── web-engine.ts       # HTML/CSS/JavaScript execution
│   ├── python-engine.ts    # Python with Pyodide
│   ├── sql-engine.ts       # SQL with SQLite
│   └── config-engines.ts   # JSON/YAML/Markdown/Regex
├── security.ts             # Security and sandboxing
├── performance-metrics.ts  # Performance monitoring
├── error-handler.ts        # Error processing and suggestions
├── resource-monitor.ts     # Resource usage tracking
├── session-manager.ts      # Session lifecycle management
├── types.ts                # TypeScript definitions
└── utils.ts                # Utility functions
```

## Creating Custom Execution Engines

### Engine Interface

All execution engines must implement the `ExecutionEngine` interface:

```typescript
interface ExecutionEngine {
  name: string;
  supportedLanguages: SupportedLanguage[];
  execute(request: CodeExecutionRequest): Promise<CodeExecutionResult>;
  validateCode(code: string): Promise<boolean>;
  cleanup(sessionId?: string): Promise<void>;
}
```

### Example: Creating a Shell Script Engine

```typescript
import { ExecutionEngine, CodeExecutionRequest, CodeExecutionResult, SupportedLanguage } from '../types';

export class ShellExecutionEngine implements ExecutionEngine {
  name = 'shell';
  supportedLanguages: SupportedLanguage[] = ['bash', 'sh'];

  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Validate the code first
      const isValid = await this.validateCode(request.code);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid shell script syntax',
          executionTime: Date.now() - startTime,
          sessionId: request.sessionId || 'default'
        };
      }

      // Execute the shell script (simulated)
      const output = await this.executeShellScript(request.code);
      
      return {
        success: true,
        output,
        executionTime: Date.now() - startTime,
        sessionId: request.sessionId || 'default',
        metadata: {
          language: request.language,
          codeSize: request.code.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        sessionId: request.sessionId || 'default'
      };
    }
  }

  async validateCode(code: string): Promise<boolean> {
    // Basic validation
    if (!code.trim()) return false;
    
    // Check for dangerous commands
    const dangerousCommands = ['rm -rf', 'format', 'del /f', 'shutdown'];
    const lowerCode = code.toLowerCase();
    
    for (const cmd of dangerousCommands) {
      if (lowerCode.includes(cmd)) {
        return false;
      }
    }
    
    return true;
  }

  async cleanup(sessionId?: string): Promise<void> {
    // Cleanup any resources associated with the session
    console.log(`Cleaning up shell engine for session: ${sessionId || 'all'}`);
  }

  private async executeShellScript(code: string): Promise<string> {
    // In a real implementation, this would execute the shell script
    // in a secure sandbox environment
    
    // For demo purposes, we'll simulate some common commands
    const lines = code.split('\n').filter(line => line.trim());
    const output: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('echo ')) {
        const message = trimmed.substring(5).replace(/['"]/g, '');
        output.push(message);
      } else if (trimmed === 'pwd') {
        output.push('/home/user');
      } else if (trimmed === 'ls') {
        output.push('file1.txt  file2.txt  directory1/');
      } else if (trimmed.startsWith('date')) {
        output.push(new Date().toString());
      } else {
        output.push(`Command executed: ${trimmed}`);
      }
    }
    
    return output.join('\n');
  }
}
```

### Registering the Engine

```typescript
import { UniversalCodeExecutor } from '../executor';
import { ShellExecutionEngine } from './shell-engine';

// Register the new engine
const executor = new UniversalCodeExecutor();
executor.registerEngine(new ShellExecutionEngine());

// Now you can execute shell scripts
const result = await executor.execute({
  code: 'echo "Hello, World!"\npwd\ndate',
  language: 'bash'
});
```

## Extending Existing Engines

### Adding Features to Python Engine

```typescript
import { PythonExecutionEngine } from '../engines/python-engine';

export class ExtendedPythonEngine extends PythonExecutionEngine {
  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    // Add custom preprocessing
    const preprocessedCode = this.preprocessCode(request.code);
    
    // Call parent implementation
    const result = await super.execute({
      ...request,
      code: preprocessedCode
    });
    
    // Add custom postprocessing
    if (result.success) {
      result.output = this.postprocessOutput(result.output || '');
    }
    
    return result;
  }

  private preprocessCode(code: string): string {
    // Add automatic imports for common libraries
    const autoImports = [
      'import numpy as np',
      'import pandas as pd',
      'import matplotlib.pyplot as plt'
    ];
    
    // Check if imports are already present
    const hasImports = autoImports.some(imp => code.includes(imp));
    
    if (!hasImports && this.needsAutoImports(code)) {
      return autoImports.join('\n') + '\n\n' + code;
    }
    
    return code;
  }

  private needsAutoImports(code: string): boolean {
    // Check if code uses numpy, pandas, or matplotlib
    const patterns = [/np\./g, /pd\./g, /plt\./g];
    return patterns.some(pattern => pattern.test(code));
  }

  private postprocessOutput(output: string): string {
    // Add custom formatting or filtering
    return output.replace(/^>>> /gm, ''); // Remove Python prompt
  }
}
```

## Custom UI Components

### Creating a Custom Code Editor

```tsx
import React, { useState, useEffect } from 'react';
import { codeExecutor } from '@/lib/code-execution';
import { CodeExecutionResult, SupportedLanguage } from '@/lib/code-execution/types';

interface CustomCodeEditorProps {
  initialCode?: string;
  language?: SupportedLanguage;
  theme?: 'light' | 'dark';
  onExecute?: (result: CodeExecutionResult) => void;
  customFeatures?: {
    autoSave?: boolean;
    collaborativeEditing?: boolean;
    aiAssistance?: boolean;
  };
}

export function CustomCodeEditor({
  initialCode = '',
  language = 'javascript',
  theme = 'light',
  onExecute,
  customFeatures = {}
}: CustomCodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<CodeExecutionResult | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (customFeatures.autoSave) {
      const timer = setTimeout(() => {
        localStorage.setItem(`code-${language}`, code);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [code, language, customFeatures.autoSave]);

  // AI assistance
  const getAISuggestions = async (currentCode: string) => {
    if (!customFeatures.aiAssistance) return [];
    
    // Implement AI-powered code suggestions
    // This would integrate with your AI service
    return [
      'Add error handling with try-catch',
      'Consider using const instead of let',
      'Add type annotations for better code clarity'
    ];
  };

  const executeCode = async () => {
    setIsExecuting(true);
    
    try {
      const executionResult = await codeExecutor.execute({
        code,
        language,
        sessionId: `custom-editor-${Date.now()}`
      });
      
      setResult(executionResult);
      onExecute?.(executionResult);
    } catch (error) {
      const errorResult: CodeExecutionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
        sessionId: 'error'
      };
      
      setResult(errorResult);
      onExecute?.(errorResult);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className={`custom-code-editor ${theme}`}>
      <div className="editor-header">
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="sql">SQL</option>
          <option value="html">HTML</option>
        </select>
        
        <button 
          onClick={executeCode} 
          disabled={isExecuting}
          className="execute-button"
        >
          {isExecuting ? 'Running...' : 'Run Code'}
        </button>
      </div>
      
      <div className="editor-content">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="code-input"
          placeholder={`Enter ${language} code here...`}
          spellCheck={false}
        />
        
        {result && (
          <div className="output-panel">
            <h3>Output:</h3>
            {result.success ? (
              <div className="success-output">
                <pre>{result.output}</pre>
                {result.visualOutput && (
                  <div dangerouslySetInnerHTML={{ __html: result.visualOutput }} />
                )}
              </div>
            ) : (
              <div className="error-output">
                <pre>{result.error}</pre>
              </div>
            )}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .custom-code-editor {
          border: 1px solid #ccc;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f5f5f5;
          border-bottom: 1px solid #ccc;
        }
        
        .execute-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .execute-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .editor-content {
          display: flex;
          height: 400px;
        }
        
        .code-input {
          flex: 1;
          border: none;
          padding: 10px;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 14px;
          resize: none;
          outline: none;
        }
        
        .output-panel {
          flex: 1;
          padding: 10px;
          background: #f9f9f9;
          border-left: 1px solid #ccc;
          overflow-y: auto;
        }
        
        .success-output pre {
          color: #333;
          background: white;
          padding: 10px;
          border-radius: 4px;
        }
        
        .error-output pre {
          color: #d32f2f;
          background: #ffebee;
          padding: 10px;
          border-radius: 4px;
        }
        
        .dark {
          background: #1e1e1e;
          color: #fff;
        }
        
        .dark .editor-header {
          background: #2d2d2d;
          border-color: #444;
        }
        
        .dark .code-input {
          background: #1e1e1e;
          color: #fff;
        }
        
        .dark .output-panel {
          background: #2d2d2d;
          border-color: #444;
        }
      `}</style>
    </div>
  );
}
```

## Plugin System

### Creating Plugins

```typescript
interface CodeExecutionPlugin {
  name: string;
  version: string;
  description: string;
  
  // Lifecycle hooks
  onBeforeExecute?(request: CodeExecutionRequest): Promise<CodeExecutionRequest>;
  onAfterExecute?(result: CodeExecutionResult): Promise<CodeExecutionResult>;
  onError?(error: Error, request: CodeExecutionRequest): Promise<void>;
  
  // UI extensions
  renderToolbarButton?(): React.ReactNode;
  renderSidePanel?(): React.ReactNode;
  
  // Configuration
  getConfig?(): Record<string, any>;
  setConfig?(config: Record<string, any>): void;
}

// Example plugin: Code formatter
export class CodeFormatterPlugin implements CodeExecutionPlugin {
  name = 'code-formatter';
  version = '1.0.0';
  description = 'Automatically formats code before execution';

  async onBeforeExecute(request: CodeExecutionRequest): Promise<CodeExecutionRequest> {
    if (request.language === 'javascript' || request.language === 'typescript') {
      // Format JavaScript/TypeScript code
      const formattedCode = await this.formatJavaScript(request.code);
      return { ...request, code: formattedCode };
    }
    
    if (request.language === 'python') {
      // Format Python code
      const formattedCode = await this.formatPython(request.code);
      return { ...request, code: formattedCode };
    }
    
    return request;
  }

  private async formatJavaScript(code: string): Promise<string> {
    // Use a formatter like Prettier (would need to be loaded)
    // For demo, just add basic formatting
    return code
      .split('\n')
      .map(line => line.trim())
      .join('\n');
  }

  private async formatPython(code: string): Promise<string> {
    // Use a formatter like Black (would need to be loaded)
    // For demo, just fix basic indentation
    const lines = code.split('\n');
    let indentLevel = 0;
    
    return lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.endsWith(':')) {
        const formatted = '  '.repeat(indentLevel) + trimmed;
        indentLevel++;
        return formatted;
      } else if (trimmed === '') {
        return '';
      } else {
        return '  '.repeat(indentLevel) + trimmed;
      }
    }).join('\n');
  }

  renderToolbarButton(): React.ReactNode {
    return (
      <button 
        onClick={() => this.formatCurrentCode()}
        title="Format Code"
      >
        🎨 Format
      </button>
    );
  }

  private formatCurrentCode() {
    // Implementation would format the current editor content
    console.log('Formatting current code...');
  }
}
```

### Plugin Manager

```typescript
class PluginManager {
  private plugins: Map<string, CodeExecutionPlugin> = new Map();
  private executor: UniversalCodeExecutor;

  constructor(executor: UniversalCodeExecutor) {
    this.executor = executor;
  }

  registerPlugin(plugin: CodeExecutionPlugin): void {
    this.plugins.set(plugin.name, plugin);
    console.log(`Registered plugin: ${plugin.name} v${plugin.version}`);
  }

  unregisterPlugin(name: string): void {
    this.plugins.delete(name);
    console.log(`Unregistered plugin: ${name}`);
  }

  async executeWithPlugins(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    let modifiedRequest = request;
    
    // Run onBeforeExecute hooks
    for (const plugin of this.plugins.values()) {
      if (plugin.onBeforeExecute) {
        try {
          modifiedRequest = await plugin.onBeforeExecute(modifiedRequest);
        } catch (error) {
          console.error(`Plugin ${plugin.name} onBeforeExecute failed:`, error);
        }
      }
    }
    
    // Execute the code
    let result: CodeExecutionResult;
    try {
      result = await this.executor.execute(modifiedRequest);
    } catch (error) {
      // Run onError hooks
      for (const plugin of this.plugins.values()) {
        if (plugin.onError) {
          try {
            await plugin.onError(error as Error, modifiedRequest);
          } catch (pluginError) {
            console.error(`Plugin ${plugin.name} onError failed:`, pluginError);
          }
        }
      }
      throw error;
    }
    
    // Run onAfterExecute hooks
    for (const plugin of this.plugins.values()) {
      if (plugin.onAfterExecute) {
        try {
          result = await plugin.onAfterExecute(result);
        } catch (error) {
          console.error(`Plugin ${plugin.name} onAfterExecute failed:`, error);
        }
      }
    }
    
    return result;
  }

  getPlugins(): CodeExecutionPlugin[] {
    return Array.from(this.plugins.values());
  }
}

// Usage
const executor = new UniversalCodeExecutor();
const pluginManager = new PluginManager(executor);

// Register plugins
pluginManager.registerPlugin(new CodeFormatterPlugin());

// Execute with plugins
const result = await pluginManager.executeWithPlugins({
  code: 'console.log("Hello");',
  language: 'javascript'
});
```

## Testing Custom Components

### Unit Testing Engines

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { ShellExecutionEngine } from '../engines/shell-engine';

describe('ShellExecutionEngine', () => {
  let engine: ShellExecutionEngine;

  beforeEach(() => {
    engine = new ShellExecutionEngine();
  });

  describe('Basic functionality', () => {
    it('should have correct name and supported languages', () => {
      expect(engine.name).toBe('shell');
      expect(engine.supportedLanguages).toContain('bash');
      expect(engine.supportedLanguages).toContain('sh');
    });

    it('should execute simple echo command', async () => {
      const result = await engine.execute({
        code: 'echo "Hello, World!"',
        language: 'bash'
      });

      expect(result.success).toBe(true);
      expect(result.output).toBe('Hello, World!');
    });

    it('should validate safe commands', async () => {
      const safeCode = 'echo "test"\npwd\ndate';
      const isValid = await engine.validateCode(safeCode);
      expect(isValid).toBe(true);
    });

    it('should reject dangerous commands', async () => {
      const dangerousCode = 'rm -rf /';
      const isValid = await engine.validateCode(dangerousCode);
      expect(isValid).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle empty code', async () => {
      const result = await engine.execute({
        code: '',
        language: 'bash'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid shell script syntax');
    });
  });
});
```

### Integration Testing

```typescript
import { describe, it, expect } from '@jest/globals';
import { UniversalCodeExecutor } from '../executor';
import { ShellExecutionEngine } from '../engines/shell-engine';

describe('Shell Engine Integration', () => {
  it('should integrate with universal executor', async () => {
    const executor = new UniversalCodeExecutor();
    executor.registerEngine(new ShellExecutionEngine());

    const result = await executor.execute({
      code: 'echo "Integration test"',
      language: 'bash'
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe('Integration test');
  });

  it('should handle multiple shell commands', async () => {
    const executor = new UniversalCodeExecutor();
    executor.registerEngine(new ShellExecutionEngine());

    const result = await executor.execute({
      code: 'echo "Line 1"\necho "Line 2"\npwd',
      language: 'bash'
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain('Line 1');
    expect(result.output).toContain('Line 2');
    expect(result.output).toContain('/home/user');
  });
});
```

## Performance Optimization

### Caching Strategies

```typescript
class CachedExecutionEngine implements ExecutionEngine {
  private cache = new Map<string, CodeExecutionResult>();
  private baseEngine: ExecutionEngine;

  constructor(baseEngine: ExecutionEngine) {
    this.baseEngine = baseEngine;
  }

  get name() { return this.baseEngine.name; }
  get supportedLanguages() { return this.baseEngine.supportedLanguages; }

  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    // Create cache key
    const cacheKey = this.createCacheKey(request);
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return {
        ...cached,
        sessionId: request.sessionId || cached.sessionId
      };
    }
    
    // Execute and cache result
    const result = await this.baseEngine.execute(request);
    
    // Only cache successful results
    if (result.success) {
      this.cache.set(cacheKey, result);
      
      // Limit cache size
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
    }
    
    return result;
  }

  async validateCode(code: string): Promise<boolean> {
    return this.baseEngine.validateCode(code);
  }

  async cleanup(sessionId?: string): Promise<void> {
    return this.baseEngine.cleanup(sessionId);
  }

  private createCacheKey(request: CodeExecutionRequest): string {
    return `${request.language}:${btoa(request.code)}`;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
```

### Resource Monitoring

```typescript
class MonitoredExecutionEngine implements ExecutionEngine {
  private baseEngine: ExecutionEngine;
  private metrics: Map<string, PerformanceMetrics> = new Map();

  constructor(baseEngine: ExecutionEngine) {
    this.baseEngine = baseEngine;
  }

  get name() { return this.baseEngine.name; }
  get supportedLanguages() { return this.baseEngine.supportedLanguages; }

  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    try {
      const result = await this.baseEngine.execute(request);
      
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Record metrics
      this.recordMetrics({
        executionId: request.sessionId || 'unknown',
        language: request.language,
        duration: endTime - startTime,
        memoryDelta: endMemory - startMemory,
        codeSize: request.code.length,
        success: result.success
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      this.recordMetrics({
        executionId: request.sessionId || 'unknown',
        language: request.language,
        duration: endTime - startTime,
        memoryDelta: 0,
        codeSize: request.code.length,
        success: false
      });
      
      throw error;
    }
  }

  async validateCode(code: string): Promise<boolean> {
    return this.baseEngine.validateCode(code);
  }

  async cleanup(sessionId?: string): Promise<void> {
    return this.baseEngine.cleanup(sessionId);
  }

  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.set(metrics.executionId, metrics);
    
    // Log performance warnings
    if (metrics.duration > 5000) {
      console.warn(`Slow execution detected: ${metrics.duration}ms for ${metrics.language}`);
    }
    
    if (metrics.memoryDelta > 50 * 1024 * 1024) {
      console.warn(`High memory usage: ${metrics.memoryDelta / 1024 / 1024}MB for ${metrics.language}`);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  getAverageMetrics(language?: string): Partial<PerformanceMetrics> {
    const filtered = language 
      ? Array.from(this.metrics.values()).filter(m => m.language === language)
      : Array.from(this.metrics.values());
    
    if (filtered.length === 0) return {};
    
    return {
      duration: filtered.reduce((sum, m) => sum + m.duration, 0) / filtered.length,
      memoryDelta: filtered.reduce((sum, m) => sum + m.memoryDelta, 0) / filtered.length,
      codeSize: filtered.reduce((sum, m) => sum + m.codeSize, 0) / filtered.length,
      success: filtered.filter(m => m.success).length / filtered.length > 0.5
    };
  }
}

interface PerformanceMetrics {
  executionId: string;
  language: string;
  duration: number;
  memoryDelta: number;
  codeSize: number;
  success: boolean;
}
```

## Contributing Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write comprehensive JSDoc comments
- Use meaningful variable and function names
- Implement proper error handling

### Testing Requirements

- Unit tests for all new engines and utilities
- Integration tests for complete workflows
- Performance tests for resource-intensive operations
- Security tests for new execution paths

### Documentation

- Update API documentation for new features
- Add examples for new functionality
- Update troubleshooting guide for new issues
- Create migration guides for breaking changes

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Implement your changes with tests
4. Update documentation
5. Submit pull request with detailed description
6. Address review feedback
7. Merge after approval

For more information, see the [Contributing Guide](./contributing.md) and [Code of Conduct](./code-of-conduct.md).