'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Eye, Code, User, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LiveCodeBlock } from '@/components/LiveCodeBlock';

interface CodeReview {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    reputation: number;
  };
  createdAt: Date;
  updatedAt: Date;
  status: 'open' | 'in-review' | 'completed';
  tags: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  upvotes: number;
  downvotes: number;
  views: number;
  comments: Comment[];
  reviewers: Reviewer[];
}

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    reputation: number;
  };
  content: string;
  createdAt: Date;
  lineNumber?: number;
  isResolved: boolean;
  upvotes: number;
  downvotes: number;
  replies: Reply[];
}

interface Reply {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  createdAt: Date;
  upvotes: number;
}

interface Reviewer {
  id: string;
  name: string;
  avatar: string;
  reputation: number;
  expertise: string[];
  rating: number;
}

const SAMPLE_REVIEWS: CodeReview[] = [
  {
    id: '1',
    title: 'Binary Search Implementation Review',
    description: 'Looking for feedback on my binary search implementation. Particularly interested in performance optimizations and edge case handling.',
    code: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

# Test cases
arr = [1, 3, 5, 7, 9, 11, 13]
print(binary_search(arr, 7))  # Should return 3
print(binary_search(arr, 2))  # Should return -1`,
    language: 'python',
    author: {
      id: 'user1',
      name: 'Alice Johnson',
      avatar: '/avatars/alice.png',
      reputation: 1250
    },
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 3600000), // 1 hour ago
    status: 'open',
    tags: ['algorithms', 'binary-search', 'python', 'optimization'],
    difficulty: 'Intermediate',
    upvotes: 12,
    downvotes: 1,
    views: 89,
    comments: [
      {
        id: 'c1',
        author: {
          id: 'reviewer1',
          name: 'Bob Smith',
          avatar: '/avatars/bob.png',
          reputation: 2100
        },
        content: 'Good implementation! One suggestion: consider using `mid = left + (right - left) // 2` to avoid potential integer overflow in other languages.',
        createdAt: new Date(Date.now() - 7200000),
        lineNumber: 4,
        isResolved: false,
        upvotes: 8,
        downvotes: 0,
        replies: [
          {
            id: 'r1',
            author: {
              id: 'user1',
              name: 'Alice Johnson',
              avatar: '/avatars/alice.png'
            },
            content: 'Thanks for the suggestion! That\'s a great point about overflow prevention.',
            createdAt: new Date(Date.now() - 3600000),
            upvotes: 3
          }
        ]
      }
    ],
    reviewers: [
      {
        id: 'reviewer1',
        name: 'Bob Smith',
        avatar: '/avatars/bob.png',
        reputation: 2100,
        expertise: ['algorithms', 'python', 'optimization'],
        rating: 4.8
      }
    ]
  }
];

