# JavaScript & TypeScript Guide

This guide covers executing JavaScript and TypeScript code in the Live Code Execution System.

## Overview

The JavaScript execution engine provides a secure, sandboxed environment for running JavaScript and TypeScript code with full DOM access and modern ES6+ features.

## Basic Usage

### Simple JavaScript Execution

```javascript
// Basic console output
console.log("Hello, World!");

// Variables and functions
const greeting = "Welcome to Live Code!";
function greet(name) {
  return `${greeting} Hello, ${name}!`;
}

console.log(greet("Developer"));
```

### Working with DOM

```javascript
// Create and manipulate DOM elements
const container = document.createElement('div');
container.style.cssText = `
  padding: 20px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  color: white;
  border-radius: 10px;
  text-align: center;
`;

const title = document.createElement('h2');
title.textContent = 'Dynamic Content';
container.appendChild(title);

const button = document.createElement('button');
button.textContent = 'Click Me!';
button.style.cssText = `
  padding: 10px 20px;
  background: white;
  color: #333;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
`;

button.onclick = () => {
  alert('Button clicked!');
  console.log('Interactive element clicked');
};

container.appendChild(button);
document.body.appendChild(container);
```

### Async/Await and Promises

```javascript
// Async functions work perfectly
async function fetchData() {
  // Simulate API call with timeout
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        users: ['Alice', 'Bob', 'Charlie'],
        timestamp: new Date().toISOString()
      });
    }, 1000);
  });
}

// Use async/await
async function displayData() {
  console.log('Fetching data...');
  
  try {
    const data = await fetchData();
    console.log('Data received:', data);
    
    // Display in DOM
    const list = document.createElement('ul');
    data.users.forEach(user => {
      const item = document.createElement('li');
      item.textContent = user;
      list.appendChild(item);
    });
    
    document.body.appendChild(list);
  } catch (error) {
    console.error('Error:', error);
  }
}

displayData();
```

## TypeScript Support

### Type Definitions

```typescript
// Define interfaces and types
interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

type UserRole = 'admin' | 'user' | 'guest';

class UserManager {
  private users: User[] = [];
  
  constructor(private defaultRole: UserRole = 'user') {}
  
  addUser(userData: Omit<User, 'id'>): User {
    const user: User = {
      id: this.users.length + 1,
      ...userData
    };
    
    this.users.push(user);
    console.log(`Added user: ${user.name} (${user.email})`);
    return user;
  }
  
  getActiveUsers(): User[] {
    return this.users.filter(user => user.active);
  }
  
  displayUsers(): void {
    const container = document.createElement('div');
    container.innerHTML = '<h3>User List</h3>';
    
    this.users.forEach(user => {
      const userDiv = document.createElement('div');
      userDiv.style.cssText = `
        padding: 10px;
        margin: 5px 0;
        background: ${user.active ? '#e8f5e8' : '#f5e8e8'};
        border-radius: 5px;
      `;
      
      userDiv.innerHTML = `
        <strong>${user.name}</strong> (${user.email})
        <span style="float: right; color: ${user.active ? 'green' : 'red'}">
          ${user.active ? 'Active' : 'Inactive'}
        </span>
      `;
      
      container.appendChild(userDiv);
    });
    
    document.body.appendChild(container);
  }
}

// Usage
const manager = new UserManager('user');

manager.addUser({
  name: 'Alice Johnson',
  email: 'alice@example.com',
  active: true
});

manager.addUser({
  name: 'Bob Smith',
  email: 'bob@example.com',
  active: false
});

manager.displayUsers();

console.log('Active users:', manager.getActiveUsers());
```

## Advanced Features

### ES6+ Features

