/**
 * Regex Execution Engine for testing and match highlighting
 */

import { 
  ExecutionEngine, 
  CodeExecutionRequest, 
  CodeExecutionResult, 
  SupportedLanguage 
} from '../types';

export class RegexExecutionEngine implements ExecutionEngine {
  name = 'regex';
  supportedLanguages: SupportedLanguage[] = ['regex'];

  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const input = request.code.trim();
      
      if (!input) {
        return {
          success: true,
          output: 'No regex pattern provided',
          executionTime: Date.now() - startTime
        };
      }

      // Parse input - expect format: pattern|||testString|||flags (optional)
      const parts = input.split('|||');
      if (parts.length < 2) {
        return {
          success: false,
          error: 'Invalid format. Use: pattern|||testString|||flags (optional)\nExample: \\d+|||Hello 123 World|||g',
          executionTime: Date.now() - startTime
        };
      }

      const pattern = parts[0];
      const testString = parts[1];
      const flags = parts[2] || '';

      // Validate and create regex
      let regex: RegExp;
      try {
        regex = new RegExp(pattern, flags);
      } catch (regexError) {
        return {
          success: false,
          error: `Invalid regex pattern: ${regexError instanceof Error ? regexError.message : 'Unknown error'}`,
          executionTime: Date.now() - startTime
        };
      }

      // Test the regex
      const matches = this.findAllMatches(regex, testString);
      const analysis = this.analyzeRegex(pattern, testString, matches, flags);
      
      // Create visual output with highlighted matches
      const visualOutput = this.createRegexVisualization(pattern, testString, matches, analysis, flags);

      let output = `Regex Test Results:\n`;
      output += `Pattern: ${pattern}\n`;
      output += `Flags: ${flags || 'none'}\n`;
      output += `Test String: ${testString}\n`;
      output += `Matches Found: ${matches.length}\n\n`;

      if (matches.length > 0) {
        output += `Matches:\n`;
        matches.forEach((match, index) => {
          output += `${index + 1}. "${match.match}" at position ${match.index}`;
          if (match.groups && match.groups.length > 0) {
            output += ` (groups: ${match.groups.join(', ')})`;
          }
          output += '\n';
        });
      } else {
        output += 'No matches found.\n';
      }

