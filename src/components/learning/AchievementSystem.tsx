'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Star, Target, Zap, Award, Calendar, TrendingUp, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'coding' | 'learning' | 'social' | 'streak' | 'challenge';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  requirement: {
    type: 'count' | 'streak' | 'score' | 'time';
    target: number;
    current: number;
  };
  unlockedAt?: Date;
  isUnlocked: boolean;
  isNew: boolean;
}

interface UserStats {
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
  currentLevelPoints: number;
  streak: number;
  challengesCompleted: number;
  drillsCompleted: number;
  codeExecutions: number;
  studyHours: number;
  communityContributions: number;
}

const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-code',
    title: 'Hello World',
    description: 'Execute your first piece of code',
    icon: <Zap className="text-yellow-500" size={24} />,
    category: 'coding',
    difficulty: 'bronze',
    points: 10,
    requirement: { type: 'count', target: 1, current: 1 },
    unlockedAt: new Date(Date.now() - 86400000),
    isUnlocked: true,
    isNew: false
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day coding streak',
    icon: <Calendar className="text-orange-500" size={24} />,
    category: 'streak',
    difficulty: 'silver',
    points: 50,
    requirement: { type: 'streak', target: 7, current: 5 },
    isUnlocked: false,
    isNew: false
  },
  {
    id: 'challenges-10',
    title: 'Challenge Master',
    description: 'Complete 10 coding challenges',
    icon: <Target className="text-blue-500" size={24} />,
    category: 'challenge',
    difficulty: 'gold',
    points: 100,
    requirement: { type: 'count', target: 10, current: 7 },
    isUnlocked: false,
    isNew: false
  },
  {
    id: 'perfect-score',
    title: 'Perfectionist',
    description: 'Achieve a perfect score on a challenge',
    icon: <Star className="text-purple-500" size={24} />,
    category: 'challenge',
    difficulty: 'gold',
    points: 75,
    requirement: { type: 'score', target: 100, current: 95 },
    isUnlocked: false,
    isNew: false
  },
  {
    id: 'community-helper',
    title: 'Community Helper',
    description: 'Help 5 community members',
    icon: <Award className="text-green-500" size={24} />,
    category: 'social',
    difficulty: 'silver',
    points: 60,
    requirement: { type: 'count', target: 5, current: 3 },
    isUnlocked: false,
    isNew: false
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete a challenge in under 5 minutes',
    icon: <TrendingUp className="text-red-500" size={24} />,
    category: 'challenge',
    difficulty: 'platinum',
    points: 150,
    requirement: { type: 'time', target: 300, current: 420 },
    isUnlocked: false,
    isNew: false
  }
];

const SAMPLE_STATS: UserStats = {
  totalPoints: 285,
  level: 3,
  nextLevelPoints: 500,
  currentLevelPoints: 200,
  streak: 5,
  challengesCompleted: 7,
  drillsCompleted: 23,
  codeExecutions: 156,
  studyHours: 12,
  communityContributions: 3
};