```javascript
// Destructuring and spread operator
const config = {
  theme: 'dark',
  language: 'en',
  features: ['syntax-highlighting', 'auto-complete'],
  limits: { timeout: 30000, memory: 100 }
};

const { theme, features, limits: { timeout } } = config;
console.log(`Theme: ${theme}, Timeout: ${timeout}ms`);

// Array methods and functional programming
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const result = numbers
  .filter(n => n % 2 === 0)
  .map(n => n * n)
  .reduce((sum, n) => sum + n, 0);

console.log('Sum of squares of even numbers:', result);

// Template literals and tagged templates
function highlight(strings, ...values) {
  return strings.reduce((result, string, i) => {
    const value = values[i] ? `<mark>${values[i]}</mark>` : '';
    return result + string + value;
  }, '');
}

const name = 'JavaScript';
const version = 'ES2023';
const message = highlight`Welcome to ${name} ${version}!`;

document.body.innerHTML += `<p>${message}</p>`;
```

### Working with Classes and Modules

```javascript
// Modern class syntax
class DataProcessor {
  constructor(name) {
    this.name = name;
    this.data = [];
    this.processors = new Map();
  }
  
  // Private method (using # syntax)
  #validateData(item) {
    return item !== null && item !== undefined;
  }
  
  // Public methods
  addData(item) {
    if (this.#validateData(item)) {
      this.data.push(item);
      console.log(`Added: ${JSON.stringify(item)}`);
    }
  }
  
  process(processorName, fn) {
    this.processors.set(processorName, fn);
    return this;
  }
  
  execute(processorName) {
    const processor = this.processors.get(processorName);
    if (processor) {
      const result = processor(this.data);
      console.log(`${processorName} result:`, result);
      return result;
    }
    throw new Error(`Processor '${processorName}' not found`);
  }
  
  // Generator method
  *iterate() {
    for (const item of this.data) {
      yield item;
    }
  }
}

// Usage
const processor = new DataProcessor('NumberProcessor');

// Add data
[1, 2, 3, 4, 5].forEach(n => processor.addData(n));

// Define processors
processor
  .process('sum', data => data.reduce((a, b) => a + b, 0))
  .process('average', data => data.reduce((a, b) => a + b, 0) / data.length)
  .process('max', data => Math.max(...data));

// Execute processors
console.log('Sum:', processor.execute('sum'));
console.log('Average:', processor.execute('average'));
console.log('Max:', processor.execute('max'));

// Use generator
console.log('Iterating through data:');
for (const item of processor.iterate()) {
  console.log(`Item: ${item}`);
}
```

## Interactive Examples

### Canvas Graphics

```javascript
// Create a canvas for graphics
const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 300;
canvas.style.border = '1px solid #ccc';
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

// Animated sine wave
let time = 0;

function drawWave() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.beginPath();
  ctx.strokeStyle = '#4ecdc4';
  ctx.lineWidth = 2;
  
  for (let x = 0; x < canvas.width; x++) {
    const y = canvas.height / 2 + Math.sin((x + time) * 0.02) * 50;
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.stroke();
  time += 2;
  
  requestAnimationFrame(drawWave);
}

drawWave();

// Add controls
const controls = document.createElement('div');
controls.style.marginTop = '10px';

const stopButton = document.createElement('button');
stopButton.textContent = 'Stop Animation';
stopButton.onclick = () => {
  time = -Infinity; // Stop the animation
};

controls.appendChild(stopButton);
document.body.appendChild(controls);
```

### Form Handling

```javascript
// Create an interactive form
const form = document.createElement('form');
form.style.cssText = `
  max-width: 400px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  margin: 20px 0;
`;

form.innerHTML = `
  <h3>User Registration</h3>
  <div style="margin-bottom: 15px;">
    <label for="name">Name:</label><br>
    <input type="text" id="name" name="name" required 
           style="width: 100%; padding: 8px; margin-top: 5px;">
  </div>
  <div style="margin-bottom: 15px;">
    <label for="email">Email:</label><br>
    <input type="email" id="email" name="email" required
           style="width: 100%; padding: 8px; margin-top: 5px;">
  </div>
  <div style="margin-bottom: 15px;">
    <label for="age">Age:</label><br>
    <input type="number" id="age" name="age" min="1" max="120"
           style="width: 100%; padding: 8px; margin-top: 5px;">
  </div>
  <button type="submit" style="background: #4ecdc4; color: white; padding: 10px 20px; border: none; border-radius: 4px;">
    Register
  </button>
