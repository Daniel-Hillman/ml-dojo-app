# Python & Data Science Guide

This guide covers executing Python code with full data science library support using Pyodide in the browser.

## Overview

The Python execution engine uses Pyodide, a Python distribution for the browser and Node.js based on WebAssembly. It includes many popular packages like NumPy, Pandas, Matplotlib, and SciPy.

## Basic Usage

### Simple Python Execution

```python
# Basic Python syntax
print("Hello, Python!")

# Variables and data types
name = "Data Scientist"
age = 30
skills = ["Python", "Machine Learning", "Statistics"]

print(f"Name: {name}")
print(f"Age: {age}")
print(f"Skills: {', '.join(skills)}")

# Functions and classes
def calculate_bmi(weight, height):
    """Calculate Body Mass Index"""
    bmi = weight / (height ** 2)
    return round(bmi, 2)

class Person:
    def __init__(self, name, weight, height):
        self.name = name
        self.weight = weight
        self.height = height
    
    def get_bmi(self):
        return calculate_bmi(self.weight, self.height)
    
    def bmi_category(self):
        bmi = self.get_bmi()
        if bmi < 18.5:
            return "Underweight"
        elif bmi < 25:
            return "Normal weight"
        elif bmi < 30:
            return "Overweight"
        else:
            return "Obese"

# Usage
person = Person("Alice", 65, 1.70)
print(f"{person.name}'s BMI: {person.get_bmi()} ({person.bmi_category()})")
```

## Data Science Libraries

### NumPy - Numerical Computing

```python
import numpy as np

# Create arrays
arr1 = np.array([1, 2, 3, 4, 5])
arr2 = np.arange(0, 10, 2)
arr3 = np.linspace(0, 1, 5)

print("Array 1:", arr1)
print("Array 2:", arr2)
print("Array 3:", arr3)

# Array operations
matrix = np.random.rand(3, 4)
print("\nRandom 3x4 matrix:")
print(matrix)

# Statistical operations
print(f"\nMatrix statistics:")
print(f"Mean: {np.mean(matrix):.3f}")
print(f"Std: {np.std(matrix):.3f}")
print(f"Min: {np.min(matrix):.3f}")
print(f"Max: {np.max(matrix):.3f}")

# Linear algebra
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

print("\nMatrix multiplication:")
print("A =")
print(A)
print("B =")
print(B)
print("A @ B =")
print(A @ B)

# Eigenvalues and eigenvectors
eigenvalues, eigenvectors = np.linalg.eig(A)
print(f"\nEigenvalues: {eigenvalues}")
print("Eigenvectors:")
print(eigenvectors)
```

### Pandas - Data Analysis

```python
import pandas as pd
import numpy as np

# Create sample data
data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
    'Age': [25, 30, 35, 28, 32],
    'City': ['New York', 'London', 'Tokyo', 'Paris', 'Sydney'],
    'Salary': [70000, 80000, 90000, 75000, 85000],
    'Department': ['Engineering', 'Marketing', 'Engineering', 'HR', 'Marketing']
}

df = pd.DataFrame(data)
print("Employee Data:")
print(df)

# Basic operations
print(f"\nDataFrame shape: {df.shape}")
print(f"Column names: {list(df.columns)}")
print(f"Data types:\n{df.dtypes}")

# Statistical summary
print("\nStatistical Summary:")
print(df.describe())

# Filtering and selection
print("\nEngineering employees:")
engineering = df[df['Department'] == 'Engineering']
print(engineering)

print("\nEmployees with salary > 75000:")
high_salary = df[df['Salary'] > 75000]
print(high_salary[['Name', 'Salary']])

# Grouping and aggregation
print("\nAverage salary by department:")
dept_salary = df.groupby('Department')['Salary'].mean()
print(dept_salary)

# Adding new columns
df['Salary_Category'] = df['Salary'].apply(
    lambda x: 'High' if x > 80000 else 'Medium' if x > 70000 else 'Low'
)

print("\nWith salary categories:")
print(df[['Name', 'Salary', 'Salary_Category']])

# Data manipulation
print("\nSorted by age (descending):")
sorted_df = df.sort_values('Age', ascending=False)
print(sorted_df[['Name', 'Age']])
```

### Matplotlib - Data Visualization

