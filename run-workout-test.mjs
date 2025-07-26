#!/usr/bin/env node

/**
 * Direct test of the generateDynamicDrill function
 * This bypasses the web interface and tests the function directly
 */

// We need to simulate the Next.js environment
process.env.NODE_ENV = 'development';

// Test drill data
const testDrill = {
  id: "test-variables-workout",
  title: "Python Variables Test", 
  concept: "Variable Assignment",
  difficulty: "Beginner",
  description: "Test drill for workout modes",
  drill_content: [
    {
      type: "theory",
      value: "In Python, variables are used to store data values. You can assign a value to a variable using the equals sign (=)."
    },
    {
      type: "code",
      value: "# Assign a string to a variable\nname = ____\n\n# Assign a number to a variable\nage = ____\n\n# Print the variables\nprint(f\"Hello, my name is {name} and I am {age} years old\")",
      language: "python",
      solution: ["\"Alice\"", "25"],
      blanks: 2
    },
    {
      type: "mcq",
      value: "Which symbol is used to assign a value to a variable in Python?",
      choices: ["=", "==", "!=", "->"],
      answer: 0
    }
  ]
};

async function runWorkoutTest() {
  console.log("🚀 TESTING WORKOUT MODES AI GENERATION");
  console.log("=" * 50);
  
  try {
    // Import the function dynamically
    const { generateDynamicDrill } = await import('./src/lib/actions.js');
    
    const modes = ['Crawl', 'Walk', 'Run'];
    const results = [];
    
    console.log("\n📊 Original Drill Content:");
    const originalCodeBlock = testDrill.drill_content.find(item => item.type === 'code');
    console.log(`  Blanks: ${originalCodeBlock.blanks}`);
    console.log(`  Solutions: [${originalCodeBlock.solution.join(', ')}]`);
    console.log(`  Code: "${originalCodeBlock.value.substring(0, 100)}..."`);
    
    for (const mode of modes) {
      console.log(`\n🎯 Testing ${mode} mode...`);
      
      try {
        const startTime = Date.now();
        
        const result = await generateDynamicDrill({
          drill: testDrill,
          workoutMode: mode
        });
        
        const endTime = Date.now();
        const generationTime = endTime - startTime;
        
        // Analyze results
        const modifiedCodeBlock = result.drillContent.find(item => item.type === 'code');
        const originalBlanks = originalCodeBlock ? (originalCodeBlock.value.match(/____/g) || []).length : 0;
        const modifiedBlanks = modifiedCodeBlock ? (modifiedCodeBlock.value.match(/____/g) || []).length : 0;
        const blankChange = modifiedBlanks - originalBlanks;
        
        console.log(`⏱️  Generation Time: ${generationTime}ms`);
        console.log(`📊 Blanks: ${originalBlanks} → ${modifiedBlanks} (${blankChange > 0 ? '+' : ''}${blankChange})`);
        
        if (modifiedCodeBlock) {
          console.log(`🔧 Solutions: [${modifiedCodeBlock.solution?.join(', ') || 'none'}]`);
          console.log(`📝 Generated Code (first 150 chars):`);
          console.log(`   "${modifiedCodeBlock.value.substring(0, 150)}${modifiedCodeBlock.value.length > 150 ? '...' : ''}"`);
        }
        
        // Validate expectations
        let isExpected = false;
        let analysis = "";
        
        switch (mode) {
          case 'Crawl':
            isExpected = blankChange > 0;
            analysis = isExpected 
              ? "✅ Correctly increased blanks (easier difficulty)"
              : "❌ Expected MORE blanks for easier difficulty";
            break;
          case 'Walk':
            isExpected = blankChange === 0;
            analysis = isExpected 
              ? "✅ Correctly maintained original content"
              : "❌ Expected NO changes for baseline difficulty";
            break;
          case 'Run':
            isExpected = blankChange < 0;
            analysis = isExpected 
              ? "✅ Correctly decreased blanks (harder difficulty)"
              : "❌ Expected FEWER blanks for harder difficulty";
            break;
        }
        
        console.log(`🔍 Analysis: ${analysis}`);
        
        results.push({
          mode,
          success: true,
          generationTime,
          originalBlanks,
          modifiedBlanks,
          blankChange,
          isExpected,
          analysis
        });
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.push({
          mode,
          success: false,
          error: error.message
        });
      }
    }
    
    // Summary
    console.log("\n" + "=" * 50);
    console.log("📋 TEST SUMMARY");
    console.log("=" * 50);
    
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const expectedBehavior = results.filter(r => r.success && r.isExpected).length;
    
    console.log(`\n📊 Results:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Successful: ${passedTests}/${totalTests} (${(passedTests/totalTests*100).toFixed(1)}%)`);
    console.log(`  Expected Behavior: ${expectedBehavior}/${passedTests} (${passedTests > 0 ? (expectedBehavior/passedTests*100).toFixed(1) : 0}%)`);
    
    console.log(`\n🔍 Mode Analysis:`);
    results.forEach(result => {
      if (result.success) {
        console.log(`  ${result.mode}: ${result.analysis}`);
      } else {
        console.log(`  ${result.mode}: ❌ Failed - ${result.error}`);
      }
    });
    
    if (expectedBehavior === passedTests && passedTests === totalTests) {
      console.log(`\n🎉 ALL TESTS PASSED! AI generation is working correctly for all modes.`);
    } else {
      console.log(`\n⚠️  Some tests failed or didn't meet expectations. Check the analysis above.`);
    }
    
    return results;
    
  } catch (error) {
    console.error("💥 Failed to run tests:", error);
    console.error("Make sure you're in the project directory and dependencies are installed.");
    return null;
  }
}

// Run the test
runWorkoutTest()
  .then(results => {
    if (results) {
      console.log("\n✅ Test execution completed!");
      process.exit(0);
    } else {
      console.log("\n❌ Test execution failed!");
      process.exit(1);
    }
  })
  .catch(error => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });