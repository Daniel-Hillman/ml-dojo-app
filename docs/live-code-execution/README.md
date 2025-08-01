# Live Code Execution System

A comprehensive, secure, and performant code execution platform that supports multiple programming languages directly in the browser.

## 🚀 Features

- **Multi-Language Support**: JavaScript, Python, SQL, HTML/CSS, JSON, YAML, Markdown, and Regex
- **Secure Sandboxing**: Isolated execution environments with comprehensive security measures
- **Real-Time Execution**: Instant code execution with live output and error handling
- **Data Visualization**: Built-in support for matplotlib, pandas, and other data science libraries
- **Collaborative Features**: Code sharing, forking, and community integration
- **Mobile Optimized**: Responsive design with touch-friendly interfaces
- **Performance Optimized**: Lazy loading, caching, and resource management

## 📚 Quick Start

### Basic Usage

```typescript
import { codeExecutor } from '@/lib/code-execution';

// Execute JavaScript code
const result = await codeExecutor.execute({
  code: 'console.log("Hello, World!");',
  language: 'javascript',
  sessionId: 'my-session'
});

console.log(result.output); // "Hello, World!"
```

### Using the LiveCodeBlock Component

```tsx
import { LiveCodeBlock } from '@/components/LiveCodeBlock';

function MyComponent() {
  return (
    <LiveCodeBlock
      initialCode="print('Hello from Python!')"
      language="python"
      showLineNumbers={true}
      allowLanguageChange={true}
    />
  );
}
```

## 🏗️ Architecture

The system is built with a modular architecture:

```
src/lib/code-execution/
├── executor.ts              # Universal code executor
├── engines/                 # Language-specific execution engines
│   ├── web-engine.ts       # HTML/CSS/JavaScript
│   ├── python-engine.ts    # Python with Pyodide
│   ├── sql-engine.ts       # SQL with SQLite
│   └── config-engines.ts   # JSON/YAML/Markdown/Regex
├── security.ts             # Security and sandboxing
├── performance-metrics.ts  # Performance monitoring
└── types.ts                # TypeScript definitions
```

## 🔧 Configuration

### Environment Variables

```bash
# Optional: Configure execution limits
NEXT_PUBLIC_CODE_EXECUTION_TIMEOUT=30000
NEXT_PUBLIC_MAX_MEMORY_USAGE=100MB
NEXT_PUBLIC_MAX_CONCURRENT_EXECUTIONS=10
```

### Language Configuration

```typescript
import { configureLanguage } from '@/lib/code-execution/config';

// Configure Python with custom packages
configureLanguage('python', {
  packages: ['numpy', 'pandas', 'matplotlib'],
  timeout: 60000,
  memoryLimit: 200 * 1024 * 1024 // 200MB
});
```

## 📖 Language Guides

- [JavaScript/TypeScript Guide](./guides/javascript.md)
- [Python & Data Science Guide](./guides/python.md)
- [SQL Database Guide](./guides/sql.md)
- [HTML/CSS Guide](./guides/web.md)
- [Configuration Languages Guide](./guides/config.md)

## 🔒 Security

The system implements multiple layers of security:

- **Sandboxed Execution**: All code runs in isolated environments
- **Resource Limits**: Memory, CPU, and execution time limits
- **Content Security Policy**: Strict CSP headers prevent XSS
- **Input Validation**: Comprehensive input sanitization
- **Network Restrictions**: Blocked external network access

See [Security Guide](./security.md) for detailed information.

## 🚀 Performance

- **Lazy Loading**: Execution engines load on demand
- **Caching**: Compiled code and results are cached
- **Resource Monitoring**: Real-time resource usage tracking
- **Optimization**: Automatic performance optimizations

See [Performance Guide](./performance.md) for optimization tips.

## 🤝 Contributing

See [Contributing Guide](./contributing.md) for development setup and guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- [Troubleshooting Guide](./troubleshooting.md)
- [FAQ](./faq.md)
- [API Reference](./api/README.md)
- [GitHub Issues](https://github.com/your-org/ml-dojo/issues)