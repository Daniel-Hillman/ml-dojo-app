'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  FileText, 
  Code, 
  BookOpen, 
  Search, 
  Globe,
  X,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRecentActivity, RecentItem, ActivityStats } from '@/lib/recent-activity';
import { SafeDate } from './SSRSafe';
// Safe time formatting component to prevent hydration mismatches
const SafeTimeAgo = ({ timestamp }: { timestamp: number }) => {
  const [timeAgo, setTimeAgo] = React.useState('just now');
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    const updateTimeAgo = () => {
      const now = Date.now();
      const diffInSeconds = Math.floor((now - timestamp) / 1000);
      
      if (diffInSeconds < 60) setTimeAgo('just now');
      else if (diffInSeconds < 3600) setTimeAgo(`${Math.floor(diffInSeconds / 60)}m ago`);
      else if (diffInSeconds < 86400) setTimeAgo(`${Math.floor(diffInSeconds / 3600)}h ago`);
      else if (diffInSeconds < 604800) setTimeAgo(`${Math.floor(diffInSeconds / 86400)}d ago`);
      else setTimeAgo(`${Math.floor(diffInSeconds / 604800)}w ago`);
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timestamp]);

  return <span suppressHydrationWarning={!isClient}>{timeAgo}</span>;
};

interface RecentlyUsedProps {
  className?: string;
  limit?: number;
  showStats?: boolean;
  compact?: boolean;
  type?: 'all' | 'drill' | 'template' | 'example' | 'page';
}

export function RecentlyUsed({ 
  className, 
  limit = 5, 
  showStats = false,
  compact = false,
  type = 'all'
}: RecentlyUsedProps) {
  const { items, stats, removeItem, clearAll, getItemsByType } = useRecentActivity();

  const displayItems = type === 'all' 
    ? items.slice(0, limit)
    : getItemsByType(type, limit);

  const getTypeIcon = (itemType: RecentItem['type']) => {
    switch (itemType) {
      case 'drill': return FileText;
      case 'template': return Code;
      case 'example': return BookOpen;
      case 'search': return Search;
      case 'page': return Globe;
      default: return FileText;
    }
  };

  const getTypeColor = (itemType: RecentItem['type']) => {
    switch (itemType) {
      case 'drill': return 'bg-blue-100 text-blue-700';
      case 'template': return 'bg-green-100 text-green-700';
      case 'example': return 'bg-purple-100 text-purple-700';
      case 'search': return 'bg-orange-100 text-orange-700';
      case 'page': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {displayItems.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          displayItems.map((item) => {
            const Icon = getTypeIcon(item.type);
            return (
              <Link key={`${item.type}-${item.id}-${item.timestamp}`} href={item.url}>
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                  <div className={`p-1.5 rounded-md ${getTypeColor(item.type)}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">
                      <SafeTimeAgo timestamp={item.timestamp} />
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeItem(item.id, item.type);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Link>
            );
          })
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recently Used
          </CardTitle>
          {displayItems.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">No recent activity</h3>
            <p className="text-sm">
              Items you view will appear here for quick access
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item) => {
              const Icon = getTypeIcon(item.type);
              return (
                <div
                  key={`${item.type}-${item.id}-${item.timestamp}`}
                  className="group flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <Link href={item.url} className="block">
                      <h4 className="font-medium text-sm truncate hover:text-blue-600 transition-colors">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                        {item.language && (
                          <Badge variant="secondary" className="text-xs">
                            {item.language}
                          </Badge>
                        )}
                        {item.difficulty && (
                          <Badge variant="outline" className="text-xs">
                            {item.difficulty}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">
                          <SafeTimeAgo timestamp={item.timestamp} />
                        </span>
                      </div>
                    </Link>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                    onClick={() => removeItem(item.id, item.type)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Section */}
        {showStats && stats && displayItems.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">{stats.totalViews}</div>
                <div className="text-xs text-gray-500">Total Views</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{stats.uniqueItems}</div>
                <div className="text-xs text-gray-500">Unique Items</div>
              </div>
            </div>
            <div className="mt-3 text-center">
              <div className="text-sm text-gray-600">
                Favorite: <span className="font-medium">{stats.favoriteLanguage}</span>
              </div>
            </div>
          </div>
        )}

        {/* Show More Link */}
        {displayItems.length >= limit && (
          <div className="mt-4 text-center">
            <Link href="/recent">
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                View All Recent Activity
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Trending items component
export function TrendingItems({ 
  className,
  timeframe = 'week',
  limit = 5 
}: {
  className?: string;
  timeframe?: 'day' | 'week' | 'month';
  limit?: number;
}) {
  const { getTrendingItems } = useRecentActivity();
  const trendingItems = getTrendingItems(timeframe, limit);

  if (trendingItems.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending This {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {trendingItems.map((item, index) => {
            const Icon = getTypeIcon(item.type);
            return (
              <Link key={`trending-${item.type}-${item.id}`} href={item.url}>
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-full text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className={`p-1.5 rounded-md ${getTypeColor(item.type)}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                      {item.language && (
                        <Badge variant="secondary" className="text-xs">
                          {item.language}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Quick access component for sidebar
export function QuickAccess({ className }: { className?: string }) {
  const { items } = useRecentActivity();
  const recentItems = items.slice(0, 3);

  if (recentItems.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="px-3 py-2">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Quick Access
        </h3>
      </div>
      {recentItems.map((item) => {
        const Icon = getTypeIcon(item.type);
        return (
          <Link
            key={`quick-${item.type}-${item.id}`}
            href={item.url}
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon className="h-4 w-4" />
            <span className="truncate">{item.title}</span>
          </Link>
        );
      })}
    </div>
  );
}