export function CodeReview() {
  const [reviews, setReviews] = useState<CodeReview[]>(SAMPLE_REVIEWS);
  const [selectedReview, setSelectedReview] = useState<CodeReview | null>(null);
  const [newComment, setNewComment] = useState('');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'in-review' | 'completed'>('all');
  const { toast } = useToast();

  const filteredReviews = reviews.filter(review => 
    filter === 'all' || review.status === filter
  );

  const handleVote = (reviewId: string, type: 'up' | 'down') => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? {
            ...review,
            upvotes: type === 'up' ? review.upvotes + 1 : review.upvotes,
            downvotes: type === 'down' ? review.downvotes + 1 : review.downvotes
          }
        : review
    ));
    
    toast({
      title: "Vote recorded",
      description: `You ${type}voted this code review.`,
    });
  };

  const handleCommentVote = (commentId: string, type: 'up' | 'down') => {
    if (!selectedReview) return;

    const updatedReview = {
      ...selectedReview,
      comments: selectedReview.comments.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              upvotes: type === 'up' ? comment.upvotes + 1 : comment.upvotes,
              downvotes: type === 'down' ? comment.downvotes + 1 : comment.downvotes
            }
          : comment
      )
    };

    setSelectedReview(updatedReview);
    setReviews(prev => prev.map(review => 
      review.id === updatedReview.id ? updatedReview : review
    ));
  };

  const submitComment = () => {
    if (!selectedReview || !newComment.trim()) return;

    const comment: Comment = {
      id: `c${Date.now()}`,
      author: {
        id: 'current-user',
        name: 'Current User',
        avatar: '/avatars/current-user.png',
        reputation: 500
      },
      content: newComment,
      createdAt: new Date(),
      lineNumber: selectedLine || undefined,
      isResolved: false,
      upvotes: 0,
      downvotes: 0,
      replies: []
    };

    const updatedReview = {
      ...selectedReview,
      comments: [...selectedReview.comments, comment]
    };

    setSelectedReview(updatedReview);
    setReviews(prev => prev.map(review => 
      review.id === updatedReview.id ? updatedReview : review
    ));

    setNewComment('');
    setSelectedLine(null);

    toast({
      title: "Comment added",
      description: "Your review comment has been posted.",
    });
  };

  if (selectedReview) {
    return (
      <CodeReviewDetail
        review={selectedReview}
        onBack={() => setSelectedReview(null)}
        onVote={handleVote}
        onCommentVote={handleCommentVote}
        newComment={newComment}
        setNewComment={setNewComment}
        selectedLine={selectedLine}
        setSelectedLine={setSelectedLine}
        onSubmitComment={submitComment}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="text-blue-500" size={24} />
          Code Reviews
        </h2>
        <Button onClick={() => {/* Open submit for review modal */}}>
          Submit for Review
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'open', 'in-review', 'completed'] as const).map(status => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
          </Button>
        ))}
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <CodeReviewCard
            key={review.id}
            review={review}
            onClick={() => setSelectedReview(review)}
            onVote={handleVote}
          />
        ))}
      </div>
    </div>
  );
}

