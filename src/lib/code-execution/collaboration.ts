/**
 * Code Sharing and Collaboration System
 * Handles sharing, forking, collaborative editing, and public galleries
 */

import { SavedCodeSnippet, codePersistence } from './code-persistence';
import { SupportedLanguage, CodeExecutionResult } from './types';

export interface ShareableLink {
  id: string;
  snippetId: string;
  url: string;
  accessType: 'public' | 'unlisted' | 'private';
  expiresAt?: Date;
  password?: string;
  allowFork: boolean;
  allowEdit: boolean;
  viewCount: number;
  createdAt: Date;
  createdBy: string;
}

export interface CollaborationSession {
  id: string;
  snippetId: string;
  participants: CollaborationParticipant[];
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  settings: {
    maxParticipants: number;
    allowAnonymous: boolean;
    requireApproval: boolean;
  };
}

export interface CollaborationParticipant {
  id: string;
  userId?: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: Date;
  lastSeen: Date;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface CodeChange {
  id: string;
  sessionId: string;
  participantId: string;
  type: 'insert' | 'delete' | 'replace';
  position: { line: number; column: number };
  content: string;
  timestamp: Date;
  applied: boolean;
}

export interface PublicGalleryEntry {
  snippet: SavedCodeSnippet;
  stats: {
    views: number;
    forks: number;
    likes: number;
    comments: number;
  };
  author: {
    id: string;
    name: string;
    avatar?: string;
    reputation: number;
  };
  featured: boolean;
  trending: boolean;
}

export interface CodeComment {
  id: string;
  snippetId: string;
  authorId: string;
  authorName: string;
  content: string;
  lineNumber?: number;
  parentId?: string; // For replies
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  replies: CodeComment[];
}

export class CollaborationService {
  private static instance: CollaborationService;
  private activeSessions: Map<string, CollaborationSession> = new Map();
  private changeBuffer: Map<string, CodeChange[]> = new Map();
  private websocket: WebSocket | null = null;

  private constructor() {
    this.initializeWebSocket();
  }

  public static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  // Sharing Features

  public async createShareableLink(
    snippetId: string,
    options: {
      accessType: 'public' | 'unlisted' | 'private';
      expiresAt?: Date;
      password?: string;
      allowFork?: boolean;
      allowEdit?: boolean;
    }
  ): Promise<ShareableLink> {
    const id = this.generateId();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    
    const shareableLink: ShareableLink = {
      id,
      snippetId,
      url: `${baseUrl}/shared/${id}`,
      accessType: options.accessType,
      expiresAt: options.expiresAt,
      password: options.password,
      allowFork: options.allowFork ?? true,
      allowEdit: options.allowEdit ?? false,
      viewCount: 0,
      createdAt: new Date(),
      createdBy: 'current-user' // Would be actual user ID
    };

    await this.storeShareableLink(shareableLink);
    return shareableLink;
  }

  public async getSharedSnippet(shareId: string, password?: string): Promise<{
    snippet: SavedCodeSnippet;
    link: ShareableLink;
    canFork: boolean;
    canEdit: boolean;
  } | null> {
    const link = await this.getShareableLink(shareId);
    if (!link) return null;

    // Check expiration
    if (link.expiresAt && link.expiresAt < new Date()) {
      return null;
    }

    // Check password
    if (link.password && link.password !== password) {
      return null;
    }

    const snippet = await codePersistence.getCodeSnippet(link.snippetId);
    if (!snippet) return null;

    // Increment view count
    link.viewCount++;
    await this.storeShareableLink(link);

    return {
      snippet,
      link,
      canFork: link.allowFork,
      canEdit: link.allowEdit
    };
  }

  public async forkSharedSnippet(shareId: string, newTitle?: string): Promise<string | null> {
    const shared = await this.getSharedSnippet(shareId);
    if (!shared || !shared.canFork) return null;

    return await codePersistence.forkCodeSnippet(shared.snippet.id, newTitle);
  }

  // Public Gallery Features

  public async getPublicGallery(options: {
    language?: SupportedLanguage;
    category?: string;
    sortBy?: 'newest' | 'popular' | 'trending' | 'most_liked';
    limit?: number;
    offset?: number;
  } = {}): Promise<PublicGalleryEntry[]> {
    const publicSnippets = await codePersistence.searchCodeSnippets({
      isPublic: true,
      language: options.language,
      limit: options.limit || 20,
      offset: options.offset || 0
    });

    const galleryEntries: PublicGalleryEntry[] = await Promise.all(
      publicSnippets.map(async (snippet) => {
        const stats = await this.getSnippetStats(snippet.id);
        const author = await this.getAuthorInfo(snippet.authorId || 'anonymous');
        
        return {
          snippet,
          stats,
          author,
          featured: this.isFeatured(snippet),
          trending: this.isTrending(snippet, stats)
        };
      })
    );

    // Sort based on criteria
    return this.sortGalleryEntries(galleryEntries, options.sortBy || 'newest');
  }

