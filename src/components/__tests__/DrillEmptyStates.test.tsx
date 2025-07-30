import { getEmptyStateConfig, DRILL_EMPTY_STATES } from '../DrillEmptyStates';
import { PlusCircle, Users, FileText, History } from 'lucide-react';

describe('DrillEmptyStates', () => {
  it('returns correct config for personal drills', () => {
    const config = getEmptyStateConfig('personal');
    
    expect(config.icon).toBe(PlusCircle);
    expect(config.title).toBe('No personal drills yet');
    expect(config.description).toContain('Create your first custom drill');
    expect(config.actionButton.text).toBe('Create Your First Drill');
    expect(config.actionButton.href).toBe('/drills/create');
  });

  it('returns correct config for saved drills', () => {
    const config = getEmptyStateConfig('saved');
    
    expect(config.icon).toBe(Users);
    expect(config.title).toBe('No saved community drills yet');
    expect(config.description).toContain('Explore the community');
    expect(config.actionButton.text).toBe('Browse Community Drills');
    expect(config.actionButton.href).toBe('/community');
  });

  it('returns correct config for review drills', () => {
    const config = getEmptyStateConfig('review');
    
    expect(config.icon).toBe(History);
    expect(config.title).toBe('No drills due for review');
    expect(config.description).toContain('Complete some drills');
    expect(config.actionButton.text).toBe('Practice Drills');
    expect(config.actionButton.href).toBe('/drills');
  });

  it('returns general config for unknown keys', () => {
    const config = getEmptyStateConfig('unknown' as any);
    
    expect(config.icon).toBe(FileText);
    expect(config.title).toBe('No drills available');
    expect(config.description).toContain('Start by creating');
    expect(config.actionButton.text).toBe('Get Started');
    expect(config.actionButton.href).toBe('/drills/create');
  });

  it('has all expected empty state configurations', () => {
    expect(DRILL_EMPTY_STATES).toHaveProperty('personal');
    expect(DRILL_EMPTY_STATES).toHaveProperty('saved');
    expect(DRILL_EMPTY_STATES).toHaveProperty('review');
    expect(DRILL_EMPTY_STATES).toHaveProperty('general');
  });

  it('all configurations have required properties', () => {
    Object.values(DRILL_EMPTY_STATES).forEach(config => {
      expect(config).toHaveProperty('icon');
      expect(config).toHaveProperty('title');
      expect(config).toHaveProperty('description');
      expect(config).toHaveProperty('actionButton');
      expect(config.actionButton).toHaveProperty('text');
      expect(config.actionButton).toHaveProperty('href');
      
      expect(typeof config.title).toBe('string');
      expect(typeof config.description).toBe('string');
      expect(typeof config.actionButton.text).toBe('string');
      expect(typeof config.actionButton.href).toBe('string');
    });
  });

  it('returns different configurations for each key', () => {
    const personalConfig = getEmptyStateConfig('personal');
    const savedConfig = getEmptyStateConfig('saved');
    const reviewConfig = getEmptyStateConfig('review');
    const generalConfig = getEmptyStateConfig('general');

    // Ensure each config is unique
    expect(personalConfig.title).not.toBe(savedConfig.title);
    expect(savedConfig.title).not.toBe(reviewConfig.title);
    expect(reviewConfig.title).not.toBe(generalConfig.title);
    
    expect(personalConfig.actionButton.href).not.toBe(savedConfig.actionButton.href);
    expect(personalConfig.icon).not.toBe(savedConfig.icon);
  });

  it('has meaningful descriptions for each state', () => {
    const personalConfig = getEmptyStateConfig('personal');
    const savedConfig = getEmptyStateConfig('saved');
    const reviewConfig = getEmptyStateConfig('review');
    const generalConfig = getEmptyStateConfig('general');

    // Check that descriptions provide helpful context
    expect(personalConfig.description).toContain('personalized');
    expect(savedConfig.description).toContain('community');
    expect(reviewConfig.description).toContain('Complete');
    expect(generalConfig.description).toContain('creating');
  });

  it('has appropriate action buttons for each state', () => {
    const personalConfig = getEmptyStateConfig('personal');
    const savedConfig = getEmptyStateConfig('saved');
    const reviewConfig = getEmptyStateConfig('review');

    // Personal should lead to creation
    expect(personalConfig.actionButton.href).toBe('/drills/create');
    expect(personalConfig.actionButton.text).toContain('Create');

    // Saved should lead to community
    expect(savedConfig.actionButton.href).toBe('/community');
    expect(savedConfig.actionButton.text).toContain('Browse');

    // Review should lead to practice
    expect(reviewConfig.actionButton.href).toBe('/drills');
    expect(reviewConfig.actionButton.text).toContain('Practice');
  });

  it('uses appropriate icons for each state', () => {
    const personalConfig = getEmptyStateConfig('personal');
    const savedConfig = getEmptyStateConfig('saved');
    const reviewConfig = getEmptyStateConfig('review');
    const generalConfig = getEmptyStateConfig('general');

    // Check that icons match the context
    expect(personalConfig.icon).toBe(PlusCircle); // Creation
    expect(savedConfig.icon).toBe(Users); // Community
    expect(reviewConfig.icon).toBe(History); // Review/Time
    expect(generalConfig.icon).toBe(FileText); // General documents
  });

  it('handles null and undefined keys gracefully', () => {
    const nullConfig = getEmptyStateConfig(null as any);
    const undefinedConfig = getEmptyStateConfig(undefined as any);

    expect(nullConfig).toEqual(DRILL_EMPTY_STATES.general);
    expect(undefinedConfig).toEqual(DRILL_EMPTY_STATES.general);
  });

  it('handles empty string key gracefully', () => {
    const emptyConfig = getEmptyStateConfig('' as any);
    expect(emptyConfig).toEqual(DRILL_EMPTY_STATES.general);
  });

  it('maintains consistent structure across all configurations', () => {
    const allKeys = ['personal', 'saved', 'review', 'general'] as const;
    
    allKeys.forEach(key => {
      const config = DRILL_EMPTY_STATES[key];
      
      // Check structure consistency
      expect(config).toHaveProperty('icon');
      expect(config).toHaveProperty('title');
      expect(config).toHaveProperty('description');
      expect(config).toHaveProperty('actionButton');
      expect(config.actionButton).toHaveProperty('text');
      expect(config.actionButton).toHaveProperty('href');
      
      // Check that all values are non-empty
      expect(config.title.length).toBeGreaterThan(0);
      expect(config.description.length).toBeGreaterThan(0);
      expect(config.actionButton.text.length).toBeGreaterThan(0);
      expect(config.actionButton.href.length).toBeGreaterThan(0);
      
      // Check that href starts with /
      expect(config.actionButton.href).toMatch(/^\/[a-zA-Z]/);
    });
  });

  it('provides user-friendly titles and descriptions', () => {
    Object.values(DRILL_EMPTY_STATES).forEach(config => {
      // Titles should be user-friendly (no technical jargon)
      expect(config.title).not.toContain('null');
      expect(config.title).not.toContain('undefined');
      expect(config.title).not.toContain('error');
      
      // Descriptions should be encouraging and helpful
      expect(config.description.length).toBeGreaterThan(20); // Substantial description
      expect(config.actionButton.text).not.toContain('Click'); // More natural language
    });
  });
});