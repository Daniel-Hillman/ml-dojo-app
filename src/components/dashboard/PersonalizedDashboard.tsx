'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  Clock, 
  Star, 
  Play, 
  BookOpen,
  Users,
  Calendar,
  Award,
  Zap,
  ArrowRight,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserPreferences } from '@/lib/user-preferences';
import { RecentlyUsed, TrendingItems } from '@/components/RecentlyUsed';
import { ProgressTracker } from '@/components/progress/ProgressTracker';

interface PersonalizedDashboardProps {
  className?: string;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export function PersonalizedDashboard({ className, user }: PersonalizedDashboardProps) {
  const { 
    preferences, 
    getRecommendations, 
    getLearningPathSuggestions,
    hasCompletedOnboarding 
  } = useUserPreferences();

  const recommendations = getRecommendations();
  const learningPaths = getLearningPathSuggestions();
  const isOnboarded = hasCompletedOnboarding();

  // Mock data - in real app, this would come from APIs
  const mockStats = {
    totalDrillsCompleted: 24,
    currentStreak: 5,
    longestStreak: 12,
    totalCodeExecutions: 156,
    favoriteLanguage: preferences.primaryLanguage,
    weeklyGoal: preferences.weeklyGoal,
    weeklyProgress: 8,
    level: 3,
    xp: 1250,
    xpToNextLevel: 350
  };

  const mockAchievements = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Completed your first drill',
      icon: Target,
      unlockedAt: new Date(Date.now() - 86400000),
      rarity: 'common' as const
    },
    {
      id: '2',
      title: 'Code Runner',
      description: 'Executed 100 code snippets',
      icon: Play,
      unlockedAt: new Date(Date.now() - 172800000),
      rarity: 'rare' as const
    }
  ];

  const mockLearningPaths = [
    {
      id: '1',
      title: 'JavaScript Mastery',
      description: 'From basics to advanced concepts',
      totalSteps: 20,
      completedSteps: 8,
      estimatedTime: '3 weeks',
      difficulty: 'Intermediate' as const,
      language: 'JavaScript'
    }
  ];

  const quickActions = [
    {
      href: '/playground',
      icon: Play,
      title: 'Try Live Code',
      description: 'Start coding instantly',
      color: 'bg-blue-500 hover:bg-blue-600',
      featured: true
    },
    {
      href: '/drills/create',
      icon: Target,
      title: 'Create Drill',
      description: 'Build custom practice',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      href: '/learn',
      icon: BookOpen,
      title: 'Browse Examples',
      description: 'Explore templates',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      href: '/community',
      icon: Users,
      title: 'Join Community',
      description: 'Connect with others',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Ready to continue your coding journey?
          </p>
        </div>
        <Link href="/settings">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Card className={cn(
                    "hover:shadow-md transition-all cursor-pointer group",
                    action.featured && "ring-2 ring-blue-200 bg-blue-50"
                  )}>
                    <CardContent className="p-4 text-center">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 group-hover:scale-110 transition-transform",
                        action.color
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-medium text-sm">{action.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                      {action.featured && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Recommended
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProgressTracker
            stats={mockStats}
            achievements={mockAchievements}
            learningPaths={mockLearningPaths}
          />
        </div>

        <div className="space-y-6">
          {/* Daily Goal */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                Today's Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{recommendations.dailyGoalProgress.toFixed(0)}%</span>
                </div>
                <Progress value={recommendations.dailyGoalProgress} className="h-3" />
                <div className="text-xs text-gray-500">
                  {preferences.dailyGoal - Math.floor(recommendations.dailyGoalProgress / 100 * preferences.dailyGoal)} more drills to reach your daily goal!
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personalized Recommendations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5" />
                For You
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Recommended Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.suggestedLanguages.map(lang => (
                      <Badge key={lang} variant="secondary" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Suggested Difficulty</h4>
                  <Badge variant="outline" className="text-xs">
                    {recommendations.suggestedDifficulty}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Content Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.suggestedContentTypes.map(type => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <RecentlyUsed limit={3} compact showStats />
        </div>
      </div>

      {/* Learning Paths */}
      {learningPaths.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recommended Learning Paths
              </CardTitle>
              <Link href="/learn">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {learningPaths.slice(0, 3).map((path) => (
                <Card key={path.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-sm">{path.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{path.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(path.relevanceScore)}% match
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {path.estimatedTime}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {path.languages.map(lang => (
                          <Badge key={lang} variant="secondary" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                      
                      <Button size="sm" className="w-full mt-3">
                        Start Learning
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trending Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendingItems timeframe="week" limit={5} />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              This Week's Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Award className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">5-Day Streak!</h4>
                  <p className="text-xs text-gray-500">Keep it up to reach your longest streak</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Level Up!</h4>
                  <p className="text-xs text-gray-500">You reached Level 3 this week</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Play className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Code Master</h4>
                  <p className="text-xs text-gray-500">Executed 50+ code snippets</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Prompt for New Users */}
      {!isOnboarded && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Complete Your Profile</h3>
                <p className="text-gray-600 mt-1">
                  Help us personalize your learning experience by setting your preferences
                </p>
              </div>
              <Link href="/settings">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}