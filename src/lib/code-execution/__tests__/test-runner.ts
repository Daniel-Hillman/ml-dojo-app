/**
 * Comprehensive Test Runner for Live Code Execution System
 * Orchestrates all test suites and generates detailed reports
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestSuite {
  name: string;
  file: string;
  category: 'unit' | 'integration' | 'security' | 'performance' | 'load';
  description: string;
  timeout?: number;
}

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: number;
  errors: string[];
}

interface TestReport {
  timestamp: string;
  totalSuites: number;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  totalDuration: number;
  overallCoverage: number;
  results: TestResult[];
  summary: {
    unitTests: TestResult[];
    integrationTests: TestResult[];
    securityTests: TestResult[];
    performanceTests: TestResult[];
    loadTests: TestResult[];
  };
}

class ComprehensiveTestRunner {
  private testSuites: TestSuite[] = [
    // Unit Tests
    {
      name: 'Universal Code Executor',
      file: 'executor.test.ts',
      category: 'unit',
      description: 'Tests core execution orchestration and routing'
    },
    {
      name: 'Web Execution Engine',
      file: 'web-engine.test.ts',
      category: 'unit',
      description: 'Tests HTML/CSS/JavaScript execution in sandboxed environment'
    },
    {
      name: 'Python Execution Engine',
      file: 'python-engine.test.ts',
      category: 'unit',
      description: 'Tests Python code execution with Pyodide and ML libraries'
    },
    {
      name: 'SQL Execution Engine',
      file: 'sql-engine.test.ts',
      category: 'unit',
      description: 'Tests SQL query execution with SQLite'
    },
    {
      name: 'Configuration Engines',
      file: 'config-engines.test.ts',
      category: 'unit',
      description: 'Tests JSON, YAML, Markdown, and Regex engines'
    },
    {
      name: 'Templates System',
      file: 'templates.test.ts',
      category: 'unit',
      description: 'Tests code templates and examples system'
    },

    // Integration Tests
    {
      name: 'Comprehensive Integration',
      file: 'comprehensive-integration.test.ts',
      category: 'integration',
      description: 'Tests complete workflows and system integration',
      timeout: 120000 // 2 minutes
    },

    // Security Tests
    {
      name: 'Security & Penetration',
      file: 'security-penetration.test.ts',
      category: 'security',
      description: 'Tests security boundaries and protection against attacks',
      timeout: 180000 // 3 minutes
    },

    // Performance Tests
    {
      name: 'Performance Benchmarks',
      file: 'performance-benchmarks.test.ts',
      category: 'performance',
      description: 'Tests execution speed, memory usage, and optimization',
      timeout: 300000 // 5 minutes
    },

    // Load Tests
    {
      name: 'Load Testing',
      file: 'load-testing.test.ts',
      category: 'load',
      description: 'Tests system behavior under various load conditions',
      timeout: 600000 // 10 minutes
    }
  ];

  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<TestReport> {
    console.log('🚀 Starting Comprehensive Test Suite for Live Code Execution System');
    console.log('=' .repeat(80));
    
    this.startTime = Date.now();
    this.results = [];

    // Run tests by category
    await this.runTestsByCategory('unit', 'Unit Tests');
    await this.runTestsByCategory('integration', 'Integration Tests');
    await this.runTestsByCategory('security', 'Security Tests');
    await this.runTestsByCategory('performance', 'Performance Tests');
    await this.runTestsByCategory('load', 'Load Tests');

    const report = this.generateReport();
    await this.saveReport(report);
    this.printSummary(report);

    return report;
  }

  private async runTestsByCategory(category: TestSuite['category'], categoryName: string): Promise<void> {
    const categoryTests = this.testSuites.filter(suite => suite.category === category);
    
    if (categoryTests.length === 0) {
      console.log(`\n📂 ${categoryName}: No tests found`);
      return;
    }

    console.log(`\n📂 ${categoryName} (${categoryTests.length} suites)`);
    console.log('-'.repeat(50));

    for (const suite of categoryTests) {
      await this.runTestSuite(suite);
    }
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`\n🧪 Running: ${suite.name}`);
    console.log(`   Description: ${suite.description}`);
    console.log(`   File: ${suite.file}`);

    const startTime = Date.now();
    let result: TestResult;

    try {
      // Construct Jest command
      const testFile = path.join(__dirname, suite.file);
      const jestCommand = [
        'npx jest',
        `"${testFile}"`,
        '--verbose',
        '--coverage',
        '--coverageReporters=json-summary',
        '--testTimeout=' + (suite.timeout || 30000),
        '--maxWorkers=1', // Prevent resource conflicts
        '--forceExit'
      ].join(' ');

      console.log(`   Command: ${jestCommand}`);

      // Execute test
      const output = execSync(jestCommand, {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: (suite.timeout || 30000) + 10000 // Add buffer
      });

      result = this.parseJestOutput(suite.name, output, Date.now() - startTime);
      
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
      
      result = {
        suite: suite.name,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
        errors: [error.message]
      };
    }

    this.results.push(result);
    this.printTestResult(result);
  }

  private parseJestOutput(suiteName: string, output: string, duration: number): TestResult {
    const lines = output.split('\n');
    
    // Parse test results
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Look for Jest summary line
    const summaryLine = lines.find(line => line.includes('Tests:'));
    if (summaryLine) {
      const passedMatch = summaryLine.match(/(\d+) passed/);
      const failedMatch = summaryLine.match(/(\d+) failed/);
      const skippedMatch = summaryLine.match(/(\d+) skipped/);

      if (passedMatch) passed = parseInt(passedMatch[1]);
      if (failedMatch) failed = parseInt(failedMatch[1]);
      if (skippedMatch) skipped = parseInt(skippedMatch[1]);
    }

    // Extract error messages
    let inErrorSection = false;
    for (const line of lines) {
      if (line.includes('FAIL') || line.includes('Error:')) {
        inErrorSection = true;
        errors.push(line.trim());
      } else if (inErrorSection && line.trim() && !line.startsWith(' ')) {
        inErrorSection = false;
      } else if (inErrorSection && line.trim()) {
        errors.push(line.trim());
      }
    }

    // Parse coverage if available
    let coverage: number | undefined;
    const coverageLine = lines.find(line => line.includes('All files'));
    if (coverageLine) {
      const coverageMatch = coverageLine.match(/(\d+\.?\d*)%/);
      if (coverageMatch) {
        coverage = parseFloat(coverageMatch[1]);
      }
    }

    return {
      suite: suiteName,
      passed,
      failed,
      skipped,
      duration,
      coverage,
      errors: errors.slice(0, 5) // Limit error messages
    };
  }

  private printTestResult(result: TestResult): void {
    const status = result.failed > 0 ? '❌' : '✅';
    const coverageStr = result.coverage ? ` (${result.coverage.toFixed(1)}% coverage)` : '';
    
    console.log(`   ${status} ${result.suite}: ${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped`);
    console.log(`   ⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s${coverageStr}`);
    
    if (result.errors.length > 0) {
      console.log(`   🔍 Errors:`);
      result.errors.forEach(error => {
        console.log(`      ${error}`);
      });
    }
  }

  private generateReport(): TestReport {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.results.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalSkipped = this.results.reduce((sum, r) => sum + r.skipped, 0);
    
    const coverageResults = this.results.filter(r => r.coverage !== undefined);
    const overallCoverage = coverageResults.length > 0 
      ? coverageResults.reduce((sum, r) => sum + r.coverage!, 0) / coverageResults.length
      : 0;

    return {
      timestamp: new Date().toISOString(),
      totalSuites: this.results.length,
      totalTests,
      totalPassed,
      totalFailed,
      totalSkipped,
      totalDuration,
      overallCoverage,
      results: this.results,
      summary: {
        unitTests: this.results.filter((_, i) => this.testSuites[i]?.category === 'unit'),
        integrationTests: this.results.filter((_, i) => this.testSuites[i]?.category === 'integration'),
        securityTests: this.results.filter((_, i) => this.testSuites[i]?.category === 'security'),
        performanceTests: this.results.filter((_, i) => this.testSuites[i]?.category === 'performance'),
        loadTests: this.results.filter((_, i) => this.testSuites[i]?.category === 'load')
      }
    };
  }

  private async saveReport(report: TestReport): Promise<void> {
    const reportDir = path.join(__dirname, '..', 'test-reports');
    
    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Save JSON report
    const jsonPath = path.join(reportDir, `test-report-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Save HTML report
    const htmlPath = path.join(reportDir, `test-report-${Date.now()}.html`);
    const htmlContent = this.generateHtmlReport(report);
    fs.writeFileSync(htmlPath, htmlContent);

    console.log(`\n📊 Reports saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
  }

  private generateHtmlReport(report: TestReport): string {
    const successRate = ((report.totalPassed / report.totalTests) * 100).toFixed(2);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Code Execution - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; margin-top: 5px; }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .warning { color: #ffc107; }
        .test-suite { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 6px; }
        .suite-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
        .suite-content { padding: 15px; }
        .test-result { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; }
        .test-result:last-child { border-bottom: none; }
        .status-icon { font-size: 1.2em; margin-right: 10px; }
        .errors { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 10px; margin-top: 10px; }
        .error-item { font-family: monospace; font-size: 0.9em; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Live Code Execution System - Test Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value ${report.totalFailed === 0 ? 'success' : 'failure'}">${report.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value success">${report.totalPassed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value ${report.totalFailed > 0 ? 'failure' : 'success'}">${report.totalFailed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value warning">${report.totalSkipped}</div>
                <div class="metric-label">Skipped</div>
            </div>
            <div class="metric">
                <div class="metric-value">${successRate}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.overallCoverage.toFixed(1)}%</div>
                <div class="metric-label">Coverage</div>
            </div>
        </div>

        ${Object.entries(report.summary).map(([category, results]) => `
            <div class="test-suite">
                <div class="suite-header">
                    <h3>${category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
                </div>
                <div class="suite-content">
                    ${results.map(result => `
                        <div class="test-result">
                            <div>
                                <span class="status-icon">${result.failed > 0 ? '❌' : '✅'}</span>
                                <strong>${result.suite}</strong>
                            </div>
                            <div>
                                <span class="success">${result.passed} passed</span> |
                                <span class="failure">${result.failed} failed</span> |
                                <span class="warning">${result.skipped} skipped</span> |
                                <span>${(result.duration / 1000).toFixed(2)}s</span>
                                ${result.coverage ? `| ${result.coverage.toFixed(1)}% coverage` : ''}
                            </div>
                        </div>
                        ${result.errors.length > 0 ? `
                            <div class="errors">
                                <strong>Errors:</strong>
                                ${result.errors.map(error => `<div class="error-item">${error}</div>`).join('')}
                            </div>
                        ` : ''}
                    `).join('')}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>
    `.trim();
  }

  private printSummary(report: TestReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(80));
    
    const successRate = ((report.totalPassed / report.totalTests) * 100).toFixed(2);
    const status = report.totalFailed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED';
    
    console.log(`\n${status}`);
    console.log(`\n📈 Overall Statistics:`);
    console.log(`   Total Test Suites: ${report.totalSuites}`);
    console.log(`   Total Tests: ${report.totalTests}`);
    console.log(`   Passed: ${report.totalPassed} (${successRate}%)`);
    console.log(`   Failed: ${report.totalFailed}`);
    console.log(`   Skipped: ${report.totalSkipped}`);
    console.log(`   Duration: ${(report.totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`   Coverage: ${report.overallCoverage.toFixed(1)}%`);

    // Category breakdown
    console.log(`\n📂 By Category:`);
    Object.entries(report.summary).forEach(([category, results]) => {
      if (results.length > 0) {
        const categoryPassed = results.reduce((sum, r) => sum + r.passed, 0);
        const categoryFailed = results.reduce((sum, r) => sum + r.failed, 0);
        const categoryTotal = categoryPassed + categoryFailed + results.reduce((sum, r) => sum + r.skipped, 0);
        const categoryRate = categoryTotal > 0 ? ((categoryPassed / categoryTotal) * 100).toFixed(1) : '0.0';
        
        console.log(`   ${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
      }
    });

    if (report.totalFailed > 0) {
      console.log(`\n❌ Failed Test Suites:`);
      report.results.filter(r => r.failed > 0).forEach(result => {
        console.log(`   - ${result.suite}: ${result.failed} failures`);
      });
    }

    console.log('\n' + '='.repeat(80));
  }
}

// Export for use in other scripts
export { ComprehensiveTestRunner };

// Run if called directly
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  runner.runAllTests()
    .then(report => {
      process.exit(report.totalFailed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}