`;

// Handle form submission
form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const formData = new FormData(form);
  const userData = Object.fromEntries(formData.entries());
  
  console.log('Form submitted:', userData);
  
  // Display success message
  const message = document.createElement('div');
  message.style.cssText = `
    padding: 10px;
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
    border-radius: 4px;
    margin-top: 10px;
  `;
  message.textContent = `Registration successful for ${userData.name}!`;
  
  form.appendChild(message);
  
  // Clear form after 3 seconds
  setTimeout(() => {
    form.reset();
    message.remove();
  }, 3000);
});

document.body.appendChild(form);
```

## Best Practices

### Error Handling

```javascript
// Comprehensive error handling
class SafeExecutor {
  static async execute(fn, context = 'operation') {
    try {
      console.log(`Starting ${context}...`);
      const result = await fn();
      console.log(`${context} completed successfully`);
      return { success: true, result };
    } catch (error) {
      console.error(`${context} failed:`, error.message);
      return { 
        success: false, 
        error: error.message,
        stack: error.stack 
      };
    }
  }
  
  static handleAsyncErrors() {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    });
    
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
    });
  }
}

// Initialize error handling
SafeExecutor.handleAsyncErrors();

// Example usage
SafeExecutor.execute(async () => {
  // Simulate some async work
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // This might throw an error
  if (Math.random() > 0.5) {
    throw new Error('Random error occurred');
  }
  
  return 'Operation successful!';
}, 'async operation').then(result => {
  console.log('Result:', result);
});
```

### Performance Optimization

```javascript
// Debouncing and throttling
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Example: Optimized search
const searchInput = document.createElement('input');
searchInput.placeholder = 'Search...';
searchInput.style.cssText = 'width: 300px; padding: 10px; margin: 20px 0;';

const results = document.createElement('div');
results.style.cssText = 'min-height: 100px; border: 1px solid #ccc; padding: 10px;';

// Simulated search function
const performSearch = debounce((query) => {
  console.log(`Searching for: ${query}`);
  results.innerHTML = `<p>Search results for "${query}"...</p>`;
  
  // Simulate search results
  setTimeout(() => {
    const mockResults = [
      `Result 1 for "${query}"`,
      `Result 2 for "${query}"`,
      `Result 3 for "${query}"`
    ];
    
    results.innerHTML = mockResults
      .map(result => `<div style="padding: 5px; border-bottom: 1px solid #eee;">${result}</div>`)
      .join('');
  }, 500);
}, 300);

searchInput.addEventListener('input', (e) => {
  performSearch(e.target.value);
});

document.body.appendChild(searchInput);
document.body.appendChild(results);
```

## Common Patterns

### Observer Pattern

```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
  
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
}

// Usage
const emitter = new EventEmitter();

emitter.on('user-login', (user) => {
  console.log(`User logged in: ${user.name}`);
});

emitter.on('user-login', (user) => {
  document.body.innerHTML += `<p>Welcome, ${user.name}!</p>`;
});

// Trigger event
emitter.emit('user-login', { name: 'Alice', id: 123 });
```

## Tips and Tricks

1. **Use console methods**: `console.log()`, `console.error()`, `console.table()`, `console.time()`
2. **DOM manipulation**: Direct access to `document` and `window` objects
3. **Modern JavaScript**: Full ES6+ support including async/await, destructuring, classes
4. **Error handling**: Always wrap risky operations in try-catch blocks
5. **Performance**: Use `requestAnimationFrame()` for animations
6. **Debugging**: Use `debugger;` statements and browser dev tools

## Limitations

- No access to Node.js APIs (fs, http, etc.)
- Network requests are restricted for security
- File system access is not available
- Some browser APIs may be restricted in the sandbox

For more advanced examples and use cases, see the [Examples Repository](../examples/javascript/).