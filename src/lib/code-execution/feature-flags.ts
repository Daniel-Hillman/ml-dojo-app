/**
 * Feature Flags System for Live Code Execution
 * Enables gradual rollout and A/B testing of new features
 */

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  conditions?: {
    userIds?: string[];
    userGroups?: string[];
    languages?: string[];
    environment?: 'development' | 'staging' | 'production';
  };
  variants?: {
    [key: string]: {
      weight: number; // 0-100
      config: Record<string, any>;
    };
  };
  createdAt: number;
  updatedAt: number;
}

interface FeatureFlagContext {
  userId?: string;
  userGroup?: string;
  language?: string;
  environment: 'development' | 'staging' | 'production';
  sessionId?: string;
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private cache: Map<string, { result: boolean | string; expiry: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeDefaultFlags();
  }

  private initializeDefaultFlags(): void {
    // Core execution features
    this.defineFlag({
      key: 'enhanced_python_execution',
      name: 'Enhanced Python Execution',
      description: 'Enable improved Python execution with better error handling',
      enabled: true,
      rolloutPercentage: 100
    });

    this.defineFlag({
      key: 'sql_advanced_features',
      name: 'SQL Advanced Features',
      description: 'Enable advanced SQL features like window functions',
      enabled: true,
      rolloutPercentage: 80
    });

    this.defineFlag({
      key: 'collaborative_editing',
      name: 'Collaborative Editing',
      description: 'Enable real-time collaborative code editing',
      enabled: false,
      rolloutPercentage: 10,
      conditions: {
        userGroups: ['beta_testers', 'premium_users']
      }
    });

    // Performance optimizations
    this.defineFlag({
      key: 'execution_caching',
      name: 'Execution Result Caching',
      description: 'Cache execution results for identical code',
      enabled: true,
      rolloutPercentage: 50
    });

    this.defineFlag({
      key: 'lazy_engine_loading',
      name: 'Lazy Engine Loading',
      description: 'Load execution engines only when needed',
      enabled: true,
      rolloutPercentage: 100
    });

    // UI/UX features
    this.defineFlag({
      key: 'new_editor_theme',
      name: 'New Editor Theme',
      description: 'A/B test new editor theme',
      enabled: true,
      rolloutPercentage: 50,
      variants: {
        control: { weight: 50, config: { theme: 'default' } },
        variant_a: { weight: 25, config: { theme: 'modern_dark' } },
        variant_b: { weight: 25, config: { theme: 'modern_light' } }
      }
    });

    this.defineFlag({
      key: 'ai_code_suggestions',
      name: 'AI Code Suggestions',
      description: 'Enable AI-powered code completion and suggestions',
      enabled: false,
      rolloutPercentage: 5,
      conditions: {
        userGroups: ['premium_users']
      }
    });

    // Security features
    this.defineFlag({
      key: 'enhanced_sandboxing',
      name: 'Enhanced Sandboxing',
      description: 'Additional security layers for code execution',
      enabled: true,
      rolloutPercentage: 100,
      conditions: {
        environment: 'production'
      }
    });

    this.defineFlag({
      key: 'malicious_code_detection',
      name: 'Malicious Code Detection',
      description: 'Advanced detection of potentially malicious code patterns',
      enabled: true,
      rolloutPercentage: 90
    });

    // Analytics and monitoring
    this.defineFlag({
      key: 'detailed_analytics',
      name: 'Detailed Analytics',
      description: 'Collect detailed usage analytics',
      enabled: true,
      rolloutPercentage: 100
    });

    this.defineFlag({
      key: 'performance_monitoring',
      name: 'Performance Monitoring',
      description: 'Enable detailed performance monitoring',
      enabled: true,
      rolloutPercentage: 100
    });
  }

  defineFlag(flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): void {
    const now = Date.now();
    const fullFlag: FeatureFlag = {
      ...flag,
      createdAt: now,
      updatedAt: now
    };

    this.flags.set(flag.key, fullFlag);
    console.log(`Feature flag defined: ${flag.key}`);
  }

