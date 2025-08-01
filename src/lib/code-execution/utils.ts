/**
 * Utility functions for code execution system
 */

import { SupportedLanguage } from './types';

/**
 * Detect programming language from code content
 */
export function detectLanguage(code: string, filename?: string): SupportedLanguage | null {
  // First try to detect from filename extension
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'py': return 'python';
      case 'sql': return 'sql';
      case 'json': return 'json';
      case 'yml':
      case 'yaml': return 'yaml';
      case 'md': return 'markdown';
      case 'sh': return 'bash';
    }
  }

  // Detect from code patterns
  const codeLines = code.trim().split('\n');
  const firstLine = codeLines[0]?.trim() || '';
  const codeContent = code.toLowerCase();

  // HTML detection
  if (codeContent.includes('<!doctype') || 
      codeContent.includes('<html') || 
      codeContent.includes('<head') ||
      codeContent.includes('<body')) {
    return 'html';
  }

  // CSS detection
  if (codeContent.match(/[a-z-]+\s*:\s*[^;]+;/) && 
      (codeContent.includes('{') && codeContent.includes('}'))) {
    return 'css';
  }

  // JSON detection
  if ((firstLine.startsWith('{') || firstLine.startsWith('[')) &&
      (code.trim().endsWith('}') || code.trim().endsWith(']'))) {
    try {
      JSON.parse(code);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // YAML detection
  if (codeContent.includes(':') && 
      (codeContent.includes('- ') || codeContent.match(/^\s*\w+:/m))) {
    return 'yaml';
  }

  // SQL detection
  if (codeContent.match(/\b(select|insert|update|delete|create|drop|alter)\b/i)) {
    return 'sql';
  }

  // Python detection
  if (codeContent.includes('def ') || 
      codeContent.includes('import ') ||
      codeContent.includes('from ') ||
      codeContent.includes('print(') ||
      firstLine.startsWith('#!') && firstLine.includes('python')) {
    return 'python';
  }

  // JavaScript/TypeScript detection
  if (codeContent.includes('console.log') ||
      codeContent.includes('function ') ||
      codeContent.includes('const ') ||
      codeContent.includes('let ') ||
      codeContent.includes('var ') ||
      codeContent.includes('=>')) {
    
    // Check for TypeScript specific patterns
    if (codeContent.includes(': string') ||
        codeContent.includes(': number') ||
        codeContent.includes('interface ') ||
        codeContent.includes('type ')) {
      return 'typescript';
    }
    return 'javascript';
  }

  // Bash detection
  if (firstLine.startsWith('#!') && firstLine.includes('bash') ||
      codeContent.includes('echo ') ||
      codeContent.includes('ls ') ||
      codeContent.includes('cd ')) {
    return 'bash';
  }

  // Markdown detection
  if (codeContent.includes('# ') || 
      codeContent.includes('## ') ||
      codeContent.includes('**') ||
      codeContent.includes('```')) {
    return 'markdown';
  }

  // Regex detection (simple heuristic)
  if (code.startsWith('/') && code.includes('/') && code.length < 200) {
    return 'regex';
  }

  return null;
}

/**
 * Format execution time in human-readable format
 */
export function formatExecutionTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Sanitize output for safe display
 */
export function sanitizeOutput(output: string): string {
  if (!output) return '';
  
  // Remove potential XSS vectors
  return output
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT REMOVED]')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '[IFRAME REMOVED]')
    .replace(/javascript:/gi, 'javascript-blocked:')
    .replace(/on\w+\s*=/gi, 'on-event-blocked=');
}

/**
 * Truncate long output with ellipsis
 */
export function truncateOutput(output: string, maxLength: number = 10000): string {
  if (!output || output.length <= maxLength) return output;
  
  return output.substring(0, maxLength) + '\n... (output truncated)';
}

/**
 * Extract error information from execution errors
 */
export function parseExecutionError(error: any): { message: string; line?: number; column?: number } {
  if (typeof error === 'string') {
    return { message: error };
  }
  
  if (error instanceof Error) {
    const message = error.message;
    
    // Try to extract line/column info from common error formats
    const lineMatch = message.match(/line (\d+)/i) || message.match(/:(\d+):/);
    const columnMatch = message.match(/column (\d+)/i) || message.match(/:(\d+):(\d+)/);
    
    return {
      message,
      line: lineMatch ? parseInt(lineMatch[1]) : undefined,
      column: columnMatch && columnMatch[2] ? parseInt(columnMatch[2]) : undefined
    };
  }
  
  return { message: 'Unknown error occurred' };
}

/**
 * Generate a shareable URL for a code snippet
 */
export function generateShareableUrl(sessionId: string, baseUrl: string = ''): string {
  return `${baseUrl}/code/${sessionId}`;
}

/**
 * Validate code for basic security issues
 */
export function validateCodeSecurity(code: string, language: SupportedLanguage): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const codeContent = code.toLowerCase();
  
  // Common security patterns to check
  const securityPatterns = [
    { pattern: /eval\s*\(/, message: 'Use of eval() is not allowed' },
    { pattern: /function\s*constructor/i, message: 'Function constructor is not allowed' },
    { pattern: /document\.write/i, message: 'document.write is not allowed' },
    { pattern: /window\.location/i, message: 'Location manipulation is not allowed' },
    { pattern: /fetch\s*\(/i, message: 'Network requests are restricted' },
    { pattern: /xmlhttprequest/i, message: 'XMLHttpRequest is not allowed' },
  ];
  
  // Language-specific checks
  if (language === 'javascript' || language === 'typescript') {
    securityPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(codeContent)) {
        issues.push(message);
      }
    });
  }
  
  // Python-specific checks
  if (language === 'python') {
    const pythonPatterns = [
      { pattern: /import\s+os/i, message: 'OS module access is restricted' },
      { pattern: /import\s+subprocess/i, message: 'Subprocess module is not allowed' },
      { pattern: /exec\s*\(/i, message: 'exec() function is not allowed' },
      { pattern: /eval\s*\(/i, message: 'eval() function is not allowed' },
    ];
    
    pythonPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(codeContent)) {
        issues.push(message);
      }
    });
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}