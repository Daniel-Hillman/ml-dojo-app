'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, FileText, Code, Users, BookOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResult {
    id: string;
    type: 'drill' | 'template' | 'example' | 'page' | 'community';
    title: string;
    description: string;
    url: string;
    language?: string;
    difficulty?: string;
    tags?: string[];
    icon: React.ComponentType<{ className?: string }>;
}

interface GlobalSearchProps {
    className?: string;
    placeholder?: string;
    showShortcut?: boolean;
}

export function GlobalSearch({
    className,
    placeholder = "Search drills, templates, examples...",
    showShortcut = true
}: GlobalSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Mock search data - in a real app, this would come from your database
    const searchData: SearchResult[] = [
        {
            id: '1',
            type: 'page',
            title: 'Code Playground',
            description: 'Interactive coding environment with live execution',
            url: '/playground',
            icon: Code
        },
        {
            id: '2',
            type: 'page',
            title: 'Practice Drills',
            description: 'Your personalized practice hub',
            url: '/drills',
            icon: FileText
        },
        {
            id: '3',
            type: 'page',
            title: 'Community',
            description: 'Discover and share coding challenges',
            url: '/community',
            icon: Users
        },
        {
            id: '4',
            type: 'page',
            title: 'Learn & Examples',
            description: 'Code templates and learning resources',
            url: '/learn',
            icon: BookOpen
        },
        {
            id: '5',
            type: 'template',
            title: 'JavaScript Basics',
            description: 'Fundamental JavaScript concepts and syntax',
            url: '/playground?template=js-basics',
            language: 'JavaScript',
            difficulty: 'Beginner',
            icon: Code
        },
        {
            id: '6',
            type: 'template',
            title: 'Python Data Analysis',
            description: 'Working with pandas and numpy',
            url: '/playground?template=python-data',
            language: 'Python',
            difficulty: 'Intermediate',
            icon: Code
        },
        {
            id: '7',
            type: 'template',
            title: 'HTML & CSS Layout',
            description: 'Modern CSS layout techniques',
            url: '/playground?template=css-layout',
            language: 'HTML/CSS',
            difficulty: 'Beginner',
            icon: Code
        },
        {
            id: '8',
            type: 'template',
            title: 'SQL Queries',
            description: 'Database operations and joins',
            url: '/playground?template=sql-queries',
            language: 'SQL',
            difficulty: 'Intermediate',
            icon: Code
        }
    ];

    // Keyboard shortcut handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+K or Cmd+K to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            }

            // Escape to close
            if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
                setSelectedIndex(0);
            }

            // Arrow navigation when search is open
            if (isOpen && results.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % results.length);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const selectedResult = results[selectedIndex];
                    if (selectedResult) {
                        handleResultClick(selectedResult);
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    // Search function
    const performSearch = (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);

        // Simulate API delay
        setTimeout(() => {
            const filtered = searchData.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.language?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            );

            setResults(filtered);
            setSelectedIndex(0);
            setLoading(false);
        }, 200);
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        performSearch(value);
    };

    // Handle result click
    const handleResultClick = (result: SearchResult) => {
        router.push(result.url);
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
    };

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'drill': return FileText;
            case 'template': return Code;
            case 'example': return BookOpen;
            case 'community': return Users;
            case 'page': return Search;
            default: return Search;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'drill': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'template': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'example': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
            case 'community': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
            case 'page': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
            default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
        }
    };

    return (
        <div className={cn("relative", className)} ref={resultsRef}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    className="pl-10 pr-20"
                />
                {showShortcut && !isOpen && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Badge variant="outline" className="text-xs">
                            <Command className="h-3 w-3 mr-1" />
                            K
                        </Badge>
                    </div>
                )}
                {isOpen && query && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                            inputRef.current?.focus();
                        }}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {/* Search Results */}
            {isOpen && (query || results.length > 0) && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-hidden">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-4 text-center text-muted-foreground">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
                                Searching...
                            </div>
                        ) : results.length > 0 ? (
                            <div className="max-h-80 overflow-y-auto">
                                {results.map((result, index) => {
                                    const Icon = result.icon;
                                    const isSelected = index === selectedIndex;

                                    return (
                                        <div
                                            key={result.id}
                                            className={cn(
                                                "flex items-center gap-3 p-3 cursor-pointer border-b border-border/50 last:border-b-0 transition-colors",
                                                isSelected ? "bg-muted" : "hover:bg-muted/50"
                                            )}
                                            onClick={() => handleResultClick(result)}
                                        >
                                            <div className="flex-shrink-0">
                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-sm truncate">{result.title}</h4>
                                                    <Badge variant="outline" className={cn("text-xs", getTypeColor(result.type))}>
                                                        {result.type}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{result.description}</p>

                                                {(result.language || result.difficulty) && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {result.language && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {result.language}
                                                            </Badge>
                                                        )}
                                                        {result.difficulty && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {result.difficulty}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : query ? (
                            <div className="p-4 text-center text-muted-foreground">
                                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No results found for "{query}"</p>
                                <p className="text-xs mt-1">Try searching for drills, templates, or examples</p>
                            </div>
                        ) : (
                            <div className="p-4 text-center text-muted-foreground">
                                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Start typing to search...</p>
                                <p className="text-xs mt-1">Find drills, templates, examples, and more</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Compact version for mobile or smaller spaces
export function CompactGlobalSearch({ className }: { className?: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn("relative", className)}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full justify-start text-muted-foreground"
            >
                <Search className="h-4 w-4 mr-2" />
                Search...
                <Badge variant="outline" className="ml-auto text-xs">
                    <Command className="h-3 w-3 mr-1" />
                    K
                </Badge>
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50">
                    <GlobalSearch
                        className="w-full"
                        showShortcut={false}
                    />
                </div>
            )}
        </div>
    );
}