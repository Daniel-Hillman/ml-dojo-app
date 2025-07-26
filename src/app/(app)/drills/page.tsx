"use client";

import Link from 'next/link';
import { PlusCircle, ChevronRight, FileText, CheckCircle, BarChart, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db, auth } from '@/lib/firebase/client';
import { collection, getDocs, query, where, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LoaderCircle } from 'lucide-react';

export type DrillContent = {
  id: string;
  type: 'theory' | 'code' | 'mcq';
  value: string;
  language?: 'python';
  blanks?: number;
  choices?: any;
  answer?: number;
  solution?: any;
};

export type Drill = {
  id: string;
  title: string;
  concept: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  drill_content?: DrillContent[];
};

export default function DrillsPage() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [reviewDrills, setReviewDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const initialFetch = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);

      try {
        console.log('Fetching drills for user:', user.uid);

        const historyCollection = collection(db, `users/${user.uid}/drill_history`);
        const reviewQuery = query(historyCollection, where('nextReviewDate', '<=', new Date()));
        const historySnapshot = await getDocs(reviewQuery);
        const reviewDrillIds = historySnapshot.docs.map(doc => doc.data().drillId);

        let drillsToReview: Drill[] = [];
        if (reviewDrillIds.length > 0) {
          const drillsCollectionRef = collection(db, 'drills');
          const reviewDrillsQuery = query(drillsCollectionRef, where('__name__', 'in', reviewDrillIds));
          const reviewDrillsSnapshot = await getDocs(reviewDrillsQuery);
          drillsToReview = reviewDrillsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Drill));
          setReviewDrills(drillsToReview);
        }

        const drillsCollectionRef = collection(db, 'drills');
        const firstPageQuery = query(drillsCollectionRef, limit(9));
        const drillsSnapshot = await getDocs(firstPageQuery);
        
        console.log('Fetched drills count:', drillsSnapshot.docs.length);
        
        const allFirstPageDrills = drillsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Drill));
        
        const regularDrills = allFirstPageDrills.filter(drill => !reviewDrillIds.includes(drill.id));
        
        setDrills(regularDrills);
        setLastVisible(drillsSnapshot.docs[drillsSnapshot.docs.length - 1]);
        setHasMore(drillsSnapshot.docs.length === 9);
        
        console.log('Regular drills loaded:', regularDrills.length);
      } catch (error) {
        console.error('Error fetching drills:', error);
      } finally {
        setLoading(false);
      }
    };

    initialFetch();
  }, [user]);

  const fetchMoreDrills = async () => {
     if (!user || !lastVisible) return;
    
      setLoadingMore(true);
      
      const drillsCollectionRef = collection(db, 'drills');
      const nextPageQuery = query(drillsCollectionRef, startAfter(lastVisible), limit(9));
      
      const drillsSnapshot = await getDocs(nextPageQuery);
      const newDrills = drillsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Drill));

      const currentReviewIds = reviewDrills.map(d => d.id);
      const regularNewDrills = newDrills.filter(drill => !currentReviewIds.includes(drill.id));

      setDrills(prevDrills => [...prevDrills, ...regularNewDrills]);
      setLastVisible(drillsSnapshot.docs[drillsSnapshot.docs.length - 1]);
      setHasMore(drillsSnapshot.docs.length === 9);
      setLoadingMore(false);
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen">
      <header className="p-6 border-b border-border/50">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold font-headline">Practice Drills</h1>
          <Link href="/drills/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Custom Drill
            </Button>
          </Link>
        </div>
      </header>
      <main className="p-6 container mx-auto">
        {reviewDrills.length > 0 && (
            <div className="mb-12">
                <h2 className="text-2xl font-bold font-headline mb-4 flex items-center text-primary">
                    <History className="mr-3 h-6 w-6" />
                    Review Queue
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reviewDrills.map((drill) => (
                        <DrillCard key={drill.id} drill={drill} isReview />
                    ))}
                </div>
            </div>
        )}

        <h2 className="text-2xl font-bold font-headline mb-4">All Drills</h2>
        {drills.length === 0 && reviewDrills.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
                <p className="text-lg">No drills yet. Create your first one to get started!</p>
            </div>
        ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {drills.map((drill) => (
                    <DrillCard key={drill.id} drill={drill} />
                ))}
            </div>
        )}

        <div className="flex justify-center mt-8">
            {hasMore && <Button onClick={fetchMoreDrills} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Load More'}
            </Button>}
        </div>
      </main>
    </div>
  );
}

function DrillCard({ drill, isReview = false }: { drill: Drill, isReview?: boolean }) {
    return (
        <Card className="flex flex-col bg-card/50 backdrop-blur-sm border-2 border-transparent hover:border-primary/50 transition-all duration-300">
            {isReview && <div className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider text-center py-1 rounded-t-lg">Review Due</div>}
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-xl">{drill.title}</CardTitle>
                    <Badge 
                        variant={drill.difficulty === 'Beginner' ? 'default' : drill.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}
                    >
                        {drill.difficulty}
                    </Badge>
                </div>
                <CardDescription className="text-muted-foreground">{drill.concept}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-foreground/80">{drill.description}</p>
                <div className="mt-4 flex space-x-4 text-sm text-muted-foreground">
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
    )
}
