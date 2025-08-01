'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  BookOpen, 
  Lightbulb,
  Play,
  Search,
  Filter,
  Star
} from 'lucide-react';
import { TemplateBrowser } from '@/components/TemplateBrowser';
import { LiveCodeBlock } from '@/components/LiveCodeBlock';
import { 
  CodeTemplate, 
  SupportedLanguage,
  getTemplatesForLanguage,
  getTemplatesByCategory,
  LANGUAGE_TEMPLATES
} from '@/lib/code-execution/templates';

export default function TestTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<CodeTemplate | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');

  // Get statistics
  const totalTemplates = Object.values(LANGUAGE_TEMPLATES).reduce((sum, templates) => sum + templates.length, 0);
  const languageCount = Object.keys(LANGUAGE_TEMPLATES).length;
  const starterTemplates = getTemplatesByCategory('starter').length;
  const advancedTemplates = getTemplatesByCategory('advanced').length;

  const handleTemplateSelect = (template: CodeTemplate) => {
    setSelectedTemplate(template);
  };

  const getLanguageDisplayName = (lang: string) => {
    const names: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      html: 'HTML',
      css: 'CSS',
      python: 'Python',
      sql: 'SQL',
      json: 'JSON',
      yaml: 'YAML',
      markdown: 'Markdown',
      regex: 'RegEx',
      bash: 'Bash'
    };
    return names[lang] || lang;
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Code Templates & Examples</h1>
          <Badge variant="outline" className="text-sm">
            Task 10 Implementation
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Explore our comprehensive collection of code templates, examples, and interactive tutorials 
          for multiple programming languages. Get started quickly with pre-built code snippets.
        </p>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Template Library Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalTemplates}</div>
              <div className="text-sm text-muted-foreground">Total Templates</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{languageCount}</div>
              <div className="text-sm text-muted-foreground">Languages Supported</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{starterTemplates}</div>
              <div className="text-sm text-muted-foreground">Starter Templates</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{advancedTemplates}</div>
              <div className="text-sm text-muted-foreground">Advanced Examples</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Languages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(LANGUAGE_TEMPLATES).map(([lang, templates]) => (
              <div
                key={lang}
                className={`p-4 border rounded-lg text-center cursor-pointer transition-colors ${
                  selectedLanguage === lang ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedLanguage(lang as SupportedLanguage)}
              >
                <div className="font-medium">{getLanguageDisplayName(lang)}</div>
                <div className="text-sm text-muted-foreground">{templates.length} templates</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Browse Templates
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            By Category
          </TabsTrigger>
          <TabsTrigger value="interactive" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Try Interactive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <TemplateBrowser
            onTemplateSelect={handleTemplateSelect}
            showLanguageFilter={true}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['starter', 'tutorial', 'example', 'advanced'].map((category) => {
              const templates = getTemplatesByCategory(category as any);
              const icons = {
                starter: <Play className="w-6 h-6" />,
                tutorial: <BookOpen className="w-6 h-6" />,
                example: <Code className="w-6 h-6" />,
                advanced: <Star className="w-6 h-6" />
              };
              
              return (
                <Card key={category} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2 text-blue-600">
                      {icons[category as keyof typeof icons]}
                    </div>
                    <CardTitle className="capitalize">{category}</CardTitle>
                    <Badge variant="outline">{templates.length} templates</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {templates.slice(0, 3).map((template) => (
                        <div
                          key={template.id}
                          className="p-2 border rounded text-sm hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <div className="font-medium">{template.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {template.description}
                          </div>
                        </div>
                      ))}
                      {templates.length > 3 && (
                        <div className="text-xs text-center text-muted-foreground">
                          +{templates.length - 3} more templates
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="interactive" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select a Template</CardTitle>
              </CardHeader>
              <CardContent>
                <TemplateBrowser
                  language={selectedLanguage}
                  onTemplateSelect={handleTemplateSelect}
                  compact={true}
                />
              </CardContent>
            </Card>

            {/* Live Code Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Interactive Code Editor</CardTitle>
                {selectedTemplate && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedTemplate.title}</Badge>
                    <Badge variant="secondary">{selectedTemplate.difficulty}</Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplate.description}
                    </p>
                    <LiveCodeBlock
                      initialCode={selectedTemplate.code}
                      language={getLanguageFromTemplate(selectedTemplate)}
                      height="400px"
                      showOutput={true}
                      allowEdit={true}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select a template from the left to start coding!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Template System Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Smart Search</h3>
                <p className="text-sm text-muted-foreground">
                  Find templates by name, description, tags, or difficulty level
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Filter className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Advanced Filtering</h3>
                <p className="text-sm text-muted-foreground">
                  Filter by language, category, difficulty, and tags
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Play className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Interactive Execution</h3>
                <p className="text-sm text-muted-foreground">
                  Run templates directly in the browser with live output
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium">Learning Paths</h3>
                <p className="text-sm text-muted-foreground">
                  Structured progression from beginner to advanced concepts
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Code className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium">Multi-Language Support</h3>
                <p className="text-sm text-muted-foreground">
                  Templates for web development, Python, SQL, and more
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium">Best Practices</h3>
                <p className="text-sm text-muted-foreground">
                  Learn industry standards and coding conventions
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to determine language from template
function getLanguageFromTemplate(template: CodeTemplate): SupportedLanguage {
  // Find which language this template belongs to
  for (const [lang, templates] of Object.entries(LANGUAGE_TEMPLATES)) {
    if (templates.some(t => t.id === template.id)) {
      return lang as SupportedLanguage;
    }
  }
  return 'javascript'; // fallback
}