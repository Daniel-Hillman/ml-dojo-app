'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Search, 
  Filter, 
  Star, 
  Eye, 
  GitFork, 
  Calendar,
  Code,
  Tag,
  Trash2,
  Edit,
  Share2,
  Download,
  Upload,
  Plus,
  FolderPlus,
  Heart,
  Clock,
  User
} from 'lucide-react';
import { 
  SavedCodeSnippet, 
  CodeCollection, 
  ExecutionSession,
  codePersistence 
} from '@/lib/code-execution/code-persistence';
import { SupportedLanguage } from '@/lib/code-execution/types';

interface CodeSnippetManagerProps {
  currentCode?: string;
  currentLanguage?: SupportedLanguage;
  onLoadSnippet?: (snippet: SavedCodeSnippet) => void;
  className?: string;
}

export const CodeSnippetManager: React.FC<CodeSnippetManagerProps> = ({
  currentCode = '',
  currentLanguage = 'javascript',
  onLoadSnippet,
  className = ''
}) => {
  const [snippets, setSnippets] = useState<SavedCodeSnippet[]>([]);
  const [collections, setCollections] = useState<CodeCollection[]>([]);
  const [sessions, setSessions] = useState<ExecutionSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<SavedCodeSnippet | null>(null);
  const [loading, setLoading] = useState(false);

  // Save dialog state
  const [saveForm, setSaveForm] = useState({
    title: '',
    description: '',
    tags: '',
    isPublic: false,
    complexity: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    category: ''
  });

  // Collection dialog state
  const [collectionForm, setCollectionForm] = useState({
    name: '',
    description: '',
    isPublic: false,
    tags: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [snippetsData, collectionsData, sessionsData] = await Promise.all([
        codePersistence.searchCodeSnippets({ limit: 100 }),
        codePersistence.getAllData<CodeCollection>('collections'),
        codePersistence.getUserSessions('current-user', false)
      ]);

      setSnippets(snippetsData);
      setCollections(collectionsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSnippet = async () => {
    if (!saveForm.title.trim() || !currentCode.trim()) {
      return;
    }

    try {
      const tags = saveForm.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      if (editingSnippet) {
        await codePersistence.updateCodeSnippet(editingSnippet.id, {
          title: saveForm.title,
          description: saveForm.description,
          code: currentCode,
          tags,
          isPublic: saveForm.isPublic,
          metadata: {
            ...editingSnippet.metadata,
            complexity: saveForm.complexity,
            category: saveForm.category,
            codeSize: currentCode.length
          }
        });
      } else {
        await codePersistence.saveCodeSnippet({
          title: saveForm.title,
          description: saveForm.description,
          code: currentCode,
          language: currentLanguage,
          isPublic: saveForm.isPublic,
          tags,
          metadata: {
            codeSize: currentCode.length,
            complexity: saveForm.complexity,
            category: saveForm.category
          }
        });
      }

      setShowSaveDialog(false);
      setEditingSnippet(null);
      setSaveForm({
        title: '',
        description: '',
        tags: '',
        isPublic: false,
        complexity: 'beginner',
        category: ''
      });
      
      await loadData();
    } catch (error) {
      console.error('Failed to save snippet:', error);
    }
  };

  const handleCreateCollection = async () => {
    if (!collectionForm.name.trim()) {
      return;
    }

    try {
      const tags = collectionForm.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      await codePersistence.createCollection({
        name: collectionForm.name,
        description: collectionForm.description,
        authorId: 'current-user',
        isPublic: collectionForm.isPublic,
        snippetIds: [],
        tags
      });

      setShowCollectionDialog(false);
      setCollectionForm({
        name: '',
        description: '',
        isPublic: false,
        tags: ''
      });
      
      await loadData();
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  const handleDeleteSnippet = async (id: string) => {
    if (confirm('Are you sure you want to delete this snippet?')) {
      try {
        await codePersistence.deleteCodeSnippet(id);
        await loadData();
      } catch (error) {
        console.error('Failed to delete snippet:', error);
      }
    }
  };

  const handleForkSnippet = async (snippet: SavedCodeSnippet) => {
    try {
      const forkId = await codePersistence.forkCodeSnippet(snippet.id, `Fork of ${snippet.title}`);
      await loadData();
      
      // Load the forked snippet
      const forkedSnippet = await codePersistence.getCodeSnippet(forkId);
      if (forkedSnippet && onLoadSnippet) {
        onLoadSnippet(forkedSnippet);
      }
    } catch (error) {
      console.error('Failed to fork snippet:', error);
    }
  };

  const handleEditSnippet = (snippet: SavedCodeSnippet) => {
    setEditingSnippet(snippet);
    setSaveForm({
      title: snippet.title,
      description: snippet.description || '',
      tags: snippet.tags.join(', '),
      isPublic: snippet.isPublic,
      complexity: snippet.metadata.complexity || 'beginner',
      category: snippet.metadata.category || ''
    });
    setShowSaveDialog(true);
  };

  const filteredSnippets = snippets.filter(snippet => {
    if (selectedLanguage !== 'all' && snippet.language !== selectedLanguage) {
      return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = snippet.title.toLowerCase().includes(query);
      const matchesDescription = snippet.description?.toLowerCase().includes(query);
      const matchesCode = snippet.code.toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesDescription && !matchesCode) {
        return false;
      }
    }
    
    if (selectedTags.length > 0) {
      const hasAllTags = selectedTags.every(tag => snippet.tags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }
    
    return true;
  });

  const allTags = Array.from(new Set(snippets.flatMap(s => s.tags)));

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className={`code-snippet-manager ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Code Snippet Manager
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                disabled={!currentCode.trim()}
              >
                <Plus className="w-4 h-4 mr-1" />
                Save Current
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCollectionDialog(true)}
              >
                <FolderPlus className="w-4 h-4 mr-1" />
                New Collection
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
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
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage | 'all')}
                className="px-3 py-2 border rounded-md text-sm"
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

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {allTags.slice(0, 10).map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="snippets" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="snippets">
                Snippets ({filteredSnippets.length})
              </TabsTrigger>
              <TabsTrigger value="collections">
                Collections ({collections.length})
              </TabsTrigger>
              <TabsTrigger value="sessions">
                Sessions ({sessions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="snippets" className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading snippets...
                </div>
              ) : filteredSnippets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No snippets found</p>
                  <p className="text-sm">Save your first code snippet to get started</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredSnippets.map(snippet => (
                    <Card key={snippet.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium truncate">{snippet.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {snippet.language}
                              </Badge>
                              {snippet.isPublic && (
                                <Badge variant="secondary" className="text-xs">
                                  Public
                                </Badge>
                              )}
                            </div>
                            
                            {snippet.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {snippet.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(snippet.createdAt)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {snippet.viewCount}
                              </div>
                              <div className="flex items-center gap-1">
                                <GitFork className="w-3 h-3" />
                                {snippet.forkCount}
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {snippet.likeCount}
                              </div>
                            </div>
                            
                            {snippet.tags.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <Tag className="w-3 h-3 text-muted-foreground" />
                                {snippet.tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {snippet.tags.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{snippet.tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onLoadSnippet?.(snippet)}
                              title="Load snippet"
                            >
                              <Code className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleForkSnippet(snippet)}
                              title="Fork snippet"
                            >
                              <GitFork className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSnippet(snippet)}
                              title="Edit snippet"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSnippet(snippet.id)}
                              title="Delete snippet"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="collections" className="space-y-4">
              {collections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No collections found</p>
                  <p className="text-sm">Create your first collection to organize snippets</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {collections.map(collection => (
                    <Card key={collection.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium mb-1">{collection.name}</h3>
                            {collection.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {collection.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{collection.snippetIds.length} snippets</span>
                              <span>{formatDate(collection.createdAt)}</span>
                              {collection.isPublic && (
                                <Badge variant="secondary" className="text-xs">
                                  Public
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sessions" className="space-y-4">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No sessions found</p>
                  <p className="text-sm">Your execution sessions will appear here</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sessions.map(session => (
                    <Card key={session.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {session.language}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(session.lastExecutedAt)}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Executions:</span>
                                <div className="font-medium">
                                  {session.metadata.totalExecutions}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Success Rate:</span>
                                <div className="font-medium">
                                  {session.metadata.totalExecutions > 0 
                                    ? Math.round((session.metadata.successfulExecutions / session.metadata.totalExecutions) * 100)
                                    : 0}%
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Avg Time:</span>
                                <div className="font-medium">
                                  {session.metadata.averageExecutionTime.toFixed(0)}ms
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {editingSnippet ? 'Edit Snippet' : 'Save Code Snippet'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={saveForm.title}
                  onChange={(e) => setSaveForm({ ...saveForm, title: e.target.value })}
                  placeholder="Enter snippet title"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={saveForm.description}
                  onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={saveForm.tags}
                  onChange={(e) => setSaveForm({ ...saveForm, tags: e.target.value })}
                  placeholder="react, tutorial, beginner"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Complexity</label>
                  <select
                    value={saveForm.complexity}
                    onChange={(e) => setSaveForm({ ...saveForm, complexity: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={saveForm.category}
                    onChange={(e) => setSaveForm({ ...saveForm, category: e.target.value })}
                    placeholder="e.g., tutorial"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={saveForm.isPublic}
                  onChange={(e) => setSaveForm({ ...saveForm, isPublic: e.target.checked })}
                />
                <label htmlFor="isPublic" className="text-sm">
                  Make this snippet public
                </label>
              </div>
              
              <div className="flex items-center gap-2 pt-4">
                <Button onClick={handleSaveSnippet} disabled={!saveForm.title.trim()}>
                  {editingSnippet ? 'Update' : 'Save'} Snippet
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setEditingSnippet(null);
                    setSaveForm({
                      title: '',
                      description: '',
                      tags: '',
                      isPublic: false,
                      complexity: 'beginner',
                      category: ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Collection Dialog */}
      {showCollectionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Collection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={collectionForm.name}
                  onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
                  placeholder="Enter collection name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={collectionForm.description}
                  onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={collectionForm.tags}
                  onChange={(e) => setCollectionForm({ ...collectionForm, tags: e.target.value })}
                  placeholder="tutorial, examples, reference"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="collectionPublic"
                  checked={collectionForm.isPublic}
                  onChange={(e) => setCollectionForm({ ...collectionForm, isPublic: e.target.checked })}
                />
                <label htmlFor="collectionPublic" className="text-sm">
                  Make this collection public
                </label>
              </div>
              
              <div className="flex items-center gap-2 pt-4">
                <Button onClick={handleCreateCollection} disabled={!collectionForm.name.trim()}>
                  Create Collection
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCollectionDialog(false);
                    setCollectionForm({
                      name: '',
                      description: '',
                      isPublic: false,
                      tags: ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};