  updateFlag(key: string, updates: Partial<FeatureFlag>): boolean {
    const flag = this.flags.get(key);
    if (!flag) {
      console.warn(`Feature flag not found: ${key}`);
      return false;
    }

    const updatedFlag: FeatureFlag = {
      ...flag,
      ...updates,
      updatedAt: Date.now()
    };

    this.flags.set(key, updatedFlag);
    
    // Clear cache for this flag
    this.clearFlagCache(key);
    
    console.log(`Feature flag updated: ${key}`);
    return true;
  }

  isEnabled(key: string, context: FeatureFlagContext = { environment: 'production' }): boolean {
    const cacheKey = `${key}:${JSON.stringify(context)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.result === true;
    }

    const flag = this.flags.get(key);
    if (!flag) {
      console.warn(`Feature flag not found: ${key}`);
      return false;
    }

    const result = this.evaluateFlag(flag, context);
    
    // Cache the result
    this.cache.set(cacheKey, {
      result: result === true,
      expiry: Date.now() + this.cacheTimeout
    });

    return result === true;
  }

  getVariant(key: string, context: FeatureFlagContext = { environment: 'production' }): string | null {
    const cacheKey = `${key}:variant:${JSON.stringify(context)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return typeof cached.result === 'string' ? cached.result : null;
    }

    const flag = this.flags.get(key);
    if (!flag || !flag.variants) {
      return null;
    }

    const result = this.evaluateFlag(flag, context);
    const variant = typeof result === 'string' ? result : null;
    
    // Cache the result
    this.cache.set(cacheKey, {
      result: variant || false,
      expiry: Date.now() + this.cacheTimeout
    });

    return variant;
  }

  getVariantConfig(key: string, context: FeatureFlagContext = { environment: 'production' }): Record<string, any> | null {
    const variant = this.getVariant(key, context);
    if (!variant) return null;

    const flag = this.flags.get(key);
    if (!flag || !flag.variants || !flag.variants[variant]) {
      return null;
    }

    return flag.variants[variant].config;
  }

  private evaluateFlag(flag: FeatureFlag, context: FeatureFlagContext): boolean | string {
    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check conditions
    if (flag.conditions) {
      if (!this.checkConditions(flag.conditions, context)) {
        return false;
      }
    }

    // Check rollout percentage
    if (!this.checkRollout(flag, context)) {
      return false;
    }

    // If flag has variants, determine which variant to return
    if (flag.variants) {
      return this.selectVariant(flag, context);
    }

    return true;
  }

  private checkConditions(conditions: NonNullable<FeatureFlag['conditions']>, context: FeatureFlagContext): boolean {
    // Check user IDs
    if (conditions.userIds && context.userId) {
      if (!conditions.userIds.includes(context.userId)) {
        return false;
      }
    }

    // Check user groups
    if (conditions.userGroups && context.userGroup) {
      if (!conditions.userGroups.includes(context.userGroup)) {
        return false;
      }
    }

    // Check languages
    if (conditions.languages && context.language) {
      if (!conditions.languages.includes(context.language)) {
        return false;
      }
    }

    // Check environment
    if (conditions.environment && conditions.environment !== context.environment) {
      return false;
    }

    return true;
  }

  private checkRollout(flag: FeatureFlag, context: FeatureFlagContext): boolean {
    if (flag.rolloutPercentage >= 100) {
      return true;
    }

    if (flag.rolloutPercentage <= 0) {
      return false;
    }

    // Use consistent hashing based on user ID or session ID
    const hashInput = context.userId || context.sessionId || 'anonymous';
    const hash = this.simpleHash(flag.key + hashInput);
    const percentage = hash % 100;

    return percentage < flag.rolloutPercentage;
  }