      return {
        success: true,
        output,
        visualOutput,
        executionTime: Date.now() - startTime,
        metadata: {
          pattern,
          flags,
          matchCount: matches.length,
          testStringLength: testString.length,
          hasGroups: matches.some(m => m.groups && m.groups.length > 0)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown regex processing error',
        executionTime: Date.now() - startTime
      };
    }
  }

  async validateCode(code: string): Promise<boolean> {
    try {
      const trimmed = code.trim();
      if (!trimmed) return true;
      
      const parts = trimmed.split('|||');
      if (parts.length < 2) return false;
      
      // Try to create the regex
      new RegExp(parts[0], parts[2] || '');
      return true;
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for regex processing
  }

  // Private methods

  private findAllMatches(regex: RegExp, text: string): Array<{
    match: string;
    index: number;
    groups: string[];
  }> {
    const matches: Array<{ match: string; index: number; groups: string[] }> = [];
    
    if (regex.global) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1)
        });
        
        // Prevent infinite loop on zero-length matches
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    } else {
      const match = regex.exec(text);
      if (match) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1)
        });
      }
    }
    
    return matches;
  }

  private analyzeRegex(pattern: string, testString: string, matches: any[], flags: string): {
    patternLength: number;
    complexity: string;
    hasQuantifiers: boolean;
    hasGroups: boolean;
    hasCharacterClasses: boolean;
    summary: string;
  } {
    const patternLength = pattern.length;
    
    // Analyze pattern complexity
    const hasQuantifiers = /[*+?{]/.test(pattern);
    const hasGroups = /[()]/.test(pattern);
    const hasCharacterClasses = /[\[\]\\]/.test(pattern);
    
    let complexity = 'Simple';
    if (hasQuantifiers && hasGroups && hasCharacterClasses) {
      complexity = 'Complex';
    } else if (hasQuantifiers || hasGroups || hasCharacterClasses) {
      complexity = 'Moderate';
    }

    let summary = `Regex Analysis:\n`;
    summary += `- Pattern length: ${patternLength}\n`;
    summary += `- Complexity: ${complexity}\n`;
    summary += `- Has quantifiers: ${hasQuantifiers ? 'Yes' : 'No'}\n`;
    summary += `- Has groups: ${hasGroups ? 'Yes' : 'No'}\n`;
    summary += `- Has character classes: ${hasCharacterClasses ? 'Yes' : 'No'}\n`;
    summary += `- Matches found: ${matches.length}\n`;

    return { patternLength, complexity, hasQuantifiers, hasGroups, hasCharacterClasses, summary };
  }

  private createRegexVisualization(pattern: string, testString: string, matches: any[], analysis: any, flags: string): string {
    // Create highlighted version of test string
    let highlightedString = testString;
    
    // Sort matches by index in reverse order to avoid index shifting
    const sortedMatches = [...matches].sort((a, b) => b.index - a.index);
    
    sortedMatches.forEach((match, index) => {
      const matchIndex = match.index;
      const matchLength = match.match.length;
      const before = highlightedString.substring(0, matchIndex);
      const matchText = highlightedString.substring(matchIndex, matchIndex + matchLength);
      const after = highlightedString.substring(matchIndex + matchLength);
      
      highlightedString = before + 
        `<span class="regex-match" data-match="${sortedMatches.length - index}">${this.escapeHtml(matchText)}</span>` + 
        after;
    });

    return `
      <div class="regex-visualization space-y-4">
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 class="font-medium text-orange-800 mb-2 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            Regex Test Results
          </h4>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-orange-600 font-medium">Pattern:</span> <code class="bg-white px-1 rounded">${this.escapeHtml(pattern)}</code>
            </div>
            <div>
              <span class="text-orange-600 font-medium">Flags:</span> <code class="bg-white px-1 rounded">${flags || 'none'}</code>
            </div>
            <div>
              <span class="text-orange-600 font-medium">Matches:</span> ${matches.length}
            </div>
            <div>
              <span class="text-orange-600 font-medium">Complexity:</span> ${analysis.complexity}
            </div>
          </div>
        </div>
        
        <div class="bg-gray-50 border rounded-lg p-4">
          <h4 class="font-medium text-gray-800 mb-3">Test String with Highlighted Matches</h4>
          <div class="bg-white border rounded p-4 font-mono text-sm leading-relaxed">
            ${highlightedString || this.escapeHtml(testString)}
          </div>
          ${matches.length > 0 ? `
            <div class="mt-3 text-xs text-gray-600">
              <span class="inline-block w-4 h-4 bg-yellow-200 border border-yellow-400 rounded mr-2"></span>
              Highlighted matches (${matches.length} found)
            </div>
          ` : ''}
        </div>
        
        ${matches.length > 0 ? `
          <div class="bg-gray-50 border rounded-lg p-4">
            <h4 class="font-medium text-gray-800 mb-3">Match Details</h4>
            <div class="space-y-2">
              ${matches.map((match, index) => `
                <div class="bg-white border rounded p-3 text-sm">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium">Match ${index + 1}</span>
                    <span class="text-gray-500">Position ${match.index}</span>
                  </div>
                  <div class="font-mono bg-gray-100 px-2 py-1 rounded">
                    "${this.escapeHtml(match.match)}"
                  </div>
                  ${match.groups && match.groups.length > 0 ? `
                    <div class="mt-2">
                      <span class="text-gray-600 text-xs">Capture groups:</span>
                      <div class="flex flex-wrap gap-1 mt-1">
                        ${match.groups.map((group, groupIndex) => `
                          <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            Group ${groupIndex + 1}: "${this.escapeHtml(group)}"
                          </span>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="font-medium text-blue-800 mb-2">Pattern Analysis</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-blue-600 font-medium">Quantifiers:</span> ${analysis.hasQuantifiers ? 'Yes' : 'No'}
            </div>
            <div>
              <span class="text-blue-600 font-medium">Groups:</span> ${analysis.hasGroups ? 'Yes' : 'No'}
            </div>
            <div>
              <span class="text-blue-600 font-medium">Character Classes:</span> ${analysis.hasCharacterClasses ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
      
      <style>
        .regex-match {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 0.25rem;
          padding: 0.125rem 0.25rem;
          position: relative;
        }
        .regex-match:hover {
          background-color: #fde68a;
          border-color: #d97706;
        }
        .regex-match::after {
          content: attr(data-match);
          position: absolute;
          top: -1.5rem;
          left: 50%;
          transform: translateX(-50%);
          background: #374151;
          color: white;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        .regex-match:hover::after {
          opacity: 1;
        }
      </style>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}