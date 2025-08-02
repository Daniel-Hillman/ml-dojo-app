/**
 * Universal Code Executor - Central orchestrator for code execution
 */

import { 
  CodeExecutionRequest, 
  CodeExecutionResult, 
  ExecutionEngine, 
  SupportedLanguage,
  DEFAULT_LIMITS 
} from './types';
import { getLanguageConfig } from './config';
import { 
  WebExecutionEngine, 
  PythonExecutionEngine, 
  SqlExecutionEngine,
  JsonExecutionEngine,
  YamlExecutionEngine,
  MarkdownExecutionEngine,
  RegexExecutionEngine
} from './engines';
import { securityManager } from './security';
import { getResourceMonitor } from './resource-monitor';
import { maliciousCodeDetector } from './malicious-code-detector';
import { executionManager } from './execution-controller';
import { performanceMetrics } from './performance-metrics';

export class UniversalCodeExecutor {
  private engines: Map<string, ExecutionEngine> = new Map();
  private activeExecutions: Map<string, AbortController> = new Map();
  private executionCount: Map<string, number> = new Map(); // Track per-user executions

  constructor() {
    // Register default engines
    this.registerEngine(new WebExecutionEngine());
    this.registerEngine(new PythonExecutionEngine());
    this.registerEngine(new SqlExecutionEngine());
    
    // Register configuration language engines
    this.registerEngine(new JsonExecutionEngine());
    this.registerEngine(new YamlExecutionEngine());
    this.registerEngine(new MarkdownExecutionEngine());
    this.registerEngine(new RegexExecutionEngine());
  }

  /**
   * Register an execution engine
   */
  registerEngine(engine: ExecutionEngine): void {
    this.engines.set(engine.name, engine);
  }

  /**
   * Execute code with the appropriate engine
   */
  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    const executionId = this.generateExecutionId();
    
