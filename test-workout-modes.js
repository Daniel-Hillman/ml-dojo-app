// Simple test to verify workout modes are working
const testDrill = {
  "title": "Basic Python Variables",
  "concept": "Variable Assignment", 
  "difficulty": "Beginner",
  "description": "Learn how to assign values to variables in Python",
  "drill_content": [
    {
      "type": "theory",
      "value": "In Python, variables are used to store data values. You can assign a value to a variable using the equals sign (=)."
    },
    {
      "type": "code", 
      "value": "# Assign a string to a variable\nname = ____\n\n# Assign a number to a variable\nage = ____\n\n# Print the variables\nprint(f\"Hello, my name is {name} and I am {age} years old\")",
      "language": "python",
      "solution": ["\"Alice\"", "25"],
      "blanks": 2
    },
    {
      "type": "mcq",
      "value": "Which symbol is used to assign a value to a variable in Python?",
      "choices": ["=", "==", "!=", "->"],
      "answer": 0
    }
  ]
};

console.log("Original drill content:");
console.log(JSON.stringify(testDrill.drill_content, null, 2));

// Test different workout modes
const modes = ['Crawl', 'Walk', 'Run'];

modes.forEach(mode => {
  console.log(`\n=== Testing ${mode} mode ===`);
  // This would call the generateDynamicDrill function
  // For now, just showing the structure
  console.log(`Mode: ${mode}`);
  console.log("Expected behavior:");
  switch(mode) {
    case 'Crawl':
      console.log("- More small blanks, simpler questions");
      break;
    case 'Walk': 
      console.log("- Original drill content (baseline)");
      break;
    case 'Run':
      console.log("- Fewer but larger blanks, harder questions");
      break;
  }
});