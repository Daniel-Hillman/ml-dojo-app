#!/usr/bin/env node

/**
 * Comprehensive test suite for AI content generation across workout modes
 * Tests the generateDynamicDrill function with various drill types and modes
 */

import { generateDynamicDrill } from './src/lib/actions.js';

// Test drill with various content types
const testDrill = {
  id: "test-variables-drill",
  title: "Python Variables and Data Types",
  concept: "Variable Assignment and Types",
  difficulty: "Beginner",
  description: "Learn how to work with variables and different data types in Python",
  drill_content: [
    {
      type: "theory",
      value: "In Python, variables are containers for storing data values. Python has several built-in data types including strings, integers, floats, and booleans. Variables are created when you assign a value to them using the equals sign (=)."
    },
    {
      type: "code",
      value: "# Create variables of different types\nname = ____\nage = ____\nheight = ____\nis_student = ____\n\n# Print variable information\nprint(f\"Name: {name}, Type: {type(name)}\")\nprint(f\"Age: {age}, Type: {type(age)}\")\nprint(f\"Height: {height}, Type: {type(height)}\")\nprint(f\"Is student: {is_student}, Type: {type(is_student)}\")",
      language: "python",
      solution: ["\"Alice\"", "25", "5.6", "True"],
      blanks: 4
    },
    {
      type: "mcq",
      value: "Which of the following is the correct way to create a string variable in Python?",
      choices: ["name = Alice", "name = \"Alice\"", "string name = Alice", "var name = \"Alice\""],
      answer: 1
    }
  ]
};

// More complex test drill
const complexTestDrill = {
  id: "test-loops-drill",
  title: "Python For Loops",
  concept: "Iteration and Loops",
  difficulty: "Intermediate", 
  description: "Master for loops and iteration in Python",
  drill_content: [
    {
      type: "theory",
      value: "For loops in Python are used to iterate over sequences like lists, strings, or ranges. The basic syntax is 'for item in sequence:' followed by the code block to execute for each item."
    },
    {
      type: "code",
      value: "# Loop through a list of numbers\nnumbers = [1, 2, 3, 4, 5]\nfor ____ in ____:\n    result = num * 2\n    print(f\"{num} * 2 = {result}\")\n\n# Loop through a range\nfor ____ in range(____, ____):\n    print(f\"Count: {i}\")",
      language: "python", 
      solution: ["num", "numbers", "i", "1", "6"],
      blanks: 5
    },
    {
      type: "mcq",
      value: "What will range(1, 4) generate?",
      choices: ["[1, 2, 3, 4]", "[1, 2, 3]", "[0, 1, 2, 3]", "[1, 4]"],
      answer: 1
    }
  ]
};

/**
 * Test helper functions
 */
function validateDrillContent(content, mode, originalContent) {
  const errors = [];
  
  if (!Array.isArray(content)) {
    errors.push("Content is not an array");
    return { isValid: false, errors };
  }
  
  // Check that we have the same number of content blocks
  if (content.length !== originalContent.length) {
    errors.push(`Content length mismatch: expected ${originalContent.length}, got ${content.length}`);
  }
  
  content.forEach((item, index) => {
    const originalItem = originalContent[index];
    
    // Basic structure validation
    if (!item.type || !item.value) {
      errors.push(`Item ${index}: Missing required fields 'type' or 'value'`);
      return;
    }
    
    // Type should match original
    if (item.type !== originalItem.type) {
      errors.push(`Item ${index}: Type mismatch - expected ${originalItem.type}, got ${item.type}`);
    }
    
    // Code block specific validation
    if (item.type === 'code') {
      const blankCount = (item.value.match(/____/g) || []).length;
      
      if (blankCount === 0) {
        errors.push(`Item ${index}: Code block has no blanks`);
      }
      
      if (!item.solution || !Array.isArray(item.solution)) {
        errors.push(`Item ${index}: Missing or invalid solution array`);
      } else if (item.solution.length !== blankCount) {
        errors.push(`Item ${index}: Solution array length (${item.solution.length}) doesn't match blank count (${blankCount})`);
      }
      
      // Mode-specific validation
      const originalBlankCount = (originalItem.value.match(/____/g) || []).length;
      
      if (mode === 'Crawl' && blankCount <= originalBlankCount) {
        errors.push(`Item ${index}: Crawl mode should have MORE blanks than original (${originalBlankCount}), got ${blankCount}`);
      }
      
      if (mode === 'Run' && blankCount >= originalBlankCount) {
        errors.push(`Item ${index}: Run mode should have FEWER blanks than original (${originalBlankCount}), got ${blankCount}`);
      }
    }
    
    // MCQ specific validation
    if (item.type === 'mcq') {
      if (!item.choices || !Array.isArray(item.choices) || item.choices.length < 2) {
        errors.push(`Item ${index}: Invalid choices array`);
      }
      
      if (typeof item.answer !== 'number' || item.answer < 0 || item.answer >= item.choices.length) {
        errors.push(`Item ${index}: Invalid answer index`);
      }
    }
  });
  
  return { isValid: errors.length === 0, errors };
}

