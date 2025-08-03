'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  BookOpen, 
  Play,
  Sparkles,
  Database,
  BarChart3,
  Lightbulb
} from 'lucide-react';
// Lazy load heavy components for better performance
const LiveCodeBlock = dynamic(() => import('@/components/LiveCodeBlock').then(mod => ({ default: mod.LiveCodeBlock })), {
  loading: () => (
    <div className="flex items-center justify-center h-96 border rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading code editor...</p>
      </div>
    </div>
  ),
  ssr: false
});

const TemplateBrowser = dynamic(() => import('@/components/TemplateBrowser'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  ssr: false
});
import dynamic from 'next/dynamic';

// Dynamically import Python IDE with retry logic
const PythonIDE = dynamic(
  () => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadWithRetry = async (): Promise<any> => {
      try {
        const mod = await import('@/components/python/PythonIDE');
        return { default: mod.PythonIDE };
      } catch (error) {
        console.error(`Failed to load PythonIDE (attempt ${retryCount + 1}):`, error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return loadWithRetry();
        }
        
        // Return a comprehensive fallback component after all retries failed
        return {
          default: ({ initialCode, height, showDataInspector, className }: any) => (
            <div className={`flex items-center justify-center border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 ${className}`} style={{ height }}>
              <div className="text-center p-6 max-w-md">
                <div className="text-yellow-600 dark:text-yellow-400 mb-3">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Python IDE Unavailable
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  The Python IDE failed to load after multiple attempts. This might be due to a network issue or the component being temporarily unavailable.
                </p>
                <div className="space-y-2">
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Refresh Page
                  </button>
                  <p className="text-xs text-gray-500">
                    You can still use other language tabs in the playground
                  </p>
                </div>
              </div>
            </div>
          )
        };
      }
    };
    
    return loadWithRetry();
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 border rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Python IDE...</p>
          <p className="text-xs text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    )
  }
);

