'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Code, 
  Search, 
  CheckCircle,
  Settings,
  Lightbulb
} from 'lucide-react';
import { LiveCodeBlock } from '@/components/LiveCodeBlock';
import { CodeExecutionResult } from '@/lib/code-execution';

const SAMPLE_CONFIGS = {
  json: {
    name: 'JSON Configuration',
    description: 'JSON validation and formatting with analysis',
    code: `{
  "name": "My Application",
  "version": "1.0.0",
  "description": "A sample application configuration",
  "config": {
    "database": {
      "host": "localhost",
      "port": 5432,
      "name": "myapp_db",
      "ssl": true
    },
    "api": {
      "baseUrl": "https://api.example.com",
      "timeout": 30000,
      "retries": 3
    },
    "features": {
      "authentication": true,
      "logging": true,
      "caching": false
    }
  },
  "environments": ["development", "staging", "production"],
  "metadata": {
    "created": "2024-01-15T10:30:00Z",
    "author": "Developer Team"
  }
}`
  },
  
  yaml: {
    name: 'YAML Configuration',
    description: 'YAML parsing and validation with JSON conversion',
    code: `# Application Configuration
name: My Application
version: 1.0.0
description: A sample application configuration

# Database settings
database:
  host: localhost
  port: 5432
  name: myapp_db
  ssl: true

# API configuration
api:
  baseUrl: https://api.example.com
  timeout: 30000
  retries: 3

# Feature flags
features:
  authentication: true
  logging: true
  caching: false

# Environment list
environments:
  - development
  - staging
  - production

# Metadata
metadata:
  created: 2024-01-15T10:30:00Z
  author: Developer Team`
  },
  
  markdown: {
    name: 'Markdown Documentation',
    description: 'Markdown rendering with live preview and analysis',
    code: `# Configuration Languages Demo

This is a **comprehensive demo** of configuration language support in our live code execution system.

## Features

### JSON Support
- ✅ Syntax validation
- ✅ Formatting and prettification
- ✅ Structure analysis
- ✅ Error reporting with line numbers

### YAML Support
- ✅ YAML to JSON conversion
- ✅ Syntax validation
- ✅ Comment preservation analysis
- ✅ Structure inspection

### Markdown Support
- ✅ Live preview rendering
- ✅ Content statistics
- ✅ Link and image detection
- ✅ Code block highlighting

## Code Examples

Here's a JSON example:
\`\`\`json
{
  "name": "example",
  "version": "1.0.0"
}
\`\`\`

And a YAML example:
\`\`\`yaml
name: example
version: 1.0.0
\`\`\`

## Links and Images

Check out our [documentation](https://example.com) for more details.

![Sample Image](https://via.placeholder.com/300x200?text=Sample+Image)

## Lists

### Ordered List
1. First item
2. Second item
3. Third item

### Unordered List
- Bullet point one
- Bullet point two
- Bullet point three

## Blockquotes

> This is a blockquote example.
> It can span multiple lines.

---

*Thank you for trying our configuration language support!*`
  },
  
  regex: {
    name: 'Regular Expression Tester',
    description: 'Regex testing with match highlighting and analysis',
    code: `\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b|||Please contact us at support@example.com or sales@company.org for assistance. You can also reach admin@test.co.uk|||g`
  }
};

export default function TestConfigLanguagesPage() {
  const [selectedConfig, setSelectedConfig] = useState<keyof typeof SAMPLE_CONFIGS>('json');
  const [executionResults, setExecutionResults] = useState<CodeExecutionResult[]>([]);

  const handleExecutionComplete = (result: CodeExecutionResult) => {
    setExecutionResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
  };

  const getLanguageForConfig = (configType: keyof typeof SAMPLE_CONFIGS): string => {
    switch (configType) {
      case 'json': return 'json';
      case 'yaml': return 'yaml';
      case 'markdown': return 'markdown';
      case 'regex': return 'regex';
      default: return 'json';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Settings className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Configuration Languages Test</h1>
          <Badge variant="outline" className="text-sm">
            Task 9 Implementation
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Testing support for configuration languages: JSON validation, YAML parsing, 
          Markdown rendering, and regex testing with match highlighting.
        </p>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Configuration Language Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Code className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium">JSON Validation</h3>
                <p className="text-sm text-muted-foreground">Syntax checking & formatting</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-medium">YAML Parsing</h3>
                <p className="text-sm text-muted-foreground">YAML to JSON conversion</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-medium">Markdown Preview</h3>
                <p className="text-sm text-muted-foreground">Live rendering & analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Search className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-medium">Regex Testing</h3>
                <p className="text-sm text-muted-foreground">Match highlighting & groups</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Try Configuration Languages</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedConfig} onValueChange={(value) => setSelectedConfig(value as keyof typeof SAMPLE_CONFIGS)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="json" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                JSON
              </TabsTrigger>
              <TabsTrigger value="yaml" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                YAML
              </TabsTrigger>
              <TabsTrigger value="markdown" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Markdown
              </TabsTrigger>
              <TabsTrigger value="regex" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Regex
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              {Object.entries(SAMPLE_CONFIGS).map(([key, config]) => (
                <TabsContent key={key} value={key}>
                  <div className="space-y-2">
                    <h3 className="font-medium">{config.name}</h3>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                    {key === 'regex' && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                        <strong>Regex Format:</strong> <code>pattern|||testString|||flags</code>
                        <br />
                        <strong>Example:</strong> <code>\\d+|||Hello 123 World|||g</code>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Live Code Editor */}
      <LiveCodeBlock
        initialCode={SAMPLE_CONFIGS[selectedConfig].code}
        language={getLanguageForConfig(selectedConfig) as any}
        height="400px"
        showOutput={true}
        allowEdit={true}
        showLanguageSelector={false}
        onExecutionComplete={handleExecutionComplete}
        className="min-h-[500px]"
      />

      {/* Execution History */}
      {executionResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Recent Executions
              <Badge variant="outline" className="text-xs">
                {executionResults.length} results
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {executionResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
                      {result.success ? 'Success' : 'Error'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {result.executionTime}ms
                    </span>
                    {result.metadata?.type && (
                      <Badge variant="outline" className="text-xs">
                        Type: {result.metadata.type}
                      </Badge>
                    )}
                    {result.metadata?.matchCount !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {result.metadata.matchCount} matches
                      </Badge>
                    )}
                    {result.metadata?.lines && (
                      <Badge variant="outline" className="text-xs">
                        {result.metadata.lines} lines
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test Configuration Languages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Code className="w-4 h-4" />
                1. JSON Validation & Formatting
              </h4>
              <p className="text-muted-foreground">
                Paste any JSON content to validate syntax, format with proper indentation, 
                and get detailed analysis including structure depth and key counts.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                2. YAML Parsing & Conversion
              </h4>
              <p className="text-muted-foreground">
                Enter YAML content to validate syntax and see the equivalent JSON representation. 
                The system analyzes comments, arrays, and nested structures.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                3. Markdown Rendering & Preview
              </h4>
              <p className="text-muted-foreground">
                Write Markdown content to see live HTML preview with proper styling. 
                Get statistics on words, headings, links, images, and code blocks.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Search className="w-4 h-4" />
                4. Regex Testing & Match Highlighting
              </h4>
              <p className="text-muted-foreground">
                Test regular expressions with the format: <code>pattern|||testString|||flags</code>. 
                See highlighted matches, capture groups, and pattern analysis.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">5. Error Handling & Validation</h4>
              <p className="text-muted-foreground">
                Try entering invalid syntax in any language to see detailed error messages 
                with line numbers and helpful suggestions for fixes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}