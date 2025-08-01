# Troubleshooting Guide

This guide helps you resolve common issues with the Live Code Execution System.

## Common Issues

### 1. Code Execution Fails

#### Symptoms
- Code doesn't execute when clicking "Run"
- Error message: "Execution failed"
- Infinite loading state

#### Possible Causes & Solutions

**JavaScript/TypeScript Issues:**
```javascript
// ❌ Common mistake: Syntax errors
console.log("Hello World"  // Missing closing parenthesis

// ✅ Correct syntax
console.log("Hello World");
```

**Python Issues:**
```python
# ❌ Common mistake: Indentation errors
def my_function():
print("Hello")  # Incorrect indentation

# ✅ Correct indentation
def my_function():
    print("Hello")
```

**SQL Issues:**
```sql
-- ❌ Common mistake: Missing semicolon
SELECT * FROM users

-- ✅ Correct syntax
SELECT * FROM users;
```

#### Debugging Steps
1. Check browser console for error messages
2. Verify code syntax in your local editor
3. Try running a simple "Hello World" example
4. Clear browser cache and reload

### 2. Python Packages Not Loading

#### Symptoms
- `ModuleNotFoundError` for common packages
- Long loading times for Python execution
- Package import failures

#### Solutions

**Check Available Packages:**
```python
# List all available packages
import sys
print("Available packages:")
for module in sorted(sys.modules.keys()):
    if not module.startswith('_'):
        print(f"  {module}")
```

**Common Package Names:**
```python
# ✅ Correct package names
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import scipy
from sklearn import datasets

# ❌ These won't work (not available in Pyodide)
import tensorflow  # Not available
import torch       # Not available
import requests    # Network access blocked
```

**Manual Package Loading:**
```python
# For packages that need explicit loading
import micropip
await micropip.install('package-name')
```

### 3. Visualization Not Displaying

#### Symptoms
- Matplotlib plots don't appear
- Empty visualization area
- Error: "Figure not found"

#### Solutions

**Matplotlib Configuration:**
```python
import matplotlib.pyplot as plt
import numpy as np

# ✅ Always call plt.show() to display plots
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y)
plt.title('Sine Wave')
plt.show()  # This is required!
```

**Multiple Plots:**
```python
# ✅ Create separate figures for multiple plots
plt.figure(1)
plt.plot([1, 2, 3], [1, 4, 9])
plt.title('Plot 1')
plt.show()

plt.figure(2)
plt.plot([1, 2, 3], [1, 2, 3])
plt.title('Plot 2')
plt.show()
```

### 4. Memory or Timeout Errors

#### Symptoms
- "Execution timed out" error
- "Memory limit exceeded" error
- Browser becomes unresponsive

#### Solutions

**Optimize Code Performance:**
```python
# ❌ Inefficient: Creating large objects
big_list = []
for i in range(1000000):
    big_list.append(i ** 2)

# ✅ Efficient: Use NumPy arrays
import numpy as np
big_array = np.arange(1000000) ** 2
```

**Break Down Large Operations:**
```python
# ❌ Processing all data at once
def process_all_data(data):
    return [expensive_operation(item) for item in data]

# ✅ Process in chunks
def process_data_chunks(data, chunk_size=1000):
    results = []
    for i in range(0, len(data), chunk_size):
        chunk = data[i:i + chunk_size]
        chunk_results = [expensive_operation(item) for item in chunk]
        results.extend(chunk_results)
        print(f"Processed {i + len(chunk)} / {len(data)} items")
    return results
```

**Use Generators for Large Datasets:**
```python
# ✅ Memory-efficient data processing
def process_large_dataset():
    for i in range(1000000):
        yield i ** 2  # Process one item at a time

# Use the generator
for i, value in enumerate(process_large_dataset()):
    if i >= 10:  # Only process first 10 items for demo
        break
    print(value)
```

### 5. SQL Database Issues

#### Symptoms
- "Table doesn't exist" errors
- Query results not displaying
- SQL syntax errors

#### Solutions

**Create Tables First:**
```sql
-- ✅ Always create tables before using them
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE
);

INSERT INTO users (name, email) VALUES 
    ('Alice', 'alice@example.com'),
    ('Bob', 'bob@example.com');

SELECT * FROM users;
```

**Check Table Structure:**
```sql
-- List all tables
SELECT name FROM sqlite_master WHERE type='table';

-- Show table schema
PRAGMA table_info(users);
```

**Common SQL Syntax Issues:**
```sql
-- ❌ Common mistakes
SELECT * FROM users WHERE name = Alice;  -- Missing quotes
SELECT * FROM users WHERE id = '1';     -- Wrong data type

-- ✅ Correct syntax
SELECT * FROM users WHERE name = 'Alice';
SELECT * FROM users WHERE id = 1;
```

### 6. HTML/CSS/JavaScript Issues

#### Symptoms
- HTML not rendering properly
- CSS styles not applying
- JavaScript errors in console