function analyzeDifficultyChanges(original, modified, mode) {
  const analysis = {
    mode,
    changes: [],
    blankComparison: {},
    contentChanges: {}
  };
  
  original.forEach((originalItem, index) => {
    const modifiedItem = modified[index];
    
    if (originalItem.type === 'code' && modifiedItem.type === 'code') {
      const originalBlanks = (originalItem.value.match(/____/g) || []).length;
      const modifiedBlanks = (modifiedItem.value.match(/____/g) || []).length;
      
      analysis.blankComparison[index] = {
        original: originalBlanks,
        modified: modifiedBlanks,
        change: modifiedBlanks - originalBlanks,
        percentage: ((modifiedBlanks - originalBlanks) / originalBlanks * 100).toFixed(1)
      };
      
      // Analyze content complexity
      const originalComplexity = originalItem.value.length;
      const modifiedComplexity = modifiedItem.value.length;
      
      analysis.contentChanges[index] = {
        originalLength: originalComplexity,
        modifiedLength: modifiedComplexity,
        lengthChange: modifiedComplexity - originalComplexity
      };
    }
  });
  
  return analysis;
}

/**
 * Main testing function
 */
async function testWorkoutModes() {
  console.log("🚀 Starting AI Content Generation Tests\n");
  console.log("=" * 60);
  
  const testDrills = [
    { name: "Basic Variables", drill: testDrill },
    { name: "Complex Loops", drill: complexTestDrill }
  ];
  
  const modes = ['Crawl', 'Walk', 'Run'];
  const results = {};
  
  for (const { name, drill } of testDrills) {
    console.log(`\n📚 Testing Drill: ${name}`);
    console.log("-" * 40);
    
    results[name] = {};
    
    for (const mode of modes) {
      console.log(`\n🎯 Testing ${mode} mode...`);
      
      try {
        const startTime = Date.now();
        const result = await generateDynamicDrill({
          drill: drill,
          workoutMode: mode
        });
        const endTime = Date.now();
        
        const generationTime = endTime - startTime;
        console.log(`⏱️  Generation time: ${generationTime}ms`);
        
        // Validate the result
        const validation = validateDrillContent(result.drillContent, mode, drill.drill_content);
        
        if (validation.isValid) {
          console.log("✅ Content validation: PASSED");
        } else {
          console.log("❌ Content validation: FAILED");
          validation.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        // Analyze difficulty changes
        const analysis = analyzeDifficultyChanges(drill.drill_content, result.drillContent, mode);
        
        // Display blank count changes for code blocks
        Object.entries(analysis.blankComparison).forEach(([index, comparison]) => {
          console.log(`📊 Code block ${index}: ${comparison.original} → ${comparison.modified} blanks (${comparison.change > 0 ? '+' : ''}${comparison.change}, ${comparison.percentage}%)`);
        });
        
        // Store results for summary
        results[name][mode] = {
          success: validation.isValid,
          generationTime,
          validation,
          analysis,
          content: result.drillContent
        };
        
        // Show sample of generated content
        const codeBlocks = result.drillContent.filter(item => item.type === 'code');
        if (codeBlocks.length > 0) {
          console.log(`\n📝 Sample generated code (first 200 chars):`);
          console.log(`"${codeBlocks[0].value.substring(0, 200)}${codeBlocks[0].value.length > 200 ? '...' : ''}"`);
        }
        
      } catch (error) {
        console.log(`❌ Error testing ${mode} mode:`, error.message);
        results[name][mode] = {
          success: false,
          error: error.message
        };
      }
    }
  }
  
  // Print summary
  console.log("\n" + "=" * 60);
  console.log("📋 TEST SUMMARY");
  console.log("=" * 60);
  
  Object.entries(results).forEach(([drillName, drillResults]) => {
    console.log(`\n${drillName}:`);
    Object.entries(drillResults).forEach(([mode, result]) => {
      const status = result.success ? "✅ PASS" : "❌ FAIL";
      const time = result.generationTime ? `(${result.generationTime}ms)` : "";
      console.log(`  ${mode}: ${status} ${time}`);
      
      if (!result.success && result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });
  });
  
  // Overall statistics
  const totalTests = Object.values(results).reduce((sum, drillResults) => sum + Object.keys(drillResults).length, 0);
  const passedTests = Object.values(results).reduce((sum, drillResults) => 
    sum + Object.values(drillResults).filter(result => result.success).length, 0);
  
  console.log(`\n📊 Overall Results: ${passedTests}/${totalTests} tests passed (${(passedTests/totalTests*100).toFixed(1)}%)`);
  
  // Specific mode analysis
  console.log("\n🔍 Mode-Specific Analysis:");
  modes.forEach(mode => {
    const modeResults = Object.values(results).map(drillResults => drillResults[mode]).filter(Boolean);
    const modeSuccesses = modeResults.filter(result => result.success).length;
    console.log(`  ${mode}: ${modeSuccesses}/${modeResults.length} successful`);
  });
  
  return results;
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  testWorkoutModes()
    .then(results => {
      console.log("\n🎉 Testing completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("\n💥 Testing failed:", error);
      process.exit(1);
    });
}

export { testWorkoutModes, validateDrillContent, analyzeDifficultyChanges };