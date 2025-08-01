/**
 * Safe Test Runner for Live Code Execution System
 * Executes tests with proper safeguards against infinite loops and resource exhaustion
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

interface SafeTestConfig {
  testFile: string;
  timeout: number; // milliseconds
  maxMemory: number; // bytes
  description: string;
  category: 'unit' | 'integration' | 'security' | 'performance' | 'load';
}

interface TestResult {
  testFile: string;
  success: boolean;
  duration: number;
  output: string;
  error?: string;
  memoryUsage?: number;
  timedOut: boolean;
}

class SafeTestRunner {
  private readonly testConfigs: SafeTestConfig[] = [
    // Unit Tests - Short timeouts
    {
      testFile: 'comprehensive-test-suite.test.ts',
      timeout: 30000, // 30 seconds
      maxMemory: 100 * 1024 * 1024, // 100MB
      description: 'Comprehensive test suite validation',
      category: 'unit'
    },
    {
      testFile: 'executor.test.ts',
      timeout: 30000,
      maxMemory: 100 * 1024 * 1024,
      description: 'Universal code executor tests',
      category: 'unit'
    },
    {
      testFile: 'web-engine.test.ts',
      timeout: 30000,
      maxMemory: 100 * 1024 * 1024,
      description: 'Web execution engine tests',
      category: 'unit'
    },
    {
      testFile: 'python-engine.test.ts',
      timeout: 60000, // 1 minute for Python tests
      maxMemory: 200 * 1024 * 1024, // 200MB for Python
      description: 'Python execution engine tests',
      category: 'unit'
    },
    {
      testFile: 'sql-engine.test.ts',
      timeout: 30000,
      maxMemory: 100 * 1024 * 1024,
      description: 'SQL execution engine tests',
      category: 'unit'
    },
    {
      testFile: 'config-engines.test.ts',
      timeout: 30000,
      maxMemory: 100 * 1024 * 1024,
      description: 'Configuration language engines tests',
      category: 'unit'
    },
    {
      testFile: 'templates.test.ts',
      timeout: 30000,
      maxMemory: 100 * 1024 * 1024,
      description: 'Templates system tests',
      category: 'unit'
    },
    {
      testFile: 'session-manager.test.ts',
      timeout: 30000,
      maxMemory: 100 * 1024 * 1024,
      description: 'Session manager tests',
      category: 'unit'
    },
    {
      testFile: 'error-handler.test.ts',
      timeout: 30000,
      maxMemory: 100 * 1024 * 1024,
      description: 'Error handler tests',
      category: 'unit'
    },
    {
      testFile: 'resource-monitor.test.ts',
      timeout: 30000,
      maxMemory: 100 * 1024 * 1024,
      description: 'Resource monitor tests',
      category: 'unit'
    },

    // Integration Tests - Longer timeouts
    {
      testFile: 'comprehensive-integration.test.ts',
      timeout: 120000, // 2 minutes
      maxMemory: 300 * 1024 * 1024, // 300MB
      description: 'Comprehensive integration tests',
      category: 'integration'
    },

    // Security Tests - Medium timeouts
    {
      testFile: 'security-penetration.test.ts',
      timeout: 180000, // 3 minutes
      maxMemory: 200 * 1024 * 1024, // 200MB
      description: 'Security and penetration tests',
      category: 'security'
    },

    // Performance Tests - Longer timeouts
    {
      testFile: 'performance-benchmarks.test.ts',
      timeout: 300000, // 5 minutes
      maxMemory: 500 * 1024 * 1024, // 500MB
      description: 'Performance benchmark tests',
      category: 'performance'
    },

    // Load Tests - Longest timeouts
    {
      testFile: 'load-testing.test.ts',
      timeout: 600000, // 10 minutes
      maxMemory: 1024 * 1024 * 1024, // 1GB
      description: 'Load testing suite',
      category: 'load'
    }
  ];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🛡️  Starting Safe Test Runner for Live Code Execution System');
    console.log('=' .repeat(80));
    console.log('⚠️  All tests run with strict timeouts and resource limits to prevent infinite loops');
    console.log('');

    const results: TestResult[] = [];

    for (const config of this.testConfigs) {
      console.log(`\n🧪 Running: ${config.description}`);
      console.log(`   File: ${config.testFile}`);
      console.log(`   Category: ${config.category}`);
      console.log(`   Timeout: ${config.timeout / 1000}s`);
      console.log(`   Memory limit: ${(config.maxMemory / 1024 / 1024).toFixed(0)}MB`);

      const result = await this.runSingleTest(config);
      results.push(result);

      this.printTestResult(result);

      // Brief pause between tests to allow cleanup
      await this.sleep(1000);
    }

    this.printSummary(results);
    return results;
  }

  private async runSingleTest(config: SafeTestConfig): Promise<TestResult> {
    const startTime = Date.now();
    const testFilePath = path.join(__dirname, config.testFile);

    // Check if test file exists
    if (!fs.existsSync(testFilePath)) {
      return {
        testFile: config.testFile,
        success: false,
        duration: 0,
        output: '',
        error: `Test file not found: ${testFilePath}`,
        timedOut: false
      };
    }

    return new Promise((resolve) => {
      let timedOut = false;
      let output = '';
      let error = '';

      // Create Jest command with strict limits
      const jestArgs = [
        'jest',
        `"${testFilePath}"`,
        '--verbose',
        '--no-cache',
        '--maxWorkers=1',
        '--forceExit',
        `--testTimeout=${config.timeout - 5000}`, // Leave 5s buffer for cleanup
        '--detectOpenHandles',
        '--logHeapUsage'
      ];

      // Spawn Jest process with resource limits
      const jestProcess = spawn('npx', jestArgs, {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_OPTIONS: `--max-old-space-size=${Math.floor(config.maxMemory / 1024 / 1024)}`
        }
      });

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        console.log(`   ⏰ Test timed out after ${config.timeout / 1000}s - terminating process`);
        
        // Force kill the process
        jestProcess.kill('SIGKILL');
        
        resolve({
          testFile: config.testFile,
          success: false,
          duration: Date.now() - startTime,
          output: output,
          error: `Test timed out after ${config.timeout / 1000} seconds`,
          timedOut: true
        });
      }, config.timeout);

      // Collect stdout
      jestProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });

      // Collect stderr
      jestProcess.stderr?.on('data', (data) => {
        error += data.toString();
      });

      // Handle process completion
      jestProcess.on('close', (code) => {
        if (!timedOut) {
          clearTimeout(timeoutHandle);
          
          const duration = Date.now() - startTime;
          const success = code === 0;

          resolve({
            testFile: config.testFile,
            success,
            duration,
            output,
            error: success ? undefined : error,
            timedOut: false
          });
        }
      });

      // Handle process errors
      jestProcess.on('error', (err) => {
        if (!timedOut) {
          clearTimeout(timeoutHandle);
          
          resolve({
            testFile: config.testFile,
            success: false,
            duration: Date.now() - startTime,
            output: output,
            error: `Process error: ${err.message}`,
            timedOut: false
          });
        }
      });
    });
  }

  private printTestResult(result: TestResult): void {
    const status = result.success ? '✅' : '❌';
    const timeoutIndicator = result.timedOut ? ' ⏰ TIMED OUT' : '';
    
    console.log(`   ${status} ${result.testFile}: ${result.success ? 'PASSED' : 'FAILED'}${timeoutIndicator}`);
    console.log(`   ⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
    
    if (result.error) {
      console.log(`   🔍 Error: ${result.error.split('\n')[0]}`); // Show first line of error
    }
  }

  private printSummary(results: TestResult[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 SAFE TEST RUNNER SUMMARY');
    console.log('='.repeat(80));

    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;
    const timedOutTests = results.filter(r => r.timedOut).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n📈 Overall Results:`);
    console.log(`   Total Test Files: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Timed Out: ${timedOutTests}`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`   Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    // Category breakdown
    const categories = ['unit', 'integration', 'security', 'performance', 'load'];
    console.log(`\n📂 By Category:`);
    
    categories.forEach(category => {
      const categoryConfigs = this.testConfigs.filter(c => c.category === category);
      const categoryResults = results.filter(r => 
        categoryConfigs.some(c => c.testFile === r.testFile)
      );
      
      if (categoryResults.length > 0) {
        const categoryPassed = categoryResults.filter(r => r.success).length;
        const categoryTotal = categoryResults.length;
        const categoryRate = ((categoryPassed / categoryTotal) * 100).toFixed(1);
        
        console.log(`   ${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
      }
    });

    if (failedTests > 0) {
      console.log(`\n❌ Failed Tests:`);
      results.filter(r => !r.success).forEach(result => {
        const reason = result.timedOut ? 'TIMEOUT' : 'FAILED';
        console.log(`   - ${result.testFile}: ${reason}`);
      });
    }

    if (timedOutTests > 0) {
      console.log(`\n⚠️  Timeout Protection:`);
      console.log(`   ${timedOutTests} test(s) were terminated due to timeout limits`);
      console.log(`   This prevented potential infinite loops or resource exhaustion`);
    }

    console.log('\n' + '='.repeat(80));
    
    const overallSuccess = failedTests === 0;
    console.log(overallSuccess ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
    console.log('🛡️  Safe test execution completed - no infinite loops detected');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to run specific test categories
  async runTestCategory(category: SafeTestConfig['category']): Promise<TestResult[]> {
    const categoryConfigs = this.testConfigs.filter(c => c.category === category);
    
    console.log(`🧪 Running ${category} tests only (${categoryConfigs.length} files)`);
    
    const results: TestResult[] = [];
    
    for (const config of categoryConfigs) {
      const result = await this.runSingleTest(config);
      results.push(result);
      this.printTestResult(result);
      await this.sleep(1000);
    }
    
    return results;
  }

  // Method to run a single test file safely
  async runSingleTestFile(testFile: string): Promise<TestResult> {
    const config = this.testConfigs.find(c => c.testFile === testFile);
    
    if (!config) {
      return {
        testFile,
        success: false,
        duration: 0,
        output: '',
        error: `Test configuration not found for: ${testFile}`,
        timedOut: false
      };
    }
    
    console.log(`🧪 Running single test: ${config.description}`);
    const result = await this.runSingleTest(config);
    this.printTestResult(result);
    
    return result;
  }
}

// Export for use in other scripts
export { SafeTestRunner };

// CLI interface
if (require.main === module) {
  const runner = new SafeTestRunner();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Run all tests
    runner.runAllTests()
      .then(results => {
        const failedCount = results.filter(r => !r.success).length;
        process.exit(failedCount > 0 ? 1 : 0);
      })
      .catch(error => {
        console.error('Safe test runner failed:', error);
        process.exit(1);
      });
  } else if (args[0] === '--category' && args[1]) {
    // Run specific category
    const category = args[1] as SafeTestConfig['category'];
    runner.runTestCategory(category)
      .then(results => {
        const failedCount = results.filter(r => !r.success).length;
        process.exit(failedCount > 0 ? 1 : 0);
      })
      .catch(error => {
        console.error('Category test run failed:', error);
        process.exit(1);
      });
  } else if (args[0] === '--file' && args[1]) {
    // Run specific file
    runner.runSingleTestFile(args[1])
      .then(result => {
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error('Single test run failed:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  npm run test:safe                    # Run all tests');
    console.log('  npm run test:safe -- --category unit # Run unit tests only');
    console.log('  npm run test:safe -- --file test.ts  # Run specific test file');
    process.exit(1);
  }
}