'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SyntaxHighlightedEditor } from '@/components/SyntaxHighlightedEditor';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Package, 
  Lightbulb, 
  Database, 
  FileText,
  ChevronDown,
  Plus,
  X
} from 'lucide-react';

interface PythonCodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  height?: string;
  className?: string;
}

// Common Python packages with descriptions
const PYTHON_PACKAGES = {
  'numpy': {
    name: 'NumPy',
    description: 'Numerical computing with arrays',
    imports: ['import numpy as np', 'from numpy import array, zeros, ones'],
    examples: ['np.array([1, 2, 3])', 'np.zeros((3, 3))', 'np.random.rand(5)']
  },
  'pandas': {
    name: 'Pandas',
    description: 'Data manipulation and analysis',
    imports: ['import pandas as pd', 'from pandas import DataFrame, Series'],
    examples: ['pd.DataFrame({"A": [1, 2], "B": [3, 4]})', 'pd.read_csv("data.csv")', 'df.head()']
  },
  'matplotlib': {
    name: 'Matplotlib',
    description: 'Plotting and visualization',
    imports: ['import matplotlib.pyplot as plt', 'from matplotlib import pyplot as plt'],
    examples: ['plt.plot([1, 2, 3], [4, 5, 6])', 'plt.scatter(x, y)', 'plt.show()']
  },
  'seaborn': {
    name: 'Seaborn (Optional)',
    description: 'Statistical data visualization (may not be available)',
    imports: ['import seaborn as sns', 'import seaborn as sns; sns.set()'],
    examples: ['sns.scatterplot(x="x", y="y", data=df)', 'sns.heatmap(corr_matrix)', 'sns.boxplot(data=df)']
  },
  'scikit-learn': {
    name: 'Scikit-learn',
    description: 'Machine learning library',
    imports: ['from sklearn import datasets, model_selection', 'from sklearn.linear_model import LinearRegression'],
    examples: ['datasets.load_iris()', 'LinearRegression().fit(X, y)', 'model_selection.train_test_split(X, y)']
  },
  'scipy': {
    name: 'SciPy',
    description: 'Scientific computing',
    imports: ['import scipy as sp', 'from scipy import stats, optimize'],
    examples: ['stats.norm.pdf(x)', 'optimize.minimize(func, x0)', 'sp.linalg.solve(A, b)']
  }
};

