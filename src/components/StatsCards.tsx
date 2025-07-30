"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Bookmark, 
  BarChart3,
  LoaderCircle
} from 'lucide-react';

// Props interface for the StatsCards component
export interface StatsCardsProps {
  personalCount: number;
  savedCount: number;
  totalCount: number;
  loading?: {
    personal?: boolean;
    saved?: boolean;
  };
}

// Individual stat card component
interface StatCardProps {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  loading?: boolean;
}

const StatCard = React.memo(function StatCard({ title, count, icon: Icon, color, loading = false }: StatCardProps) {
  // Define color classes based on the color prop - memoized
  const colorClasses = React.useMemo(() => ({
    primary: {
      border: 'hover:border-primary/50',
      icon: 'text-primary',
      text: 'text-primary'
    },
    secondary: {
      border: 'hover:border-secondary/50',
      icon: 'text-secondary-foreground',
      text: 'text-secondary-foreground'
    },
    accent: {
      border: 'hover:border-accent/50',
      icon: 'text-accent-foreground',
      text: 'text-accent-foreground'
    }
  }), []);
  
  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.primary;
  
  // Generate unique IDs for accessibility - memoized
  const ids = React.useMemo(() => {
    const cardId = `stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`;
    return {
      cardId,
      titleId: `${cardId}-title`,
      countId: `${cardId}-count`
    };
  }, [title]);
  
  return (
    <Card 
      className={`bg-card/50 backdrop-blur-sm border-2 border-transparent ${colors.border} transition-optimized hover:shadow-lg hover:-translate-y-1`}
      id={ids.cardId}
      role="region"
      aria-labelledby={ids.titleId}
      aria-describedby={ids.countId}
      tabIndex={0}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle 
          id={ids.titleId}
          className="text-sm font-medium text-muted-foreground"
        >
          {title}
        </CardTitle>
        <Icon 
          className={`h-4 w-4 ${colors.icon}`} 
          aria-hidden="true"
        />
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          {loading ? (
            <div 
              role="status" 
              aria-label={`Loading ${title.toLowerCase()} count`}
              className="flex items-center"
            >
              <LoaderCircle 
                className="h-6 w-6 animate-spin text-muted-foreground" 
                aria-hidden="true"
              />
              <span className="sr-only">Loading...</span>
            </div>
          ) : (
            <div 
              id={ids.countId}
              className={`text-2xl font-bold ${colors.text} transition-all duration-500 ease-out`}
              role="status"
              aria-live="polite"
              aria-label={`${count} ${title.toLowerCase()}`}
            >
              <CountAnimation count={count} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

// Animated counter component for smooth count transitions
function CountAnimation({ count }: { count: number }) {
  const [displayCount, setDisplayCount] = React.useState(0);
  
  React.useEffect(() => {
    if (count === displayCount) return;
    
    const increment = count > displayCount ? 1 : -1;
    const timer = setInterval(() => {
      setDisplayCount(prev => {
        const next = prev + increment;
        if ((increment > 0 && next >= count) || (increment < 0 && next <= count)) {
          clearInterval(timer);
          return count;
        }
        return next;
      });
    }, 50);
    
    return () => clearInterval(timer);
  }, [count, displayCount]);
  
  return <span>{displayCount}</span>;
}

// Main StatsCards component with enhanced responsive design
export function StatsCards({ 
  personalCount, 
  savedCount, 
  totalCount, 
  loading = {} 
}: StatsCardsProps) {
  return (
    <section 
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8"
      role="region"
      aria-label="Practice drill statistics"
    >
      {/* Personal Drills Card */}
      <StatCard
        title="My Drills"
        count={personalCount}
        icon={User}
        color="primary"
        loading={loading.personal}
      />
      
      {/* Saved Drills Card */}
      <StatCard
        title="Saved from Community"
        count={savedCount}
        icon={Bookmark}
        color="secondary"
        loading={loading.saved}
      />
      
      {/* Total Drills Card */}
      <StatCard
        title="Total Practice Drills"
        count={totalCount}
        icon={BarChart3}
        color="accent"
        loading={loading.personal || loading.saved}
      />
    </section>
  );
}