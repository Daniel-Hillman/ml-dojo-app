/**
 * Unit tests for SQL Execution Engine
 */

import { SqlExecutionEngine } from '../engines/sql-engine';
import { CodeExecutionRequest } from '../types';

// Mock sql.js for testing
const mockDatabase = {
  exec: jest.fn(),
  run: jest.fn(),
  prepare: jest.fn(() => ({
    free: jest.fn()
  })),
  close: jest.fn(),
  export: jest.fn()
};

const mockSqlJs = {
  Database: jest.fn(() => mockDatabase)
};

// Mock window.initSqlJs
Object.defineProperty(window, 'initSqlJs', {
  value: jest.fn(() => Promise.resolve(mockSqlJs)),
  writable: true
});

describe('SqlExecutionEngine', () => {
  let engine: SqlExecutionEngine;

  beforeEach(() => {
    engine = new SqlExecutionEngine();
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    test('should have correct name and supported languages', () => {
      expect(engine.name).toBe('sql.js');
      expect(engine.supportedLanguages).toContain('sql');
    });

    test('should validate simple SQL code', async () => {
      const isValid = await engine.validateCode('SELECT * FROM users');
      expect(isValid).toBe(true);
    });

    test('should handle empty code validation', async () => {
      const isValid = await engine.validateCode('');
      expect(isValid).toBe(true);
    });
  });

  describe('Code execution', () => {
    const mockRequest: CodeExecutionRequest = {
      code: 'SELECT * FROM employees LIMIT 5',
      language: 'sql',
      sessionId: 'test-session'
    };

    test('should execute simple SELECT query', async () => {
      // Mock successful query execution
      mockDatabase.exec.mockReturnValue([
        {
          columns: ['id', 'name', 'department'],
          values: [
            [1, 'Alice', 'Engineering'],
            [2, 'Bob', 'Marketing']
          ]
        }
      ]);

      const result = await engine.execute(mockRequest);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Query 1 Results');
      expect(result.output).toContain('Columns: id, name, department');
      expect(result.output).toContain('Rows: 2');
      expect(result.visualOutput).toContain('<table');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    test('should handle SQL errors gracefully', async () => {
      // Mock SQL error
      mockDatabase.exec.mockImplementation(() => {
        throw new Error('SQL syntax error');
      });

      const result = await engine.execute({
        ...mockRequest,
        code: 'INVALID SQL QUERY'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('SQL syntax error');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    test('should handle empty query', async () => {
      const result = await engine.execute({
        ...mockRequest,
        code: ''
      });

      expect(result.success).toBe(true);
      expect(result.output).toBe('No SQL query provided');
    });

    test('should handle INSERT/UPDATE/DELETE queries', async () => {
      mockDatabase.exec.mockReturnValue([]);

      const result = await engine.execute({
        ...mockRequest,
        code: 'INSERT INTO users (name) VALUES ("Test")'
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('INSERT statement executed successfully');
    });
  });

  describe('Result formatting', () => {
    test('should format query results with HTML table', async () => {
      mockDatabase.exec.mockReturnValue([
        {
          columns: ['id', 'name', 'active'],
          values: [
            [1, 'Alice', 1],
            [2, null, 0]
          ]
        }
      ]);

      const result = await engine.execute({
        code: 'SELECT * FROM users',
        language: 'sql',
        sessionId: 'test'
      });

      expect(result.visualOutput).toContain('<table');
      expect(result.visualOutput).toContain('<th');
      expect(result.visualOutput).toContain('<td');
      expect(result.visualOutput).toContain('Alice');
      expect(result.visualOutput).toContain('NULL</em>'); // NULL value formatting
    });

    test('should handle multiple query results', async () => {
      mockDatabase.exec.mockReturnValue([
        {
          columns: ['count'],
          values: [[5]]
        },
        {
          columns: ['name'],
          values: [['Alice'], ['Bob']]
        }
      ]);

      const result = await engine.execute({
        code: 'SELECT COUNT(*) FROM users; SELECT name FROM users;',
        language: 'sql',
        sessionId: 'test'
      });

      expect(result.output).toContain('Query 1 Results');
      expect(result.output).toContain('Query 2 Results');
      expect(result.visualOutput).toContain('Query 1 Results');
      expect(result.visualOutput).toContain('Query 2 Results');
    });
  });

  describe('Query analysis', () => {
    test('should detect query types correctly', async () => {
      const testCases = [
        { sql: 'SELECT * FROM users', expectedType: 'SELECT' },
        { sql: 'INSERT INTO users VALUES (1)', expectedType: 'INSERT' },
        { sql: 'UPDATE users SET name = "test"', expectedType: 'UPDATE' },
        { sql: 'DELETE FROM users WHERE id = 1', expectedType: 'DELETE' },
        { sql: 'CREATE TABLE test (id INT)', expectedType: 'CREATE' }
      ];

      for (const testCase of testCases) {
        mockDatabase.exec.mockReturnValue([]);
        
        const result = await engine.execute({
          code: testCase.sql,
          language: 'sql',
          sessionId: 'test'
        });

        expect(result.metadata?.queryType).toBe(testCase.expectedType);
      }
    });

    test('should extract table names from queries', async () => {
      mockDatabase.exec.mockReturnValue([
        {
          columns: ['name'],
          values: [['Alice']]
        }
      ]);

      const result = await engine.execute({
        code: 'SELECT u.name FROM users u JOIN departments d ON u.dept_id = d.id',
        language: 'sql',
        sessionId: 'test'
      });

      expect(result.metadata?.tablesInvolved).toContain('USERS');
      expect(result.metadata?.tablesInvolved).toContain('DEPARTMENTS');
    });
  });

  describe('Error handling', () => {
    test('should format SQL errors nicely', async () => {
      mockDatabase.exec.mockImplementation(() => {
        throw new Error('near "INVALID": syntax error at line 1');
      });

      const result = await engine.execute({
        code: 'INVALID SQL',
        language: 'sql',
        sessionId: 'test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('syntax error');
      expect(result.error).not.toContain('at line 1'); // Should be cleaned up
    });

    test('should handle timeout errors', async () => {
      mockDatabase.exec.mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });

      const result = await engine.execute({
        code: 'SELECT * FROM users',
        language: 'sql',
        sessionId: 'test',
        options: { timeout: 100 }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });
  });

  describe('HTML escaping', () => {
    test('should escape HTML in query results', async () => {
      mockDatabase.exec.mockReturnValue([
        {
          columns: ['content'],
          values: [['<script>alert("xss")</script>']]
        }
      ]);

      const result = await engine.execute({
        code: 'SELECT content FROM posts',
        language: 'sql',
        sessionId: 'test'
      });

      expect(result.visualOutput).not.toContain('<script>');
      expect(result.visualOutput).toContain('&lt;script&gt;');
    });
  });
});