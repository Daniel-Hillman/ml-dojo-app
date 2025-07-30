# Design Document

## Overview

The Live Code Execution system transforms OmniCode into an interactive coding platform by enabling real-time code execution across multiple programming languages directly in the browser. The system uses a combination of client-side execution engines, sandboxed environments, and optimized UI components to provide a seamless coding experience.

## Architecture

### Core Components

1. **Universal Code Executor**: Central orchestrator that routes code to appropriate execution engines
2. **Language Engines**: Specialized execution environments for each supported language
3. **Sandbox Manager**: Security layer ensuring safe code execution
4. **Output Renderer**: Unified display system for results, errors, and visualizations
5. **Session Manager**: Handles code persistence, sharing, and state management

### Execution Flow

```
User Code Input → Language Detection → Security Validation → Engine Selection → Execution → Output Rendering → Result Display
```

## Components and Interfaces

### 1. Universal Code Executor (`src/lib/code-execution/executor.ts`)

```typescript
interface CodeExecutionRequest {
  code: string;
  language: SupportedLanguage;
  options?: ExecutionOptions;
}

interface CodeExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  visualOutput?: string; // For HTML/plots
  executionTime: number;
  memoryUsage?: number;
}

class UniversalCodeExecutor {
  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult>
  async validateCode(code: string, language: SupportedLanguage): Promise<boolean>
  async terminateExecution(executionId: string): Promise<void>
}
```

### 2. Language-Specific Engines

#### HTML/CSS/JavaScript Engine (`src/lib/code-execution/engines/web.ts`)
- **Implementation**: Sandboxed iframe with CSP headers
- **Features**: Live preview, console capture, DOM interaction
- **Security**: Restricted API access, no external requests

```typescript
class WebExecutionEngine {
  private createSandboxedIframe(): HTMLIFrameElement
  private injectCode(code: string, iframe: HTMLIFrameElement): void
  private captureConsoleOutput(): string[]
}
```

#### Python Engine (`src/lib/code-execution/engines/python.ts`)
- **Implementation**: Pyodide WebAssembly runtime
- **Libraries**: numpy, pandas, matplotlib, scikit-learn
- **Features**: Plot rendering, data visualization, ML operations

```typescript
class PythonExecutionEngine {
  private pyodide: PyodideInterface
  async loadPackages(packages: string[]): Promise<void>
  async executePython(code: string): Promise<PythonResult>
  private renderPlots(): string
}
```

#### SQL Engine (`src/lib/code-execution/engines/sql.ts`)
- **Implementation**: sql.js (SQLite compiled to WebAssembly)
- **Features**: Table creation, data manipulation, query results
- **Sample Data**: Pre-loaded datasets for learning

```typescript
class SQLExecutionEngine {
  private db: Database
  async executeQuery(sql: string): Promise<QueryResult>
  async loadSampleData(dataset: string): Promise<void>
  private formatResults(results: any[]): TableData
}
```

### 3. Enhanced Interactive Code Block (`src/components/LiveCodeBlock.tsx`)

```typescript
interface LiveCodeBlockProps {
  initialCode: string;
  language: SupportedLanguage;
  showOutput?: boolean;
  allowEdit?: boolean;
  height?: string;
  onCodeChange?: (code: string) => void;
  onExecutionComplete?: (result: CodeExecutionResult) => void;
}

const LiveCodeBlock: React.FC<LiveCodeBlockProps> = ({
  initialCode,
  language,
  showOutput = true,
  allowEdit = true,
  height = "400px",
  onCodeChange,
  onExecutionComplete
}) => {
  // Component implementation
}
```

### 4. Output Renderer (`src/components/CodeOutput.tsx`)

```typescript
interface CodeOutputProps {
  result: CodeExecutionResult;
  language: SupportedLanguage;
  maxHeight?: string;
}

const CodeOutput: React.FC<CodeOutputProps> = ({ result, language, maxHeight }) => {
  // Renders different output types:
  // - Text output for console logs
  // - HTML preview for web code
  // - Data tables for SQL results
  // - Plots for Python visualizations
  // - Error messages with syntax highlighting
}
```

## Data Models

### Supported Languages Configuration

```typescript
type SupportedLanguage = 
  | 'javascript' | 'typescript' | 'html' | 'css'
  | 'python' | 'sql' | 'json' | 'yaml' | 'markdown'
  | 'regex' | 'bash';

interface LanguageConfig {
  name: string;
  engine: ExecutionEngine;
  fileExtension: string;
  syntaxHighlighting: string;
  defaultCode: string;
  supportedFeatures: LanguageFeature[];
  requiredPackages?: string[];
  executionTimeout: number;
  memoryLimit: number;
}

const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  python: {
    name: 'Python',
    engine: 'pyodide',
    fileExtension: '.py',
    syntaxHighlighting: 'python',
    defaultCode: 'print("Hello, Python!")',
    supportedFeatures: ['plotting', 'dataAnalysis', 'machineLearning'],
    requiredPackages: ['numpy', 'pandas', 'matplotlib'],
    executionTimeout: 30000,
    memoryLimit: 100 * 1024 * 1024 // 100MB
  },
  // ... other language configs
};
```

