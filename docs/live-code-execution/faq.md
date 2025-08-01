# Frequently Asked Questions (FAQ)

## General Questions

### What is the Live Code Execution System?

The Live Code Execution System is a secure, browser-based platform that allows you to write, execute, and share code in multiple programming languages directly in your web browser. It supports JavaScript, Python, SQL, HTML/CSS, and configuration languages like JSON, YAML, and Markdown.

### Which programming languages are supported?

Currently supported languages:
- **JavaScript/TypeScript**: Full ES6+ support with DOM access
- **Python**: Via Pyodide with NumPy, Pandas, Matplotlib, and more
- **SQL**: SQLite database with full query support
- **HTML/CSS**: Live preview with interactive elements
- **JSON**: Validation and formatting
- **YAML**: Parsing and syntax validation
- **Markdown**: Rendering and preview
- **Regex**: Pattern testing with match highlighting

### Is my code executed securely?

Yes! The system implements multiple security layers:
- **Sandboxed execution**: All code runs in isolated environments
- **Resource limits**: Memory, CPU, and execution time constraints
- **Network restrictions**: External network access is blocked
- **Content Security Policy**: Prevents XSS and code injection
- **Input validation**: All code is validated before execution

### Do I need to install anything?

No installation required! Everything runs in your web browser using WebAssembly and modern web technologies. You just need a modern browser with JavaScript enabled.

## Technical Questions

### How does Python execution work in the browser?

