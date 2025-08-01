/**
 * User Feedback Collection and Analysis System
 * Collects, analyzes, and acts on user feedback for continuous improvement
 */

interface FeedbackItem {
  id: string;
  type: 'bug_report' | 'feature_request' | 'improvement' | 'praise' | 'complaint';
  category: 'execution' | 'ui' | 'performance' | 'documentation' | 'other';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  language?: string;
  codeSnippet?: string;
  browserInfo?: {
    userAgent: string;
    viewport: { width: number; height: number };
    url: string;
  };
  attachments?: string[]; // URLs to screenshots, logs, etc.
  votes: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  assignedTo?: string;
  relatedIssues?: string[];
}

interface FeedbackMetrics {
  totalFeedback: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  averageResolutionTime: number;
  satisfactionScore: number;
  trendingIssues: Array<{
    issue: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

interface UserSatisfactionSurvey {
  id: string;
  userId?: string;
  sessionId: string;
  questions: Array<{
    id: string;
    question: string;
    type: 'rating' | 'multiple_choice' | 'text' | 'boolean';
    answer: any;
  }>;
  overallRating: number; // 1-5
  wouldRecommend: boolean;
  createdAt: number;
}

class UserFeedbackManager {
  private feedback: Map<string, FeedbackItem> = new Map();
  private surveys: Map<string, UserSatisfactionSurvey> = new Map();
  private feedbackQueue: FeedbackItem[] = [];
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    this.startProcessing();
    this.initializeSampleData();
  }

  private startProcessing(): void {
    // Process feedback queue every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processFeedbackQueue();
    }, 30000);
  }

  private initializeSampleData(): void {
    // Add some sample feedback for demonstration
    this.submitFeedback({
      type: 'bug_report',
      category: 'execution',
      title: 'Python execution timeout',
      description: 'Python code with matplotlib takes too long to execute',
      severity: 'medium',
      language: 'python',
      tags: ['python', 'matplotlib', 'timeout']
    });

    this.submitFeedback({
      type: 'feature_request',
      category: 'ui',
      title: 'Dark mode for code editor',
      description: 'Would love to have a dark theme option for the code editor',
      severity: 'low',
      tags: ['ui', 'theme', 'dark-mode']
    });

    this.submitFeedback({
      type: 'improvement',
      category: 'performance',
      title: 'Faster JavaScript execution',
      description: 'JavaScript code execution could be optimized for better performance',
      severity: 'medium',
      language: 'javascript',
      tags: ['javascript', 'performance', 'optimization']
    });
  }

  submitFeedback(feedbackData: Omit<FeedbackItem, 'id' | 'status' | 'votes' | 'createdAt' | 'updatedAt'>): string {
    const id = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const feedback: FeedbackItem = {
      id,
      status: 'open',
      votes: 0,
      createdAt: now,
      updatedAt: now,
      ...feedbackData
    };

    this.feedback.set(id, feedback);
    this.feedbackQueue.push(feedback);

    console.log(`New feedback submitted: ${feedback.title} (${feedback.type})`);

    // Auto-categorize and prioritize
    this.categorizeFeedback(feedback);
    this.prioritizeFeedback(feedback);

    // Send notifications for critical issues
    if (feedback.severity === 'critical') {
      this.sendCriticalFeedbackAlert(feedback);
    }

    return id;
  }

  updateFeedback(id: string, updates: Partial<FeedbackItem>): boolean {
    const feedback = this.feedback.get(id);
    if (!feedback) {
      console.warn(`Feedback not found: ${id}`);
      return false;
    }

    const updatedFeedback: FeedbackItem = {
      ...feedback,
      ...updates,
      updatedAt: Date.now()
    };

    // Set resolved timestamp if status changed to resolved
    if (updates.status === 'resolved' && feedback.status !== 'resolved') {
      updatedFeedback.resolvedAt = Date.now();
    }

    this.feedback.set(id, updatedFeedback);
    console.log(`Feedback updated: ${id}`);

    return true;
  }

  getFeedback(id: string): FeedbackItem | undefined {
    return this.feedback.get(id);
  }

  getAllFeedback(filters?: {
    type?: FeedbackItem['type'];
    category?: FeedbackItem['category'];
    severity?: FeedbackItem['severity'];
    status?: FeedbackItem['status'];
    language?: string;
    userId?: string;
    dateRange?: { start: number; end: number };
  }): FeedbackItem[] {
    let items = Array.from(this.feedback.values());

    if (filters) {
      if (filters.type) {
        items = items.filter(item => item.type === filters.type);
      }
      if (filters.category) {
        items = items.filter(item => item.category === filters.category);
      }
      if (filters.severity) {
        items = items.filter(item => item.severity === filters.severity);
      }
      if (filters.status) {
        items = items.filter(item => item.status === filters.status);
      }
      if (filters.language) {
        items = items.filter(item => item.language === filters.language);
      }
      if (filters.userId) {
        items = items.filter(item => item.userId === filters.userId);
      }
      if (filters.dateRange) {
        items = items.filter(item => 
          item.createdAt >= filters.dateRange!.start && 
          item.createdAt <= filters.dateRange!.end
        );
      }
    }

    return items.sort((a, b) => b.createdAt - a.createdAt);
  }

  voteFeedback(id: string, increment: boolean = true): boolean {
    const feedback = this.feedback.get(id);
    if (!feedback) {
      return false;
    }

    feedback.votes += increment ? 1 : -1;
    feedback.updatedAt = Date.now();

    console.log(`Feedback ${id} ${increment ? 'upvoted' : 'downvoted'}: ${feedback.votes} votes`);
    return true;
  }

  private categorizeFeedback(feedback: FeedbackItem): void {
    // Auto-categorize based on content
    const description = feedback.description.toLowerCase();
    const title = feedback.title.toLowerCase();
    const content = `${title} ${description}`;

    // Performance-related keywords
    if (content.includes('slow') || content.includes('timeout') || content.includes('performance')) {
      if (feedback.category === 'other') {
        feedback.category = 'performance';
      }
      feedback.tags.push('performance');
    }

    // UI-related keywords
    if (content.includes('interface') || content.includes('button') || content.includes('layout')) {
      if (feedback.category === 'other') {
        feedback.category = 'ui';
      }
      feedback.tags.push('ui');
    }

    // Execution-related keywords
    if (content.includes('error') || content.includes('crash') || content.includes('execution')) {
      if (feedback.category === 'other') {
        feedback.category = 'execution';
      }
      feedback.tags.push('execution');
    }

    // Language-specific tags
    const languages = ['javascript', 'python', 'sql', 'html', 'css'];
    languages.forEach(lang => {
      if (content.includes(lang)) {
        feedback.tags.push(lang);
        if (!feedback.language) {
          feedback.language = lang;
        }
      }
    });

    // Remove duplicates from tags
    feedback.tags = [...new Set(feedback.tags)];
  }

  private prioritizeFeedback(feedback: FeedbackItem): void {
    let priority = 0;

    // Increase priority based on type
    switch (feedback.type) {
      case 'bug_report':
        priority += 3;
        break;
      case 'feature_request':
        priority += 1;
        break;
      case 'improvement':
        priority += 2;
        break;
      case 'complaint':
        priority += 2;
        break;
    }

    // Increase priority based on severity
    switch (feedback.severity) {
      case 'critical':
        priority += 4;
        break;
      case 'high':
        priority += 3;
        break;
      case 'medium':
        priority += 2;
        break;
      case 'low':
        priority += 1;
        break;
    }

    // Increase priority based on votes
    priority += Math.min(feedback.votes, 5);

    // Auto-assign severity based on priority
    if (priority >= 8) {
      feedback.severity = 'critical';
    } else if (priority >= 6) {
      feedback.severity = 'high';
    } else if (priority >= 4) {
      feedback.severity = 'medium';
    } else {
      feedback.severity = 'low';
    }
  }

  private sendCriticalFeedbackAlert(feedback: FeedbackItem): void {
    console.warn(`🚨 CRITICAL FEEDBACK ALERT: ${feedback.title}`);
    console.warn(`Description: ${feedback.description}`);
    console.warn(`Category: ${feedback.category}, Language: ${feedback.language || 'N/A'}`);
    
    // In production, this would send alerts to:
    // - Slack/Discord channels
    // - Email notifications
    // - Issue tracking systems (Jira, GitHub Issues)
    // - Monitoring dashboards
  }

  private processFeedbackQueue(): void {
    if (this.feedbackQueue.length === 0) return;

    console.log(`Processing ${this.feedbackQueue.length} feedback items...`);

    // Process each feedback item
    this.feedbackQueue.forEach(feedback => {
      // Auto-assign based on category
      this.autoAssignFeedback(feedback);
      
      // Create related issues if needed
      this.createRelatedIssues(feedback);
      
      // Update status based on processing
      if (feedback.status === 'open' && feedback.severity !== 'critical') {
        this.updateFeedback(feedback.id, { status: 'in_progress' });
      }
    });

    // Clear the queue
    this.feedbackQueue = [];
  }

  private autoAssignFeedback(feedback: FeedbackItem): void {
    // Auto-assign based on category and expertise
    const assignments: Record<string, string> = {
      'execution': 'execution-team',
      'performance': 'performance-team',
      'ui': 'ui-team',
      'documentation': 'docs-team'
    };

    const assignee = assignments[feedback.category];
    if (assignee) {
      this.updateFeedback(feedback.id, { assignedTo: assignee });
    }
  }

  private createRelatedIssues(feedback: FeedbackItem): void {
    // Find similar feedback items
    const similar = this.findSimilarFeedback(feedback);
    
    if (similar.length > 0) {
      const relatedIds = similar.map(f => f.id);
      this.updateFeedback(feedback.id, { relatedIssues: relatedIds });
      
      // Update related issues to reference this one
      similar.forEach(similarFeedback => {
        const existingRelated = similarFeedback.relatedIssues || [];
        if (!existingRelated.includes(feedback.id)) {
          this.updateFeedback(similarFeedback.id, {
            relatedIssues: [...existingRelated, feedback.id]
          });
        }
      });
    }
  }

  private findSimilarFeedback(feedback: FeedbackItem): FeedbackItem[] {
    const allFeedback = Array.from(this.feedback.values());
    const similar: FeedbackItem[] = [];

    allFeedback.forEach(item => {
      if (item.id === feedback.id) return;

      let similarity = 0;

      // Same category
      if (item.category === feedback.category) similarity += 2;
      
      // Same type
      if (item.type === feedback.type) similarity += 1;
      
      // Same language
      if (item.language === feedback.language) similarity += 1;
      
      // Common tags
      const commonTags = item.tags.filter(tag => feedback.tags.includes(tag));
      similarity += commonTags.length;

      // Similar title/description (simple keyword matching)
      const itemWords = `${item.title} ${item.description}`.toLowerCase().split(/\s+/);
      const feedbackWords = `${feedback.title} ${feedback.description}`.toLowerCase().split(/\s+/);
      const commonWords = itemWords.filter(word => 
        word.length > 3 && feedbackWords.includes(word)
      );
      similarity += commonWords.length * 0.5;

      if (similarity >= 3) {
        similar.push(item);
      }
    });

    return similar.slice(0, 5); // Limit to 5 most similar
  }

  // Survey management
  submitSurvey(surveyData: Omit<UserSatisfactionSurvey, 'id' | 'createdAt'>): string {
    const id = `survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const survey: UserSatisfactionSurvey = {
      id,
      createdAt: Date.now(),
      ...surveyData
    };

    this.surveys.set(id, survey);
    console.log(`New satisfaction survey submitted: ${survey.overallRating}/5 stars`);

    return id;
  }

  getSurveys(filters?: {
    userId?: string;
    dateRange?: { start: number; end: number };
    minRating?: number;
    maxRating?: number;
  }): UserSatisfactionSurvey[] {
    let surveys = Array.from(this.surveys.values());

    if (filters) {
      if (filters.userId) {
        surveys = surveys.filter(s => s.userId === filters.userId);
      }
      if (filters.dateRange) {
        surveys = surveys.filter(s => 
          s.createdAt >= filters.dateRange!.start && 
          s.createdAt <= filters.dateRange!.end
        );
      }
      if (filters.minRating) {
        surveys = surveys.filter(s => s.overallRating >= filters.minRating!);
      }
      if (filters.maxRating) {
        surveys = surveys.filter(s => s.overallRating <= filters.maxRating!);
      }
    }

    return surveys.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Analytics and reporting
  getFeedbackMetrics(timeRange?: { start: number; end: number }): FeedbackMetrics {
    let feedback = Array.from(this.feedback.values());
    
    if (timeRange) {
      feedback = feedback.filter(f => 
        f.createdAt >= timeRange.start && f.createdAt <= timeRange.end
      );
    }

    const byType = feedback.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = feedback.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = feedback.reduce((acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = feedback.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average resolution time
    const resolvedFeedback = feedback.filter(f => f.resolvedAt);
    const averageResolutionTime = resolvedFeedback.length > 0
      ? resolvedFeedback.reduce((sum, f) => sum + (f.resolvedAt! - f.createdAt), 0) / resolvedFeedback.length
      : 0;

    // Calculate satisfaction score from surveys
    const surveys = Array.from(this.surveys.values());
    const satisfactionScore = surveys.length > 0
      ? surveys.reduce((sum, s) => sum + s.overallRating, 0) / surveys.length
      : 0;

    // Find trending issues
    const tagCounts = feedback.reduce((acc, f) => {
      f.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const trendingIssues = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([issue, count]) => ({
        issue,
        count,
        trend: 'stable' as const // In real implementation, this would compare with previous periods
      }));

    return {
      totalFeedback: feedback.length,
      byType,
      byCategory,
      bySeverity,
      byStatus,
      averageResolutionTime,
      satisfactionScore,
      trendingIssues
    };
  }

  generateFeedbackReport(timeRange: { start: number; end: number }): {
    summary: FeedbackMetrics;
    topIssues: FeedbackItem[];
    recentResolutions: FeedbackItem[];
    userSatisfaction: {
      averageRating: number;
      npsScore: number;
      responseCount: number;
    };
    recommendations: string[];
  } {
    const metrics = this.getFeedbackMetrics(timeRange);
    const feedback = this.getAllFeedback({ dateRange: timeRange });
    const surveys = this.getSurveys({ dateRange: timeRange });

    // Top issues by votes and severity
    const topIssues = feedback
      .filter(f => f.status === 'open')
      .sort((a, b) => {
        const scoreA = a.votes + (a.severity === 'critical' ? 10 : a.severity === 'high' ? 5 : 0);
        const scoreB = b.votes + (b.severity === 'critical' ? 10 : b.severity === 'high' ? 5 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 10);

    // Recent resolutions
    const recentResolutions = feedback
      .filter(f => f.status === 'resolved' && f.resolvedAt)
      .sort((a, b) => b.resolvedAt! - a.resolvedAt!)
      .slice(0, 10);

    // User satisfaction metrics
    const averageRating = surveys.length > 0
      ? surveys.reduce((sum, s) => sum + s.overallRating, 0) / surveys.length
      : 0;

    const promoters = surveys.filter(s => s.wouldRecommend).length;
    const detractors = surveys.filter(s => !s.wouldRecommend).length;
    const npsScore = surveys.length > 0
      ? ((promoters - detractors) / surveys.length) * 100
      : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, topIssues);

    return {
      summary: metrics,
      topIssues,
      recentResolutions,
      userSatisfaction: {
        averageRating,
        npsScore,
        responseCount: surveys.length
      },
      recommendations
    };
  }

  private generateRecommendations(metrics: FeedbackMetrics, topIssues: FeedbackItem[]): string[] {
    const recommendations: string[] = [];

    // High error rate
    if (metrics.byType.bug_report > metrics.totalFeedback * 0.4) {
      recommendations.push('High bug report rate detected. Consider increasing QA testing and code review processes.');
    }

    // Performance issues
    if (metrics.byCategory.performance > metrics.totalFeedback * 0.3) {
      recommendations.push('Performance is a major concern. Prioritize performance optimization initiatives.');
    }

    // UI/UX issues
    if (metrics.byCategory.ui > metrics.totalFeedback * 0.3) {
      recommendations.push('UI/UX improvements needed. Consider user experience research and design updates.');
    }

    // Critical issues
    if (metrics.bySeverity.critical > 0) {
      recommendations.push(`${metrics.bySeverity.critical} critical issues require immediate attention.`);
    }

    // Resolution time
    if (metrics.averageResolutionTime > 7 * 24 * 60 * 60 * 1000) { // 7 days
      recommendations.push('Average resolution time is high. Consider improving support processes and resource allocation.');
    }

    // Satisfaction score
    if (metrics.satisfactionScore < 3.5) {
      recommendations.push('User satisfaction is below average. Focus on addressing top user concerns.');
    }

    // Trending issues
    const topTrend = metrics.trendingIssues[0];
    if (topTrend && topTrend.count > 5) {
      recommendations.push(`"${topTrend.issue}" is a trending issue with ${topTrend.count} reports. Consider prioritizing this area.`);
    }

    return recommendations;
  }

  // Cleanup and maintenance
  archiveOldFeedback(olderThanDays: number = 365): number {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    let archivedCount = 0;

    for (const [id, feedback] of this.feedback.entries()) {
      if (feedback.createdAt < cutoffTime && feedback.status === 'resolved') {
        this.feedback.delete(id);
        archivedCount++;
      }
    }

    console.log(`Archived ${archivedCount} old feedback items`);
    return archivedCount;
  }

  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    console.log('User feedback manager stopped');
  }
}

// Global feedback manager
export const userFeedbackManager = new UserFeedbackManager();

// Convenience functions
export function submitFeedback(feedback: Omit<FeedbackItem, 'id' | 'status' | 'votes' | 'createdAt' | 'updatedAt'>): string {
  return userFeedbackManager.submitFeedback(feedback);
}

export function submitSatisfactionSurvey(survey: Omit<UserSatisfactionSurvey, 'id' | 'createdAt'>): string {
  return userFeedbackManager.submitSurvey(survey);
}

// Export types and classes
export type { 
  FeedbackItem, 
  FeedbackMetrics, 
  UserSatisfactionSurvey 
};
export { UserFeedbackManager };