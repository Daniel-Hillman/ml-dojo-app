'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Calendar, BookOpen, Trophy, MessageCircle, Settings, Crown, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  language: string;
  members: Member[];
  maxMembers: number;
  isPrivate: boolean;
  createdAt: Date;
  owner: Member;
  schedule: Schedule[];
  progress: GroupProgress;
  activities: Activity[];
  tags: string[];
}

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: Date;
  contribution: number;
  streak: number;
  status: 'online' | 'offline' | 'away';
}

interface Schedule {
  id: string;
  title: string;
  description: string;
  date: Date;
  duration: number; // in minutes
  type: 'study-session' | 'code-review' | 'challenge' | 'discussion';
  attendees: string[]; // member IDs
}

interface GroupProgress {
  completedChallenges: number;
  totalChallenges: number;
  averageScore: number;
  studyHours: number;
  currentGoal: string;
  goalProgress: number;
}

interface Activity {
  id: string;
  type: 'member-joined' | 'challenge-completed' | 'session-scheduled' | 'goal-achieved';
  description: string;
  timestamp: Date;
  member?: Member;
}

const SAMPLE_GROUPS: StudyGroup[] = [
  {
    id: '1',
    name: 'Python Fundamentals',
    description: 'Learn Python basics together through hands-on coding sessions and peer support.',
    category: 'Programming Languages',
    difficulty: 'Beginner',
    language: 'python',
    members: [
      {
        id: 'owner1',
        name: 'Sarah Chen',
        avatar: '/avatars/sarah.png',
        role: 'owner',
        joinedAt: new Date(Date.now() - 2592000000), // 30 days ago
        contribution: 95,
        streak: 12,
        status: 'online'
      },
      {
        id: 'member1',
        name: 'Mike Johnson',
        avatar: '/avatars/mike.png',
        role: 'member',
        joinedAt: new Date(Date.now() - 1728000000), // 20 days ago
        contribution: 78,
        streak: 8,
        status: 'online'
      },
      {
        id: 'member2',
        name: 'Lisa Wang',
        avatar: '/avatars/lisa.png',
        role: 'moderator',
        joinedAt: new Date(Date.now() - 1296000000), // 15 days ago
        contribution: 82,
        streak: 5,
        status: 'away'
      }
    ],
    maxMembers: 15,
    isPrivate: false,
    createdAt: new Date(Date.now() - 2592000000),
    owner: {
      id: 'owner1',
      name: 'Sarah Chen',
      avatar: '/avatars/sarah.png',
      role: 'owner',
      joinedAt: new Date(Date.now() - 2592000000),
      contribution: 95,
      streak: 12,
      status: 'online'
    },
    schedule: [
      {
        id: 's1',
        title: 'Weekly Python Practice',
        description: 'Solve coding challenges together',
        date: new Date(Date.now() + 86400000), // Tomorrow
        duration: 90,
        type: 'study-session',
        attendees: ['owner1', 'member1', 'member2']
      }
    ],
    progress: {
      completedChallenges: 23,
      totalChallenges: 30,
      averageScore: 87,
      studyHours: 45,
      currentGoal: 'Complete Python Basics Track',
      goalProgress: 76
    },
    activities: [
      {
        id: 'a1',
        type: 'member-joined',
        description: 'Alex Rodriguez joined the group',
        timestamp: new Date(Date.now() - 3600000),
        member: {
          id: 'member3',
          name: 'Alex Rodriguez',
          avatar: '/avatars/alex.png',
          role: 'member',
          joinedAt: new Date(),
          contribution: 0,
          streak: 0,
          status: 'online'
        }
      }
    ],
    tags: ['python', 'beginner', 'fundamentals', 'coding']
  }
];

