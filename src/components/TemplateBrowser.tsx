'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Code, 
  Play, 
  BookOpen, 
  Lightbulb,
  Star,
  Filter,
  Copy
} from 'lucide-react';
import { 
  CodeTemplate, 
  SupportedLanguage,
  getTemplatesForLanguage,
  searchTemplates,
  LANGUAGE_TEMPLATES
} from '@/lib/code-execution/templates';

interface TemplateBrowserProps {
  language?: SupportedLanguage;
  onTemplateSelect?: (template: CodeTemplate) => void;
  onCodeInsert?: (code: string) => void;
  showLanguageFilter?: boolean;
  compact?: boolean;
}

export const TemplateBrowser: React.FC<TemplateBrowserProps> = ({
  language,
  onTemplateSelect,
  onCodeInsert,
  showLanguageFilter = true,
  compact = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | 'all'>(language || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Get filtered templates
  const filteredTemplates = useMemo(() => {
    let templates: CodeTemplate[] = [];

    if (selectedLanguage === 'all') {
      // Get all templates
      for (const lang of Object.keys(LANGUAGE_TEMPLATES) as SupportedLanguage[]) {
        templates.push(...getTemplatesForLanguage(lang));
      }
    } else {
      templates = getTemplatesForLanguage(selectedLanguage);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const searchResults = searchTemplates(searchQuery);
      templates = templates.filter(t => searchResults.some(s => s.id === t.id));
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory);
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      templates = templates.filter(t => t.difficulty === selectedDifficulty);
    }

    return templates;
  }, [selectedLanguage, searchQuery, selectedCategory, selectedDifficulty]);

  // Get available languages with template counts
  const languageStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const [lang, templates] of Object.entries(LANGUAGE_TEMPLATES)) {
      stats[lang] = templates.length;
    }
    return stats;
  }, []);

  const handleTemplateSelect = (template: CodeTemplate) => {
    onTemplateSelect?.(template);
    onCodeInsert?.(template.code);
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'starter': return <Play className="w-4 h-4" />;
      case 'tutorial': return <BookOpen className="w-4 h-4" />;
      case 'example': return <Code className="w-4 h-4" />;
      case 'advanced': return <Star className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Compact Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Compact Template List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(template.category)}
                  <h4 className="font-medium text-sm truncate">{template.title}</h4>
                  <Badge variant="outline" className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                    {template.difficulty}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 truncate mt-1">{template.description}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(template.code);
              }}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Code Templates</h2>
          <p className="text-gray-600">Browse and use pre-built code examples</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredTemplates.length} templates
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search templates by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {showLanguageFilter && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage | 'all')}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Languages</option>
                {Object.entries(languageStats).map(([lang, count]) => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)} ({count})
                  </option>
                ))}
              </select>
            </div>
          )}

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="starter">Starter</option>
            <option value="tutorial">Tutorial</option>
            <option value="example">Example</option>
            <option value="advanced">Advanced</option>
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(template.category)}
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                </div>
                <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
                  {template.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-2">{template.description}</p>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Code Preview */}
              <div className="bg-gray-50 rounded p-3 mb-4">
                <pre className="text-xs text-gray-700 overflow-hidden">
                  <code>{template.code.slice(0, 150)}...</code>
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTemplateSelect(template);
                  }}
                  className="flex-1"
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard(template.code);
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search or filters to find more templates.
          </p>
          <Button variant="outline" onClick={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setSelectedDifficulty('all');
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default TemplateBrowser;