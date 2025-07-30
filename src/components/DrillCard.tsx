"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronRight, 
  FileText, 
  CheckCircle, 
  BarChart, 
  Trash2,
  Heart,
  Eye,
  Bookmark
} from 'lucide-react';
import { EnhancedDrill, Drill } from '@/lib/drills';

// Props for the enhanced drill card
export interface DrillCardProps {
  drill: EnhancedDrill;
  onRemoveSaved?: (drillId: string) => void;
  isReview?: boolean;
}

// Props for the basic drill card (for backward compatibility)
export interface BasicDrillCardProps {
  drill: Drill;
  isReview?: boolean;
}

// Enhanced DrillCard component with source indicators and community metadata
export const DrillCard = React.memo(function DrillCard({ drill, onRemoveSaved, isReview = false }: DrillCardProps) {
  // Keyboard navigation handlers - memoized for performance
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    // Allow Enter and Space to activate the main drill link
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const startButton = event.currentTarget.querySelector('[data-drill-start]') as HTMLElement;
      if (startButton) {
        startButton.click();
      }
    }
  }, []);

  const handleRemoveKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && onRemoveSaved) {
      event.preventDefault();
      event.stopPropagation();
      onRemoveSaved(drill.id);
    }
  }, [onRemoveSaved, drill.id]);

  // Memoized remove handler
  const handleRemove = React.useCallback(() => {
    if (onRemoveSaved) {
      onRemoveSaved(drill.id);
    }
  }, [onRemoveSaved, drill.id]);

  // Generate unique IDs for accessibility - memoized
  const ids = React.useMemo(() => ({
    cardId: `drill-card-${drill.id}`,
    titleId: `drill-title-${drill.id}`,
    descriptionId: `drill-description-${drill.id}`,
    authorId: drill.originalAuthor ? `drill-author-${drill.id}` : undefined
  }), [drill.id, drill.originalAuthor]);

  // Memoized content statistics
  const contentStats = React.useMemo(() => ({
    theory: drill.drill_content?.filter(c => c.type === 'theory').length || 0,
    mcq: drill.drill_content?.filter(c => c.type === 'mcq').length || 0,
    code: drill.drill_content?.filter(c => c.type === 'code').length || 0
  }), [drill.drill_content]);

  return (
    <Card 
      className="flex flex-col bg-card/50 backdrop-blur-sm border-2 border-transparent hover:border-primary/50 focus-within:border-primary/50 transition-optimized hover:shadow-lg hover:-translate-y-1"
      id={ids.cardId}
      role="article"
      aria-labelledby={ids.titleId}
      aria-describedby={ids.descriptionId}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Review indicator */}
      {isReview && (
        <div 
          className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider text-center py-1 rounded-t-lg"
          role="status"
          aria-label="This drill is due for review"
        >
          Review Due
        </div>
      )}
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle 
            id={ids.titleId}
            className="font-headline text-xl"
          >
            {drill.title}
          </CardTitle>
          <div className="flex gap-2" role="group" aria-label="Drill metadata">
            {/* Source indicator badge */}
            <Badge 
              variant={drill.source === 'personal' ? 'default' : 'secondary'}
              className="text-xs"
              aria-label={`Drill source: ${drill.source === 'personal' ? 'Created by you' : 'From community'}`}
            >
              {drill.source === 'personal' ? 'Created by You' : 'From Community'}
            </Badge>
            {/* Difficulty badge */}
            <Badge 
              variant={drill.difficulty === 'Beginner' ? 'default' : drill.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}
              aria-label={`Difficulty level: ${drill.difficulty}`}
            >
              {drill.difficulty}
            </Badge>
          </div>
        </div>
        
        <CardDescription className="text-muted-foreground font-gontserrat">{drill.concept}</CardDescription>
        
        {/* Original author information for community drills */}
        {drill.source === 'community' && drill.originalAuthor && (
          <div 
            className="flex items-center gap-2 text-xs text-muted-foreground font-gontserrat"
            id={ids.authorId}
            role="group"
            aria-label="Original author and community metrics"
          >
            {drill.originalAuthorAvatar && (
              <Avatar className="h-4 w-4">
                <AvatarImage 
                  src={drill.originalAuthorAvatar} 
                  alt={`${drill.originalAuthor}'s avatar`} 
                />
                <AvatarFallback className="text-xs">
                  {drill.originalAuthor.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <span>by {drill.originalAuthor}</span>
            
            {/* Community metrics */}
            {drill.communityMetrics && (
              <div 
                className="flex items-center gap-3 ml-2"
                role="group"
                aria-label="Community engagement metrics"
              >
                <div className="flex items-center gap-1" aria-label={`${drill.communityMetrics.likes} likes`}>
                  <Heart className="h-3 w-3" aria-hidden="true" />
                  <span>{drill.communityMetrics.likes}</span>
                </div>
                <div className="flex items-center gap-1" aria-label={`${drill.communityMetrics.views} views`}>
                  <Eye className="h-3 w-3" aria-hidden="true" />
                  <span>{drill.communityMetrics.views}</span>
                </div>
                <div className="flex items-center gap-1" aria-label={`${drill.communityMetrics.saves} saves`}>
                  <Bookmark className="h-3 w-3" aria-hidden="true" />
                  <span>{drill.communityMetrics.saves}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-grow">
        <p 
          id={ids.descriptionId}
          className="text-foreground/80 font-gontserrat"
        >
          {drill.description}
        </p>
        
        {/* Drill content statistics - optimized with memoized values */}
        <div 
          className="mt-4 flex space-x-4 text-sm text-muted-foreground font-gontserrat"
          role="group"
          aria-label="Drill content breakdown"
        >
          <div className="flex items-center gap-1.5" aria-label={`${contentStats.theory} theory sections`}>
            <FileText className="w-4 h-4" aria-hidden="true"/>
            <span>{contentStats.theory} Theory</span>
          </div>
          <div className="flex items-center gap-1.5" aria-label={`${contentStats.mcq} multiple choice questions`}>
            <CheckCircle className="w-4 h-4" aria-hidden="true"/>
            <span>{contentStats.mcq} MCQs</span>
          </div>
          <div className="flex items-center gap-1.5" aria-label={`${contentStats.code} code exercises`}>
            <BarChart className="w-4 h-4" aria-hidden="true"/>
            <span>{contentStats.code} Code</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {/* Remove from saved button for community drills */}
        {drill.source === 'community' && onRemoveSaved && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRemove}
            onKeyDown={handleRemoveKeyDown}
            className="flex items-center gap-1"
            aria-label={`Remove "${drill.title}" from saved drills`}
            aria-describedby={ids.authorId}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            Remove
          </Button>
        )}
        
        {/* Start drill button */}
        <Link href={`/drills/${drill.id}`} className="flex-1">
          <Button 
            className="w-full text-lg py-6"
            data-drill-start
            aria-label={`Start practicing "${drill.title}" - ${drill.difficulty} level ${drill.concept} drill`}
            aria-describedby={`${ids.descriptionId} ${ids.authorId || ''}`}
          >
            Start Drill
            <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
});

// Basic DrillCard component for backward compatibility
export function BasicDrillCard({ drill, isReview = false }: BasicDrillCardProps) {
  return (
    <Card className="flex flex-col bg-card/50 backdrop-blur-sm border-2 border-transparent hover:border-primary/50 transition-all duration-300">
      {isReview && (
        <div className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider text-center py-1 rounded-t-lg">
          Review Due
        </div>
      )}
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-xl">{drill.title}</CardTitle>
          <Badge 
            variant={drill.difficulty === 'Beginner' ? 'default' : drill.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}
          >
            {drill.difficulty}
          </Badge>
        </div>
        <CardDescription className="text-muted-foreground font-gontserrat">{drill.concept}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <p className="text-foreground/80 font-gontserrat">{drill.description}</p>
        <div className="mt-4 flex space-x-4 text-sm text-muted-foreground font-gontserrat">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4"/>
            <span>{drill.drill_content?.filter(c => c.type === 'theory').length || 0} Theory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4"/>
            <span>{drill.drill_content?.filter(c => c.type === 'mcq').length || 0} MCQs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart className="w-4 h-4"/>
            <span>{drill.drill_content?.filter(c => c.type === 'code').length || 0} Code</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Link href={`/drills/${drill.id}`} className="w-full">
          <Button className="w-full text-lg py-6">
            Start Drill
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}