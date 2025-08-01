'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Clock, 
  Users, 
  Trophy, 
  Star,
  Play,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Code,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { CodeChallenge, ChallengeAttempt } from '@/lib/code-execution/social-features';

interface ChallengeCardProps {
  challenge: CodeChallenge;
  userAttempt?: ChallengeAttempt;
  onStartChallenge?: () => void;
  onViewAttempt?: () => void;
  showStats?: boolean;
  className?: string;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  userAttempt,
  onStartChallenge,
  onViewAttempt,
  showStats = true,
  className = ''
}) => {
  const getDifficultyColor = (difficulty: CodeChallenge['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'advanced':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'expert':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      javascript: 'bg-yellow-100 text-yellow-800',
      typescript: 'bg-blue-100 text-blue-800',
      python: 'bg-green-100 text-green-800',
      java: 'bg-red-100 text-red-800',
      cpp: 'bg-purple-100 text-purple-800',
      sql: 'bg-indigo-100 text-indigo-800'
    };
    return colors[language] || 'bg-gray-100 text-gray-800';
  };

  const getAttemptStatusIcon = (status: ChallengeAttempt['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Card className={`challenge-card hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg truncate">{challenge.title}</CardTitle>
              {userAttempt && (
                <div className="flex items-center gap-1">
                  {getAttemptStatusIcon(userAttempt.status)}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-xs border ${getDifficultyColor(challenge.difficulty)}`}>
                <Target className="w-3 h-3 mr-1" />
                {challenge.difficulty}
              </Badge>
              
              <Badge className={`text-xs ${getLanguageColor(challenge.language)}`}>
                <Code className="w-3 h-3 mr-1" />
                {challenge.language}
              </Badge>
              
              <Badge variant="outline" className="text-xs">
                {challenge.category}
              </Badge>
              
              {challenge.timeLimit && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(challenge.timeLimit)}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <div className="text-right text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {challenge.rewards.points} pts
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {challenge.description}
        </p>

        {/* Tags */}
        {challenge.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {challenge.tags.slice(0, 4).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {challenge.tags.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{challenge.tags.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* User Attempt Status */}
        {userAttempt && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getAttemptStatusIcon(userAttempt.status)}
                <span className="text-sm font-medium capitalize">
                  {userAttempt.status === 'passed' ? 'Completed' : userAttempt.status}
                </span>
              </div>
              
              {userAttempt.score > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{userAttempt.score}/100</span>
                  <Progress value={userAttempt.score} className="w-16 h-2" />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(userAttempt.submittedAt)}
              </div>
              
              {userAttempt.executionTime > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {userAttempt.executionTime.toFixed(0)}ms
                </div>
              )}
              
              {userAttempt.testResults.length > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {userAttempt.testResults.filter(t => t.passed).length}/{userAttempt.testResults.length} tests
                </div>
              )}
            </div>
          </div>
        )}

        {/* Challenge Stats */}
        {showStats && (
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div className="p-2 bg-blue-50 rounded">
              <div className="flex items-center justify-center mb-1">
                <Users className="w-3 h-3 text-blue-600" />
              </div>
              <div className="font-medium text-blue-900">{challenge.stats.attempts}</div>
              <div className="text-blue-700">Attempts</div>
            </div>
            
            <div className="p-2 bg-green-50 rounded">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
              </div>
              <div className="font-medium text-green-900">{challenge.stats.completions}</div>
              <div className="text-green-700">Completed</div>
            </div>
            
            <div className="p-2 bg-purple-50 rounded">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="w-3 h-3 text-purple-600" />
              </div>
              <div className="font-medium text-purple-900">
                {(challenge.stats.successRate * 100).toFixed(0)}%
              </div>
              <div className="text-purple-700">Success</div>
            </div>
          </div>
        )}

        {/* Hints Preview */}
        {challenge.hints.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {challenge.hints.length} hint{challenge.hints.length > 1 ? 's' : ''} available
              </span>
            </div>
            <p className="text-xs text-yellow-700">
              Get help if you're stuck during the challenge
            </p>
          </div>
        )}

        {/* Rewards */}
        {(challenge.rewards.points > 0 || challenge.rewards.badges.length > 0) && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Rewards</span>
            </div>
            
            <div className="flex items-center gap-3 text-xs">
              {challenge.rewards.points > 0 && (
                <div className="flex items-center gap-1 text-purple-700">
                  <Star className="w-3 h-3" />
                  {challenge.rewards.points} points
                </div>
              )}
              
              {challenge.rewards.badges.length > 0 && (
                <div className="flex items-center gap-1 text-purple-700">
                  <Trophy className="w-3 h-3" />
                  {challenge.rewards.badges.length} badge{challenge.rewards.badges.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {userAttempt ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onViewAttempt}
                className="flex-1"
              >
                View Attempt
              </Button>
              
              {userAttempt.status !== 'passed' && (
                <Button
                  size="sm"
                  onClick={onStartChallenge}
                  className="flex-1"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Try Again
                </Button>
              )}
            </>
          ) : (
            <Button
              size="sm"
              onClick={onStartChallenge}
              className="flex-1"
            >
              <Play className="w-3 h-3 mr-1" />
              Start Challenge
            </Button>
          )}
        </div>

        {/* Creation Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Created {formatDate(challenge.createdAt)}
          </div>
          
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            by {challenge.createdBy}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};