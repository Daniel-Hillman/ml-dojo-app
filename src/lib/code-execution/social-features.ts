/**
 * Social Features and Community Integration
 * Handles user profiles, code challenges, competitions, and community interactions
 */

import { SavedCodeSnippet, codePersistence } from './code-persistence';
import { SupportedLanguage, CodeExecutionResult } from './types';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  githubUsername?: string;
  twitterHandle?: string;
  joinedAt: Date;
  lastActive: Date;
  stats: {
    totalSnippets: number;
    totalLikes: number;
    totalForks: number;
    totalViews: number;
    reputation: number;
    streak: number; // Days of consecutive activity
    challengesCompleted: number;
    competitionsWon: number;
  };
  badges: UserBadge[];
  preferences: {
    publicProfile: boolean;
    emailNotifications: boolean;
    showActivity: boolean;
    preferredLanguages: SupportedLanguage[];
  };
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
  category: 'achievement' | 'skill' | 'community' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface CodeChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  language: SupportedLanguage;
  category: string;
  tags: string[];
  starterCode: string;
  testCases: TestCase[];
  solution?: string;
  hints: string[];
  timeLimit?: number; // in minutes
  memoryLimit?: number; // in MB
  createdBy: string;
  createdAt: Date;
  stats: {
    attempts: number;
    completions: number;
    averageTime: number;
    successRate: number;
  };
  rewards: {
    points: number;
    badges: string[];
  };
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  description?: string;
  isHidden: boolean; // Hidden test cases for validation
  weight: number; // For scoring
}

export interface ChallengeAttempt {
  id: string;
  challengeId: string;
  userId: string;
  code: string;
  submittedAt: Date;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'timeout' | 'error';
  score: number; // 0-100
  executionTime: number;
  memoryUsed: number;
  testResults: TestResult[];
  feedback?: string;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: string;
  executionTime: number;
  error?: string;
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  type: 'speed' | 'optimization' | 'creativity' | 'team';
  status: 'upcoming' | 'active' | 'ended';
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  language?: SupportedLanguage;
  challenges: string[]; // Challenge IDs
  prizes: CompetitionPrize[];
  rules: string[];
  participants: CompetitionParticipant[];
  leaderboard: LeaderboardEntry[];
  createdBy: string;
  createdAt: Date;
}

export interface CompetitionPrize {
  rank: number;
  title: string;
  description: string;
  value?: string;
  badge?: string;
}

export interface CompetitionParticipant {
  userId: string;
  username: string;
  joinedAt: Date;
  teamId?: string;
  status: 'registered' | 'active' | 'completed' | 'disqualified';
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  completedChallenges: number;
  totalTime: number;
  lastSubmission: Date;
}

export interface ActivityFeed {
  id: string;
  userId: string;
  username: string;
  type: 'snippet_created' | 'snippet_liked' | 'snippet_forked' | 'challenge_completed' | 'badge_earned' | 'competition_joined';
  content: string;
  metadata: Record<string, any>;
  timestamp: Date;
  visibility: 'public' | 'followers' | 'private';
}

export interface UserFollow {
  followerId: string;
  followingId: string;
  followedAt: Date;
}

export class SocialFeaturesService {
  private static instance: SocialFeaturesService;

  private constructor() {}

  public static getInstance(): SocialFeaturesService {
    if (!SocialFeaturesService.instance) {
      SocialFeaturesService.instance = new SocialFeaturesService();
    }
    return SocialFeaturesService.instance;
  }

  // User Profile Management

  public async createUserProfile(profile: Omit<UserProfile, 'stats' | 'badges' | 'joinedAt' | 'lastActive'>): Promise<string> {
    const fullProfile: UserProfile = {
      ...profile,
      joinedAt: new Date(),
      lastActive: new Date(),
      stats: {
        totalSnippets: 0,
        totalLikes: 0,
        totalForks: 0,
        totalViews: 0,
        reputation: 0,
        streak: 0,
        challengesCompleted: 0,
        competitionsWon: 0
      },
      badges: []
    };

    await this.storeUserProfile(fullProfile);
    return profile.id;
  }

  public async getUserProfile(userId: string): Promise<UserProfile | null> {
    return await this.getStoredUserProfile(userId);
  }

  public async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const existing = await this.getUserProfile(userId);
    if (!existing) {
      throw new Error('User profile not found');
    }