export function StudyGroups() {
  const [groups, setGroups] = useState<StudyGroup[]>(SAMPLE_GROUPS);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'my-groups' | 'public' | 'private'>('all');
  const { toast } = useToast();

  const filteredGroups = groups.filter(group => {
    switch (filter) {
      case 'my-groups':
        return group.members.some(member => member.id === 'current-user');
      case 'public':
        return !group.isPrivate;
      case 'private':
        return group.isPrivate;
      default:
        return true;
    }
  });

  const joinGroup = (groupId: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            members: [...group.members, {
              id: 'current-user',
              name: 'Current User',
              avatar: '/avatars/current-user.png',
              role: 'member',
              joinedAt: new Date(),
              contribution: 0,
              streak: 0,
              status: 'online'
            }]
          }
        : group
    ));

    toast({
      title: "Joined Group!",
      description: "Welcome to the study group. Check the schedule for upcoming sessions.",
    });
  };

  if (selectedGroup) {
    return (
      <StudyGroupDetail
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
        onUpdate={(updatedGroup) => {
          setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
          setSelectedGroup(updatedGroup);
        }}
      />
    );
  }

  if (showCreateForm) {
    return (
      <CreateGroupForm
        onBack={() => setShowCreateForm(false)}
        onCreate={(newGroup) => {
          setGroups(prev => [...prev, newGroup]);
          setShowCreateForm(false);
          toast({
            title: "Group Created!",
            description: "Your study group has been created successfully.",
          });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="text-purple-500" size={24} />
          Study Groups
        </h2>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus size={16} />
          Create Group
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'my-groups', 'public', 'private'] as const).map(filterType => (
          <Button
            key={filterType}
            variant={filter === filterType ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(filterType)}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1).replace('-', ' ')}
          </Button>
        ))}
      </div>

      {/* Groups grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <StudyGroupCard
            key={group.id}
            group={group}
            onJoin={() => joinGroup(group.id)}
            onView={() => setSelectedGroup(group)}
          />
        ))}
      </div>
    </div>
  );
}

function StudyGroupCard({ 
  group, 
  onJoin, 
  onView 
}: { 
  group: StudyGroup; 
  onJoin: () => void;
  onView: () => void;
}) {
  const isCurrentUserMember = group.members.some(member => member.id === 'current-user');
  const isFull = group.members.length >= group.maxMembers;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">{group.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {group.description}
          </p>
        </div>
        {group.isPrivate && (
          <Badge variant="outline" className="text-xs">Private</Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className={getDifficultyColor(group.difficulty)}>
          {group.difficulty}
        </Badge>
        <Badge variant="outline">{group.language}</Badge>
        <Badge variant="secondary">{group.category}</Badge>
      </div>

      {/* Members */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1">
            <Users size={14} />
            {group.members.length}/{group.maxMembers} members
          </span>
          <div className="flex items-center gap-1">
            {group.members.slice(0, 3).map(member => (
              <img
                key={member.id}
                src={member.avatar}
                alt={member.name}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/avatars/default.png';
                }}
              />
            ))}
            {group.members.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
                +{group.members.length - 3}
              </div>
            )}
          </div>
        </div>
        
        <Progress value={(group.members.length / group.maxMembers) * 100} className="h-2" />
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Group Progress</span>
          <span>{group.progress.goalProgress}%</span>
        </div>
        <Progress value={group.progress.goalProgress} className="h-2" />
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {group.progress.currentGoal}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <div className="font-semibold">{group.progress.completedChallenges}</div>
          <div className="text-gray-600 dark:text-gray-400">Challenges</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">{group.progress.studyHours}h</div>
          <div className="text-gray-600 dark:text-gray-400">Study Time</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onView} className="flex-1">
          View Details
        </Button>
        {!isCurrentUserMember && (
          <Button 
            onClick={onJoin} 
            disabled={isFull}
            className="flex-1"
          >
            {isFull ? 'Full' : 'Join'}
          </Button>
        )}
      </div>
    </div>
  );
}

