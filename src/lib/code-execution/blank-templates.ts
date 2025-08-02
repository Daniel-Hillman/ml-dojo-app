/**
 * Blank templates for quick language switching
 * These are minimal starter templates for each supported language
 */

import { SupportedLanguage } from './types';

export interface BlankTemplate {
  language: SupportedLanguage;
  name: string;
  code: string;
  description: string;
}

export const BLANK_TEMPLATES: Record<SupportedLanguage, BlankTemplate[]> = {
  javascript: [
    {
      language: 'javascript',
      name: 'Blank JavaScript',
      code: `// JavaScript code
console.log("Hello, World!");`,
      description: 'Empty JavaScript file with basic console output'
    },
    {
      language: 'javascript',
      name: 'Function Template',
      code: `// JavaScript function template
function myFunction() {
    // Your code here
    return "Hello, World!";
}

console.log(myFunction());`,
      description: 'Basic function structure'
    },
    {
      language: 'javascript',
      name: 'DOM Manipulation',
      code: `// DOM manipulation template
const element = document.createElement('div');
element.textContent = 'Hello, World!';
element.style.cssText = \`
    padding: 20px;
    background: #007bff;
    color: white;
    border-radius: 8px;
    text-align: center;
    margin: 20px;
\`;

document.body.appendChild(element);`,
      description: 'Basic DOM manipulation starter'
    }
  ],

  typescript: [
    {
      language: 'typescript',
      name: 'Blank TypeScript',
      code: `// TypeScript code
interface Greeting {
    message: string;
    name: string;
}

const greeting: Greeting = {
    message: "Hello",
    name: "World"
};

console.log(\`\${greeting.message}, \${greeting.name}!\`);`,
      description: 'Empty TypeScript file with interface example'
    }
  ],

  html: [
    {
      language: 'html',
      name: 'Blank HTML',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>Start building your HTML here.</p>
</body>
</html>`,
      description: 'Basic HTML5 document structure'
    },
    {
      language: 'html',
      name: 'HTML with CSS',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Styled Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, World!</h1>
        <p>This is a styled HTML page.</p>
    </div>
</body>
</html>`,
      description: 'HTML with embedded CSS styling'
    }
  ],

  css: [
    {
      language: 'css',
      name: 'Blank CSS',
      code: `/* CSS Styles */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
    color: #333;
    text-align: center;
}`,
      description: 'Basic CSS styling template'
    },
    {
      language: 'css',
      name: 'Flexbox Layout',
      code: `/* Flexbox Layout Template */
.flex-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.flex-item {
    background: white;
    padding: 40px;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    text-align: center;
}

.flex-item h1 {
    margin: 0 0 20px 0;
    color: #333;
}`,
      description: 'Flexbox-based layout starter'
    }
  ],

  python: [
    {
      language: 'python',
      name: 'Blank Python',
      code: `# Python code
print("Hello, World!")

# Your code here`,
      description: 'Empty Python file with basic print statement'
    },
    {
      language: 'python',
      name: 'Function Template',
      code: `# Python function template
def main():
    """Main function"""
    print("Hello, World!")
    
    # Your code here
    
if __name__ == "__main__":
    main()`,
      description: 'Python script with main function structure'
    },
    {
      language: 'python',
      name: 'Data Analysis',
      code: `# Data analysis template
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Create sample data
data = {
    'x': [1, 2, 3, 4, 5],
    'y': [2, 4, 6, 8, 10]
}

df = pd.DataFrame(data)
print(df)

# Create a simple plot
plt.figure(figsize=(8, 6))
plt.plot(df['x'], df['y'], marker='o')
plt.title('Sample Plot')
plt.xlabel('X values')
plt.ylabel('Y values')
plt.grid(True)
plt.show()`,
      description: 'Data analysis starter with pandas and matplotlib'
    }
  ],

  sql: [
    {
      language: 'sql',
      name: 'Blank SQL',
      code: `-- SQL Query
SELECT 'Hello, World!' as message;

-- Your queries here`,
      description: 'Empty SQL file with basic SELECT statement'
    },
    {
      language: 'sql',
      name: 'Table Creation',
      code: `-- Create table template
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at DATE DEFAULT CURRENT_DATE
);

-- Insert sample data
INSERT INTO users (name, email) VALUES
    ('John Doe', 'john@example.com'),
    ('Jane Smith', 'jane@example.com');

-- Query the data
SELECT * FROM users;`,
      description: 'Table creation and basic operations'
    }
  ],

  json: [
    {
      language: 'json',
      name: 'Blank JSON',
      code: `{
  "message": "Hello, World!",
  "data": {
    "items": [],
    "count": 0
  },
  "timestamp": "2024-01-01T00:00:00Z"
}`,
      description: 'Basic JSON structure template'
    },
    {
      language: 'json',
      name: 'API Response',
      code: `{
  "status": "success",
  "message": "Request completed successfully",
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}`,
      description: 'API response format template'
    }
  ],

  yaml: [
    {
      language: 'yaml',
      name: 'Blank YAML',
      code: `# YAML Configuration
app:
  name: "My Application"
  version: "1.0.0"
  debug: false

database:
  host: "localhost"
  port: 5432
  name: "myapp"

features:
  - authentication
  - logging
  - monitoring`,
      description: 'Basic YAML configuration template'
    }
  ],

  markdown: [
    {
      language: 'markdown',
      name: 'Blank Markdown',
      code: `# Hello, World!

This is a **Markdown** document.

## Features

- Easy to write
- Easy to read
- Supports *formatting*

### Code Example

\`\`\`javascript
console.log("Hello from Markdown!");
\`\`\`

> This is a blockquote.

[Link to example](https://example.com)`,
      description: 'Basic Markdown document template'
    }
  ]
};

/**
 * Get blank templates for a specific language
 */
export function getBlankTemplates(language: SupportedLanguage): BlankTemplate[] {
  return BLANK_TEMPLATES[language] || [];
}

/**
 * Get the default blank template for a language
 */
export function getDefaultBlankTemplate(language: SupportedLanguage): BlankTemplate {
  const templates = getBlankTemplates(language);
  return templates[0] || {
    language,
    name: `Blank ${language}`,
    code: `// ${language} code\nconsole.log("Hello, World!");`,
    description: `Empty ${language} file`
  };
}

/**
 * Get all available languages with blank templates
 */
export function getAvailableLanguages(): SupportedLanguage[] {
  return Object.keys(BLANK_TEMPLATES) as SupportedLanguage[];
}