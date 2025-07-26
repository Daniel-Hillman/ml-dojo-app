/**
 * Test to verify AI is generating blanks properly for different workout modes
 */

const testDrill = {
  id: "test-blank-generation",
  title: "Python Variables Test",
  concept: "Variable Assignment",
  difficulty: "Beginner",
  description: "Test drill for blank generation",
  drill_content: [
    {
      type: "theory",
      value: "Variables store data values in Python."
    },
    {
      type: "code",
      value: "# Assign values to variables\nname = ____\nage = ____\nprint(f\"Hello {name}, you are {age} years old\")",
      language: "python",
      solution: ["\"Alice\"", "25"],
      blanks: 2
    },
    {
      type: "mcq",
      value: "Which operator assigns values?",
      choices: ["=", "==", "!=", "->"],
      answer: 0
    }
  ]
};

console.log("🧪 TESTING AI BLANK GENERATION");
console.log("=" * 50);

console.log("\n📋 Original Drill Content:");
console.log("Code:", testDrill.drill_content[1].value);
console.log("Solutions:", testDrill.drill_content[1].solution);
console.log("Blank count:", (testDrill.drill_content[1].value.match(/____/g) || []).length);

console.log("\n🎯 Expected AI Transformations:");

console.log("\n🐌 CRAWL MODE (Beginner):");
console.log("Expected: FEWER blanks (1 blank)");
console.log("Example: 'name = \"Alice\"\\nage = ____\\nprint(...)'");
console.log("Focus: Only the most essential concept");

console.log("\n🚶 WALK MODE (Intermediate):");
console.log("Expected: SAME blanks (2 blanks)");
console.log("Example: 'name = ____\\nage = ____\\nprint(...)'");
console.log("Focus: Original difficulty maintained");

console.log("\n🏃 RUN MODE (Expert):");
console.log("Expected: MORE blanks (3-4 blanks)");
console.log("Example: '____ = ____\\n____ = ____\\nprint(f\"Hello {____}, you are {____} years old\")'");
console.log("Focus: Maximum challenge");

console.log("\n🔧 DEBUGGING CHECKLIST:");
console.log("□ Check if AI prompts are being called");
console.log("□ Verify AI is returning JSON with blanks");
console.log("□ Ensure drill content has 'value' field with ____");
console.log("□ Confirm solution array matches blank count");
console.log("□ Test with different workout modes");

console.log("\n💡 NEXT STEPS:");
console.log("1. Test the generateDynamicDrill function directly");
console.log("2. Check console logs for AI responses");
console.log("3. Verify the drill content structure");
console.log("4. Test with a drill that definitely has blanks");

console.log("\n🚀 READY TO DEBUG!");
console.log("Use the test page to see what the AI is actually generating.");

module.exports = { testDrill };