function StudyGroupDetail({ 
  group, 
  onBack, 
  onUpdate 
}: { 
  group: StudyGroup; 
  onBack: () => void;
  onUpdate: (group: StudyGroup) => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'schedule' | 'progress'>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back to Groups
        </Button>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <MessageCircle size={16} className="mr-1" />
            Chat
          </Button>
          <Button variant="outline" size="sm">
            <Settings size={16} className="mr-1" />
            Settings
          </Button>
        </div>
      </div>

      {/* Group info */}
      <div className="border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{group.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {group.description}
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Badge className={getDifficultyColor(group.difficulty)}>
                {group.difficulty}
              </Badge>
              <Badge variant="outline">{group.language}</Badge>
              <Badge variant="secondary">{group.category}</Badge>
              {group.isPrivate && (
                <Badge variant="outline">Private</Badge>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Created {group.createdAt.toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <img
                src={group.owner.avatar}
                alt={group.owner.name}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/avatars/default.png';
                }}
              />
              <span className="text-sm">{group.owner.name}</span>
              <Crown size={14} className="text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{group.members.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Members</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{group.progress.completedChallenges}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Challenges</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{group.progress.studyHours}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Study Hours</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{group.progress.averageScore}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Score</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          {(['overview', 'members', 'schedule', 'progress'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && <OverviewTab group={group} />}
        {activeTab === 'members' && <MembersTab group={group} onUpdate={onUpdate} />}
        {activeTab === 'schedule' && <ScheduleTab group={group} onUpdate={onUpdate} />}
        {activeTab === 'progress' && <ProgressTab group={group} />}
      </div>
    </div>
  );
}

function OverviewTab({ group }: { group: StudyGroup }) {
  return (
    <div className="space-y-6">
      {/* Current goal */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Trophy size={16} />
          Current Goal
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>{group.progress.currentGoal}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {group.progress.goalProgress}%
            </span>
          </div>
          <Progress value={group.progress.goalProgress} className="h-2" />
        </div>
      </div>

      {/* Recent activities */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Recent Activities</h3>
        <div className="space-y-3">
          {group.activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div className="flex-1">
                <div className="text-sm">{activity.description}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {activity.timestamp.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming sessions */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Calendar size={16} />
          Upcoming Sessions
        </h3>
        <div className="space-y-3">
          {group.schedule.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div>
                <div className="font-medium">{session.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {session.date.toLocaleDateString()} • {session.duration} min
                </div>
              </div>
              <Badge variant="outline">{session.type.replace('-', ' ')}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MembersTab({ group, onUpdate }: { group: StudyGroup; onUpdate: (group: StudyGroup) => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown size={14} className="text-yellow-500" />;
      case 'moderator': return <Settings size={14} className="text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Members ({group.members.length})</h3>
        <Button size="sm" className="flex items-center gap-2">
          <UserPlus size={16} />
          Invite Members
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {group.members.map((member) => (
          <div key={member.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-12 h-12 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/avatars/default.png';
                  }}
                />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(member.status)} rounded-full border-2 border-white dark:border-gray-800`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{member.name}</span>
                  {getRoleIcon(member.role)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Joined {member.joinedAt.toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">{member.contribution}%</div>
                <div className="text-gray-600 dark:text-gray-400">Contribution</div>
              </div>
              <div>
                <div className="font-medium">{member.streak} days</div>
                <div className="text-gray-600 dark:text-gray-400">Streak</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleTab({ group, onUpdate }: { group: StudyGroup; onUpdate: (group: StudyGroup) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Schedule</h3>
        <Button size="sm" className="flex items-center gap-2">
          <Plus size={16} />
          Schedule Session
        </Button>
      </div>

      <div className="space-y-3">
        {group.schedule.map((session) => (
          <div key={session.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium">{session.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {session.description}
                </p>
              </div>
              <Badge variant="outline">{session.type.replace('-', ' ')}</Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  {session.date.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  {session.duration} min
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span>{session.attendees.length} attending</span>
                <Button variant="outline" size="sm">
                  Join
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressTab({ group }: { group: StudyGroup }) {
  return (
    <div className="space-y-6">
      {/* Overall progress */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Overall Progress</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {group.progress.completedChallenges}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Challenges Completed
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {group.progress.averageScore}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average Score
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {group.progress.studyHours}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Study Hours
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {group.progress.goalProgress}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Goal Progress
            </div>
          </div>
        </div>
      </div>

      {/* Challenge progress */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Challenge Progress</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Completed Challenges</span>
            <span>{group.progress.completedChallenges}/{group.progress.totalChallenges}</span>
          </div>
          <Progress 
            value={(group.progress.completedChallenges / group.progress.totalChallenges) * 100} 
            className="h-3"
          />
        </div>
      </div>

      {/* Member contributions */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Member Contributions</h3>
        <div className="space-y-3">
          {group.members
            .sort((a, b) => b.contribution - a.contribution)
            .map((member, index) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-6 text-center font-bold text-sm">
                  {index + 1}
                </div>
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/avatars/default.png';
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{member.name}</span>
                    <span className="text-sm">{member.contribution}%</span>
                  </div>
                  <Progress value={member.contribution} className="h-2 mt-1" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function CreateGroupForm({ 
  onBack, 
  onCreate 
}: { 
  onBack: () => void;
  onCreate: (group: StudyGroup) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    language: 'python',
    maxMembers: 10,
    isPrivate: false,
    tags: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newGroup: StudyGroup = {
      id: `group-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      difficulty: formData.difficulty,
      language: formData.language,
      members: [{
        id: 'current-user',
        name: 'Current User',
        avatar: '/avatars/current-user.png',
        role: 'owner',
        joinedAt: new Date(),
        contribution: 100,
        streak: 0,
        status: 'online'
      }],
      maxMembers: formData.maxMembers,
      isPrivate: formData.isPrivate,
      createdAt: new Date(),
      owner: {
        id: 'current-user',
        name: 'Current User',
        avatar: '/avatars/current-user.png',
        role: 'owner',
        joinedAt: new Date(),
        contribution: 100,
        streak: 0,
        status: 'online'
      },
      schedule: [],
      progress: {
        completedChallenges: 0,
        totalChallenges: 0,
        averageScore: 0,
        studyHours: 0,
        currentGoal: 'Get started with group activities',
        goalProgress: 0
      },
      activities: [],
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    onCreate(newGroup);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="text-xl font-bold">Create Study Group</h2>
        <div /> {/* Spacer */}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Group Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Python Fundamentals"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what your group will focus on..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Programming Languages"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Primary Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty Level</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Members</label>
              <Input
                type="number"
                value={formData.maxMembers}
                onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                min="2"
                max="50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g., python, beginner, algorithms"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
            />
            <label htmlFor="isPrivate" className="text-sm">
              Make this group private (invite-only)
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button type="submit">
            Create Group
          </Button>
        </div>
      </form>
    </div>
  );
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}