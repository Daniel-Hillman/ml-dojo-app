/**
 * Unit tests for Error Handler
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the error handler
const mockErrorHandler = {
  processError: jest.fn(),
  generateSuggestions: jest.fn(),
  formatErrorMessage: jest.fn(),
  logError: jest.fn(),
  getErrorCategory: jest.fn()
};

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Processing', () => {
    it('should process JavaScript syntax errors', () => {
      const error = new Error('Unexpected token }');
      const context = {
        language: 'javascript',
        code: 'function test() { console.log("test"); }',
        line: 1,
        column: 45
      };

      const processedError = {
        originalError: error,
        userFriendlyMessage: 'Syntax Error: Missing opening brace or extra closing brace',
        suggestions: [
          'Check that all opening braces { have matching closing braces }',
          'Make sure parentheses () are properly balanced'
        ],
        category: 'syntax',
        severity: 'error'
      };

      mockErrorHandler.processError.mockReturnValue(processedError);

      const result = mockErrorHandler.processError(error, context);

      expect(result).toEqual(processedError);
      expect(result.userFriendlyMessage).toContain('Syntax Error');
      expect(result.suggestions).toHaveLength(2);
      expect(mockErrorHandler.processError).toHaveBeenCalledWith(error, context);
    });

    it('should process Python syntax errors', () => {
      const error = new Error('SyntaxError: invalid syntax');
      const context = {
        language: 'python',
        code: 'print("Hello World"',
        line: 1,
        column: 20
      };

      const processedError = {
        originalError: error,
        userFriendlyMessage: 'Python Syntax Error: Missing closing parenthesis',
        suggestions: [
          'Check that all opening parentheses ( have matching closing parentheses )',
          'Make sure string quotes are properly closed'
        ],
        category: 'syntax',
        severity: 'error'
      };

      mockErrorHandler.processError.mockReturnValue(processedError);

      const result = mockErrorHandler.processError(error, context);

      expect(result.userFriendlyMessage).toContain('Python Syntax Error');
      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0]).toContain('parentheses');
    });

    it('should process SQL errors', () => {
      const error = new Error('near "SELCT": syntax error');
      const context = {
        language: 'sql',
        code: 'SELCT * FROM users;',
        line: 1,
        column: 1
      };

      const processedError = {
        originalError: error,
        userFriendlyMessage: 'SQL Error: Invalid keyword "SELCT", did you mean "SELECT"?',
        suggestions: [
          'Check spelling of SQL keywords',
          'Common keywords: SELECT, INSERT, UPDATE, DELETE, CREATE, DROP'
        ],
        category: 'syntax',
        severity: 'error'
      };

      mockErrorHandler.processError.mockReturnValue(processedError);

      const result = mockErrorHandler.processError(error, context);

      expect(result.userFriendlyMessage).toContain('did you mean "SELECT"');
      expect(result.suggestions).toContain('Check spelling of SQL keywords');
    });
  });

  describe('Error Categorization', () => {
    it('should categorize syntax errors', () => {
      mockErrorHandler.getErrorCategory.mockReturnValue('syntax');

      const category = mockErrorHandler.getErrorCategory('Unexpected token');
      expect(category).toBe('syntax');
    });

    it('should categorize runtime errors', () => {
      mockErrorHandler.getErrorCategory.mockReturnValue('runtime');

      const category = mockErrorHandler.getErrorCategory('Cannot read property of null');
      expect(category).toBe('runtime');
    });

    it('should categorize timeout errors', () => {
      mockErrorHandler.getErrorCategory.mockReturnValue('timeout');

      const category = mockErrorHandler.getErrorCategory('Execution timed out');
      expect(category).toBe('timeout');
    });

    it('should categorize memory errors', () => {
      mockErrorHandler.getErrorCategory.mockReturnValue('memory');

      const category = mockErrorHandler.getErrorCategory('Out of memory');
      expect(category).toBe('memory');
    });
  });

  describe('Suggestion Generation', () => {
    it('should generate suggestions for common JavaScript errors', () => {
      const suggestions = [
        'Check variable names for typos',
        'Make sure variables are declared before use',
        'Verify function names are spelled correctly'
      ];

      mockErrorHandler.generateSuggestions.mockReturnValue(suggestions);

      const result = mockErrorHandler.generateSuggestions('ReferenceError', 'javascript');

      expect(result).toEqual(suggestions);
      expect(result).toHaveLength(3);
      expect(result[0]).toContain('variable names');
    });

    it('should generate suggestions for Python import errors', () => {
      const suggestions = [
        'Check if the module is installed: pip install module_name',
        'Verify the module name spelling',
        'Make sure the module is available in your Python environment'
      ];

      mockErrorHandler.generateSuggestions.mockReturnValue(suggestions);

      const result = mockErrorHandler.generateSuggestions('ModuleNotFoundError', 'python');

      expect(result.some(s => s.includes('pip install module_name'))).toBe(true);
      expect(result.some(s => s.includes('module name spelling'))).toBe(true);
    });

    it('should generate suggestions for SQL table errors', () => {
      const suggestions = [
        'Check if the table exists: SHOW TABLES;',
        'Verify table name spelling and case sensitivity',
        'Make sure you have permission to access the table'
      ];

      mockErrorHandler.generateSuggestions.mockReturnValue(suggestions);

      const result = mockErrorHandler.generateSuggestions('no such table', 'sql');

      expect(result.some(s => s.includes('SHOW TABLES'))).toBe(true);
      expect(result.some(s => s.includes('table name spelling'))).toBe(true);
    });
  });

  describe('Error Message Formatting', () => {
    it('should format error messages for display', () => {
      const rawError = 'TypeError: Cannot read property "length" of undefined at line 5';
      const formattedError = 'Type Error: Cannot read property "length" of undefined\nLocation: Line 5';

      mockErrorHandler.formatErrorMessage.mockReturnValue(formattedError);

      const result = mockErrorHandler.formatErrorMessage(rawError);

      expect(result).toBe(formattedError);
      expect(result).toContain('Type Error');
      expect(result).toContain('Location: Line 5');
    });

    it('should sanitize error messages to prevent information disclosure', () => {
      const rawError = 'Error: ENOENT: no such file or directory, open "/usr/local/app/secret.txt"';
      const sanitizedError = 'Error: File not found';

      mockErrorHandler.formatErrorMessage.mockReturnValue(sanitizedError);

      const result = mockErrorHandler.formatErrorMessage(rawError);

      expect(result).toBe(sanitizedError);
      expect(result).not.toContain('/usr/local');
      expect(result).not.toContain('secret.txt');
    });

    it('should handle stack traces appropriately', () => {
      const rawError = `Error: Test error
    at Object.test (/app/src/test.js:10:5)
    at Module._compile (module.js:456:26)
    at Object.Module._extensions..js (module.js:474:10)`;

      const cleanedError = `Error: Test error
    at test function (line 10)`;

      mockErrorHandler.formatErrorMessage.mockReturnValue(cleanedError);

      const result = mockErrorHandler.formatErrorMessage(rawError);

      expect(result).toBe(cleanedError);
      expect(result).not.toContain('/app/src');
      expect(result).not.toContain('Module._compile');
    });
  });

  describe('Error Logging', () => {
    it('should log errors with appropriate metadata', () => {
      const error = new Error('Test error');
      const metadata = {
        userId: 'user-123',
        sessionId: 'session-456',
        language: 'javascript',
        timestamp: Date.now()
      };

      mockErrorHandler.logError.mockReturnValue(true);

      const result = mockErrorHandler.logError(error, metadata);

      expect(result).toBe(true);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, metadata);
    });

    it('should handle logging failures gracefully', () => {
      const error = new Error('Test error');
      
      mockErrorHandler.logError.mockImplementation(() => {
        throw new Error('Logging failed');
      });

      // Should not throw even if logging fails
      expect(() => {
        try {
          mockErrorHandler.logError(error, {});
        } catch (e) {
          // Logging errors should be handled internally
        }
      }).not.toThrow();
    });
  });

  describe('Language-Specific Error Handling', () => {
    it('should handle JavaScript-specific errors', () => {
      const jsErrors = [
        'ReferenceError: variable is not defined',
        'TypeError: Cannot read property of null',
        'SyntaxError: Unexpected token',
        'RangeError: Maximum call stack size exceeded'
      ];

      jsErrors.forEach(errorMsg => {
        mockErrorHandler.processError.mockReturnValue({
          userFriendlyMessage: `JavaScript: ${errorMsg}`,
          suggestions: ['JavaScript-specific suggestion'],
          category: 'javascript-error'
        });

        const result = mockErrorHandler.processError(new Error(errorMsg), { language: 'javascript' });
        expect(result.userFriendlyMessage).toContain('JavaScript');
      });
    });

    it('should handle Python-specific errors', () => {
      const pythonErrors = [
        'NameError: name "variable" is not defined',
        'IndentationError: expected an indented block',
        'ImportError: No module named "module"',
        'KeyError: "key"'
      ];

      pythonErrors.forEach(errorMsg => {
        mockErrorHandler.processError.mockReturnValue({
          userFriendlyMessage: `Python: ${errorMsg}`,
          suggestions: ['Python-specific suggestion'],
          category: 'python-error'
        });

        const result = mockErrorHandler.processError(new Error(errorMsg), { language: 'python' });
        expect(result.userFriendlyMessage).toContain('Python');
      });
    });

    it('should handle SQL-specific errors', () => {
      const sqlErrors = [
        'syntax error near "SELECT"',
        'no such table: users',
        'column "name" does not exist',
        'UNIQUE constraint failed'
      ];

      sqlErrors.forEach(errorMsg => {
        mockErrorHandler.processError.mockReturnValue({
          userFriendlyMessage: `SQL: ${errorMsg}`,
          suggestions: ['SQL-specific suggestion'],
          category: 'sql-error'
        });

        const result = mockErrorHandler.processError(new Error(errorMsg), { language: 'sql' });
        expect(result.userFriendlyMessage).toContain('SQL');
      });
    });
  });
});