"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle } from "lucide-react";
import { generateDynamicDrill } from "@/lib/actions";
import { SyntaxHighlightTest } from "@/components/SyntaxHighlightTest";

export default function TestGenkitPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [workoutTestResults, setWorkoutTestResults] = useState("");

  const testSimpleGeneration = async () => {
    setIsLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch('/api/genkit/testSimpleGeneration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.answer || "No response received");
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      console.error("Test error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const testDrillGeneration = async () => {
    setIsLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch('/api/genkit/generateDrillFromPrompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: question }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      console.error("Drill generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const testWorkoutModes = async () => {
    setIsLoading(true);
    setError("");
    setWorkoutTestResults("");

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

    try {
      const modes = ['Crawl', 'Walk', 'Run'];
      const results = [];

      for (const mode of modes) {
        console.log(`Testing ${mode} mode...`);
        const startTime = Date.now();
        
        const result = await generateDynamicDrill({
          drill: testDrill,
          workoutMode: mode as "Crawl" | "Walk" | "Run"
        });
        
        const endTime = Date.now();
        const generationTime = endTime - startTime;

        // Analyze the results
        const originalCodeBlock = testDrill.drill_content.find(item => item.type === 'code');
        const modifiedCodeBlock = result.drillContent.find(item => item.type === 'code');
        
        const originalBlanks = originalCodeBlock ? (originalCodeBlock.value.match(/____/g) || []).length : 0;
        const modifiedBlanks = modifiedCodeBlock ? (modifiedCodeBlock.value.match(/____/g) || []).length : 0;

        results.push({
          mode,
          generationTime,
          originalBlanks,
          modifiedBlanks,
          blankChange: modifiedBlanks - originalBlanks,
          success: true,
          content: result.drillContent
        });
      }

      // Format results for display
      let resultText = "🚀 WORKOUT MODES AI GENERATION TEST RESULTS\n\n";
      
      results.forEach(result => {
        resultText += `=== ${result.mode.toUpperCase()} MODE ===\n`;
        resultText += `⏱️  Generation Time: ${result.generationTime}ms\n`;
        resultText += `📊 Blanks: ${result.originalBlanks} → ${result.modifiedBlanks} (${result.blankChange > 0 ? '+' : ''}${result.blankChange})\n`;
        
        const codeBlock = result.content.find(item => item.type === 'code');
        if (codeBlock) {
          resultText += `📝 Sample Code:\n${codeBlock.value.substring(0, 200)}${codeBlock.value.length > 200 ? '...' : ''}\n`;
          resultText += `🔧 Solutions: [${codeBlock.solution?.join(', ') || 'none'}]\n`;
        }
        
        resultText += `✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}\n\n`;
      });

      // Summary
      const totalTests = results.length;
      const passedTests = results.filter(r => r.success).length;
      resultText += `📋 SUMMARY: ${passedTests}/${totalTests} tests passed\n`;
      
      // Mode-specific analysis
      resultText += "\n🔍 MODE ANALYSIS:\n";
      results.forEach(result => {
        let analysis = "";
        if (result.mode === 'Crawl' && result.blankChange > 0) {
          analysis = "✅ Correctly increased difficulty (more blanks)";
        } else if (result.mode === 'Walk' && result.blankChange === 0) {
          analysis = "✅ Correctly maintained original content";
        } else if (result.mode === 'Run' && result.blankChange < 0) {
          analysis = "✅ Correctly decreased blanks (higher difficulty)";
        } else {
          analysis = "⚠️  Unexpected blank count change";
        }
        resultText += `${result.mode}: ${analysis}\n`;
      });

      setWorkoutTestResults(resultText);

    } catch (err: any) {
      setError(`Workout modes test error: ${err.message}`);
      console.error("Workout modes test error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Genkit Integration Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test AI Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Enter a question or prompt:
            </label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What is machine learning?"
              className="mb-4"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={testSimpleGeneration} 
              disabled={isLoading || !question.trim()}
            >
              {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Simple Generation
            </Button>
            
            <Button 
              onClick={testDrillGeneration} 
              disabled={isLoading || !question.trim()}
              variant="outline"
            >
              {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Drill Generation
            </Button>
            
            <Button 
              onClick={testWorkoutModes} 
              disabled={isLoading}
              variant="secondary"
            >
              {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Workout Modes AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-red-600 whitespace-pre-wrap">{error}</pre>
          </CardContent>
        </Card>
      )}

      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={response}
              readOnly
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}

      {workoutTestResults && (
        <Card>
          <CardHeader>
            <CardTitle>Workout Modes Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={workoutTestResults}
              readOnly
              className="min-h-[400px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Syntax Highlighting Test</CardTitle>
        </CardHeader>
        <CardContent>
          <SyntaxHighlightTest />
        </CardContent>
      </Card>
    </div>
  );
}