/**
 * Malicious Code Detector
 * Advanced pattern matching and heuristic analysis for detecting potentially harmful code
 */

export interface DetectionResult {
  isMalicious: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  violations: CodeViolation[];
  score: number; // 0-100, higher is more suspicious
}

export interface CodeViolation {
  type: 'pattern' | 'heuristic' | 'entropy' | 'obfuscation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  line?: number;
  column?: number;
  evidence: string;
  suggestion?: string;
}

export class MaliciousCodeDetector {
  private static instance: MaliciousCodeDetector;
  
  // Malicious patterns by category
  private readonly patterns = {
    // Code injection patterns
    injection: [
      { pattern: /eval\s*\(/gi, severity: 'critical' as const, message: 'Code injection via eval()' },
      { pattern: /Function\s*\(/gi, severity: 'critical' as const, message: 'Dynamic function creation' },
      { pattern: /setTimeout\s*\(\s*["'`][^"'`]*["'`]/gi, severity: 'high' as const, message: 'String-based setTimeout' },
      { pattern: /setInterval\s*\(\s*["'`][^"'`]*["'`]/gi, severity: 'high' as const, message: 'String-based setInterval' },
      { pattern: /new\s+Function\s*\(/gi, severity: 'critical' as const, message: 'Dynamic function constructor' },
      { pattern: /\[\s*["'`]constructor["'`]\s*\]/gi, severity: 'high' as const, message: 'Constructor access via bracket notation' }
    ],

    // Network/External access patterns
    network: [
      { pattern: /XMLHttpRequest/gi, severity: 'high' as const, message: 'XMLHttpRequest usage' },
      { pattern: /fetch\s*\(/gi, severity: 'high' as const, message: 'Fetch API usage' },
      { pattern: /WebSocket/gi, severity: 'high' as const, message: 'WebSocket connection' },
      { pattern: /EventSource/gi, severity: 'medium' as const, message: 'Server-sent events' },
      { pattern: /navigator\.sendBeacon/gi, severity: 'medium' as const, message: 'Beacon API usage' },
      { pattern: /import\s*\(/gi, severity: 'high' as const, message: 'Dynamic import' },
      { pattern: /require\s*\(/gi, severity: 'high' as const, message: 'CommonJS require' }
    ],

    // Storage/Privacy patterns
    storage: [
      { pattern: /localStorage/gi, severity: 'medium' as const, message: 'Local storage access' },
      { pattern: /sessionStorage/gi, severity: 'medium' as const, message: 'Session storage access' },
      { pattern: /document\.cookie/gi, severity: 'high' as const, message: 'Cookie manipulation' },
      { pattern: /indexedDB/gi, severity: 'medium' as const, message: 'IndexedDB access' },
      { pattern: /webkitStorageInfo/gi, severity: 'medium' as const, message: 'Storage info access' },
      { pattern: /navigator\.geolocation/gi, severity: 'high' as const, message: 'Geolocation access' }
    ],

    // DOM manipulation patterns
    dom: [
      { pattern: /document\.write/gi, severity: 'high' as const, message: 'Document.write usage' },
      { pattern: /innerHTML\s*=/gi, severity: 'medium' as const, message: 'innerHTML assignment' },
      { pattern: /outerHTML\s*=/gi, severity: 'medium' as const, message: 'outerHTML assignment' },
      { pattern: /insertAdjacentHTML/gi, severity: 'medium' as const, message: 'insertAdjacentHTML usage' },
      { pattern: /createContextualFragment/gi, severity: 'medium' as const, message: 'Contextual fragment creation' }
    ],

    // Navigation/Redirection patterns
    navigation: [
      { pattern: /window\.location\s*=/gi, severity: 'high' as const, message: 'Window location change' },
      { pattern: /location\.href\s*=/gi, severity: 'high' as const, message: 'Location href change' },
      { pattern: /location\.replace/gi, severity: 'high' as const, message: 'Location replace' },
      { pattern: /location\.assign/gi, severity: 'high' as const, message: 'Location assign' },
      { pattern: /history\.pushState/gi, severity: 'medium' as const, message: 'History manipulation' },
      { pattern: /history\.replaceState/gi, severity: 'medium' as const, message: 'History replacement' }
    ],

    // Frame/Window access patterns
    frames: [
      { pattern: /window\.parent/gi, severity: 'high' as const, message: 'Parent window access' },
      { pattern: /window\.top/gi, severity: 'high' as const, message: 'Top window access' },
      { pattern: /window\.opener/gi, severity: 'high' as const, message: 'Opener window access' },
      { pattern: /frames\[/gi, severity: 'high' as const, message: 'Frame access' },
      { pattern: /contentWindow/gi, severity: 'medium' as const, message: 'Content window access' }
    ],

    // Protocol handlers
    protocols: [
      { pattern: /javascript:/gi, severity: 'critical' as const, message: 'JavaScript protocol handler' },
      { pattern: /data:text\/html/gi, severity: 'high' as const, message: 'Data URL with HTML' },
      { pattern: /vbscript:/gi, severity: 'critical' as const, message: 'VBScript protocol handler' }
    ],

    // Obfuscation patterns
    obfuscation: [
      { pattern: /\\x[0-9a-f]{2}/gi, severity: 'medium' as const, message: 'Hex-encoded strings' },
      { pattern: /\\u[0-9a-f]{4}/gi, severity: 'medium' as const, message: 'Unicode-encoded strings' },
      { pattern: /String\.fromCharCode/gi, severity: 'medium' as const, message: 'Character code conversion' },
      { pattern: /atob\s*\(/gi, severity: 'medium' as const, message: 'Base64 decoding' },
      { pattern: /btoa\s*\(/gi, severity: 'low' as const, message: 'Base64 encoding' },
      { pattern: /unescape\s*\(/gi, severity: 'medium' as const, message: 'URL unescape' },
      { pattern: /decodeURIComponent\s*\(/gi, severity: 'low' as const, message: 'URI component decoding' }
    ],

    // Python-specific patterns
    python: [
      { pattern: /import\s+os/gi, severity: 'critical' as const, message: 'OS module import' },
      { pattern: /import\s+sys/gi, severity: 'high' as const, message: 'System module import' },
      { pattern: /import\s+subprocess/gi, severity: 'critical' as const, message: 'Subprocess module import' },
      { pattern: /import\s+socket/gi, severity: 'high' as const, message: 'Socket module import' },
      { pattern: /exec\s*\(/gi, severity: 'critical' as const, message: 'Dynamic code execution' },
      { pattern: /compile\s*\(/gi, severity: 'high' as const, message: 'Code compilation' },
      { pattern: /__import__\s*\(/gi, severity: 'high' as const, message: 'Dynamic import' },
      { pattern: /open\s*\(/gi, severity: 'high' as const, message: 'File operations' },
      { pattern: /input\s*\(/gi, severity: 'medium' as const, message: 'User input' }
    ],

    // SQL-specific patterns
    sql: [
      { pattern: /ATTACH\s+DATABASE/gi, severity: 'critical' as const, message: 'Database attachment' },
      { pattern: /PRAGMA/gi, severity: 'high' as const, message: 'Pragma statements' },
      { pattern: /LOAD_EXTENSION/gi, severity: 'critical' as const, message: 'Extension loading' },
      { pattern: /\.load/gi, severity: 'high' as const, message: 'SQLite load command' },
      { pattern: /\.shell/gi, severity: 'critical' as const, message: 'Shell command execution' },
      { pattern: /\.system/gi, severity: 'critical' as const, message: 'System command execution' }
    ]
  };

  private constructor() {}

  public static getInstance(): MaliciousCodeDetector {
    if (!MaliciousCodeDetector.instance) {
      MaliciousCodeDetector.instance = new MaliciousCodeDetector();
    }
    return MaliciousCodeDetector.instance;
  }

  /**
   * Analyze code for malicious patterns
   */
  public analyzeCode(code: string, language: string = 'javascript'): DetectionResult {
    const violations: CodeViolation[] = [];
    let totalScore = 0;

    // Pattern-based detection
    const patternViolations = this.detectPatterns(code, language);
    violations.push(...patternViolations);
    totalScore += patternViolations.reduce((sum, v) => sum + this.getViolationScore(v), 0);

    // Heuristic analysis
    const heuristicViolations = this.performHeuristicAnalysis(code, language);
    violations.push(...heuristicViolations);
    totalScore += heuristicViolations.reduce((sum, v) => sum + this.getViolationScore(v), 0);

    // Entropy analysis (detect obfuscation)
    const entropyViolations = this.analyzeEntropy(code);
    violations.push(...entropyViolations);
    totalScore += entropyViolations.reduce((sum, v) => sum + this.getViolationScore(v), 0);

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(totalScore, violations);
    const isMalicious = riskLevel === 'high' || riskLevel === 'critical';

    return {
      isMalicious,
      riskLevel,
      violations,
      score: Math.min(totalScore, 100)
    };
  }

  private detectPatterns(code: string, language: string): CodeViolation[] {
    const violations: CodeViolation[] = [];
    const lines = code.split('\n');

    // Get relevant pattern categories for the language
    const categories = this.getRelevantCategories(language);

    for (const category of categories) {
      const patterns = this.patterns[category as keyof typeof this.patterns] || [];
      
      for (const { pattern, severity, message } of patterns) {
        const matches = code.matchAll(pattern);
        
        for (const match of matches) {
          const lineNumber = this.getLineNumber(code, match.index || 0);
          const evidence = match[0];
          
          violations.push({
            type: 'pattern',
            severity,
            message,
            line: lineNumber,
            evidence,
            suggestion: this.getSuggestion(category, evidence)
          });
        }
      }
    }

    return violations;
  }

  private performHeuristicAnalysis(code: string, language: string): CodeViolation[] {
    const violations: CodeViolation[] = [];

    // Check for excessive string concatenation (potential obfuscation)
    const concatenationCount = (code.match(/\+\s*["'`]/g) || []).length;
    if (concatenationCount > 10) {
      violations.push({
        type: 'heuristic',
        severity: 'medium',
        message: 'Excessive string concatenation detected',
        evidence: `${concatenationCount} concatenations found`,
        suggestion: 'Use template literals or direct strings instead'
      });
    }

    // Check for deeply nested structures (potential complexity attack)
    const maxNesting = this.calculateMaxNesting(code);
    if (maxNesting > 15) {
      violations.push({
        type: 'heuristic',
        severity: 'medium',
        message: 'Excessive code nesting detected',
        evidence: `Maximum nesting level: ${maxNesting}`,
        suggestion: 'Refactor code to reduce nesting complexity'
      });
    }

    // Check for very long lines (potential obfuscation)
    const lines = code.split('\n');
    const longLines = lines.filter(line => line.length > 500);
    if (longLines.length > 0) {
      violations.push({
        type: 'heuristic',
        severity: 'medium',
        message: 'Extremely long code lines detected',
        evidence: `${longLines.length} lines over 500 characters`,
        suggestion: 'Break long lines into smaller, readable chunks'
      });
    }

    // Check for suspicious variable names
    const suspiciousNames = code.match(/\b[a-z]{1,2}\d*\b/g) || [];
    if (suspiciousNames.length > code.length / 100) {
      violations.push({
        type: 'heuristic',
        severity: 'low',
        message: 'Many short/cryptic variable names detected',
        evidence: `${suspiciousNames.length} suspicious names`,
        suggestion: 'Use descriptive variable names'
      });
    }

    return violations;
  }

  private analyzeEntropy(code: string): CodeViolation[] {
    const violations: CodeViolation[] = [];

    // Calculate Shannon entropy
    const entropy = this.calculateEntropy(code);
    
    // High entropy might indicate obfuscation
    if (entropy > 4.5) {
      violations.push({
        type: 'entropy',
        severity: 'medium',
        message: 'High entropy detected (possible obfuscation)',
        evidence: `Entropy: ${entropy.toFixed(2)}`,
        suggestion: 'Code appears to be obfuscated or compressed'
      });
    }

    // Check for base64-like strings
    const base64Pattern = /[A-Za-z0-9+/]{20,}={0,2}/g;
    const base64Matches = code.match(base64Pattern) || [];
    if (base64Matches.length > 0) {
      violations.push({
        type: 'obfuscation',
        severity: 'medium',
        message: 'Base64-encoded strings detected',
        evidence: `${base64Matches.length} potential base64 strings`,
        suggestion: 'Verify the purpose of encoded strings'
      });
    }

    return violations;
  }

  private getRelevantCategories(language: string): string[] {
    const categoryMap: Record<string, string[]> = {
      javascript: ['injection', 'network', 'storage', 'dom', 'navigation', 'frames', 'protocols', 'obfuscation'],
      typescript: ['injection', 'network', 'storage', 'dom', 'navigation', 'frames', 'protocols', 'obfuscation'],
      html: ['dom', 'protocols', 'frames'],
      css: ['protocols'],
      python: ['python', 'obfuscation'],
      sql: ['sql']
    };

    return categoryMap[language] || ['injection', 'obfuscation'];
  }

  private calculateRiskLevel(score: number, violations: CodeViolation[]): 'low' | 'medium' | 'high' | 'critical' {
    const hasCritical = violations.some(v => v.severity === 'critical');
    const hasHigh = violations.some(v => v.severity === 'high');

    if (hasCritical || score > 80) return 'critical';
    if (hasHigh || score > 60) return 'high';
    if (score > 30) return 'medium';
    return 'low';
  }

  private getViolationScore(violation: CodeViolation): number {
    const scores = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 3
    };
    return scores[violation.severity];
  }

  private calculateEntropy(str: string): number {
    const freq: Record<string, number> = {};
    
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }
    
    let entropy = 0;
    const len = str.length;
    
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }
    
    return entropy;
  }

  private calculateMaxNesting(code: string): number {
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const char of code) {
      if (char === '{' || char === '(' || char === '[') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}' || char === ')' || char === ']') {
        currentNesting--;
      }
    }
    
    return maxNesting;
  }

  private getLineNumber(code: string, index: number): number {
    return code.substring(0, index).split('\n').length;
  }

  private getSuggestion(category: string, evidence: string): string {
    const suggestions: Record<string, string> = {
      injection: 'Avoid dynamic code execution. Use safer alternatives.',
      network: 'Network requests are not allowed in this environment.',
      storage: 'Storage access is restricted for security reasons.',
      dom: 'Use safer DOM manipulation methods.',
      navigation: 'Page navigation is not allowed in sandboxed environment.',
      frames: 'Frame access is restricted for security.',
      protocols: 'Dangerous protocol handlers are not allowed.',
      obfuscation: 'Use clear, readable code instead of obfuscated patterns.',
      python: 'This Python module/function is restricted for security.',
      sql: 'This SQL operation is not allowed for security reasons.'
    };
    
    return suggestions[category] || 'This pattern may pose security risks.';
  }
}

// Export singleton instance
export const maliciousCodeDetector = MaliciousCodeDetector.getInstance();