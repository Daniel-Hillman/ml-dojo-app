import React from 'react';

interface UserPreferences {
  // Language preferences
  favoriteLanguages: string[];
  primaryLanguage: string;
  
  // Learning preferences
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  learningGoals: string[];
  preferredContentTypes: ('drill' | 'template' | 'example' | 'tutorial')[];
  
  // UI preferences
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  compactMode: boolean;
  
  // Notification preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  achievementNotifications: boolean;
  
  // Practice preferences
  dailyGoal: number;
  weeklyGoal: number;
  reminderTime: string; // HH:MM format
  autoSave: boolean;
  showHints: boolean;
  
  // Privacy preferences
  profileVisibility: 'public' | 'private' | 'friends';
  shareProgress: boolean;
  allowAnalytics: boolean;
  
  // Advanced preferences
  codeStyle: 'compact' | 'spacious';
  autoComplete: boolean;
  livePreview: boolean;
  keyboardShortcuts: Record<string, string>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteLanguages: ['javascript'],
  primaryLanguage: 'javascript',
  difficultyLevel: 'mixed',
  learningGoals: [],
  preferredContentTypes: ['drill', 'template', 'example'],
  theme: 'system',
  accentColor: '#3b82f6',
  fontSize: 'medium',
  borderRadius: 'medium',
  compactMode: false,
  emailNotifications: true,
  pushNotifications: true,
  weeklyDigest: true,
  achievementNotifications: true,
  dailyGoal: 3,
  weeklyGoal: 15,
  reminderTime: '19:00',
  autoSave: true,
  showHints: true,
  profileVisibility: 'public',
  shareProgress: true,
  allowAnalytics: true,
  codeStyle: 'spacious',
  autoComplete: true,
  livePreview: true,
  keyboardShortcuts: {
    'run-code': 'Ctrl+Enter',
    'save': 'Ctrl+S',
    'search': 'Ctrl+K',
    'new-drill': 'Ctrl+N',
    'toggle-theme': 'Ctrl+Shift+T'
  }
};

class UserPreferencesManager {
  private readonly STORAGE_KEY = 'omnicode-user-preferences';
  private preferences: UserPreferences;
  private listeners: Set<(preferences: UserPreferences) => void> = new Set();

  constructor() {
    this.preferences = this.loadPreferences();
    this.applyPreferences();
  }

  // Load preferences from localStorage
  private loadPreferences(): UserPreferences {
    // Return defaults during SSR
    if (typeof window === 'undefined') {
      return { ...DEFAULT_PREFERENCES };
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
    return { ...DEFAULT_PREFERENCES };
  }

  // Save preferences to localStorage
  private savePreferences(): void {
    // Skip saving during SSR
    if (typeof window === 'undefined') {
      this.notifyListeners();
      return;
    }
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferences));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  // Apply preferences to the UI
  private applyPreferences(): void {
    // Skip applying during SSR
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    const root = document.documentElement;
    
    // Apply theme
    if (this.preferences.theme === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.toggle('dark', systemTheme === 'dark');
      }
    } else {
      root.classList.toggle('dark', this.preferences.theme === 'dark');
    }

    // Apply accent color
    root.style.setProperty('--primary', this.preferences.accentColor);

    // Apply font size
    const fontScales = { small: '0.875', medium: '1', large: '1.125' };
    root.style.setProperty('--font-scale', fontScales[this.preferences.fontSize]);

    // Apply border radius
    const radiusValues = { none: '0', small: '0.25rem', medium: '0.5rem', large: '1rem' };
    root.style.setProperty('--radius', radiusValues[this.preferences.borderRadius]);

