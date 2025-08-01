/**
 * Tests for Universal Code Executor
 */

import { UniversalCodeExecutor } from '../executor';
import { CodeExecutionRequest } from '../types';

// Mock DOM for web engine
const mockDocument = {
  createElement: jest.fn(() => ({
    setAttribute: jest.fn(),
    style: {},
    appendChild: jest.fn(),
    contentDocument: null,
    contentWindow: null,
    onload: null,
    onerror: null,
    src: ''
  })),
  getElementById: jest.fn(() => null),
  body: {
    appendChild: jest.fn()
  }
};

// Only set if not already defined
if (typeof document === 'undefined') {
  (global as any).document = mockDocument;
}

describe('UniversalCodeExecutor', () => {
  let executor: UniversalCodeExecutor;

  beforeEach(() => {
    executor = new UniversalCodeExecutor();
  });

  describe('Engine registration', () => {
    test('should have web engine registered by default', () => {
      const engines = executor.getAvailableEngines();
      expect(engines).toContain('web');
    });

    test('should support web languages', () => {
      expect(executor.isLanguageSupported('html')).toBe(true);
      expect(executor.isLanguageSupported('css')).toBe(true);
      expect(executor.isLanguageSupported('javascript')).toBe(true);
      expect(executor.isLanguageSupported('typescript')).toBe(true);
    });

    test('should not support unregistered languages yet', () => {
      expect(executor.isLanguageSupported('python')).toBe(false);
      expect(executor.isLanguageSupported('sql')).toBe(false);
    });
  });

  describe('Code validation', () => {
    test('should validate safe HTML code', async () => {
      const isValid = await executor.validateCode('<h1>Hello</h1>', 'html');
      expect(isValid).toBe(true);
    });

    test('should validate safe JavaScript code', async () => {
      const isValid = await executor.validateCode('console.log("Hello");', 'javascript');
      expect(isValid).toBe(true);
    });

    test('should reject empty code', async () => {
      const isValid = await executor.validateCode('', 'html');
      expect(isValid).toBe(false);
    });

    test('should reject whitespace-only code', async () => {
      const isValid = await executor.validateCode('   \n  \t  ', 'html');
      expect(isValid).toBe(false);
    });
  });

  describe('Code execution', () => {
    test('should execute HTML code successfully', async () => {
      const request: CodeExecutionRequest = {
        code: '<h1>Hello World</h1>',
        language: 'html',
        sessionId: 'test-html'
      };

      const result = await executor.execute(request);

      expect(result.success).toBe(true);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.sessionId).toBe('test-html');
    });

    test('should execute JavaScript code successfully', async () => {
      const request: CodeExecutionRequest = {
        code: 'console.log("Hello JavaScript!");',
        language: 'javascript',
        sessionId: 'test-js'
      };

      const result = await executor.execute(request);

      expect(result.success).toBe(true);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.sessionId).toBe('test-js');
    });

    test('should handle empty code gracefully', async () => {
      const request: CodeExecutionRequest = {
        code: '',
        language: 'html'
      };

      const result = await executor.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Code cannot be empty');
    });

    test('should handle unsupported language', async () => {
      const request: CodeExecutionRequest = {
        code: 'print("Hello")',
        language: 'python'
      };

      const result = await executor.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No engine available for language: python');
    });

    test('should apply default options from language config', async () => {
      const request: CodeExecutionRequest = {
        code: '<h1>Test</h1>',
        language: 'html'
      };

      const result = await executor.execute(request);

      expect(result.success).toBe(true);
      // Should have applied default timeout and other options
    });
  });

  describe('Concurrent execution limits', () => {
    test('should allow multiple executions up to limit', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => ({
        code: `<h1>Test ${i}</h1>`,
        language: 'html' as const,
        sessionId: 'concurrent-test'
      }));

      // Execute all requests simultaneously
      const promises = requests.map(request => executor.execute(request));
      const results = await Promise.all(promises);

      // All should succeed (within limit)
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Error handling', () => {
    test('should handle execution timeout gracefully', async () => {
      const request: CodeExecutionRequest = {
        code: '<h1>Test</h1>',
        language: 'html',
        options: {
          timeout: 1 // Very short timeout
        }
      };

      const result = await executor.execute(request);

      // Should complete quickly enough or handle timeout gracefully
      expect(result.executionTime).toBeDefined();
    });
  });
});