const QUICK_EXAMPLES = {
  javascript: {
    title: 'JavaScript Basics',
    code: `// JavaScript fundamentals
function greetUser(name) {
    return \`Hello, \${name}! Welcome to OmniCode.\`;
}

const users = ['Alice', 'Bob', 'Charlie'];
users.forEach(user => {
    console.log(greetUser(user));
});

// Try modifying the code above!`,
    language: 'javascript' as const
  },
  python: {
    title: 'Python Data Analysis',
    code: `# Python with data analysis
import pandas as pd
import numpy as np

# Create sample data
data = {
    'Name': ['Alice', 'Bob', 'Charlie'],
    'Age': [25, 30, 35],
    'Score': [85, 92, 78]
}

df = pd.DataFrame(data)
print("Sample DataFrame:")
print(df)

# Calculate statistics
print(f"\\nAverage age: {df['Age'].mean():.1f}")
print(f"Average score: {df['Score'].mean():.1f}")`,
    language: 'python' as const
  },
  html: {
    title: 'HTML & CSS',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to OmniCode</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        h1 {
            text-align: center;
            margin-bottom: 20px;
        }
        .feature {
            margin: 15px 0;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Welcome to OmniCode Playground</h1>
        <div class="feature">
            <h3>✨ Live Code Execution</h3>
            <p>Write and run code instantly in your browser</p>
        </div>
        <div class="feature">
            <h3>📚 Multiple Languages</h3>
            <p>Support for JavaScript, Python, HTML, CSS, SQL and more</p>
        </div>
        <div class="feature">
            <h3>🎯 Interactive Learning</h3>
            <p>Practice with drills and real-world examples</p>
        </div>
    </div>
</body>
</html>`,
    language: 'html' as const
  },
  sql: {
    title: 'SQL Queries',
    code: `-- SQL Database Operations
-- Sample data for a user management system

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    age INTEGER,
    department TEXT
);

INSERT INTO users (name, email, age, department) VALUES
    ('Alice Johnson', 'alice@example.com', 28, 'Engineering'),
    ('Bob Smith', 'bob@example.com', 32, 'Marketing'),
    ('Charlie Brown', 'charlie@example.com', 25, 'Engineering'),
    ('Diana Prince', 'diana@example.com', 30, 'Design');

-- Query examples
SELECT * FROM users;

SELECT name, email 
FROM users 
WHERE department = 'Engineering';

SELECT department, COUNT(*) as employee_count
FROM users 
GROUP BY department;

SELECT name, age
FROM users 
WHERE age > 27
ORDER BY age DESC;`,
    language: 'sql' as const
  }
};

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState('quick-start');
  const [selectedExample, setSelectedExample] = useState<keyof typeof QUICK_EXAMPLES>('javascript');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Play className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Code Playground</h1>
          <Badge variant="outline" className="text-sm">
            Interactive Coding Environment
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Write, run, and experiment with code in multiple programming languages. 
          Perfect for learning, prototyping, and testing ideas.
        </p>
      </div>

      {/* Quick Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Playground Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors">
              <Code className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium">Live Execution</h3>
                <p className="text-sm text-muted-foreground">Run code instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors">
              <BookOpen className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-medium">Code Templates</h3>
                <p className="text-sm text-muted-foreground">Ready-to-use examples</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors">
              <Database className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-medium">Data Analysis</h3>
                <p className="text-sm text-muted-foreground">Python data tools</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-medium">Visualizations</h3>
                <p className="text-sm text-muted-foreground">Charts and graphs</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Playground */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quick-start" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Quick Start
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="python-ide" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Python IDE
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick-start" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Examples</CardTitle>
              <p className="text-sm text-muted-foreground">
                Get started quickly with these interactive examples
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(QUICK_EXAMPLES).map(([key, example]) => (
                  <Button
                    key={key}
                    variant={selectedExample === key ? "default" : "outline"}
                    onClick={() => setSelectedExample(key as keyof typeof QUICK_EXAMPLES)}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Code className="w-5 h-5" />
                    <span className="text-sm">{example.title}</span>
                  </Button>
                ))}
              </div>
              
              <LiveCodeBlock
                initialCode={QUICK_EXAMPLES[selectedExample].code}
                language={QUICK_EXAMPLES[selectedExample].language}
                height="400px"
                showOutput={true}
                allowEdit={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Code Templates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Browse and use pre-built code templates for various programming tasks
              </p>
            </CardHeader>
            <CardContent>
              <TemplateBrowser
                onTemplateSelect={(template) => {
                  // Handle template selection - could integrate with live code editor
                  console.log('Selected template:', template);
                }}
                showLanguageFilter={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="python-ide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Python IDE
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enhanced Python environment with data analysis tools and visualization support
              </p>
            </CardHeader>
            <CardContent>
              <PythonIDE
                initialCode={`# Welcome to the Python IDE!
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Create sample data
data = pd.DataFrame({
    'x': np.random.randn(100),
    'y': np.random.randn(100)
})

print("Sample data created!")
print(data.head())

# Create a simple plot
plt.figure(figsize=(8, 6))
plt.scatter(data['x'], data['y'], alpha=0.6)
plt.title('Random Data Scatter Plot')
plt.xlabel('X values')
plt.ylabel('Y values')
plt.show()

print("Plot created! Check the output panel.")`}
                height="500px"
                showDataInspector={true}
                className="min-h-[600px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Code Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <LiveCodeBlock
                  initialCode="// Write your custom code here\nconsole.log('Hello, OmniCode!');"
                  language="javascript"
                  height="300px"
                  showOutput={true}
                  allowEdit={true}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Multi-Language Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    The playground supports multiple programming languages:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">JavaScript</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Python</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">HTML/CSS</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">SQL</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">TypeScript</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">JSON</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium">1. Choose Your Language</h3>
              <p className="text-sm text-muted-foreground">
                Select from JavaScript, Python, HTML/CSS, SQL, and more. Each language has specialized features and tools.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">2. Write & Run Code</h3>
              <p className="text-sm text-muted-foreground">
                Use the live code editor to write your code. Click the run button or use Ctrl+Enter to execute instantly.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">3. Explore Templates</h3>
              <p className="text-sm text-muted-foreground">
                Browse our template library for examples, tutorials, and starter code to accelerate your learning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}