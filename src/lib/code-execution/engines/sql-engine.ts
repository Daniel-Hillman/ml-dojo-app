/**
 * SQL Execution Engine using sql.js (SQLite compiled to WebAssembly)
 */

import { 
  ExecutionEngine, 
  CodeExecutionRequest, 
  CodeExecutionResult, 
  SupportedLanguage 
} from '../types';

// sql.js types
interface Database {
  run(sql: string, params?: any[]): void;
  exec(sql: string): QueryExecResult[];
  prepare(sql: string): Statement;
  close(): void;
  export(): Uint8Array;
}

interface QueryExecResult {
  columns: string[];
  values: any[][];
}

interface Statement {
  step(): boolean;
  get(): any[];
  getColumnNames(): string[];
  bind(params?: any[]): boolean;
  reset(): boolean;
  free(): boolean;
}

interface SqlJs {
  Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
}

declare global {
  interface Window {
    initSqlJs: (config?: any) => Promise<SqlJs>;
  }
}

export class SqlExecutionEngine implements ExecutionEngine {
  name = 'sql.js';
  supportedLanguages: SupportedLanguage[] = ['sql'];
  
  private SQL: SqlJs | null = null;
  private db: Database | null = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    // Initialize sql.js only in browser environment
    if (typeof window !== 'undefined') {
      this.initializeSqlJs();
    }
  }

  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Ensure sql.js is loaded
      await this.ensureSqlJsLoaded();
      
      if (!this.SQL || !this.db) {
        throw new Error('SQL.js failed to load');
      }

      // Clean and prepare SQL
      const sql = request.code.trim();
      if (!sql) {
        return {
          success: true,
          output: 'No SQL query provided',
          executionTime: Date.now() - startTime
        };
      }

      // Execute SQL with timeout
      const timeout = request.options?.timeout || 10000;
      const executionPromise = this.executeWithTimeout(sql, timeout);
      
      let results: QueryExecResult[];
      try {
        results = await executionPromise;
      } catch (sqlError) {
        return {
          success: false,
          error: this.formatSqlError(sqlError),
          executionTime: Date.now() - startTime
        };
      }

      // Format results
      const { output, visualOutput } = this.formatResults(results, sql);

      return {
        success: true,
        output,
        visualOutput,
        executionTime: Date.now() - startTime,
        metadata: {
          queryType: this.detectQueryType(sql),
          rowsAffected: results.reduce((total, result) => total + (result.values?.length || 0), 0),
          tablesInvolved: this.extractTableNames(sql)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SQL execution error',
        executionTime: Date.now() - startTime
      };
    }
  }

  async validateCode(code: string): Promise<boolean> {
    try {
      await this.ensureSqlJsLoaded();
      
      if (!this.SQL || !this.db) {
        return false;
      }

      // Try to prepare the statement without executing it
      const sql = code.trim();
      if (!sql) return true;

      // Basic SQL syntax validation
      const statement = this.db.prepare(sql);
      statement.free();
      return true;
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    // SQL.js doesn't need explicit cleanup for queries
    // The database persists for the session
  }

  // Initialize with sample data
  async initializeSampleData(): Promise<void> {
    if (!this.db) return;

    try {
      // Create sample tables with data
      this.db.run(`
        CREATE TABLE IF NOT EXISTS employees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          department TEXT NOT NULL,
          salary INTEGER NOT NULL,
          hire_date DATE NOT NULL
        );
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS departments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          budget INTEGER NOT NULL
        );
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          department_id INTEGER,
          start_date DATE,
          end_date DATE,
          FOREIGN KEY (department_id) REFERENCES departments (id)
        );
      `);

      // Insert sample data
      const sampleEmployees = [
        ['Alice Johnson', 'Engineering', 75000, '2022-01-15'],
        ['Bob Smith', 'Marketing', 65000, '2021-03-20'],
        ['Carol Davis', 'Engineering', 80000, '2020-07-10'],
        ['David Wilson', 'Sales', 70000, '2022-05-01'],
        ['Eva Brown', 'HR', 60000, '2021-11-30'],
        ['Frank Miller', 'Engineering', 85000, '2019-09-15'],
        ['Grace Lee', 'Marketing', 68000, '2022-02-28'],
        ['Henry Taylor', 'Sales', 72000, '2021-08-12']
      ];

      const sampleDepartments = [
        ['Engineering', 500000],
        ['Marketing', 200000],
        ['Sales', 300000],
        ['HR', 150000]
      ];

      const sampleProjects = [
        ['Website Redesign', 2, '2023-01-01', '2023-06-30'],
        ['Mobile App', 1, '2023-02-15', '2023-12-31'],
        ['Sales Campaign Q2', 3, '2023-04-01', '2023-06-30'],
        ['Employee Training', 4, '2023-03-01', '2023-05-31']
      ];

      // Check if data already exists
      const employeeCount = this.db.exec('SELECT COUNT(*) as count FROM employees')[0];
      if (!employeeCount || employeeCount.values[0][0] === 0) {
        // Insert sample data
        sampleEmployees.forEach(emp => {
          this.db!.run('INSERT INTO employees (name, department, salary, hire_date) VALUES (?, ?, ?, ?)', emp);
        });

        sampleDepartments.forEach(dept => {
          this.db!.run('INSERT INTO departments (name, budget) VALUES (?, ?)', dept);
        });

        sampleProjects.forEach(proj => {
          this.db!.run('INSERT INTO projects (name, department_id, start_date, end_date) VALUES (?, ?, ?, ?)', proj);
        });
      }

      console.log('✓ SQL sample data initialized');
    } catch (error) {
      console.warn('Failed to initialize sample data:', error);
    }
  }

  // Private methods

  private async initializeSqlJs(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadSqlJsRuntime();
    return this.loadPromise;
  }

  private async loadSqlJsRuntime(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('SQL.js can only run in browser environment');
    }

    this.isLoading = true;

    try {
      // Load sql.js script if not already loaded
      if (!window.initSqlJs) {
        await this.loadSqlJsScript();
      }

      // Initialize sql.js
      this.SQL = await window.initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });

      // Create database
      this.db = new this.SQL.Database();

      // Initialize with sample data
      await this.initializeSampleData();

      console.log('✓ SQL.js initialized with sample data');

    } catch (error) {
      throw new Error(`Failed to load SQL.js: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadSqlJsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://sql.js.org/dist/sql-wasm.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load SQL.js script'));
      document.head.appendChild(script);
    });
  }

  private async ensureSqlJsLoaded(): Promise<void> {
    if (this.SQL && this.db) {
      return;
    }

    if (this.isLoading && this.loadPromise) {
      await this.loadPromise;
      return;
    }

    await this.initializeSqlJs();
  }

  private async executeWithTimeout(sql: string, timeout: number): Promise<QueryExecResult[]> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`SQL execution timed out after ${timeout}ms`));
      }, timeout);

      try {
        const results = this.db!.exec(sql);
        clearTimeout(timeoutId);
        resolve(results);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  private formatSqlError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error && error.message) {
      // Clean up sql.js error messages
      let message = error.message;
      
      // Remove file paths and line numbers for cleaner errors
      message = message.replace(/at line \d+/g, '');
      message = message.replace(/\[object Object\]/g, '');
      
      return message.trim();
    }

    return 'SQL execution error occurred';
  }

  private formatResults(results: QueryExecResult[], sql: string): { output: string; visualOutput?: string } {
    if (!results || results.length === 0) {
      const queryType = this.detectQueryType(sql);
      if (['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'].includes(queryType)) {
        return { output: `${queryType} statement executed successfully.` };
      }
      return { output: 'Query executed successfully. No results returned.' };
    }

    let output = '';
    let visualOutput = '';

    results.forEach((result, index) => {
      if (result.columns && result.columns.length > 0) {
        // Text output
        output += `Query ${index + 1} Results:\n`;
        output += `Columns: ${result.columns.join(', ')}\n`;
        output += `Rows: ${result.values.length}\n\n`;

        if (result.values.length > 0) {
          // Show first few rows in text output
          const maxRows = Math.min(5, result.values.length);
          for (let i = 0; i < maxRows; i++) {
            output += `Row ${i + 1}: ${result.values[i].join(' | ')}\n`;
          }
          if (result.values.length > maxRows) {
            output += `... and ${result.values.length - maxRows} more rows\n`;
          }
        }
        output += '\n';

        // HTML table output for visualization
        visualOutput += this.createHtmlTable(result, index + 1);
      }
    });

    return { 
      output: output.trim() || 'Query executed successfully.',
      visualOutput: visualOutput || undefined
    };
  }

  private createHtmlTable(result: QueryExecResult, queryIndex: number): string {
    if (!result.columns || result.columns.length === 0) {
      return '';
    }

    let html = `<div class="sql-result-table mb-6">`;
    html += `<h4 class="font-medium mb-3 text-gray-800">Query ${queryIndex} Results (${result.values.length} rows)</h4>`;
    
    html += `<div class="overflow-x-auto">`;
    html += `<table class="min-w-full border-collapse border border-gray-300 text-sm">`;
    
    // Header
    html += `<thead class="bg-gray-50">`;
    html += `<tr>`;
    result.columns.forEach(column => {
      html += `<th class="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">${this.escapeHtml(column)}</th>`;
    });
    html += `</tr>`;
    html += `</thead>`;
    
    // Body
    html += `<tbody>`;
    result.values.forEach((row, rowIndex) => {
      html += `<tr class="${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50">`;
      row.forEach(cell => {
        const cellValue = cell === null ? '<em class="text-gray-400">NULL</em>' : this.escapeHtml(String(cell));
        html += `<td class="border border-gray-300 px-4 py-2">${cellValue}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody>`;
    
    html += `</table>`;
    html += `</div>`;
    html += `</div>`;

    return html;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private detectQueryType(sql: string): string {
    const trimmed = sql.trim().toUpperCase();
    const firstWord = trimmed.split(/\s+/)[0];
    return firstWord || 'UNKNOWN';
  }

  private extractTableNames(sql: string): string[] {
    const tables: string[] = [];
    const upperSql = sql.toUpperCase();
    
    // Simple regex patterns to extract table names
    const patterns = [
      /FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /TABLE\s+([a-zA-Z_][a-zA-Z0-9_]*)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(upperSql)) !== null) {
        if (match[1] && !tables.includes(match[1])) {
          tables.push(match[1]);
        }
      }
    });

    return tables;
  }
}