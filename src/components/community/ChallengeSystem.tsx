'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Users, Star, Play, Code, Target, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { LiveCodeBlock } from '@/components/LiveCodeBlock';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: string;
  timeLimit: number; // in minutes
  startTime: Date;
  endTime: Date;
  participants: number;
  maxParticipants?: number;
  prize: string;
  status: 'upcoming' | 'active' | 'completed';
  createdBy: {
    id: string;
    name: string;
    avatar: string;
  };
  testCases: TestCase[];
  leaderboard: LeaderboardEntry[];
}

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string;
  score: number;
  completionTime: number;
  submissionTime: Date;
}

interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  code: string;
  language: string;
  score: number;
  testsPassed: number;
  totalTests: number;
  submissionTime: Date;
  executionTime: number;
}

const SAMPLE_CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: 'Two Sum Challenge',
    description: 'Given an array of integers and a target sum, return indices of two numbers that add up to the target.',
    difficulty: 'Easy',
    language: 'python',
    timeLimit: 30,
    startTime: new Date(Date.now() + 60000), // 1 minute from now
    endTime: new Date(Date.now() + 1860000), // 31 minutes from now
    participants: 45,
    maxParticipants: 100,
    prize: '100 XP + Badge',
    status: 'upcoming',
    createdBy: {
      id: 'admin',
      name: 'OmniCode Team',
      avatar: '/avatars/admin.png'
    },
    testCases: [
      { input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false },
      { input: '[3,2,4], 6', expectedOutput: '[1,2]', isHidden: false },
      { input: '[3,3], 6', expectedOutput: '[0,1]', isHidden: true }
    ],
    leaderboard: []
  },
  {
    id: '2',
    title: 'Binary Tree Traversal',
    description: 'Implement in-order traversal of a binary tree without using recursion.',
    difficulty: 'Medium',
    language: 'javascript',
    timeLimit: 45,
    startTime: new Date(Date.now() - 600000), // Started 10 minutes ago
    endTime: new Date(Date.now() + 2100000), // 35 minutes remaining
    participants: 23,
    maxParticipants: 50,
    prize: '200 XP + Premium Badge',
    status: 'active',
    createdBy: {
      id: 'expert1',
      name: 'Alex Chen',
      avatar: '/avatars/alex.png'
    },
    testCases: [
      { input: '[1,null,2,3]', expectedOutput: '[1,3,2]', isHidden: false },
      { input: '[1,2,3,4,5]', expectedOutput: '[4,2,5,1,3]', isHidden: true }
    ],
    leaderboard: [
      {
        userId: 'user1',
        username: 'CodeMaster',
        avatar: '/avatars/user1.png',
        score: 100,
        completionTime: 12,
        submissionTime: new Date(Date.now() - 300000)
      },
      {
        userId: 'user2',
        username: 'AlgoNinja',
        avatar: '/avatars/user2.png',
        score: 95,
        completionTime: 15,
        submissionTime: new Date(Date.now() - 180000)
      }
    ]
  }
];