### Execution Session Management

```typescript
interface ExecutionSession {
  id: string;
  userId: string;
  language: SupportedLanguage;
  code: string;
  results: CodeExecutionResult[];
  createdAt: Date;
  lastExecutedAt: Date;
  isPublic: boolean;
  tags: string[];
}

interface SharedCodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: SupportedLanguage;
  authorId: string;
  forkCount: number;
  likeCount: number;
  createdAt: Date;
}
```

## Security Architecture

### Sandboxing Strategy

1. **Web Code (HTML/CSS/JS)**:
   - Sandboxed iframes with restrictive CSP
   - No access to parent window or external resources
   - Limited API surface (no localStorage, no fetch to external domains)

2. **Python Code**:
   - Pyodide runs in isolated Web Worker
   - No file system access beyond virtual filesystem
   - Network requests blocked by default
   - Memory and execution time limits

3. **SQL Code**:
   - In-memory SQLite database only
   - No file operations or external connections
   - Query complexity limits to prevent DoS

### Resource Management

```typescript
interface ResourceLimits {
  maxExecutionTime: number; // milliseconds
  maxMemoryUsage: number;   // bytes
  maxOutputSize: number;    // characters
  maxConcurrentExecutions: number;
}

const DEFAULT_LIMITS: ResourceLimits = {
  maxExecutionTime: 30000,    // 30 seconds
  maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  maxOutputSize: 10000,       // 10k characters
  maxConcurrentExecutions: 3  // per user
};
```

## User Interface Design

### Code Editor Enhancements

1. **Multi-tab Interface**: Switch between different languages/files
2. **Live Syntax Validation**: Real-time error highlighting
3. **Auto-completion**: Context-aware code suggestions
4. **Code Formatting**: Automatic indentation and style fixes
5. **Vim/Emacs Keybindings**: Optional for power users

### Output Panel Design

1. **Tabbed Output**: Console, Visual, Errors, Performance
2. **Resizable Panels**: Drag to adjust code/output ratio
3. **Full-screen Mode**: Maximize output for presentations
4. **Export Options**: Save results as images, PDFs, or code files

### Mobile Optimizations

1. **Collapsible Panels**: Hide/show code or output on small screens
2. **Touch-friendly Controls**: Larger buttons, swipe gestures
3. **Virtual Keyboard Integration**: Code-specific keyboard layouts
4. **Offline Capability**: Cache execution engines for offline use

## Performance Considerations

### Loading Strategy

1. **Lazy Loading**: Load execution engines only when needed
2. **Progressive Enhancement**: Basic functionality first, advanced features later
3. **CDN Optimization**: Serve large libraries (Pyodide) from fast CDNs
4. **Caching Strategy**: Cache compiled engines in browser storage

### Execution Optimization

1. **Web Workers**: Run code execution in background threads
2. **Streaming Output**: Display results as they're generated
3. **Incremental Compilation**: Cache compiled code between runs
4. **Memory Management**: Automatic cleanup of execution contexts

## Integration Points

### Existing Components

1. **InteractiveCodeBlock**: Enhance with live execution capabilities
2. **DrillCard**: Add "Try it Live" buttons to code examples
3. **Community Features**: Enable sharing of executable code snippets
4. **AI Assistant**: Generate runnable code examples

### Database Schema Extensions

```sql
-- New tables for code execution
CREATE TABLE code_executions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  language VARCHAR(20) NOT NULL,
  code TEXT NOT NULL,
  output TEXT,
  error_message TEXT,
  execution_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shared_snippets (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language VARCHAR(20) NOT NULL,
  author_id UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false,
  fork_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Testing Strategy

### Unit Testing

1. **Execution Engines**: Test each language engine independently
2. **Security Validation**: Verify sandboxing and resource limits
3. **Output Rendering**: Test different output formats and edge cases
4. **Error Handling**: Validate graceful failure scenarios

### Integration Testing

1. **End-to-End Flows**: Complete code execution workflows
2. **Cross-browser Compatibility**: Test on major browsers
3. **Performance Testing**: Measure execution times and memory usage
4. **Mobile Testing**: Verify touch interactions and responsive design

### Security Testing

1. **Penetration Testing**: Attempt to break out of sandboxes
2. **Resource Exhaustion**: Test memory and CPU limits
3. **Code Injection**: Verify protection against malicious code
4. **Data Isolation**: Ensure user code cannot access other sessions

## Deployment Strategy

### Phase 1: Foundation (Week 1)
- Core executor infrastructure
- HTML/CSS/JavaScript execution
- Basic UI integration

### Phase 2: Python Support (Week 2)
- Pyodide integration
- ML library support
- Plot rendering

### Phase 3: Additional Languages (Week 3)
- SQL execution with sample data
- JSON/YAML validation
- Markdown rendering

### Phase 4: Advanced Features (Week 4)
- Code sharing and collaboration
- Performance optimizations
- Mobile enhancements

### Phase 5: Production Hardening (Week 5)
- Security auditing
- Performance monitoring
- Error tracking and analytics