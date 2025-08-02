'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Calendar, 
  Flame, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  totalSteps: number;
  completedSteps: number;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  language: string;
}

interface ProgressStats {
  totalDrillsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalCodeExecutions: number;
  favoriteLanguage: string;
  weeklyGoal: number;
  weeklyProgress: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

interface ProgressTrackerProps {
  stats: ProgressStats;
  achievements: Achievement[];
  learningPaths: LearningPath[];
  className?: string;
}

export function ProgressTracker({ 
  stats, 
  achievements, 
  learningPaths, 
  className 
}: ProgressTrackerProps) {
  const recentAchievements = achievements
    .filter(a => a.unlockedAt)
    .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
    .slice(0, 3);

  const activePaths = learningPaths.filter(path => 
    path.completedSteps > 0 && path.completedSteps < path.totalSteps
  );

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getDifficultyColor = (difficulty: LearningPath['difficulty']) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-700';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'Advanced': return 'bg-red-100 text-red-700';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalDrillsCompleted}</div>
            <div className="text-sm text-gray-500">Drills Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
              <Flame className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.currentStreak}</div>
            <div className="text-sm text-gray-500">Day Streak</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">Level {stats.level}</div>
            <div className="text-sm text-gray-500">{stats.xp} XP</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{achievements.filter(a => a.unlockedAt).length}</div>
            <div className="text-sm text-gray-500">Achievements</div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Goal Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progress this week</span>
              <span>{stats.weeklyProgress} / {stats.weeklyGoal} drills</span>
            </div>
            <Progress 
              value={(stats.weeklyProgress / stats.weeklyGoal) * 100} 
              className="h-2"
            />
            <div className="text-xs text-gray-500">
              {stats.weeklyGoal - stats.weeklyProgress > 0 
                ? `${stats.weeklyGoal - stats.weeklyProgress} more drills to reach your goal!`
                : '🎉 Goal achieved! Keep up the great work!'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Level Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Level {stats.level}</span>
              <span>{stats.xp} / {stats.xp + stats.xpToNextLevel} XP</span>
            </div>
            <Progress 
              value={(stats.xp / (stats.xp + stats.xpToNextLevel)) * 100} 
              className="h-3"
            />
            <div className="text-xs text-gray-500">
              {stats.xpToNextLevel} XP needed for Level {stats.level + 1}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAchievements.map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-lg ${getRarityColor(achievement.rarity)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{achievement.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">{achievement.description}</p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {achievement.unlockedAt?.toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Learning Paths */}
      {activePaths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Learning Paths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activePaths.map((path) => (
                <div key={path.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{path.title}</h4>
                      <p className="text-sm text-gray-500">{path.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getDifficultyColor(path.difficulty)}>
                        {path.difficulty}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {path.language}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{path.completedSteps} / {path.totalSteps} steps</span>
                    </div>
                    <Progress 
                      value={(path.completedSteps / path.totalSteps) * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Est. time: {path.estimatedTime}</span>
                      <span>{Math.round((path.completedSteps / path.totalSteps) * 100)}% complete</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook for managing progress data
export function useProgressTracking() {
  const [stats, setStats] = React.useState<ProgressStats>({
    totalDrillsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalCodeExecutions: 0,
    favoriteLanguage: 'JavaScript',
    weeklyGoal: 5,
    weeklyProgress: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 100
  });

  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [learningPaths, setLearningPaths] = React.useState<LearningPath[]>([]);

  // Load progress data from localStorage or API
  React.useEffect(() => {
    const savedStats = localStorage.getItem('progress-stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }

    const savedAchievements = localStorage.getItem('achievements');
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    }

    const savedPaths = localStorage.getItem('learning-paths');
    if (savedPaths) {
      setLearningPaths(JSON.parse(savedPaths));
    }
  }, []);

  const updateStats = (newStats: Partial<ProgressStats>) => {
    const updated = { ...stats, ...newStats };
    setStats(updated);
    localStorage.setItem('progress-stats', JSON.stringify(updated));
  };

  const unlockAchievement = (achievementId: string) => {
    const updated = achievements.map(a => 
      a.id === achievementId 
        ? { ...a, unlockedAt: new Date() }
        : a
    );
    setAchievements(updated);
    localStorage.setItem('achievements', JSON.stringify(updated));
  };

  const updateLearningPath = (pathId: string, progress: Partial<LearningPath>) => {
    const updated = learningPaths.map(p => 
      p.id === pathId 
        ? { ...p, ...progress }
        : p
    );
    setLearningPaths(updated);
    localStorage.setItem('learning-paths', JSON.stringify(updated));
  };

  return {
    stats,
    achievements,
    learningPaths,
    updateStats,
    unlockAchievement,
    updateLearningPath
  };
}