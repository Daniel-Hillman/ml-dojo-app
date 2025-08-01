'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code2 as PythonIcon, 
  Sparkles, 
  Database, 
  BarChart3,
  Code,
  Lightbulb
} from 'lucide-react';
import dynamic from 'next/dynamic';

const PythonIDE = dynamic(() => import('@/components/python/PythonIDE').then(mod => ({ default: mod.PythonIDE })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 border rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading Python IDE...</p>
      </div>
    </div>
  )
});
import { CodeExecutionResult } from '@/lib/code-execution';

const SAMPLE_CODES = {
  basic: `# Basic Python with NumPy and Pandas
import numpy as np
import pandas as pd

# Create sample data
data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'Diana'],
    'Age': [25, 30, 35, 28],
    'Salary': [50000, 60000, 70000, 55000]
}

df = pd.DataFrame(data)
print("Sample DataFrame:")
print(df)

# Basic statistics
print("\\nBasic Statistics:")
print(df.describe())

# NumPy operations
ages = np.array(df['Age'])
print(f"\\nAverage age: {np.mean(ages):.1f}")
print(f"Age standard deviation: {np.std(ages):.1f}")`,

  visualization: `# Data Visualization with Matplotlib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

# Generate sample data
np.random.seed(42)
data = pd.DataFrame({
    'x': np.random.randn(100),
    'y': np.random.randn(100),
    'category': np.random.choice(['A', 'B', 'C'], 100)
})

# Create visualizations
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Scatter plot
axes[0, 0].scatter(data['x'], data['y'], c=data['category'].astype('category').cat.codes, alpha=0.7)
axes[0, 0].set_title('Scatter Plot')
axes[0, 0].set_xlabel('X values')
axes[0, 0].set_ylabel('Y values')

# Histogram
axes[0, 1].hist(data['x'], bins=20, alpha=0.7, color='skyblue')
axes[0, 1].set_title('Distribution of X')
axes[0, 1].set_xlabel('X values')
axes[0, 1].set_ylabel('Frequency')

# Box plot
data.boxplot(column='x', by='category', ax=axes[1, 0])
axes[1, 0].set_title('Box Plot by Category')

# Line plot
x_line = np.linspace(0, 10, 50)
y_line = np.sin(x_line)
axes[1, 1].plot(x_line, y_line, 'b-', linewidth=2)
axes[1, 1].set_title('Sine Wave')
axes[1, 1].set_xlabel('X')
axes[1, 1].set_ylabel('sin(X)')

plt.tight_layout()
plt.show()

print("Visualizations created successfully!")`,

  machine_learning: `# Machine Learning with Scikit-learn
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import pandas as pd
import numpy as np

# Load the iris dataset
iris = load_iris()
X, y = iris.data, iris.target

# Create DataFrame for better visualization
df = pd.DataFrame(X, columns=iris.feature_names)
df['species'] = iris.target_names[y]

print("Iris Dataset:")
print(df.head())
print(f"\\nDataset shape: {df.shape}")

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Train a Random Forest model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Make predictions
y_pred = model.predict(X_test)

# Evaluate the model
accuracy = accuracy_score(y_test, y_pred)
print(f"\\nModel Accuracy: {accuracy:.3f}")

# Feature importance
feature_importance = pd.DataFrame({
    'feature': iris.feature_names,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print("\\nFeature Importance:")
print(feature_importance)

# Visualize feature importance
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 6))
plt.bar(feature_importance['feature'], feature_importance['importance'])
plt.title('Feature Importance in Iris Classification')
plt.xlabel('Features')
plt.ylabel('Importance')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()`,

  data_analysis: `# Advanced Data Analysis
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Create a more complex dataset
np.random.seed(42)
n_samples = 1000

# Generate synthetic sales data
dates = pd.date_range('2023-01-01', periods=n_samples, freq='D')
products = ['Product A', 'Product B', 'Product C', 'Product D']
regions = ['North', 'South', 'East', 'West']

data = []
for i in range(n_samples):
    product = np.random.choice(products)
    region = np.random.choice(regions)
    
    # Add some realistic patterns
    base_sales = np.random.poisson(50)
    seasonal_factor = 1 + 0.3 * np.sin(2 * np.pi * i / 365)
    regional_factor = {'North': 1.2, 'South': 0.8, 'East': 1.0, 'West': 1.1}[region]
    product_factor = {'Product A': 1.3, 'Product B': 1.0, 'Product C': 0.7, 'Product D': 1.1}[product]
    
    sales = int(base_sales * seasonal_factor * regional_factor * product_factor)
    price = np.random.uniform(10, 100)
    
    data.append({
        'date': dates[i],
        'product': product,
        'region': region,
        'sales': sales,
        'price': round(price, 2),
        'revenue': round(sales * price, 2)
    })

df = pd.DataFrame(data)

print("Sales Dataset Overview:")
print(f"Shape: {df.shape}")
print(f"Date range: {df['date'].min()} to {df['date'].max()}")
print("\\nFirst 5 rows:")
print(df.head())

# Analysis
print("\\n=== ANALYSIS RESULTS ===")

# 1. Revenue by product
revenue_by_product = df.groupby('product')['revenue'].sum().sort_values(ascending=False)
print("\\n1. Total Revenue by Product:")
print(revenue_by_product)

# 2. Average sales by region
avg_sales_by_region = df.groupby('region')['sales'].mean().sort_values(ascending=False)
print("\\n2. Average Sales by Region:")
print(avg_sales_by_region)

# 3. Monthly trends
df['month'] = df['date'].dt.to_period('M')
monthly_revenue = df.groupby('month')['revenue'].sum()
print("\\n3. Monthly Revenue Trend (first 6 months):")
print(monthly_revenue.head(6))

# Create comprehensive visualizations
fig, axes = plt.subplots(2, 3, figsize=(18, 12))

# Revenue by product
revenue_by_product.plot(kind='bar', ax=axes[0, 0], color='skyblue')
axes[0, 0].set_title('Total Revenue by Product')
axes[0, 0].set_ylabel('Revenue ($)')
axes[0, 0].tick_params(axis='x', rotation=45)

# Sales by region
avg_sales_by_region.plot(kind='bar', ax=axes[0, 1], color='lightgreen')
axes[0, 1].set_title('Average Sales by Region')
axes[0, 1].set_ylabel('Average Sales')
axes[0, 1].tick_params(axis='x', rotation=45)

# Monthly revenue trend
monthly_revenue.plot(ax=axes[0, 2], marker='o', linewidth=2)
axes[0, 2].set_title('Monthly Revenue Trend')
axes[0, 2].set_ylabel('Revenue ($)')
axes[0, 2].tick_params(axis='x', rotation=45)

# Sales distribution
axes[1, 0].hist(df['sales'], bins=30, alpha=0.7, color='orange')
axes[1, 0].set_title('Sales Distribution')
axes[1, 0].set_xlabel('Sales')
axes[1, 0].set_ylabel('Frequency')

# Price vs Sales scatter
axes[1, 1].scatter(df['price'], df['sales'], alpha=0.5, color='purple')
axes[1, 1].set_title('Price vs Sales')
axes[1, 1].set_xlabel('Price ($)')
axes[1, 1].set_ylabel('Sales')

# Correlation heatmap
correlation_matrix = df[['sales', 'price', 'revenue']].corr()
im = axes[1, 2].imshow(correlation_matrix, cmap='coolwarm', aspect='auto')
axes[1, 2].set_xticks(range(len(correlation_matrix.columns)))
axes[1, 2].set_yticks(range(len(correlation_matrix.columns)))
axes[1, 2].set_xticklabels(correlation_matrix.columns)
axes[1, 2].set_yticklabels(correlation_matrix.columns)
axes[1, 2].set_title('Correlation Matrix')

# Add correlation values as text
for i in range(len(correlation_matrix.columns)):
    for j in range(len(correlation_matrix.columns)):
        text = axes[1, 2].text(j, i, f'{correlation_matrix.iloc[i, j]:.2f}',
                              ha="center", va="center", color="black")

plt.tight_layout()
plt.show()

print("\\nAnalysis complete! Check the visualizations above.")`
};