#### Solutions

**HTML Structure:**
```html
<!-- ✅ Proper HTML structure -->
<!DOCTYPE html>
<html>
<head>
    <style>
        .container {
            padding: 20px;
            background-color: #f0f0f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello World</h1>
        <button onclick="handleClick()">Click Me</button>
    </div>
    
    <script>
        function handleClick() {
            alert('Button clicked!');
        }
    </script>
</body>
</html>
```

**CSS Issues:**
```css
/* ❌ Common CSS mistakes */
.my-class {
    color: red
    background: blue;  /* Missing semicolon above */
}

/* ✅ Correct CSS */
.my-class {
    color: red;
    background: blue;
}
```

**JavaScript in HTML:**
```html
<!-- ✅ Proper script placement -->
<script>
    // Wait for DOM to load
    document.addEventListener('DOMContentLoaded', function() {
        const button = document.getElementById('myButton');
        button.addEventListener('click', function() {
            console.log('Button clicked!');
        });
    });
</script>
```

## Performance Issues

### Slow Execution

#### Symptoms
- Code takes a long time to run
- Browser becomes sluggish
- Timeout warnings

#### Solutions

**Profile Your Code:**
```python
import time

def profile_function(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.4f} seconds")
        return result
    return wrapper

@profile_function
def slow_function():
    # Your code here
    time.sleep(1)
    return "Done"

slow_function()
```

**Optimize Loops:**
```python
# ❌ Slow: Python loops
result = []
for i in range(100000):
    result.append(i ** 2)

# ✅ Fast: NumPy vectorization
import numpy as np
result = np.arange(100000) ** 2
```

### Memory Issues

#### Monitor Memory Usage:
```python
import sys

def get_size(obj):
    """Get size of object in bytes"""
    return sys.getsizeof(obj)

# Check memory usage of variables
my_list = list(range(100000))
print(f"List size: {get_size(my_list)} bytes")

import numpy as np
my_array = np.arange(100000)
print(f"Array size: {get_size(my_array)} bytes")
```

## Browser-Specific Issues

### Chrome/Chromium
- **Issue**: WebAssembly loading errors
- **Solution**: Enable WebAssembly in chrome://flags
- **Issue**: CORS errors in local development
- **Solution**: Use `--disable-web-security` flag (development only)

### Firefox
- **Issue**: Slower Python execution
- **Solution**: Enable WebAssembly optimizations in about:config
- **Issue**: SharedArrayBuffer warnings
- **Solution**: These are informational and can be ignored

### Safari
- **Issue**: Limited WebAssembly support
- **Solution**: Update to latest Safari version
- **Issue**: Visualization rendering issues
- **Solution**: Use compatibility mode for older Safari versions

## Error Messages Reference

### Common Error Messages and Solutions

**"Execution timed out after X seconds"**
- Reduce computation complexity
- Break large operations into smaller chunks
- Use more efficient algorithms

**"Memory limit exceeded"**
- Use generators instead of lists for large datasets
- Delete unused variables with `del variable_name`
- Use NumPy arrays instead of Python lists

**"No engine available for language: X"**
- Check if the language is supported
- Verify correct language identifier
- Try refreshing the page

**"Code cannot be empty"**
- Ensure code input is not empty
- Check for whitespace-only code
- Verify code is properly formatted

**"Invalid syntax"**
- Check for missing brackets, quotes, or semicolons
- Verify proper indentation (Python)
- Use a syntax checker in your editor

## Getting Help

### Debug Information to Collect

When reporting issues, please include:

1. **Browser Information:**
   ```javascript
   console.log('Browser:', navigator.userAgent);
   console.log('WebAssembly supported:', typeof WebAssembly !== 'undefined');
   ```

2. **Code Sample:**
   - Minimal code that reproduces the issue
   - Expected vs actual behavior

3. **Error Messages:**
   - Full error message from console
   - Any network errors in browser dev tools

4. **Environment:**
   - Operating system
   - Browser version
   - Any browser extensions that might interfere

### Self-Diagnosis Steps

1. **Test with Simple Code:**
   ```python
   print("Hello, World!")
   ```

2. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for error messages in Console tab
   - Check Network tab for failed requests

3. **Try Different Languages:**
   - Test if issue is language-specific
   - Try the same logic in different languages

4. **Clear Browser Data:**
   - Clear cache and cookies
   - Disable browser extensions
   - Try incognito/private mode

### Contact Support

If you're still experiencing issues:

1. **GitHub Issues**: Report bugs and feature requests
2. **Documentation**: Check the latest documentation
3. **Community Forum**: Ask questions and share solutions
4. **Stack Overflow**: Tag questions with `live-code-execution`

### Useful Resources

- [Browser Compatibility Guide](./browser-compatibility.md)
- [Performance Optimization Guide](./performance.md)
- [Security Best Practices](./security.md)
- [API Reference](./api/README.md)
- [Examples Repository](./examples/)