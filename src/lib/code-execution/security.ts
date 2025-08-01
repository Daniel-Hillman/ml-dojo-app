/**
 * Security Manager for Code Execution System
 * Implements comprehensive sandboxing and security measures
 */

import { SupportedLanguage } from './types';

export interface SecurityPolicy {
  allowedDomains: string[];
  blockedPatterns: RegExp[];
  maxExecutionTime: number;
  maxMemoryUsage: number;
  allowNetworkAccess: boolean;
  allowFileAccess: boolean;
  allowLocalStorage: boolean;
  cspDirectives: string[];
}

export interface SecurityViolation {
  type: 'malicious_code' | 'resource_limit' | 'network_access' | 'file_access' | 'execution_timeout';
  message: string;
  code?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class SecurityManager {
  private static instance: SecurityManager;
  private policies: Map<SupportedLanguage, SecurityPolicy> = new Map();
  private violations: SecurityViolation[] = [];

  private constructor() {
    this.initializePolicies();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  private initializePolicies(): void {
    // JavaScript/TypeScript Security Policy
    this.policies.set('javascript', {
      allowedDomains: [],
      blockedPatterns: [
        /eval\s*\(/gi,
        /Function\s*\(/gi,
        /setTimeout\s*\(/gi,
        /setInterval\s*\(/gi,
        /XMLHttpRequest/gi,
        /fetch\s*\(/gi,
        /import\s*\(/gi,
        /require\s*\(/gi,
        /process\./gi,
        /global\./gi,
        /window\.location/gi,
        /document\.cookie/gi,
        /localStorage/gi,
        /sessionStorage/gi,
        /indexedDB/gi,
        /webkitStorageInfo/gi,
        /navigator\.geolocation/gi,
        /navigator\.camera/gi,
        /navigator\.microphone/gi
      ],
      maxExecutionTime: 10000, // 10 seconds
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      allowNetworkAccess: false,
      allowFileAccess: false,
      allowLocalStorage: false,
      cspDirectives: [
        "default-src 'none'",
        "script-src 'unsafe-inline' 'unsafe-eval'",
        "style-src 'unsafe-inline'",
        "connect-src 'none'",
        "img-src data: blob:",
        "font-src 'none'",
        "object-src 'none'",
        "media-src 'none'",
        "frame-src 'none'"
      ]
    });

    // TypeScript uses same policy as JavaScript
    this.policies.set('typescript', this.policies.get('javascript')!);

    // HTML Security Policy
    this.policies.set('html', {
      allowedDomains: [],
      blockedPatterns: [
        /<script[^>]*>/gi,
        /<iframe[^>]*>/gi,
        /<object[^>]*>/gi,
        /<embed[^>]*>/gi,
        /<link[^>]*rel=["']?import["']?[^>]*>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /data:text\/html/gi,
        /on\w+\s*=/gi, // Event handlers
        /<form[^>]*action\s*=/gi,
        /<meta[^>]*http-equiv\s*=\s*["']?refresh["']?/gi
      ],
      maxExecutionTime: 5000,
      maxMemoryUsage: 25 * 1024 * 1024,
      allowNetworkAccess: false,
      allowFileAccess: false,
      allowLocalStorage: false,
      cspDirectives: [
        "default-src 'none'",
        "style-src 'unsafe-inline'",
        "img-src data: blob:",
        "font-src 'none'",
        "script-src 'none'",
        "connect-src 'none'",
        "object-src 'none'",
        "media-src 'none'",
        "frame-src 'none'"
      ]
    });

    // CSS Security Policy
    this.policies.set('css', {
      allowedDomains: [],
      blockedPatterns: [
        /javascript:/gi,
        /vbscript:/gi,
        /expression\s*\(/gi,
        /behavior\s*:/gi,
        /@import\s+url\s*\(/gi,
        /url\s*\(\s*["']?javascript:/gi,
        /url\s*\(\s*["']?data:text\/html/gi,
        /binding\s*:/gi
      ],
      maxExecutionTime: 5000,
      maxMemoryUsage: 25 * 1024 * 1024,
      allowNetworkAccess: false,
      allowFileAccess: false,
      allowLocalStorage: false,
      cspDirectives: [
        "default-src 'none'",
        "style-src 'unsafe-inline'",
        "img-src data:",
        "font-src 'none'"
      ]
    });

    // Python Security Policy
    this.policies.set('python', {
      allowedDomains: [],
      blockedPatterns: [
        /import\s+os/gi,
        /import\s+sys/gi,
        /import\s+subprocess/gi,
        /import\s+socket/gi,
        /import\s+urllib/gi,
        /import\s+requests/gi,
        /from\s+os\s+import/gi,
        /from\s+sys\s+import/gi,
        /from\s+subprocess\s+import/gi,
        /exec\s*\(/gi,
        /eval\s*\(/gi,
        /compile\s*\(/gi,
        /__import__\s*\(/gi,
        /open\s*\(/gi,
        /file\s*\(/gi,
        /input\s*\(/gi,
        /raw_input\s*\(/gi
      ],
      maxExecutionTime: 30000, // 30 seconds
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      allowNetworkAccess: false,
      allowFileAccess: false,
      allowLocalStorage: false,
      cspDirectives: [
        "default-src 'none'",
        "script-src 'unsafe-inline' 'unsafe-eval'",
        "connect-src 'none'"
      ]
    });

    // SQL Security Policy
    this.policies.set('sql', {
      allowedDomains: [],
      blockedPatterns: [
        /ATTACH\s+DATABASE/gi,
        /PRAGMA/gi,
        /LOAD_EXTENSION/gi,
        /\.load/gi,
        /\.shell/gi,
        /\.system/gi,
        /\.import/gi,
        /\.output/gi,
        /VACUUM/gi,
        /REINDEX/gi
      ],
      maxExecutionTime: 15000,
      maxMemoryUsage: 50 * 1024 * 1024,
      allowNetworkAccess: false,
      allowFileAccess: false,
      allowLocalStorage: false,
      cspDirectives: [
        "default-src 'none'"
      ]
    });

    // Set default policies for other languages
    const defaultPolicy: SecurityPolicy = {
      allowedDomains: [],
      blockedPatterns: [],
      maxExecutionTime: 10000,
      maxMemoryUsage: 25 * 1024 * 1024,
      allowNetworkAccess: false,
      allowFileAccess: false,
      allowLocalStorage: false,
      cspDirectives: [
        "default-src 'none'",
        "script-src 'unsafe-inline'"
      ]
    };

    ['json', 'yaml', 'markdown', 'regex', 'bash'].forEach(lang => {
      this.policies.set(lang as SupportedLanguage, { ...defaultPolicy });
    });
  }

  /**
   * Validate code against security policies
   */
  public validateCode(code: string, language: SupportedLanguage): SecurityViolation[] {
    const policy = this.policies.get(language);
    if (!policy) {
      return [{
        type: 'malicious_code',
        message: `No security policy defined for language: ${language}`,
        severity: 'medium'
      }];
    }

    const violations: SecurityViolation[] = [];

    // Check for blocked patterns
    for (const pattern of policy.blockedPatterns) {
      if (pattern.test(code)) {
        violations.push({
          type: 'malicious_code',
          message: `Potentially dangerous code pattern detected: ${pattern.source}`,
          code: code.match(pattern)?.[0],
          severity: this.getSeverityForPattern(pattern)
        });
      }
    }

    // Check code length (basic DoS prevention)
    if (code.length > 100000) { // 100KB limit
      violations.push({
        type: 'resource_limit',
        message: 'Code exceeds maximum length limit',
        severity: 'medium'
      });
    }

    // Check for excessive nesting (potential stack overflow)
    const nestingLevel = this.calculateNestingLevel(code);
    if (nestingLevel > 20) {
      violations.push({
        type: 'resource_limit',
        message: 'Code has excessive nesting depth',
        severity: 'medium'
      });
    }

    // Store violations for monitoring
    this.violations.push(...violations);

    return violations;
  }

  /**
   * Generate CSP header for iframe
   */
  public generateCSPHeader(language: SupportedLanguage): string {
    const policy = this.policies.get(language);
    if (!policy) {
      return "default-src 'none'";
    }
    return policy.cspDirectives.join('; ');
  }

  /**
   * Get security policy for language
   */
  public getPolicy(language: SupportedLanguage): SecurityPolicy | undefined {
    return this.policies.get(language);
  }

  /**
   * Create secure iframe with CSP
   */
  public createSecureIframe(language: SupportedLanguage): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    const csp = this.generateCSPHeader(language);
    
    // Set security attributes
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.setAttribute('csp', csp);
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    
    // Add additional security headers via srcdoc
    const securityHeaders = `
      <meta http-equiv="Content-Security-Policy" content="${csp}">
      <meta http-equiv="X-Frame-Options" content="DENY">
      <meta http-equiv="X-Content-Type-Options" content="nosniff">
      <meta http-equiv="Referrer-Policy" content="no-referrer">
    `;
    
    iframe.srcdoc = `<!DOCTYPE html>
      <html>
        <head>
          ${securityHeaders}
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .error { color: red; background: #ffe6e6; padding: 10px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div id="output"></div>
          <div id="error" class="error" style="display: none;"></div>
        </body>
      </html>`;
    
    return iframe;
  }

  /**
   * Monitor resource usage
   */
  public monitorResourceUsage(startTime: number, language: SupportedLanguage): SecurityViolation[] {
    const policy = this.policies.get(language);
    if (!policy) return [];

    const violations: SecurityViolation[] = [];
    const executionTime = Date.now() - startTime;

    if (executionTime > policy.maxExecutionTime) {
      violations.push({
        type: 'execution_timeout',
        message: `Execution exceeded time limit: ${executionTime}ms > ${policy.maxExecutionTime}ms`,
        severity: 'high'
      });
    }

    // Memory usage monitoring (if available)
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo.usedJSHeapSize > policy.maxMemoryUsage) {
        violations.push({
          type: 'resource_limit',
          message: `Memory usage exceeded limit: ${memoryInfo.usedJSHeapSize} > ${policy.maxMemoryUsage}`,
          severity: 'high'
        });
      }
    }

    return violations;
  }

  /**
   * Get security violations history
   */
  public getViolations(): SecurityViolation[] {
    return [...this.violations];
  }

  /**
   * Clear violations history
   */
  public clearViolations(): void {
    this.violations = [];
  }

  // Private helper methods

  private getSeverityForPattern(pattern: RegExp): SecurityViolation['severity'] {
    const criticalPatterns = [/eval\s*\(/gi, /Function\s*\(/gi, /exec\s*\(/gi];
    const highPatterns = [/XMLHttpRequest/gi, /fetch\s*\(/gi, /import\s*\(/gi];
    
    if (criticalPatterns.some(p => p.source === pattern.source)) {
      return 'critical';
    }
    if (highPatterns.some(p => p.source === pattern.source)) {
      return 'high';
    }
    return 'medium';
  }

  private calculateNestingLevel(code: string): number {
    let maxLevel = 0;
    let currentLevel = 0;
    
    for (const char of code) {
      if (char === '{' || char === '(' || char === '[') {
        currentLevel++;
        maxLevel = Math.max(maxLevel, currentLevel);
      } else if (char === '}' || char === ')' || char === ']') {
        currentLevel--;
      }
    }
    
    return maxLevel;
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();