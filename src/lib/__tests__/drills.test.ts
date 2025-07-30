// Mock Firebase Firestore first
const mockGetDocs = jest.fn();
const mockDeleteDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockQuery = jest.fn();
const mockCollection = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockDoc = jest.fn();
const mockArrayRemove = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  doc: (...args: any[]) => mockDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  arrayRemove: (...args: any[]) => mockArrayRemove(...args),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
  },
}));

// Mock the firebase client
jest.mock('../firebase/client', () => ({
  db: {},
}));

// Now import the functions to test
import {
  loadPersonalDrills,
  loadSavedDrills,
  removeSavedDrill,
  transformSavedDrillToEnhanced,
  loadAllUserDrills,
  getDrillCounts,
  classifyDrillError,
  loadDrillsWithErrorHandling,
  retryWithBackoff,
  hasGlobalFailure,
  getDisplayErrorMessage,
  type EnhancedDrill,
  type SavedDrillDocument,
  type DrillError,
} from '../drills';

describe('Data Loading Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadPersonalDrills', () => {
    const userId = 'test-user-123';
    const mockDrillData = {
      title: 'Test Drill',
      concept: 'Testing',
      difficulty: 'Beginner',
      description: 'A test drill',
      drill_content: [{ id: '1', type: 'theory', value: 'Test content' }],
      userId: userId,
      createdAt: { toDate: () => new Date('2024-01-01') },
      language: 'python',
    };

    it('should load personal drills successfully', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'drill-1',
            data: () => mockDrillData,
          },
        ],
      };

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await loadPersonalDrills(userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'drill-1',
        title: 'Test Drill',
        concept: 'Testing',
        difficulty: 'Beginner',
        description: 'A test drill',
        drill_content: [{ id: '1', type: 'theory', value: 'Test content' }],
        userId: userId,
        createdAt: new Date('2024-01-01'),
        language: 'python',
        source: 'personal',
      });

      expect(mockCollection).toHaveBeenCalledWith({}, 'drills');
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', userId);
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should return empty array when no personal drills exist', async () => {
      const mockSnapshot = { docs: [] };
      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await loadPersonalDrills(userId);

      expect(result).toEqual([]);
    });

    it('should handle permission denied errors', async () => {
      const error = new Error('permission-denied: Insufficient permissions');
      mockGetDocs.mockRejectedValue(error);

      await expect(loadPersonalDrills(userId)).rejects.toThrow(
        'You do not have permission to access your personal drills'
      );
    });

    it('should handle service unavailable errors', async () => {
      const error = new Error('unavailable: Service temporarily unavailable');
      mockGetDocs.mockRejectedValue(error);

      await expect(loadPersonalDrills(userId)).rejects.toThrow(
        'Service is temporarily unavailable. Please try again in a moment'
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('network: Connection failed');
      mockGetDocs.mockRejectedValue(error);

      await expect(loadPersonalDrills(userId)).rejects.toThrow(
        'Network connection problem. Please check your internet connection'
      );
    });

    it('should handle generic errors', async () => {
      const error = new Error('Unknown error');
      mockGetDocs.mockRejectedValue(error);

      await expect(loadPersonalDrills(userId)).rejects.toThrow(
        'Failed to load personal drills. Please try again'
      );
    });
  });

  describe('loadSavedDrills', () => {
    const userId = 'test-user-123';
    const mockSavedDrillData: SavedDrillDocument = {
      drillId: 'community-drill-1',
      savedAt: { toDate: () => new Date('2024-01-02') } as any,
      originalDrillData: {
        title: 'Community Test Drill',
        concept: 'Advanced Testing',
        difficulty: 'Advanced',
        description: 'A community drill',
        language: 'python',
        content: [{ id: '2', type: 'code', value: 'def test(): pass', language: 'python' }],
        authorId: 'author-123',
        authorName: 'John Doe',
        authorAvatar: 'https://example.com/avatar.jpg',
        createdAt: { toDate: () => new Date('2024-01-01') } as any,
        likes: 15,
        views: 100,
        saves: 8,
      },
    };

    it('should load saved drills successfully', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'saved-1',
            data: () => mockSavedDrillData,
          },
        ],
      };

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await loadSavedDrills(userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'community-drill-1',
        title: 'Community Test Drill',
        concept: 'Advanced Testing',
        difficulty: 'Advanced',
        description: 'A community drill',
        drill_content: [{ id: '2', type: 'code', value: 'def test(): pass', language: 'python' }],
        language: 'python',
        createdAt: new Date('2024-01-01'),
        source: 'community',
        originalAuthor: 'John Doe',
        originalAuthorAvatar: 'https://example.com/avatar.jpg',
        savedAt: new Date('2024-01-02'),
        communityMetrics: {
          likes: 15,
          views: 100,
          saves: 8,
        },
      });

      expect(mockCollection).toHaveBeenCalledWith({}, `users/${userId}/saved_drills`);
      expect(mockOrderBy).toHaveBeenCalledWith('savedAt', 'desc');
    });

    it('should return empty array when no saved drills exist', async () => {
      const mockSnapshot = { docs: [] };
      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await loadSavedDrills(userId);

      expect(result).toEqual([]);
    });

    it('should handle permission denied errors', async () => {
      const error = new Error('permission-denied: Access denied');
      mockGetDocs.mockRejectedValue(error);

      await expect(loadSavedDrills(userId)).rejects.toThrow(
        'You do not have permission to access your saved drills'
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('deadline-exceeded: Request timeout');
      mockGetDocs.mockRejectedValue(error);

      await expect(loadSavedDrills(userId)).rejects.toThrow(
        'Service is temporarily unavailable. Please try again in a moment'
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('network: Failed to fetch');
      mockGetDocs.mockRejectedValue(error);

      await expect(loadSavedDrills(userId)).rejects.toThrow(
        'Network connection problem. Please check your internet connection'
      );
    });
  });

  describe('removeSavedDrill', () => {
    const userId = 'test-user-123';
    const drillId = 'drill-to-remove';

    it('should remove saved drill successfully', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [{ id: 'saved-doc-1' }],
      };

      mockGetDocs.mockResolvedValue(mockSnapshot);
      mockDeleteDoc.mockResolvedValue(undefined);
      mockUpdateDoc.mockResolvedValue(undefined);

      await removeSavedDrill(userId, drillId);

      expect(mockGetDocs).toHaveBeenCalled();
      expect(mockDeleteDoc).toHaveBeenCalled();
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should throw error when saved drill not found', async () => {
      const mockSnapshot = { empty: true, docs: [] };
      mockGetDocs.mockResolvedValue(mockSnapshot);

      await expect(removeSavedDrill(userId, drillId)).rejects.toThrow(
        'This drill is no longer in your saved collection'
      );
    });

    it('should handle permission denied errors', async () => {
      const error = new Error('permission-denied: Access denied');
      mockGetDocs.mockRejectedValue(error);

      await expect(removeSavedDrill(userId, drillId)).rejects.toThrow(
        'You do not have permission to remove this drill'
      );
    });

    it('should handle service unavailable errors', async () => {
      const error = new Error('unavailable: Service down');
      mockGetDocs.mockRejectedValue(error);

      await expect(removeSavedDrill(userId, drillId)).rejects.toThrow(
        'Service is temporarily unavailable. Please try again in a moment'
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('network: Connection lost');
      mockGetDocs.mockRejectedValue(error);

      await expect(removeSavedDrill(userId, drillId)).rejects.toThrow(
        'Network connection problem. Please check your internet connection'
      );
    });

    it('should handle delete operation errors', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [{ id: 'saved-doc-1' }],
      };

      mockGetDocs.mockResolvedValue(mockSnapshot);
      mockDeleteDoc.mockRejectedValue(new Error('Delete failed'));

      await expect(removeSavedDrill(userId, drillId)).rejects.toThrow(
        'Failed to remove saved drill. Please try again'
      );
    });
  });

  describe('loadAllUserDrills', () => {
    const userId = 'test-user-123';

    it('should load both personal and saved drills concurrently', async () => {
      const mockPersonalSnapshot = {
        docs: [
          {
            id: 'personal-1',
            data: () => ({
              title: 'Personal Drill',
              concept: 'Testing',
              difficulty: 'Beginner',
              description: 'Personal drill',
              drill_content: [],
              userId: userId,
              createdAt: { toDate: () => new Date('2024-01-01') },
              language: 'python',
            }),
          },
        ],
      };

      const mockSavedSnapshot = {
        docs: [
          {
            id: 'saved-1',
            data: () => ({
              drillId: 'community-1',
              savedAt: { toDate: () => new Date('2024-01-02') },
              originalDrillData: {
                title: 'Community Drill',
                concept: 'Advanced',
                difficulty: 'Advanced',
                description: 'Community drill',
                language: 'javascript',
                content: [],
                authorId: 'author-1',
                authorName: 'Author',
                createdAt: { toDate: () => new Date('2024-01-01') },
                likes: 10,
                views: 50,
                saves: 5,
              },
            }),
          },
        ],
      };

      mockGetDocs
        .mockResolvedValueOnce(mockPersonalSnapshot)
        .mockResolvedValueOnce(mockSavedSnapshot);

      const result = await loadAllUserDrills(userId);

      expect(result.personalDrills).toHaveLength(1);
      expect(result.savedDrills).toHaveLength(1);
      expect(result.personalDrills[0].source).toBe('personal');
      expect(result.savedDrills[0].source).toBe('community');
    });

    it('should propagate errors from individual loading functions', async () => {
      mockGetDocs.mockRejectedValue(new Error('Loading failed'));

      await expect(loadAllUserDrills(userId)).rejects.toThrow('Failed to load personal drills. Please try again');
    });
  });

  describe('loadDrillsWithErrorHandling', () => {
    const userId = 'test-user-123';

    it('should load both drill types successfully', async () => {
      const mockPersonalSnapshot = {
        docs: [
          {
            id: 'personal-1',
            data: () => ({
              title: 'Personal Drill',
              concept: 'Testing',
              difficulty: 'Beginner',
              description: 'Personal drill',
              drill_content: [],
              userId: userId,
              createdAt: { toDate: () => new Date() },
              language: 'python',
            }),
          },
        ],
      };

      const mockSavedSnapshot = { docs: [] };

      mockGetDocs
        .mockResolvedValueOnce(mockPersonalSnapshot)
        .mockResolvedValueOnce(mockSavedSnapshot);

      const result = await loadDrillsWithErrorHandling(userId);

      expect(result.personalDrills).toHaveLength(1);
      expect(result.savedDrills).toHaveLength(0);
      expect(result.errors.personal).toBeNull();
      expect(result.errors.saved).toBeNull();
    });

    it('should handle personal drills error while loading saved drills successfully', async () => {
      const mockSavedSnapshot = { docs: [] };

      mockGetDocs
        .mockRejectedValueOnce(new Error('Personal drills failed'))
        .mockResolvedValueOnce(mockSavedSnapshot);

      const result = await loadDrillsWithErrorHandling(userId);

      expect(result.personalDrills).toHaveLength(0);
      expect(result.savedDrills).toHaveLength(0);
      expect(result.errors.personal).not.toBeNull();
      expect(result.errors.personal?.type).toBe('unknown');
      expect(result.errors.saved).toBeNull();
    });

    it('should handle saved drills error while loading personal drills successfully', async () => {
      const mockPersonalSnapshot = { docs: [] };

      mockGetDocs
        .mockResolvedValueOnce(mockPersonalSnapshot)
        .mockRejectedValueOnce(new Error('Saved drills failed'));

      const result = await loadDrillsWithErrorHandling(userId);

      expect(result.personalDrills).toHaveLength(0);
      expect(result.savedDrills).toHaveLength(0);
      expect(result.errors.personal).toBeNull();
      expect(result.errors.saved).not.toBeNull();
      expect(result.errors.saved?.type).toBe('unknown');
    });

    it('should handle both loading operations failing', async () => {
      mockGetDocs
        .mockRejectedValueOnce(new Error('Personal failed'))
        .mockRejectedValueOnce(new Error('Saved failed'));

      const result = await loadDrillsWithErrorHandling(userId);

      expect(result.personalDrills).toHaveLength(0);
      expect(result.savedDrills).toHaveLength(0);
      expect(result.errors.personal).not.toBeNull();
      expect(result.errors.saved).not.toBeNull();
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn, 3, 100);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('service unavailable'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn, 3, 10);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('permission denied'));

      await expect(retryWithBackoff(mockFn, 3, 10)).rejects.toThrow('permission denied');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should exhaust all retries and throw last error', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('network error'));

      await expect(retryWithBackoff(mockFn, 2, 10)).rejects.toThrow('network error');
      expect(mockFn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
  });

  describe('transformSavedDrillToEnhanced', () => {
    it('should transform saved drill document to enhanced drill format', () => {
      const savedDrill: SavedDrillDocument = {
        drillId: 'drill-123',
        savedAt: { toDate: () => new Date('2024-01-02') } as any,
        originalDrillData: {
          title: 'Test Drill',
          concept: 'Testing',
          difficulty: 'Intermediate',
          description: 'A test drill',
          language: 'javascript',
          content: [{ id: '1', type: 'theory', value: 'Test content' }],
          authorId: 'author-456',
          authorName: 'Jane Smith',
          authorAvatar: 'https://example.com/jane.jpg',
          createdAt: { toDate: () => new Date('2024-01-01') } as any,
          likes: 25,
          views: 200,
          saves: 12,
        },
      };

      const result = transformSavedDrillToEnhanced(savedDrill);

      expect(result).toEqual({
        id: 'drill-123',
        title: 'Test Drill',
        concept: 'Testing',
        difficulty: 'Intermediate',
        description: 'A test drill',
        drill_content: [{ id: '1', type: 'theory', value: 'Test content' }],
        language: 'javascript',
        createdAt: new Date('2024-01-01'),
        source: 'community',
        originalAuthor: 'Jane Smith',
        originalAuthorAvatar: 'https://example.com/jane.jpg',
        savedAt: new Date('2024-01-02'),
        communityMetrics: {
          likes: 25,
          views: 200,
          saves: 12,
        },
      });
    });

    it('should handle missing optional fields', () => {
      const savedDrill: SavedDrillDocument = {
        drillId: 'drill-456',
        savedAt: { toDate: () => new Date('2024-01-02') } as any,
        originalDrillData: {
          title: 'Minimal Drill',
          concept: 'Basic',
          difficulty: 'Beginner',
          description: 'Minimal drill',
          language: 'python',
          content: [],
          authorId: 'author-789',
          authorName: 'Anonymous',
          createdAt: { toDate: () => new Date('2024-01-01') } as any,
          likes: 0,
          views: 0,
          saves: 0,
        },
      };

      const result = transformSavedDrillToEnhanced(savedDrill);

      expect(result.originalAuthorAvatar).toBeUndefined();
      expect(result.communityMetrics).toEqual({
        likes: 0,
        views: 0,
        saves: 0,
      });
    });
  });



  describe('getDrillCounts', () => {
    it('should calculate drill counts correctly', () => {
      const personalDrills: EnhancedDrill[] = [
        { id: '1', source: 'personal' } as EnhancedDrill,
        { id: '2', source: 'personal' } as EnhancedDrill,
      ];

      const savedDrills: EnhancedDrill[] = [
        { id: '3', source: 'community' } as EnhancedDrill,
        { id: '4', source: 'community' } as EnhancedDrill,
        { id: '5', source: 'community' } as EnhancedDrill,
      ];

      const result = getDrillCounts(personalDrills, savedDrills);

      expect(result).toEqual({
        personalCount: 2,
        savedCount: 3,
        totalCount: 5,
      });
    });

    it('should handle empty arrays', () => {
      const result = getDrillCounts([], []);

      expect(result).toEqual({
        personalCount: 0,
        savedCount: 0,
        totalCount: 0,
      });
    });
  });

  describe('classifyDrillError', () => {
    it('should classify network errors', () => {
      const error = new Error('network connection failed');
      const result = classifyDrillError(error);

      expect(result.type).toBe('network');
      expect(result.retryable).toBe(true);
      expect(result.message).toBe('network connection failed');
    });

    it('should classify permission errors', () => {
      const error = new Error('permission denied');
      const result = classifyDrillError(error);

      expect(result.type).toBe('permission');
      expect(result.retryable).toBe(false);
    });

    it('should classify service errors', () => {
      const error = new Error('service unavailable');
      const result = classifyDrillError(error);

      expect(result.type).toBe('service');
      expect(result.retryable).toBe(true);
    });

    it('should classify not found errors', () => {
      const error = new Error('resource not found');
      const result = classifyDrillError(error);

      expect(result.type).toBe('not_found');
      expect(result.retryable).toBe(false);
    });

    it('should classify unknown errors', () => {
      const error = new Error('something went wrong');
      const result = classifyDrillError(error);

      expect(result.type).toBe('unknown');
      expect(result.retryable).toBe(true);
    });

    it('should handle null/undefined errors', () => {
      const result = classifyDrillError(null);

      expect(result.type).toBe('unknown');
      expect(result.message).toBe('Unknown error occurred');
    });
  });



  describe('hasGlobalFailure', () => {
    it('should return true when both errors exist', () => {
      const errors = {
        personal: { type: 'network' } as DrillError,
        saved: { type: 'service' } as DrillError,
      };

      expect(hasGlobalFailure(errors)).toBe(true);
    });

    it('should return false when only one error exists', () => {
      const errors = {
        personal: { type: 'network' } as DrillError,
        saved: null,
      };

      expect(hasGlobalFailure(errors)).toBe(false);
    });

    it('should return false when no errors exist', () => {
      const errors = {
        personal: null,
        saved: null,
      };

      expect(hasGlobalFailure(errors)).toBe(false);
    });
  });

  describe('getDisplayErrorMessage', () => {
    it('should return network error message', () => {
      const error: DrillError = {
        type: 'network',
        message: 'Network failed',
        retryable: true,
        timestamp: new Date(),
      };

      const result = getDisplayErrorMessage(error);
      expect(result).toBe('Connection problem. Please check your internet connection and try again.');
    });

    it('should return permission error message', () => {
      const error: DrillError = {
        type: 'permission',
        message: 'Access denied',
        retryable: false,
        timestamp: new Date(),
      };

      const result = getDisplayErrorMessage(error);
      expect(result).toBe('You do not have permission to access this content.');
    });

    it('should return service error message', () => {
      const error: DrillError = {
        type: 'service',
        message: 'Service down',
        retryable: true,
        timestamp: new Date(),
      };

      const result = getDisplayErrorMessage(error);
      expect(result).toBe('Service is temporarily unavailable. Please try again in a moment.');
    });

    it('should return not found error message', () => {
      const error: DrillError = {
        type: 'not_found',
        message: 'Not found',
        retryable: false,
        timestamp: new Date(),
      };

      const result = getDisplayErrorMessage(error);
      expect(result).toBe('The requested content could not be found.');
    });

    it('should return default error message for unknown types', () => {
      const error: DrillError = {
        type: 'unknown',
        message: 'Something went wrong',
        retryable: true,
        timestamp: new Date(),
      };

      const result = getDisplayErrorMessage(error);
      expect(result).toBe('Something went wrong');
    });

    it('should return default message when error message is empty', () => {
      const error: DrillError = {
        type: 'unknown',
        message: '',
        retryable: true,
        timestamp: new Date(),
      };

      const result = getDisplayErrorMessage(error);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });
  });
});