```python
import matplotlib.pyplot as plt
import numpy as np

# Set up the plotting style
plt.style.use('default')

# Create sample data
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)
y3 = np.sin(x) * np.exp(-x/10)

# Create subplots
fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
fig.suptitle('Python Data Visualization Examples', fontsize=16)

# Plot 1: Line plots
ax1.plot(x, y1, label='sin(x)', linewidth=2)
ax1.plot(x, y2, label='cos(x)', linewidth=2)
ax1.set_title('Trigonometric Functions')
ax1.set_xlabel('x')
ax1.set_ylabel('y')
ax1.legend()
ax1.grid(True, alpha=0.3)

# Plot 2: Scatter plot with colors
np.random.seed(42)
n = 50
colors = np.random.rand(n)
sizes = 1000 * np.random.rand(n)
x_scatter = np.random.randn(n)
y_scatter = np.random.randn(n)

scatter = ax2.scatter(x_scatter, y_scatter, c=colors, s=sizes, alpha=0.6, cmap='viridis')
ax2.set_title('Scatter Plot with Colors and Sizes')
ax2.set_xlabel('X values')
ax2.set_ylabel('Y values')
plt.colorbar(scatter, ax=ax2)

# Plot 3: Bar chart
categories = ['Category A', 'Category B', 'Category C', 'Category D']
values = [23, 45, 56, 78]
colors_bar = ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99']

bars = ax3.bar(categories, values, color=colors_bar)
ax3.set_title('Bar Chart Example')
ax3.set_ylabel('Values')

# Add value labels on bars
for bar, value in zip(bars, values):
    height = bar.get_height()
    ax3.text(bar.get_x() + bar.get_width()/2., height + 1,
             f'{value}', ha='center', va='bottom')

# Plot 4: Histogram
np.random.seed(42)
data = np.random.normal(100, 15, 1000)

ax4.hist(data, bins=30, alpha=0.7, color='skyblue', edgecolor='black')
ax4.axvline(np.mean(data), color='red', linestyle='--', linewidth=2, label=f'Mean: {np.mean(data):.1f}')
ax4.axvline(np.median(data), color='green', linestyle='--', linewidth=2, label=f'Median: {np.median(data):.1f}')
ax4.set_title('Histogram with Statistics')
ax4.set_xlabel('Values')
ax4.set_ylabel('Frequency')
ax4.legend()

plt.tight_layout()
plt.show()

print(f"Generated visualization with {len(data)} data points")
print(f"Data statistics: Mean={np.mean(data):.2f}, Std={np.std(data):.2f}")
```

### Advanced Data Analysis Example

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Generate synthetic sales data
np.random.seed(42)
dates = pd.date_range('2023-01-01', periods=365, freq='D')
base_sales = 1000
trend = np.linspace(0, 200, 365)
seasonal = 100 * np.sin(2 * np.pi * np.arange(365) / 365.25 * 4)  # Quarterly seasonality
noise = np.random.normal(0, 50, 365)
sales = base_sales + trend + seasonal + noise

# Create DataFrame
sales_data = pd.DataFrame({
    'Date': dates,
    'Sales': sales,
    'Month': dates.month,
    'Quarter': dates.quarter,
    'DayOfWeek': dates.dayofweek
})

print("Sales Data Analysis")
print("=" * 50)
print(f"Data shape: {sales_data.shape}")
print(f"Date range: {sales_data['Date'].min()} to {sales_data['Date'].max()}")
print(f"\nSales statistics:")
print(sales_data['Sales'].describe())

# Monthly analysis
monthly_sales = sales_data.groupby('Month')['Sales'].agg(['mean', 'sum', 'count'])
print(f"\nMonthly Sales Summary:")
print(monthly_sales)

# Quarterly analysis
quarterly_sales = sales_data.groupby('Quarter')['Sales'].agg(['mean', 'sum'])
print(f"\nQuarterly Sales Summary:")
print(quarterly_sales)

# Day of week analysis
dow_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
dow_sales = sales_data.groupby('DayOfWeek')['Sales'].mean()
dow_sales.index = dow_names
print(f"\nAverage Sales by Day of Week:")
print(dow_sales)

# Create comprehensive visualization
fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
fig.suptitle('Sales Data Analysis Dashboard', fontsize=16)

