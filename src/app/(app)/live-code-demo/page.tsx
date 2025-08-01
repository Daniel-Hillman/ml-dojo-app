'use client';

import React, { useState } from 'react';
import { LiveCodeBlock } from '@/components/LiveCodeBlock';
import { CodeOutput } from '@/components/CodeOutput';
import { SupportedLanguage, CodeExecutionResult } from '@/lib/code-execution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DEMO_CODES = {
  html: `<div class="container">
  <h1>🚀 Welcome to Live Coding!</h1>
  <p>This HTML is running live in your browser.</p>
  <button onclick="alert('Hello from live code!')">Click me!</button>
  <div class="gradient-box">
    <p>Beautiful gradients and animations work too!</p>
  </div>
</div>

<style>
  .container {
    font-family: 'Arial', sans-serif;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 10px;
    text-align: center;
  }
  
  .gradient-box {
    margin: 20px 0;
    padding: 15px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    backdrop-filter: blur(10px);
  }
  
  button {
    background: #ff6b6b;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: transform 0.2s;
  }
  
  button:hover {
    transform: scale(1.05);
  }
</style>`,

  css: `/* Modern CSS with animations and gradients */
body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(45deg, #ff9a9e, #fecfef, #fecfef, #ff9a9e);
  background-size: 400% 400%;
  animation: gradientShift 8s ease infinite;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.demo-content {
  background: rgba(255, 255, 255, 0.9);
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  backdrop-filter: blur(10px);
}

h1 {
  color: #333;
  margin-bottom: 20px;
  font-size: 2.5em;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.box {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 20px;
  margin: 20px 0;
  border-radius: 15px;
  transform: perspective(1000px) rotateX(5deg);
  transition: transform 0.3s ease;
}

.box:hover {
  transform: perspective(1000px) rotateX(0deg) scale(1.02);
}

button {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(238, 90, 36, 0.3);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(238, 90, 36, 0.4);
}`,

  javascript: `// Interactive JavaScript Demo
console.log("🚀 Welcome to Live JavaScript Execution!");

// Create some interactive elements
const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
let colorIndex = 0;

function createColorfulDiv() {
  const div = document.createElement('div');
  div.style.cssText = \`
    width: 100px;
    height: 100px;
    background: \${colors[colorIndex % colors.length]};
    margin: 10px;
    border-radius: 50%;
    display: inline-block;
    transition: all 0.3s ease;
    cursor: pointer;
  \`;
  
  div.addEventListener('click', () => {
    div.style.transform = 'scale(1.2) rotate(180deg)';
    setTimeout(() => {
      div.style.transform = 'scale(1) rotate(0deg)';
    }, 300);
  });
  
  document.body.appendChild(div);
  colorIndex++;
}

// Create multiple colorful circles
for (let i = 0; i < 5; i++) {
  createColorfulDiv();
}

// Add some dynamic content
const info = document.createElement('div');
info.innerHTML = \`
  <h2>🎨 Interactive Demo</h2>
  <p>Click the circles above to see animations!</p>
  <p>Current time: \${new Date().toLocaleTimeString()}</p>
\`;
info.style.cssText = \`
  text-align: center;
  margin: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
\`;
document.body.appendChild(info);

// Log some data
const data = [1, 2, 3, 4, 5].map(x => x * x);
console.log("Squared numbers:", data);

// Demonstrate async operations
setTimeout(() => {
  console.log("⏰ This message appeared after 2 seconds!");
}, 2000);

console.log("✅ JavaScript execution complete!");`,

  python: `# Python with Data Science Demo
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

print("🐍 Welcome to Live Python Execution!")

# Create some sample data
np.random.seed(42)
data = {
    'x': np.random.randn(100),
    'y': np.random.randn(100),
    'category': np.random.choice(['A', 'B', 'C'], 100)
}

df = pd.DataFrame(data)
print("📊 Created DataFrame with shape:", df.shape)
print("\\nFirst 5 rows:")
print(df.head())

# Basic statistics
print("\\n📈 Basic Statistics:")
print(df.describe())

# Create a simple plot
plt.figure(figsize=(10, 6))
plt.scatter(df['x'], df['y'], c=df['category'].map({'A': 'red', 'B': 'blue', 'C': 'green'}), alpha=0.6)
plt.xlabel('X values')
plt.ylabel('Y values')
plt.title('Scatter Plot of Random Data')
plt.legend(['Category A', 'Category B', 'Category C'])
plt.grid(True, alpha=0.3)
plt.show()

print("✅ Python execution complete!")`,

  sql: `-- SQL Demo with Sample Data
-- Create a users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    age INTEGER,
    city TEXT,
    created_at DATE DEFAULT CURRENT_DATE
);

-- Insert sample data
INSERT INTO users (name, email, age, city) VALUES
    ('Alice Johnson', 'alice@example.com', 28, 'New York'),
    ('Bob Smith', 'bob@example.com', 35, 'San Francisco'),
    ('Carol Davis', 'carol@example.com', 22, 'Chicago'),
    ('David Wilson', 'david@example.com', 41, 'New York'),
    ('Eve Brown', 'eve@example.com', 29, 'San Francisco');

-- Query the data
SELECT 'Total users:' as metric, COUNT(*) as value FROM users
UNION ALL
SELECT 'Average age:', ROUND(AVG(age), 1) FROM users
UNION ALL
SELECT 'Cities:', COUNT(DISTINCT city) FROM users;

-- Group by city
SELECT 
    city,
    COUNT(*) as user_count,
    ROUND(AVG(age), 1) as avg_age
FROM users 
GROUP BY city 
ORDER BY user_count DESC;

-- Find users older than 30
SELECT name, email, age, city
FROM users 
WHERE age > 30 
ORDER BY age DESC;`
};

export default function LiveCodeDemoPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);

  const handleLanguageChange = (language: SupportedLanguage) => {
    setSelectedLanguage(language);
    setExecutionResult(null); // Clear previous results
  };

  const handleExecutionComplete = (result: CodeExecutionResult) => {
    setExecutionResult(result);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">🚀 Live Code Execution Demo</h1>
        <p className="text-xl text-muted-foreground">
          Experience the power of running code directly in your browser!
        </p>
      </div>

      <div className="grid gap-6">
        {/* Main Live Code Block */}
        <LiveCodeBlock
          initialCode={DEMO_CODES[selectedLanguage] || DEMO_CODES.javascript}
          language={selectedLanguage}
          showOutput={true}
          allowEdit={true}
          height="500px"
          showLanguageSelector={true}
          showControls={true}
          onLanguageChange={handleLanguageChange}
          onExecutionComplete={handleExecutionComplete}
          className="w-full"
        />

        {/* Execution Result Display */}
        {executionResult && (
          <CodeOutput
            result={executionResult}
            language={selectedLanguage}
            maxHeight="300px"
            showMetadata={true}
          />
        )}

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🌐 Web Languages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Run HTML, CSS, and JavaScript with live preview and interactive elements.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🐍 Python & ML
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Execute Python code with NumPy, Pandas, and Matplotlib for data science.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🗄️ SQL Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Run SQL queries with in-browser SQLite database and sample data.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}