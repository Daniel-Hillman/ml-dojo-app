/**
 * Performance Benchmarking Tests for Live Code Execution System
 * Tests execution speed, memory usage, and resource efficiency
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { codeExecutor } from '../index';
import { performanceMetrics } from '../performance-metrics';
import { performanceOptimizer } from '../performance-optimizations';

describe('Performance Benchmarking Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMetrics.clearMetrics();
    performanceOptimizer.clearCache();
  });

  afterEach(() => {
    // Cleanup any running executions
    codeExecutor.cancelAllExecutions?.();
  });

  describe('Execution Speed Benchmarks', () => {
    it('should execute simple JavaScript within 100ms', async () => {
      const code = 'console.log("Speed test");';
      const start = performance.now();

      const result = await codeExecutor.execute({
        code,
        language: 'javascript',
        sessionId: 'speed-test-js'
      });

      const duration = performance.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
      expect(result.executionTime).toBeLessThan(50); // Engine execution should be even faster
    });

    it('should execute Python code within 2 seconds', async () => {
      const code = 'print("Python speed test")';
      const start = performance.now();

      const result = await codeExecutor.execute({
        code,
        language: 'python',
        sessionId: 'speed-test-python'
      });

      const duration = performance.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should execute SQL queries within 500ms', async () => {
      const code = 'SELECT 1 as test_value;';
      const start = performance.now();

      const result = await codeExecutor.execute({
        code,
        language: 'sql',
        sessionId: 'speed-test-sql'
      });

      const duration = performance.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });

    it('should handle concurrent executions efficiently', async () => {
      const concurrentCount = 10;
      const code = 'console.log("Concurrent test");';
      
      const start = performance.now();
      
      const promises = Array.from({ length: concurrentCount }, (_, i) =>
        codeExecutor.execute({
          code,
          language: 'javascript',
          sessionId: `concurrent-${i}`
        })
      );

      const results = await Promise.all(promises);
      const totalDuration = performance.now() - start;

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Total time should be reasonable (not linear with count)
      expect(totalDuration).toBeLessThan(concurrentCount * 100);
    });
  });

  describe('Memory Usage Benchmarks', () => {
    it('should maintain stable memory usage across multiple executions', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const executionCount = 50;

      // Execute multiple times
      for (let i = 0; i < executionCount; i++) {
        await codeExecutor.execute({
          code: `console.log("Memory test ${i}");`,
          language: 'javascript',
          sessionId: `memory-test-${i}`
        });

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large code inputs efficiently', async () => {
      const largeCode = 'console.log("test");'.repeat(1000);
      const initialMemory = process.memoryUsage().heapUsed;

      const result = await codeExecutor.execute({
        code: largeCode,
        language: 'javascript',
        sessionId: 'large-code-test'
      });

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(result.success).toBe(true);
      // Memory increase should be proportional but not excessive
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });

    it('should clean up resources after execution', async () => {
      const sessionId = 'cleanup-test';
      const initialMemory = process.memoryUsage().heapUsed;

      // Execute code that creates resources
      await codeExecutor.execute({
        code: `
          const largeArray = new Array(100000).fill('data');
          console.log('Created large array');
        `,
        language: 'javascript',
        sessionId
      });

      // Cleanup the session
      await codeExecutor.cleanup?.(sessionId);

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDiff = Math.abs(finalMemory - initialMemory);

      // Memory should return close to initial state
      expect(memoryDiff).toBeLessThan(5 * 1024 * 1024); // Within 5MB
    });
  });

  describe('Caching Performance', () => {
    it('should improve performance with code caching', async () => {
      const code = 'console.log("Cache test");';

      // First execution (cold)
      const start1 = performance.now();
      const result1 = await codeExecutor.execute({
        code,
        language: 'javascript',
        sessionId: 'cache-test-1'
      });
      const duration1 = performance.now() - start1;

      // Second execution (should be cached)
      const start2 = performance.now();
      const result2 = await codeExecutor.execute({
        code,
        language: 'javascript',
        sessionId: 'cache-test-2'
      });
      const duration2 = performance.now() - start2;

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Second execution should be faster (allowing some variance)
      expect(duration2).toBeLessThanOrEqual(duration1 * 1.2);
    });

    it('should cache compiled engines effectively', async () => {
      // Test engine initialization caching
      const engines = ['javascript', 'python', 'sql'];
      const initTimes: number[] = [];

      for (const language of engines) {
        const start = performance.now();
        
        await codeExecutor.execute({
          code: language === 'python' ? 'print("test")' : 
                language === 'sql' ? 'SELECT 1;' : 'console.log("test");',
          language: language as any,
          sessionId: `engine-cache-${language}`
        });

        initTimes.push(performance.now() - start);
      }

      // Subsequent executions should be faster
      for (let i = 0; i < engines.length; i++) {
        const language = engines[i];
        const start = performance.now();
        
        await codeExecutor.execute({
          code: language === 'python' ? 'print("test2")' : 
                language === 'sql' ? 'SELECT 2;' : 'console.log("test2");',
          language: language as any,
          sessionId: `engine-cache-2-${language}`
        });

        const secondTime = performance.now() - start;
        
        // Should be faster than initial (allowing for variance)
        expect(secondTime).toBeLessThanOrEqual(initTimes[i] * 1.5);
      }
    });
  });

  describe('Resource Limit Enforcement', () => {
    it('should enforce execution timeouts efficiently', async () => {
      const timeoutMs = 1000;
      const start = performance.now();

      const result = await codeExecutor.execute({
        code: 'while(true) { /* infinite loop */ }',
        language: 'javascript',
        options: { timeout: timeoutMs },
        sessionId: 'timeout-test'
      });

      const duration = performance.now() - start;

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      // Should timeout close to the specified time (within 500ms variance)
      expect(duration).toBeGreaterThan(timeoutMs - 100);
      expect(duration).toBeLessThan(timeoutMs + 500);
    });

    it('should enforce memory limits without crashing', async () => {
      const result = await codeExecutor.execute({
        code: `
          const arrays = [];
          try {
            for (let i = 0; i < 1000; i++) {
              arrays.push(new Array(100000).fill(i));
            }
          } catch (e) {
            console.log('Memory limit reached');
          }
        `,
        language: 'javascript',
        options: { memoryLimit: 10 * 1024 * 1024 }, // 10MB limit
        sessionId: 'memory-limit-test'
      });

      expect(result).toBeDefined();
      // Should either succeed with warning or fail gracefully
      if (!result.success) {
        expect(result.error).toMatch(/memory|limit/i);
      }
    });

    it('should handle CPU-intensive operations within limits', async () => {
      const start = performance.now();

      const result = await codeExecutor.execute({
        code: `
          let sum = 0;
          for (let i = 0; i < 10000000; i++) {
            sum += Math.sqrt(i);
          }
          console.log('Sum:', sum);
        `,
        language: 'javascript',
        options: { timeout: 5000 },
        sessionId: 'cpu-intensive-test'
      });

      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5500); // Should complete or timeout within limit
    });
  });

  describe('Scalability Tests', () => {
    it('should handle increasing load gracefully', async () => {
      const loadLevels = [1, 5, 10, 20];
      const results: Array<{ load: number; avgTime: number; successRate: number }> = [];

      for (const load of loadLevels) {
        const promises = Array.from({ length: load }, (_, i) =>
          codeExecutor.execute({
            code: `console.log("Load test ${i}");`,
            language: 'javascript',
            sessionId: `load-test-${load}-${i}`
          })
        );

        const start = performance.now();
        const execResults = await Promise.allSettled(promises);
        const avgTime = (performance.now() - start) / load;

        const successful = execResults.filter(r => 
          r.status === 'fulfilled' && (r.value as any).success
        ).length;
        const successRate = successful / load;

        results.push({ load, avgTime, successRate });
      }

      // Success rate should remain high even under load
      results.forEach(result => {
        expect(result.successRate).toBeGreaterThan(0.8); // At least 80% success
      });

      // Average time shouldn't increase dramatically
      const baseTime = results[0].avgTime;
      const highLoadTime = results[results.length - 1].avgTime;
      expect(highLoadTime).toBeLessThan(baseTime * 3); // No more than 3x slower
    });

    it('should maintain performance with session accumulation', async () => {
      const sessionCount = 100;
      const executionTimes: number[] = [];

      // Create many sessions
      for (let i = 0; i < sessionCount; i++) {
        const start = performance.now();
        
        await codeExecutor.execute({
          code: `console.log("Session ${i}");`,
          language: 'javascript',
          sessionId: `accumulation-test-${i}`
        });

        executionTimes.push(performance.now() - start);
      }

      // Performance shouldn't degrade significantly over time
      const firstTen = executionTimes.slice(0, 10);
      const lastTen = executionTimes.slice(-10);

      const avgFirst = firstTen.reduce((a, b) => a + b) / firstTen.length;
      const avgLast = lastTen.reduce((a, b) => a + b) / lastTen.length;

      // Last executions shouldn't be more than 2x slower than first
      expect(avgLast).toBeLessThan(avgFirst * 2);
    });
  });

  describe('Engine-Specific Performance', () => {
    it('should benchmark JavaScript engine performance', async () => {
      const testCases = [
        { name: 'Simple calculation', code: 'const result = 2 + 2;' },
        { name: 'Array operations', code: 'const arr = [1,2,3].map(x => x * 2);' },
        { name: 'String manipulation', code: 'const str = "hello".toUpperCase().repeat(100);' },
        { name: 'Object creation', code: 'const obj = { a: 1, b: 2, c: 3 };' }
      ];

      for (const testCase of testCases) {
        const start = performance.now();
        
        const result = await codeExecutor.execute({
          code: testCase.code,
          language: 'javascript',
          sessionId: `js-perf-${testCase.name.replace(/\s+/g, '-')}`
        });

        const duration = performance.now() - start;

        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(100); // All should be fast
      }
    });

    it('should benchmark Python engine performance', async () => {
      const testCases = [
        { name: 'Simple calculation', code: 'result = 2 + 2' },
        { name: 'List comprehension', code: 'squares = [x**2 for x in range(100)]' },
        { name: 'String operations', code: 'text = "hello " * 100' },
        { name: 'Dictionary creation', code: 'data = {str(i): i**2 for i in range(50)}' }
      ];

      for (const testCase of testCases) {
        const start = performance.now();
        
        const result = await codeExecutor.execute({
          code: testCase.code,
          language: 'python',
          sessionId: `python-perf-${testCase.name.replace(/\s+/g, '-')}`
        });

        const duration = performance.now() - start;

        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(2000); // Python operations should complete within 2s
      }
    });

    it('should benchmark SQL engine performance', async () => {
      const testCases = [
        { name: 'Simple select', code: 'SELECT 1 as value;' },
        { name: 'Table creation', code: 'CREATE TABLE test (id INTEGER, name TEXT);' },
        { name: 'Data insertion', code: 'INSERT INTO test VALUES (1, "Alice"), (2, "Bob");' },
        { name: 'Join query', code: 'SELECT * FROM test t1 JOIN test t2 ON t1.id = t2.id;' }
      ];

      for (const testCase of testCases) {
        const start = performance.now();
        
        const result = await codeExecutor.execute({
          code: testCase.code,
          language: 'sql',
          sessionId: `sql-perf-${testCase.name.replace(/\s+/g, '-')}`
        });

        const duration = performance.now() - start;

        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(500); // SQL operations should be fast
      }
    });
  });

  describe('Performance Metrics Collection', () => {
    it('should collect accurate performance metrics', async () => {
      const executionId = 'metrics-test';
      const codeSize = 50;

      // Start tracking
      performanceMetrics.startExecution(executionId, 'javascript', codeSize);

      const result = await codeExecutor.execute({
        code: 'console.log("Metrics test");',
        language: 'javascript',
        sessionId: executionId
      });

      // End tracking
      const metrics = performanceMetrics.endExecution(
        executionId, 
        result.success, 
        result.output?.length || 0
      );

      expect(metrics).toBeDefined();
      expect(metrics?.executionId).toBe(executionId);
      expect(metrics?.language).toBe('javascript');
      expect(metrics?.codeSize).toBe(codeSize);
      expect(metrics?.duration).toBeGreaterThan(0);
      expect(metrics?.success).toBe(result.success);
    });

    it('should track performance trends over time', async () => {
      const executionCount = 10;
      const code = 'console.log("Trend test");';

      // Execute multiple times
      for (let i = 0; i < executionCount; i++) {
        const executionId = `trend-test-${i}`;
        performanceMetrics.startExecution(executionId, 'javascript', code.length);

        const result = await codeExecutor.execute({
          code,
          language: 'javascript',
          sessionId: executionId
        });

        performanceMetrics.endExecution(executionId, result.success, result.output?.length || 0);
      }

      const trends = performanceMetrics.getPerformanceTrends('javascript');
      
      expect(trends).toBeDefined();
      expect(trends.totalExecutions).toBe(executionCount);
      expect(trends.averageDuration).toBeGreaterThan(0);
      expect(trends.successRate).toBeGreaterThan(0.8);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', async () => {
      const baselineCode = 'console.log("baseline");';
      const regressionCode = `
        // Simulate slower code
        for (let i = 0; i < 10000; i++) {
          Math.random();
        }
        console.log("regression");
      `;

      // Establish baseline
      const baselineResults = [];
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await codeExecutor.execute({
          code: baselineCode,
          language: 'javascript',
          sessionId: `baseline-${i}`
        });
        baselineResults.push(performance.now() - start);
      }

      const baselineAvg = baselineResults.reduce((a, b) => a + b) / baselineResults.length;

      // Test regression
      const start = performance.now();
      await codeExecutor.execute({
        code: regressionCode,
        language: 'javascript',
        sessionId: 'regression-test'
      });
      const regressionTime = performance.now() - start;

      // Regression should be significantly slower
      expect(regressionTime).toBeGreaterThan(baselineAvg * 2);
    });
  });
});