export default function TestPythonIDEPage() {
  const [selectedExample, setSelectedExample] = useState<keyof typeof SAMPLE_CODES>('basic');
  const [executionResults, setExecutionResults] = useState<CodeExecutionResult[]>([]);

  const handleExecutionComplete = (result: CodeExecutionResult) => {
    setExecutionResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <PythonIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Python IDE Enhancement Test</h1>
          <Badge variant="outline" className="text-sm">
            Task 7 Implementation
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Testing Python-specific UI enhancements including package import suggestions, 
          data inspection tools, specialized output panels, and sample datasets.
        </p>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Enhanced Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Code className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium">Smart Imports</h3>
                <p className="text-sm text-muted-foreground">Package suggestions & auto-completion</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Database className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-medium">Data Inspector</h3>
                <p className="text-sm text-muted-foreground">Variable & DataFrame analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-medium">Plot Panels</h3>
                <p className="text-sm text-muted-foreground">Specialized visualization output</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Lightbulb className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-medium">Templates</h3>
                <p className="text-sm text-muted-foreground">Sample datasets & code templates</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Try Sample Code</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedExample} onValueChange={(value) => setSelectedExample(value as keyof typeof SAMPLE_CODES)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Operations</TabsTrigger>
              <TabsTrigger value="visualization">Data Visualization</TabsTrigger>
              <TabsTrigger value="machine_learning">Machine Learning</TabsTrigger>
              <TabsTrigger value="data_analysis">Data Analysis</TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              <TabsContent value="basic">
                <p className="text-sm text-muted-foreground mb-4">
                  Basic Python operations with NumPy and Pandas. Demonstrates data creation, 
                  DataFrame operations, and basic statistics.
                </p>
              </TabsContent>
              <TabsContent value="visualization">
                <p className="text-sm text-muted-foreground mb-4">
                  Data visualization examples using Matplotlib. Creates multiple 
                  plot types including scatter plots, histograms, and line charts.
                </p>
              </TabsContent>
              <TabsContent value="machine_learning">
                <p className="text-sm text-muted-foreground mb-4">
                  Machine learning workflow with Scikit-learn. Loads the Iris dataset, 
                  trains a Random Forest model, and visualizes feature importance.
                </p>
              </TabsContent>
              <TabsContent value="data_analysis">
                <p className="text-sm text-muted-foreground mb-4">
                  Comprehensive data analysis with synthetic sales data. Includes grouping, 
                  aggregation, time series analysis, and multiple visualizations.
                </p>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Python IDE */}
      <PythonIDE
        initialCode={SAMPLE_CODES[selectedExample]}
        height="500px"
        showDataInspector={true}
        onExecutionComplete={handleExecutionComplete}
        className="min-h-[600px]"
      />

      {/* Execution History */}
      {executionResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Recent Executions
              <Badge variant="outline" className="text-xs">
                {executionResults.length} results
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {executionResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
                      {result.success ? 'Success' : 'Error'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {result.executionTime}ms
                    </span>
                    {result.metadata?.hasPlots && (
                      <Badge variant="outline" className="text-xs">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Plots
                      </Badge>
                    )}
                    {result.metadata?.hasDataFrames && (
                      <Badge variant="outline" className="text-xs">
                        <Database className="w-3 h-3 mr-1" />
                        DataFrames
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Package Import Suggestions</h4>
              <p className="text-muted-foreground">
                Click the "Import Package" button to see common Python packages with their import statements. 
                Try typing "import " in the editor to see inline suggestions.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Sample Datasets</h4>
              <p className="text-muted-foreground">
                Use the "Sample Data" button to insert pre-configured datasets like Iris, sales data, 
                or time series data for immediate experimentation.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Code Templates</h4>
              <p className="text-muted-foreground">
                Click "Templates" to access ready-to-use code templates for data analysis, 
                machine learning, and visualization workflows.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">4. Data Inspector</h4>
              <p className="text-muted-foreground">
                After running code that creates variables or DataFrames, check the Data Inspector 
                panel on the right to explore your data interactively.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">5. Specialized Output</h4>
              <p className="text-muted-foreground">
                The output panel automatically detects and separates console output, plots, 
                data tables, and errors into dedicated tabs for better organization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}