// Sample datasets
const SAMPLE_DATASETS = {
  'iris': {
    name: 'Iris Dataset',
    description: 'Classic flower classification dataset',
    code: `from sklearn.datasets import load_iris
import pandas as pd

# Load the iris dataset
iris = load_iris()
df = pd.DataFrame(iris.data, columns=iris.feature_names)
df['species'] = iris.target_names[iris.target]

print("Dataset shape:", df.shape)
print("\\nFirst 5 rows:")
print(df.head())

print("\\nDataset info:")
print(df.info())`
  },
  'sample_data': {
    name: 'Sample Sales Data',
    description: 'Synthetic sales data for analysis',
    code: `import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Generate sample sales data
np.random.seed(42)
dates = pd.date_range(start='2023-01-01', end='2023-12-31', freq='D')
products = ['Product A', 'Product B', 'Product C', 'Product D']

data = []
for date in dates:
    for product in products:
        sales = np.random.poisson(50) + np.random.randint(0, 100)
        price = np.random.uniform(10, 100)
        data.append({
            'date': date,
            'product': product,
            'sales': sales,
            'price': round(price, 2),
            'revenue': round(sales * price, 2)
        })

df = pd.DataFrame(data)
print("Sample sales data generated!")
print(f"Shape: {df.shape}")
print("\\nFirst 5 rows:")
print(df.head())`
  },
  'time_series': {
    name: 'Time Series Data',
    description: 'Sample time series for analysis',
    code: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Generate sample time series data
np.random.seed(42)
dates = pd.date_range(start='2023-01-01', periods=365, freq='D')

# Create trend + seasonality + noise
trend = np.linspace(100, 200, len(dates))
seasonal = 20 * np.sin(2 * np.pi * np.arange(len(dates)) / 365.25)
noise = np.random.normal(0, 5, len(dates))
values = trend + seasonal + noise

df = pd.DataFrame({
    'date': dates,
    'value': values
})

print("Time series data generated!")
print(f"Shape: {df.shape}")
print("\\nFirst 5 rows:")
print(df.head())

# Plot the data
plt.figure(figsize=(12, 6))
plt.plot(df['date'], df['value'])
plt.title('Sample Time Series Data')
plt.xlabel('Date')
plt.ylabel('Value')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()`
  }
};

// Code templates
const CODE_TEMPLATES = {
  'data_analysis': {
    name: 'Data Analysis Template',
    description: 'Basic data exploration and analysis',
    code: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Load your data
# df = pd.read_csv('your_data.csv')

# Basic info about the dataset
print("Dataset shape:", df.shape)
print("\\nColumn names:")
print(df.columns.tolist())

print("\\nData types:")
print(df.dtypes)

print("\\nBasic statistics:")
print(df.describe())

print("\\nMissing values:")
print(df.isnull().sum())

# Visualizations
plt.figure(figsize=(12, 8))

# Correlation heatmap
plt.subplot(2, 2, 1)
sns.heatmap(df.corr(), annot=True, cmap='coolwarm')
plt.title('Correlation Matrix')

# Distribution of numeric columns
numeric_cols = df.select_dtypes(include=[np.number]).columns
for i, col in enumerate(numeric_cols[:3]):
    plt.subplot(2, 2, i+2)
    plt.hist(df[col], bins=20, alpha=0.7)
    plt.title(f'Distribution of {col}')
    plt.xlabel(col)
    plt.ylabel('Frequency')

plt.tight_layout()
plt.show()`
  },
  'machine_learning': {
    name: 'Machine Learning Template',
    description: 'Basic ML workflow with scikit-learn',
    code: `import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
import matplotlib.pyplot as plt

# Load and prepare data
# X = df[['feature1', 'feature2', 'feature3']]  # Features
# y = df['target']  # Target variable

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Create and train the model
model = LinearRegression()
model.fit(X_train, y_train)

# Make predictions
y_pred = model.predict(X_test)

# Evaluate the model
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"Mean Squared Error: {mse:.4f}")
print(f"R² Score: {r2:.4f}")

# Visualize results
plt.figure(figsize=(10, 6))

plt.subplot(1, 2, 1)
plt.scatter(y_test, y_pred, alpha=0.7)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
plt.xlabel('Actual Values')
plt.ylabel('Predicted Values')
plt.title('Actual vs Predicted')

plt.subplot(1, 2, 2)
residuals = y_test - y_pred
plt.scatter(y_pred, residuals, alpha=0.7)
plt.axhline(y=0, color='r', linestyle='--')
plt.xlabel('Predicted Values')
plt.ylabel('Residuals')
plt.title('Residual Plot')

plt.tight_layout()
plt.show()`
  },
  'visualization': {
    name: 'Data Visualization Template',
    description: 'Common plotting patterns',
    code: `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Set style
plt.style.use('default')

# Create sample data for demonstration
np.random.seed(42)
data = {
    'x': np.random.randn(100),
    'y': np.random.randn(100),
    'category': np.random.choice(['A', 'B', 'C'], 100),
    'value': np.random.uniform(0, 100, 100)
}
df = pd.DataFrame(data)

# Create a comprehensive visualization
fig, axes = plt.subplots(2, 3, figsize=(15, 10))

# Scatter plot
axes[0, 0].scatter(df['x'], df['y'], c=df['value'], cmap='viridis', alpha=0.7)
axes[0, 0].set_title('Scatter Plot with Color Mapping')
axes[0, 0].set_xlabel('X values')
axes[0, 0].set_ylabel('Y values')

# Histogram
axes[0, 1].hist(df['value'], bins=20, alpha=0.7, color='skyblue', edgecolor='black')
axes[0, 1].set_title('Distribution of Values')
axes[0, 1].set_xlabel('Value')
axes[0, 1].set_ylabel('Frequency')

# Box plot
df.boxplot(column='value', by='category', ax=axes[0, 2])
axes[0, 2].set_title('Box Plot by Category')
axes[0, 2].set_xlabel('Category')
axes[0, 2].set_ylabel('Value')

# Line plot
x_line = np.linspace(0, 10, 100)
y_line = np.sin(x_line) + 0.1 * np.random.randn(100)
axes[1, 0].plot(x_line, y_line, linewidth=2, alpha=0.8)
axes[1, 0].set_title('Line Plot with Noise')
axes[1, 0].set_xlabel('X')
axes[1, 0].set_ylabel('Y')

# Bar plot
category_counts = df['category'].value_counts()
axes[1, 1].bar(category_counts.index, category_counts.values, color=['coral', 'lightblue', 'lightgreen'])
axes[1, 1].set_title('Category Counts')
axes[1, 1].set_xlabel('Category')
axes[1, 1].set_ylabel('Count')

# Heatmap
correlation_matrix = df[['x', 'y', 'value']].corr()
im = axes[1, 2].imshow(correlation_matrix, cmap='coolwarm', aspect='auto')
axes[1, 2].set_xticks(range(len(correlation_matrix.columns)))
axes[1, 2].set_yticks(range(len(correlation_matrix.columns)))
axes[1, 2].set_xticklabels(correlation_matrix.columns)
axes[1, 2].set_yticklabels(correlation_matrix.columns)
axes[1, 2].set_title('Correlation Heatmap')

# Add colorbar
plt.colorbar(im, ax=axes[1, 2])

plt.tight_layout()
plt.show()

print("Visualization complete! Try modifying the code to create your own plots.")`
  }
};