    try {
      // Validate request
      await this.validateRequest(request);
      
      // Security validation - malicious code detection
      const maliciousAnalysis = maliciousCodeDetector.analyzeCode(request.code, request.language);
      if (maliciousAnalysis.isMalicious) {
        return {
          success: false,
          error: `Security violation: ${maliciousAnalysis.violations[0]?.message || 'Malicious code detected'}`,
          executionTime: Date.now() - startTime,
          sessionId: request.sessionId,
          metadata: {
            securityAnalysis: maliciousAnalysis
          }
        };
      }
      
      // Security policy validation
      const securityViolations = securityManager.validateCode(request.code, request.language);
      const criticalViolations = securityViolations.filter(v => v.severity === 'critical');
      if (criticalViolations.length > 0) {
        return {
          success: false,
          error: `Security policy violation: ${criticalViolations[0].message}`,
          executionTime: Date.now() - startTime,
          sessionId: request.sessionId,
          metadata: {
            securityViolations
          }
        };
      }
      
      // Check concurrent execution limits
      if (!getResourceMonitor().canStartExecution(request.language)) {
        return {
          success: false,
          error: 'Concurrent execution limit exceeded. Please wait for current executions to complete.',
          executionTime: Date.now() - startTime,
          sessionId: request.sessionId
        };
      }
      
      // Start resource monitoring
      getResourceMonitor().startExecution(executionId, request.language);
      
      // Start performance metrics collection
      performanceMetrics.startExecution(executionId, request.language, request.code.length);
      
      // Get appropriate engine
      const engine = this.getEngineForLanguage(request.language);
      
      // Apply default options
      const requestWithDefaults = this.applyDefaultOptions(request);
      
      // Execute with advanced monitoring and control
      const result = await executionManager.startExecution(
        executionId,
        request.language,
        () => engine.execute(requestWithDefaults),
        {
          timeout: requestWithDefaults.options?.timeout,
          onCancel: () => {
            console.log(`Execution ${executionId} was cancelled`);
          },
          onTimeout: () => {
            console.log(`Execution ${executionId} timed out`);
          }
        }
      );
      
      // End resource monitoring
      const resourceMetrics = getResourceMonitor().endExecution(executionId, result.success);
      
      // End performance metrics collection
      const performanceData = performanceMetrics.endExecution(
        executionId,
        result.success,
        result.output?.length || 0,
        result.success ? undefined : 'execution_error',
        securityViolations.map(v => v.message)
      );
      
      // Add comprehensive metadata
      result.executionTime = Date.now() - startTime;
      result.sessionId = request.sessionId;
      result.metadata = {
        ...result.metadata,
        securityAnalysis: maliciousAnalysis,
        securityViolations: securityViolations.filter(v => v.severity !== 'critical'),
        resourceMetrics,
        performanceData,
        systemMetrics: performanceMetrics.getRealTimeMetrics()
      };
      
      return result;
      
    } catch (error) {
      // End monitoring on error
      getResourceMonitor().endExecution(executionId, false);
      performanceMetrics.endExecution(
        executionId,
        false,
        0,
        error instanceof Error ? error.name : 'unknown_error'
      );
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        executionTime: Date.now() - startTime,
        sessionId: request.sessionId,
        metadata: {
          systemMetrics: performanceMetrics.getRealTimeMetrics()
        }
      };
    } finally {
      // Cleanup
      this.activeExecutions.delete(executionId);
      this.decrementExecutionCount(request.sessionId);
    }
  }

  /**
   * Validate code before execution
   */
  async validateCode(code: string, language: SupportedLanguage): Promise<boolean> {
    try {
      const engine = this.getEngineForLanguage(language);
      
      if (engine.validateCode) {
        return await engine.validateCode(code);
      }
      
      // Basic validation - check for empty code
      return code.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Terminate a running execution
   */
  async terminateExecution(executionId: string): Promise<boolean> {
    // Try to cancel through execution manager first
    const cancelled = executionManager.cancelExecution(executionId);
    
    // Also try legacy abort controller method
    const abortController = this.activeExecutions.get(executionId);
    if (abortController) {
      abortController.abort();
      this.activeExecutions.delete(executionId);
      return true;
    }
    
    return cancelled;
  }

  /**
   * Terminate all executions for a language
   */
  async terminateExecutionsByLanguage(language: SupportedLanguage): Promise<number> {
    return executionManager.cancelExecutionsByLanguage(language);
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): {
    active: number;
    queued: number;
    performance: any;
    resources: any;
  } {
    return {
      active: executionManager.getActiveExecutionCount(),
      queued: executionManager.getQueueStatus().queueLength,
      performance: performanceMetrics.getPerformanceStats(),
      resources: performanceMetrics.getRealTimeMetrics()
    };
  }

  /**
   * Get available engines
   */
  getAvailableEngines(): string[] {
    return Array.from(this.engines.keys());
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: SupportedLanguage): boolean {
    try {
      this.getEngineForLanguage(language);
      return true;
    } catch {
      return false;
    }
  }

  // Private methods

  private validateRequest(request: CodeExecutionRequest): void {
    if (!request.code || request.code.trim().length === 0) {
      throw new Error('Code cannot be empty');
    }

    if (!request.language) {
      throw new Error('Language must be specified');
    }

    if (request.code.length > DEFAULT_LIMITS.maxOutputSize * 10) {
      throw new Error('Code is too long');
    }
  }

  private checkConcurrentExecutions(sessionId?: string): void {
    if (!sessionId) return;
    
    const currentCount = this.executionCount.get(sessionId) || 0;
    if (currentCount >= DEFAULT_LIMITS.maxConcurrentExecutions) {
      throw new Error('Too many concurrent executions. Please wait for current executions to complete.');
    }
    
    this.executionCount.set(sessionId, currentCount + 1);
  }

  private decrementExecutionCount(sessionId?: string): void {
    if (!sessionId) return;
    
    const currentCount = this.executionCount.get(sessionId) || 0;
    if (currentCount > 0) {
      this.executionCount.set(sessionId, currentCount - 1);
    }
  }

  private getEngineForLanguage(language: SupportedLanguage): ExecutionEngine {
    const config = getLanguageConfig(language);
    const engine = this.engines.get(config.engine);
    
    if (!engine) {
      throw new Error(`No engine available for language: ${language}`);
    }
    
    if (!engine.supportedLanguages.includes(language)) {
      throw new Error(`Engine ${config.engine} does not support language: ${language}`);
    }
    
    return engine;
  }

  private applyDefaultOptions(request: CodeExecutionRequest): CodeExecutionRequest {
    const config = getLanguageConfig(request.language);
    
    return {
      ...request,
      options: {
        timeout: config.executionTimeout,
        memoryLimit: config.memoryLimit,
        packages: config.requiredPackages,
        ...request.options
      }
    };
  }

  private async executeWithTimeout(
    engine: ExecutionEngine,
    request: CodeExecutionRequest,
    abortController: AbortController
  ): Promise<CodeExecutionResult> {
    const timeout = request.options?.timeout || DEFAULT_LIMITS.maxExecutionTime;
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        abortController.abort();
        reject(new Error(`Execution timed out after ${timeout}ms`));
      }, timeout);

      engine.execute(request)
        .then(result => {
          clearTimeout(timeoutId);
          
          // Validate output size
          if (result.output && result.output.length > DEFAULT_LIMITS.maxOutputSize) {
            result.output = result.output.substring(0, DEFAULT_LIMITS.maxOutputSize) + '\n... (output truncated)';
          }
          
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });

      // Handle abort signal
      abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new Error('Execution was cancelled'));
      });
    });
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global executor instance
export const codeExecutor = new UniversalCodeExecutor();