export function AchievementSystem() {
  const [achievements, setAchievements] = useState<Achievement[]>(SAMPLE_ACHIEVEMENTS);
  const [userStats, setUserStats] = useState<UserStats>(SAMPLE_STATS);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked' | 'new'>('all');
  const [showUnlockAnimation, setShowUnlockAnimation] = useState<Achievement | null>(null);

  const filteredAchievements = achievements.filter(achievement => {
    switch (filter) {
      case 'unlocked':
        return achievement.isUnlocked;
      case 'locked':
        return !achievement.isUnlocked;
      case 'new':
        return achievement.isNew;
      default:
        return true;
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'coding': return <Zap size={16} />;
      case 'learning': return <Star size={16} />;
      case 'social': return <Award size={16} />;
      case 'streak': return <Calendar size={16} />;
      case 'challenge': return <Target size={16} />;
      default: return <Trophy size={16} />;
    }
  };

  const levelProgress = ((userStats.totalPoints - userStats.currentLevelPoints) / 
                        (userStats.nextLevelPoints - userStats.currentLevelPoints)) * 100;

  return (
    <div className="space-y-6">
      {/* Header with level progress */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="text-yellow-500" size={28} />
              Achievements
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track your progress and unlock rewards
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              Level {userStats.level}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {userStats.totalPoints} points
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to Level {userStats.level + 1}</span>
            <span>{userStats.totalPoints}/{userStats.nextLevelPoints}</span>
          </div>
          <Progress value={levelProgress} className="h-3" />
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{userStats.streak}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{userStats.challengesCompleted}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Challenges</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{userStats.drillsCompleted}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Drills</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{userStats.studyHours}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Study Hours</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'unlocked', 'locked', 'new'] as const).map(filterType => (
          <Button
            key={filterType}
            variant={filter === filterType ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(filterType)}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            {filterType === 'new' && achievements.some(a => a.isNew) && (
              <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                {achievements.filter(a => a.isNew).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            getDifficultyColor={getDifficultyColor}
            getCategoryIcon={getCategoryIcon}
          />
        ))}
      </div>

      {/* Unlock animation */}
      <AnimatePresence>
        {showUnlockAnimation && (
          <UnlockAnimation
            achievement={showUnlockAnimation}
            onClose={() => setShowUnlockAnimation(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AchievementCard({ 
  achievement, 
  getDifficultyColor, 
  getCategoryIcon 
}: {
  achievement: Achievement;
  getDifficultyColor: (difficulty: string) => string;
  getCategoryIcon: (category: string) => React.ReactNode;
}) {
  const progress = (achievement.requirement.current / achievement.requirement.target) * 100;
  const isCompleted = achievement.requirement.current >= achievement.requirement.target;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`border rounded-lg p-4 transition-all ${
        achievement.isUnlocked 
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
          : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 opacity-75'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${achievement.isUnlocked ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
            {achievement.icon}
          </div>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              {achievement.title}
              {achievement.isNew && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  NEW
                </Badge>
              )}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {achievement.description}
            </p>
          </div>
        </div>
        
        {achievement.isUnlocked && (
          <Medal className="text-yellow-500" size={20} />
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={getDifficultyColor(achievement.difficulty)}>
              {achievement.difficulty}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              {getCategoryIcon(achievement.category)}
              {achievement.category}
            </Badge>
          </div>
          <div className="text-sm font-medium text-blue-600">
            +{achievement.points} pts
          </div>
        </div>

        {!achievement.isUnlocked && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>
                {achievement.requirement.current}/{achievement.requirement.target}
                {achievement.requirement.type === 'time' && ' min'}
                {achievement.requirement.type === 'score' && '%'}
              </span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
          </div>
        )}

        {achievement.isUnlocked && achievement.unlockedAt && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Unlocked {achievement.unlockedAt.toLocaleDateString()}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function UnlockAnimation({ 
  achievement, 
  onClose 
}: { 
  achievement: Achievement; 
  onClose: () => void; 
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: 2 }}
          className="mb-4"
        >
          <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="text-yellow-500" size={40} />
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
        
        <div className="flex items-center justify-center gap-3 mb-3">
          {achievement.icon}
          <h3 className="text-xl font-semibold">{achievement.title}</h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {achievement.description}
        </p>
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge className={getDifficultyColor(achievement.difficulty)}>
            {achievement.difficulty}
          </Badge>
          <div className="text-lg font-bold text-blue-600">
            +{achievement.points} points
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          Awesome!
        </Button>
      </motion.div>
    </motion.div>
  );
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Hook for achievement system
export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>(SAMPLE_ACHIEVEMENTS);
  const [userStats, setUserStats] = useState<UserStats>(SAMPLE_STATS);

  const checkAchievements = (action: string, value?: number) => {
    // This would check if any achievements should be unlocked based on the action
    // For now, just a placeholder
    console.log('Checking achievements for action:', action, value);
  };

  const unlockAchievement = (achievementId: string) => {
    setAchievements(prev => prev.map(achievement => 
      achievement.id === achievementId 
        ? { ...achievement, isUnlocked: true, isNew: true, unlockedAt: new Date() }
        : achievement
    ));
  };

  return {
    achievements,
    userStats,
    checkAchievements,
    unlockAchievement
  };
}