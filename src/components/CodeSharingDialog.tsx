'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Share2, 
  Copy, 
  Link, 
  Eye, 
  EyeOff, 
  Lock, 
  Globe, 
  Calendar,
  Users,
  GitFork,
  X,
  Check,
  Settings
} from 'lucide-react';
import { SavedCodeSnippet } from '@/lib/code-execution/code-persistence';
import { collaborationService, ShareableLink } from '@/lib/code-execution/collaboration';

interface CodeSharingDialogProps {
  snippet: SavedCodeSnippet;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const CodeSharingDialog: React.FC<CodeSharingDialogProps> = ({
  snippet,
  isOpen,
  onClose,
  className = ''
}) => {
  const [shareLinks, setShareLinks] = useState<ShareableLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Share form state
  const [shareForm, setShareForm] = useState({
    accessType: 'public' as 'public' | 'unlisted' | 'private',
    expiresIn: 'never' as 'never' | '1hour' | '1day' | '1week' | '1month',
    password: '',
    allowFork: true,
    allowEdit: false
  });

  const [collaborationSettings, setCollaborationSettings] = useState({
    maxParticipants: 5,
    allowAnonymous: true,
    requireApproval: false
  });

  React.useEffect(() => {
    if (isOpen) {
      loadExistingLinks();
    }
  }, [isOpen, snippet.id]);

  const loadExistingLinks = async () => {
    // In a real implementation, this would fetch existing links for the snippet
    setShareLinks([]);
  };

  const handleCreateShareLink = async () => {
    setLoading(true);
    try {
      let expiresAt: Date | undefined;
      
      if (shareForm.expiresIn !== 'never') {
        const now = new Date();
        switch (shareForm.expiresIn) {
          case '1hour':
            expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
            break;
          case '1day':
            expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case '1week':
            expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case '1month':
            expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      const link = await collaborationService.createShareableLink(snippet.id, {
        accessType: shareForm.accessType,
        expiresAt,
        password: shareForm.password || undefined,
        allowFork: shareForm.allowFork,
        allowEdit: shareForm.allowEdit
      });

      setShareLinks([...shareLinks, link]);
      
      // Reset form
      setShareForm({
        accessType: 'public',
        expiresIn: 'never',
        password: '',
        allowFork: true,
        allowEdit: false
      });
    } catch (error) {
      console.error('Failed to create share link:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCollaboration = async () => {
    setLoading(true);
    try {
      const sessionId = await collaborationService.startCollaborationSession(
        snippet.id,
        collaborationSettings
      );
      
      // Create a collaboration link
      const link = await collaborationService.createShareableLink(snippet.id, {
        accessType: 'unlisted',
        allowEdit: true,
        allowFork: true
      });

      setShareLinks([...shareLinks, { ...link, url: `${link.url}?collaborate=${sessionId}` }]);
    } catch (error) {
      console.error('Failed to start collaboration:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(linkId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getAccessTypeIcon = (type: ShareableLink['accessType']) => {
    switch (type) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'unlisted':
        return <Link className="w-4 h-4" />;
      case 'private':
        return <Lock className="w-4 h-4" />;
    }
  };

  const getAccessTypeColor = (type: ShareableLink['accessType']) => {
    switch (type) {
      case 'public':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'unlisted':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'private':
        return 'text-orange-600 bg-orange-50 border-orange-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className={`w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share "{snippet.title}"
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create">Create Link</TabsTrigger>
              <TabsTrigger value="collaborate">Collaborate</TabsTrigger>
              <TabsTrigger value="existing">
                Existing Links ({shareLinks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Access Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['public', 'unlisted', 'private'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setShareForm({ ...shareForm, accessType: type })}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          shareForm.accessType === type
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {getAccessTypeIcon(type)}
                        </div>
                        <div className="text-sm font-medium capitalize">{type}</div>
                        <div className="text-xs text-muted-foreground">
                          {type === 'public' && 'Anyone can find and view'}
                          {type === 'unlisted' && 'Only people with link'}
                          {type === 'private' && 'Password protected'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Expires</label>
                    <select
                      value={shareForm.expiresIn}
                      onChange={(e) => setShareForm({ ...shareForm, expiresIn: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="never">Never</option>
                      <option value="1hour">1 Hour</option>
                      <option value="1day">1 Day</option>
                      <option value="1week">1 Week</option>
                      <option value="1month">1 Month</option>
                    </select>
                  </div>

                  {shareForm.accessType === 'private' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Password</label>
                      <Input
                        type="password"
                        value={shareForm.password}
                        onChange={(e) => setShareForm({ ...shareForm, password: e.target.value })}
                        placeholder="Enter password"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allowFork"
                      checked={shareForm.allowFork}
                      onChange={(e) => setShareForm({ ...shareForm, allowFork: e.target.checked })}
                    />
                    <label htmlFor="allowFork" className="text-sm">
                      Allow forking
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allowEdit"
                      checked={shareForm.allowEdit}
                      onChange={(e) => setShareForm({ ...shareForm, allowEdit: e.target.checked })}
                    />
                    <label htmlFor="allowEdit" className="text-sm">
                      Allow editing (creates collaboration session)
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleCreateShareLink}
                  disabled={loading || (shareForm.accessType === 'private' && !shareForm.password)}
                  className="w-full"
                >
                  {loading ? 'Creating...' : 'Create Share Link'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="collaborate" className="space-y-4">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Real-time Collaboration</h4>
                  <p className="text-blue-700 text-sm">
                    Start a collaborative editing session where multiple people can edit the code simultaneously.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Participants</label>
                    <select
                      value={collaborationSettings.maxParticipants}
                      onChange={(e) => setCollaborationSettings({
                        ...collaborationSettings,
                        maxParticipants: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value={2}>2 people</option>
                      <option value={5}>5 people</option>
                      <option value={10}>10 people</option>
                      <option value={20}>20 people</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="allowAnonymous"
                        checked={collaborationSettings.allowAnonymous}
                        onChange={(e) => setCollaborationSettings({
                          ...collaborationSettings,
                          allowAnonymous: e.target.checked
                        })}
                      />
                      <label htmlFor="allowAnonymous" className="text-sm">
                        Allow anonymous users
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="requireApproval"
                        checked={collaborationSettings.requireApproval}
                        onChange={(e) => setCollaborationSettings({
                          ...collaborationSettings,
                          requireApproval: e.target.checked
                        })}
                      />
                      <label htmlFor="requireApproval" className="text-sm">
                        Require approval to join
                      </label>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleStartCollaboration}
                  disabled={loading}
                  className="w-full"
                >
                  <Users className="w-4 h-4 mr-2" />
                  {loading ? 'Starting...' : 'Start Collaboration Session'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="existing" className="space-y-4">
              {shareLinks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No share links created yet</p>
                  <p className="text-sm">Create your first share link to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shareLinks.map(link => (
                    <Card key={link.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`text-xs ${getAccessTypeColor(link.accessType)}`}>
                              {getAccessTypeIcon(link.accessType)}
                              <span className="ml-1 capitalize">{link.accessType}</span>
                            </Badge>
                            {link.allowFork && (
                              <Badge variant="outline" className="text-xs">
                                <GitFork className="w-3 h-3 mr-1" />
                                Forkable
                              </Badge>
                            )}
                            {link.allowEdit && (
                              <Badge variant="outline" className="text-xs">
                                <Users className="w-3 h-3 mr-1" />
                                Collaborative
                              </Badge>
                            )}
                          </div>
                          
                          <div className="bg-gray-50 rounded p-2 mb-2">
                            <code className="text-sm break-all">{link.url}</code>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {link.viewCount} views
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Created {formatDate(link.createdAt)}
                            </div>
                            {link.expiresAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Expires {formatDate(link.expiresAt)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(link.url, link.id)}
                          className="ml-4"
                        >
                          {copiedLink === link.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};