  public async getFeaturedSnippets(limit = 10): Promise<PublicGalleryEntry[]> {
    const gallery = await this.getPublicGallery({ limit: 100 });
    return gallery.filter(entry => entry.featured).slice(0, limit);
  }

  public async getTrendingSnippets(limit = 10): Promise<PublicGalleryEntry[]> {
    const gallery = await this.getPublicGallery({ limit: 100 });
    return gallery.filter(entry => entry.trending).slice(0, limit);
  }

  // Collaboration Features

  public async startCollaborationSession(
    snippetId: string,
    settings: CollaborationSession['settings']
  ): Promise<string> {
    const sessionId = this.generateId();
    
    const session: CollaborationSession = {
      id: sessionId,
      snippetId,
      participants: [],
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
      settings
    };

    this.activeSessions.set(sessionId, session);
    this.changeBuffer.set(sessionId, []);

    // Notify via WebSocket if available
    this.broadcastToSession(sessionId, {
      type: 'session_started',
      session
    });

    return sessionId;
  }

  public async joinCollaborationSession(
    sessionId: string,
    participant: Omit<CollaborationParticipant, 'id' | 'joinedAt' | 'lastSeen'>
  ): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) return false;

    // Check participant limits
    if (session.participants.length >= session.settings.maxParticipants) {
      return false;
    }

    const participantId = this.generateId();
    const fullParticipant: CollaborationParticipant = {
      ...participant,
      id: participantId,
      joinedAt: new Date(),
      lastSeen: new Date()
    };

    session.participants.push(fullParticipant);
    session.lastActivity = new Date();

    // Broadcast participant joined
    this.broadcastToSession(sessionId, {
      type: 'participant_joined',
      participant: fullParticipant
    });

    return true;
  }

  public async leaveCollaborationSession(sessionId: string, participantId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.participants = session.participants.filter(p => p.id !== participantId);
    session.lastActivity = new Date();

    // If no participants left, deactivate session
    if (session.participants.length === 0) {
      session.isActive = false;
    }

    // Broadcast participant left
    this.broadcastToSession(sessionId, {
      type: 'participant_left',
      participantId
    });
  }

  public async applyCodeChange(sessionId: string, change: Omit<CodeChange, 'id' | 'timestamp' | 'applied'>): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) return;

    const fullChange: CodeChange = {
      ...change,
      id: this.generateId(),
      timestamp: new Date(),
      applied: false
    };

    // Add to change buffer
    const buffer = this.changeBuffer.get(sessionId) || [];
    buffer.push(fullChange);
    this.changeBuffer.set(sessionId, buffer);

    // Broadcast change to all participants
    this.broadcastToSession(sessionId, {
      type: 'code_change',
      change: fullChange
    });

    // Apply change to snippet (in a real implementation, this would be more sophisticated)
    await this.applyChangeToSnippet(session.snippetId, fullChange);
  }

  public async updateParticipantCursor(
    sessionId: string,
    participantId: string,
    cursor: { line: number; column: number }
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) return;

    participant.cursor = cursor;
    participant.lastSeen = new Date();

    // Broadcast cursor update
    this.broadcastToSession(sessionId, {
      type: 'cursor_update',
      participantId,
      cursor
    });
  }

  // Comment System

  public async addComment(
    snippetId: string,
    comment: Omit<CodeComment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'replies'>
  ): Promise<string> {
    const commentId = this.generateId();
    
    const fullComment: CodeComment = {
      ...comment,
      id: commentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
      replies: []
    };

    await this.storeComment(fullComment);
    return commentId;
  }

  public async getComments(snippetId: string): Promise<CodeComment[]> {
    return await this.getStoredComments(snippetId);
  }

  public async likeComment(commentId: string): Promise<void> {
    const comment = await this.getStoredComment(commentId);
    if (comment) {
      comment.likes++;
      await this.storeComment(comment);
    }
  }

  public async replyToComment(
    parentCommentId: string,
    reply: Omit<CodeComment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'replies' | 'parentId'>
  ): Promise<string> {
    const replyId = this.generateId();
    
    const fullReply: CodeComment = {
      ...reply,
      id: replyId,
      parentId: parentCommentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
      replies: []
    };

    await this.storeComment(fullReply);

    // Add to parent's replies
    const parentComment = await this.getStoredComment(parentCommentId);
    if (parentComment) {
      parentComment.replies.push(fullReply);
      await this.storeComment(parentComment);
    }

    return replyId;
  }

  // Like System

  public async likeSnippet(snippetId: string): Promise<void> {
    const snippet = await codePersistence.getCodeSnippet(snippetId);
    if (snippet) {
      await codePersistence.updateCodeSnippet(snippetId, {
        likeCount: snippet.likeCount + 1
      });
    }
  }

  public async unlikeSnippet(snippetId: string): Promise<void> {
    const snippet = await codePersistence.getCodeSnippet(snippetId);
    if (snippet && snippet.likeCount > 0) {
      await codePersistence.updateCodeSnippet(snippetId, {
        likeCount: snippet.likeCount - 1
      });
    }
  }

  // Private helper methods

  private initializeWebSocket(): void {
    if (typeof window === 'undefined') return;

    try {
      // In a real implementation, this would connect to your WebSocket server
      const wsUrl = `ws://${window.location.host}/ws/collaboration`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('Collaboration WebSocket connected');
      };

      this.websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      };

      this.websocket.onclose = () => {
        console.log('Collaboration WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.initializeWebSocket(), 5000);
      };

      this.websocket.onerror = (error) => {
        console.error('Collaboration WebSocket error:', error);
      };
    } catch (error) {
      console.warn('WebSocket not available, using fallback mode');
    }
  }

  private handleWebSocketMessage(message: any): void {
    // Handle incoming WebSocket messages
    switch (message.type) {
      case 'code_change':
        // Apply remote code change
        break;
      case 'participant_joined':
        // Update participant list
        break;
      case 'participant_left':
        // Remove participant from list
        break;
      case 'cursor_update':
        // Update participant cursor position
        break;
    }
  }

  private broadcastToSession(sessionId: string, message: any): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        sessionId,
        ...message
      }));
    }
  }

  private async applyChangeToSnippet(snippetId: string, change: CodeChange): Promise<void> {
    // In a real implementation, this would apply operational transforms
    // For now, we'll just mark the change as applied
    change.applied = true;
  }

  private async getSnippetStats(snippetId: string): Promise<PublicGalleryEntry['stats']> {
    const snippet = await codePersistence.getCodeSnippet(snippetId);
    const comments = await this.getComments(snippetId);
    
    return {
      views: snippet?.viewCount || 0,
      forks: snippet?.forkCount || 0,
      likes: snippet?.likeCount || 0,
      comments: comments.length
    };
  }

  private async getAuthorInfo(authorId: string): Promise<PublicGalleryEntry['author']> {
    // In a real implementation, this would fetch from user service
    return {
      id: authorId,
      name: authorId === 'anonymous' ? 'Anonymous' : `User ${authorId.slice(0, 8)}`,
      reputation: Math.floor(Math.random() * 1000) // Mock reputation
    };
  }

  private isFeatured(snippet: SavedCodeSnippet): boolean {
    // Simple featured logic - high likes and recent
    const daysSinceCreated = (Date.now() - snippet.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return snippet.likeCount >= 10 && daysSinceCreated <= 30;
  }

  private isTrending(snippet: SavedCodeSnippet, stats: PublicGalleryEntry['stats']): boolean {
    // Simple trending logic - recent activity and engagement
    const daysSinceCreated = (Date.now() - snippet.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const engagementScore = stats.views + (stats.likes * 2) + (stats.forks * 3) + (stats.comments * 1.5);
    
    return daysSinceCreated <= 7 && engagementScore >= 20;
  }

  private sortGalleryEntries(entries: PublicGalleryEntry[], sortBy: string): PublicGalleryEntry[] {
    switch (sortBy) {
      case 'popular':
        return entries.sort((a, b) => 
          (b.stats.likes + b.stats.forks) - (a.stats.likes + a.stats.forks)
        );
      case 'trending':
        return entries.sort((a, b) => {
          if (a.trending && !b.trending) return -1;
          if (!a.trending && b.trending) return 1;
          return b.stats.views - a.stats.views;
        });
      case 'most_liked':
        return entries.sort((a, b) => b.stats.likes - a.stats.likes);
      case 'newest':
      default:
        return entries.sort((a, b) => 
          b.snippet.createdAt.getTime() - a.snippet.createdAt.getTime()
        );
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Storage methods (using localStorage as fallback)
  private async storeShareableLink(link: ShareableLink): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const key = 'omnicode_shareable_links';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const index = existing.findIndex((l: ShareableLink) => l.id === link.id);
      
      if (index >= 0) {
        existing[index] = link;
      } else {
        existing.push(link);
      }
      
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.warn('Failed to store shareable link:', error);
    }
  }

  private async getShareableLink(id: string): Promise<ShareableLink | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const key = 'omnicode_shareable_links';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      return existing.find((l: ShareableLink) => l.id === id) || null;
    } catch (error) {
      console.warn('Failed to get shareable link:', error);
      return null;
    }
  }

  private async storeComment(comment: CodeComment): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const key = 'omnicode_comments';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const index = existing.findIndex((c: CodeComment) => c.id === comment.id);
      
      if (index >= 0) {
        existing[index] = comment;
      } else {
        existing.push(comment);
      }
      
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.warn('Failed to store comment:', error);
    }
  }

  private async getStoredComment(id: string): Promise<CodeComment | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const key = 'omnicode_comments';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      return existing.find((c: CodeComment) => c.id === id) || null;
    } catch (error) {
      console.warn('Failed to get comment:', error);
      return null;
    }
  }

  private async getStoredComments(snippetId: string): Promise<CodeComment[]> {
    if (typeof window === 'undefined') return [];
    
    try {
      const key = 'omnicode_comments';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      return existing.filter((c: CodeComment) => c.snippetId === snippetId && !c.parentId);
    } catch (error) {
      console.warn('Failed to get comments:', error);
      return [];
    }
  }
}

// Export singleton instance
export const collaborationService = CollaborationService.getInstance();