/**
 * Comprehensive Error Handler for Code Execution System
 * Provides user-friendly error messages, suggestions, and recovery mechanisms
 */

export interface ErrorContext {
  language: string;
  code: string;
  executionId: string;
  sessionId?: string;
  timestamp: number;
  userAgent?: string;
}

export interface ErrorSuggestion {
  type: 'fix' | 'alternative' | 'documentation' | 'example';
  title: string;
  description: string;
  code?: string;
  link?: string;
  priority: number; // 1-10, higher is more important
}

export interface ProcessedError {
  originalError: Error;
  userFriendlyMessage: string;
  technicalDetails: string;
  errorType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestions: ErrorSuggestion[];
  canRetry: boolean;
  retryDelay?: number;
  context: ErrorContext;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorPatterns: Map<string, RegExp[]> = new Map();
  private errorSolutions: Map<string, ErrorSuggestion[]> = new Map();

  private constructor() {
    this.initializeErrorPatterns();
    this.initializeErrorSolutions();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private initializeErrorPatterns(): void {
    // JavaScript/TypeScript Error Patterns
    this.errorPatterns.set('javascript', [
      /ReferenceError: .* is not defined/,
      /TypeError: Cannot read propert(y|ies) .* of (null|undefined)/,
      /TypeError: .* is not a function/,
      /SyntaxError: Unexpected token/,
      /SyntaxError: Unexpected end of input/,
      /RangeError: Maximum call stack size exceeded/,
      /TypeError: Cannot set propert(y|ies) .* of (null|undefined)/,
      /Error: Script error/,
      /TypeError: Assignment to constant variable/,
      /SyntaxError: Identifier .* has already been declared/
    ]);

    // Python Error Patterns
    this.errorPatterns.set('python', [
      /NameError: name '.*' is not defined/,
      /TypeError: .* takes .* positional argument.* but .* (was|were) given/,
      /IndentationError: expected an indented block/,
      /SyntaxError: invalid syntax/,
      /AttributeError: .* object has no attribute .*/,
      /IndexError: list index out of range/,
      /KeyError: .*/,
      /ValueError: .*/,
      /ZeroDivisionError: division by zero/,
      /ImportError: No module named .*/,
      /RecursionError: maximum recursion depth exceeded/
    ]);

    // SQL Error Patterns
    this.errorPatterns.set('sql', [
      /SQL logic error: no such table: .*/,
      /SQL logic error: no such column: .*/,
      /SQL logic error: syntax error near .*/,
      /SQL logic error: ambiguous column name: .*/,
      /SQL logic error: table .* already exists/,
      /SQL logic error: NOT NULL constraint failed: .*/,
      /SQL logic error: UNIQUE constraint failed: .*/
    ]);

    // HTML/CSS Error Patterns
    this.errorPatterns.set('html', [
      /Uncaught ReferenceError: .* is not defined/,
      /Failed to execute .* on .*: .*/,
      /The provided value .* is not a valid enum value/
    ]);
  }

  private initializeErrorSolutions(): void {
    // JavaScript Solutions
    this.errorSolutions.set('ReferenceError: .* is not defined', [
      {
        type: 'fix',
        title: 'Declare the variable',
        description: 'Make sure to declare the variable before using it',
        code: 'let variableName = "value";\n// or\nconst variableName = "value";',
        priority: 9
      },
      {
        type: 'fix',
        title: 'Check spelling',
        description: 'Verify the variable name is spelled correctly',
        priority: 8
      },
      {
        type: 'fix',
        title: 'Check scope',
        description: 'Make sure the variable is accessible in the current scope',
        priority: 7
      }
    ]);

    this.errorSolutions.set('TypeError: Cannot read propert(y|ies) .* of (null|undefined)', [
      {
        type: 'fix',
        title: 'Add null check',
        description: 'Check if the object exists before accessing its properties',
        code: 'if (object && object.property) {\n  // Use object.property\n}',
        priority: 9
      },
      {
        type: 'fix',
        title: 'Use optional chaining',
        description: 'Use the ?. operator to safely access properties',
        code: 'object?.property',
        priority: 8
      },
      {
        type: 'fix',
        title: 'Initialize the object',
        description: 'Make sure the object is properly initialized',
        code: 'const object = {}; // or appropriate initialization',
        priority: 7
      }
    ]);

    this.errorSolutions.set('TypeError: .* is not a function', [
      {
        type: 'fix',
        title: 'Check function name',
        description: 'Verify the function name is spelled correctly',
        priority: 9
      },
      {
        type: 'fix',
        title: 'Ensure function is defined',
        description: 'Make sure the function is declared before calling it',
        code: 'function myFunction() {\n  // function body\n}\n\nmyFunction(); // Call after declaration',
        priority: 8
      },
      {
        type: 'fix',
        title: 'Check object method',
        description: 'If calling a method, ensure the object has that method',
        code: 'if (typeof object.method === "function") {\n  object.method();\n}',
        priority: 7
      }
    ]);

    // Python Solutions
    this.errorSolutions.set('NameError: name .* is not defined', [
      {
        type: 'fix',
        title: 'Define the variable',
        description: 'Make sure to define the variable before using it',
        code: 'variable_name = "value"',
        priority: 9
      },
      {
        type: 'fix',
        title: 'Check indentation',
        description: 'Ensure proper indentation - Python is sensitive to whitespace',
        priority: 8
      },
      {
        type: 'fix',
        title: 'Import the module',
        description: 'If using a function from a module, import it first',
        code: 'import module_name\n# or\nfrom module_name import function_name',
        priority: 7
      }
    ]);

    this.errorSolutions.set('IndentationError: expected an indented block', [
      {
        type: 'fix',
        title: 'Add indentation',
        description: 'Python requires indented blocks after colons (:)',
        code: 'if condition:\n    # This line must be indented\n    print("Hello")',
        priority: 10
      },
      {
        type: 'fix',
        title: 'Use consistent indentation',
        description: 'Use either spaces or tabs consistently (4 spaces recommended)',
        priority: 9
      }
    ]);

    // SQL Solutions
    this.errorSolutions.set('SQL logic error: no such table: .*', [
      {
        type: 'fix',
        title: 'Create the table first',
        description: 'Make sure to create the table before querying it',
        code: 'CREATE TABLE table_name (\n  id INTEGER PRIMARY KEY,\n  name TEXT\n);',
        priority: 9
      },
      {
        type: 'fix',
        title: 'Check table name spelling',
        description: 'Verify the table name is spelled correctly',
        priority: 8
      },
      {
        type: 'example',
        title: 'View available tables',
        description: 'See what tables are available in the database',
        code: 'SELECT name FROM sqlite_master WHERE type="table";',
        priority: 7
      }
    ]);

    this.errorSolutions.set('SQL logic error: syntax error near .*', [
      {
        type: 'fix',
        title: 'Check SQL syntax',
        description: 'Review your SQL syntax for typos or missing keywords',
        priority: 9
      },
      {
        type: 'fix',
        title: 'Add missing semicolon',
        description: 'Make sure to end SQL statements with a semicolon',
        code: 'SELECT * FROM table_name;',
        priority: 8
      },
      {
        type: 'documentation',
        title: 'SQL Reference',
        description: 'Check SQL syntax documentation',
        link: 'https://www.sqlite.org/lang.html',
        priority: 6
      }
    ]);
  }

  /**
   * Process an error and return user-friendly information
   */
  public processError(
    error: Error,
    context: ErrorContext
  ): ProcessedError {
    const errorType = this.classifyError(error, context.language);
    const severity = this.determineSeverity(error, context);
    const suggestions = this.generateSuggestions(error, context);
    const userFriendlyMessage = this.generateUserFriendlyMessage(error, context);
    const canRetry = this.canRetryError(error, context);

    return {
      originalError: error,
      userFriendlyMessage,
      technicalDetails: error.message,
      errorType,
      severity,
      suggestions,
      canRetry,
      retryDelay: canRetry ? this.getRetryDelay(error) : undefined,
      context
    };
  }

  /**
   * Generate contextual help for code issues
   */
  public generateContextualHelp(
    code: string,
    language: string,
    cursorPosition?: number
  ): ErrorSuggestion[] {
    const suggestions: ErrorSuggestion[] = [];

    // Analyze code for common issues
    if (language === 'javascript' || language === 'typescript') {
      // Check for common JavaScript issues
      if (code.includes('console.log') && !code.includes('console.log(')) {
        suggestions.push({
          type: 'fix',
          title: 'Missing parentheses',
          description: 'console.log requires parentheses',
          code: 'console.log("Hello World");',
          priority: 8
        });
      }

      if (code.includes('=') && !code.includes('==') && !code.includes('===')) {
        const lines = code.split('\n');
        const assignmentLines = lines.filter(line => 
          line.includes('=') && !line.includes('==') && !line.includes('===')
        );
        if (assignmentLines.length > 0) {
          suggestions.push({
            type: 'alternative',
            title: 'Assignment vs Comparison',
            description: 'Use === for comparison, = for assignment',
            code: 'if (variable === "value") { /* comparison */ }\nvariable = "value"; // assignment',
            priority: 6
          });
        }
      }
    }

    if (language === 'python') {
      // Check for Python-specific issues
      if (code.includes('print ') && !code.includes('print(')) {
        suggestions.push({
          type: 'fix',
          title: 'Python 3 print syntax',
          description: 'Use print() function instead of print statement',
          code: 'print("Hello World")',
          priority: 9
        });
      }

      // Check indentation
      const lines = code.split('\n');
      let hasIndentationIssue = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.endsWith(':') && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (nextLine.trim() && !nextLine.startsWith(' ') && !nextLine.startsWith('\t')) {
            hasIndentationIssue = true;
            break;
          }
        }
      }

      if (hasIndentationIssue) {
        suggestions.push({
          type: 'fix',
          title: 'Indentation required',
          description: 'Python requires indented blocks after colons',
          code: 'if condition:\n    print("Indented block")',
          priority: 10
        });
      }
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get retry strategy for an error
   */
  public getRetryStrategy(error: ProcessedError): {
    shouldRetry: boolean;
    maxRetries: number;
    delay: number;
    backoffMultiplier: number;
  } {
    const baseStrategy = {
      shouldRetry: error.canRetry,
      maxRetries: 3,
      delay: 1000,
      backoffMultiplier: 1.5
    };

    // Customize based on error type
    switch (error.errorType) {
      case 'network':
        return { ...baseStrategy, maxRetries: 5, delay: 2000 };
      case 'timeout':
        return { ...baseStrategy, maxRetries: 2, delay: 5000 };
      case 'memory':
        return { ...baseStrategy, shouldRetry: false };
      case 'syntax':
        return { ...baseStrategy, shouldRetry: false };
      case 'security':
        return { ...baseStrategy, shouldRetry: false };
      default:
        return baseStrategy;
    }
  }

  /**
   * Generate user-friendly error notifications
   */
  public generateErrorNotification(error: ProcessedError): {
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    actions: Array<{
      label: string;
      action: string;
      primary?: boolean;
    }>;
  } {
    const baseNotification = {
      title: 'Execution Error',
      message: error.userFriendlyMessage,
      type: 'error' as const,
      actions: [] as Array<{ label: string; action: string; primary?: boolean }>
    };

    // Add retry action if possible
    if (error.canRetry) {
      baseNotification.actions.push({
        label: 'Retry',
        action: 'retry',
        primary: true
      });
    }

    // Add view suggestions action
    if (error.suggestions.length > 0) {
      baseNotification.actions.push({
        label: 'View Suggestions',
        action: 'suggestions'
      });
    }

    // Customize based on error type and severity
    switch (error.errorType) {
      case 'syntax':
        baseNotification.title = 'Syntax Error';
        baseNotification.actions.unshift({
          label: 'Check Syntax',
          action: 'check_syntax'
        });
        break;
      case 'timeout':
        baseNotification.title = 'Execution Timeout';
        baseNotification.message = 'Your code took too long to execute. Try optimizing it or breaking it into smaller parts.';
        baseNotification.actions.unshift({
          label: 'Optimize Code',
          action: 'optimize'
        });
        break;
      case 'memory':
        baseNotification.title = 'Memory Limit Exceeded';
        baseNotification.message = 'Your code used too much memory. Try processing smaller datasets or optimizing memory usage.';
        baseNotification.type = 'warning';
        break;
      case 'security':
        baseNotification.title = 'Security Violation';
        baseNotification.message = 'Your code was blocked for security reasons. Some operations are not allowed in this environment.';
        baseNotification.type = 'warning';
        break;
    }

    return baseNotification;
  }

  /**
   * Track error patterns for analytics
   */
  public trackErrorPattern(error: ProcessedError): void {
    // This would typically send to analytics service
    const errorData = {
      errorType: error.errorType,
      severity: error.severity,
      language: error.context.language,
      timestamp: Date.now(),
      userAgent: error.context.userAgent,
      canRetry: error.canRetry,
      suggestionsCount: error.suggestions.length
    };

    // Store in local storage for now (in production, send to analytics)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const existingErrors = JSON.parse(localStorage.getItem('code_execution_errors') || '[]');
        existingErrors.push(errorData);
        
        // Keep only last 100 errors
        if (existingErrors.length > 100) {
          existingErrors.splice(0, existingErrors.length - 100);
        }
        
        localStorage.setItem('code_execution_errors', JSON.stringify(existingErrors));
      }
    } catch (e) {
      console.warn('Failed to track error pattern:', e);
    }
  }

  /**
   * Get error analytics
   */
  public getErrorAnalytics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByLanguage: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    retryableErrors: number;
    averageSuggestions: number;
  } {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return {
          totalErrors: 0,
          errorsByType: {},
          errorsByLanguage: {},
          errorsBySeverity: {},
          retryableErrors: 0,
          averageSuggestions: 0
        };
      }
      
      const errors = JSON.parse(localStorage.getItem('code_execution_errors') || '[]');
      
      const analytics = {
        totalErrors: errors.length,
        errorsByType: {} as Record<string, number>,
        errorsByLanguage: {} as Record<string, number>,
        errorsBySeverity: {} as Record<string, number>,
        retryableErrors: 0,
        averageSuggestions: 0
      };

      let totalSuggestions = 0;

      errors.forEach((error: any) => {
        // Count by type
        analytics.errorsByType[error.errorType] = (analytics.errorsByType[error.errorType] || 0) + 1;
        
        // Count by language
        analytics.errorsByLanguage[error.language] = (analytics.errorsByLanguage[error.language] || 0) + 1;
        
        // Count by severity
        analytics.errorsBySeverity[error.severity] = (analytics.errorsBySeverity[error.severity] || 0) + 1;
        
        // Count retryable errors
        if (error.canRetry) {
          analytics.retryableErrors++;
        }
        
        // Sum suggestions
        totalSuggestions += error.suggestionsCount || 0;
      });

      analytics.averageSuggestions = errors.length > 0 ? totalSuggestions / errors.length : 0;

      return analytics;
    } catch (e) {
      console.warn('Failed to get error analytics:', e);
      return {
        totalErrors: 0,
        errorsByType: {},
        errorsByLanguage: {},
        errorsBySeverity: {},
        retryableErrors: 0,
        averageSuggestions: 0
      };
    }
  }

  // Private methods

  private classifyError(error: Error, language: string): string {
    const message = error.message.toLowerCase();

    // Security errors
    if (message.includes('security') || message.includes('violation') || 
        message.includes('malicious') || message.includes('blocked')) {
      return 'security';
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('connection') || message.includes('cors')) {
      return 'network';
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout';
    }

    // Memory errors
    if (message.includes('memory') || message.includes('heap') || 
        message.includes('stack overflow')) {
      return 'memory';
    }

    // Syntax errors
    if (message.includes('syntax') || message.includes('unexpected token') || 
        message.includes('invalid syntax')) {
      return 'syntax';
    }

    // Runtime errors
    if (message.includes('reference') || message.includes('type') || 
        message.includes('not defined') || message.includes('not a function')) {
      return 'runtime';
    }

    // Language-specific classification
    const patterns = this.errorPatterns.get(language) || [];
    for (const pattern of patterns) {
      if (pattern.test(error.message)) {
        return 'language_specific';
      }
    }

    return 'unknown';
  }

  private determineSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();

    // Critical errors
    if (message.includes('security') || message.includes('malicious') || 
        message.includes('violation') || message.includes('critical')) {
      return 'critical';
    }

    // High severity errors
    if (message.includes('memory') || message.includes('stack overflow') || 
        message.includes('recursion') || message.includes('crash')) {
      return 'high';
    }

    // Medium severity errors
    if (message.includes('timeout') || message.includes('network') || 
        message.includes('reference') || message.includes('type')) {
      return 'medium';
    }

    // Low severity errors (syntax, minor issues)
    return 'low';
  }

  private generateSuggestions(error: Error, context: ErrorContext): ErrorSuggestion[] {
    const suggestions: ErrorSuggestion[] = [];

    // Find matching error solutions
    for (const [pattern, solutions] of this.errorSolutions.entries()) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(error.message)) {
        suggestions.push(...solutions);
        break;
      }
    }

    // Add contextual suggestions
    const contextualSuggestions = this.generateContextualHelp(context.code, context.language);
    suggestions.push(...contextualSuggestions);

    // Add general suggestions based on language
    if (suggestions.length === 0) {
      suggestions.push(...this.getGeneralSuggestions(context.language));
    }

    return suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5); // Limit to top 5 suggestions
  }

  private generateUserFriendlyMessage(error: Error, context: ErrorContext): string {
    const errorType = this.classifyError(error, context.language);

    switch (errorType) {
      case 'syntax':
        return `There's a syntax error in your ${context.language} code. Check for typos, missing brackets, or incorrect punctuation.`;
      case 'runtime':
        return `Your code ran into an issue while executing. This usually means a variable or function wasn't found or used incorrectly.`;
      case 'security':
        return `Your code was blocked for security reasons. Some operations aren't allowed in this environment for safety.`;
      case 'timeout':
        return `Your code took too long to execute and was stopped. Try optimizing your code or reducing complexity.`;
      case 'memory':
        return `Your code used too much memory. Try processing smaller amounts of data or optimizing memory usage.`;
      case 'network':
        return `There was a network-related issue. Network requests aren't allowed in this environment.`;
      default:
        return `Something went wrong while running your code. Check the suggestions below for help fixing the issue.`;
    }
  }

  private canRetryError(error: Error, context: ErrorContext): boolean {
    const errorType = this.classifyError(error, context.language);
    
    // Don't retry these error types
    const nonRetryableErrors = ['syntax', 'security', 'memory'];
    return !nonRetryableErrors.includes(errorType);
  }

  private getRetryDelay(error: Error): number {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) return 5000; // 5 seconds
    if (message.includes('network')) return 2000; // 2 seconds
    return 1000; // 1 second default
  }

  private getGeneralSuggestions(language: string): ErrorSuggestion[] {
    const suggestions: Record<string, ErrorSuggestion[]> = {
      javascript: [
        {
          type: 'documentation',
          title: 'JavaScript Reference',
          description: 'Check the MDN JavaScript documentation',
          link: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
          priority: 5
        }
      ],
      python: [
        {
          type: 'documentation',
          title: 'Python Documentation',
          description: 'Check the official Python documentation',
          link: 'https://docs.python.org/3/',
          priority: 5
        }
      ],
      sql: [
        {
          type: 'documentation',
          title: 'SQLite Documentation',
          description: 'Check the SQLite documentation',
          link: 'https://www.sqlite.org/docs.html',
          priority: 5
        }
      ]
    };

    return suggestions[language] || [];
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();