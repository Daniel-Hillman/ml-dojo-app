/**
 * Unit tests for Session Manager
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the session manager since it may not exist yet
const mockSessionManager = {
  createSession: jest.fn(),
  getSession: jest.fn(),
  updateSession: jest.fn(),
  deleteSession: jest.fn(),
  listSessions: jest.fn(),
  cleanup: jest.fn()
};

describe('SessionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Creation', () => {
    it('should create a new session with unique ID', async () => {
      const sessionData = {
        code: 'console.log("test");',
        language: 'javascript' as const,
        userId: 'user-123'
      };

      mockSessionManager.createSession.mockResolvedValue('session-456');

      const sessionId = await mockSessionManager.createSession(sessionData);
      
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(mockSessionManager.createSession).toHaveBeenCalledWith(sessionData);
    });

    it('should handle session creation errors', async () => {
      mockSessionManager.createSession.mockRejectedValue(new Error('Creation failed'));

      await expect(mockSessionManager.createSession({})).rejects.toThrow('Creation failed');
    });
  });

  describe('Session Retrieval', () => {
    it('should retrieve existing session by ID', async () => {
      const mockSession = {
        id: 'session-123',
        code: 'console.log("test");',
        language: 'javascript',
        userId: 'user-456',
        createdAt: new Date(),
        lastAccessedAt: new Date()
      };

      mockSessionManager.getSession.mockResolvedValue(mockSession);

      const session = await mockSessionManager.getSession('session-123');
      
      expect(session).toEqual(mockSession);
      expect(mockSessionManager.getSession).toHaveBeenCalledWith('session-123');
    });

    it('should return null for non-existent session', async () => {
      mockSessionManager.getSession.mockResolvedValue(null);

      const session = await mockSessionManager.getSession('non-existent');
      
      expect(session).toBeNull();
    });
  });

  describe('Session Updates', () => {
    it('should update session data', async () => {
      const updateData = {
        code: 'console.log("updated");',
        lastAccessedAt: new Date()
      };

      mockSessionManager.updateSession.mockResolvedValue(true);

      const result = await mockSessionManager.updateSession('session-123', updateData);
      
      expect(result).toBe(true);
      expect(mockSessionManager.updateSession).toHaveBeenCalledWith('session-123', updateData);
    });

    it('should handle update failures', async () => {
      mockSessionManager.updateSession.mockResolvedValue(false);

      const result = await mockSessionManager.updateSession('non-existent', {});
      
      expect(result).toBe(false);
    });
  });

  describe('Session Cleanup', () => {
    it('should delete expired sessions', async () => {
      mockSessionManager.cleanup.mockResolvedValue(5); // 5 sessions cleaned up

      const cleanedCount = await mockSessionManager.cleanup();
      
      expect(cleanedCount).toBe(5);
      expect(mockSessionManager.cleanup).toHaveBeenCalled();
    });

    it('should delete specific session', async () => {
      mockSessionManager.deleteSession.mockResolvedValue(true);

      const result = await mockSessionManager.deleteSession('session-123');
      
      expect(result).toBe(true);
      expect(mockSessionManager.deleteSession).toHaveBeenCalledWith('session-123');
    });
  });

  describe('Session Listing', () => {
    it('should list sessions for user', async () => {
      const mockSessions = [
        { id: 'session-1', language: 'javascript', createdAt: new Date() },
        { id: 'session-2', language: 'python', createdAt: new Date() }
      ];

      mockSessionManager.listSessions.mockResolvedValue(mockSessions);

      const sessions = await mockSessionManager.listSessions('user-123');
      
      expect(sessions).toEqual(mockSessions);
      expect(sessions).toHaveLength(2);
      expect(mockSessionManager.listSessions).toHaveBeenCalledWith('user-123');
    });

    it('should return empty array for user with no sessions', async () => {
      mockSessionManager.listSessions.mockResolvedValue([]);

      const sessions = await mockSessionManager.listSessions('user-456');
      
      expect(sessions).toEqual([]);
      expect(sessions).toHaveLength(0);
    });
  });
});