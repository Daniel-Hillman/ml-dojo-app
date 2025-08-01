'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Play, 
  Table, 
  BarChart3,
  Code,
  Lightbulb
} from 'lucide-react';
import { LiveCodeBlock } from '@/components/LiveCodeBlock';
import { CodeExecutionResult } from '@/lib/code-execution';

const SAMPLE_QUERIES = {
  basic: `-- Basic SELECT query
SELECT * FROM employees 
LIMIT 5;`,

  joins: `-- JOIN query with multiple tables
SELECT 
    e.name as employee_name,
    e.salary,
    d.name as department_name,
    d.budget
FROM employees e
JOIN departments d ON e.department = d.name
ORDER BY e.salary DESC;`,

  aggregation: `-- Aggregation and GROUP BY
SELECT 
    department,
    COUNT(*) as employee_count,
    AVG(salary) as avg_salary,
    MAX(salary) as max_salary,
    MIN(salary) as min_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;`,

  advanced: `-- Advanced query with subqueries and window functions
SELECT 
    name,
    department,
    salary,
    AVG(salary) OVER (PARTITION BY department) as dept_avg_salary,
    salary - AVG(salary) OVER (PARTITION BY department) as salary_diff_from_avg,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank
FROM employees
ORDER BY department, salary DESC;`,

  create_insert: `-- Create table and insert data
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price DECIMAL(10,2),
    category TEXT,
    in_stock BOOLEAN DEFAULT 1
);

INSERT INTO products (name, price, category, in_stock) VALUES
    ('Laptop', 999.99, 'Electronics', 1),
    ('Coffee Mug', 12.50, 'Kitchen', 1),
    ('Notebook', 5.99, 'Office', 0),
    ('Wireless Mouse', 29.99, 'Electronics', 1);

SELECT * FROM products;`,

  update_delete: `-- Update and Delete operations
-- First, let's see current data
SELECT * FROM products WHERE category = 'Electronics';

-- Update prices for electronics (10% discount)
UPDATE products 
SET price = price * 0.9 
WHERE category = 'Electronics';

-- Delete out of stock items
DELETE FROM products WHERE in_stock = 0;

-- See the results
SELECT * FROM products ORDER BY category, price;`
};

export default function TestSqlExecutionPage() {
  const [selectedQuery, setSelectedQuery] = useState<keyof typeof SAMPLE_QUERIES>('basic');
  const [executionResults, setExecutionResults] = useState<CodeExecutionResult[]>([]);

  const handleExecutionComplete = (result: CodeExecutionResult) => {
    setExecutionResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">SQL Execution Test</h1>
          <Badge variant="outline" className="text-sm">
            Task 8 Implementation
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Testing SQL execution with SQLite using sql.js. Execute queries against sample data 
          with formatted table results and error handling.
        </p>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            SQL Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium">In-Browser SQLite</h3>
                <p className="text-sm text-muted-foreground">Full SQLite database in browser</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Table className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-medium">Sample Data</h3>
                <p className="text-sm text-muted-foreground">Pre-loaded tables with data</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-medium">Formatted Results</h3>
                <p className="text-sm text-muted-foreground">Beautiful table display</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Code className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-medium">Full SQL Support</h3>
                <p className="text-sm text-muted-foreground">SELECT, INSERT, UPDATE, DELETE</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Data Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Database Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Table className="w-4 h-4" />
                employees
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• id (INTEGER PRIMARY KEY)</li>
                <li>• name (TEXT)</li>
                <li>• department (TEXT)</li>
                <li>• salary (INTEGER)</li>
                <li>• hire_date (DATE)</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Table className="w-4 h-4" />
                departments
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• id (INTEGER PRIMARY KEY)</li>
                <li>• name (TEXT)</li>
                <li>• budget (INTEGER)</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Table className="w-4 h-4" />
                projects
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• id (INTEGER PRIMARY KEY)</li>
                <li>• name (TEXT)</li>
                <li>• department_id (INTEGER)</li>
                <li>• start_date (DATE)</li>
                <li>• end_date (DATE)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Query Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Try Sample Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedQuery} onValueChange={(value) => setSelectedQuery(value as keyof typeof SAMPLE_QUERIES)}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="joins">Joins</TabsTrigger>
              <TabsTrigger value="aggregation">Aggregation</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="create_insert">Create/Insert</TabsTrigger>
              <TabsTrigger value="update_delete">Update/Delete</TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              <TabsContent value="basic">
                <p className="text-sm text-muted-foreground mb-4">
                  Simple SELECT query to get data from the employees table.
                </p>
              </TabsContent>
              <TabsContent value="joins">
                <p className="text-sm text-muted-foreground mb-4">
                  JOIN query combining employees and departments tables.
                </p>
              </TabsContent>
              <TabsContent value="aggregation">
                <p className="text-sm text-muted-foreground mb-4">
                  GROUP BY query with aggregate functions (COUNT, AVG, MAX, MIN).
                </p>
              </TabsContent>
              <TabsContent value="advanced">
                <p className="text-sm text-muted-foreground mb-4">
                  Advanced query using window functions and ranking.
                </p>
              </TabsContent>
              <TabsContent value="create_insert">
                <p className="text-sm text-muted-foreground mb-4">
                  Create a new table and insert sample data.
                </p>
              </TabsContent>
              <TabsContent value="update_delete">
                <p className="text-sm text-muted-foreground mb-4">
                  Update existing records and delete specific rows.
                </p>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* SQL Editor */}
      <LiveCodeBlock
        initialCode={SAMPLE_QUERIES[selectedQuery]}
        language="sql"
        height="400px"
        showOutput={true}
        allowEdit={true}
        showLanguageSelector={false}
        onExecutionComplete={handleExecutionComplete}
        className="min-h-[500px]"
      />

      {/* Execution History */}
      {executionResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Recent Query Executions
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
                    {result.metadata?.queryType && (
                      <Badge variant="outline" className="text-xs">
                        {result.metadata.queryType}
                      </Badge>
                    )}
                    {result.metadata?.rowsAffected !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {result.metadata.rowsAffected} rows
                      </Badge>
                    )}
                    {result.metadata?.tablesInvolved && result.metadata.tablesInvolved.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Tables: {result.metadata.tablesInvolved.join(', ')}
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
          <CardTitle>How to Test SQL Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Pre-loaded Sample Data</h4>
              <p className="text-muted-foreground">
                The database comes with sample employees, departments, and projects tables. 
                Try the "Basic" query to see the data structure.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Query Types Supported</h4>
              <p className="text-muted-foreground">
                Full SQL support including SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, 
                JOINs, GROUP BY, window functions, and more.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Formatted Results</h4>
              <p className="text-muted-foreground">
                Query results are displayed in beautiful HTML tables with proper formatting, 
                NULL value handling, and row highlighting.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">4. Error Handling</h4>
              <p className="text-muted-foreground">
                Try entering invalid SQL to see clear error messages. The system provides 
                helpful feedback for syntax errors and constraint violations.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">5. Session Persistence</h4>
              <p className="text-muted-foreground">
                Tables and data persist within your session. Create new tables and they'll 
                be available for subsequent queries until you refresh the page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}