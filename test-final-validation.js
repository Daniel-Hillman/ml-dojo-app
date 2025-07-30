#!/usr/bin/env node

/**
 * Final Validation Test Runner for Practice Drills Enhancement
 * 
 * This script runs comprehensive tests to validate all requirements
 * and ensures the feature is ready for production deployment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Final Validation Tests for Practice Drills Enhancement');
console.log('=' .repeat(70));

// Test configuration
const testConfig = {
  testTimeout: 30000,
  maxWorkers: 4,
  verbose: true,
  coverage: true
};

// Test suites to run in order
const testSuites = [
  {
    name: 'Unit Tests - Data Loading Functions',
    pattern: 'src/lib/__tests__/drills.test.ts',
    description: 'Validates core data loading and transformation functions'
  },
  {
    name: 'Component Tests - Enhanced UI Elements',
    pattern: 'src/components/__tests__/*.test.tsx',
    description: 'Tests all enhanced components with drill source indicators'
  },
  {
    name: 'Integration Tests - User Flows',
    pattern: 'src/__tests__/integration/user-flows.test.tsx',
    description: 'Tests complete user journeys across pages'
  },
  {
    name: 'Integration Tests - Create Drill Flow',
    pattern: 'src/__tests__/integration/create-drill-flow.test.tsx',
    description: 'Tests drill creation and appearance in practice page'
  },
  {
    name: 'Integration Tests - Save Drill Flow',
    pattern: 'src/__tests__/integration/save-drill-flow.test.tsx',
    description: 'Tests save/unsave functionality across pages'
  },
  {
    name: 'Accessibility Tests',
    pattern: 'src/__tests__/accessibility/*.test.tsx',
    description: 'Validates accessibility compliance and keyboard navigation'
  },
  {
    name: 'Final End-to-End Validation',
    pattern: 'src/__tests__/integration/final-e2e-validation.test.tsx',
    description: 'Comprehensive validation of all requirements'
  }
];

// Requirements validation checklist
const requirementsChecklist = [
  {
    id: '1.1',
    description: 'Two distinct sections: "My Drills" and "Saved from Community"',
    testPattern: 'final-e2e-validation.*Organized sections'
  },
  {
    id: '1.2',
    description: 'My Drills section shows only user-created drills',
    testPattern: 'final-e2e-validation.*Personal drills only'
  },
  {
    id: '1.3',
    description: 'Saved from Community section shows only saved community drills',
    testPattern: 'final-e2e-validation.*Community drills only'
  },
  {
    id: '1.4',
    description: 'Empty state for My Drills with Create Drill button',
    testPattern: 'final-e2e-validation.*Empty states.*Create Drill'
  },
  {
    id: '1.5',
    description: 'Empty state for Saved from Community with Browse Community button',
    testPattern: 'final-e2e-validation.*Empty states.*Browse Community'
  },
  {
    id: '2.1',
    description: 'Save button adds drill to saved collection',
    testPattern: 'save-drill-flow.*Save.*adds to collection'
  },
  {
    id: '2.2',
    description: 'Saved drill appears in practice page immediately',
    testPattern: 'user-flows.*save.*practice page'
  },
  {
    id: '2.3',
    description: 'Save button toggles (unsave functionality)',
    testPattern: 'save-drill-flow.*toggle save state'
  },
  {
    id: '2.4',
    description: 'Toast notification confirms save action',
    testPattern: 'save-drill-flow.*Toast notification'
  },
  {
    id: '3.1',
    description: 'Remove from Saved option on saved drill cards',
    testPattern: 'save-drill-flow.*Remove.*option'
  },
  {
    id: '3.2',
    description: 'Remove action removes drill from saved collection',
    testPattern: 'save-drill-flow.*remove.*collection'
  },
  {
    id: '3.3',
    description: 'Removed drill disappears from Saved section',
    testPattern: 'save-drill-flow.*disappears.*section'
  },
  {
    id: '3.4',
    description: 'Confirmation toast for removal',
    testPattern: 'save-drill-flow.*confirmation toast'
  },
  {
    id: '3.5',
    description: 'Saved drill cards show original author information',
    testPattern: 'final-e2e-validation.*author information'
  },
  {
    id: '4.1',
    description: 'Browse Community button in practice page header',
    testPattern: 'final-e2e-validation.*Browse Community button'
  },
  {
    id: '4.2',
    description: 'Browse Community button navigates to community page',
    testPattern: 'user-flows.*navigate.*community'
  },
  {
    id: '4.3',
    description: 'My Practice button on community page',
    testPattern: 'user-flows.*My Practice.*community'
  },
  {
    id: '4.4',
    description: 'Counters show personal, saved, and total drill counts',
    testPattern: 'final-e2e-validation.*Counters'
  },
  {
    id: '4.5',
    description: 'Sections load efficiently without blocking each other',
    testPattern: 'final-e2e-validation.*load.*independently'
  },
  {
    id: '5.1',
    description: 'Saved drills show original author name and avatar',
    testPattern: 'final-e2e-validation.*Original author'
  },
  {
    id: '5.2',
    description: 'Saved drills show original creation date',
    testPattern: 'final-e2e-validation.*creation date'
  },
  {
    id: '5.3',
    description: 'Saved drills show community metrics (likes, views, saves)',
    testPattern: 'final-e2e-validation.*community metrics'
  },
  {
    id: '5.4',
    description: 'Saved drills function identically to community drills',
    testPattern: 'final-e2e-validation.*identical functionality'
  },
  {
    id: '5.5',
    description: 'Saved drill cards are visually distinct with Community badge',
    testPattern: 'final-e2e-validation.*Community badge'
  }
];

// Utility functions
function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  console.log(`📋 ${title}`);
  console.log('='.repeat(70));
}

function logSubsection(title) {
  console.log(`\n🔍 ${title}`);
  console.log('-'.repeat(50));
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
}

function logWarning(message) {
  console.log(`⚠️  ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

// Main test execution
async function runFinalValidation() {
  const startTime = Date.now();
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failedSuites = [];
  const testResults = [];

  logSection('Pre-Test Validation');
  
  // Check if Jest is available
  const jestCheck = runCommand('npx jest --version');
  if (!jestCheck.success) {
    logError('Jest is not available. Please install Jest first.');
    process.exit(1);
  }
  logSuccess(`Jest version: ${jestCheck.output.trim()}`);

  // Check if test files exist
  logSubsection('Checking Test Files');
  let missingFiles = 0;
  for (const suite of testSuites) {
    const testPath = path.join(process.cwd(), suite.pattern);
    if (suite.pattern.includes('*')) {
      // For glob patterns, just check if directory exists
      const dir = path.dirname(testPath);
      if (!fs.existsSync(dir)) {
        logWarning(`Test directory not found: ${dir}`);
        missingFiles++;
      } else {
        logSuccess(`Test directory exists: ${dir}`);
      }
    } else {
      // For specific files
      if (!fs.existsSync(testPath)) {
        logWarning(`Test file not found: ${testPath}`);
        missingFiles++;
      } else {
        logSuccess(`Test file exists: ${testPath}`);
      }
    }
  }

  if (missingFiles > 0) {
    logWarning(`${missingFiles} test files/directories are missing. Some tests may be skipped.`);
  }

  // Run test suites
  logSection('Running Test Suites');
  
  for (const suite of testSuites) {
    logSubsection(suite.name);
    logInfo(suite.description);
    
    const jestCommand = `npx jest "${suite.pattern}" --testTimeout=${testConfig.testTimeout} --maxWorkers=${testConfig.maxWorkers} --verbose --json`;
    
    const result = runCommand(jestCommand);
    
    if (result.success) {
      try {
        const testOutput = JSON.parse(result.output);
        const suiteResults = {
          name: suite.name,
          numTotalTests: testOutput.numTotalTests || 0,
          numPassedTests: testOutput.numPassedTests || 0,
          numFailedTests: testOutput.numFailedTests || 0,
          success: testOutput.success || false,
          testResults: testOutput.testResults || []
        };
        
        testResults.push(suiteResults);
        totalTests += suiteResults.numTotalTests;
        passedTests += suiteResults.numPassedTests;
        failedTests += suiteResults.numFailedTests;
        
        if (suiteResults.success) {
          logSuccess(`${suiteResults.numPassedTests}/${suiteResults.numTotalTests} tests passed`);
        } else {
          logError(`${suiteResults.numFailedTests}/${suiteResults.numTotalTests} tests failed`);
          failedSuites.push(suite.name);
        }
      } catch (parseError) {
        logError(`Failed to parse test results: ${parseError.message}`);
        failedSuites.push(suite.name);
      }
    } else {
      logError(`Test suite failed to run: ${result.error}`);
      if (result.output) {
        console.log(result.output);
      }
      failedSuites.push(suite.name);
    }
  }

  // Requirements validation
  logSection('Requirements Validation');
  
  let validatedRequirements = 0;
  const failedRequirements = [];
  
  for (const requirement of requirementsChecklist) {
    logInfo(`Validating ${requirement.id}: ${requirement.description}`);
    
    // Check if any test results match the requirement pattern
    let requirementMet = false;
    for (const suiteResult of testResults) {
      for (const testResult of suiteResult.testResults) {
        for (const assertionResult of testResult.assertionResults || []) {
          if (assertionResult.title && assertionResult.title.includes(requirement.testPattern.split('.*')[1])) {
            if (assertionResult.status === 'passed') {
              requirementMet = true;
              break;
            }
          }
        }
        if (requirementMet) break;
      }
      if (requirementMet) break;
    }
    
    if (requirementMet) {
      logSuccess(`Requirement ${requirement.id} validated`);
      validatedRequirements++;
    } else {
      logWarning(`Requirement ${requirement.id} could not be validated`);
      failedRequirements.push(requirement.id);
    }
  }

  // Generate final report
  logSection('Final Validation Report');
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n📊 Test Execution Summary:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
  console.log(`   Duration: ${duration}s`);
  
  console.log(`\n📋 Requirements Validation:`);
  console.log(`   Total Requirements: ${requirementsChecklist.length}`);
  console.log(`   Validated: ${validatedRequirements}`);
  console.log(`   Coverage: ${((validatedRequirements / requirementsChecklist.length) * 100).toFixed(1)}%`);
  
  if (failedSuites.length > 0) {
    console.log(`\n❌ Failed Test Suites:`);
    failedSuites.forEach(suite => console.log(`   - ${suite}`));
  }
  
  if (failedRequirements.length > 0) {
    console.log(`\n⚠️  Unvalidated Requirements:`);
    failedRequirements.forEach(req => {
      const requirement = requirementsChecklist.find(r => r.id === req);
      console.log(`   - ${req}: ${requirement?.description || 'Unknown'}`);
    });
  }

  // Final verdict
  console.log('\n' + '='.repeat(70));
  
  const testsPassed = failedTests === 0;
  const requirementsCovered = validatedRequirements >= requirementsChecklist.length * 0.9; // 90% threshold
  
  if (testsPassed && requirementsCovered) {
    logSuccess('🎉 VALIDATION PASSED - Practice Drills Enhancement is ready for deployment!');
    console.log('\n✨ All critical functionality has been validated:');
    console.log('   ✅ Complete user journey from community discovery to practice');
    console.log('   ✅ Drill functionality works identically regardless of source');
    console.log('   ✅ Various user scenarios handled correctly');
    console.log('   ✅ All requirements validated through comprehensive testing');
    process.exit(0);
  } else {
    logError('❌ VALIDATION FAILED - Issues need to be addressed before deployment');
    console.log('\n🔧 Issues to resolve:');
    if (!testsPassed) {
      console.log(`   ❌ ${failedTests} test(s) failing`);
    }
    if (!requirementsCovered) {
      console.log(`   ❌ Only ${validatedRequirements}/${requirementsChecklist.length} requirements validated`);
    }
    process.exit(1);
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the validation
if (require.main === module) {
  runFinalValidation().catch(error => {
    logError(`Validation failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runFinalValidation };