Python code is executed using [Pyodide](https://pyodide.org/), a Python distribution for the browser built on WebAssembly. This provides:
- Full Python 3.x compatibility
- Access to scientific libraries (NumPy, Pandas, Matplotlib, etc.)
- Near-native performance for numerical computations
- No server-side execution required

### Can I use external Python packages?

The system includes many popular packages pre-installed:
- **Data Science**: NumPy, Pandas, SciPy, Scikit-learn
- **Visualization**: Matplotlib, Seaborn, Plotly
- **Mathematics**: SymPy, Statsmodels
- **Utilities**: Various utility packages

Additional packages can be installed using:
```python
import micropip
await micropip.install('package-name')
```

### What are the execution limits?

Default limits (configurable):
- **Execution timeout**: 30 seconds for JavaScript, 60 seconds for Python
- **Memory limit**: 100MB per execution
- **Concurrent executions**: 5 simultaneous executions per user
- **Code size**: 1MB maximum per code snippet

### Can I save and share my code?

Yes! The system provides:
- **Session persistence**: Your code is saved automatically
- **Shareable links**: Generate links to share code with others
- **Code forking**: Create copies of shared code to modify
- **Public gallery**: Browse and discover community code
- **User profiles**: Save code to your personal collection

### Does it work offline?

Partial offline support:
- **JavaScript/HTML/CSS**: Works fully offline after initial load
- **Python**: Requires initial package downloads, then works offline
- **SQL**: Works fully offline with local SQLite database
- **Sharing features**: Require internet connection

## Usage Questions

### How do I create visualizations in Python?

Use Matplotlib for creating plots:

```python
import matplotlib.pyplot as plt
import numpy as np

# Create data
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Create plot
plt.figure(figsize=(10, 6))
plt.plot(x, y, label='sin(x)')
plt.title('Sine Wave')
plt.xlabel('x')
plt.ylabel('y')
plt.legend()
plt.grid(True)
plt.show()  # Important: Always call plt.show()
```

### How do I work with data in Python?

Use Pandas for data manipulation:

```python
import pandas as pd
import numpy as np

# Create sample data
data = {
    'Name': ['Alice', 'Bob', 'Charlie'],
    'Age': [25, 30, 35],
    'Salary': [70000, 80000, 90000]
}

df = pd.DataFrame(data)
print(df)

# Basic operations
print(f"Average age: {df['Age'].mean()}")
print(f"Total salary: ${df['Salary'].sum():,}")
```

### How do I create interactive HTML elements?

Use standard HTML, CSS, and JavaScript:

```html
<div style="padding: 20px; background: #f0f0f0;">
    <h2>Interactive Counter</h2>
    <p>Count: <span id="counter">0</span></p>
    <button onclick="increment()">+</button>
    <button onclick="decrement()">-</button>
</div>

<script>
let count = 0;

function increment() {
    count++;
    document.getElementById('counter').textContent = count;
}

function decrement() {
    count--;
    document.getElementById('counter').textContent = count;
}
</script>
```

### How do I work with databases in SQL?

Create tables and query data:

```sql
-- Create a table
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    salary REAL
);

-- Insert data
INSERT INTO employees (name, department, salary) VALUES
    ('Alice', 'Engineering', 75000),
    ('Bob', 'Marketing', 65000),
    ('Charlie', 'Engineering', 80000);

-- Query data
SELECT department, AVG(salary) as avg_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;
```

## Troubleshooting

### My Python code is running slowly. How can I optimize it?

1. **Use NumPy for numerical operations:**
```python
# Slow: Python loops
result = []
for i in range(100000):
    result.append(i ** 2)

# Fast: NumPy vectorization
import numpy as np
result = np.arange(100000) ** 2
```

2. **Use Pandas for data operations:**
```python
# Slow: Manual iteration
total = 0
for value in data_list:
    if value > 10:
        total += value

# Fast: Pandas operations
import pandas as pd
df = pd.DataFrame({'values': data_list})
total = df[df['values'] > 10]['values'].sum()
```

### My visualization isn't showing up. What's wrong?

Common issues and solutions:

1. **Missing `plt.show()`:**
```python
import matplotlib.pyplot as plt
plt.plot([1, 2, 3], [1, 4, 9])
plt.show()  # This is required!
```

2. **Figure size too small:**
```python
plt.figure(figsize=(10, 6))  # Set appropriate size
plt.plot(data)
plt.show()
```

3. **Multiple plots without clearing:**
```python
# Create separate figures
plt.figure(1)
plt.plot(data1)
plt.show()

plt.figure(2)
plt.plot(data2)
plt.show()
```

### I'm getting "Module not found" errors in Python. What should I do?

1. **Check if the package is available:**
```python
import sys
print([pkg for pkg in sys.modules.keys() if 'numpy' in pkg.lower()])
```

2. **Use correct import names:**
```python
# Correct imports
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn import datasets

# These won't work
import tensorflow  # Not available
import requests    # Network access blocked
```

3. **Install additional packages:**
```python
import micropip
await micropip.install('package-name')
import package_name
```

### My JavaScript code isn't working. How do I debug it?

1. **Check the browser console:**
   - Press F12 to open Developer Tools
   - Look for error messages in the Console tab

2. **Use console.log for debugging:**
```javascript
function myFunction(x) {
    console.log('Input:', x);  // Debug output
    const result = x * 2;
    console.log('Result:', result);  // Debug output
    return result;
}
```

3. **Check for common syntax errors:**
```javascript
// Missing semicolons, brackets, or quotes
console.log("Hello World")  // Missing semicolon
if (x > 5 {  // Missing closing parenthesis
    console.log('Greater');
}
```

## Performance Questions

### How fast is code execution?

Performance varies by language:
- **JavaScript**: Near-native browser performance
- **Python**: 10-50x slower than native Python (WebAssembly overhead)
- **SQL**: Fast for typical queries, slower for complex operations
- **HTML/CSS**: Native browser rendering speed

### Can I run computationally intensive code?

Yes, but with limitations:
- **Memory limit**: 100MB default (configurable)
- **Time limit**: 30-60 seconds depending on language
- **CPU usage**: Shared with browser, may be throttled

For heavy computations:
1. Break work into smaller chunks
2. Use efficient algorithms and data structures
3. Leverage NumPy/Pandas for Python numerical work
4. Consider using Web Workers for JavaScript

### How much data can I process?

Practical limits:
- **Small datasets**: < 10MB work well
- **Medium datasets**: 10-50MB possible with optimization
- **Large datasets**: > 50MB may hit memory limits

Tips for large data:
- Use generators for streaming processing
- Process data in chunks
- Use efficient data formats (NumPy arrays vs Python lists)

## Integration Questions

### Can I embed the code editor in my website?

Yes! Use the LiveCodeBlock component:

```tsx
import { LiveCodeBlock } from '@/components/LiveCodeBlock';

function MyPage() {
    return (
        <LiveCodeBlock
            initialCode="print('Hello, World!')"
            language="python"
            showLineNumbers={true}
            allowLanguageChange={true}
        />
    );
}
```

### Can I customize the appearance?

Yes, the system supports:
- **Themes**: Light and dark modes
- **Syntax highlighting**: Customizable color schemes
- **Layout**: Configurable panel sizes and positions
- **Fonts**: Support for different coding fonts

### Can I add custom languages or features?

The system is extensible:
- **Custom engines**: Implement the `ExecutionEngine` interface
- **Language support**: Add new language parsers and validators
- **UI components**: Create custom editor and output components
- **Plugins**: Extend functionality with plugin system

## Security Questions

### Is it safe to run untrusted code?

The system implements multiple security layers, but you should still be cautious:
- **Sandboxing**: Code runs in isolated environments
- **Resource limits**: Prevents resource exhaustion attacks
- **Network blocking**: External requests are blocked
- **Input validation**: Code is scanned for malicious patterns

However, always review code before running it, especially from untrusted sources.

### Can code access my personal data?

No, the sandboxed execution environment cannot:
- Access your files or file system
- Read cookies or local storage from other sites
- Make network requests to external servers
- Access other browser tabs or windows
- Interact with browser extensions

### How is my code stored?

- **Session data**: Stored locally in browser storage
- **Saved code**: Stored securely on servers with encryption
- **Shared code**: Public code is visible to all users
- **Private code**: Only accessible to you when logged in

## Getting Started

### What's the best way to learn the system?

1. **Start with examples**: Try the built-in code templates
2. **Follow tutorials**: Work through language-specific guides
3. **Experiment**: Modify existing code to see how it works
4. **Join community**: Share code and learn from others
5. **Read documentation**: Comprehensive guides for each language

### Are there any tutorials or learning resources?

Yes! Check out:
- [JavaScript Guide](./guides/javascript.md)
- [Python & Data Science Guide](./guides/python.md)
- [SQL Database Guide](./guides/sql.md)
- [HTML/CSS Guide](./guides/web.md)
- [Examples Repository](./examples/)
- [Video Tutorials](./tutorials/)

### How do I report bugs or request features?

- **GitHub Issues**: Report bugs and request features
- **Community Forum**: Discuss with other users
- **Documentation**: Check if it's already documented
- **Support Email**: Contact support for urgent issues

## Still Have Questions?

If you can't find the answer to your question:

1. **Search the documentation**: Use the search function
2. **Check troubleshooting guide**: Common issues and solutions
3. **Browse examples**: See how others solve similar problems
4. **Ask the community**: Post in forums or chat
5. **Contact support**: Reach out for personalized help

**Useful Links:**
- [Troubleshooting Guide](./troubleshooting.md)
- [API Reference](./api/README.md)
- [Examples Repository](./examples/)
- [GitHub Issues](https://github.com/your-org/ml-dojo/issues)
- [Community Forum](https://community.example.com)