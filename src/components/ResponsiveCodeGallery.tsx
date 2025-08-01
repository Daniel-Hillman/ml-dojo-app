'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  Star, 
  Eye, 
  GitFork, 
  Heart,
  Play,
  Share2,
  MoreVertical,
  Calendar,
  User,
  Code,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { 
  PublicGalleryEntry, 
  collaborationService 
} from '@/lib/code-execution/collaboration';
import { SupportedLanguage } from '@/lib/code-execution/types';
import { SavedCodeSnippet } from '@/lib/code-execution/code-persistence';

interface ResponsiveCodeGalleryProps {
  onLoadSnippet?: (snippet: SavedCodeSnippet) => void;
  onForkSnippet?: (snippet: SavedCodeSnippet) => void;
  className?: string;
}

export const ResponsiveCodeGallery: React.FC<ResponsiveCodeGalleryProps> = ({
  onLoadSnippet,
  onForkSnippet,
  className = ''
}) => {
  const [galleryEntries, setGalleryEntries] = useState<PublicGalleryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending' | 'most_liked'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadGalleryData();
  }, [selectedLanguage, sortBy]);

  const loadGalleryData = async () => {
    setLoading(true);
    try {
      const entries = await collaborationService.getPublicGallery({
        language: selectedLanguage === 'all' ? undefined : selectedLanguage,
        sortBy,
        limit: 20
      });
      setGalleryEntries(entries);
    } catch (error) {
      console.error('Failed to load gallery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = galleryEntries.filter(entry => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = entry.snippet.title.toLowerCase().includes(query);
      const matchesDescription = entry.snippet.description?.toLowerCase().includes(query);
      const matchesTags = entry.snippet.tags.some(tag => tag.toLowerCase().includes(query));
      
      if (!matchesTitle && !matchesDescription && !matchesTags) {
        return false;
      }
    }
    return true;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getLanguageColor = (language: SupportedLanguage) => {
    const colors: Record<SupportedLanguage, string> = {
      javascript: 'bg-yellow-100 text-yellow-800',
      typescript: 'bg-blue-100 text-blue-800',
      python: 'bg-green-100 text-green-800',
      html: 'bg-orange-100 text-orange-800',
      css: 'bg-purple-100 text-purple-800',
      sql: 'bg-indigo-100 text-indigo-800',
      json: 'bg-gray-100 text-gray-800',
      yaml: 'bg-red-100 text-red-800',
      markdown: 'bg-pink-100 text-pink-800',
      regex: 'bg-teal-100 text-teal-800',
      bash: 'bg-slate-100 text-slate-800'
    };
    return colors[language] || 'bg-gray-100 text-gray-800';
  };

  const renderMobileFilters = () => (
    <div className={`bg-gray-50 border-t transition-all duration-200 ${showFilters ? 'max-h-96' : 'max-h-0 overflow-hidden'}`}>
      <div className="p-4 space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Language</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage | 'all')}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Languages</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="sql">SQL</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="trending">Trending</option>
            <option value="most_liked">Most Liked</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">View</label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              className="flex-1"
            >
              <Grid3X3 className="w-4 h-4 mr-1" />
              Grid
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="flex-1"
            >
              <List className="w-4 h-4 mr-1" />
              List
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesktopFilters = () => (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage | 'all')}
          className="px-3 py-1 text-sm border rounded"
        >
          <option value="all">All Languages</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="sql">SQL</option>
        </select>
      </div>

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as any)}
        className="px-3 py-1 text-sm border rounded"
      >
        <option value="newest">Newest</option>
        <option value="popular">Most Popular</option>
        <option value="trending">Trending</option>
        <option value="most_liked">Most Liked</option>
      </select>

      <div className="flex items-center gap-1 ml-auto">
        <Button
          size="sm"
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          onClick={() => setViewMode('grid')}
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'list' ? 'default' : 'outline'}
          onClick={() => setViewMode('list')}
        >
          <List className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const renderGridEntry = (entry: PublicGalleryEntry) => (
    <Card key={entry.snippet.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm sm:text-base truncate mb-1">
                {entry.snippet.title}
              </h3>
              <div className="flex items-center gap-1 sm:gap-2">
                <Badge className={`text-xs ${getLanguageColor(entry.snippet.language)}`}>
                  {entry.snippet.language}
                </Badge>
                {entry.featured && (
                  <Badge className="text-xs bg-yellow-100 text-yellow-800">
                    Featured
                  </Badge>
                )}
              </div>
            </div>
            
            {!isMobile && (
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <MoreVertical className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Description */}
          {entry.snippet.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {entry.snippet.description}
            </p>
          )}

          {/* Tags */}
          {entry.snippet.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {entry.snippet.tags.slice(0, isMobile ? 2 : 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {entry.snippet.tags.length > (isMobile ? 2 : 3) && (
                <span className="text-xs text-muted-foreground">
                  +{entry.snippet.tags.length - (isMobile ? 2 : 3)}
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {entry.stats.views}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {entry.stats.likes}
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="w-3 h-3" />
                {entry.stats.forks}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(entry.snippet.createdAt)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 pt-2 border-t">
            <Button
              size="sm"
              onClick={() => onLoadSnippet?.(entry.snippet)}
              className="flex-1 h-7 text-xs"
            >
              <Play className="w-3 h-3 mr-1" />
              Run
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onForkSnippet?.(entry.snippet)}
              className="h-7 px-2"
            >
              <GitFork className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2"
            >
              <Heart className="w-3 h-3" />
            </Button>
            {isMobile && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2"
              >
                <Share2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderListEntry = (entry: PublicGalleryEntry) => (
    <Card key={entry.snippet.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm sm:text-base truncate">
                {entry.snippet.title}
              </h3>
              <Badge className={`text-xs ${getLanguageColor(entry.snippet.language)}`}>
                {entry.snippet.language}
              </Badge>
              {entry.featured && (
                <Badge className="text-xs bg-yellow-100 text-yellow-800 hidden sm:inline-flex">
                  Featured
                </Badge>
              )}
            </div>
            
            {entry.snippet.description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mb-2">
                {entry.snippet.description}
              </p>
            )}
            
            <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {entry.author.name}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(entry.snippet.createdAt)}
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {entry.stats.views}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {entry.stats.likes}
                </div>
                <div className="flex items-center gap-1">
                  <GitFork className="w-3 h-3" />
                  {entry.stats.forks}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              onClick={() => onLoadSnippet?.(entry.snippet)}
              className="h-7 px-2 sm:px-3 text-xs"
            >
              <Play className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Run</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onForkSnippet?.(entry.snippet)}
              className="h-7 px-2"
            >
              <GitFork className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2"
            >
              <Heart className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`responsive-code-gallery ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Code className="w-5 h-5" />
              Code Gallery
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {filteredEntries.length} snippets
            </Badge>
          </div>
          
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search snippets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {isMobile && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="px-3"
              >
                <SlidersHorizontal className="w-4 h-4 mr-1" />
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            )}
          </div>

          {/* Filters */}
          {isMobile ? renderMobileFilters() : renderDesktopFilters()}
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading gallery...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No snippets found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? `grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`
                : 'space-y-3'
            }>
              {filteredEntries.map(entry => 
                viewMode === 'grid' ? renderGridEntry(entry) : renderListEntry(entry)
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};