'use client';

import React, { useState } from 'react';
import { LiveCodeBlock } from '@/components/LiveCodeBlock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { codeExecutor } from '@/lib/code-execution/executor';

const pythonExamples = [
  {
    title: 'Basic Python',
    code: `print("Hello, Python!")
x = 42
y = "The answer is"
print(f"{y} {x}")

# Test basic operations
numbers = [1, 2, 3, 4, 5]
print("Numbers:", numbers)
print("Sum:", sum(numbers))
print("Average:", sum(numbers) / len(numbers))`
  },
  {
    title: 'NumPy Operations',
    code: `import numpy as np

# Create arrays
arr1 = np.array([1, 2, 3, 4, 5])
arr2 = np.array([6, 7, 8, 9, 10])

print("Array 1:", arr1)
print("Array 2:", arr2)
print("Element-wise sum:", arr1 + arr2)
print("Dot product:", np.dot(arr1, arr2))
print("Mean of arr1:", np.mean(arr1))
print("Standard deviation:", np.std(arr1))

# Matrix operations
matrix = np.random.rand(3, 3)
print("\\nRandom 3x3 matrix:")
print(matrix)
print("Matrix determinant:", np.linalg.det(matrix))`
  },
  {
    title: 'Pandas Data Analysis',
    code: `import pandas as pd
import numpy as np

# Create a sample dataset
np.random.seed(42)
data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'],
    'Age': [25, 30, 35, 28, 32, 29],
    'Score': [85, 92, 78, 96, 88, 91],
    'Department': ['Engineering', 'Marketing', 'Engineering', 'Sales', 'Marketing', 'Engineering'],
    'Salary': [75000, 65000, 80000, 70000, 68000, 82000]
}

df = pd.DataFrame(data)
print("Dataset Overview:")
print(df.head())

print("\\nDataset Info:")
print(f"Shape: {df.shape}")
print(f"Columns: {list(df.columns)}")

print("\\nStatistical Summary:")
print(df.describe())

print("\\nDepartment Analysis:")
dept_analysis = df.groupby('Department').agg({
    'Age': 'mean',
    'Score': 'mean',
    'Salary': 'mean'
}).round(2)

print(dept_analysis)`
  },
  {
    title: 'Data Visualization with Matplotlib',
    code: `import matplotlib.pyplot as plt
import numpy as np

# Generate sample data
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)

# Create subplots
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

# Plot 1: Sine and Cosine
ax1.plot(x, y1, 'b-', linewidth=2, label='sin(x)')
ax1.plot(x, y2, 'r--', linewidth=2, label='cos(x)')
ax1.set_xlabel('x')
ax1.set_ylabel('y')
ax1.set_title('Trigonometric Functions')
ax1.legend()
ax1.grid(True, alpha=0.3)

# Plot 2: Histogram
data = np.random.normal(100, 15, 1000)
ax2.hist(data, bins=30, alpha=0.7, color='green', edgecolor='black')
ax2.set_xlabel('Value')
ax2.set_ylabel('Frequency')
ax2.set_title('Normal Distribution')
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()`
  },
  {
    title: 'Seaborn Statistical Plots',
    code: `import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Create sample dataset
np.random.seed(42)
n = 100
data = pd.DataFrame({
    'x': np.random.randn(n),
    'y': np.random.randn(n),
    'category': np.random.choice(['A', 'B', 'C'], n),
    'value': np.random.exponential(2, n)
})

# Set style
sns.set_style("whitegrid")

# Create figure with subplots
fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))

# Scatter plot
sns.scatterplot(data=data, x='x', y='y', hue='category', ax=ax1)
ax1.set_title('Scatter Plot by Category')

# Box plot
sns.boxplot(data=data, x='category', y='value', ax=ax2)
ax2.set_title('Box Plot by Category')

# Histogram
sns.histplot(data=data, x='value', hue='category', ax=ax3)
ax3.set_title('Distribution by Category')

# Correlation heatmap
corr_data = data[['x', 'y', 'value']].corr()
sns.heatmap(corr_data, annot=True, cmap='coolwarm', ax=ax4)
ax4.set_title('Correlation Matrix')

plt.tight_layout()
plt.show()

# Display the dataset
print("Sample Dataset:")
data`
  },
  {
    title: 'Machine Learning with Scikit-learn',
    code: `import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler

# Generate synthetic dataset
X, y = make_classification(n_samples=1000, n_features=2, n_redundant=0, 
                          n_informative=2, n_clusters_per_class=1, 
                          random_state=42)

# Create DataFrame for better visualization
df = pd.DataFrame(X, columns=['Feature_1', 'Feature_2'])
df['Target'] = y

print("Dataset shape:", df.shape)
print("\\nFirst few rows:")
print(df.head())

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale the features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train logistic regression model
model = LogisticRegression(random_state=42)
model.fit(X_train_scaled, y_train)

# Make predictions
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)

print(f"\\nModel Accuracy: {accuracy:.3f}")

# Visualize the results
plt.figure(figsize=(12, 5))

# Plot 1: Original data
plt.subplot(1, 2, 1)
colors = ['red', 'blue']
for i in range(2):
    mask = y == i
    plt.scatter(X[mask, 0], X[mask, 1], c=colors[i], label=f'Class {i}', alpha=0.6)
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')
plt.title('Original Dataset')
plt.legend()
plt.grid(True, alpha=0.3)

# Plot 2: Predictions vs Actual
plt.subplot(1, 2, 2)
for i in range(2):
    mask = y_test == i
    plt.scatter(X_test[mask, 0], X_test[mask, 1], c=colors[i], 
               label=f'Actual Class {i}', alpha=0.6, s=50)
    
    mask_pred = y_pred == i
    plt.scatter(X_test[mask_pred, 0], X_test[mask_pred, 1], 
               c=colors[i], marker='x', s=100, linewidth=2,
               label=f'Predicted Class {i}')

plt.xlabel('Feature 1')
plt.ylabel('Feature 2')
plt.title(f'Predictions vs Actual (Accuracy: {accuracy:.3f})')
plt.legend()
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()

# Show classification report
print("\\nClassification Report:")
print(classification_report(y_test, y_pred))`
  }
];

export default function TestPythonExecutionPage() {
  const [engineStatus, setEngineStatus] = useState<string>('Not tested');
  const [isTestingEngine, setIsTestingEngine] = useState(false);

  const testPythonEngine = async () => {
    setIsTestingEngine(true);
    setEngineStatus('Testing...');

    try {
      const result = await codeExecutor.execute({
        code: 'print("Python engine test successful!")',
        language: 'python'
      });

      if (result.success) {
        setEngineStatus('✅ Python engine working correctly');
      } else {
        setEngineStatus(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setEngineStatus(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingEngine(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Python Execution Test</h1>
        <p className="text-muted-foreground">
          Test the Pyodide-based Python execution engine with various examples
        </p>
        
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Engine Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{engineStatus}</p>
            <Button 
              onClick={testPythonEngine} 
              disabled={isTestingEngine}
              className="w-full"
            >
              {isTestingEngine ? 'Testing...' : 'Test Python Engine'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {pythonExamples.map((example, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{example.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <LiveCodeBlock
                initialCode={example.code}
                language="python"
                height="300px"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Python Code</CardTitle>
        </CardHeader>
        <CardContent>
          <LiveCodeBlock
            initialCode={`# Write your Python code here
print("Hello from Python!")

# Try importing libraries:
# import numpy as np
# import pandas as pd
# import matplotlib.pyplot as plt`}
            language="python"
            height="400px"
          />
        </CardContent>
      </Card>
    </div>
  );
}