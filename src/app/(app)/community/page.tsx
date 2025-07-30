'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Heart, MessageCircle, Bookmark, Share2, Star, Clock, TrendingUp, 
  Filter, Search, Code, User, Calendar, ThumbsUp, Eye, BookmarkPlus
} from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/client';
import { 
  collection, query, orderBy, limit, getDocs, doc, getDoc, 
  addDoc, updateDoc, increment, arrayUnion, arrayRemove,
  where, serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface CommunityDrill {
  id: string;
  title: string;
  concept: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  language: string;
  content: any[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: Date;
  likes: number;
  comments: number;
  saves: number;
  views: number;
  tags: string[];
  isPublic: boolean;
  likedBy: string[];
  savedBy: string[];
}

interface Comment {
  id: string;
  drillId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
  likes: number;
  likedBy: string[];
}

type SortOption = 'newest' | 'popular' | 'trending' | 'mostLiked';

export default function CommunityPage() {
  const [user] = useAuthState(auth);
  const [drills, setDrills] = useState<CommunityDrill[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadCommunityDrills();
  }, [sortBy]);

  const loadCommunityDrills = async () => {
    try {
      setLoading(true);
      
      // Simplified query to avoid index requirement - we'll sort client-side temporarily
      let q = query(
        collection(db, 'community_drills'),
        where('isPublic', '==', true),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      let drillsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as CommunityDrill[];

      // Apply client-side sorting (temporary solution)
      switch (sortBy) {
        case 'newest':
          drillsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          break;
        case 'popular':
          drillsData.sort((a, b) => (b.views || 0) - (a.views || 0));
          break;
        case 'trending':
          drillsData.sort((a, b) => (b.likes || 0) - (a.likes || 0));
          break;
        case 'mostLiked':
          drillsData.sort((a, b) => (b.likes || 0) - (a.likes || 0));
          break;
      }

      setDrills(drillsData);
    } catch (error) {
      console.error('Error loading community drills:', error);
      toast({
        title: 'Error',
        description: 'Failed to load community drills. Please create the required Firestore index.',
        variant: 'destructive'
      });
      
      // Show empty state with helpful message
      setDrills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (drillId: string) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to like drills',
        variant: 'destructive'
      });
      return;
    }

    try {
      const drillRef = doc(db, 'community_drills', drillId);
      const drill = drills.find(d => d.id === drillId);
      
      if (!drill) return;

      const isLiked = drill.likedBy.includes(user.uid);
      
      if (isLiked) {
        // Unlike
        await updateDoc(drillRef, {
          likes: increment(-1),
          likedBy: arrayRemove(user.uid)
        });
        
        setDrills(prev => prev.map(d => 
          d.id === drillId 
            ? { ...d, likes: d.likes - 1, likedBy: d.likedBy.filter(id => id !== user.uid) }
            : d
        ));
      } else {
        // Like
        await updateDoc(drillRef, {
          likes: increment(1),
          likedBy: arrayUnion(user.uid)
        });
        
        setDrills(prev => prev.map(d => 
          d.id === drillId 
            ? { ...d, likes: d.likes + 1, likedBy: [...d.likedBy, user.uid] }
            : d
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive'
      });
    }
  };

  const handleSave = async (drillId: string) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to save drills',
        variant: 'destructive'
      });
      return;
    }

    try {
      const drillRef = doc(db, 'community_drills', drillId);
      const drill = drills.find(d => d.id === drillId);
      
      if (!drill) return;

      const isSaved = drill.savedBy.includes(user.uid);
      
      if (isSaved) {
        // Unsave - need to remove from both community_drills and user's saved_drills
        await updateDoc(drillRef, {
          saves: increment(-1),
          savedBy: arrayRemove(user.uid)
        });
        
        // Also remove from user's saved drills collection
        const savedDrillsQuery = query(
          collection(db, `users/${user.uid}/saved_drills`),
          where('drillId', '==', drillId)
        );
        const savedDrillsSnapshot = await getDocs(savedDrillsQuery);
        
        // Delete all matching saved drill documents (should be only one, but just in case)
        const deletePromises = savedDrillsSnapshot.docs.map(doc => 
          deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);
        
        setDrills(prev => prev.map(d => 
          d.id === drillId 
            ? { ...d, saves: d.saves - 1, savedBy: d.savedBy.filter(id => id !== user.uid) }
            : d
        ));
        
        toast({
          title: 'Removed from saved',
          description: 'Drill removed from your saved list'
        });
      } else {
        // Save
        await updateDoc(drillRef, {
          saves: increment(1),
          savedBy: arrayUnion(user.uid)
        });
        
        setDrills(prev => prev.map(d => 
          d.id === drillId 
            ? { ...d, saves: d.saves + 1, savedBy: [...d.savedBy, user.uid] }
            : d
        ));

        // Also add to user's saved drills
        await addDoc(collection(db, `users/${user.uid}/saved_drills`), {
          drillId,
          savedAt: serverTimestamp(),
          originalDrillData: drill
        });
        
        toast({
          title: 'Saved!',
          description: 'Drill added to your practice list'
        });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast({
        title: 'Error',
        description: 'Failed to save drill',
        variant: 'destructive'
      });
    }
  };

  const filteredDrills = drills.filter(drill => {
    const matchesSearch = drill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         drill.concept.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         drill.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLanguage = selectedLanguage === 'all' || drill.language === selectedLanguage;
    const matchesDifficulty = selectedDifficulty === 'all' || drill.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesLanguage && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Intermediate': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Advanced': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getLanguageColor = (language: string) => {
    const colors = {
      'python': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'javascript': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      'css': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'html': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'java': 'bg-red-500/10 text-red-600 border-red-500/20',
      'cpp': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    };
    return colors[language.toLowerCase()] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-code7x5">Community Drills</h1>
            <p className="text-muted-foreground mt-2 font-gontserrat">
              Discover and share coding challenges with the community
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/drills">
              <Button variant="outline">
                <User className="mr-2 h-4 w-4" />
                My Practice
              </Button>
            </Link>
            <Link href="/drills/create">
              <Button>
                <Code className="mr-2 h-4 w-4" />
                Share Your Drill
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search drills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="mostLiked">Most Liked</SelectItem>
                </SelectContent>
              </Select>

              {/* Language Filter */}
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                </SelectContent>
              </Select>

              {/* Difficulty Filter */}
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Drill Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDrills.map((drill) => (
            <Card key={drill.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{drill.title}</CardTitle>
                    <CardDescription className="mt-1">{drill.concept}</CardDescription>
                  </div>
                </div>
                
                {/* Author */}
                <div className="flex items-center gap-2 mt-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={drill.authorAvatar} alt={drill.authorName} />
                    <AvatarFallback className="text-xs">
                      {drill.authorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{drill.authorName}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {drill.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 pb-3">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {drill.description}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className={getDifficultyColor(drill.difficulty)}>
                    {drill.difficulty}
                  </Badge>
                  <Badge variant="outline" className={getLanguageColor(drill.language)}>
                    {drill.language}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {drill.views}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {drill.likes}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {drill.comments}
                  </div>
                  <div className="flex items-center gap-1">
                    <Bookmark className="h-4 w-4" />
                    {drill.saves}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(drill.id)}
                      className={drill.likedBy.includes(user?.uid || '') ? 'text-red-500' : ''}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${drill.likedBy.includes(user?.uid || '') ? 'fill-current' : ''}`} />
                      {drill.likes}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(drill.id)}
                      className={drill.savedBy.includes(user?.uid || '') ? 'text-blue-500' : ''}
                    >
                      <BookmarkPlus className={`h-4 w-4 mr-1 ${drill.savedBy.includes(user?.uid || '') ? 'fill-current' : ''}`} />
                      Save
                    </Button>
                  </div>

                  <Link href={`/drills/${drill.id}`}>
                    <Button size="sm">
                      Practice
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDrills.length === 0 && (
          <div className="text-center py-12">
            <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 font-code7x5">No drills found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedLanguage !== 'all' || selectedDifficulty !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Be the first to share a drill with the community!'}
            </p>
            <Link href="/drills/create">
              <Button>
                <Code className="mr-2 h-4 w-4" />
                Create First Drill
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}