    const updated: UserProfile = {
      ...existing,
      ...updates,
      lastActive: new Date()
    };

    await this.storeUserProfile(updated);
  }

  public async getUserPortfolio(userId: string): Promise<{
    profile: UserProfile;
    snippets: SavedCodeSnippet[];
    recentActivity: ActivityFeed[];
    achievements: UserBadge[];
  }> {
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const snippets = await codePersistence.searchCodeSnippets({
      authorId: userId,
      isPublic: true,
      limit: 20
    });

    const recentActivity = await this.getUserActivity(userId, 10);
    const achievements = profile.badges.sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime());

    return {
      profile,
      snippets,
      recentActivity,
      achievements
    };
  }

  // Badge System

  public async awardBadge(userId: string, badgeId: string): Promise<void> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return;

    const badge = this.getBadgeDefinition(badgeId);
    if (!badge) return;

    // Check if user already has this badge
    if (profile.badges.some(b => b.id === badgeId)) return;

    const userBadge: UserBadge = {
      ...badge,
      earnedAt: new Date()
    };

    profile.badges.push(userBadge);
    await this.updateUserProfile(userId, { badges: profile.badges });

    // Add to activity feed
    await this.addActivity({
      userId,
      username: profile.username,
      type: 'badge_earned',
      content: `Earned the "${badge.name}" badge!`,
      metadata: { badgeId, badgeName: badge.name },
      visibility: 'public'
    });
  }

  public async checkAndAwardBadges(userId: string): Promise<void> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return;

    const snippets = await codePersistence.searchCodeSnippets({ authorId: userId });
    
    // Check various badge conditions
    const badgesToAward: string[] = [];

    // First snippet badge
    if (snippets.length >= 1 && !profile.badges.some(b => b.id === 'first_snippet')) {
      badgesToAward.push('first_snippet');
    }

    // Popular creator badge (10+ likes total)
    const totalLikes = snippets.reduce((sum, s) => sum + s.likeCount, 0);
    if (totalLikes >= 10 && !profile.badges.some(b => b.id === 'popular_creator')) {
      badgesToAward.push('popular_creator');
    }

    // Prolific coder badge (50+ snippets)
    if (snippets.length >= 50 && !profile.badges.some(b => b.id === 'prolific_coder')) {
      badgesToAward.push('prolific_coder');
    }

    // Multi-language badge (5+ different languages)
    const languages = new Set(snippets.map(s => s.language));
    if (languages.size >= 5 && !profile.badges.some(b => b.id === 'polyglot')) {
      badgesToAward.push('polyglot');
    }

    // Award badges
    for (const badgeId of badgesToAward) {
      await this.awardBadge(userId, badgeId);
    }
  }

  // Challenge System

  public async createChallenge(challenge: Omit<CodeChallenge, 'id' | 'createdAt' | 'stats'>): Promise<string> {
    const id = this.generateId();
    
    const fullChallenge: CodeChallenge = {
      ...challenge,
      id,
      createdAt: new Date(),
      stats: {
        attempts: 0,
        completions: 0,
        averageTime: 0,
        successRate: 0
      }
    };

    await this.storeChallenge(fullChallenge);
    return id;
  }

  public async getChallenge(challengeId: string): Promise<CodeChallenge | null> {
    return await this.getStoredChallenge(challengeId);
  }

  public async getChallenges(filters: {
    difficulty?: CodeChallenge['difficulty'];
    language?: SupportedLanguage;
    category?: string;
    limit?: number;
  } = {}): Promise<CodeChallenge[]> {
    const allChallenges = await this.getAllStoredChallenges();
    
    let filtered = allChallenges.filter(challenge => {
      if (filters.difficulty && challenge.difficulty !== filters.difficulty) return false;
      if (filters.language && challenge.language !== filters.language) return false;
      if (filters.category && challenge.category !== filters.category) return false;
      return true;
    });

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return filtered.slice(0, filters.limit || 50);
  }

  public async submitChallengeAttempt(attempt: Omit<ChallengeAttempt, 'id' | 'submittedAt' | 'status' | 'score' | 'testResults'>): Promise<string> {
    const attemptId = this.generateId();
    
    const fullAttempt: ChallengeAttempt = {
      ...attempt,
      id: attemptId,
      submittedAt: new Date(),
      status: 'pending',
      score: 0,
      testResults: []
    };

    await this.storeAttempt(fullAttempt);
    
    // Process the attempt asynchronously
    this.processAttempt(attemptId);
    
    return attemptId;
  }

  public async getAttempt(attemptId: string): Promise<ChallengeAttempt | null> {
    return await this.getStoredAttempt(attemptId);
  }

  public async getUserAttempts(userId: string, challengeId?: string): Promise<ChallengeAttempt[]> {
    const allAttempts = await this.getAllStoredAttempts();
    
    return allAttempts.filter(attempt => {
      if (attempt.userId !== userId) return false;
      if (challengeId && attempt.challengeId !== challengeId) return false;
      return true;
    }).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  // Competition System

  public async createCompetition(competition: Omit<Competition, 'id' | 'createdAt' | 'participants' | 'leaderboard'>): Promise<string> {
    const id = this.generateId();
    
    const fullCompetition: Competition = {
      ...competition,
      id,
      createdAt: new Date(),
      participants: [],
      leaderboard: []
    };

    await this.storeCompetition(fullCompetition);
    return id;
  }

  public async joinCompetition(competitionId: string, userId: string, username: string): Promise<boolean> {
    const competition = await this.getStoredCompetition(competitionId);
    if (!competition) return false;

    // Check if already joined
    if (competition.participants.some(p => p.userId === userId)) return false;

    // Check capacity
    if (competition.maxParticipants && competition.participants.length >= competition.maxParticipants) {
      return false;
    }

    // Check if competition is still open
    if (competition.status !== 'upcoming' && competition.status !== 'active') {
      return false;
    }

    const participant: CompetitionParticipant = {
      userId,
      username,
      joinedAt: new Date(),
      status: 'registered'
    };

    competition.participants.push(participant);
    await this.storeCompetition(competition);

    // Add to activity feed
    await this.addActivity({
      userId,
      username,
      type: 'competition_joined',
      content: `Joined the "${competition.title}" competition!`,
      metadata: { competitionId, competitionTitle: competition.title },
      visibility: 'public'
    });

    return true;
  }

  public async getCompetitions(status?: Competition['status']): Promise<Competition[]> {
    const allCompetitions = await this.getAllStoredCompetitions();
    
    let filtered = allCompetitions;
    if (status) {
      filtered = allCompetitions.filter(c => c.status === status);
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async updateCompetitionLeaderboard(competitionId: string): Promise<void> {
    const competition = await this.getStoredCompetition(competitionId);
    if (!competition) return;

    const leaderboard: LeaderboardEntry[] = [];

    for (const participant of competition.participants) {
      let totalScore = 0;
      let completedChallenges = 0;
      let totalTime = 0;
      let lastSubmission = new Date(0);

      for (const challengeId of competition.challenges) {
        const attempts = await this.getUserAttempts(participant.userId, challengeId);
        const bestAttempt = attempts
          .filter(a => a.status === 'passed')
          .sort((a, b) => b.score - a.score)[0];

        if (bestAttempt) {
          totalScore += bestAttempt.score;
          completedChallenges++;
          totalTime += bestAttempt.executionTime;
          if (bestAttempt.submittedAt > lastSubmission) {
            lastSubmission = bestAttempt.submittedAt;
          }
        }
      }

      leaderboard.push({
        rank: 0, // Will be set after sorting
        userId: participant.userId,
        username: participant.username,
        score: totalScore,
        completedChallenges,
        totalTime,
        lastSubmission
      });
    }

    // Sort by score (descending), then by time (ascending), then by submission time (ascending)
    leaderboard.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.totalTime !== b.totalTime) return a.totalTime - b.totalTime;
      return a.lastSubmission.getTime() - b.lastSubmission.getTime();
    });

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    competition.leaderboard = leaderboard;
    await this.storeCompetition(competition);
  }

  // Social Features

  public async followUser(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;

    const existing = await this.getStoredFollow(followerId, followingId);
    if (existing) return false;

    const follow: UserFollow = {
      followerId,
      followingId,
      followedAt: new Date()
    };

    await this.storeFollow(follow);
    return true;
  }

  public async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    return await this.deleteStoredFollow(followerId, followingId);
  }

  public async getFollowers(userId: string): Promise<string[]> {
    const allFollows = await this.getAllStoredFollows();
    return allFollows
      .filter(f => f.followingId === userId)
      .map(f => f.followerId);
  }

  public async getFollowing(userId: string): Promise<string[]> {
    const allFollows = await this.getAllStoredFollows();
    return allFollows
      .filter(f => f.followerId === userId)
      .map(f => f.followingId);
  }

  public async addActivity(activity: Omit<ActivityFeed, 'id' | 'timestamp'>): Promise<void> {
    const fullActivity: ActivityFeed = {
      ...activity,
      id: this.generateId(),
      timestamp: new Date()
    };

    await this.storeActivity(fullActivity);
  }

  public async getUserActivity(userId: string, limit = 20): Promise<ActivityFeed[]> {
    const allActivities = await this.getAllStoredActivities();
    
    return allActivities
      .filter(a => a.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public async getActivityFeed(userId: string, limit = 50): Promise<ActivityFeed[]> {
    const following = await this.getFollowing(userId);
    const allActivities = await this.getAllStoredActivities();
    
    return allActivities
      .filter(a => 
        a.visibility === 'public' || 
        a.userId === userId || 
        (a.visibility === 'followers' && following.includes(a.userId))
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Private helper methods

  private async processAttempt(attemptId: string): Promise<void> {
    const attempt = await this.getStoredAttempt(attemptId);
    if (!attempt) return;

    const challenge = await this.getChallenge(attempt.challengeId);
    if (!challenge) return;

    try {
      attempt.status = 'running';
      await this.storeAttempt(attempt);

      // Simulate code execution and testing
      const testResults: TestResult[] = [];
      let passedTests = 0;

      for (const testCase of challenge.testCases) {
        // In a real implementation, this would execute the code with the test input
        const passed = Math.random() > 0.3; // Mock: 70% pass rate
        
        testResults.push({
          testCaseId: testCase.id,
          passed,
          actualOutput: passed ? testCase.expectedOutput : 'Wrong output',
          executionTime: Math.random() * 1000,
          error: passed ? undefined : 'Test failed'
        });

        if (passed) passedTests++;
      }

      const score = Math.round((passedTests / challenge.testCases.length) * 100);
      const allPassed = passedTests === challenge.testCases.length;

      attempt.status = allPassed ? 'passed' : 'failed';
      attempt.score = score;
      attempt.testResults = testResults;
      attempt.executionTime = testResults.reduce((sum, r) => sum + r.executionTime, 0);

      await this.storeAttempt(attempt);

      // Update challenge stats
      challenge.stats.attempts++;
      if (allPassed) {
        challenge.stats.completions++;
        
        // Add to activity feed
        const profile = await this.getUserProfile(attempt.userId);
        if (profile) {
          await this.addActivity({
            userId: attempt.userId,
            username: profile.username,
            type: 'challenge_completed',
            content: `Completed the "${challenge.title}" challenge!`,
            metadata: { challengeId: challenge.id, challengeTitle: challenge.title, score },
            visibility: 'public'
          });

          // Check for badges
          await this.checkAndAwardBadges(attempt.userId);
        }
      }

      challenge.stats.successRate = challenge.stats.completions / challenge.stats.attempts;
      await this.storeChallenge(challenge);

    } catch (error) {
      attempt.status = 'error';
      attempt.feedback = 'An error occurred while processing your submission.';
      await this.storeAttempt(attempt);
    }
  }

  private getBadgeDefinition(badgeId: string): Omit<UserBadge, 'earnedAt'> | null {
    const badges: Record<string, Omit<UserBadge, 'earnedAt'>> = {
      first_snippet: {
        id: 'first_snippet',
        name: 'First Steps',
        description: 'Created your first code snippet',
        icon: '🎯',
        color: '#10B981',
        category: 'achievement',
        rarity: 'common'
      },
      popular_creator: {
        id: 'popular_creator',
        name: 'Popular Creator',
        description: 'Received 10+ likes across all snippets',
        icon: '❤️',
        color: '#EF4444',
        category: 'community',
        rarity: 'uncommon'
      },
      prolific_coder: {
        id: 'prolific_coder',
        name: 'Prolific Coder',
        description: 'Created 50+ code snippets',
        icon: '💻',
        color: '#3B82F6',
        category: 'achievement',
        rarity: 'rare'
      },
      polyglot: {
        id: 'polyglot',
        name: 'Polyglot',
        description: 'Used 5+ different programming languages',
        icon: '🌍',
        color: '#8B5CF6',
        category: 'skill',
        rarity: 'rare'
      }
    };

    return badges[badgeId] || null;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Storage methods (using localStorage as fallback)
  private async storeUserProfile(profile: UserProfile): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const key = 'omnicode_user_profiles';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const index = existing.findIndex((p: UserProfile) => p.id === profile.id);
      
      if (index >= 0) {
        existing[index] = profile;
      } else {
        existing.push(profile);
      }
      
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.warn('Failed to store user profile:', error);
    }
  }

  private async getStoredUserProfile(id: string): Promise<UserProfile | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const key = 'omnicode_user_profiles';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      return existing.find((p: UserProfile) => p.id === id) || null;
    } catch (error) {
      console.warn('Failed to get user profile:', error);
      return null;
    }
  }

  // Similar storage methods for other entities...
  private async storeChallenge(challenge: CodeChallenge): Promise<void> {
    this.storeEntity('omnicode_challenges', challenge);
  }

  private async getStoredChallenge(id: string): Promise<CodeChallenge | null> {
    return this.getEntity('omnicode_challenges', id);
  }

  private async getAllStoredChallenges(): Promise<CodeChallenge[]> {
    return this.getAllEntities('omnicode_challenges');
  }

  private async storeAttempt(attempt: ChallengeAttempt): Promise<void> {
    this.storeEntity('omnicode_attempts', attempt);
  }

  private async getStoredAttempt(id: string): Promise<ChallengeAttempt | null> {
    return this.getEntity('omnicode_attempts', id);
  }

  private async getAllStoredAttempts(): Promise<ChallengeAttempt[]> {
    return this.getAllEntities('omnicode_attempts');
  }

  private async storeCompetition(competition: Competition): Promise<void> {
    this.storeEntity('omnicode_competitions', competition);
  }

  private async getStoredCompetition(id: string): Promise<Competition | null> {
    return this.getEntity('omnicode_competitions', id);
  }

  private async getAllStoredCompetitions(): Promise<Competition[]> {
    return this.getAllEntities('omnicode_competitions');
  }

  private async storeFollow(follow: UserFollow): Promise<void> {
    this.storeEntity('omnicode_follows', follow, `${follow.followerId}_${follow.followingId}`);
  }

  private async getStoredFollow(followerId: string, followingId: string): Promise<UserFollow | null> {
    return this.getEntity('omnicode_follows', `${followerId}_${followingId}`);
  }

  private async deleteStoredFollow(followerId: string, followingId: string): Promise<boolean> {
    return this.deleteEntity('omnicode_follows', `${followerId}_${followingId}`);
  }

  private async getAllStoredFollows(): Promise<UserFollow[]> {
    return this.getAllEntities('omnicode_follows');
  }

  private async storeActivity(activity: ActivityFeed): Promise<void> {
    this.storeEntity('omnicode_activities', activity);
  }

  private async getAllStoredActivities(): Promise<ActivityFeed[]> {
    return this.getAllEntities('omnicode_activities');
  }

  // Generic storage helpers
  private async storeEntity<T extends { id: string }>(key: string, entity: T, customId?: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const id = customId || entity.id;
      const index = existing.findIndex((e: T) => (customId ? e : e.id) === id);
      
      if (index >= 0) {
        existing[index] = entity;
      } else {
        existing.push(entity);
      }
      
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.warn(`Failed to store entity in ${key}:`, error);
    }
  }

  private async getEntity<T>(key: string, id: string): Promise<T | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      return existing.find((e: any) => e.id === id || `${e.followerId}_${e.followingId}` === id) || null;
    } catch (error) {
      console.warn(`Failed to get entity from ${key}:`, error);
      return null;
    }
  }

  private async getAllEntities<T>(key: string): Promise<T[]> {
    if (typeof window === 'undefined') return [];
    
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      console.warn(`Failed to get all entities from ${key}:`, error);
      return [];
    }
  }

  private async deleteEntity(key: string, id: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = existing.filter((e: any) => e.id !== id && `${e.followerId}_${e.followingId}` !== id);
      
      if (filtered.length < existing.length) {
        localStorage.setItem(key, JSON.stringify(filtered));
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn(`Failed to delete entity from ${key}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const socialFeatures = SocialFeaturesService.getInstance();