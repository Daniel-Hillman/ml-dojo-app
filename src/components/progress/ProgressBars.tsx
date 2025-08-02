'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Clock, Zap } from 'lucide-react';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  showPercentage?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ 
  label, 
  value, 
  max, 
  color = 'blue', 
  showPercentage = true,
  icon,
  size = 'md'
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);
  
  const getColorClasses = () => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'purple': return 'bg-purple-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-2';
      case 'lg': return 'h-4';
      default: return 'h-3';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className={`font-medium ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}`}>
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {showPercentage && (
            <span className={`text-gray-600 dark:text-gray-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
              {percentage}%
            </span>
          )}
          <span className={`text-gray-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {value}/{max}
          </span>
        </div>
      </div>
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${getSizeClasses()}`}>
        <div
          className={`${getColorClasses()} ${getSizeClasses()} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Skill progress component
export function SkillProgress({ skills }: { skills: Array<{ name: string; level: number; maxLevel: number }> }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Target size={20} />
        Skill Progress
      </h3>
      <div className="space-y-3">
        {skills.map((skill, index) => (
          <ProgressBar
            key={skill.name}
            label={skill.name}
            value={skill.level}
            max={skill.maxLevel}
            color={skill.level === skill.maxLevel ? 'green' : 'blue'}
            icon={<Zap size={16} className="text-blue-500" />}
          />
        ))}
      </div>
    </div>
  );
}

// Learning path progress
export function LearningPathProgress({ 
  pathName, 
  completedLessons, 
  totalLessons,
  currentStreak,
  achievements 
}: {
  pathName: string;
  completedLessons: number;
  totalLessons: number;
  currentStreak: number;
  achievements: number;
}) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{pathName}</h3>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Trophy size={14} />
          {achievements} achievements
        </Badge>
      </div>
      
      <div className="space-y-3">
        <ProgressBar
          label="Lessons Completed"
          value={completedLessons}
          max={totalLessons}
          color="green"
          icon={<Target size={16} className="text-green-500" />}
        />
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-orange-500" />
            <span>Current Streak: {currentStreak} days</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {totalLessons - completedLessons} lessons remaining
          </div>
        </div>
      </div>
    </div>
  );
}

// Drill completion progress
export function DrillProgress({ 
  drillsCompleted, 
  totalDrills, 
  byDifficulty 
}: {
  drillsCompleted: number;
  totalDrills: number;
  byDifficulty: {
    beginner: { completed: number; total: number };
    intermediate: { completed: number; total: number };
    advanced: { completed: number; total: number };
  };
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Trophy size={20} />
        Drill Progress
      </h3>
      
      <ProgressBar
        label="Overall Progress"
        value={drillsCompleted}
        max={totalDrills}
        color="purple"
        size="lg"
        icon={<Target size={20} className="text-purple-500" />}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <ProgressBar
            label="Beginner"
            value={byDifficulty.beginner.completed}
            max={byDifficulty.beginner.total}
            color="green"
            size="sm"
          />
        </div>
        <div className="space-y-2">
          <ProgressBar
            label="Intermediate"
            value={byDifficulty.intermediate.completed}
            max={byDifficulty.intermediate.total}
            color="yellow"
            size="sm"
          />
        </div>
        <div className="space-y-2">
          <ProgressBar
            label="Advanced"
            value={byDifficulty.advanced.completed}
            max={byDifficulty.advanced.total}
            color="red"
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}

// Animated progress bar for loading states
export function AnimatedProgressBar({ 
  label, 
  isLoading = false,
  progress = 0 
}: {
  label: string;
  isLoading?: boolean;
  progress?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {!isLoading && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        {isLoading ? (
          <div className="h-2 bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
        ) : (
          <div
            className="h-2 bg-blue-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
    </div>
  );
}

// Circular progress component
export function CircularProgress({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8,
  color = 'blue',
  label,
  showValue = true
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}) {
  const percentage = (value / max) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getStrokeColor = () => {
    switch (color) {
      case 'green': return '#10b981';
      case 'yellow': return '#f59e0b';
      case 'purple': return '#8b5cf6';
      case 'red': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(percentage)}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {value}/{max}
              </div>
            </div>
          </div>
        )}
      </div>
      {label && (
        <div className="text-sm font-medium text-center">{label}</div>
      )}
    </div>
  );
}