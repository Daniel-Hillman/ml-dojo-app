/**
 * Web Execution Engine for HTML, CSS, and JavaScript
 * Provides sandboxed iframe execution with live preview
 */

import { 
  ExecutionEngine, 
  CodeExecutionRequest, 
  CodeExecutionResult, 
  SupportedLanguage 
} from '../types';
import { sanitizeOutput } from '../utils';
import { securityManager, SecurityViolation } from '../security';

export class WebExecutionEngine implements ExecutionEngine {
  name = 'web';
  supportedLanguages: SupportedLanguage[] = ['html', 'css', 'javascript', 'typescript'];
  
  private activeIframes: Map<string, HTMLIFrameElement> = new Map();
  private consoleOutputs: Map<string, string[]> = new Map();

  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    const executionId = this.generateExecutionId();
    
    try {
      // Security validation
      const violations = securityManager.validateCode(request.code, request.language);
      const criticalViolations = violations.filter(v => v.severity === 'critical');
      
      if (criticalViolations.length > 0) {
        return {
          success: false,
          error: `Security violation: ${criticalViolations[0].message}`,
          executionTime: Date.now() - startTime,
          metadata: {
            securityViolations: violations
          }
        };
      }
      
      // Clean up any existing iframe for this session
      if (request.sessionId) {
        this.cleanup(request.sessionId);
      }
      
      let result: CodeExecutionResult;
      
      switch (request.language) {
        case 'html':
          result = await this.executeHTML(request, executionId);
          break;
        case 'css':
          result = await this.executeCSS(request, executionId);
          break;
        case 'javascript':
        case 'typescript':
          result = await this.executeJavaScript(request, executionId);
          break;
        default:
          throw new Error(`Unsupported language: ${request.language}`);
      }
      
      // Monitor resource usage
      const resourceViolations = securityManager.monitorResourceUsage(startTime, request.language);
      if (resourceViolations.length > 0) {
        result.metadata = {
          ...result.metadata,
          securityViolations: [...(violations || []), ...resourceViolations]
        };
      }
      
      result.executionTime = Date.now() - startTime;
      return result;
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        executionTime: Date.now() - startTime
      };
    }
  }

  async validateCode(code: string): Promise<boolean> {
    // Comprehensive validation - check for potentially dangerous patterns
    const dangerousPatterns = [
      // Code execution
      /eval\s*\(/i,
      /function\s*constructor/i,
      /new\s+function/i,
      /settimeout\s*\(\s*["'`][^"'`]*["'`]/i, // setTimeout with string
      /setinterval\s*\(\s*["'`][^"'`]*["'`]/i, // setInterval with string
      
      // DOM manipulation that could be dangerous
      /document\.write/i,
      /document\.writeln/i,
      /\.innerhtml\s*=.*<script/i,
      
      // Navigation and location
      /window\.location\s*=/i,
      /location\.href\s*=/i,
      /location\.replace/i,
      /location\.assign/i,
      /history\.pushstate/i,
      /history\.replacestate/i,
      
      // External resources
      /<script[^>]*src\s*=/i, // External scripts
      /<link[^>]*href\s*=\s*["']?https?:/i, // External stylesheets
      /<iframe[^>]*src\s*=/i, // External iframes
      /<object[^>]*data\s*=/i, // External objects
      /<embed[^>]*src\s*=/i, // External embeds
      
      // Network requests
      /fetch\s*\(/i,
      /xmlhttprequest/i,
      /websocket/i,
      /eventsource/i,
      /navigator\.sendbeacon/i,
      
      // Storage access
      /localstorage/i,
      /sessionstorage/i,
      /indexeddb/i,
      /websql/i,
      
      // File system access
      /filereader/i,
      /filewriter/i,
      /\.createobjecturl/i,
      
      // Crypto and sensitive APIs
      /crypto\.subtle/i,
      /navigator\.geolocation/i,
      /navigator\.camera/i,
      /navigator\.microphone/i,
      
      // Worker creation
      /new\s+worker/i,
      /new\s+sharedworker/i,
      /new\s+serviceworker/i,
      
      // Import/require (could load external modules)
      /import\s*\(/i,
      /require\s*\(/i,
      
      // Potentially dangerous global access
      /window\.parent/i,
      /window\.top/i,
      /window\.opener/i,
      /frames\[/i,
      
      // Protocol handlers
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i
    ];
    
    // Check for dangerous patterns
    const hasDangerousPattern = dangerousPatterns.some(pattern => pattern.test(code));
    
    if (hasDangerousPattern) {
      return false;
    }
    
    // Additional validation for HTML content
    if (code.includes('<') && code.includes('>')) {
      // Check for dangerous HTML patterns
      const dangerousHtmlPatterns = [
        /<script[^>]*>[\s\S]*?<\/script>/i,
        /<iframe[^>]*>/i,
        /<object[^>]*>/i,
        /<embed[^>]*>/i,
        /<applet[^>]*>/i,
        /<form[^>]*action\s*=\s*["']?https?:/i, // External form actions
        /on\w+\s*=\s*["'][^"']*["']/i // Inline event handlers (partially allowed)
      ];
      
      // For HTML, we're more lenient with inline event handlers but strict with external resources
      const hasExternalResources = dangerousHtmlPatterns.slice(0, 5).some(pattern => pattern.test(code));
      if (hasExternalResources) {
        return false;
      }
    }
    
    return true;
  }

  cleanup(sessionId?: string): void {
    if (sessionId) {
      const iframe = this.activeIframes.get(sessionId);
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      this.activeIframes.delete(sessionId);
      this.consoleOutputs.delete(sessionId);
    } else {
      // Clean up all iframes
      this.activeIframes.forEach((iframe, id) => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      });
      this.activeIframes.clear();
      this.consoleOutputs.clear();
    }
  }

  private async executeHTML(request: CodeExecutionRequest, executionId: string): Promise<CodeExecutionResult> {
    const iframe = this.createSandboxedIframe(executionId);
    const consoleOutput: string[] = [];
    
    // Create complete HTML document if not already complete
    let htmlContent = request.code.trim();
    const isCompleteDocument = htmlContent.toLowerCase().includes('<!doctype') || htmlContent.toLowerCase().includes('<html');
    
    if (!isCompleteDocument) {
      // Wrap partial HTML in a complete document with enhanced features
      htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Live Preview</title>
    <style>
        /* Dark mode theme to match the application */
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            background-color: #0f172a;
            color: #e2e8f0;
        }
        
        /* Enhanced default styles for dark mode preview */
        h1, h2, h3, h4, h5, h6 { 
            color: #f1f5f9; 
            margin-top: 0; 
        }
        
        button { 
            padding: 8px 16px; 
            border: 1px solid #475569; 
            border-radius: 4px; 
            background: #1e293b; 
            color: #e2e8f0;
            cursor: pointer;
            transition: all 0.2s;
        }
        button:hover { 
            background: #334155; 
            border-color: #64748b;
        }
        
        input, textarea, select { 
            padding: 8px; 
            border: 1px solid #475569; 
            border-radius: 4px; 
            font-family: inherit;
            background: #1e293b;
            color: #e2e8f0;
        }
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        
        table { 
            border-collapse: collapse; 
            width: 100%; 
            border: 1px solid #475569;
        }
        th, td { 
            padding: 8px; 
            text-align: left; 
            border-bottom: 1px solid #475569; 
        }
        th { 
            background-color: #1e293b; 
            font-weight: 600; 
            color: #f1f5f9;
        }
        
        .interactive-demo { 
            padding: 15px; 
            background: #1e293b; 
            border-radius: 6px; 
            margin: 10px 0;
            border-left: 4px solid #3b82f6;
        }
        
        /* Links */
        a {
            color: #60a5fa;
            text-decoration: none;
        }
        a:hover {
            color: #93c5fd;
            text-decoration: underline;
        }
        
        /* Code elements */
        code {
            background: #1e293b;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'JetBrains Mono', 'Consolas', monospace;
            color: #f1f5f9;
        }
        
        pre {
            background: #1e293b;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            border: 1px solid #475569;
        }
        
        /* Form elements */
        label {
            color: #f1f5f9;
            font-weight: 500;
        }
        
        /* Lists */
        ul, ol {
            color: #e2e8f0;
        }
        
        /* Blockquotes */
        blockquote {
            border-left: 4px solid #475569;
            padding-left: 16px;
            margin-left: 0;
            color: #cbd5e1;
            font-style: italic;
        }
    </style>
</head>
<body>
    ${htmlContent}
    
    <script>
        // Enhanced console capture for HTML with embedded scripts
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        // Store console output for parent to access
        window.consoleOutput = [];
        
        function captureConsole(message, type = 'log') {
            window.consoleOutput.push(type + ': ' + message);
        }
        
        console.log = function(...args) {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            captureConsole(message, 'log');
            originalLog.apply(console, args);
        };
        
        console.error = function(...args) {
            const message = args.map(arg => String(arg)).join(' ');
            captureConsole(message, 'error');
            originalError.apply(console, args);
        };
        
        console.warn = function(...args) {
            const message = args.map(arg => String(arg)).join(' ');
            captureConsole(message, 'warn');
            originalWarn.apply(console, args);
        };
        
        // Global error handler
        window.addEventListener('error', function(event) {
            captureConsole('Runtime Error: ' + event.message + ' at line ' + event.lineno, 'error');
        });
        
        // Add click tracking for interactive elements
        document.addEventListener('click', function(event) {
            if (event.target.tagName === 'BUTTON' || event.target.onclick) {
                console.log('Interactive element clicked: ' + event.target.tagName);
            }
        });
        
        // Form submission tracking
        document.addEventListener('submit', function(event) {
            console.log('Form submitted');
            event.preventDefault(); // Prevent actual form submission in sandbox
            return false;
        });
    </script>
</body>
</html>`;
    } else {
      // For complete documents, inject console capture script
      const scriptInjection = `
    <script>
        window.consoleOutput = [];
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        function captureConsole(message, type = 'log') {
            window.consoleOutput.push(type + ': ' + message);
        }
        
        console.log = function(...args) {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            captureConsole(message, 'log');
            originalLog.apply(console, args);
        };
        
        console.error = function(...args) {
            const message = args.map(arg => String(arg)).join(' ');
            captureConsole(message, 'error');
            originalError.apply(console, args);
        };
        
        console.warn = function(...args) {
            const message = args.map(arg => String(arg)).join(' ');
            captureConsole(message, 'warn');
            originalWarn.apply(console, args);
        };
        
        window.addEventListener('error', function(event) {
            captureConsole('Runtime Error: ' + event.message, 'error');
        });
    </script>
</body>`;
      
      // Inject before closing body tag
      htmlContent = htmlContent.replace('</body>', scriptInjection);
    }
    
    // Inject the HTML content
    await this.injectContent(iframe, htmlContent);
    
    // Wait for rendering and script execution
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Capture console output from iframe
    try {
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow && iframeWindow.consoleOutput) {
        consoleOutput.push(...iframeWindow.consoleOutput);
      }
    } catch (error) {
      console.warn('Failed to capture HTML console output:', error);
    }
    
    // Store iframe reference
    if (request.sessionId) {
      this.activeIframes.set(request.sessionId, iframe);
      this.consoleOutputs.set(request.sessionId, consoleOutput);
    }
    
    // Detect interactivity
    const hasInteractivity = htmlContent.includes('<script') || 
                           htmlContent.includes('onclick') || 
                           htmlContent.includes('<button') ||
                           htmlContent.includes('<form') ||
                           htmlContent.includes('addEventListener');
    
    return {
      success: true,
      output: consoleOutput.join('\n') || 'HTML rendered successfully',
      visualOutput: this.getIframeHTML(iframe),
      metadata: {
        iframeId: executionId,
        hasInteractivity,
        isCompleteDocument,
        hasConsoleOutput: consoleOutput.length > 0
      }
    };
  }

  private async executeCSS(request: CodeExecutionRequest, executionId: string): Promise<CodeExecutionResult> {
    const iframe = this.createSandboxedIframe(executionId);
    
    // Create comprehensive HTML document with CSS for better preview
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS Live Preview</title>
    <style>
        /* Reset and base styles with dark mode */
        * { box-sizing: border-box; }
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            background: #0f172a;
            color: #e2e8f0;
        }
        
        /* User's CSS */
        ${request.code}
    </style>
</head>
<body>
    <div class="css-preview-container">
        <header class="preview-header">
            <h1>CSS Preview</h1>
            <p class="subtitle">Your styles are applied to the elements below</p>
        </header>
        
        <main class="demo-content">
            <section class="typography-demo">
                <h2>Typography</h2>
                <h3>Heading Level 3</h3>
                <h4>Heading Level 4</h4>
                <p>This is a paragraph with <strong>bold text</strong>, <em>italic text</em>, and <a href="#">a link</a>.</p>
                <p class="special-text">This paragraph has a "special-text" class.</p>
                <blockquote>This is a blockquote element for testing quote styles.</blockquote>
            </section>
            
            <section class="layout-demo">
                <h2>Layout Elements</h2>
                <div class="container">
                    <div class="box">Box 1</div>
                    <div class="box">Box 2</div>
                    <div class="box">Box 3</div>
                </div>
                <div class="card">
                    <h3>Card Component</h3>
                    <p>This is a card-like component for testing layout styles.</p>
                </div>
            </section>
            
            <section class="interactive-demo">
                <h2>Interactive Elements</h2>
                <button class="btn primary">Primary Button</button>
                <button class="btn secondary">Secondary Button</button>
                <button class="btn" disabled>Disabled Button</button>
                
                <form class="demo-form">
                    <div class="form-group">
                        <label for="demo-input">Text Input:</label>
                        <input type="text" id="demo-input" placeholder="Enter text here">
                    </div>
                    <div class="form-group">
                        <label for="demo-select">Select:</label>
                        <select id="demo-select">
                            <option>Option 1</option>
                            <option>Option 2</option>
                            <option>Option 3</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="demo-textarea">Textarea:</label>
                        <textarea id="demo-textarea" rows="3" placeholder="Enter longer text here"></textarea>
                    </div>
                </form>
            </section>
            
            <section class="list-demo">
                <h2>Lists</h2>
                <ul class="demo-list">
                    <li>Unordered list item 1</li>
                    <li>Unordered list item 2</li>
                    <li>Unordered list item 3</li>
                </ul>
                <ol class="demo-list">
                    <li>Ordered list item 1</li>
                    <li>Ordered list item 2</li>
                    <li>Ordered list item 3</li>
                </ol>
            </section>
            
            <section class="table-demo">
                <h2>Table</h2>
                <table class="demo-table">
                    <thead>
                        <tr>
                            <th>Header 1</th>
                            <th>Header 2</th>
                            <th>Header 3</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Cell 1</td>
                            <td>Cell 2</td>
                            <td>Cell 3</td>
                        </tr>
                        <tr>
                            <td>Cell 4</td>
                            <td>Cell 5</td>
                            <td>Cell 6</td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </main>
        
        <footer class="preview-footer">
            <p>End of CSS preview content</p>
        </footer>
    </div>
    
    <script>
        // Add some interactivity for hover and focus states
        document.addEventListener('DOMContentLoaded', function() {
            console.log('CSS preview loaded successfully');
            
            // Add click handlers to demonstrate :active states
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                button.addEventListener('click', function(e) {
                    console.log('Button clicked: ' + this.textContent);
                });
            });
            
            // Add focus handlers for form elements
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('focus', function() {
                    console.log('Form element focused: ' + this.tagName);
                });
            });
        });
    </script>
</body>
</html>`;
    
    await this.injectContent(iframe, htmlContent);
    
    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Store iframe reference
    if (request.sessionId) {
      this.activeIframes.set(request.sessionId, iframe);
    }
    
    // Analyze CSS for advanced features
    const hasAnimations = request.code.includes('@keyframes') || 
                         request.code.includes('animation') || 
                         request.code.includes('transition');
    const hasFlexbox = request.code.includes('flex') || request.code.includes('grid');
    const hasMediaQueries = request.code.includes('@media');
    const hasCustomProperties = request.code.includes('--') || request.code.includes('var(');
    
    return {
      success: true,
      output: 'CSS applied successfully to preview elements',
      visualOutput: this.getIframeHTML(iframe),
      metadata: {
        iframeId: executionId,
        hasInteractivity: hasAnimations,
        hasAnimations,
        hasFlexbox,
        hasMediaQueries,
        hasCustomProperties,
        cssFeatures: {
          animations: hasAnimations,
          flexbox: hasFlexbox,
          mediaQueries: hasMediaQueries,
          customProperties: hasCustomProperties
        }
      }
    };
  }

  private async executeJavaScript(request: CodeExecutionRequest, executionId: string): Promise<CodeExecutionResult> {
    const iframe = this.createSandboxedIframe(executionId);
    const consoleOutput: string[] = [];
    
    // Create HTML document with enhanced JavaScript execution environment
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JavaScript Execution</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 20px; 
            background: #f8f9fa;
            line-height: 1.6;
        }
        .output { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 15px 0;
            border-left: 4px solid #007acc;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .output h3 {
            margin-top: 0;
            color: #333;
            font-size: 18px;
        }
        .console-line {
            margin: 8px 0;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            border-left: 3px solid transparent;
        }
        .console-log {
            background: #f0f8f0;
            color: #2e7d32;
            border-left-color: #4caf50;
        }
        .console-error {
            background: #ffebee;
            color: #c62828;
            border-left-color: #f44336;
        }
        .console-warn {
            background: #fff3e0;
            color: #ef6c00;
            border-left-color: #ff9800;
        }
        .interactive-area {
            margin-top: 20px;
            padding: 15px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        .dom-playground {
            min-height: 100px;
            padding: 15px;
            background: #fafafa;
            border: 2px dashed #ccc;
            border-radius: 6px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div id="output" class="output">
        <h3>JavaScript Console Output</h3>
        <div id="console-result"></div>
    </div>
    
    <div class="interactive-area">
        <h4>Interactive DOM Area</h4>
        <div id="dom-playground" class="dom-playground">
            <p>This area can be manipulated by your JavaScript code using DOM methods.</p>
        </div>
    </div>
    
    <script>
        // Enhanced console capture with better formatting
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;
        const originalDebug = console.debug;
        
        const consoleResult = document.getElementById('console-result');
        const domPlayground = document.getElementById('dom-playground');
        
        // Global variables available to user code
        window.playground = domPlayground;
        window.output = consoleResult;
        
        function formatValue(value) {
            if (value === null) return 'null';
            if (value === undefined) return 'undefined';
            if (typeof value === 'string') return value;
            if (typeof value === 'function') return value.toString();
            if (typeof value === 'object') {
                try {
                    return JSON.stringify(value, null, 2);
                } catch (e) {
                    return '[Object object]';
                }
            }
            return String(value);
        }
        
        function appendConsoleOutput(message, type = 'log') {
            const div = document.createElement('div');
            div.className = 'console-line console-' + type;
            div.textContent = message;
            consoleResult.appendChild(div);
            
            // Auto-scroll to bottom
            consoleResult.scrollTop = consoleResult.scrollHeight;
        }
        
        // Override console methods
        console.log = function(...args) {
            const message = args.map(formatValue).join(' ');
            appendConsoleOutput(message, 'log');
            originalLog.apply(console, args);
        };
        
        console.error = function(...args) {
            const message = args.map(formatValue).join(' ');
            appendConsoleOutput('Error: ' + message, 'error');
            originalError.apply(console, args);
        };
        
        console.warn = function(...args) {
            const message = args.map(formatValue).join(' ');
            appendConsoleOutput('Warning: ' + message, 'warn');
            originalWarn.apply(console, args);
        };
        
        console.info = function(...args) {
            const message = args.map(formatValue).join(' ');
            appendConsoleOutput('Info: ' + message, 'log');
            originalInfo.apply(console, args);
        };
        
        console.debug = function(...args) {
            const message = args.map(formatValue).join(' ');
            appendConsoleOutput('Debug: ' + message, 'log');
            originalDebug.apply(console, args);
        };
        
        // Global error handler
        window.addEventListener('error', function(event) {
            console.error('Runtime Error: ' + event.message + ' at line ' + event.lineno);
        });
        
        window.addEventListener('unhandledrejection', function(event) {
            console.error('Unhandled Promise Rejection: ' + event.reason);
        });
        
        // Utility functions available to user code
        window.createElement = function(tag, attributes = {}, textContent = '') {
            const element = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
            if (textContent) element.textContent = textContent;
            return element;
        };
        
        window.addToPlayground = function(element) {
            if (typeof element === 'string') {
                domPlayground.innerHTML += element;
            } else {
                domPlayground.appendChild(element);
            }
        };
        
        window.clearPlayground = function() {
            domPlayground.innerHTML = '<p>This area can be manipulated by your JavaScript code using DOM methods.</p>';
        };
        
        // Execute user code with enhanced error handling
        try {
            // Clear any previous output
            consoleResult.innerHTML = '';
            
            // Execute the user's code
            ${request.code}
            
            // If no console output was generated, show success message
            if (consoleResult.children.length === 0) {
                appendConsoleOutput('Code executed successfully (no console output)', 'log');
            }
            
        } catch (error) {
            console.error(error.name + ': ' + error.message);
            if (error.stack) {
                console.error('Stack trace: ' + error.stack);
            }
        }
    </script>
</body>
</html>`;
    
    await this.injectContent(iframe, htmlContent);
    
    // Wait for JavaScript execution and DOM updates
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Capture console output from the iframe
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        const consoleElements = iframeDoc.querySelectorAll('.console-line');
        consoleElements.forEach(element => {
          consoleOutput.push(element.textContent || '');
        });
      }
    } catch (error) {
      console.warn('Failed to capture console output:', error);
    }
    
    // Store iframe reference
    if (request.sessionId) {
      this.activeIframes.set(request.sessionId, iframe);
      this.consoleOutputs.set(request.sessionId, consoleOutput);
    }
    
    return {
      success: true,
      output: consoleOutput.join('\n') || 'JavaScript executed successfully',
      visualOutput: this.getIframeHTML(iframe),
      metadata: {
        iframeId: executionId,
        hasInteractivity: true,
        hasConsoleOutput: consoleOutput.length > 0,
        hasDOMManipulation: request.code.includes('document.') || request.code.includes('playground')
      }
    };
  }

  private createSandboxedIframe(executionId: string, language: SupportedLanguage = 'javascript'): HTMLIFrameElement {
    // Use security manager to create secure iframe
    const iframe = securityManager.createSecureIframe(language);
    
    // Add execution-specific attributes
    iframe.setAttribute('data-execution-id', executionId);
    
    // Styling
    iframe.style.width = '100%';
    iframe.style.height = '400px';
    iframe.style.border = '1px solid #ddd';
    iframe.style.borderRadius = '4px';
    iframe.style.background = 'white';
    iframe.style.display = 'none';
    
    // Append to a hidden container
    let container = document.getElementById('iframe-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'iframe-container';
      container.style.display = 'none';
      document.body.appendChild(container);
    }
    
    container.appendChild(iframe);
    
    return iframe;
  }

  private async injectContent(iframe: HTMLIFrameElement, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Iframe load timeout'));
      }, 5000);
      
      iframe.onload = () => {
        clearTimeout(timeout);
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            doc.open();
            doc.write(content);
            doc.close();
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      iframe.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load iframe'));
      };
      
      // Set src to about:blank to trigger load event
      iframe.src = 'about:blank';
    });
  }

  private setupConsoleCapture(iframe: HTMLIFrameElement, output: string[]): void {
    try {
      // Wait for iframe to load before setting up console capture
      iframe.addEventListener('load', () => {
        try {
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow && iframeWindow.console) {
            // Store original console methods
            const originalLog = iframeWindow.console.log;
            const originalError = iframeWindow.console.error;
            const originalWarn = iframeWindow.console.warn;
            const originalInfo = iframeWindow.console.info;
            
            // Override console methods to capture output
            iframeWindow.console.log = (...args: any[]) => {
              const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              ).join(' ');
              output.push(message);
              originalLog.apply(iframeWindow.console, args);
            };
            
            iframeWindow.console.error = (...args: any[]) => {
              const message = args.map(arg => String(arg)).join(' ');
              output.push('Error: ' + message);
              originalError.apply(iframeWindow.console, args);
            };
            
            iframeWindow.console.warn = (...args: any[]) => {
              const message = args.map(arg => String(arg)).join(' ');
              output.push('Warning: ' + message);
              originalWarn.apply(iframeWindow.console, args);
            };
            
            iframeWindow.console.info = (...args: any[]) => {
              const message = args.map(arg => String(arg)).join(' ');
              output.push('Info: ' + message);
              originalInfo.apply(iframeWindow.console, args);
            };
            
            // Set up global error handlers
            iframeWindow.addEventListener('error', (event) => {
              output.push(`Runtime Error: ${event.message} at line ${event.lineno}`);
            });
            
            iframeWindow.addEventListener('unhandledrejection', (event) => {
              output.push(`Unhandled Promise Rejection: ${event.reason}`);
            });
          }
        } catch (error) {
          console.warn('Failed to set up console capture after load:', error);
        }
      });
    } catch (error) {
      // Console capture setup failed, but execution can continue
      console.warn('Failed to set up console capture listener:', error);
    }
  }

  private getIframeHTML(iframe: HTMLIFrameElement): string {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      return doc ? doc.documentElement.outerHTML : '';
    } catch (error) {
      return '';
    }
  }

  private generateExecutionId(): string {
    return `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public method to get iframe for rendering
  getIframe(sessionId: string): HTMLIFrameElement | null {
    return this.activeIframes.get(sessionId) || null;
  }

  // Public method to get console output
  getConsoleOutput(sessionId: string): string[] {
    return this.consoleOutputs.get(sessionId) || [];
  }

  // Get execution statistics and metadata
  getExecutionStats(sessionId: string): {
    hasIframe: boolean;
    consoleOutputCount: number;
    iframeLoaded: boolean;
    lastExecutionTime?: number;
  } {
    const iframe = this.activeIframes.get(sessionId);
    const consoleOutput = this.consoleOutputs.get(sessionId) || [];
    
    return {
      hasIframe: !!iframe,
      consoleOutputCount: consoleOutput.length,
      iframeLoaded: iframe ? this.isIframeLoaded(iframe) : false,
      lastExecutionTime: iframe ? Date.now() : undefined
    };
  }

  // Check if iframe is properly loaded
  private isIframeLoaded(iframe: HTMLIFrameElement): boolean {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      return !!(doc && doc.readyState === 'complete');
    } catch (error) {
      return false;
    }
  }

  // Enhanced cleanup with better error handling
  cleanupSession(sessionId: string): void {
    try {
      const iframe = this.activeIframes.get(sessionId);
      if (iframe) {
        // Remove event listeners before removing iframe
        iframe.onload = null;
        iframe.onerror = null;
        
        // Remove from DOM
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
        
        this.activeIframes.delete(sessionId);
      }
      
      // Clear console output
      this.consoleOutputs.delete(sessionId);
      
    } catch (error) {
      console.warn(`Failed to cleanup session ${sessionId}:`, error);
    }
  }
}