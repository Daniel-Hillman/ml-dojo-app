/**
 * Load Testing Suite for Live Code Execution System
 * Tests system behavior under various load conditions
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { codeExecutor } from '../index';
import { executionManager } from '../execution-controller';
import { getResourceMonitor } from '../resource-monitor';

describe('Load Testing Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getResourceMonitor().reset?.();
  });

  afterEach(() => {
    // Cleanup any running executions
    executionManager.cancelAllExecutions();
  });

  describe('Concurrent Execution Load Tests', () => {
    it('should handle 50 concurrent JavaScript executions', async () => {
      const concurrentCount = 50;
      const code = 'console.log("Concurrent test");';
      
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentCount }, (_, i) =>
        codeExecutor.execute({
          code,
          language: 'javascript',
          sessionId: `concurrent-js-${i}`,
          options: { timeout: 10000 }
        })
      );

      const results = await Promise.allSettled(promises);
      const totalTime = Date.now() - startTime;

      // Analyze results
      const successful = results.filter(r => 
        r.status === 'fulfilled' && (r.value as any).success
      ).length;
      const failed = results.length - successful;
      const successRate = successful / results.length;

      console.log(`Concurrent JS Load Test Results:
        - Total executions: ${concurrentCount}
        - Successful: ${successful}
        - Failed: ${failed}
        - Success rate: ${(successRate * 100).toFixed(2)}%
        - Total time: ${totalTime}ms
        - Average time per execution: ${(totalTime / concurrentCount).toFixed(2)}ms`);

      // Assertions
      expect(successRate).toBeGreaterThan(0.8); // At least 80% success rate
      expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should handle mixed language concurrent executions', async () => {
      const executionsPerLanguage = 10;
      const languages = [
        { lang: 'javascript', code: 'console.log("JS test");' },
        { lang: 'python', code: 'print("Python test")' },
        { lang: 'sql', code: 'SELECT "SQL test" as message;' }
      ];

      const allPromises = languages.flatMap(({ lang, code }) =>
        Array.from({ length: executionsPerLanguage }, (_, i) =>
          codeExecutor.execute({
            code,
            language: lang as any,
            sessionId: `mixed-${lang}-${i}`,
            options: { timeout: 15000 }
          })
        )
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(allPromises);
      const totalTime = Date.now() - startTime;

      // Analyze by language
      const resultsByLanguage = languages.map(({ lang }) => {
        const langResults = results.slice(
          languages.indexOf(languages.find(l => l.lang === lang)!) * executionsPerLanguage,
          (languages.indexOf(languages.find(l => l.lang === lang)!) + 1) * executionsPerLanguage
        );
        
        const successful = langResults.filter(r => 
          r.status === 'fulfilled' && (r.value as any).success
        ).length;

        return {
          language: lang,
          total: executionsPerLanguage,
          successful,
          successRate: successful / executionsPerLanguage
        };
      });

      console.log('Mixed Language Load Test Results:');
      resultsByLanguage.forEach(result => {
        console.log(`  ${result.language}: ${result.successful}/${result.total} (${(result.successRate * 100).toFixed(2)}%)`);
      });

      // All languages should have reasonable success rates
      resultsByLanguage.forEach(result => {
        expect(result.successRate).toBeGreaterThan(0.7); // At least 70% for mixed load
      });

      expect(totalTime).toBeLessThan(45000); // Should complete within 45 seconds
    });

    it('should handle rapid sequential executions', async () => {
      const executionCount = 100;
      const code = 'console.log("Sequential test");';
      const results: Array<{ success: boolean; time: number }> = [];

      const startTime = Date.now();

      for (let i = 0; i < executionCount; i++) {
        const execStart = Date.now();
        
        const result = await codeExecutor.execute({
          code,
          language: 'javascript',
          sessionId: `sequential-${i}`,
          options: { timeout: 5000 }
        });

        const execTime = Date.now() - execStart;
        results.push({ success: result.success, time: execTime });

        // Small delay to prevent overwhelming
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      const totalTime = Date.now() - startTime;
      const successful = results.filter(r => r.success).length;
      const successRate = successful / executionCount;
      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;

      console.log(`Sequential Load Test Results:
        - Total executions: ${executionCount}
        - Successful: ${successful}
        - Success rate: ${(successRate * 100).toFixed(2)}%
        - Total time: ${totalTime}ms
        - Average execution time: ${avgTime.toFixed(2)}ms`);

      expect(successRate).toBeGreaterThan(0.9); // Should handle sequential well
      expect(avgTime).toBeLessThan(200); // Each execution should be fast
    });
  });

  describe('Resource Exhaustion Tests', () => {
    it('should handle memory-intensive concurrent executions', async () => {
      const concurrentCount = 20;
      const memoryIntensiveCode = `
        const arrays = [];
        for (let i = 0; i < 1000; i++) {
          arrays.push(new Array(1000).fill(i));
        }
        console.log('Memory test completed');
      `;

      const promises = Array.from({ length: concurrentCount }, (_, i) =>
        codeExecutor.execute({
          code: memoryIntensiveCode,
          language: 'javascript',
          sessionId: `memory-intensive-${i}`,
          options: { 
            timeout: 10000,
            memoryLimit: 50 * 1024 * 1024 // 50MB per execution
          }
        })
      );

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => 
        r.status === 'fulfilled' && (r.value as any).success
      ).length;
      const memoryErrors = results.filter(r => 
        r.status === 'fulfilled' && 
        !(r.value as any).success && 
        (r.value as any).error?.includes('memory')
      ).length;

      console.log(`Memory Intensive Load Test:
        - Successful: ${successful}/${concurrentCount}
        - Memory errors: ${memoryErrors}
        - Other errors: ${concurrentCount - successful - memoryErrors}`);

      // Should handle memory limits gracefully
      expect(successful + memoryErrors).toBe(concurrentCount); // All should complete
      expect(successful).toBeGreaterThan(concurrentCount * 0.5); // At least 50% should succeed
    });

    it('should handle CPU-intensive concurrent executions', async () => {
      const concurrentCount = 15;
      const cpuIntensiveCode = `
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += Math.sqrt(i) * Math.sin(i);
        }
        console.log('CPU test completed:', sum);
      `;

      const startTime = Date.now();

      const promises = Array.from({ length: concurrentCount }, (_, i) =>
        codeExecutor.execute({
          code: cpuIntensiveCode,
          language: 'javascript',
          sessionId: `cpu-intensive-${i}`,
          options: { timeout: 15000 }
        })
      );

      const results = await Promise.allSettled(promises);
      const totalTime = Date.now() - startTime;

      const successful = results.filter(r => 
        r.status === 'fulfilled' && (r.value as any).success
      ).length;
      const timeouts = results.filter(r => 
        r.status === 'fulfilled' && 
        !(r.value as any).success && 
        (r.value as any).error?.includes('timeout')
      ).length;

      console.log(`CPU Intensive Load Test:
        - Successful: ${successful}/${concurrentCount}
        - Timeouts: ${timeouts}
        - Total time: ${totalTime}ms`);

      // Should handle CPU load reasonably
      expect(successful + timeouts).toBe(concurrentCount);
      expect(successful).toBeGreaterThan(concurrentCount * 0.6); // At least 60% should succeed
      expect(totalTime).toBeLessThan(60000); // Should complete within 1 minute
    });
  });

  describe('Sustained Load Tests', () => {
    it('should maintain performance under sustained load', async () => {
      const testDuration = 10000; // 10 seconds
      const executionInterval = 200; // Execute every 200ms
      const startTime = Date.now();
      const results: Array<{ timestamp: number; success: boolean; duration: number }> = [];

      let executionCounter = 0;

      while (Date.now() - startTime < testDuration) {
        const execStart = Date.now();
        
        const result = await codeExecutor.execute({
          code: `console.log("Sustained test ${executionCounter}");`,
          language: 'javascript',
          sessionId: `sustained-${executionCounter}`,
          options: { timeout: 5000 }
        });

        const execDuration = Date.now() - execStart;
        
        results.push({
          timestamp: Date.now() - startTime,
          success: result.success,
          duration: execDuration
        });

        executionCounter++;

        // Wait for next interval
        const nextExecution = startTime + (executionCounter * executionInterval);
        const waitTime = Math.max(0, nextExecution - Date.now());
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      // Analyze performance over time
      const totalExecutions = results.length;
      const successfulExecutions = results.filter(r => r.success).length;
      const successRate = successfulExecutions / totalExecutions;
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

      // Check for performance degradation over time
      const firstHalf = results.slice(0, Math.floor(results.length / 2));
      const secondHalf = results.slice(Math.floor(results.length / 2));
      
      const firstHalfAvgDuration = firstHalf.reduce((sum, r) => sum + r.duration, 0) / firstHalf.length;
      const secondHalfAvgDuration = secondHalf.reduce((sum, r) => sum + r.duration, 0) / secondHalf.length;

      console.log(`Sustained Load Test Results:
        - Total executions: ${totalExecutions}
        - Success rate: ${(successRate * 100).toFixed(2)}%
        - Average duration: ${avgDuration.toFixed(2)}ms
        - First half avg: ${firstHalfAvgDuration.toFixed(2)}ms
        - Second half avg: ${secondHalfAvgDuration.toFixed(2)}ms
        - Performance degradation: ${((secondHalfAvgDuration / firstHalfAvgDuration - 1) * 100).toFixed(2)}%`);

      expect(successRate).toBeGreaterThan(0.9); // High success rate
      expect(totalExecutions).toBeGreaterThan(30); // Should have executed many times
      expect(secondHalfAvgDuration).toBeLessThan(firstHalfAvgDuration * 1.5); // No more than 50% degradation
    });

    it('should handle burst patterns effectively', async () => {
      const burstCount = 5;
      const executionsPerBurst = 20;
      const burstInterval = 2000; // 2 seconds between bursts
      const allResults: boolean[] = [];

      for (let burst = 0; burst < burstCount; burst++) {
        console.log(`Executing burst ${burst + 1}/${burstCount}...`);
        
        const burstStart = Date.now();
        
        // Execute burst of concurrent requests
        const burstPromises = Array.from({ length: executionsPerBurst }, (_, i) =>
          codeExecutor.execute({
            code: `console.log("Burst ${burst}-${i}");`,
            language: 'javascript',
            sessionId: `burst-${burst}-${i}`,
            options: { timeout: 8000 }
          })
        );

        const burstResults = await Promise.allSettled(burstPromises);
        const burstDuration = Date.now() - burstStart;
        
        const burstSuccessful = burstResults.filter(r => 
          r.status === 'fulfilled' && (r.value as any).success
        ).length;
        const burstSuccessRate = burstSuccessful / executionsPerBurst;

        console.log(`  Burst ${burst + 1}: ${burstSuccessful}/${executionsPerBurst} successful (${(burstSuccessRate * 100).toFixed(2)}%) in ${burstDuration}ms`);

        burstResults.forEach(result => {
          if (result.status === 'fulfilled') {
            allResults.push((result.value as any).success);
          } else {
            allResults.push(false);
          }
        });

        // Wait between bursts (except for the last one)
        if (burst < burstCount - 1) {
          await new Promise(resolve => setTimeout(resolve, burstInterval));
        }
      }

      const overallSuccessRate = allResults.filter(Boolean).length / allResults.length;
      
      console.log(`Overall Burst Test Results:
        - Total executions: ${allResults.length}
        - Overall success rate: ${(overallSuccessRate * 100).toFixed(2)}%`);

      expect(overallSuccessRate).toBeGreaterThan(0.8); // Should handle bursts well
    });
  });

  describe('Error Recovery Under Load', () => {
    it('should recover from errors during high load', async () => {
      const totalExecutions = 50;
      const errorRate = 0.3; // 30% of executions will have errors
      const results: Array<{ success: boolean; hasError: boolean }> = [];

      const promises = Array.from({ length: totalExecutions }, (_, i) => {
        // Introduce errors in some executions
        const shouldError = Math.random() < errorRate;
        const code = shouldError ? 
          'throw new Error("Intentional error");' : 
          'console.log("Success");';

        return codeExecutor.execute({
          code,
          language: 'javascript',
          sessionId: `error-recovery-${i}`,
          options: { timeout: 5000 }
        }).then(result => ({
          success: result.success,
          hasError: !result.success
        }));
      });

      const executionResults = await Promise.all(promises);
      
      const successful = executionResults.filter(r => r.success).length;
      const withErrors = executionResults.filter(r => r.hasError).length;
      const actualSuccessRate = successful / totalExecutions;
      const expectedSuccessRate = 1 - errorRate;

      console.log(`Error Recovery Test:
        - Total executions: ${totalExecutions}
        - Successful: ${successful}
        - With errors: ${withErrors}
        - Actual success rate: ${(actualSuccessRate * 100).toFixed(2)}%
        - Expected success rate: ${(expectedSuccessRate * 100).toFixed(2)}%`);

      // Success rate should be close to expected (allowing for randomness)
      expect(actualSuccessRate).toBeGreaterThan(expectedSuccessRate - 0.1);
      expect(actualSuccessRate).toBeLessThan(expectedSuccessRate + 0.1);
    });

    it('should maintain stability after resource exhaustion', async () => {
      // First, exhaust resources
      const exhaustionPromises = Array.from({ length: 30 }, (_, i) =>
        codeExecutor.execute({
          code: `
            const bigArray = new Array(1000000).fill('exhaust');
            console.log('Resource exhaustion test');
          `,
          language: 'javascript',
          sessionId: `exhaust-${i}`,
          options: { 
            timeout: 3000,
            memoryLimit: 20 * 1024 * 1024 // 20MB limit
          }
        })
      );

      await Promise.allSettled(exhaustionPromises);

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Now test normal operations
      const recoveryPromises = Array.from({ length: 20 }, (_, i) =>
        codeExecutor.execute({
          code: 'console.log("Recovery test");',
          language: 'javascript',
          sessionId: `recovery-${i}`,
          options: { timeout: 5000 }
        })
      );

      const recoveryResults = await Promise.allSettled(recoveryPromises);
      const recoverySuccessful = recoveryResults.filter(r => 
        r.status === 'fulfilled' && (r.value as any).success
      ).length;
      const recoverySuccessRate = recoverySuccessful / recoveryPromises.length;

      console.log(`Recovery After Exhaustion:
        - Recovery executions: ${recoveryPromises.length}
        - Successful: ${recoverySuccessful}
        - Recovery success rate: ${(recoverySuccessRate * 100).toFixed(2)}%`);

      expect(recoverySuccessRate).toBeGreaterThan(0.8); // Should recover well
    });
  });

  describe('Resource Monitoring Under Load', () => {
    it('should track resource usage during load tests', async () => {
      const concurrentCount = 25;
      const code = `
        const data = new Array(10000).fill('test');
        console.log('Resource monitoring test');
      `;

      // Start monitoring
      const initialMemory = process.memoryUsage().heapUsed;
      
      const promises = Array.from({ length: concurrentCount }, (_, i) =>
        codeExecutor.execute({
          code,
          language: 'javascript',
          sessionId: `resource-monitor-${i}`,
          options: { timeout: 10000 }
        })
      );

      const results = await Promise.allSettled(promises);
      
      // Check final memory usage
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      const successful = results.filter(r => 
        r.status === 'fulfilled' && (r.value as any).success
      ).length;

      console.log(`Resource Monitoring Results:
        - Successful executions: ${successful}/${concurrentCount}
        - Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB
        - Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)} MB
        - Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

      expect(successful).toBeGreaterThan(concurrentCount * 0.8);
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    });
  });

  describe('Performance Degradation Tests', () => {
    it('should detect performance degradation under increasing load', async () => {
      const loadLevels = [5, 10, 20, 30];
      const performanceResults: Array<{
        load: number;
        avgTime: number;
        successRate: number;
        throughput: number;
      }> = [];

      for (const load of loadLevels) {
        console.log(`Testing load level: ${load} concurrent executions`);
        
        const startTime = Date.now();
        
        const promises = Array.from({ length: load }, (_, i) =>
          codeExecutor.execute({
            code: 'console.log("Load level test");',
            language: 'javascript',
            sessionId: `load-level-${load}-${i}`,
            options: { timeout: 10000 }
          })
        );

        const results = await Promise.allSettled(promises);
        const totalTime = Date.now() - startTime;
        
        const successful = results.filter(r => 
          r.status === 'fulfilled' && (r.value as any).success
        ).length;
        
        const avgTime = totalTime / load;
        const successRate = successful / load;
        const throughput = successful / (totalTime / 1000); // executions per second

        performanceResults.push({
          load,
          avgTime,
          successRate,
          throughput
        });

        console.log(`  Load ${load}: ${successful}/${load} successful, avg time: ${avgTime.toFixed(2)}ms, throughput: ${throughput.toFixed(2)} exec/s`);

        // Brief pause between load levels
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Analyze performance degradation
      const baselinePerf = performanceResults[0];
      const highestLoadPerf = performanceResults[performanceResults.length - 1];

      const timeIncrease = highestLoadPerf.avgTime / baselinePerf.avgTime;
      const throughputDecrease = baselinePerf.throughput / highestLoadPerf.throughput;

      console.log(`Performance Degradation Analysis:
        - Time increase factor: ${timeIncrease.toFixed(2)}x
        - Throughput decrease factor: ${throughputDecrease.toFixed(2)}x`);

      // Performance shouldn't degrade too dramatically
      expect(timeIncrease).toBeLessThan(5); // No more than 5x slower
      expect(throughputDecrease).toBeLessThan(3); // No more than 3x throughput decrease
      
      // Success rates should remain reasonable
      performanceResults.forEach(result => {
        expect(result.successRate).toBeGreaterThan(0.7);
      });
    });
  });
});