describe('Load Testing', () => {
  it('should handle sustained load over time', async () => {
    const duration = 5000; // 5 seconds
    const interval = 100; // Execute every 100ms
    const startTime = Date.now();
    const results: boolean[] = [];

    while (Date.now() - startTime < duration) {
      const result = await codeExecutor.execute({
        code: 'console.log("Load test");',
        language: 'javascript',
        sessionId: `load-${Date.now()}`
      });

      results.push(result.success);

      // Wait for next interval
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    // Should maintain high success rate under sustained load
    const successRate = results.filter(Boolean).length / results.length;
    expect(successRate).toBeGreaterThan(0.9); // 90% success rate
    expect(results.length).toBeGreaterThan(30); // Should have executed many times
  });

  it('should handle burst traffic patterns', async () => {
    const burstSize = 20;
    const burstCount = 3;
    const results: boolean[] = [];

    for (let burst = 0; burst < burstCount; burst++) {
      // Create burst of concurrent requests
      const burstPromises = Array.from({ length: burstSize }, (_, i) =>
        codeExecutor.execute({
          code: `console.log("Burst ${burst}-${i}");`,
          language: 'javascript',
          sessionId: `burst-${burst}-${i}`
        })
      );

      const burstResults = await Promise.allSettled(burstPromises);
      
      burstResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push((result.value as any).success);
        } else {
          results.push(false);
        }
      });

      // Wait between bursts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Should handle bursts well
    const successRate = results.filter(Boolean).length / results.length;
    expect(successRate).toBeGreaterThan(0.8); // 80% success rate for burst traffic
  });
});