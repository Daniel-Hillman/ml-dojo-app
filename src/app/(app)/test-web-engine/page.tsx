'use client';

import React, { useState } from 'react';
import { LiveCodeBlock } from '@/components/LiveCodeBlock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TestWebEnginePage = () => {
  const [selectedExample, setSelectedExample] = useState('html');

  const examples = {
    html: {
      title: 'HTML Example',
      code: `<div class="welcome">
  <h1>Welcome to HTML Live Preview!</h1>
  <p>This is a <strong>live HTML preview</strong> that updates in real-time.</p>
  
  <div class="interactive-section">
    <h2>Interactive Elements</h2>
    <button onclick="alert('Button clicked!')">Click Me!</button>
    <button onclick="changeColor()">Change Background</button>
  </div>
  
  <div class="form-section">
    <h3>Form Elements</h3>
    <input type="text" placeholder="Type something..." onkeyup="showInput(this.value)">
    <div id="output"></div>
  </div>
</div>

<script>
function changeColor() {
  const colors = ['#ffebee', '#e8f5e8', '#fff3e0', '#e3f2fd'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  document.body.style.backgroundColor = randomColor;
  console.log('Background changed to: ' + randomColor);
}

function showInput(value) {
  const output = document.getElementById('output');
  output.innerHTML = '<p>You typed: <em>' + value + '</em></p>';
  console.log('Input value: ' + value);
}

console.log('HTML with JavaScript loaded successfully!');
</script>

<style>
.welcome {
  padding: 20px;
  font-family: Arial, sans-serif;
}

.interactive-section, .form-section {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

button {
  margin: 5px;
  padding: 10px 15px;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #005a9e;
}

input {
  padding: 8px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

#output {
  margin-top: 10px;
  padding: 10px;
  background: white;
  border-radius: 4px;
  min-height: 30px;
}
</style>`,
      language: 'html' as const
    },
    css: {
      title: 'CSS Example',
      code: `/* Modern CSS with animations and effects */
.css-preview-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 15px;
  overflow: hidden;
}

.preview-header {
  text-align: center;
  padding: 30px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.preview-header h1 {
  font-size: 2.5em;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  animation: fadeInUp 1s ease-out;
}

.subtitle {
  opacity: 0.9;
  font-size: 1.1em;
  animation: fadeInUp 1s ease-out 0.3s both;
}

.demo-content {
  padding: 30px;
}

.box {
  background: rgba(255, 255, 255, 0.2);
  padding: 20px;
  margin: 15px 0;
  border-radius: 10px;
  border-left: 4px solid #fff;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.box:hover {
  transform: translateX(10px);
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.btn {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}

.btn.secondary {
  background: linear-gradient(45deg, #74b9ff, #0984e3);
}

.card {
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  padding: 25px;
  border-radius: 15px;
  margin: 20px 0;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  animation: slideInLeft 0.8s ease-out;
}

.demo-table {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
}

.demo-table th {
  background: rgba(255, 255, 255, 0.2);
  padding: 15px;
  font-weight: bold;
}

.demo-table td {
  padding: 12px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.demo-table tr:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .preview-header h1 {
    font-size: 2em;
  }
  
  .demo-content {
    padding: 20px;
  }
  
  .btn {
    display: block;
    width: 100%;
    margin: 10px 0;
  }
}

/* Custom properties (CSS variables) */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #ff6b6b;
  --text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.special-text {
  color: var(--accent-color);
  text-shadow: var(--text-shadow);
  font-weight: bold;
}`,
      language: 'css' as const
    },
    javascript: {
      title: 'JavaScript Example',
      code: `// Interactive JavaScript Demo
console.log('🚀 JavaScript execution started!');

// DOM Manipulation Demo
const title = createElement('h2', {}, 'JavaScript DOM Manipulation Demo');
addToPlayground(title);

// Create interactive elements
const button1 = createElement('button', { 
  style: 'margin: 10px; padding: 10px 20px; background: #007acc; color: white; border: none; border-radius: 5px; cursor: pointer;' 
}, 'Generate Random Number');

const button2 = createElement('button', { 
  style: 'margin: 10px; padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;' 
}, 'Create Animation');

const button3 = createElement('button', { 
  style: 'margin: 10px; padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;' 
}, 'Clear Playground');

// Add event listeners
button1.addEventListener('click', function() {
  const randomNum = Math.floor(Math.random() * 1000) + 1;
  const result = createElement('div', {
    style: 'padding: 10px; margin: 5px; background: #e8f5e8; border-left: 4px solid #28a745; border-radius: 4px;'
  }, \`🎲 Random number: \${randomNum}\`);
  addToPlayground(result);
  console.log('Generated random number:', randomNum);
});

button2.addEventListener('click', function() {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  const animatedBox = createElement('div', {
    style: \`
      width: 100px; 
      height: 100px; 
      background: \${randomColor}; 
      margin: 10px; 
      border-radius: 10px;
      animation: bounce 1s ease-in-out;
      display: inline-block;
    \`
  }, '✨');
  
  // Add CSS animation
  const style = createElement('style', {}, \`
    @keyframes bounce {
      0%, 20%, 60%, 100% { transform: translateY(0); }
      40% { transform: translateY(-30px); }
      80% { transform: translateY(-15px); }
    }
  \`);
  
  document.head.appendChild(style);
  addToPlayground(animatedBox);
  console.log('Created animated box with color:', randomColor);
});

button3.addEventListener('click', function() {
  clearPlayground();
  console.log('Playground cleared!');
});

// Add buttons to playground
addToPlayground(button1);
addToPlayground(button2);
addToPlayground(button3);

// Data processing demo
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);

console.log('Original numbers:', numbers);
console.log('Doubled:', doubled);
console.log('Even numbers:', evens);
console.log('Sum:', sum);

// Object and array manipulation
const person = {
  name: 'Alice',
  age: 30,
  hobbies: ['reading', 'coding', 'hiking']
};

console.log('Person object:', person);
console.log('Person name:', person.name);
console.log('Hobbies:', person.hobbies.join(', '));

// Async demo with setTimeout
setTimeout(() => {
  const delayedMessage = createElement('div', {
    style: 'padding: 15px; margin: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; color: #856404;'
  }, '⏰ This message appeared after 2 seconds!');
  addToPlayground(delayedMessage);
  console.log('Delayed message displayed');
}, 2000);

// Function demonstration
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const fibNumbers = [];
for (let i = 0; i < 10; i++) {
  fibNumbers.push(fibonacci(i));
}

console.log('First 10 Fibonacci numbers:', fibNumbers);

// Error handling demo
try {
  const result = JSON.parse('{"valid": "json"}');
  console.log('Parsed JSON:', result);
} catch (error) {
  console.error('JSON parsing failed:', error.message);
}

// Final status
const statusDiv = createElement('div', {
  style: 'padding: 20px; margin: 20px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; text-align: center;'
}, '🎉 JavaScript demo completed successfully!');

addToPlayground(statusDiv);
console.log('✅ All JavaScript demos completed!');`,
      language: 'javascript' as const
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Web Engine Test Page</h1>
        <p className="text-gray-600">
          Test the HTML/CSS/JavaScript execution engine with live examples.
        </p>
      </div>

      <Tabs value={selectedExample} onValueChange={setSelectedExample} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="html">HTML Demo</TabsTrigger>
          <TabsTrigger value="css">CSS Demo</TabsTrigger>
          <TabsTrigger value="javascript">JavaScript Demo</TabsTrigger>
        </TabsList>

        {Object.entries(examples).map(([key, example]) => (
          <TabsContent key={key} value={key} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{example.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <LiveCodeBlock
                  initialCode={example.code}
                  language={example.language}
                  showOutput={true}
                  allowEdit={true}
                  height="500px"
                  showLanguageSelector={false}
                  showControls={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">HTML Demo:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Click the buttons to test interactivity</li>
                <li>Type in the input field to see real-time updates</li>
                <li>Check the console tab for JavaScript output</li>
                <li>Modify the HTML and click "Run" to see changes</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">CSS Demo:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Hover over elements to see animations</li>
                <li>Notice the gradient backgrounds and effects</li>
                <li>Try modifying colors, sizes, or animations</li>
                <li>Test responsive design by resizing the preview</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">JavaScript Demo:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Click buttons to interact with the DOM</li>
                <li>Watch the console for detailed output</li>
                <li>Wait for the delayed message (2 seconds)</li>
                <li>Modify the code to experiment with different features</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestWebEnginePage;