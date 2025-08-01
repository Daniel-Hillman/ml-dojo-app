/**
 * Session Manager for code execution state and persistence
 */

import { ExecutionSession, CodeExecutionResult, SupportedLanguage } from './types';

export class SessionManager {
  private sessions: Map<string, ExecutionSession> = new Map();
  private userSessions: Map<string, Set<string>> = new Map(); // userId -> sessionIds

  /**
   * Create a new execution session
   */
  createSession(
    language: SupportedLanguage, 
    code: string, 
    userId?: string,
    isPublic: boolean = false
  ): ExecutionSession {
    const sessionId = this.generateSessionId();
    const now = new Date();
    
    const session: ExecutionSession = {
      id: sessionId,
      userId,
      language,
      code,
      results: [],
      createdAt: now,
      lastExecutedAt: now,
      isPublic,
      tags: []
    };
    
    this.sessions.set(sessionId, session);
    
    // Track user sessions
    if (userId) {
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, new Set());
      }
      this.userSessions.get(userId)!.add(sessionId);
    }
    
    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): ExecutionSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update session code
   */
  updateSessionCode(sessionId: string, code: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.code = code;
    return true;
  }

  /**
   * Add execution result to session
   */
  addExecutionResult(sessionId: string, result: CodeExecutionResult): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.results.push(result);
    session.lastExecutedAt = new Date();
    
    // Keep only last 10 results to prevent memory bloat
    if (session.results.length > 10) {
      session.results = session.results.slice(-10);
    }
    
    return true;
  }

  /**
   * Get user's sessions
   */
  getUserSessions(userId: string): ExecutionSession[] {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return [];
    
    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter((session): session is ExecutionSession => session !== undefined)
      .sort((a, b) => b.lastExecutedAt.getTime() - a.lastExecutedAt.getTime());
  }

  /**
   * Get public sessions
   */
  getPublicSessions(limit: number = 20): ExecutionSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.isPublic)
      .sort((a, b) => b.lastExecutedAt.getTime() - a.lastExecutedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string, userId?: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    // Check ownership if userId provided
    if (userId && session.userId !== userId) {
      return false;
    }
    
    this.sessions.delete(sessionId);
    
    // Remove from user sessions
    if (session.userId) {
      const userSessionIds = this.userSessions.get(session.userId);
      if (userSessionIds) {
        userSessionIds.delete(sessionId);
        if (userSessionIds.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }
    }
    
    return true;
  }

  /**
   * Make session public/private
   */
  setSessionVisibility(sessionId: string, isPublic: boolean, userId?: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    // Check ownership if userId provided
    if (userId && session.userId !== userId) {
      return false;
    }
    
    session.isPublic = isPublic;
    return true;
  }

  /**
   * Add tags to session
   */
  addSessionTags(sessionId: string, tags: string[], userId?: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    // Check ownership if userId provided
    if (userId && session.userId !== userId) {
      return false;
    }
    
    // Add unique tags
    const uniqueTags = [...new Set([...session.tags, ...tags])];
    session.tags = uniqueTags;
    
    return true;
  }

  /**
   * Search sessions by tags or content
   */
  searchSessions(query: string, userId?: string, publicOnly: boolean = false): ExecutionSession[] {
    const searchTerm = query.toLowerCase();
    
    return Array.from(this.sessions.values())
      .filter(session => {
        // Filter by visibility
        if (publicOnly && !session.isPublic) return false;
        if (userId && !publicOnly && session.userId !== userId) return false;
        
        // Search in code, tags, and language
        return (
          session.code.toLowerCase().includes(searchTerm) ||
          session.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
          session.language.toLowerCase().includes(searchTerm)
        );
      })
      .sort((a, b) => b.lastExecutedAt.getTime() - a.lastExecutedAt.getTime());
  }

  /**
   * Get session statistics
   */
  getSessionStats(userId?: string): {
    totalSessions: number;
    publicSessions: number;
    languageBreakdown: Record<string, number>;
    recentActivity: number; // sessions in last 24h
  } {
    let sessions: ExecutionSession[];
    
    if (userId) {
      sessions = this.getUserSessions(userId);
    } else {
      sessions = Array.from(this.sessions.values());
    }
    
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const languageBreakdown: Record<string, number> = {};
    let publicSessions = 0;
    let recentActivity = 0;
    
    sessions.forEach(session => {
      // Count by language
      languageBreakdown[session.language] = (languageBreakdown[session.language] || 0) + 1;
      
      // Count public sessions
      if (session.isPublic) publicSessions++;
      
      // Count recent activity
      if (session.lastExecutedAt.getTime() > oneDayAgo) recentActivity++;
    });
    
    return {
      totalSessions: sessions.length,
      publicSessions,
      languageBreakdown,
      recentActivity
    };
  }

  /**
   * Cleanup old sessions (older than 30 days for anonymous users)
   */
  cleanupOldSessions(): number {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      // Only cleanup anonymous sessions older than 30 days
      if (!session.userId && session.lastExecutedAt.getTime() < thirtyDaysAgo) {
        this.deleteSession(sessionId);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global session manager instance
export const sessionManager = new SessionManager();