# Time series plot
ax1.plot(sales_data['Date'], sales_data['Sales'], alpha=0.7, linewidth=1)
ax1.set_title('Daily Sales Over Time')
ax1.set_xlabel('Date')
ax1.set_ylabel('Sales ($)')
ax1.grid(True, alpha=0.3)

# Add trend line
z = np.polyfit(range(len(sales_data)), sales_data['Sales'], 1)
p = np.poly1d(z)
ax1.plot(sales_data['Date'], p(range(len(sales_data))), "r--", alpha=0.8, linewidth=2, label='Trend')
ax1.legend()

# Monthly boxplot
monthly_data = [sales_data[sales_data['Month'] == month]['Sales'].values for month in range(1, 13)]
ax2.boxplot(monthly_data, labels=[f'M{i}' for i in range(1, 13)])
ax2.set_title('Sales Distribution by Month')
ax2.set_xlabel('Month')
ax2.set_ylabel('Sales ($)')
ax2.grid(True, alpha=0.3)

# Quarterly bar chart
quarterly_sales['sum'].plot(kind='bar', ax=ax3, color=['#ff9999', '#66b3ff', '#99ff99', '#ffcc99'])
ax3.set_title('Total Sales by Quarter')
ax3.set_xlabel('Quarter')
ax3.set_ylabel('Total Sales ($)')
ax3.tick_params(axis='x', rotation=0)

# Day of week analysis
dow_sales.plot(kind='bar', ax=ax4, color='lightcoral')
ax4.set_title('Average Sales by Day of Week')
ax4.set_xlabel('Day of Week')
ax4.set_ylabel('Average Sales ($)')
ax4.tick_params(axis='x', rotation=45)

plt.tight_layout()
plt.show()

# Calculate some insights
best_month = monthly_sales['mean'].idxmax()
worst_month = monthly_sales['mean'].idxmin()
best_quarter = quarterly_sales['mean'].idxmax()
best_day = dow_sales.idxmax()

print(f"\nKey Insights:")
print(f"• Best performing month: {best_month} (avg: ${monthly_sales.loc[best_month, 'mean']:.0f})")
print(f"• Worst performing month: {worst_month} (avg: ${monthly_sales.loc[worst_month, 'mean']:.0f})")
print(f"• Best performing quarter: Q{best_quarter} (avg: ${quarterly_sales.loc[best_quarter, 'mean']:.0f})")
print(f"• Best performing day: {best_day} (avg: ${dow_sales[best_day]:.0f})")

# Growth analysis
total_growth = (sales_data['Sales'].iloc[-30:].mean() - sales_data['Sales'].iloc[:30].mean())
growth_rate = (total_growth / sales_data['Sales'].iloc[:30].mean()) * 100
print(f"• Year-over-year growth: ${total_growth:.0f} ({growth_rate:.1f}%)")
```

## Machine Learning with Scikit-learn

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_classification, make_regression
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, mean_squared_error, r2_score

print("Machine Learning Examples")
print("=" * 50)

# Classification Example
print("\n1. Classification Example")
print("-" * 30)

# Generate synthetic classification data
X_class, y_class = make_classification(n_samples=1000, n_features=2, n_redundant=0, 
                                      n_informative=2, random_state=42, n_clusters_per_class=1)

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X_class, y_class, test_size=0.3, random_state=42)

# Train models
lr_model = LogisticRegression(random_state=42)
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)

lr_model.fit(X_train, y_train)
rf_model.fit(X_train, y_train)

# Make predictions
lr_pred = lr_model.predict(X_test)
rf_pred = rf_model.predict(X_test)

# Evaluate models
lr_accuracy = accuracy_score(y_test, lr_pred)
rf_accuracy = accuracy_score(y_test, rf_pred)

print(f"Logistic Regression Accuracy: {lr_accuracy:.3f}")
print(f"Random Forest Accuracy: {rf_accuracy:.3f}")

# Regression Example
print("\n2. Regression Example")
print("-" * 30)

# Generate synthetic regression data
X_reg, y_reg = make_regression(n_samples=1000, n_features=1, noise=10, random_state=42)

# Split the data
X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(
    X_reg, y_reg, test_size=0.3, random_state=42)

# Train model
reg_model = LinearRegression()
reg_model.fit(X_train_reg, y_train_reg)

# Make predictions
y_pred_reg = reg_model.predict(X_test_reg)

# Evaluate model
mse = mean_squared_error(y_test_reg, y_pred_reg)
r2 = r2_score(y_test_reg, y_pred_reg)

print(f"Mean Squared Error: {mse:.2f}")
print(f"R² Score: {r2:.3f}")

# Visualization
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))

# Classification plot
scatter = ax1.scatter(X_class[:, 0], X_class[:, 1], c=y_class, cmap='viridis', alpha=0.6)
ax1.set_title('Classification Dataset')
ax1.set_xlabel('Feature 1')
ax1.set_ylabel('Feature 2')
plt.colorbar(scatter, ax=ax1)

# Regression plot
ax2.scatter(X_test_reg, y_test_reg, alpha=0.6, label='Actual')
ax2.scatter(X_test_reg, y_pred_reg, alpha=0.6, label='Predicted')
ax2.plot(X_test_reg, y_pred_reg, 'r-', alpha=0.8)
ax2.set_title('Linear Regression Results')
ax2.set_xlabel('Feature')
ax2.set_ylabel('Target')
ax2.legend()

plt.tight_layout()
plt.show()

print(f"\nClassification dataset shape: {X_class.shape}")
print(f"Regression dataset shape: {X_reg.shape}")
```

