'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  Tag,
  Clock,
  Star,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOptions {
  languages: string[];
  difficulties: string[];
  types: string[];
  tags: string[];
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  sortBy: 'newest' | 'oldest' | 'popular' | 'rating' | 'difficulty';
  showCompleted: boolean;
  showFavorites: boolean;
}

export interface SmartFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  availableLanguages?: string[];
  availableTags?: string[];
  className?: string;
  compact?: boolean;
}

const DEFAULT_FILTERS: FilterOptions = {
  languages: [],
  difficulties: [],
  types: [],
  tags: [],
  dateRange: 'all',
  sortBy: 'newest',
  showCompleted: true,
  showFavorites: false
};

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-700' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-700' }
];

const TYPE_OPTIONS = [
  { value: 'drill', label: 'Practice Drills', icon: '🎯' },
  { value: 'template', label: 'Code Templates', icon: '📝' },
  { value: 'example', label: 'Examples', icon: '💡' },
  { value: 'tutorial', label: 'Tutorials', icon: '📚' }
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First', icon: Clock },
  { value: 'oldest', label: 'Oldest First', icon: Clock },
  { value: 'popular', label: 'Most Popular', icon: TrendingUp },
  { value: 'rating', label: 'Highest Rated', icon: Star },
  { value: 'difficulty', label: 'By Difficulty', icon: SlidersHorizontal }
];

export function SmartFilters({ 
  onFiltersChange, 
  availableLanguages = [], 
  availableTags = [],
  className,
  compact = false 
}: SmartFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Update parent when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = <K extends keyof FilterOptions>(
    key: K, 
    value: FilterOptions[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = <K extends keyof FilterOptions>(
    key: K,
    value: string
  ) => {
    setFilters(prev => {
      const currentArray = prev[key] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return (
      filters.languages.length > 0 ||
      filters.difficulties.length > 0 ||
      filters.types.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange !== 'all' ||
      filters.sortBy !== 'newest' ||
      !filters.showCompleted ||
      filters.showFavorites ||
      searchQuery.length > 0
    );
  };

  const getActiveFilterCount = () => {
    return (
      filters.languages.length +
      filters.difficulties.length +
      filters.types.length +
      filters.tags.length +
      (filters.dateRange !== 'all' ? 1 : 0) +
      (filters.sortBy !== 'newest' ? 1 : 0) +
      (!filters.showCompleted ? 1 : 0) +
      (filters.showFavorites ? 1 : 0)
    );
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Sort */}
        <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters() && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <AdvancedFiltersContent
              filters={filters}
              updateFilter={updateFilter}
              toggleArrayFilter={toggleArrayFilter}
              availableLanguages={availableLanguages}
              availableTags={availableTags}
              onClear={clearFilters}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Smart Filters
          </CardTitle>
          {hasActiveFilters() && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search drills, templates, examples..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Sort By</label>
            <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Languages */}
          {availableLanguages.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Languages</label>
              <div className="flex flex-wrap gap-2">
                {availableLanguages.map(language => (
                  <Button
                    key={language}
                    variant={filters.languages.includes(language) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter('languages', language)}
                  >
                    {language}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty */}
          <div>
            <label className="text-sm font-medium mb-2 block">Difficulty</label>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTY_OPTIONS.map(difficulty => (
                <Button
                  key={difficulty.value}
                  variant={filters.difficulties.includes(difficulty.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayFilter('difficulties', difficulty.value)}
                  className={filters.difficulties.includes(difficulty.value) ? difficulty.color : ''}
                >
                  {difficulty.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Content Types */}
          <div>
            <label className="text-sm font-medium mb-2 block">Content Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map(type => (
                <Button
                  key={type.value}
                  variant={filters.types.includes(type.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayFilter('types', type.value)}
                >
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableTags.map(tag => (
                  <Button
                    key={tag}
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter('tags', tag)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters() && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Active Filters</span>
              <Badge variant="secondary">{getActiveFilterCount()}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.languages.map(lang => (
                <Badge key={`lang-${lang}`} variant="outline" className="text-xs">
                  {lang}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => toggleArrayFilter('languages', lang)}
                  />
                </Badge>
              ))}
              {filters.difficulties.map(diff => (
                <Badge key={`diff-${diff}`} variant="outline" className="text-xs">
                  {diff}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => toggleArrayFilter('difficulties', diff)}
                  />
                </Badge>
              ))}
              {filters.tags.map(tag => (
                <Badge key={`tag-${tag}`} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => toggleArrayFilter('tags', tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Advanced filters content for popover
function AdvancedFiltersContent({
  filters,
  updateFilter,
  toggleArrayFilter,
  availableLanguages,
  availableTags,
  onClear
}: {
  filters: FilterOptions;
  updateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  toggleArrayFilter: <K extends keyof FilterOptions>(key: K, value: string) => void;
  availableLanguages: string[];
  availableTags: string[];
  onClear: () => void;
}) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Advanced Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear All
        </Button>
      </div>

      {/* Languages */}
      {availableLanguages.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">Languages</label>
          <div className="flex flex-wrap gap-1">
            {availableLanguages.slice(0, 6).map(language => (
              <Button
                key={language}
                variant={filters.languages.includes(language) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleArrayFilter('languages', language)}
                className="text-xs h-7"
              >
                {language}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty */}
      <div>
        <label className="text-sm font-medium mb-2 block">Difficulty</label>
        <div className="flex gap-1">
          {DIFFICULTY_OPTIONS.map(difficulty => (
            <Button
              key={difficulty.value}
              variant={filters.difficulties.includes(difficulty.value) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleArrayFilter('difficulties', difficulty.value)}
              className="text-xs h-7"
            >
              {difficulty.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div>
        <label className="text-sm font-medium mb-2 block">Date Range</label>
        <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value as any)}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm">Show Completed</label>
          <Button
            variant={filters.showCompleted ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter('showCompleted', !filters.showCompleted)}
            className="h-6 w-12 text-xs"
          >
            {filters.showCompleted ? 'Yes' : 'No'}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm">Favorites Only</label>
          <Button
            variant={filters.showFavorites ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter('showFavorites', !filters.showFavorites)}
            className="h-6 w-12 text-xs"
          >
            {filters.showFavorites ? 'Yes' : 'No'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook for managing filter state
export function useSmartFilters(initialFilters?: Partial<FilterOptions>) {
  const [filters, setFilters] = useState<FilterOptions>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  });

  const updateFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return {
    filters,
    updateFilters,
    resetFilters
  };
}