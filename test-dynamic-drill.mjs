// Test the generateDynamicDrill function
import { generateDynamicDrill } from './src/lib/actions.ts';

const testDrill = {
  id: "test-drill",
  title: "Basic Python Variables",
  concept: "Variable Assignment",
  difficulty: "Beginner", 
  description: "Learn how to assign values to variables in Python",
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

async function testWorkoutModes() {
  const modes = ['Crawl', 'Walk', 'Run'];
  
  for (const mode of modes) {
    console.log(`\n=== Testing ${mode} mode ===`);
    try {
      const result = await generateDynamicDrill({
        drill: testDrill,
        workoutMode: mode
      });
      
      console.log(`${mode} result:`, JSON.stringify(result.drillContent, null, 2));
    } catch (error) {
      console.error(`Error testing ${mode} mode:`, error);
    }
  }
}

testWorkoutModes();