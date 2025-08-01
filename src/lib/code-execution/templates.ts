/**
 * Language-specific templates and examples for the Live Code Execution System
 */

import { SupportedLanguage } from './types';

// Re-export SupportedLanguage for convenience
export type { SupportedLanguage } from './types';

export interface CodeTemplate {
  id: string;
  title: string;
  description: string;
  code: string;
  category: 'starter' | 'example' | 'tutorial' | 'advanced';
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface LanguageTemplates {
  language: SupportedLanguage;
  templates: CodeTemplate[];
}

// JavaScript Templates
const JAVASCRIPT_TEMPLATES: CodeTemplate[] = [
  {
    id: 'js-hello-world',
    title: 'Hello World',
    description: 'Basic JavaScript console output',
    code: `// Welcome to JavaScript!
console.log("Hello, World!");

// Try changing the message
console.log("JavaScript is awesome!");`,
    category: 'starter',
    tags: ['console', 'basics'],
    difficulty: 'beginner'
  },
  {
    id: 'js-variables',
    title: 'Variables and Data Types',
    description: 'Learn about JavaScript variables and data types',
    code: `// Variables in JavaScript
let name = "Alice";
const age = 25;
var isStudent = true;

// Different data types
let number = 42;
let text = "Hello";
let boolean = true;
let array = [1, 2, 3, 4, 5];
let object = { name: "Bob", age: 30 };

console.log("Name:", name);
console.log("Age:", age);
console.log("Is student:", isStudent);
console.log("Array:", array);
console.log("Object:", object);`,
    category: 'tutorial',
    tags: ['variables', 'data-types', 'basics'],
    difficulty: 'beginner'
  },
  {
    id: 'js-functions',
    title: 'Functions',
    description: 'Creating and using functions in JavaScript',
    code: `// Function declaration
function greet(name) {
    return "Hello, " + name + "!";
}

// Arrow function
const add = (a, b) => a + b;

// Function with default parameters
function introduce(name, age = 25) {
    return \`Hi, I'm \${name} and I'm \${age} years old.\`;
}

// Using the functions
console.log(greet("Alice"));
console.log("5 + 3 =", add(5, 3));
console.log(introduce("Bob"));
console.log(introduce("Carol", 30));`,
    category: 'tutorial',
    tags: ['functions', 'arrow-functions', 'parameters'],
    difficulty: 'beginner'
  },
  {
    id: 'js-dom-manipulation',
    title: 'DOM Manipulation',
    description: 'Working with HTML elements using JavaScript',
    code: `// Create a new element
const heading = document.createElement('h1');
heading.textContent = 'Dynamic Content!';
heading.style.color = 'blue';

// Create a button with event listener
const button = document.createElement('button');
button.textContent = 'Click me!';
button.onclick = function() {
    alert('Button clicked!');
    heading.style.color = heading.style.color === 'blue' ? 'red' : 'blue';
};

// Add elements to the page
document.body.appendChild(heading);
document.body.appendChild(button);

console.log('DOM elements created successfully!');`,
    category: 'example',
    tags: ['dom', 'events', 'interactive'],
    difficulty: 'intermediate'
  },
  {
    id: 'js-async-await',
    title: 'Async/Await',
    description: 'Working with asynchronous JavaScript',
    code: `// Simulate an API call
function fetchUserData(userId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: userId,
                name: "User " + userId,
                email: \`user\${userId}@example.com\`
            });
        }, 1000);
    });
}

// Using async/await
async function displayUser() {
    console.log("Fetching user data...");
    
    try {
        const user = await fetchUserData(123);
        console.log("User data:", user);
        
        // Display user info
        const userDiv = document.createElement('div');
        userDiv.innerHTML = \`
            <h3>\${user.name}</h3>
            <p>Email: \${user.email}</p>
        \`;
        document.body.appendChild(userDiv);
        
    } catch (error) {
        console.error("Error fetching user:", error);
    }
}

displayUser();`,
    category: 'advanced',
    tags: ['async', 'promises', 'api'],
    difficulty: 'advanced'
  }
];

// HTML Templates
const HTML_TEMPLATES: CodeTemplate[] = [
  {
    id: 'html-basic-page',
    title: 'Basic HTML Page',
    description: 'A simple HTML page structure',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First Page</title>
</head>
<body>
    <h1>Welcome to HTML!</h1>
    <p>This is a paragraph of text.</p>
    
    <h2>Lists</h2>
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
    </ul>
    
    <a href="https://developer.mozilla.org/en-US/docs/Web/HTML">Learn more about HTML</a>
</body>
</html>`,
    category: 'starter',
    tags: ['structure', 'basics', 'elements'],
    difficulty: 'beginner'
  },
  {
    id: 'html-form',
    title: 'HTML Form',
    description: 'Creating forms with various input types',
    code: `<!DOCTYPE html>
<html>
<head>
    <title>Contact Form</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>Contact Us</h1>
    <form>
        <div class="form-group">
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" required>
        </div>
        
        <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
        </div>
        
        <div class="form-group">
            <label for="subject">Subject:</label>
            <select id="subject" name="subject">
                <option value="general">General Inquiry</option>
                <option value="support">Support</option>
                <option value="feedback">Feedback</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="message">Message:</label>
            <textarea id="message" name="message" rows="5" required></textarea>
        </div>
        
        <button type="submit">Send Message</button>
    </form>
</body>
</html>`,
    category: 'example',
    tags: ['forms', 'inputs', 'styling'],
    difficulty: 'intermediate'
  },
  {
    id: 'html-responsive-layout',
    title: 'Responsive Layout',
    description: 'Modern responsive HTML layout with CSS Grid',
    code: `<!DOCTYPE html>
<html>
<head>
    <title>Responsive Layout</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        
        .container {
            display: grid;
            grid-template-areas: 
                "header header"
                "nav main"
                "footer footer";
            grid-template-rows: auto 1fr auto;
            grid-template-columns: 200px 1fr;
            min-height: 100vh;
            gap: 10px;
            padding: 10px;
        }
        
        .header { grid-area: header; background: #333; color: white; padding: 20px; text-align: center; }
        .nav { grid-area: nav; background: #f4f4f4; padding: 20px; }
        .main { grid-area: main; background: white; padding: 20px; }
        .footer { grid-area: footer; background: #333; color: white; padding: 20px; text-align: center; }
        
        .nav ul { list-style: none; }
        .nav li { margin-bottom: 10px; }
        .nav a { text-decoration: none; color: #333; }
        .nav a:hover { color: #007bff; }
        
        @media (max-width: 768px) {
            .container {
                grid-template-areas: 
                    "header"
                    "nav"
                    "main"
                    "footer";
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>My Website</h1>
        </header>
        
        <nav class="nav">
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
        
        <main class="main">
            <h2>Welcome!</h2>
            <p>This is a responsive layout using CSS Grid. Try resizing your browser window to see how it adapts to different screen sizes.</p>
            
            <h3>Features:</h3>
            <ul>
                <li>CSS Grid layout</li>
                <li>Responsive design</li>
                <li>Mobile-friendly navigation</li>
                <li>Clean, modern styling</li>
            </ul>
        </main>
        
        <footer class="footer">
            <p>&copy; 2024 My Website. All rights reserved.</p>
        </footer>
    </div>
</body>
</html>`,
    category: 'advanced',
    tags: ['responsive', 'css-grid', 'layout', 'mobile'],
    difficulty: 'advanced'
  }
];

// CSS Templates
const CSS_TEMPLATES: CodeTemplate[] = [
  {
    id: 'css-basics',
    title: 'CSS Basics',
    description: 'Fundamental CSS styling concepts',
    code: `/* CSS Basics - Styling HTML elements */

/* Element selector */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

/* Class selector */
.highlight {
    background-color: yellow;
    padding: 5px;
    border-radius: 3px;
}

/* ID selector */
#main-title {
    color: #333;
    text-align: center;
    margin-bottom: 30px;
}

/* Descendant selector */
.container p {
    line-height: 1.6;
    margin-bottom: 15px;
}

/* Pseudo-class selector */
a:hover {
    color: #007bff;
    text-decoration: underline;
}

/* Multiple selectors */
h1, h2, h3 {
    color: #2c3e50;
}`,
    category: 'starter',
    tags: ['selectors', 'properties', 'basics'],
    difficulty: 'beginner'
  },
  {
    id: 'css-flexbox',
    title: 'Flexbox Layout',
    description: 'Creating flexible layouts with CSS Flexbox',
    code: `/* Flexbox Layout Examples */

.flex-container {
    display: flex;
    background-color: #f1f1f1;
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 8px;
}

/* Basic flex items */
.flex-item {
    background-color: #4CAF50;
    color: white;
    padding: 20px;
    margin: 5px;
    text-align: center;
    border-radius: 4px;
}

/* Justify content examples */
.justify-center {
    justify-content: center;
}

.justify-between {
    justify-content: space-between;
}

.justify-around {
    justify-content: space-around;
}

/* Align items examples */
.align-center {
    align-items: center;
    height: 100px;
}

/* Flex direction */
.flex-column {
    flex-direction: column;
}

/* Flex grow and shrink */
.flex-grow {
    flex-grow: 1;
}

.flex-shrink {
    flex-shrink: 2;
}

/* Responsive flex */
@media (max-width: 600px) {
    .flex-container {
        flex-direction: column;
    }
}`,
    category: 'tutorial',
    tags: ['flexbox', 'layout', 'responsive'],
    difficulty: 'intermediate'
  },
  {
    id: 'css-animations',
    title: 'CSS Animations',
    description: 'Creating smooth animations and transitions',
    code: `/* CSS Animations and Transitions */

/* Transition example */
.button {
    background-color: #007bff;
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.button:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

/* Keyframe animation */
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

.fade-in {
    animation: fadeInUp 0.6s ease-out;
}

/* Pulse animation */
@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
    100% {
        transform: scale(1);
    }
}

.pulse {
    animation: pulse 2s infinite;
}

/* Rotate animation */
@keyframes rotate {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: rotate 1s linear infinite;
}

/* Hover effects */
.card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.15);
}`,
    category: 'advanced',
    tags: ['animations', 'transitions', 'keyframes', 'effects'],
    difficulty: 'advanced'
  }
];

// Python Templates
const PYTHON_TEMPLATES: CodeTemplate[] = [
  {
    id: 'python-hello-world',
    title: 'Hello World',
    description: 'Your first Python program',
    code: `# Welcome to Python!
print("Hello, World!")

# Variables and basic operations
name = "Python"
version = 3.9
is_awesome = True

print(f"Language: {name}")
print(f"Version: {version}")
print(f"Is awesome: {is_awesome}")

# Simple calculation
x = 10
y = 5
result = x + y
print(f"{x} + {y} = {result}")`,
    category: 'starter',
    tags: ['print', 'variables', 'basics'],
    difficulty: 'beginner'
  },
  {
    id: 'python-data-structures',
    title: 'Data Structures',
    description: 'Working with lists, dictionaries, and sets',
    code: `# Lists
fruits = ["apple", "banana", "orange", "grape"]
print("Fruits:", fruits)
print("First fruit:", fruits[0])
print("Last fruit:", fruits[-1])

# Add and remove items
fruits.append("kiwi")
fruits.remove("banana")
print("Updated fruits:", fruits)

# List comprehension
squares = [x**2 for x in range(1, 6)]
print("Squares:", squares)

# Dictionaries
person = {
    "name": "Alice",
    "age": 30,
    "city": "New York",
    "hobbies": ["reading", "swimming", "coding"]
}

print("\\nPerson info:")
for key, value in person.items():
    print(f"{key}: {value}")

# Sets
colors = {"red", "green", "blue", "red"}  # Duplicates are removed
print("\\nColors:", colors)

# Set operations
primary_colors = {"red", "blue", "yellow"}
secondary_colors = {"green", "orange", "purple"}
all_colors = primary_colors.union(secondary_colors)
print("All colors:", all_colors)`,
    category: 'tutorial',
    tags: ['lists', 'dictionaries', 'sets', 'data-structures'],
    difficulty: 'beginner'
  },
  {
    id: 'python-functions-classes',
    title: 'Functions and Classes',
    description: 'Creating reusable code with functions and classes',
    code: `# Functions
def greet(name, greeting="Hello"):
    """Greet someone with a custom message."""
    return f"{greeting}, {name}!"

def calculate_area(length, width):
    """Calculate the area of a rectangle."""
    return length * width

# Using functions
print(greet("Alice"))
print(greet("Bob", "Hi"))
print(f"Area: {calculate_area(5, 3)}")

# Classes
class Dog:
    def __init__(self, name, breed, age):
        self.name = name
        self.breed = breed
        self.age = age
    
    def bark(self):
        return f"{self.name} says Woof!"
    
    def get_info(self):
        return f"{self.name} is a {self.age}-year-old {self.breed}"
    
    def have_birthday(self):
        self.age += 1
        return f"Happy birthday {self.name}! Now {self.age} years old."

# Create and use objects
my_dog = Dog("Buddy", "Golden Retriever", 3)
print(my_dog.get_info())
print(my_dog.bark())
print(my_dog.have_birthday())

# Another dog
other_dog = Dog("Max", "German Shepherd", 5)
print(other_dog.get_info())`,
    category: 'tutorial',
    tags: ['functions', 'classes', 'objects', 'methods'],
    difficulty: 'intermediate'
  },
  {
    id: 'python-data-analysis',
    title: 'Data Analysis with Pandas',
    description: 'Analyzing data using pandas library',
    code: `import pandas as pd
import numpy as np

# Create sample data
data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
    'Age': [25, 30, 35, 28, 32],
    'City': ['New York', 'London', 'Tokyo', 'Paris', 'Sydney'],
    'Salary': [50000, 60000, 75000, 55000, 65000],
    'Department': ['IT', 'Finance', 'IT', 'HR', 'Finance']
}

# Create DataFrame
df = pd.DataFrame(data)
print("Employee Data:")
print(df)

print("\\nDataFrame Info:")
print(f"Shape: {df.shape}")
print(f"Columns: {list(df.columns)}")

print("\\nBasic Statistics:")
print(df.describe())

print("\\nDepartment Counts:")
print(df['Department'].value_counts())

print("\\nAverage Salary by Department:")
avg_salary = df.groupby('Department')['Salary'].mean()
print(avg_salary)

print("\\nEmployees over 30:")
older_employees = df[df['Age'] > 30]
print(older_employees[['Name', 'Age', 'City']])

# Add a new column
df['Salary_Category'] = df['Salary'].apply(
    lambda x: 'High' if x > 60000 else 'Medium' if x > 50000 else 'Low'
)

print("\\nWith Salary Categories:")
print(df[['Name', 'Salary', 'Salary_Category']])`,
    category: 'example',
    tags: ['pandas', 'data-analysis', 'dataframes'],
    difficulty: 'intermediate'
  },
  {
    id: 'python-visualization',
    title: 'Data Visualization',
    description: 'Creating charts and plots with matplotlib',
    code: `import matplotlib.pyplot as plt
import numpy as np

# Sample data
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
sales = [20, 35, 30, 35, 27, 40]
expenses = [15, 25, 20, 30, 22, 35]

# Create subplots
fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))

# Line plot
ax1.plot(months, sales, marker='o', label='Sales', color='blue')
ax1.plot(months, expenses, marker='s', label='Expenses', color='red')
ax1.set_title('Monthly Sales vs Expenses')
ax1.set_ylabel('Amount (thousands)')
ax1.legend()
ax1.grid(True, alpha=0.3)

# Bar chart
ax2.bar(months, sales, alpha=0.7, color='skyblue', label='Sales')
ax2.bar(months, expenses, alpha=0.7, color='lightcoral', label='Expenses')
ax2.set_title('Monthly Comparison')
ax2.set_ylabel('Amount (thousands)')
ax2.legend()

# Pie chart
departments = ['IT', 'Finance', 'HR', 'Marketing']
employees = [25, 15, 10, 20]
colors = ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99']

ax3.pie(employees, labels=departments, colors=colors, autopct='%1.1f%%', startangle=90)
ax3.set_title('Employee Distribution by Department')

# Scatter plot with trend
x = np.array([1, 2, 3, 4, 5, 6])
y = np.array(sales)
z = np.polyfit(x, y, 1)
p = np.poly1d(z)

ax4.scatter(x, y, color='blue', s=100, alpha=0.7)
ax4.plot(x, p(x), "r--", alpha=0.8, label=f'Trend: y={z[0]:.1f}x+{z[1]:.1f}')
ax4.set_title('Sales Trend Analysis')
ax4.set_xlabel('Month')
ax4.set_ylabel('Sales (thousands)')
ax4.legend()
ax4.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()

print("Charts created successfully!")
print(f"Average sales: {np.mean(sales):.1f}k")
print(f"Total employees: {sum(employees)}")`,
    category: 'advanced',
    tags: ['matplotlib', 'visualization', 'charts', 'plots'],
    difficulty: 'advanced'
  }
];

// SQL Templates
const SQL_TEMPLATES: CodeTemplate[] = [
  {
    id: 'sql-basic-queries',
    title: 'Basic SQL Queries',
    description: 'Fundamental SELECT statements and filtering',
    code: `-- Basic SELECT query
SELECT * FROM employees LIMIT 5;

-- Select specific columns
SELECT name, department, salary FROM employees;

-- Filter with WHERE clause
SELECT name, salary 
FROM employees 
WHERE salary > 70000;

-- Sort results
SELECT name, department, salary 
FROM employees 
ORDER BY salary DESC;

-- Filter by department
SELECT name, salary 
FROM employees 
WHERE department = 'Engineering'
ORDER BY salary DESC;`,
    category: 'starter',
    tags: ['select', 'where', 'order-by', 'basics'],
    difficulty: 'beginner'
  },
  {
    id: 'sql-joins',
    title: 'JOIN Operations',
    description: 'Combining data from multiple tables',
    code: `-- Inner JOIN - employees with their department info
SELECT 
    e.name as employee_name,
    e.salary,
    d.name as department_name,
    d.budget as department_budget
FROM employees e
INNER JOIN departments d ON e.department = d.name;

-- LEFT JOIN - all employees, even if department doesn't exist
SELECT 
    e.name,
    e.department,
    d.budget
FROM employees e
LEFT JOIN departments d ON e.department = d.name;

-- Multiple JOINs - employees, departments, and projects
SELECT 
    e.name as employee,
    d.name as department,
    p.name as project,
    p.start_date
FROM employees e
JOIN departments d ON e.department = d.name
JOIN projects p ON d.id = p.department_id
ORDER BY e.name;`,
    category: 'tutorial',
    tags: ['joins', 'inner-join', 'left-join', 'multiple-tables'],
    difficulty: 'intermediate'
  },
  {
    id: 'sql-aggregation',
    title: 'Aggregation and Grouping',
    description: 'Using GROUP BY and aggregate functions',
    code: `-- Count employees by department
SELECT 
    department,
    COUNT(*) as employee_count
FROM employees
GROUP BY department
ORDER BY employee_count DESC;

-- Salary statistics by department
SELECT 
    department,
    COUNT(*) as employee_count,
    AVG(salary) as avg_salary,
    MIN(salary) as min_salary,
    MAX(salary) as max_salary,
    SUM(salary) as total_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;

-- Filter groups with HAVING
SELECT 
    department,
    COUNT(*) as employee_count,
    AVG(salary) as avg_salary
FROM employees
GROUP BY department
HAVING COUNT(*) > 1 AND AVG(salary) > 65000
ORDER BY avg_salary DESC;

-- Year-based analysis
SELECT 
    strftime('%Y', hire_date) as hire_year,
    COUNT(*) as hires,
    AVG(salary) as avg_starting_salary
FROM employees
GROUP BY strftime('%Y', hire_date)
ORDER BY hire_year;`,
    category: 'tutorial',
    tags: ['group-by', 'aggregation', 'having', 'functions'],
    difficulty: 'intermediate'
  },
  {
    id: 'sql-advanced-queries',
    title: 'Advanced SQL Techniques',
    description: 'Window functions, subqueries, and complex operations',
    code: `-- Window functions for ranking
SELECT 
    name,
    department,
    salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank,
    DENSE_RANK() OVER (ORDER BY salary DESC) as overall_rank,
    AVG(salary) OVER (PARTITION BY department) as dept_avg_salary
FROM employees
ORDER BY department, salary DESC;

-- Running totals and moving averages
SELECT 
    name,
    hire_date,
    salary,
    SUM(salary) OVER (ORDER BY hire_date) as running_total,
    AVG(salary) OVER (ORDER BY hire_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as moving_avg
FROM employees
ORDER BY hire_date;

-- Subqueries - employees earning above department average
SELECT 
    name,
    department,
    salary,
    (SELECT AVG(salary) FROM employees e2 WHERE e2.department = e1.department) as dept_avg
FROM employees e1
WHERE salary > (
    SELECT AVG(salary) 
    FROM employees e2 
    WHERE e2.department = e1.department
)
ORDER BY department, salary DESC;

-- Common Table Expression (CTE)
WITH department_stats AS (
    SELECT 
        department,
        AVG(salary) as avg_salary,
        COUNT(*) as employee_count
    FROM employees
    GROUP BY department
),
high_paying_depts AS (
    SELECT department
    FROM department_stats
    WHERE avg_salary > 70000
)
SELECT 
    e.name,
    e.department,
    e.salary,
    ds.avg_salary as dept_average
FROM employees e
JOIN department_stats ds ON e.department = ds.department
WHERE e.department IN (SELECT department FROM high_paying_depts)
ORDER BY e.department, e.salary DESC;`,
    category: 'advanced',
    tags: ['window-functions', 'subqueries', 'cte', 'ranking'],
    difficulty: 'advanced'
  },
  {
    id: 'sql-data-modification',
    title: 'Data Modification',
    description: 'INSERT, UPDATE, DELETE, and table creation',
    code: `-- Create a new table
CREATE TABLE projects_temp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department_id INTEGER,
    budget DECIMAL(10,2),
    status TEXT DEFAULT 'Planning',
    created_date DATE DEFAULT CURRENT_DATE
);

-- Insert single record
INSERT INTO projects_temp (name, department_id, budget, status)
VALUES ('Website Redesign', 1, 50000.00, 'Active');

-- Insert multiple records
INSERT INTO projects_temp (name, department_id, budget, status) VALUES
    ('Mobile App Development', 1, 75000.00, 'Planning'),
    ('Marketing Campaign', 2, 25000.00, 'Active'),
    ('HR System Upgrade', 4, 30000.00, 'Planning');

-- View inserted data
SELECT * FROM projects_temp;

-- Update records
UPDATE projects_temp 
SET status = 'Active', budget = budget * 1.1 
WHERE status = 'Planning';

-- Update with JOIN (increase budget for IT projects)
UPDATE projects_temp 
SET budget = budget * 1.2 
WHERE department_id = (
    SELECT id FROM departments WHERE name = 'Engineering'
);

-- View updated data
SELECT 
    p.name as project_name,
    d.name as department,
    p.budget,
    p.status
FROM projects_temp p
LEFT JOIN departments d ON p.department_id = d.id;

-- Delete completed projects (none exist yet, so this won't delete anything)
DELETE FROM projects_temp WHERE status = 'Completed';

-- Show final results
SELECT 
    COUNT(*) as total_projects,
    SUM(budget) as total_budget,
    AVG(budget) as avg_budget
FROM projects_temp;`,
    category: 'example',
    tags: ['insert', 'update', 'delete', 'create-table', 'data-modification'],
    difficulty: 'intermediate'
  }
];

// Additional language templates (JSON, YAML, etc.)
const JSON_TEMPLATES: CodeTemplate[] = [
  {
    id: 'json-basic',
    title: 'JSON Basics',
    description: 'Understanding JSON structure and syntax',
    code: `{
  "name": "John Doe",
  "age": 30,
  "isEmployed": true,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001"
  },
  "hobbies": ["reading", "swimming", "coding"],
  "spouse": null,
  "children": [
    {
      "name": "Alice",
      "age": 8
    },
    {
      "name": "Bob",
      "age": 5
    }
  ]
}`,
    category: 'starter',
    tags: ['syntax', 'structure', 'basics'],
    difficulty: 'beginner'
  },
  {
    id: 'json-api-response',
    title: 'API Response Format',
    description: 'Common JSON structure for API responses',
    code: `{
  "status": "success",
  "message": "Data retrieved successfully",
  "data": {
    "users": [
      {
        "id": 1,
        "username": "alice_smith",
        "email": "alice@example.com",
        "profile": {
          "firstName": "Alice",
          "lastName": "Smith",
          "avatar": "https://example.com/avatars/alice.jpg",
          "joinDate": "2023-01-15T10:30:00Z"
        },
        "preferences": {
          "theme": "dark",
          "notifications": {
            "email": true,
            "push": false,
            "sms": true
          }
        }
      },
      {
        "id": 2,
        "username": "bob_jones",
        "email": "bob@example.com",
        "profile": {
          "firstName": "Bob",
          "lastName": "Jones",
          "avatar": "https://example.com/avatars/bob.jpg",
          "joinDate": "2023-02-20T14:45:00Z"
        },
        "preferences": {
          "theme": "light",
          "notifications": {
            "email": false,
            "push": true,
            "sms": false
          }
        }
      }
    ]
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  },
  "timestamp": "2024-01-15T12:00:00Z"
}`,
    category: 'example',
    tags: ['api', 'response', 'pagination', 'structure'],
    difficulty: 'intermediate'
  }
];

const YAML_TEMPLATES: CodeTemplate[] = [
  {
    id: 'yaml-config',
    title: 'Configuration File',
    description: 'YAML configuration file structure',
    code: `# Application Configuration
app:
  name: "My Web App"
  version: "1.2.3"
  debug: false
  port: 8080

# Database Configuration
database:
  host: "localhost"
  port: 5432
  name: "myapp_db"
  username: "dbuser"
  password: "secure_password"
  ssl: true
  pool:
    min: 5
    max: 20
    timeout: 30

# Cache Configuration
cache:
  type: "redis"
  host: "localhost"
  port: 6379
  ttl: 3600  # 1 hour in seconds

# Logging Configuration
logging:
  level: "info"
  format: "json"
  outputs:
    - type: "console"
    - type: "file"
      path: "/var/log/app.log"
      max_size: "100MB"
      max_files: 5

# Feature Flags
features:
  new_ui: true
  beta_features: false
  analytics: true

# External Services
services:
  email:
    provider: "sendgrid"
    api_key: "\${EMAIL_API_KEY}"
  payment:
    provider: "stripe"
    public_key: "\${STRIPE_PUBLIC_KEY}"
    secret_key: "\${STRIPE_SECRET_KEY}"

# Environment-specific settings
environments:
  development:
    debug: true
    database:
      host: "localhost"
  production:
    debug: false
    database:
      host: "prod-db.example.com"`,
    category: 'example',
    tags: ['configuration', 'structure', 'environment'],
    difficulty: 'intermediate'
  }
];

// Markdown Templates
const MARKDOWN_TEMPLATES: CodeTemplate[] = [
  {
    id: 'markdown-basics',
    title: 'Markdown Basics',
    description: 'Essential Markdown syntax and formatting',
    code: `# Markdown Basics

## Text Formatting

**Bold text** and *italic text* and ***bold italic***

~~Strikethrough text~~

## Lists

### Unordered List
- Item 1
- Item 2
  - Nested item
  - Another nested item
- Item 3

### Ordered List
1. First item
2. Second item
3. Third item

## Links and Images

[Link to Google](https://google.com)

![Alt text for image](https://via.placeholder.com/150)

## Code

Inline \`code\` example.

\`\`\`javascript
// Code block example
function greet(name) {
    return "Hello, " + name + "!";
}
\`\`\`

## Tables

| Name | Age | City |
|------|-----|------|
| Alice | 25 | New York |
| Bob | 30 | London |

## Blockquotes

> This is a blockquote.
> It can span multiple lines.

## Horizontal Rule

---

That's the basics of Markdown!`,
    category: 'starter',
    tags: ['syntax', 'formatting', 'basics'],
    difficulty: 'beginner'
  },
  {
    id: 'markdown-documentation',
    title: 'Project Documentation',
    description: 'Complete project documentation template',
    code: `# Project Name

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://example.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-orange)](https://github.com/user/repo/releases)

A brief description of what this project does and who it's for.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/username/project-name.git

# Navigate to project directory
cd project-name

# Install dependencies
npm install
\`\`\`

## Usage

### Basic Example

\`\`\`javascript
import { ProjectName } from 'project-name';

const instance = new ProjectName({
  apiKey: 'your-api-key',
  environment: 'production'
});

const result = await instance.doSomething();
console.log(result);
\`\`\`

### Advanced Configuration

\`\`\`javascript
const config = {
  timeout: 5000,
  retries: 3,
  debug: true
};

const instance = new ProjectName(config);
\`\`\`

## API Reference

### \`ProjectName(options)\`

Creates a new instance of ProjectName.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| \`options\` | Object | Configuration options |
| \`options.apiKey\` | string | Your API key |
| \`options.environment\` | string | Environment (development/production) |

#### Returns

Returns a new ProjectName instance.

### \`instance.doSomething(data)\`

Performs the main operation.

#### Parameters

- \`data\` (Object): The data to process

#### Returns

- Promise<Object>: The processed result

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Hat tip to anyone whose code was used
- Inspiration
- etc`,
    category: 'example',
    tags: ['documentation', 'readme', 'project'],
    difficulty: 'intermediate'
  }
];

// Regex Templates
const REGEX_TEMPLATES: CodeTemplate[] = [
  {
    id: 'regex-basics',
    title: 'Regex Basics',
    description: 'Common regular expression patterns',
    code: `\\d+|||123 456 789|||g`,
    category: 'starter',
    tags: ['patterns', 'basics', 'digits'],
    difficulty: 'beginner'
  },
  {
    id: 'regex-email',
    title: 'Email Validation',
    description: 'Pattern to match email addresses',
    code: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}|||user@example.com, test.email+tag@domain.co.uk, invalid.email|||g`,
    category: 'example',
    tags: ['email', 'validation', 'pattern'],
    difficulty: 'intermediate'
  },
  {
    id: 'regex-phone',
    title: 'Phone Number',
    description: 'Pattern to match US phone numbers',
    code: `\\(?\\d{3}\\)?[-\\s]?\\d{3}[-\\s]?\\d{4}|||Call me at (555) 123-4567 or 555.123.4567|||g`,
    category: 'example',
    tags: ['phone', 'validation', 'numbers'],
    difficulty: 'intermediate'
  },
  {
    id: 'regex-url',
    title: 'URL Matching',
    description: 'Pattern to match URLs',
    code: `https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)|||Visit https://www.example.com or http://test.org/path?query=value|||g`,
    category: 'example',
    tags: ['url', 'web', 'links'],
    difficulty: 'intermediate'
  }
];

// Bash Templates
const BASH_TEMPLATES: CodeTemplate[] = [
  {
    id: 'bash-basics',
    title: 'Bash Basics',
    description: 'Basic bash commands and scripting',
    code: `#!/bin/bash

# Basic commands
echo "Hello, World!"
echo "Current date: $(date)"
echo "Current user: $(whoami)"
echo "Current directory: $(pwd)"

# Variables
name="Alice"
age=25
echo "Name: $name, Age: $age"

# Command substitution
files=$(ls -1 | wc -l)
echo "Number of files: $files"`,
    category: 'starter',
    tags: ['commands', 'variables', 'basics'],
    difficulty: 'beginner'
  },
  {
    id: 'bash-script',
    title: 'Bash Script Example',
    description: 'A complete bash script with functions and logic',
    code: `#!/bin/bash

# Function to check if a file exists
check_file() {
    if [ -f "$1" ]; then
        echo "File $1 exists"
        return 0
    else
        echo "File $1 does not exist"
        return 1
    fi
}

# Function to create backup
create_backup() {
    local source="$1"
    local backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
    
    mkdir -p "$backup_dir"
    cp -r "$source" "$backup_dir/"
    echo "Backup created in $backup_dir"
}

# Main script
echo "=== Backup Script ==="
echo "Starting backup process..."

# Check if source directory exists
if [ $# -eq 0 ]; then
    echo "Usage: $0 <source_directory>"
    exit 1
fi

source_dir="$1"

if [ -d "$source_dir" ]; then
    create_backup "$source_dir"
    echo "Backup completed successfully!"
else
    echo "Error: Source directory '$source_dir' not found"
    exit 1
fi`,
    category: 'example',
    tags: ['scripting', 'functions', 'backup'],
    difficulty: 'intermediate'
  }
];

// Export all templates organized by language
export const LANGUAGE_TEMPLATES: Record<SupportedLanguage, CodeTemplate[]> = {
  javascript: JAVASCRIPT_TEMPLATES,
  typescript: JAVASCRIPT_TEMPLATES, // TypeScript can use JS examples
  html: HTML_TEMPLATES,
  css: CSS_TEMPLATES,
  python: PYTHON_TEMPLATES,
  sql: SQL_TEMPLATES,
  json: JSON_TEMPLATES,
  yaml: YAML_TEMPLATES,
  markdown: MARKDOWN_TEMPLATES,
  regex: REGEX_TEMPLATES,
  bash: BASH_TEMPLATES
};

// Helper functions
export function getTemplatesForLanguage(language: SupportedLanguage): CodeTemplate[] {
  return LANGUAGE_TEMPLATES[language] || [];
}

export function getTemplateById(templateId: string): CodeTemplate | undefined {
  for (const templates of Object.values(LANGUAGE_TEMPLATES)) {
    const template = templates.find(t => t.id === templateId);
    if (template) return template;
  }
  return undefined;
}

export function getTemplatesByCategory(category: CodeTemplate['category']): CodeTemplate[] {
  const allTemplates: CodeTemplate[] = [];
  for (const templates of Object.values(LANGUAGE_TEMPLATES)) {
    allTemplates.push(...templates.filter(t => t.category === category));
  }
  return allTemplates;
}

export function getTemplatesByTag(tag: string): CodeTemplate[] {
  const allTemplates: CodeTemplate[] = [];
  for (const templates of Object.values(LANGUAGE_TEMPLATES)) {
    allTemplates.push(...templates.filter(t => t.tags.includes(tag)));
  }
  return allTemplates;
}

export function searchTemplates(query: string): CodeTemplate[] {
  const allTemplates: CodeTemplate[] = [];
  for (const templates of Object.values(LANGUAGE_TEMPLATES)) {
    allTemplates.push(...templates);
  }
  
  const lowerQuery = query.toLowerCase();
  return allTemplates.filter(template => 
    template.title.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}