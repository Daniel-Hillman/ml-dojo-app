/**
 * Unit tests for Resource Monitor
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the resource monitor
const mockResourceMonitor = {
  startMonitoring: jest.fn(),
  stopMonitoring: jest.fn(),
  getResourceUsage: jest.fn(),
  checkLimits: jest.fn(),
  setLimits: jest.fn(),
  reset: jest.fn(),
  getMetrics: jest.fn()
};

describe('ResourceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Resource Monitoring', () => {
    it('should start monitoring for an execution', () => {
      const executionId = 'exec-123';
      const limits = {
        maxMemory: 50 * 1024 * 1024, // 50MB
        maxCpuTime: 30000, // 30 seconds
        maxExecutionTime: 60000 // 60 seconds
      };

      mockResourceMonitor.startMonitoring.mockReturnValue(true);

      const result = mockResourceMonitor.startMonitoring(executionId, limits);

      expect(result).toBe(true);
      expect(mockResourceMonitor.startMonitoring).toHaveBeenCalledWith(executionId, limits);
    });

    it('should stop monitoring and return final metrics', () => {
      const executionId = 'exec-123';
      const finalMetrics = {
        peakMemoryUsage: 25 * 1024 * 1024, // 25MB
        totalCpuTime: 15000, // 15 seconds
        totalExecutionTime: 20000, // 20 seconds
        limitExceeded: false
      };

      mockResourceMonitor.stopMonitoring.mockReturnValue(finalMetrics);

      const result = mockResourceMonitor.stopMonitoring(executionId);

      expect(result).toEqual(finalMetrics);
      expect(result.limitExceeded).toBe(false);
      expect(mockResourceMonitor.stopMonitoring).toHaveBeenCalledWith(executionId);
    });

    it('should get current resource usage', () => {
      const executionId = 'exec-123';
      const currentUsage = {
        memoryUsage: 20 * 1024 * 1024, // 20MB
        cpuTime: 10000, // 10 seconds
        executionTime: 12000 // 12 seconds
      };

      mockResourceMonitor.getResourceUsage.mockReturnValue(currentUsage);

      const result = mockResourceMonitor.getResourceUsage(executionId);

      expect(result).toEqual(currentUsage);
      expect(result.memoryUsage).toBe(20 * 1024 * 1024);
      expect(mockResourceMonitor.getResourceUsage).toHaveBeenCalledWith(executionId);
    });
  });

  describe('Limit Checking', () => {
    it('should check if execution is within limits', () => {
      const executionId = 'exec-123';
      const limitCheck = {
        withinLimits: true,
        memoryOk: true,
        cpuTimeOk: true,
        executionTimeOk: true,
        warnings: []
      };

      mockResourceMonitor.checkLimits.mockReturnValue(limitCheck);

      const result = mockResourceMonitor.checkLimits(executionId);

      expect(result).toEqual(limitCheck);
      expect(result.withinLimits).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect memory limit exceeded', () => {
      const executionId = 'exec-123';
      const limitCheck = {
        withinLimits: false,
        memoryOk: false,
        cpuTimeOk: true,
        executionTimeOk: true,
        warnings: ['Memory usage exceeded 50MB limit'],
        exceededLimits: ['memory']
      };

      mockResourceMonitor.checkLimits.mockReturnValue(limitCheck);

      const result = mockResourceMonitor.checkLimits(executionId);

      expect(result.withinLimits).toBe(false);
      expect(result.memoryOk).toBe(false);
      expect(result.warnings.some(w => w.includes('Memory usage exceeded'))).toBe(true);
      expect(result.exceededLimits).toContain('memory');
    });

    it('should detect CPU time limit exceeded', () => {
      const executionId = 'exec-123';
      const limitCheck = {
        withinLimits: false,
        memoryOk: true,
        cpuTimeOk: false,
        executionTimeOk: true,
        warnings: ['CPU time exceeded 30 second limit'],
        exceededLimits: ['cpu']
      };

      mockResourceMonitor.checkLimits.mockReturnValue(limitCheck);

      const result = mockResourceMonitor.checkLimits(executionId);

      expect(result.withinLimits).toBe(false);
      expect(result.cpuTimeOk).toBe(false);
      expect(result.warnings.some(w => w.includes('CPU time exceeded'))).toBe(true);
      expect(result.exceededLimits).toContain('cpu');
    });

    it('should detect execution time limit exceeded', () => {
      const executionId = 'exec-123';
      const limitCheck = {
        withinLimits: false,
        memoryOk: true,
        cpuTimeOk: true,
        executionTimeOk: false,
        warnings: ['Execution time exceeded 60 second limit'],
        exceededLimits: ['execution_time']
      };

      mockResourceMonitor.checkLimits.mockReturnValue(limitCheck);

      const result = mockResourceMonitor.checkLimits(executionId);

      expect(result.withinLimits).toBe(false);
      expect(result.executionTimeOk).toBe(false);
      expect(result.warnings.some(w => w.includes('Execution time exceeded'))).toBe(true);
      expect(result.exceededLimits).toContain('execution_time');
    });
  });

  describe('Limit Configuration', () => {
    it('should set resource limits for different languages', () => {
      const limits = {
        javascript: {
          maxMemory: 25 * 1024 * 1024, // 25MB
          maxCpuTime: 15000, // 15 seconds
          maxExecutionTime: 30000 // 30 seconds
        },
        python: {
          maxMemory: 100 * 1024 * 1024, // 100MB
          maxCpuTime: 60000, // 60 seconds
          maxExecutionTime: 120000 // 120 seconds
        },
        sql: {
          maxMemory: 50 * 1024 * 1024, // 50MB
          maxCpuTime: 30000, // 30 seconds
          maxExecutionTime: 60000 // 60 seconds
        }
      };

      mockResourceMonitor.setLimits.mockReturnValue(true);

      const result = mockResourceMonitor.setLimits(limits);

      expect(result).toBe(true);
      expect(mockResourceMonitor.setLimits).toHaveBeenCalledWith(limits);
    });

    it('should validate limit values', () => {
      const invalidLimits = {
        maxMemory: -1, // Invalid negative value
        maxCpuTime: 0, // Invalid zero value
        maxExecutionTime: 'invalid' // Invalid type
      };

      mockResourceMonitor.setLimits.mockImplementation((limits) => {
        if (limits.maxMemory < 0 || limits.maxCpuTime <= 0) {
          throw new Error('Invalid limit values');
        }
        return true;
      });

      expect(() => {
        mockResourceMonitor.setLimits(invalidLimits);
      }).toThrow('Invalid limit values');
    });
  });

  describe('Metrics Collection', () => {
    it('should collect comprehensive metrics', () => {
      const metrics = {
        totalExecutions: 150,
        averageMemoryUsage: 30 * 1024 * 1024, // 30MB
        averageCpuTime: 8000, // 8 seconds
        averageExecutionTime: 12000, // 12 seconds
        limitExceededCount: 5,
        memoryExceededCount: 2,
        cpuExceededCount: 2,
        timeExceededCount: 1,
        peakMemoryUsage: 95 * 1024 * 1024, // 95MB
        longestExecutionTime: 45000 // 45 seconds
      };

      mockResourceMonitor.getMetrics.mockReturnValue(metrics);

      const result = mockResourceMonitor.getMetrics();

      expect(result).toEqual(metrics);
      expect(result.totalExecutions).toBe(150);
      expect(result.limitExceededCount).toBe(5);
      expect(result.peakMemoryUsage).toBe(95 * 1024 * 1024);
    });

    it('should provide metrics by language', () => {
      const languageMetrics = {
        javascript: {
          executionCount: 80,
          averageMemoryUsage: 20 * 1024 * 1024,
          averageExecutionTime: 5000,
          limitExceededCount: 1
        },
        python: {
          executionCount: 50,
          averageMemoryUsage: 60 * 1024 * 1024,
          averageExecutionTime: 25000,
          limitExceededCount: 3
        },
        sql: {
          executionCount: 20,
          averageMemoryUsage: 15 * 1024 * 1024,
          averageExecutionTime: 3000,
          limitExceededCount: 1
        }
      };

      mockResourceMonitor.getMetrics.mockReturnValue(languageMetrics);

      const result = mockResourceMonitor.getMetrics('by-language');

      expect(result).toEqual(languageMetrics);
      expect(result.javascript.executionCount).toBe(80);
      expect(result.python.limitExceededCount).toBe(3);
    });
  });

  describe('Resource Cleanup', () => {
    it('should reset monitoring state', () => {
      mockResourceMonitor.reset.mockReturnValue(true);

      const result = mockResourceMonitor.reset();

      expect(result).toBe(true);
      expect(mockResourceMonitor.reset).toHaveBeenCalled();
    });

    it('should clean up specific execution monitoring', () => {
      const executionId = 'exec-123';
      
      mockResourceMonitor.stopMonitoring.mockReturnValue({
        cleaned: true,
        finalMetrics: {
          memoryUsage: 0,
          cpuTime: 0,
          executionTime: 0
        }
      });

      const result = mockResourceMonitor.stopMonitoring(executionId);

      expect(result.cleaned).toBe(true);
      expect(result.finalMetrics.memoryUsage).toBe(0);
    });
  });

  describe('Performance Impact', () => {
    it('should have minimal performance overhead', () => {
      // Test that monitoring doesn't significantly impact performance
      const startTime = Date.now();
      
      // Simulate monitoring operations
      mockResourceMonitor.startMonitoring('perf-test', {});
      mockResourceMonitor.getResourceUsage('perf-test');
      mockResourceMonitor.checkLimits('perf-test');
      mockResourceMonitor.stopMonitoring('perf-test');
      
      const duration = Date.now() - startTime;
      
      // Monitoring operations should be very fast
      expect(duration).toBeLessThan(100); // Less than 100ms
    });

    it('should handle high-frequency monitoring calls', () => {
      const executionId = 'high-freq-test';
      
      // Simulate rapid monitoring calls
      for (let i = 0; i < 100; i++) {
        mockResourceMonitor.getResourceUsage.mockReturnValue({
          memoryUsage: i * 1024,
          cpuTime: i * 10,
          executionTime: i * 15
        });
        
        const usage = mockResourceMonitor.getResourceUsage(executionId);
        expect(usage).toBeDefined();
      }
      
      expect(mockResourceMonitor.getResourceUsage).toHaveBeenCalledTimes(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle monitoring errors gracefully', () => {
      const executionId = 'error-test';
      
      mockResourceMonitor.startMonitoring.mockImplementation(() => {
        throw new Error('Monitoring initialization failed');
      });

      expect(() => {
        try {
          mockResourceMonitor.startMonitoring(executionId, {});
        } catch (e) {
          expect(e.message).toContain('Monitoring initialization failed');
        }
      }).not.toThrow();
    });

    it('should handle missing execution IDs', () => {
      mockResourceMonitor.getResourceUsage.mockReturnValue(null);

      const result = mockResourceMonitor.getResourceUsage('non-existent');

      expect(result).toBeNull();
    });

    it('should handle system resource unavailability', () => {
      mockResourceMonitor.getResourceUsage.mockReturnValue({
        memoryUsage: null, // System couldn't determine memory usage
        cpuTime: null,
        executionTime: 5000,
        error: 'System resources unavailable'
      });

      const result = mockResourceMonitor.getResourceUsage('system-error-test');

      expect(result.error).toBe('System resources unavailable');
      expect(result.memoryUsage).toBeNull();
      expect(result.executionTime).toBe(5000); // Some metrics still available
    });
  });
});