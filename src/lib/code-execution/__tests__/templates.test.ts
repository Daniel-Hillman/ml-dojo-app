/**
 * Unit tests for the Templates System
 */

import {
  CodeTemplate,
  getTemplatesForLanguage,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByTag,
  searchTemplates,
  LANGUAGE_TEMPLATES
} from '../templates';

describe('Templates System', () => {
  describe('Template Structure', () => {
    test('should have templates for all supported languages', () => {
      const supportedLanguages = [
        'javascript', 'typescript', 'html', 'css', 'python', 
        'sql', 'json', 'yaml', 'markdown', 'regex', 'bash'
      ];

      supportedLanguages.forEach(lang => {
        expect(LANGUAGE_TEMPLATES[lang as keyof typeof LANGUAGE_TEMPLATES]).toBeDefined();
      });
    });

    test('should have valid template structure', () => {
      const jsTemplates = getTemplatesForLanguage('javascript');
      expect(jsTemplates.length).toBeGreaterThan(0);

      const template = jsTemplates[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('title');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('code');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('tags');
      expect(template).toHaveProperty('difficulty');

      expect(typeof template.id).toBe('string');
      expect(typeof template.title).toBe('string');
      expect(typeof template.description).toBe('string');
      expect(typeof template.code).toBe('string');
      expect(['starter', 'example', 'tutorial', 'advanced']).toContain(template.category);
      expect(Array.isArray(template.tags)).toBe(true);
      expect(['beginner', 'intermediate', 'advanced']).toContain(template.difficulty);
    });
  });

  describe('Template Retrieval Functions', () => {
    test('getTemplatesForLanguage should return templates for valid language', () => {
      const jsTemplates = getTemplatesForLanguage('javascript');
      expect(Array.isArray(jsTemplates)).toBe(true);
      expect(jsTemplates.length).toBeGreaterThan(0);

      const pythonTemplates = getTemplatesForLanguage('python');
      expect(Array.isArray(pythonTemplates)).toBe(true);
      expect(pythonTemplates.length).toBeGreaterThan(0);
    });

    test('getTemplatesForLanguage should return empty array for invalid language', () => {
      const templates = getTemplatesForLanguage('invalid' as any);
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBe(0);
    });

    test('getTemplateById should return correct template', () => {
      const template = getTemplateById('js-hello-world');
      expect(template).toBeDefined();
      expect(template?.id).toBe('js-hello-world');
      expect(template?.title).toContain('Hello World');
    });

    test('getTemplateById should return undefined for invalid id', () => {
      const template = getTemplateById('invalid-id');
      expect(template).toBeUndefined();
    });

    test('getTemplatesByCategory should filter by category', () => {
      const starterTemplates = getTemplatesByCategory('starter');
      expect(Array.isArray(starterTemplates)).toBe(true);
      starterTemplates.forEach(template => {
        expect(template.category).toBe('starter');
      });

      const tutorialTemplates = getTemplatesByCategory('tutorial');
      expect(Array.isArray(tutorialTemplates)).toBe(true);
      tutorialTemplates.forEach(template => {
        expect(template.category).toBe('tutorial');
      });
    });

    test('getTemplatesByTag should filter by tag', () => {
      const basicTemplates = getTemplatesByTag('basics');
      expect(Array.isArray(basicTemplates)).toBe(true);
      basicTemplates.forEach(template => {
        expect(template.tags).toContain('basics');
      });
    });
  });

  describe('Search Functionality', () => {
    test('searchTemplates should find templates by title', () => {
      const results = searchTemplates('hello world');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const hasHelloWorld = results.some(template => 
        template.title.toLowerCase().includes('hello world')
      );
      expect(hasHelloWorld).toBe(true);
    });

    test('searchTemplates should find templates by description', () => {
      const results = searchTemplates('basic');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    test('searchTemplates should find templates by tags', () => {
      const results = searchTemplates('functions');
      expect(Array.isArray(results)).toBe(true);
      
      const hasFunctionTag = results.some(template => 
        template.tags.includes('functions')
      );
      expect(hasFunctionTag).toBe(true);
    });

    test('searchTemplates should return empty array for no matches', () => {
      const results = searchTemplates('nonexistent-search-term-xyz');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    test('searchTemplates should be case insensitive', () => {
      const lowerResults = searchTemplates('javascript');
      const upperResults = searchTemplates('JAVASCRIPT');
      const mixedResults = searchTemplates('JavaScript');

      expect(lowerResults.length).toBeGreaterThan(0);
      expect(upperResults.length).toBe(lowerResults.length);
      expect(mixedResults.length).toBe(lowerResults.length);
    });
  });

  describe('Template Content Quality', () => {
    test('all templates should have non-empty code', () => {
      Object.values(LANGUAGE_TEMPLATES).forEach(templates => {
        templates.forEach(template => {
          expect(template.code.trim().length).toBeGreaterThan(0);
        });
      });
    });

    test('all templates should have meaningful titles and descriptions', () => {
      Object.values(LANGUAGE_TEMPLATES).forEach(templates => {
        templates.forEach(template => {
          expect(template.title.length).toBeGreaterThan(3);
          expect(template.description.length).toBeGreaterThan(10);
        });
      });
    });

    test('all templates should have at least one tag', () => {
      Object.values(LANGUAGE_TEMPLATES).forEach(templates => {
        templates.forEach(template => {
          expect(template.tags.length).toBeGreaterThan(0);
        });
      });
    });

    test('template IDs should be unique', () => {
      const allTemplates: CodeTemplate[] = [];
      Object.values(LANGUAGE_TEMPLATES).forEach(templates => {
        allTemplates.push(...templates);
      });

      const ids = allTemplates.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Language-Specific Templates', () => {
    test('JavaScript templates should contain valid JavaScript', () => {
      const jsTemplates = getTemplatesForLanguage('javascript');
      const helloWorldTemplate = jsTemplates.find(t => t.id === 'js-hello-world');
      
      expect(helloWorldTemplate).toBeDefined();
      expect(helloWorldTemplate?.code).toContain('console.log');
    });

    test('Python templates should contain valid Python', () => {
      const pythonTemplates = getTemplatesForLanguage('python');
      const helloWorldTemplate = pythonTemplates.find(t => t.id === 'python-hello-world');
      
      expect(helloWorldTemplate).toBeDefined();
      expect(helloWorldTemplate?.code).toContain('print(');
    });

    test('SQL templates should contain valid SQL', () => {
      const sqlTemplates = getTemplatesForLanguage('sql');
      const basicTemplate = sqlTemplates.find(t => t.id === 'sql-basic-queries');
      
      expect(basicTemplate).toBeDefined();
      expect(basicTemplate?.code).toContain('SELECT');
      expect(basicTemplate?.code).toContain('FROM');
    });

    test('HTML templates should contain valid HTML', () => {
      const htmlTemplates = getTemplatesForLanguage('html');
      const basicTemplate = htmlTemplates.find(t => t.id === 'html-basic-page');
      
      expect(basicTemplate).toBeDefined();
      expect(basicTemplate?.code).toContain('<!DOCTYPE html>');
      expect(basicTemplate?.code).toContain('<html');
    });
  });

  describe('Template Categories and Difficulty', () => {
    test('should have templates in all categories', () => {
      const categories = ['starter', 'tutorial', 'example', 'advanced'];
      
      categories.forEach(category => {
        const templates = getTemplatesByCategory(category as any);
        expect(templates.length).toBeGreaterThan(0);
      });
    });

    test('should have templates at all difficulty levels', () => {
      const difficulties = ['beginner', 'intermediate', 'advanced'];
      
      difficulties.forEach(difficulty => {
        const allTemplates: CodeTemplate[] = [];
        Object.values(LANGUAGE_TEMPLATES).forEach(templates => {
          allTemplates.push(...templates);
        });
        
        const templatesAtLevel = allTemplates.filter(t => t.difficulty === difficulty);
        expect(templatesAtLevel.length).toBeGreaterThan(0);
      });
    });

    test('starter templates should be beginner level', () => {
      const starterTemplates = getTemplatesByCategory('starter');
      starterTemplates.forEach(template => {
        expect(template.difficulty).toBe('beginner');
      });
    });
  });
});