  private selectVariant(flag: FeatureFlag, context: FeatureFlagContext): string {
    if (!flag.variants) {
      return 'default';
    }

    // Use consistent hashing for variant selection
    const hashInput = context.userId || context.sessionId || 'anonymous';
    const hash = this.simpleHash(flag.key + 'variant' + hashInput);
    const percentage = hash % 100;

    let cumulativeWeight = 0;
    for (const [variantKey, variant] of Object.entries(flag.variants)) {
      cumulativeWeight += variant.weight;
      if (percentage < cumulativeWeight) {
        return variantKey;
      }
    }

    // Fallback to first variant
    return Object.keys(flag.variants)[0] || 'default';
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private clearFlagCache(key: string): void {
    const keysToDelete: string[] = [];
    for (const cacheKey of this.cache.keys()) {
      if (cacheKey.startsWith(key + ':')) {
        keysToDelete.push(cacheKey);
      }
    }
    keysToDelete.forEach(k => this.cache.delete(k));
  }

  // Management methods
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  deleteFlag(key: string): boolean {
    const deleted = this.flags.delete(key);
    if (deleted) {
      this.clearFlagCache(key);
      console.log(`Feature flag deleted: ${key}`);
    }
    return deleted;
  }

  // Bulk operations
  enableFlag(key: string, rolloutPercentage: number = 100): boolean {
    return this.updateFlag(key, { enabled: true, rolloutPercentage });
  }

  disableFlag(key: string): boolean {
    return this.updateFlag(key, { enabled: false });
  }

  setRolloutPercentage(key: string, percentage: number): boolean {
    if (percentage < 0 || percentage > 100) {
      console.error('Rollout percentage must be between 0 and 100');
      return false;
    }
    return this.updateFlag(key, { rolloutPercentage: percentage });
  }

  // Analytics and reporting
  getFlagUsageStats(): Record<string, {
    evaluations: number;
    enabledCount: number;
    disabledCount: number;
    variants: Record<string, number>;
  }> {
    // In a real implementation, this would track actual usage
    const stats: Record<string, any> = {};
    
    for (const flag of this.flags.values()) {
      stats[flag.key] = {
        evaluations: Math.floor(Math.random() * 1000), // Simulated
        enabledCount: Math.floor(Math.random() * 800),
        disabledCount: Math.floor(Math.random() * 200),
        variants: flag.variants ? Object.keys(flag.variants).reduce((acc, variant) => {
          acc[variant] = Math.floor(Math.random() * 100);
          return acc;
        }, {} as Record<string, number>) : {}
      };
    }
    
    return stats;
  }

  exportFlags(): string {
    const flagsData = Array.from(this.flags.values());
    return JSON.stringify(flagsData, null, 2);
  }

  importFlags(flagsJson: string): boolean {
    try {
      const flagsData: FeatureFlag[] = JSON.parse(flagsJson);
      
      for (const flag of flagsData) {
        this.flags.set(flag.key, flag);
      }
      
      // Clear cache after import
      this.cache.clear();
      
      console.log(`Imported ${flagsData.length} feature flags`);
      return true;
    } catch (error) {
      console.error('Failed to import feature flags:', error);
      return false;
    }
  }

  // Cleanup
  clearCache(): void {
    this.cache.clear();
    console.log('Feature flag cache cleared');
  }
}

// Global feature flag manager
export const featureFlags = new FeatureFlagManager();

// Convenience functions
export function isFeatureEnabled(key: string, context?: FeatureFlagContext): boolean {
  return featureFlags.isEnabled(key, context);
}

export function getFeatureVariant(key: string, context?: FeatureFlagContext): string | null {
  return featureFlags.getVariant(key, context);
}

export function getFeatureConfig(key: string, context?: FeatureFlagContext): Record<string, any> | null {
  return featureFlags.getVariantConfig(key, context);
}

// Export types and classes
export type { FeatureFlag, FeatureFlagContext };
export { FeatureFlagManager };