## Working with Files and Data

```python
import pandas as pd
import numpy as np
import io

# Create sample CSV data in memory
csv_data = """Name,Age,City,Salary,Department
Alice,25,New York,70000,Engineering
Bob,30,London,80000,Marketing
Charlie,35,Tokyo,90000,Engineering
Diana,28,Paris,75000,HR
Eve,32,Sydney,85000,Marketing
Frank,29,Berlin,72000,Engineering
Grace,31,Toronto,88000,Marketing
Henry,27,Amsterdam,76000,HR"""

# Read CSV from string
df = pd.read_csv(io.StringIO(csv_data))
print("Employee Dataset:")
print(df)

# Data analysis
print(f"\nDataset Info:")
print(f"Shape: {df.shape}")
print(f"Columns: {list(df.columns)}")
print(f"Missing values: {df.isnull().sum().sum()}")

# Advanced operations
print(f"\nSalary Analysis:")
print(f"Average salary: ${df['Salary'].mean():,.2f}")
print(f"Median salary: ${df['Salary'].median():,.2f}")
print(f"Salary range: ${df['Salary'].min():,} - ${df['Salary'].max():,}")

# Group analysis
dept_analysis = df.groupby('Department').agg({
    'Salary': ['mean', 'count', 'min', 'max'],
    'Age': 'mean'
}).round(2)

print(f"\nDepartment Analysis:")
print(dept_analysis)

# Create pivot table
pivot = df.pivot_table(values='Salary', index='Department', columns='City', aggfunc='mean', fill_value=0)
print(f"\nSalary by Department and City:")
print(pivot)

# Export data (simulate)
json_data = df.to_json(orient='records', indent=2)
print(f"\nFirst employee as JSON:")
print(json_data[:200] + "...")
```

## Advanced Python Features

### Decorators and Context Managers

```python
import time
import functools
from contextlib import contextmanager

# Timing decorator
def timing_decorator(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} took {end_time - start_time:.4f} seconds")
        return result
    return wrapper

# Caching decorator
def memoize(func):
    cache = {}
    @functools.wraps(func)
    def wrapper(*args):
        if args in cache:
            print(f"Cache hit for {args}")
            return cache[args]
        result = func(*args)
        cache[args] = result
        print(f"Cache miss for {args}, computed result: {result}")
        return result
    return wrapper

# Context manager for timing
@contextmanager
def timer(name):
    start_time = time.time()
    print(f"Starting {name}...")
    try:
        yield
    finally:
        end_time = time.time()
        print(f"{name} completed in {end_time - start_time:.4f} seconds")

# Example usage
@timing_decorator
@memoize
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print("Fibonacci with decorators:")
print(f"fib(10) = {fibonacci(10)}")
print(f"fib(10) = {fibonacci(10)}")  # Should hit cache

# Using context manager
with timer("Matrix multiplication"):
    A = np.random.rand(100, 100)
    B = np.random.rand(100, 100)
    C = A @ B
    print(f"Result shape: {C.shape}")
```

### Generators and Iterators