export function ChallengeSystem() {
  const [challenges, setChallenges] = useState<Challenge[]>(SAMPLE_CHALLENGES);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [userCode, setUserCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    // Update time remaining for active challenges
    const interval = setInterval(() => {
      setChallenges(prev => prev.map(challenge => {
        if (challenge.status === 'active') {
          const remaining = Math.max(0, challenge.endTime.getTime() - Date.now());
          if (remaining === 0 && challenge.status === 'active') {
            return { ...challenge, status: 'completed' };
          }
        }
        return challenge;
      }));

      if (selectedChallenge?.status === 'active') {
        const remaining = Math.max(0, selectedChallenge.endTime.getTime() - Date.now());
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedChallenge]);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const joinChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setUserCode(`# ${challenge.title}\n# ${challenge.description}\n\ndef solution():\n    # Your code here\n    pass`);
    
    if (challenge.status === 'active') {
      setTimeRemaining(challenge.endTime.getTime() - Date.now());
    }
  };

  const submitSolution = async () => {
    if (!selectedChallenge || !userCode.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Simulate submission and testing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const score = Math.floor(Math.random() * 100) + 1;
      const testsPassed = Math.floor(Math.random() * selectedChallenge.testCases.length) + 1;
      
      toast({
        title: "Solution Submitted!",
        description: `Score: ${score}/100 | Tests Passed: ${testsPassed}/${selectedChallenge.testCases.length}`,
      });

      // Update leaderboard
      const newEntry: LeaderboardEntry = {
        userId: 'current-user',
        username: 'You',
        avatar: '/avatars/current-user.png',
        score,
        completionTime: Math.floor((Date.now() - selectedChallenge.startTime.getTime()) / 60000),
        submissionTime: new Date()
      };

      setChallenges(prev => prev.map(c => 
        c.id === selectedChallenge.id 
          ? { ...c, leaderboard: [...c.leaderboard, newEntry].sort((a, b) => b.score - a.score) }
          : c
      ));

    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedChallenge) {
    return (
      <ChallengeView
        challenge={selectedChallenge}
        userCode={userCode}
        setUserCode={setUserCode}
        timeRemaining={timeRemaining}
        isSubmitting={isSubmitting}
        onSubmit={submitSolution}
        onBack={() => setSelectedChallenge(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="text-yellow-500" size={24} />
          Coding Challenges
        </h2>
        <Button onClick={() => {/* Create challenge modal */}}>
          Create Challenge
        </Button>
      </div>

      {/* Challenge filters */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">All</Button>
        <Button variant="outline" size="sm">Active</Button>
        <Button variant="outline" size="sm">Upcoming</Button>
        <Button variant="outline" size="sm">Completed</Button>
        <Button variant="outline" size="sm">Easy</Button>
        <Button variant="outline" size="sm">Medium</Button>
        <Button variant="outline" size="sm">Hard</Button>
      </div>

      {/* Challenges grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onJoin={() => joinChallenge(challenge)}
          />
        ))}
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, onJoin }: { challenge: Challenge; onJoin: () => void }) {
  const getStatusColor = () => {
    switch (challenge.status) {
      case 'active': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const timeUntilStart = challenge.startTime.getTime() - Date.now();
  const timeRemaining = challenge.endTime.getTime() - Date.now();

  return (
    <div className="border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">{challenge.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {challenge.description}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className={getDifficultyColor(challenge.difficulty)}>
          {challenge.difficulty}
        </Badge>
        <Badge variant="outline">{challenge.language}</Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock size={12} />
          {challenge.timeLimit}min
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1">
            <Users size={14} />
            {challenge.participants} participants
          </span>
          <span className="flex items-center gap-1">
            <Award size={14} />
            {challenge.prize}
          </span>
        </div>

        {challenge.maxParticipants && (
          <Progress 
            value={(challenge.participants / challenge.maxParticipants) * 100} 
            className="h-2"
          />
        )}
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        {challenge.status === 'upcoming' && timeUntilStart > 0 && (
          <div>Starts in {Math.floor(timeUntilStart / 60000)} minutes</div>
        )}
        {challenge.status === 'active' && timeRemaining > 0 && (
          <div>Ends in {Math.floor(timeRemaining / 60000)} minutes</div>
        )}
        {challenge.status === 'completed' && (
          <div>Challenge completed</div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <img
          src={challenge.createdBy.avatar}
          alt={challenge.createdBy.name}
          className="w-6 h-6 rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/avatars/default.png';
          }}
        />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          by {challenge.createdBy.name}
        </span>
      </div>

      <Button 
        onClick={onJoin} 
        className="w-full"
        disabled={challenge.status === 'completed'}
      >
        {challenge.status === 'upcoming' ? 'Join Challenge' : 
         challenge.status === 'active' ? 'Enter Challenge' : 'View Results'}
      </Button>
    </div>
  );
}

function ChallengeView({
  challenge,
  userCode,
  setUserCode,
  timeRemaining,
  isSubmitting,
  onSubmit,
  onBack
}: {
  challenge: Challenge;
  userCode: string;
  setUserCode: (code: string) => void;
  timeRemaining: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back to Challenges
        </Button>
        
        {challenge.status === 'active' && (
          <div className="flex items-center gap-4">
            <div className="text-lg font-mono font-bold text-red-600">
              {formatTime(timeRemaining)}
            </div>
            <Badge className="bg-green-500 text-white">LIVE</Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Challenge details */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-bold mb-2">{challenge.title}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {challenge.description}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={getDifficultyColor(challenge.difficulty)}>
                {challenge.difficulty}
              </Badge>
              <Badge variant="outline">{challenge.language}</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock size={12} />
                {challenge.timeLimit}min
              </Badge>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Test Cases:</h4>
              {challenge.testCases.filter(tc => !tc.isHidden).map((testCase, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm">
                  <div><strong>Input:</strong> {testCase.input}</div>
                  <div><strong>Output:</strong> {testCase.expectedOutput}</div>
                </div>
              ))}
              {challenge.testCases.some(tc => tc.isHidden) && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  + {challenge.testCases.filter(tc => tc.isHidden).length} hidden test cases
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy size={16} />
              Leaderboard
            </h4>
            <div className="space-y-2">
              {challenge.leaderboard.slice(0, 5).map((entry, index) => (
                <div key={entry.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-center font-bold">
                      {index + 1}
                    </span>
                    <img
                      src={entry.avatar}
                      alt={entry.username}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/avatars/default.png';
                      }}
                    />
                    <span className="text-sm">{entry.username}</span>
                  </div>
                  <div className="text-sm font-mono">
                    {entry.score}/100
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Code editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Your Solution</h4>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Play size={14} className="mr-1" />
                  Test
                </Button>
                <Button 
                  onClick={onSubmit}
                  disabled={isSubmitting || challenge.status !== 'active'}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Code size={14} />
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <LiveCodeBlock
              code={userCode}
              language={challenge.language}
              onChange={setUserCode}
              editable={challenge.status === 'active'}
              height="400px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

function formatTime(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}