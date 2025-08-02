import React from 'react';

interface RecentItem {
  id: string;
  type: 'drill' | 'template' | 'example' | 'page' | 'search';
  title: string;
  description?: string;
  url: string;
  language?: string;
  difficulty?: string;
  tags?: string[];
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ActivityStats {
  totalViews: number;
  uniqueItems: number;
  favoriteLanguage: string;
  mostViewedType: string;
  averageSessionTime: number;
}

class RecentActivityManager {
  private readonly STORAGE_KEY = 'omnicode-recent-activity';
  private readonly MAX_ITEMS = 50;
  private readonly MAX_DISPLAY_ITEMS = 10;

  // Add item to recent activity
  addItem(item: Omit<RecentItem, 'timestamp'>): void {
    try {
      const recentItems = this.getItems();
      
      // Remove existing item if it exists (to update timestamp)
      const filteredItems = recentItems.filter(existing => 
        !(existing.id === item.id && existing.type === item.type)
      );

      // Add new item at the beginning
      const newItem: RecentItem = {
        ...item,
        timestamp: Date.now()
      };

      const updatedItems = [newItem, ...filteredItems].slice(0, this.MAX_ITEMS);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedItems));
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('recentActivityUpdated', {
        detail: { item: newItem, items: updatedItems }
      }));
    } catch (error) {
      console.error('Failed to add recent item:', error);
    }
  }

  // Get recent items
  getItems(limit?: number): RecentItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const items: RecentItem[] = JSON.parse(stored);
      const validItems = items.filter(item => 
        item.id && item.type && item.title && item.timestamp
      );

      return validItems
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit || this.MAX_DISPLAY_ITEMS);
    } catch (error) {
      console.error('Failed to get recent items:', error);
      return [];
    }
  }

  // Get items by type
  getItemsByType(type: RecentItem['type'], limit: number = 5): RecentItem[] {
    return this.getItems().filter(item => item.type === type).slice(0, limit);
  }

  // Get items by language
  getItemsByLanguage(language: string, limit: number = 5): RecentItem[] {
    return this.getItems()
      .filter(item => item.language?.toLowerCase() === language.toLowerCase())
      .slice(0, limit);
  }

  // Search recent items
  searchItems(query: string, limit: number = 10): RecentItem[] {
    const searchTerm = query.toLowerCase();
    return this.getItems()
      .filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.language?.toLowerCase().includes(searchTerm) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      )
      .slice(0, limit);
  }

  // Remove item
  removeItem(id: string, type: RecentItem['type']): void {
    try {
      const items = this.getItems();
      const filteredItems = items.filter(item => 
        !(item.id === id && item.type === type)
      );
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredItems));
      
      window.dispatchEvent(new CustomEvent('recentActivityUpdated', {
        detail: { items: filteredItems }
      }));
    } catch (error) {
      console.error('Failed to remove recent item:', error);
    }
  }

  // Clear all items
  clearAll(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('recentActivityUpdated', {
        detail: { items: [] }
      }));
    } catch (error) {
      console.error('Failed to clear recent items:', error);
    }
  }

  // Get activity statistics
  getStats(): ActivityStats {
    const items = this.getItems();
    
    if (items.length === 0) {
      return {
        totalViews: 0,
        uniqueItems: 0,
        favoriteLanguage: 'JavaScript',
        mostViewedType: 'drill',
        averageSessionTime: 0
      };
    }

    // Count languages
    const languageCounts: Record<string, number> = {};
    items.forEach(item => {
      if (item.language) {
        languageCounts[item.language] = (languageCounts[item.language] || 0) + 1;
      }
    });

    // Count types
    const typeCounts: Record<string, number> = {};
    items.forEach(item => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });

    // Find favorites
    const favoriteLanguage = Object.entries(languageCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'JavaScript';
    
    const mostViewedType = Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'drill';

    return {
      totalViews: items.length,
      uniqueItems: new Set(items.map(item => `${item.type}-${item.id}`)).size,
      favoriteLanguage,
      mostViewedType,
      averageSessionTime: 0 // Could be calculated if we track session times
    };
  }

  // Get trending items (most viewed in recent time)
  getTrendingItems(timeframe: 'day' | 'week' | 'month' = 'week', limit: number = 5): RecentItem[] {
    const now = Date.now();
    const timeframes = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    const cutoff = now - timeframes[timeframe];
    const recentItems = this.getItems().filter(item => item.timestamp > cutoff);

    // Count occurrences
    const itemCounts: Record<string, { item: RecentItem; count: number }> = {};
    
    recentItems.forEach(item => {
      const key = `${item.type}-${item.id}`;
      if (itemCounts[key]) {
        itemCounts[key].count++;
        // Keep the most recent version
        if (item.timestamp > itemCounts[key].item.timestamp) {
          itemCounts[key].item = item;
        }
      } else {
        itemCounts[key] = { item, count: 1 };
      }
    });

    return Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(entry => entry.item);
  }

  // Export data for backup
  exportData(): string {
    return JSON.stringify({
      items: this.getItems(),
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Import data from backup
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.items && Array.isArray(data.items)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.items));
        window.dispatchEvent(new CustomEvent('recentActivityUpdated', {
          detail: { items: data.items }
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// Create singleton instance
export const recentActivity = new RecentActivityManager();

// Convenience functions for common use cases
export const trackDrillView = (drill: {
  id: string;
  title: string;
  description?: string;
  language?: string;
  difficulty?: string;
  tags?: string[];
}) => {
  recentActivity.addItem({
    id: drill.id,
    type: 'drill',
    title: drill.title,
    description: drill.description,
    url: `/drills/${drill.id}`,
    language: drill.language,
    difficulty: drill.difficulty,
    tags: drill.tags
  });
};

export const trackTemplateView = (template: {
  id: string;
  title: string;
  description?: string;
  language?: string;
  difficulty?: string;
  tags?: string[];
}) => {
  recentActivity.addItem({
    id: template.id,
    type: 'template',
    title: template.title,
    description: template.description,
    url: `/playground?template=${template.id}`,
    language: template.language,
    difficulty: template.difficulty,
    tags: template.tags
  });
};

export const trackPageView = (page: {
  id: string;
  title: string;
  url: string;
  description?: string;
}) => {
  recentActivity.addItem({
    id: page.id,
    type: 'page',
    title: page.title,
    description: page.description,
    url: page.url
  });
};

export const trackSearch = (query: string, resultsCount: number) => {
  recentActivity.addItem({
    id: `search-${Date.now()}`,
    type: 'search',
    title: `Search: "${query}"`,
    description: `${resultsCount} results found`,
    url: `/search?q=${encodeURIComponent(query)}`,
    metadata: { query, resultsCount }
  });
};

// React hook for using recent activity
export function useRecentActivity() {
  const [items, setItems] = React.useState<RecentItem[]>([]);
  const [stats, setStats] = React.useState<ActivityStats | null>(null);

  React.useEffect(() => {
    // Load initial data
    setItems(recentActivity.getItems());
    setStats(recentActivity.getStats());

    // Listen for updates
    const handleUpdate = (event: CustomEvent) => {
      setItems(event.detail.items || recentActivity.getItems());
      setStats(recentActivity.getStats());
    };

    window.addEventListener('recentActivityUpdated', handleUpdate as EventListener);
    
    return () => {
      window.removeEventListener('recentActivityUpdated', handleUpdate as EventListener);
    };
  }, []);

  return {
    items,
    stats,
    addItem: recentActivity.addItem.bind(recentActivity),
    removeItem: recentActivity.removeItem.bind(recentActivity),
    clearAll: recentActivity.clearAll.bind(recentActivity),
    getItemsByType: recentActivity.getItemsByType.bind(recentActivity),
    getItemsByLanguage: recentActivity.getItemsByLanguage.bind(recentActivity),
    searchItems: recentActivity.searchItems.bind(recentActivity),
    getTrendingItems: recentActivity.getTrendingItems.bind(recentActivity)
  };
}

// Export types for use in components
export type { RecentItem, ActivityStats };