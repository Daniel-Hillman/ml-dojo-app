"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle } from "lucide-react";

export default function TestGenkitPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
    </div>
  );
}