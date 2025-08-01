/**
 * Language configurations for the Live Code Execution System
 */

import { LanguageConfig, SupportedLanguage } from './types';

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  javascript: {
    name: 'JavaScript',
    engine: 'web',
    fileExtension: '.js',
    syntaxHighlighting: 'javascript',
    defaultCode: 'console.log("Hello, JavaScript!");',
    supportedFeatures: ['livePreview', 'interactivity'],
    executionTimeout: 10000,
    memoryLimit: 50 * 1024 * 1024 // 50MB
  },
  
  typescript: {
    name: 'TypeScript',
    engine: 'web',
    fileExtension: '.ts',
    syntaxHighlighting: 'typescript',
    defaultCode: 'console.log("Hello, TypeScript!");',
    supportedFeatures: ['livePreview', 'interactivity'],
    executionTimeout: 10000,
    memoryLimit: 50 * 1024 * 1024
  },
  
  html: {
    name: 'HTML',
    engine: 'web',
    fileExtension: '.html',
    syntaxHighlighting: 'html',
    defaultCode: '<h1>Hello, HTML!</h1>\n<p>Welcome to live coding!</p>',
    supportedFeatures: ['livePreview', 'interactivity'],
    executionTimeout: 5000,
    memoryLimit: 25 * 1024 * 1024
  },
  
  css: {
    name: 'CSS',
    engine: 'web',
    fileExtension: '.css',
    syntaxHighlighting: 'css',
    defaultCode: 'body {\n  font-family: Arial, sans-serif;\n  background: linear-gradient(45deg, #667eea, #764ba2);\n  color: white;\n  padding: 20px;\n}',
    supportedFeatures: ['livePreview'],
    executionTimeout: 5000,
    memoryLimit: 25 * 1024 * 1024
  },
  
  python: {
    name: 'Python',
    engine: 'pyodide',
    fileExtension: '.py',
    syntaxHighlighting: 'python',
    defaultCode: 'print("Hello, Python!")\n\n# Try importing libraries:\n# import numpy as np\n# import pandas as pd\n# import matplotlib.pyplot as plt',
    supportedFeatures: ['plotting', 'dataAnalysis', 'machineLearning'],
    requiredPackages: ['numpy', 'pandas', 'matplotlib', 'scikit-learn'],
    executionTimeout: 30000,
    memoryLimit: 100 * 1024 * 1024 // 100MB
  },
  
  sql: {
    name: 'SQL',
    engine: 'sql.js',
    fileExtension: '.sql',
    syntaxHighlighting: 'sql',
    defaultCode: 'SELECT "Hello, SQL!" as greeting;\n\n-- Try creating tables:\n-- CREATE TABLE users (id INTEGER, name TEXT);\n-- INSERT INTO users VALUES (1, "Alice"), (2, "Bob");\n-- SELECT * FROM users;',
    supportedFeatures: ['database'],
    executionTimeout: 15000,
    memoryLimit: 50 * 1024 * 1024
  },
  
  json: {
    name: 'JSON',
    engine: 'json',
    fileExtension: '.json',
    syntaxHighlighting: 'json',
    defaultCode: '{\n  "message": "Hello, JSON!",\n  "data": {\n    "numbers": [1, 2, 3],\n    "active": true\n  }\n}',
    supportedFeatures: ['validation'],
    executionTimeout: 5000,
    memoryLimit: 10 * 1024 * 1024
  },
  
  yaml: {
    name: 'YAML',
    engine: 'yaml',
    fileExtension: '.yml',
    syntaxHighlighting: 'yaml',
    defaultCode: 'message: Hello, YAML!\ndata:\n  numbers:\n    - 1\n    - 2\n    - 3\n  active: true',
    supportedFeatures: ['validation'],
    executionTimeout: 5000,
    memoryLimit: 10 * 1024 * 1024
  },
  
  markdown: {
    name: 'Markdown',
    engine: 'markdown',
    fileExtension: '.md',
    syntaxHighlighting: 'markdown',
    defaultCode: '# Hello, Markdown!\n\nThis is **bold** and this is *italic*.\n\n- List item 1\n- List item 2\n\n```javascript\nconsole.log("Code block!");\n```',
    supportedFeatures: ['livePreview'],
    executionTimeout: 5000,
    memoryLimit: 10 * 1024 * 1024
  },
  
  regex: {
    name: 'Regular Expression',
    engine: 'regex',
    fileExtension: '.regex',
    syntaxHighlighting: 'regex',
    defaultCode: '\\d+|||Hello 123 World|||g',
    supportedFeatures: ['validation'],
    executionTimeout: 5000,
    memoryLimit: 10 * 1024 * 1024
  },
  
  bash: {
    name: 'Bash',
    engine: 'shell',
    fileExtension: '.sh',
    syntaxHighlighting: 'bash',
    defaultCode: 'echo "Hello, Bash!"\ndate\nls -la',
    supportedFeatures: [],
    executionTimeout: 10000,
    memoryLimit: 25 * 1024 * 1024
  }
};

export function getLanguageConfig(language: SupportedLanguage): LanguageConfig {
  return LANGUAGE_CONFIGS[language];
}

export function getSupportedLanguages(): SupportedLanguage[] {
  return Object.keys(LANGUAGE_CONFIGS) as SupportedLanguage[];
}

export function getLanguagesByEngine(engineName: string): SupportedLanguage[] {
  return Object.entries(LANGUAGE_CONFIGS)
    .filter(([_, config]) => config.engine === engineName)
    .map(([language, _]) => language as SupportedLanguage);
}