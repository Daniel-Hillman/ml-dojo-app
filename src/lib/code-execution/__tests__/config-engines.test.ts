/**
 * Unit tests for Configuration Language Engines (JSON, YAML, Markdown, Regex)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { JsonExecutionEngine } from '../engines/json-engine';
import { YamlExecutionEngine } from '../engines/yaml-engine';
import { MarkdownExecutionEngine } from '../engines/markdown-engine';
import { RegexExecutionEngine } from '../engines/regex-engine';
import { CodeExecutionRequest } from '../types';

describe('Configuration Language Engines', () => {
  describe('JsonExecutionEngine', () => {
    let engine: JsonExecutionEngine;

    beforeEach(() => {
      engine = new JsonExecutionEngine();
    });

    it('should have correct name and supported languages', () => {
      expect(engine.name).toBe('json');
      expect(engine.supportedLanguages).toContain('json');
    });

    it('should validate and format valid JSON', async () => {
      const validJson = '{"name": "test", "value": 123, "active": true}';
      
      const result = await engine.execute({
        code: validJson,
        language: 'json',
        sessionId: 'json-test-1'
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('JSON is valid');
      expect(result.visualOutput).toContain('formatted');
      expect(result.metadata?.isValid).toBe(true);
    });

    it('should handle invalid JSON with helpful errors', async () => {
      const invalidJson = '{"name": "test", "value": 123,}'; // trailing comma
      
      const result = await engine.execute({
        code: invalidJson,
        language: 'json',
        sessionId: 'json-test-2'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON syntax error');
      expect(result.metadata?.isValid).toBe(false);
    });

    it('should format nested JSON structures', async () => {
      const nestedJson = '{"user":{"name":"Alice","preferences":{"theme":"dark","notifications":true}}}';
      
      const result = await engine.execute({
        code: nestedJson,
        language: 'json',
        sessionId: 'json-test-3'
      });

      expect(result.success).toBe(true);
      expect(result.visualOutput).toContain('user');
      expect(result.visualOutput).toContain('preferences');
      expect(result.visualOutput).toContain('theme');
    });

    it('should handle empty JSON', async () => {
      const result = await engine.execute({
        code: '',
        language: 'json',
        sessionId: 'json-test-4'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should validate JSON arrays', async () => {
      const jsonArray = '[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]';
      
      const result = await engine.execute({
        code: jsonArray,
        language: 'json',
        sessionId: 'json-test-5'
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.type).toBe('array');
      expect(result.metadata?.itemCount).toBe(2);
    });
  });

  describe('YamlExecutionEngine', () => {
    let engine: YamlExecutionEngine;

    beforeEach(() => {
      engine = new YamlExecutionEngine();
    });

    it('should have correct name and supported languages', () => {
      expect(engine.name).toBe('yaml');
      expect(engine.supportedLanguages).toContain('yaml');
      expect(engine.supportedLanguages).toContain('yml');
    });

    it('should validate and format valid YAML', async () => {
      const validYaml = `
name: test-app
version: 1.0.0
dependencies:
  - express
  - mongoose
config:
  port: 3000
  debug: true
      `.trim();
      
      const result = await engine.execute({
        code: validYaml,
        language: 'yaml',
        sessionId: 'yaml-test-1'
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('YAML is valid');
      expect(result.visualOutput).toContain('name');
      expect(result.visualOutput).toContain('dependencies');
      expect(result.metadata?.isValid).toBe(true);
    });

    it('should handle invalid YAML with helpful errors', async () => {
      const invalidYaml = `
name: test
  invalid: indentation
      `.trim();
      
      const result = await engine.execute({
        code: invalidYaml,
        language: 'yaml',
        sessionId: 'yaml-test-2'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('YAML syntax error');
      expect(result.metadata?.isValid).toBe(false);
    });

    it('should handle YAML with different data types', async () => {
      const yamlWithTypes = `
string_value: "hello world"
number_value: 42
boolean_value: true
null_value: null
array_value:
  - item1
  - item2
  - item3
object_value:
  nested_key: nested_value
      `.trim();
      
      const result = await engine.execute({
        code: yamlWithTypes,
        language: 'yaml',
        sessionId: 'yaml-test-3'
      });

      expect(result.success).toBe(true);
      expect(result.visualOutput).toContain('string_value');
      expect(result.visualOutput).toContain('array_value');
      expect(result.visualOutput).toContain('object_value');
    });

    it('should convert YAML to JSON', async () => {
      const yaml = `
name: test
version: 1.0
      `.trim();
      
      const result = await engine.execute({
        code: yaml,
        language: 'yaml',
        sessionId: 'yaml-test-4'
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.jsonEquivalent).toBeDefined();
      expect(result.metadata?.jsonEquivalent).toContain('"name"');
      expect(result.metadata?.jsonEquivalent).toContain('"version"');
    });
  });

  describe('MarkdownExecutionEngine', () => {
    let engine: MarkdownExecutionEngine;

    beforeEach(() => {
      engine = new MarkdownExecutionEngine();
    });

    it('should have correct name and supported languages', () => {
      expect(engine.name).toBe('markdown');
      expect(engine.supportedLanguages).toContain('markdown');
      expect(engine.supportedLanguages).toContain('md');
    });

    it('should render basic markdown elements', async () => {
      const markdown = `
# Main Title

This is a **bold** text and this is *italic*.

## Subtitle

- List item 1
- List item 2
- List item 3

[Link to example](https://example.com)

\`inline code\`

\`\`\`javascript
console.log("code block");
\`\`\`
      `.trim();
      
      const result = await engine.execute({
        code: markdown,
        language: 'markdown',
        sessionId: 'md-test-1'
      });

      expect(result.success).toBe(true);
      expect(result.visualOutput).toContain('<h1>');
      expect(result.visualOutput).toContain('<strong>');
      expect(result.visualOutput).toContain('<em>');
      expect(result.visualOutput).toContain('<ul>');
      expect(result.visualOutput).toContain('<a href=');
      expect(result.visualOutput).toContain('<code>');
    });

    it('should handle tables in markdown', async () => {
      const markdownTable = `
| Name | Age | City |
|------|-----|------|
| Alice | 30 | New York |
| Bob | 25 | London |
| Charlie | 35 | Tokyo |
      `.trim();
      
      const result = await engine.execute({
        code: markdownTable,
        language: 'markdown',
        sessionId: 'md-test-2'
      });

      expect(result.success).toBe(true);
      expect(result.visualOutput).toContain('<table>');
      expect(result.visualOutput).toContain('<th>');
      expect(result.visualOutput).toContain('<td>');
      expect(result.visualOutput).toContain('Alice');
      expect(result.visualOutput).toContain('Bob');
    });

    it('should sanitize potentially dangerous HTML', async () => {
      const dangerousMarkdown = `
# Title

<script>alert('xss')</script>

<img src="x" onerror="alert('xss')">

Normal **text** continues.
      `.trim();
      
      const result = await engine.execute({
        code: dangerousMarkdown,
        language: 'markdown',
        sessionId: 'md-test-3'
      });

      expect(result.success).toBe(true);
      expect(result.visualOutput).not.toContain('<script>');
      expect(result.visualOutput).not.toContain('onerror=');
      expect(result.visualOutput).toContain('<strong>text</strong>');
    });

    it('should provide markdown statistics', async () => {
      const markdown = `
# Title
## Subtitle
### Sub-subtitle

Paragraph 1 with some text.

Paragraph 2 with more text.

- Item 1
- Item 2

1. Numbered item 1
2. Numbered item 2

[Link](https://example.com)
      `.trim();
      
      const result = await engine.execute({
        code: markdown,
        language: 'markdown',
        sessionId: 'md-test-4'
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.statistics).toBeDefined();
      expect(result.metadata?.statistics.headings).toBeGreaterThan(0);
      expect(result.metadata?.statistics.paragraphs).toBeGreaterThan(0);
      expect(result.metadata?.statistics.links).toBeGreaterThan(0);
    });

    it('should handle empty markdown', async () => {
      const result = await engine.execute({
        code: '',
        language: 'markdown',
        sessionId: 'md-test-5'
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('empty');
      expect(result.visualOutput).toBe('');
    });
  });

  describe('RegexExecutionEngine', () => {
    let engine: RegexExecutionEngine;

    beforeEach(() => {
      engine = new RegexExecutionEngine();
    });

    it('should have correct name and supported languages', () => {
      expect(engine.name).toBe('regex');
      expect(engine.supportedLanguages).toContain('regex');
      expect(engine.supportedLanguages).toContain('regexp');
    });

    it('should test regex patterns with sample text', async () => {
      const regexCode = `
pattern: \\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b
flags: gi
test_text: |
  Contact us at support@example.com or sales@company.org
  Invalid emails: notanemail, @invalid.com, user@
      `.trim();
      
      const result = await engine.execute({
        code: regexCode,
        language: 'regex',
        sessionId: 'regex-test-1'
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('matches found');
      expect(result.visualOutput).toContain('support@example.com');
      expect(result.visualOutput).toContain('sales@company.org');
      expect(result.metadata?.matches).toBeDefined();
      expect(result.metadata?.matches.length).toBe(2);
    });

    it('should handle regex with capture groups', async () => {
      const regexCode = `
pattern: (\\d{4})-(\\d{2})-(\\d{2})
flags: g
test_text: |
  Important dates: 2023-12-25, 2024-01-01, and 2024-07-04
      `.trim();
      
      const result = await engine.execute({
        code: regexCode,
        language: 'regex',
        sessionId: 'regex-test-2'
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.matches).toBeDefined();
      expect(result.metadata?.matches.length).toBe(3);
      expect(result.visualOutput).toContain('2023-12-25');
      expect(result.visualOutput).toContain('Group 1');
      expect(result.visualOutput).toContain('Group 2');
    });

    it('should validate regex syntax', async () => {
      const invalidRegexCode = `
pattern: [invalid regex (
flags: g
test_text: test
      `.trim();
      
      const result = await engine.execute({
        code: invalidRegexCode,
        language: 'regex',
        sessionId: 'regex-test-3'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid regex');
    });

    it('should handle regex with no matches', async () => {
      const regexCode = `
pattern: \\d+
flags: g
test_text: |
  This text has no numbers in it at all.
      `.trim();
      
      const result = await engine.execute({
        code: regexCode,
        language: 'regex',
        sessionId: 'regex-test-4'
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('No matches found');
      expect(result.metadata?.matches).toBeDefined();
      expect(result.metadata?.matches.length).toBe(0);
    });

    it('should provide regex explanation and tips', async () => {
      const regexCode = `
pattern: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$
flags: i
test_text: user@example.com
      `.trim();
      
      const result = await engine.execute({
        code: regexCode,
        language: 'regex',
        sessionId: 'regex-test-5'
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.explanation).toBeDefined();
      expect(result.metadata?.explanation).toContain('email');
    });

    it('should handle different regex flags', async () => {
      const testCases = [
        { flags: 'i', description: 'case insensitive' },
        { flags: 'g', description: 'global' },
        { flags: 'm', description: 'multiline' },
        { flags: 'gi', description: 'global and case insensitive' }
      ];

      for (const testCase of testCases) {
        const regexCode = `
pattern: test
flags: ${testCase.flags}
test_text: |
  Test
  TEST
  test
        `.trim();
        
        const result = await engine.execute({
          code: regexCode,
          language: 'regex',
          sessionId: `regex-flags-${testCase.flags}`
        });

        expect(result.success).toBe(true);
        expect(result.metadata?.flags).toBe(testCase.flags);
      }
    });

    it('should handle complex regex patterns', async () => {
      const regexCode = `
pattern: (?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)
flags: g
test_text: |
  Valid IPs: 192.168.1.1, 10.0.0.1, 255.255.255.255
  Invalid IPs: 256.1.1.1, 192.168.1, not.an.ip.address
      `.trim();
      
      const result = await engine.execute({
        code: regexCode,
        language: 'regex',
        sessionId: 'regex-test-complex'
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.matches).toBeDefined();
      expect(result.metadata?.matches.length).toBe(3); // Only valid IPs should match
      expect(result.visualOutput).toContain('192.168.1.1');
      expect(result.visualOutput).toContain('10.0.0.1');
      expect(result.visualOutput).toContain('255.255.255.255');
    });
  });

  describe('Cross-Engine Integration', () => {
    it('should handle JSON to YAML conversion workflow', async () => {
      const jsonEngine = new JsonExecutionEngine();
      const yamlEngine = new YamlExecutionEngine();

      // First, validate JSON
      const jsonResult = await jsonEngine.execute({
        code: '{"name": "test", "version": "1.0.0", "dependencies": ["express"]}',
        language: 'json',
        sessionId: 'json-to-yaml-1'
      });

      expect(jsonResult.success).toBe(true);

      // Then convert to YAML format (simulated)
      const yamlEquivalent = `
name: test
version: "1.0.0"
dependencies:
  - express
      `.trim();

      const yamlResult = await yamlEngine.execute({
        code: yamlEquivalent,
        language: 'yaml',
        sessionId: 'json-to-yaml-2'
      });

      expect(yamlResult.success).toBe(true);
    });

    it('should validate configuration files in different formats', async () => {
      const engines = [
        { engine: new JsonExecutionEngine(), code: '{"valid": true}', language: 'json' },
        { engine: new YamlExecutionEngine(), code: 'valid: true', language: 'yaml' }
      ];

      for (const { engine, code, language } of engines) {
        const result = await engine.execute({
          code,
          language: language as any,
          sessionId: `config-validation-${language}`
        });

        expect(result.success).toBe(true);
        expect(result.metadata?.isValid).toBe(true);
      }
    });
  });
});