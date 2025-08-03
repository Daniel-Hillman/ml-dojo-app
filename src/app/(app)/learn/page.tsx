'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Code2, 
  BookOpen, 
  Play,
  Search,
  Target,
  Clock,
  ArrowRight,
  Zap
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const TemplateBrowser = dynamic(() => import('@/components/TemplateBrowser'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  ssr: false
});

const LiveCodeBlock = dynamic(() => import('@/components/LiveCodeBlock').then(mod => ({ default: mod.LiveCodeBlock })), {
  loading: () => (
    <div className="flex items-center justify-center h-96 border rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading code editor...</p>
      </div>
    </div>
  ),
  ssr: false
});
import { 
  CodeTemplate, 
  SupportedLanguage,
  LANGUAGE_TEMPLATES
} from '@/lib/code-execution/templates';
import { FloatingActionButton, useFloatingActionKeyboard } from '@/components/FloatingActionButton';
import Link from 'next/link';

export default function LearnPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<CodeTemplate | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');
  const [activeSection, setActiveSection] = useState<'browse' | 'learn' | 'practice'>('browse');

  // Enable floating action button keyboard shortcuts
  useFloatingActionKeyboard();

  const handleTemplateSelect = (template: CodeTemplate) => {
    setSelectedTemplate(template);
    setActiveSection('practice');
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

  const learningPaths = [
    {
      id: 'web-fundamentals',
      title: 'Web Development',
      description: 'HTML, CSS, and JavaScript fundamentals',
      languages: ['html', 'css', 'javascript'],
      difficulty: 'Beginner',
      icon: <Code2 className="w-5 h-5" />,
      color: 'bg-blue-500',
      templates: 8
    },
    {
      id: 'python-basics',
      title: 'Python Programming',
      description: 'Python basics to data analysis',
      languages: ['python'],
      difficulty: 'Beginner',
      icon: <Zap className="w-5 h-5" />,
      color: 'bg-green-500',
      templates: 5
    },
    {
      id: 'database-sql',
      title: 'Database & SQL',
      description: 'SQL queries and database concepts',
      languages: ['sql'],
      difficulty: 'Intermediate',
      icon: <Target className="w-5 h-5" />,
      color: 'bg-purple-500',
      templates: 5
    },
    {
      id: 'config-formats',
      title: 'Data Formats',
      description: 'JSON, YAML, and configuration files',
      languages: ['json', 'yaml', 'markdown'],
      difficulty: 'Beginner',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'bg-orange-500',
      templates: 5
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Code Examples & Templates</h1>
          <p className="text-muted-foreground">
            Interactive code examples and templates to help you learn and practice programming
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/playground">
            <Button 
              variant="outline"
              size="sm"
              className="bg-card border hover:bg-accent/50 transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              Try Live Code
            </Button>
          </Link>
          <Button 
            variant={activeSection === 'browse' ? 'default' : 'outline'}
            onClick={() => setActiveSection('browse')}
            size="sm"
          >
            <Search className="w-4 h-4 mr-2" />
            Browse
          </Button>
          <Button 
            variant={activeSection === 'learn' ? 'default' : 'outline'}
            onClick={() => setActiveSection('learn')}
            size="sm"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Learn
          </Button>
          <Button 
            variant={activeSection === 'practice' ? 'default' : 'outline'}
            onClick={() => setActiveSection('practice')}
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Practice
          </Button>
        </div>
      </div>

      {/* Browse Section */}
      {activeSection === 'browse' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Browse Code Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateBrowser
                onTemplateSelect={handleTemplateSelect}
                showLanguageFilter={true}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Learn Section */}
      {activeSection === 'learn' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Paths</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {learningPaths.map((path) => (
                  <Card key={path.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-lg ${path.color} text-white mb-2`}>
                          {path.icon}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {path.templates} examples
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{path.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{path.description}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1">
                          {path.languages.map((lang) => (
                            <Badge key={lang} variant="secondary" className="text-xs">
                              {getLanguageDisplayName(lang)}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {path.difficulty}
                          </div>
                        </div>

                        <Button 
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedLanguage(path.languages[0] as SupportedLanguage);
                            setActiveSection('practice');
                          }}
                        >
                          Start Learning
                          <ArrowRight className="w-3 h-3 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Practice Section */}
      {activeSection === 'practice' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Selector */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Choose Template</CardTitle>
              </CardHeader>
              <CardContent>
                <TemplateBrowser
                  language={selectedLanguage}
                  onTemplateSelect={handleTemplateSelect}
                  compact={true}
                />
              </CardContent>
            </Card>

            {/* Code Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  Interactive Code Editor
                  {selectedTemplate && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{selectedTemplate.title}</Badge>
                      <Badge variant="secondary">{selectedTemplate.difficulty}</Badge>
                    </div>
                  )}
                </CardTitle>
                {selectedTemplate && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedTemplate.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <LiveCodeBlock
                    initialCode={selectedTemplate.code}
                    language={getLanguageFromTemplate(selectedTemplate)}
                    height="500px"
                    showOutput={true}
                    allowEdit={true}
                    showTemplateButton={true}
                    onTemplateRequest={() => setActiveSection('browse')}
                  />
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <Code2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Ready to Code?</h3>
                    <p className="mb-4">Select a template from the left to start coding!</p>
                    <Button onClick={() => setActiveSection('browse')}>
                      Browse Templates
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton primaryAction="playground" />
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