export const PythonCodeEditor: React.FC<PythonCodeEditorProps> = ({
  code,
  onCodeChange,
  height = '400px',
  className = ''
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debounced suggestion logic to improve performance
  const debouncedSuggestionCheck = useCallback(
    debounce((newCode: string, cursorPos: number) => {
      const lines = newCode.split('\n');
      const currentLineIndex = newCode.substring(0, cursorPos).split('\n').length - 1;
      const currentLine = lines[currentLineIndex] || '';
      
      if (currentLine.trim().startsWith('import ') || currentLine.trim().startsWith('from ')) {
        const importSuggestions = Object.keys(PYTHON_PACKAGES).filter(pkg => 
          currentLine.includes(pkg) || pkg.toLowerCase().includes(currentLine.toLowerCase().replace(/import |from /g, ''))
        );
        setSuggestions(importSuggestions);
        setShowSuggestions(importSuggestions.length > 0);
      } else {
        setShowSuggestions(false);
      }
    }, 300), // 300ms debounce
    []
  );

  // Handle code changes with optimized performance
  const handleCodeChange = useCallback((newCode: string) => {
    onCodeChange(newCode);
    
    // Get cursor position
    const textarea = textareaRef.current;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      setCursorPosition(cursorPos);
      
      // Only check for suggestions if we're typing import statements
      const lines = newCode.split('\n');
      const currentLineIndex = newCode.substring(0, cursorPos).split('\n').length - 1;
      const currentLine = lines[currentLineIndex] || '';
      
      if (currentLine.trim().startsWith('import ') || currentLine.trim().startsWith('from ')) {
        debouncedSuggestionCheck(newCode, cursorPos);
      } else {
        setShowSuggestions(false);
      }
    }
  }, [onCodeChange, debouncedSuggestionCheck]);

  // Insert import statement
  const insertImport = useCallback((packageName: string, importStatement: string) => {
    const lines = code.split('\n');
    const importLines = lines.filter(line => line.trim().startsWith('import ') || line.trim().startsWith('from '));
    const lastImportIndex = importLines.length > 0 ? 
      lines.lastIndexOf(importLines[importLines.length - 1]) : -1;
    
    const newLines = [...lines];
    if (lastImportIndex >= 0) {
      newLines.splice(lastImportIndex + 1, 0, importStatement);
    } else {
      newLines.unshift(importStatement, '');
    }
    
    onCodeChange(newLines.join('\n'));
    setShowSuggestions(false);
  }, [code, onCodeChange]);

  // Insert template or dataset
  const insertCode = useCallback((codeToInsert: string) => {
    const newCode = code ? `${code}\n\n${codeToInsert}` : codeToInsert;
    onCodeChange(newCode);
  }, [code, onCodeChange]);

  return (
    <div className={`python-code-editor ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Python Code Editor
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Package suggestions */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 bg-card border hover:bg-accent/50 transition-colors">
                    <Plus className="w-4 h-4" />
                    Import Package
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <h4 className="font-medium">Common Python Packages</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {Object.entries(PYTHON_PACKAGES).map(([key, pkg]) => (
                        <div key={key} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{pkg.name}</h5>
                            <Badge variant="outline" className="text-xs">{key}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{pkg.description}</p>
                          <div className="space-y-1">
                            {pkg.imports.map((imp, idx) => (
                              <Button
                                key={idx}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-xs font-mono hover:bg-accent/50 transition-colors"
                                onClick={() => insertImport(key, imp)}
                              >
                                {imp}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Sample datasets */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 bg-card border hover:bg-accent/50 transition-colors">
                    <Database className="w-4 h-4" />
                    Sample Data
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <h4 className="font-medium">Sample Datasets</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {Object.entries(SAMPLE_DATASETS).map(([key, dataset]) => (
                        <div key={key} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{dataset.name}</h5>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{dataset.description}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-card border hover:bg-accent/50 transition-colors"
                            onClick={() => insertCode(dataset.code)}
                          >
                            Insert Dataset Code
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Code templates */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 bg-card border hover:bg-accent/50 transition-colors">
                    <FileText className="w-4 h-4" />
                    Templates
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <h4 className="font-medium">Code Templates</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {Object.entries(CODE_TEMPLATES).map(([key, template]) => (
                        <div key={key} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{template.name}</h5>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-card border hover:bg-accent/50 transition-colors"
                            onClick={() => insertCode(template.code)}
                          >
                            Insert Template
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative">
            <div className="syntax-highlighted-python-editor" style={{ height }}>
              <SyntaxHighlightedEditor
                value={code}
                onChange={handleCodeChange}
                language="python"
                height={height}
                theme="dark"
                placeholder="# Enter Python code here...
# Use the buttons above to insert imports, sample data, or templates

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Your code here..."
                className="w-full h-full"
              />
            </div>
            
            {/* Inline suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-16 left-4 bg-card border rounded-lg shadow-lg z-10 max-w-xs">
                <div className="p-2 border-b bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Import Suggestions</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto p-1 h-auto"
                      onClick={() => setShowSuggestions(false)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
                  {suggestions.map((pkg) => {
                    const packageInfo = PYTHON_PACKAGES[pkg as keyof typeof PYTHON_PACKAGES];
                    return (
                      <div key={pkg} className="space-y-1">
                        <div className="text-sm font-medium">{packageInfo.name}</div>
                        <div className="text-xs text-muted-foreground mb-1">{packageInfo.description}</div>
                        {packageInfo.imports.map((imp, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs font-mono p-1 h-auto hover:bg-accent/50 transition-colors"
                            onClick={() => insertImport(pkg, imp)}
                          >
                            {imp}
                          </Button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};