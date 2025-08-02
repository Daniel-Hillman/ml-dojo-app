'use client';

import React, { useState, useMemo } from 'react';
import { Search, Copy, Play, BookOpen, Code, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LiveCodeBlock } from '@/components/LiveCodeBlock';
import { useToast } from '@/hooks/use-toast';

interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  category: string;
  tags: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  author?: string;
  usage: number;
}

const SAMPLE_SNIPPETS: CodeSnippet[] = [
  {
    id: '1',
    title: 'Hello World',
    description: 'Basic hello world example',
    code: 'print("Hello, World!")',
    language: 'python',
    category: 'basics',
    tags: ['beginner', 'print', 'basics'],
    difficulty: 'Beginner',
    usage: 1250
  },
  {
    id: '2',
    title: 'List Comprehension',
    description: 'Create a list of squares using list comprehension',
    code: 'squares = [x**2 for x in range(10)]\nprint(squares)',
    language: 'python',
    category: 'data-structures',
    tags: ['list', 'comprehension', 'intermediate'],
    difficulty: 'Intermediate',
    usage: 890
  },
  {
    id: '3',
    title: 'Async Function',
    description: 'Basic async/await pattern in JavaScript',
    code: `async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}`,
    language: 'javascript',
    category: 'async',
    tags: ['async', 'await', 'fetch', 'promises'],
    difficulty: 'Intermediate',
    usage: 756
  },
  {
    id: '4',
    title: 'Binary Search',
    description: 'Efficient binary search algorithm',
    code: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1`,
    language: 'python',
    category: 'algorithms',
    tags: ['search', 'algorithm', 'binary', 'advanced'],
    difficulty: 'Advanced',
    usage: 432
  },
  {
    id: '5',
    title: 'React Hook',
    description: 'Custom React hook for local storage',
    code: `import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}`,
    language: 'javascript',
    category: 'react',
    tags: ['react', 'hooks', 'localstorage', 'custom'],
    difficulty: 'Intermediate',
    usage: 623
  }
];

interface CodeSnippetLibraryProps {
  onInsert?: (snippet: CodeSnippet) => void;
  showInsertButton?: boolean;
  maxHeight?: string;
}

export function CodeSnippetLibrary({ 
  onInsert, 
  showInsertButton = false,
  maxHeight = '600px'
}: CodeSnippetLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const { toast } = useToast();

  const filteredSnippets = useMemo(() => {
    return SAMPLE_SNIPPETS.filter(snippet => {
      const matchesSearch = snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           snippet.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           snippet.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesLanguage = selectedLanguage === 'all' || snippet.language === selectedLanguage;
      const matchesCategory = selectedCategory === 'all' || snippet.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || snippet.difficulty === selectedDifficulty;

      return matchesSearch && matchesLanguage && matchesCategory && matchesDifficulty;
    });
  }, [searchTerm, selectedLanguage, selectedCategory, selectedDifficulty]);

  const languages = [...new Set(SAMPLE_SNIPPETS.map(s => s.language))];
  const categories = [...new Set(SAMPLE_SNIPPETS.map(s => s.category))];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Copied!",
        description: "Code snippet copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code snippet",
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search snippets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm bg-background"
          >
            <option value="all">All Languages</option>
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm bg-background"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm bg-background"
          >
            <option value="all">All Difficulties</option>
            {difficulties.map(diff => (
              <option key={diff} value={diff}>{diff}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {filteredSnippets.length} snippet{filteredSnippets.length !== 1 ? 's' : ''} found
      </div>

      {/* Snippets List */}
      <div className="space-y-4" style={{ maxHeight, overflowY: 'auto' }}>
        {filteredSnippets.map((snippet) => (
          <div key={snippet.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{snippet.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    {snippet.language}
                  </Badge>
                  <Badge className={`text-xs ${getDifficultyColor(snippet.difficulty)}`}>
                    {snippet.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {snippet.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {snippet.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {snippet.usage} uses
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
              <LiveCodeBlock
                code={snippet.code}
                language={snippet.language}
                showLineNumbers={true}
                editable={false}
                maxHeight="200px"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(snippet.code)}
                className="flex items-center gap-1"
              >
                <Copy size={14} />
                Copy
              </Button>
              
              {showInsertButton && onInsert && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onInsert(snippet)}
                  className="flex items-center gap-1"
                >
                  <Code size={14} />
                  Insert
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <BookOpen size={14} />
                Learn More
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredSnippets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Code size={48} className="mx-auto mb-4 opacity-50" />
          <p>No snippets found matching your criteria</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

// Quick insert component for editors
export function QuickSnippetInsert({ onInsert }: { onInsert: (code: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleInsert = (snippet: CodeSnippet) => {
    onInsert(snippet.code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1"
      >
        <Code size={14} />
        Snippets
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50">
          <div className="p-4">
            <CodeSnippetLibrary
              onInsert={handleInsert}
              showInsertButton={true}
              maxHeight="400px"
            />
          </div>
        </div>
      )}
    </div>
  );
}