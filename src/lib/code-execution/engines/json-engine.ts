/**
 * JSON Execution Engine for validation and formatting
 */

import { 
  ExecutionEngine, 
  CodeExecutionRequest, 
  CodeExecutionResult, 
  SupportedLanguage 
} from '../types';

export class JsonExecutionEngine implements ExecutionEngine {
  name = 'json';
  supportedLanguages: SupportedLanguage[] = ['json'];

  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const jsonString = request.code.trim();
      
      if (!jsonString) {
        return {
          success: true,
          output: 'No JSON content provided',
          executionTime: Date.now() - startTime
        };
      }

      // Parse JSON to validate syntax
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(jsonString);
      } catch (parseError) {
        return {
          success: false,
          error: this.formatJsonError(parseError, jsonString),
          executionTime: Date.now() - startTime
        };
      }

      // Format the JSON with proper indentation
      const formattedJson = JSON.stringify(parsedJson, null, 2);
      
      // Generate analysis
      const analysis = this.analyzeJson(parsedJson);
      
      // Create visual output with formatted JSON and analysis
      const visualOutput = this.createJsonVisualization(formattedJson, analysis);

      return {
        success: true,
        output: `JSON is valid!\n\nFormatted JSON:\n${formattedJson}\n\n${analysis.summary}`,
        visualOutput,
        executionTime: Date.now() - startTime,
        metadata: {
          type: analysis.type,
          size: jsonString.length,
          formattedSize: formattedJson.length,
          depth: analysis.depth,
          keys: analysis.keys,
          arrayLength: analysis.arrayLength
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown JSON processing error',
        executionTime: Date.now() - startTime
      };
    }
  }

  async validateCode(code: string): Promise<boolean> {
    try {
      const trimmed = code.trim();
      if (!trimmed) return true;
      
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for JSON processing
  }

  // Private methods

  private formatJsonError(error: any, jsonString: string): string {
    if (!(error instanceof SyntaxError)) {
      return error.message || 'JSON parsing error';
    }

    const message = error.message;
    
    // Extract position information if available
    const positionMatch = message.match(/position (\d+)/);
    if (positionMatch) {
      const position = parseInt(positionMatch[1]);
      const lines = jsonString.substring(0, position).split('\n');
      const lineNumber = lines.length;
      const columnNumber = lines[lines.length - 1].length + 1;
      
      return `JSON Syntax Error at line ${lineNumber}, column ${columnNumber}: ${message}`;
    }

    return `JSON Syntax Error: ${message}`;
  }

  private analyzeJson(json: any): {
    type: string;
    depth: number;
    keys: number;
    arrayLength?: number;
    summary: string;
  } {
    const type = Array.isArray(json) ? 'array' : typeof json;
    const depth = this.calculateDepth(json);
    
    let keys = 0;
    let arrayLength: number | undefined;
    
    if (Array.isArray(json)) {
      arrayLength = json.length;
    } else if (typeof json === 'object' && json !== null) {
      keys = Object.keys(json).length;
    }

    let summary = `JSON Analysis:\n`;
    summary += `- Type: ${type}\n`;
    summary += `- Max depth: ${depth}\n`;
    
    if (arrayLength !== undefined) {
      summary += `- Array length: ${arrayLength}\n`;
    } else if (keys > 0) {
      summary += `- Object keys: ${keys}\n`;
    }

    return { type, depth, keys, arrayLength, summary };
  }

  private calculateDepth(obj: any, currentDepth = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return currentDepth;
    }

    let maxDepth = currentDepth;
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        maxDepth = Math.max(maxDepth, this.calculateDepth(item, currentDepth + 1));
      }
    } else {
      for (const value of Object.values(obj)) {
        maxDepth = Math.max(maxDepth, this.calculateDepth(value, currentDepth + 1));
      }
    }

    return maxDepth;
  }

  private createJsonVisualization(formattedJson: string, analysis: any): string {
    return `
      <div class="json-visualization space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Valid JSON
          </h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-blue-600 font-medium">Type:</span> ${analysis.type}
            </div>
            <div>
              <span class="text-blue-600 font-medium">Depth:</span> ${analysis.depth}
            </div>
            ${analysis.arrayLength !== undefined ? 
              `<div><span class="text-blue-600 font-medium">Length:</span> ${analysis.arrayLength}</div>` : 
              `<div><span class="text-blue-600 font-medium">Keys:</span> ${analysis.keys}</div>`
            }
          </div>
        </div>
        
        <div class="bg-gray-50 border rounded-lg p-4">
          <h4 class="font-medium text-gray-800 mb-3">Formatted JSON</h4>
          <pre class="bg-white border rounded p-3 text-sm overflow-x-auto"><code class="language-json">${this.escapeHtml(formattedJson)}</code></pre>
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