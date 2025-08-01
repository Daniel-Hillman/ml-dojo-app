'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  MapPin, 
  Link as LinkIcon, 
  Github, 
  Twitter,
  Calendar,
  Star,
  Code,
  Heart,
  GitFork,
  Eye,
  Trophy,
  Flame,
  Award,
  Users,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { UserProfile, UserBadge } from '@/lib/code-execution/social-features';

interface UserProfileCardProps {
  profile: UserProfile;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onEditProfile?: () => void;
  className?: string;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  profile,
  isOwnProfile = false,
  isFollowing = false,
  onFollow,
  onUnfollow,
  onEditProfile,
  className = ''
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long'
    }).format(new Date(date));
  };

  const getBadgeEmoji = (badge: UserBadge) => {
    return badge.icon || '🏆';
  };

  const getBadgeRarityColor = (rarity: UserBadge['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'uncommon':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rare':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getReputationLevel = (reputation: number) => {
    if (reputation >= 10000) return { level: 'Legend', color: 'text-yellow-600' };
    if (reputation >= 5000) return { level: 'Expert', color: 'text-purple-600' };
    if (reputation >= 1000) return { level: 'Advanced', color: 'text-blue-600' };
    if (reputation >= 100) return { level: 'Intermediate', color: 'text-green-600' };
    return { level: 'Beginner', color: 'text-gray-600' };
  };

  const reputationLevel = getReputationLevel(profile.stats.reputation);

  return (
    <Card className={`user-profile-card ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.displayName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Online indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{profile.displayName}</h2>
                <Badge className={`text-xs ${reputationLevel.color} bg-transparent border`}>
                  {reputationLevel.level}
                </Badge>
              </div>
              
              <p className="text-muted-foreground text-sm mb-2">@{profile.username}</p>
              
              {profile.bio && (
                <p className="text-sm leading-relaxed mb-2">{profile.bio}</p>
              )}

              {/* Location and Links */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.location}
                  </div>
                )}
                
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    Website
                  </a>
                )}
                
                {profile.githubUsername && (
                  <a
                    href={`https://github.com/${profile.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-gray-800 transition-colors"
                  >
                    <Github className="w-3 h-3" />
                    GitHub
                  </a>
                )}
                
                {profile.twitterHandle && (
                  <a
                    href={`https://twitter.com/${profile.twitterHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                  >
                    <Twitter className="w-3 h-3" />
                    Twitter
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <Button size="sm" variant="outline" onClick={onEditProfile}>
                Edit Profile
              </Button>
            ) : (
              <>
                {isFollowing ? (
                  <Button size="sm" variant="outline" onClick={onUnfollow}>
                    <UserMinus className="w-4 h-4 mr-1" />
                    Unfollow
                  </Button>
                ) : (
                  <Button size="sm" onClick={onFollow}>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Follow
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Code className="w-4 h-4 text-blue-600 mr-1" />
            </div>
            <div className="text-lg font-bold text-blue-900">{profile.stats.totalSnippets}</div>
            <div className="text-xs text-blue-700">Snippets</div>
          </div>

          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Heart className="w-4 h-4 text-red-600 mr-1" />
            </div>
            <div className="text-lg font-bold text-red-900">{profile.stats.totalLikes}</div>
            <div className="text-xs text-red-700">Likes</div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <GitFork className="w-4 h-4 text-green-600 mr-1" />
            </div>
            <div className="text-lg font-bold text-green-900">{profile.stats.totalForks}</div>
            <div className="text-xs text-green-700">Forks</div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Star className="w-4 h-4 text-purple-600 mr-1" />
            </div>
            <div className="text-lg font-bold text-purple-900">{profile.stats.reputation}</div>
            <div className="text-xs text-purple-700">Reputation</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Views:</span>
            <span className="font-medium">{profile.stats.totalViews.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-muted-foreground">Streak:</span>
            <span className="font-medium">{profile.stats.streak} days</span>
          </div>

          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-muted-foreground">Challenges:</span>
            <span className="font-medium">{profile.stats.challengesCompleted}</span>
          </div>

          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-500" />
            <span className="text-muted-foreground">Competitions:</span>
            <span className="font-medium">{profile.stats.competitionsWon}</span>
          </div>
        </div>

        {/* Badges */}
        {profile.badges.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Achievements ({profile.badges.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {profile.badges.slice(0, 8).map((badge, index) => (
                <div
                  key={badge.id}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getBadgeRarityColor(badge.rarity)}`}
                  title={`${badge.name}: ${badge.description}`}
                >
                  <span>{getBadgeEmoji(badge)}</span>
                  <span className="font-medium">{badge.name}</span>
                </div>
              ))}
              {profile.badges.length > 8 && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border bg-gray-100 text-gray-600">
                  +{profile.badges.length - 8} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preferred Languages */}
        {profile.preferences.preferredLanguages.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Preferred Languages</h4>
            <div className="flex flex-wrap gap-2">
              {profile.preferences.preferredLanguages.map(language => (
                <Badge key={language} variant="outline" className="text-xs">
                  {language}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Join Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
          <Calendar className="w-4 h-4" />
          <span>Joined {formatDate(profile.joinedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
};