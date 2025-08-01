'use client';

import React from 'react';
import { CodeOutput } from '@/components/CodeOutput';
import { CodeExecutionResult } from '@/lib/code-execution';

const TestCodeOutputPage = () => {
  // Test data for different scenarios
  const successResult: CodeExecutionResult = {
    success: true,
    output: 'Hello, World!\nThis is a test output\nWith multiple lines\nAnd some numbers: 42, 3.14',
    executionTime: 150,
    memoryUsage: 1024 * 1024, // 1MB
    sessionId: 'test-session-123',
    metadata: {
      linesOfCode: 5,
      packagesLoaded: ['numpy', 'pandas'],
      pythonVersion: '3.11.0'
    }
  };

  const errorResult: CodeExecutionResult = {
    success: false,
    error: 'SyntaxError: invalid syntax\n  File "<stdin>", line 1\n    print("Hello World"\n                      ^\nSyntaxError: invalid syntax',
    executionTime: 50,
    sessionId: 'test-session-456'
  };

  const visualResult: CodeExecutionResult = {
    success: true,
    output: 'Plot generated successfully',
    visualOutput: '<div style="padding: 20px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: white; text-align: center; border-radius: 8px;"><h2>Sample Visual Output</h2><p>This represents a plot or chart</p></div>',
    executionTime: 300,
    memoryUsage: 2 * 1024 * 1024, // 2MB
    metadata: {
      plotType: 'line',
      dataPoints: 100
    }
  };

  const htmlResult: CodeExecutionResult = {
    success: true,
    visualOutput: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .container { max-width: 400px; margin: 0 auto; }
          .button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
          .button:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Interactive Demo</h1>
          <p>This is a live HTML preview!</p>
          <button class="button" onclick="alert('Hello from the preview!')">Click Me</button>
          <div id="output"></div>
          <script>
            document.querySelector('.button').addEventListener('click', function() {
              document.getElementById('output').innerHTML = '<p style="color: green; margin-top: 10px;">Button clicked!</p>';
            });
          </script>
        </div>
      </body>
      </html>
    `,
    executionTime: 75
  };

  const emptyResult: CodeExecutionResult = {
    success: true,
    executionTime: 25
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">CodeOutput Component Test</h1>
        <p className="text-muted-foreground">Testing the enhanced tabbed output interface</p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Success with Console Output</h2>
          <CodeOutput 
            result={successResult} 
            language="python" 
            maxHeight="300px"
          />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Error Result</h2>
          <CodeOutput 
            result={errorResult} 
            language="python" 
            defaultTab="errors"
          />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Visual Output (Python Plot)</h2>
          <CodeOutput 
            result={visualResult} 
            language="python" 
            defaultTab="preview"
          />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">HTML Interactive Preview</h2>
          <CodeOutput 
            result={htmlResult} 
            language="html" 
            defaultTab="preview"
            maxHeight="400px"
          />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Empty Result</h2>
          <CodeOutput 
            result={emptyResult} 
            language="javascript" 
          />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Mobile Responsive Test</h2>
          <div className="max-w-sm">
            <CodeOutput 
              result={successResult} 
              language="python" 
              maxHeight="250px"
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Feature Showcase</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Complex Error with Stack Trace</h3>
              <CodeOutput 
                result={{
                  success: false,
                  error: 'TypeError: Cannot read property "length" of undefined\n    at processArray (main.js:15:23)\n    at Object.main (main.js:8:5)\n    at Module._compile (module.js:653:30)\n    at Object.Module._extensions..js (module.js:664:10)',
                  executionTime: 125
                }}
                language="javascript"
                defaultTab="errors"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Rich Metadata Display</h3>
              <CodeOutput 
                result={{
                  success: true,
                  output: 'Data processing complete\nProcessed 1000 records',
                  executionTime: 2500,
                  memoryUsage: 15 * 1024 * 1024,
                  sessionId: 'data-proc-session-789',
                  metadata: {
                    recordsProcessed: 1000,
                    averageProcessingTime: '2.5ms',
                    cacheHitRate: '85%',
                    databaseQueries: 12,
                    optimizationLevel: 'high'
                  }
                }}
                language="python"
                defaultTab="info"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Enhanced Error Formatting</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Python Syntax Error with Highlighting</h3>
              <CodeOutput 
                result={{
                  success: false,
                  error: 'SyntaxError: invalid syntax\n  File "script.py", line 5\n    if x = 5:\n         ^\nSyntaxError: invalid syntax',
                  executionTime: 45
                }}
                language="python"
                defaultTab="errors"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Warning Example</h3>
              <CodeOutput 
                result={{
                  success: true,
                  output: 'Process completed with warnings',
                  error: 'DeprecationWarning: This function is deprecated\n  File "legacy.py", line 12\n    old_function()\nDeprecationWarning: Use new_function() instead',
                  executionTime: 200
                }}
                language="python"
                defaultTab="errors"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Enhanced Preview Features</h2>
          <CodeOutput 
            result={{
              success: true,
              visualOutput: `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { 
                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                      padding: 20px; 
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      min-height: 100vh;
                      margin: 0;
                    }
                    .card { 
                      background: rgba(255,255,255,0.1); 
                      padding: 20px; 
                      border-radius: 15px; 
                      backdrop-filter: blur(10px);
                      border: 1px solid rgba(255,255,255,0.2);
                      max-width: 400px;
                      margin: 0 auto;
                    }
                    .button { 
                      background: #ff6b6b; 
                      color: white; 
                      padding: 12px 24px; 
                      border: none; 
                      border-radius: 25px; 
                      cursor: pointer; 
                      font-size: 16px;
                      transition: all 0.3s ease;
                      margin: 10px 5px;
                    }
                    .button:hover { 
                      background: #ff5252; 
                      transform: translateY(-2px);
                      box-shadow: 0 5px 15px rgba(255,107,107,0.4);
                    }
                    .counter {
                      font-size: 24px;
                      font-weight: bold;
                      text-align: center;
                      margin: 20px 0;
                    }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <h1>🚀 Enhanced Preview Demo</h1>
                    <p>This demonstrates the enhanced preview capabilities with:</p>
                    <ul>
                      <li>✨ Modern CSS styling</li>
                      <li>🎯 Interactive elements</li>
                      <li>📱 Responsive design</li>
                      <li>🎨 Smooth animations</li>
                    </ul>
                    <div class="counter" id="counter">0</div>
                    <button class="button" onclick="increment()">Click Me!</button>
                    <button class="button" onclick="reset()">Reset</button>
                    <div id="output" style="margin-top: 20px; text-align: center;"></div>
                    <script>
                      let count = 0;
                      function increment() {
                        count++;
                        document.getElementById('counter').textContent = count;
                        document.getElementById('output').innerHTML = 
                          '<p style="color: #4ecdc4;">🎉 Button clicked ' + count + ' time' + (count !== 1 ? 's' : '') + '!</p>';
                      }
                      function reset() {
                        count = 0;
                        document.getElementById('counter').textContent = count;
                        document.getElementById('output').innerHTML = 
                          '<p style="color: #ffa726;">🔄 Counter reset!</p>';
                      }
                    </script>
                  </div>
                </body>
                </html>
              `,
              executionTime: 85
            }}
            language="html"
            defaultTab="preview"
            maxHeight="500px"
          />
        </section>
      </div>
    </div>
  );
};

export default TestCodeOutputPage;