'use client';

import React, { useState } from 'react';
import { ProvenApproach } from '@/components/ProvenApproach';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TEST_CONTENT = {
  python: {
    value: `def calculate_average(numbers):
    total = ____
    for num in numbers:
        total += ____
    return total / ____`,
    solution: ['0', 'num', 'len(numbers)'],
    language: 'python'
  },
  javascript: {
    value: `function calculateAverage(numbers) {
    let total = ____;
    for (let i = 0; i < numbers.length; i++) {
        total += ____;
    }
    return total / ____;
}`,
    solution: ['0', 'numbers[i]', 'numbers.length'],
    language: 'javascript'
  },
  java: {
    value: `public class Calculator {
    public static double calculateAverage(int[] numbers) {
        int total = ____;
        for (int num : numbers) {
            total += ____;
        }
        return (double) total / ____;
    }
}`,
    solution: ['0', 'num', 'numbers.length'],
    language: 'java'
  },
  cpp: {
    value: `#include <iostream>
#include <vector>
using namespace std;

double calculateAverage(vector<int> numbers) {
    int total = ____;
    for (int num : numbers) {
        total += ____;
    }
    return static_cast<double>(total) / ____;
}`,
    solution: ['0', 'num', 'numbers.size()'],
    language: 'cpp'
  },
  html: {
    value: `<!DOCTYPE html>
<html>
<head>
    <title>____</title>
</head>
<body>
    <h1>____</h1>
    <p>This is a ____</p>
</body>
</html>`,
    solution: ['My Page', 'Welcome', 'paragraph'],
    language: 'html'
  },
  css: {
    value: `.container {
    display: ____;
    justify-content: ____;
    align-items: ____;
    background-color: ____;
}`,
    solution: ['flex', 'center', 'center', '#f0f0f0'],
    language: 'css'
  },
  sql: {
    value: `SELECT ____
FROM users
WHERE age > ____
ORDER BY ____ DESC;`,
    solution: ['name, email', '18', 'age'],
    language: 'sql'
  },
  rust: {
    value: `fn calculate_average(numbers: Vec<i32>) -> f64 {
    let mut total = ____;
    for num in numbers.iter() {
        total += ____;
    }
    total as f64 / ____
}`,
    solution: ['0', 'num', 'numbers.len() as f64'],
    language: 'rust'
  },
  go: {
    value: `package main

import "fmt"

func calculateAverage(numbers []int) float64 {
    total := ____
    for _, num := range numbers {
        total += ____
    }
    return float64(total) / ____
}`,
    solution: ['0', 'num', 'float64(len(numbers))'],
    language: 'go'
  },
  php: {
    value: `<?php
function calculateAverage($numbers) {
    $total = ____;
    foreach ($numbers as $num) {
        $total += ____;
    }
    return $total / ____;
}
?>`,
    solution: ['0', '$num', 'count($numbers)'],
    language: 'php'
  }
};

export default function TestLanguagesPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [validations, setValidations] = useState<Record<string, boolean>>({});

  const handleAnswerChange = (contentIndex: number, newAnswers: Record<string, string>) => {
    setAnswers(prev => ({
      ...prev,
      [selectedLanguage]: newAnswers
    }));
  };

  const handleValidationChange = (contentIndex: number, isValid: boolean) => {
    setValidations(prev => ({
      ...prev,
      [selectedLanguage]: isValid
    }));
  };

  const currentContent = TEST_CONTENT[selectedLanguage as keyof typeof TEST_CONTENT];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Multi-Language Syntax Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the syntax highlighting and interactive code blocks across different programming languages.
          </p>
        </div>

        {/* Language Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Programming Language</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="rust">Rust</SelectItem>
                <SelectItem value="go">Go</SelectItem>
                <SelectItem value="php">PHP</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Interactive Code Block */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Interactive Code Block - {selectedLanguage.toUpperCase()}</span>
              {validations[selectedLanguage] && (
                <span className="text-green-500 text-sm">✅ All blanks correct!</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProvenApproach
              content={currentContent}
              contentIndex={0}
              onAnswerChange={handleAnswerChange}
              onValidationChange={handleValidationChange}
            />
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Current Language:</strong> {selectedLanguage}
              </div>
              <div>
                <strong>Expected Solutions:</strong> {JSON.stringify(currentContent.solution)}
              </div>
              <div>
                <strong>User Answers:</strong> {JSON.stringify(answers[selectedLanguage] || {})}
              </div>
              <div>
                <strong>Is Valid:</strong> {validations[selectedLanguage] ? 'Yes' : 'No'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}