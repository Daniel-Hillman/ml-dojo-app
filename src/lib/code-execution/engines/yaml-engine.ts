/**
 * YAML Execution Engine for parsing and validation
 */

import { 
  ExecutionEngine, 
  CodeExecutionRequest, 
  CodeExecutionResult, 
  SupportedLanguage 
} from '../types';

// Simple YAML parser for basic validation (avoiding external dependencies)
export class YamlExecutionEngine implements ExecutionEngine {
  name = 'yaml';
  supportedLanguages: SupportedLanguage[] = ['yaml'];

  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const yamlString = request.code.trim();
      
      if (!yamlString) {
        return {
          success: true,
          output: 'No YAML content provided',
          executionTime: Date.now() - startTime
        };
      }

      // Parse YAML to validate syntax and convert to JSON
      let parsedYaml: any;
      try {
        parsedYaml = this.parseYaml(yamlString);
      } catch (parseError) {
        return {
          success: false,
          error: this.formatYamlError(parseError, yamlString),
          executionTime: Date.now() - startTime
        };
      }

      // Convert to JSON for analysis
      const jsonEquivalent = JSON.stringify(parsedYaml, null, 2);
      
      // Generate analysis
      const analysis = this.analyzeYaml(yamlString, parsedYaml);
      
      // Create visual output
      const visualOutput = this.createYamlVisualization(yamlString, jsonEquivalent, analysis);

      return {
        success: true,
        output: `YAML is valid!\n\nJSON equivalent:\n${jsonEquivalent}\n\n${analysis.summary}`,
        visualOutput,
        executionTime: Date.now() - startTime,
        metadata: {
          lines: analysis.lines,
          keys: analysis.keys,
          type: analysis.type,
          hasComments: analysis.hasComments,
          hasArrays: analysis.hasArrays
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown YAML processing error',
        executionTime: Date.now() - startTime
      };
    }
  }

  async validateCode(code: string): Promise<boolean> {
    try {
      const trimmed = code.trim();
      if (!trimmed) return true;
      
      this.parseYaml(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for YAML processing
  }

  // Private methods

  private parseYaml(yamlString: string): any {
    // Simple YAML parser for basic structures
    // This is a simplified implementation - in production, you'd use a library like js-yaml
    
    const lines = yamlString.split('\n');
    const result: any = {};
    const stack: any[] = [result];
    let currentIndent = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // Calculate indentation
      const indent = line.length - line.trimStart().length;
      
      // Handle key-value pairs
      if (trimmedLine.includes(':')) {
        const [key, ...valueParts] = trimmedLine.split(':');
        const value = valueParts.join(':').trim();
        
        // Adjust stack based on indentation
        while (stack.length > 1 && indent <= currentIndent) {
          stack.pop();
          currentIndent -= 2; // Assuming 2-space indentation
        }
        
        const current = stack[stack.length - 1];
        
        if (value) {
          // Simple value
          current[key.trim()] = this.parseValue(value);
        } else {
          // Nested object
          current[key.trim()] = {};
          stack.push(current[key.trim()]);
          currentIndent = indent;
        }
      }
      // Handle array items
      else if (trimmedLine.startsWith('-')) {
        const value = trimmedLine.substring(1).trim();
        const current = stack[stack.length - 1];
        
        if (!Array.isArray(current)) {
          throw new Error(`Invalid YAML: Array item found but parent is not an array at line ${i + 1}`);
        }
        
        current.push(this.parseValue(value));
      }
    }
    
    return result;
  }

  private parseValue(value: string): any {
    // Parse different value types
    if (value === 'null' || value === '~') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Try to parse as number
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    if (/^-?\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    
    return value;
  }

  private formatYamlError(error: any, yamlString: string): string {
    const message = error.message || 'YAML parsing error';
    return `YAML Syntax Error: ${message}`;
  }

  private analyzeYaml(yamlString: string, parsedYaml: any): {
    lines: number;
    keys: number;
    type: string;
    hasComments: boolean;
    hasArrays: boolean;
    summary: string;
  } {
    const lines = yamlString.split('\n').length;
    const hasComments = yamlString.includes('#');
    const hasArrays = yamlString.includes('-');
    
    let keys = 0;
    const type = Array.isArray(parsedYaml) ? 'array' : typeof parsedYaml;
    
    if (typeof parsedYaml === 'object' && parsedYaml !== null) {
      keys = this.countKeys(parsedYaml);
    }

    let summary = `YAML Analysis:\n`;
    summary += `- Lines: ${lines}\n`;
    summary += `- Type: ${type}\n`;
    summary += `- Keys: ${keys}\n`;
    summary += `- Has comments: ${hasComments ? 'Yes' : 'No'}\n`;
    summary += `- Has arrays: ${hasArrays ? 'Yes' : 'No'}\n`;

    return { lines, keys, type, hasComments, hasArrays, summary };
  }

  private countKeys(obj: any): number {
    if (typeof obj !== 'object' || obj === null) return 0;
    
    let count = 0;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        count += this.countKeys(item);
      }
    } else {
      count += Object.keys(obj).length;
      for (const value of Object.values(obj)) {
        count += this.countKeys(value);
      }
    }
    
    return count;
  }

  private createYamlVisualization(yamlString: string, jsonEquivalent: string, analysis: any): string {
    return `
      <div class="yaml-visualization space-y-4">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 class="font-medium text-green-800 mb-2 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Valid YAML
          </h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-green-600 font-medium">Lines:</span> ${analysis.lines}
            </div>
            <div>
              <span class="text-green-600 font-medium">Keys:</span> ${analysis.keys}
            </div>
            <div>
              <span class="text-green-600 font-medium">Comments:</span> ${analysis.hasComments ? 'Yes' : 'No'}
            </div>
            <div>
              <span class="text-green-600 font-medium">Arrays:</span> ${analysis.hasArrays ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-gray-50 border rounded-lg p-4">
            <h4 class="font-medium text-gray-800 mb-3">Original YAML</h4>
            <pre class="bg-white border rounded p-3 text-sm overflow-x-auto"><code class="language-yaml">${this.escapeHtml(yamlString)}</code></pre>
          </div>
          
          <div class="bg-gray-50 border rounded-lg p-4">
            <h4 class="font-medium text-gray-800 mb-3">JSON Equivalent</h4>
            <pre class="bg-white border rounded p-3 text-sm overflow-x-auto"><code class="language-json">${this.escapeHtml(jsonEquivalent)}</code></pre>
          </div>
        </div>
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}