```python
# Generator functions
def fibonacci_generator(n):
    """Generate fibonacci sequence up to n terms"""
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

def prime_generator(limit):
    """Generate prime numbers up to limit"""
    def is_prime(num):
        if num < 2:
            return False
        for i in range(2, int(num ** 0.5) + 1):
            if num % i == 0:
                return False
        return True
    
    for num in range(2, limit + 1):
        if is_prime(num):
            yield num

# Custom iterator class
class CountDown:
    def __init__(self, start):
        self.start = start
    
    def __iter__(self):
        return self
    
    def __next__(self):
        if self.start <= 0:
            raise StopIteration
        self.start -= 1
        return self.start + 1

# Usage examples
print("Fibonacci sequence (first 10 numbers):")
fib_gen = fibonacci_generator(10)
fib_list = list(fib_gen)
print(fib_list)

print("\nPrime numbers up to 30:")
primes = list(prime_generator(30))
print(primes)

print("\nCountdown from 5:")
countdown = CountDown(5)
for num in countdown:
    print(f"T-minus {num}")

# Generator expressions
print("\nSquares of even numbers from 0 to 20:")
even_squares = (x**2 for x in range(21) if x % 2 == 0)
print(list(even_squares))

# Memory efficient data processing
def process_large_dataset():
    """Simulate processing a large dataset efficiently"""
    # Generator that yields processed data one item at a time
    for i in range(1000):
        # Simulate some processing
        processed_item = {
            'id': i,
            'value': i ** 2,
            'category': 'even' if i % 2 == 0 else 'odd'
        }
        yield processed_item

print("\nProcessing large dataset (showing first 5 items):")
data_processor = process_large_dataset()
for i, item in enumerate(data_processor):
    if i >= 5:
        break
    print(f"Item {i}: {item}")
```

## Tips and Best Practices

### Error Handling and Debugging

```python
import traceback
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def safe_divide(a, b):
    """Safely divide two numbers with comprehensive error handling"""
    try:
        if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
            raise TypeError("Both arguments must be numbers")
        
        if b == 0:
            raise ValueError("Cannot divide by zero")
        
        result = a / b
        logger.info(f"Successfully divided {a} by {b} = {result}")
        return result
        
    except TypeError as e:
        logger.error(f"Type error: {e}")
        return None
    except ValueError as e:
        logger.error(f"Value error: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return None

# Test error handling
print("Error Handling Examples:")
print(f"safe_divide(10, 2) = {safe_divide(10, 2)}")
print(f"safe_divide(10, 0) = {safe_divide(10, 0)}")
print(f"safe_divide('10', 2) = {safe_divide('10', 2)}")

# Custom exception classes
class DataValidationError(Exception):
    """Custom exception for data validation errors"""
    def __init__(self, message, data=None):
        super().__init__(message)
        self.data = data

def validate_data(data):
    """Validate input data"""
    if not isinstance(data, list):
        raise DataValidationError("Data must be a list", data)
    
    if len(data) == 0:
        raise DataValidationError("Data cannot be empty", data)
    
    if not all(isinstance(x, (int, float)) for x in data):
        raise DataValidationError("All data items must be numbers", data)
    
    return True

# Test custom exceptions
test_data = [1, 2, 3, 4, 5]
try:
    validate_data(test_data)
    print(f"Data validation passed for: {test_data}")
except DataValidationError as e:
    print(f"Validation error: {e}")
    print(f"Problematic data: {e.data}")
```

## Available Libraries

The Python environment includes these pre-installed packages:

- **NumPy**: Numerical computing
- **Pandas**: Data analysis and manipulation
- **Matplotlib**: Data visualization
- **SciPy**: Scientific computing
- **Scikit-learn**: Machine learning
- **Statsmodels**: Statistical modeling
- **Seaborn**: Statistical data visualization
- **Plotly**: Interactive visualizations
- **SymPy**: Symbolic mathematics

## Performance Tips

1. **Use NumPy arrays** instead of Python lists for numerical operations
2. **Vectorize operations** with NumPy and Pandas instead of loops
3. **Use generators** for memory-efficient data processing
4. **Profile your code** with timing decorators
5. **Cache expensive computations** with memoization
6. **Use built-in functions** like `map()`, `filter()`, `reduce()`

## Limitations

- Limited to packages available in Pyodide
- No file system access (use in-memory data)
- No network requests for security
- Some packages may have reduced functionality
- Execution time limits apply

For more examples and advanced use cases, see the [Python Examples Repository](../examples/python/).