function CodeReviewCard({ 
  review, 
  onClick, 
  onVote 
}: { 
  review: CodeReview; 
  onClick: () => void;
  onVote: (id: string, type: 'up' | 'down') => void;
}) {
  const getStatusColor = () => {
    switch (review.status) {
      case 'open': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1" onClick={onClick}>
          <h3 className="text-lg font-semibold mb-2">{review.title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            {review.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className={getStatusColor()}>
              {review.status.replace('-', ' ')}
            </Badge>
            <Badge className={getDifficultyColor(review.difficulty)}>
              {review.difficulty}
            </Badge>
            <Badge variant="outline">{review.language}</Badge>
            {review.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-1 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onVote(review.id, 'up');
            }}
            className="p-1"
          >
            <ThumbsUp size={16} />
          </Button>
          <span className="text-sm font-medium">
            {review.upvotes - review.downvotes}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onVote(review.id, 'down');
            }}
            className="p-1"
          >
            <ThumbsDown size={16} />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src={review.author.avatar}
              alt={review.author.name}
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/avatars/default.png';
              }}
            />
            <span>{review.author.name}</span>
            <Badge variant="outline" className="text-xs">
              {review.author.reputation} rep
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            {review.createdAt.toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Eye size={14} />
            {review.views}
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare size={14} />
            {review.comments.length}
          </div>
          {review.reviewers.length > 0 && (
            <div className="flex items-center gap-1">
              <User size={14} />
              {review.reviewers.length} reviewer{review.reviewers.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CodeReviewDetail({
  review,
  onBack,
  onVote,
  onCommentVote,
  newComment,
  setNewComment,
  selectedLine,
  setSelectedLine,
  onSubmitComment
}: {
  review: CodeReview;
  onBack: () => void;
  onVote: (id: string, type: 'up' | 'down') => void;
  onCommentVote: (commentId: string, type: 'up' | 'down') => void;
  newComment: string;
  setNewComment: (comment: string) => void;
  selectedLine: number | null;
  setSelectedLine: (line: number | null) => void;
  onSubmitComment: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back to Reviews
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote(review.id, 'up')}
            className="flex items-center gap-1"
          >
            <ThumbsUp size={16} />
            {review.upvotes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote(review.id, 'down')}
            className="flex items-center gap-1"
          >
            <ThumbsDown size={16} />
            {review.downvotes}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Code and comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Review details */}
          <div className="border rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-2">{review.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {review.description}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">{review.language}</Badge>
              <Badge className={getDifficultyColor(review.difficulty)}>
                {review.difficulty}
              </Badge>
              {review.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <img
                src={review.author.avatar}
                alt={review.author.name}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/avatars/default.png';
                }}
              />
              <span>{review.author.name}</span>
              <Badge variant="outline" className="text-xs">
                {review.author.reputation} rep
              </Badge>
              <span>•</span>
              <span>{review.createdAt.toLocaleDateString()}</span>
            </div>
          </div>

          {/* Code */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Code</h3>
            <LiveCodeBlock
              code={review.code}
              language={review.language}
              showLineNumbers={true}
              editable={false}
              onLineClick={setSelectedLine}
              highlightedLine={selectedLine}
            />
          </div>

          {/* Comments */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">
              Comments ({review.comments.length})
            </h3>
            
            <div className="space-y-4 mb-6">
              {review.comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onVote={onCommentVote}
                />
              ))}
            </div>

            {/* Add comment */}
            <div className="space-y-3">
              {selectedLine && (
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Commenting on line {selectedLine}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLine(null)}
                    className="ml-2 p-0 h-auto"
                  >
                    ×
                  </Button>
                </div>
              )}
              
              <Textarea
                placeholder="Add your review comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              
              <div className="flex justify-end">
                <Button onClick={onSubmitComment} disabled={!newComment.trim()}>
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Reviewers */}
          {review.reviewers.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Reviewers</h4>
              <div className="space-y-3">
                {review.reviewers.map((reviewer) => (
                  <div key={reviewer.id} className="flex items-center gap-3">
                    <img
                      src={reviewer.avatar}
                      alt={reviewer.name}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/avatars/default.png';
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{reviewer.name}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Star size={12} className="text-yellow-500" />
                        {reviewer.rating}
                        <span>•</span>
                        <span>{reviewer.reputation} rep</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {reviewer.expertise.slice(0, 2).map(skill => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Views:</span>
                <span>{review.views}</span>
              </div>
              <div className="flex justify-between">
                <span>Comments:</span>
                <span>{review.comments.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Score:</span>
                <span>{review.upvotes - review.downvotes}</span>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{review.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated:</span>
                <span>{review.updatedAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentCard({ 
  comment, 
  onVote 
}: { 
  comment: Comment; 
  onVote: (commentId: string, type: 'up' | 'down') => void;
}) {
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
      <div className="flex items-start gap-3">
        <img
          src={comment.author.avatar}
          alt={comment.author.name}
          className="w-8 h-8 rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/avatars/default.png';
          }}
        />
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <Badge variant="outline" className="text-xs">
              {comment.author.reputation} rep
            </Badge>
            {comment.lineNumber && (
              <Badge variant="secondary" className="text-xs">
                Line {comment.lineNumber}
              </Badge>
            )}
            <span className="text-xs text-gray-500">
              {comment.createdAt.toLocaleDateString()}
            </span>
          </div>
          
          <p className="text-sm mb-3">{comment.content}</p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVote(comment.id, 'up')}
              className="p-1 h-auto"
            >
              <ThumbsUp size={14} />
              <span className="ml-1 text-xs">{comment.upvotes}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVote(comment.id, 'down')}
              className="p-1 h-auto"
            >
              <ThumbsDown size={14} />
              <span className="ml-1 text-xs">{comment.downvotes}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="p-1 h-auto text-xs">
              Reply
            </Button>
            
            {comment.replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="p-1 h-auto text-xs"
              >
                {showReplies ? 'Hide' : 'Show'} {comment.replies.length} replies
              </Button>
            )}
          </div>
          
          {showReplies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-2">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex items-start gap-2 text-sm">
                  <img
                    src={reply.author.avatar}
                    alt={reply.author.name}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/avatars/default.png';
                    }}
                  />
                  <div>
                    <span className="font-medium">{reply.author.name}</span>
                    <span className="text-gray-500 ml-2 text-xs">
                      {reply.createdAt.toLocaleDateString()}
                    </span>
                    <p className="mt-1">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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