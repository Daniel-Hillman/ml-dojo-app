'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Star, 
  Eye, 
  GitFork, 
  Heart,
  TrendingUp,
  Calendar,
  User,
  Code,
  Play,
  Share2,
  MessageCircle,
  Award,
  Flame
} from 'lucide-react';
import { 
  PublicGalleryEntry, 
  collaborationService 
} from '@/lib/code-execution/collaboration';
import { SupportedLanguage } from '@/lib/code-execution/types';
import { SavedCodeSnippet } from '@/lib/code-execution/code-persistence';

interface PublicCodeGalleryProps {
  onLoadSnippet?: (snippet: SavedCodeSnippet) => void;
  onForkSnippet?: (snippet: SavedCodeSnippet) => void;
  className?: string;
}

export const PublicCodeGallery: React.FC<PublicCodeGalleryProps> = ({
  onLoadSnippet,
  onForkSnippet,
  className = ''
}) => {
  const [galleryEntries, setGalleryEntries] = useState<PublicGalleryEntry[]>([]);
  const [featuredEntries, setFeaturedEntries] = useState<PublicGalleryEntry[]>([]);
  const [trendingEntries, setTrendingEntries] = useState<PublicGalleryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending' | 'most_liked'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const itemsPerPage = 12;

  useEffect(() => {
    loadGalleryData();
  }, [selectedLanguage, selectedCategory, sortBy, currentPage]);

  useEffect(() => {
    loadFeaturedAndTrending();
  }, []);

  const loadGalleryData = async () => {
    setLoading(true);
    try {
      const entries = await collaborationService.getPublicGallery({
        language: selectedLanguage === 'all' ? undefined : selectedLanguage,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        sortBy,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
      });

      if (currentPage === 1) {
        setGalleryEntries(entries);
      } else {
        setGalleryEntries(prev => [...prev, ...entries]);
      }

      setHasMore(entries.length === itemsPerPage);
    } catch (error) {
      console.error('Failed to load gallery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedAndTrending = async () => {
    try {
      const [featured, trending] = await Promise.all([
        collaborationService.getFeaturedSnippets(6),
        collaborationService.getTrendingSnippets(6)
      ]);

      setFeaturedEntries(featured);
      setTrendingEntries(trending);
    } catch (error) {
      console.error('Failed to load featured/trending:', error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadGalleryData();
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleLikeSnippet = async (snippetId: string) => {
    try {
      await collaborationService.likeSnippet(snippetId);
      // Refresh the data to show updated like count
      await loadGalleryData();
    } catch (error) {
      console.error('Failed to like snippet:', error);
    }
  };

  const handleForkSnippet = async (entry: PublicGalleryEntry) => {
    try {
      if (onForkSnippet) {
        onForkSnippet(entry.snippet);
      }
    } catch (error) {
      console.error('Failed to fork snippet:', error);
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
      year: 'numeric',
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

  const renderGalleryEntry = (entry: PublicGalleryEntry, showAuthor = true) => (
    <Card key={entry.snippet.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium truncate">{entry.snippet.title}</h3>
                {entry.featured && (
                  <Badge className="text-xs bg-yellow-100 text-yellow-800">
                    <Award className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {entry.trending && (
                  <Badge className="text-xs bg-red-100 text-red-800">
                    <Flame className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${getLanguageColor(entry.snippet.language)}`}>
                  {entry.snippet.language}
                </Badge>
                {entry.snippet.metadata.complexity && (
                  <Badge variant="outline" className="text-xs">
                    {entry.snippet.metadata.complexity}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {entry.snippet.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {entry.snippet.description}
            </p>
          )}

          {/* Tags */}
          {entry.snippet.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {entry.snippet.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {entry.snippet.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{entry.snippet.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
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
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {entry.stats.comments}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(entry.snippet.createdAt)}
            </div>
          </div>

          {/* Author */}
          {showAuthor && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              <span>{entry.author.name}</span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {entry.author.reputation}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLoadSnippet?.(entry.snippet)}
              className="flex-1"
            >
              <Play className="w-3 h-3 mr-1" />
              Run
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleForkSnippet(entry)}
            >
              <GitFork className="w-3 h-3 mr-1" />
              Fork
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleLikeSnippet(entry.snippet.id)}
            >
              <Heart className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
            >
              <Share2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`public-code-gallery ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Public Code Gallery
          </CardTitle>
          
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search snippets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                Search
              </Button>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value as SupportedLanguage | 'all');
                    setCurrentPage(1);
                  }}
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
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3 py-1 text-sm border rounded"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="trending">Trending</option>
                <option value="most_liked">Most Liked</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All ({filteredEntries.length})
              </TabsTrigger>
              <TabsTrigger value="featured">
                Featured ({featuredEntries.length})
              </TabsTrigger>
              <TabsTrigger value="trending">
                Trending ({trendingEntries.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {loading && currentPage === 1 ? (
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
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEntries.map(entry => renderGalleryEntry(entry))}
                  </div>

                  {hasMore && (
                    <div className="text-center pt-4">
                      <Button
                        onClick={handleLoadMore}
                        disabled={loading}
                        variant="outline"
                      >
                        {loading ? 'Loading...' : 'Load More'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="featured" className="space-y-4">
              {featuredEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No featured snippets</p>
                  <p className="text-sm">Check back later for featured content</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredEntries.map(entry => renderGalleryEntry(entry))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trending" className="space-y-4">
              {trendingEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No trending snippets</p>
                  <p className="text-sm">Popular snippets will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trendingEntries.map(entry => renderGalleryEntry(entry))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};