    // Apply compact mode
    root.classList.toggle('compact-mode', this.preferences.compactMode);
  }

  // Get current preferences
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  // Update preferences
  updatePreferences(updates: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
    this.applyPreferences();
  }

  // Update a single preference
  updatePreference<K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ): void {
    this.preferences[key] = value;
    this.savePreferences();
    this.applyPreferences();
  }

  // Reset to defaults
  resetToDefaults(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences();
    this.applyPreferences();
  }

  // Add listener for preference changes
  addListener(listener: (preferences: UserPreferences) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.preferences));
  }

  // Get personalized recommendations
  getRecommendations(): {
    suggestedLanguages: string[];
    suggestedDifficulty: string;
    suggestedContentTypes: string[];
    dailyGoalProgress: number;
  } {
    const { favoriteLanguages, difficultyLevel, preferredContentTypes, dailyGoal } = this.preferences;
    
    // Get today's activity (this would come from activity tracking)
    const todayActivity = 0; // Placeholder
    
    return {
      suggestedLanguages: favoriteLanguages.slice(0, 3),
      suggestedDifficulty: difficultyLevel === 'mixed' ? 'intermediate' : difficultyLevel,
      suggestedContentTypes: preferredContentTypes.slice(0, 2),
      dailyGoalProgress: Math.min((todayActivity / dailyGoal) * 100, 100)
    };
  }

  // Check if user has completed onboarding
  hasCompletedOnboarding(): boolean {
    return this.preferences.favoriteLanguages.length > 0 && 
           this.preferences.learningGoals.length > 0;
  }

  // Get learning path suggestions based on preferences
  getLearningPathSuggestions(): Array<{
    id: string;
    title: string;
    description: string;
    languages: string[];
    difficulty: string;
    estimatedTime: string;
    relevanceScore: number;
  }> {
    const { favoriteLanguages, difficultyLevel, learningGoals } = this.preferences;
    
    // Mock learning paths (in real app, this would come from a database)
    const allPaths = [
      {
        id: 'js-fundamentals',
        title: 'JavaScript Fundamentals',
        description: 'Master the basics of JavaScript programming',
        languages: ['javascript'],
        difficulty: 'beginner',
        estimatedTime: '2 weeks',
        tags: ['fundamentals', 'syntax', 'variables']
      },
      {
        id: 'python-data-science',
        title: 'Python for Data Science',
        description: 'Learn Python with focus on data analysis',
        languages: ['python'],
        difficulty: 'intermediate',
        estimatedTime: '4 weeks',
        tags: ['data-science', 'pandas', 'numpy']
      },
      {
        id: 'web-development',
        title: 'Full Stack Web Development',
        description: 'Build complete web applications',
        languages: ['html', 'css', 'javascript'],
        difficulty: 'intermediate',
        estimatedTime: '6 weeks',
        tags: ['web-development', 'frontend', 'backend']
      },
      {
        id: 'advanced-algorithms',
        title: 'Advanced Algorithms',
        description: 'Master complex algorithmic thinking',
        languages: ['javascript', 'python'],
        difficulty: 'advanced',
        estimatedTime: '8 weeks',
        tags: ['algorithms', 'data-structures', 'optimization']
      }
    ];

    return allPaths
      .map(path => {
        let relevanceScore = 0;
        
        // Score based on language preference
        const languageMatch = path.languages.some(lang => 
          favoriteLanguages.includes(lang)
        );
        if (languageMatch) relevanceScore += 40;
        
        // Score based on difficulty preference
        if (difficultyLevel === 'mixed' || path.difficulty === difficultyLevel) {
          relevanceScore += 30;
        }
        
        // Score based on learning goals
        const goalMatch = path.tags.some(tag => 
          learningGoals.some(goal => 
            goal.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (goalMatch) relevanceScore += 30;
        
        return { ...path, relevanceScore };
      })
      .filter(path => path.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }

  // Export preferences for backup
  exportPreferences(): string {
    return JSON.stringify({
      preferences: this.preferences,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  // Import preferences from backup
  importPreferences(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.preferences && typeof data.preferences === 'object') {
        this.preferences = { ...DEFAULT_PREFERENCES, ...data.preferences };
        this.savePreferences();
        this.applyPreferences();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }
}

// Create singleton instance
export const userPreferences = new UserPreferencesManager();

// React hook for using preferences
export function useUserPreferences() {
  const [preferences, setPreferences] = React.useState<UserPreferences>(
    DEFAULT_PREFERENCES
  );
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    setPreferences(userPreferences.getPreferences());
    const unsubscribe = userPreferences.addListener(setPreferences);
    return unsubscribe;
  }, []);

  return {
    preferences,
    isClient,
    updatePreferences: userPreferences.updatePreferences.bind(userPreferences),
    updatePreference: userPreferences.updatePreference.bind(userPreferences),
    resetToDefaults: userPreferences.resetToDefaults.bind(userPreferences),
    getRecommendations: userPreferences.getRecommendations.bind(userPreferences),
    getLearningPathSuggestions: userPreferences.getLearningPathSuggestions.bind(userPreferences),
    hasCompletedOnboarding: userPreferences.hasCompletedOnboarding.bind(userPreferences),
    exportPreferences: userPreferences.exportPreferences.bind(userPreferences),
    importPreferences: userPreferences.importPreferences.bind(userPreferences)
  };
}

// Export types
export type { UserPreferences };
export { DEFAULT_PREFERENCES };