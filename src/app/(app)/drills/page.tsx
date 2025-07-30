"use client";

import React from 'react';
import Link from 'next/link';
import { PlusCircle, History, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db, auth } from '@/lib/firebase/client';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LoaderCircle } from 'lucide-react';
import { ApiKeyStatus } from '@/components/ApiKeyStatus';
import { 
  EnhancedDrill, 
  loadPersonalDrills, 
  loadSavedDrills, 
  removeSavedDrill,
  loadDrillsWithErrorHandling,
  classifyDrillError,
  retryWithBackoff,
  hasGlobalFailure,
  getDisplayErrorMessage,
  DrillError,
  performanceMonitor
} from '@/lib/drills';
import { DrillSection, createErrorState } from '@/components/DrillSection';
import { DrillCard, BasicDrillCard } from '@/components/DrillCard';
import { getEmptyStateConfig } from '@/components/DrillEmptyStates';
import { StatsCards } from '@/components/StatsCards';
import { useToast } from '@/hooks/use-toast';
import { GlobalErrorState, AuthErrorState, NetworkErrorState } from '@/components/GlobalErrorState';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
  // Enhanced state for parallel loading
  const [personalDrills, setPersonalDrills] = useState<EnhancedDrill[]>([]);
  const [savedDrills, setSavedDrills] = useState<EnhancedDrill[]>([]);
  const [reviewDrills, setReviewDrills] = useState<Drill[]>([]);
  
  // Separate loading states for each data source
  const [loading, setLoading] = useState({
    personal: true,
    saved: true,
    review: true
  });
  
  // Enhanced error states with classification
  const [errors, setErrors] = useState({
    personal: null as DrillError | null,
    saved: null as DrillError | null,
    review: null as string | null
  });
  
  // Global error state for complete failures
  const [globalError, setGlobalError] = useState<DrillError | null>(null);
  
  const [user] = useAuthState(auth);
  const { toast } = useToast();

  // Keyboard navigation support
  const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
    // Skip if user is typing in an input field
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Navigate between sections with arrow keys
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const sections = ['review-queue-heading', 'drill-section-heading-personal', 'drill-section-heading-saved'];
      const currentFocus = document.activeElement;
      
      if (currentFocus) {
        const currentIndex = sections.findIndex(id => 
          document.getElementById(id) === currentFocus || 
          document.getElementById(id)?.contains(currentFocus)
        );
        
        if (currentIndex !== -1) {
          event.preventDefault();
          const nextIndex = event.key === 'ArrowDown' 
            ? (currentIndex + 1) % sections.length
            : (currentIndex - 1 + sections.length) % sections.length;
          
          const nextSection = document.getElementById(sections[nextIndex]);
          if (nextSection) {
            nextSection.focus();
          }
        }
      }
    }

    // Quick access shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case '1':
          event.preventDefault();
          document.getElementById('drill-section-heading-personal')?.focus();
          break;
        case '2':
          event.preventDefault();
          document.getElementById('drill-section-heading-saved')?.focus();
          break;
        case 'n':
          event.preventDefault();
          window.location.href = '/drills/create';
          break;
        case 'b':
          event.preventDefault();
          window.location.href = '/community';
          break;
      }
    }
  }, []);

  // Add keyboard event listener
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Cleanup effect for cache management
  React.useEffect(() => {
    return () => {
      // Optional: Clear cache on unmount for memory management
      // Uncomment if memory usage becomes an issue
      // cacheManager.clearAll();
    };
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      if (!user) {
        setLoading({ personal: false, saved: false, review: false });
        return;
      }
      
      console.log('Loading drills for user:', user.uid);

      // Load review drills (existing functionality)
      loadReviewDrills();
      
      // Load personal and saved drills in parallel
      await loadPersonalAndSavedDrills();
    };

    const loadReviewDrills = async () => {
      try {
        setLoading(prev => ({ ...prev, review: true }));
        setErrors(prev => ({ ...prev, review: null }));

        const historyCollection = collection(db, `users/${user!.uid}/drill_history`);
        const reviewQuery = query(historyCollection, where('nextReviewDate', '<=', new Date()));
        const historySnapshot = await getDocs(reviewQuery);
        const reviewDrillIds = historySnapshot.docs.map(doc => doc.data().drillId);

        let drillsToReview: Drill[] = [];
        if (reviewDrillIds.length > 0) {
          const drillsCollectionRef = collection(db, 'drills');
          const reviewDrillsQuery = query(drillsCollectionRef, where('__name__', 'in', reviewDrillIds));
          const reviewDrillsSnapshot = await getDocs(reviewDrillsQuery);
          drillsToReview = reviewDrillsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Drill));
        }
        
        setReviewDrills(drillsToReview);
        console.log('Review drills loaded:', drillsToReview.length);
      } catch (error) {
        console.error('Error loading review drills:', error);
        setErrors(prev => ({ ...prev, review: 'Failed to load review drills' }));
      } finally {
        setLoading(prev => ({ ...prev, review: false }));
      }
    };

    const loadPersonalAndSavedDrills = async () => {
      try {
        // Reset global error state
        setGlobalError(null);
        
        // Set loading states
        setLoading(prev => ({ ...prev, personal: true, saved: true }));
        setErrors(prev => ({ ...prev, personal: null, saved: null }));
        
        // Use enhanced error handling function with performance monitoring
        const result = await performanceMonitor.measureQuery(
          'loadDrillsWithErrorHandling',
          () => loadDrillsWithErrorHandling(user!.uid)
        );
        
        // Update state with results
        setPersonalDrills(result.personalDrills);
        setSavedDrills(result.savedDrills);
        setErrors(prev => ({ ...prev, ...result.errors }));
        
        // Check for global failure
        if (hasGlobalFailure(result.errors)) {
          // If both sources failed, show global error
          const primaryError = result.errors.personal || result.errors.saved;
          if (primaryError) {
            setGlobalError(primaryError);
          }
        }
        
        console.log('Personal drills loaded:', result.personalDrills.length);
        console.log('Saved drills loaded:', result.savedDrills.length);
        
        // Log cache statistics
        performanceMonitor.logCacheStats();
        
      } catch (error) {
        console.error('Critical error loading drills:', error);
        const classifiedError = classifyDrillError(error);
        setGlobalError(classifiedError);
      } finally {
        setLoading(prev => ({ ...prev, personal: false, saved: false }));
      }
    };

    loadAllData();
  }, [user]);

  // Enhanced retry mechanisms with exponential backoff
  const retryPersonalDrills = async () => {
    if (!user) return;
    
    try {
      setLoading(prev => ({ ...prev, personal: true }));
      setErrors(prev => ({ ...prev, personal: null }));
      setGlobalError(null);
      
      const drills = await retryWithBackoff(() => loadPersonalDrills(user.uid));
      setPersonalDrills(drills);
      console.log('Personal drills retried and loaded:', drills.length);
      
      // Show success toast
      toast({
        title: "Personal drills loaded",
        description: `Successfully loaded ${drills.length} personal drills.`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error retrying personal drills:', error);
      const classifiedError = classifyDrillError(error);
      setErrors(prev => ({ ...prev, personal: classifiedError }));
      
      // Show error toast
      toast({
        title: "Failed to load personal drills",
        description: getDisplayErrorMessage(classifiedError),
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, personal: false }));
    }
  };

  const retrySavedDrills = async () => {
    if (!user) return;
    
    try {
      setLoading(prev => ({ ...prev, saved: true }));
      setErrors(prev => ({ ...prev, saved: null }));
      setGlobalError(null);
      
      const drills = await retryWithBackoff(() => loadSavedDrills(user.uid));
      setSavedDrills(drills);
      console.log('Saved drills retried and loaded:', drills.length);
      
      // Show success toast
      toast({
        title: "Saved drills loaded",
        description: `Successfully loaded ${drills.length} saved drills.`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error retrying saved drills:', error);
      const classifiedError = classifyDrillError(error);
      setErrors(prev => ({ ...prev, saved: classifiedError }));
      
      // Show error toast
      toast({
        title: "Failed to load saved drills",
        description: getDisplayErrorMessage(classifiedError),
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, saved: false }));
    }
  };

  // Global retry function
  const retryAllDrills = async () => {
    if (!user) return;
    
    setGlobalError(null);
    
    // Recreate the loadPersonalAndSavedDrills function inline
    try {
      // Reset global error state
      setGlobalError(null);
      
      // Set loading states
      setLoading(prev => ({ ...prev, personal: true, saved: true }));
      setErrors(prev => ({ ...prev, personal: null, saved: null }));
      
      // Use enhanced error handling function with performance monitoring
      const result = await performanceMonitor.measureQuery(
        'loadDrillsWithErrorHandling',
        () => loadDrillsWithErrorHandling(user.uid)
      );
      
      // Update state with results
      setPersonalDrills(result.personalDrills);
      setSavedDrills(result.savedDrills);
      setErrors(prev => ({ ...prev, ...result.errors }));
      
      // Check for global failure
      if (hasGlobalFailure(result.errors)) {
        // If both sources failed, show global error
        const primaryError = result.errors.personal || result.errors.saved;
        if (primaryError) {
          setGlobalError(primaryError);
        }
      }
      
      console.log('Personal drills retried and loaded:', result.personalDrills.length);
      console.log('Saved drills retried and loaded:', result.savedDrills.length);
      
      // Log cache statistics
      performanceMonitor.logCacheStats();
      
    } catch (error) {
      console.error('Critical error retrying drills:', error);
      const classifiedError = classifyDrillError(error);
      setGlobalError(classifiedError);
    } finally {
      setLoading(prev => ({ ...prev, personal: false, saved: false }));
    }
  };

  const retryReviewDrills = async () => {
    if (!user) return;
    
    try {
      setLoading(prev => ({ ...prev, review: true }));
      setErrors(prev => ({ ...prev, review: null }));

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
      }
      
      setReviewDrills(drillsToReview);
      console.log('Review drills retried and loaded:', drillsToReview.length);
    } catch (error) {
      console.error('Error retrying review drills:', error);
      setErrors(prev => ({ ...prev, review: 'Failed to load review drills' }));
    } finally {
      setLoading(prev => ({ ...prev, review: false }));
    }
  };

  // Handle removing saved drill with optimistic UI updates and error rollback
  const handleRemoveSavedDrill = async (drillId: string) => {
    if (!user) return;
    
    // Find the drill being removed for the toast message
    const drillToRemove = savedDrills.find(drill => drill.id === drillId);
    const drillTitle = drillToRemove?.title || 'Drill';
    
    try {
      // Optimistic update - remove from UI immediately
      setSavedDrills(prev => prev.filter(drill => drill.id !== drillId));
      
      // Remove from database
      await removeSavedDrill(user.uid, drillId);
      
      console.log('Drill removed from saved:', drillId);
      
      // Show success confirmation toast
      toast({
        title: "Drill removed",
        description: `"${drillTitle}" has been removed from your saved drills.`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error removing saved drill:', error);
      
      // Show error toast
      toast({
        title: "Failed to remove drill",
        description: `Could not remove "${drillTitle}" from your saved drills. Please try again.`,
        variant: "destructive"
      });
      
      // Revert optimistic update on error
      try {
        const drills = await loadSavedDrills(user.uid);
        setSavedDrills(drills);
      } catch (reloadError) {
        console.error('Error reloading saved drills after failed removal:', reloadError);
        const classifiedError = classifyDrillError(reloadError);
        setErrors(prev => ({ ...prev, saved: classifiedError }));
      }
    }
  };

  // Show global loading only if all sections are loading initially
  const isInitialLoading = loading.personal && loading.saved && loading.review;
  
  // Handle authentication state
  if (isInitialLoading && !user) {
    return <div className="flex justify-center items-center h-screen"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }

  // Handle global error state
  if (globalError && !loading.personal && !loading.saved) {
    if (globalError.type === 'permission') {
      return <AuthErrorState onRetry={retryAllDrills} />;
    }
    if (globalError.type === 'network') {
      return <NetworkErrorState onRetry={retryAllDrills} />;
    }
    return (
      <GlobalErrorState
        title="Unable to load practice drills"
        message={getDisplayErrorMessage(globalError)}
        onRetry={globalError.retryable ? retryAllDrills : undefined}
      />
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Critical error in DrillsPage:', error, errorInfo);
        const classifiedError = classifyDrillError(error);
        setGlobalError(classifiedError);
      }}
      resetKeys={[user?.uid]}
      resetOnPropsChange={true}
    >
      <div className="min-h-screen">
        {/* Skip Navigation Link */}
        <a 
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
        
        {/* Keyboard Shortcuts Help */}
        <div 
          className="sr-only"
          role="region"
          aria-label="Keyboard shortcuts"
        >
          <p>Keyboard shortcuts: Ctrl+1 for My Drills, Ctrl+2 for Saved Drills, Ctrl+N for New Drill, Ctrl+B for Browse Community</p>
        </div>

        <header 
          className="p-4 sm:p-6 border-b border-border/50"
          role="banner"
        >
          <div className="container-responsive flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 
                className="text-3xl font-bold font-code7x5"
                id="page-title"
              >
                Practice Drills
              </h1>
              <p 
                className="text-muted-foreground mt-1 font-gontserrat"
                id="page-description"
              >
                Your personalized practice hub
              </p>
            </div>
            <nav 
              className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto"
              role="navigation"
              aria-label="Main navigation"
            >
              <Link href="/community" className="w-full sm:w-auto">
                <Button 
                  variant="outline"
                  className="w-full sm:w-auto"
                  aria-label="Browse community drills to discover new content"
                >
                  <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                  Browse Community
                </Button>
              </Link>
              <Link href="/drills/create" className="w-full sm:w-auto">
                <Button
                  className="w-full sm:w-auto"
                  aria-label="Create a new custom drill"
                >
                  <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  Create Custom Drill
                </Button>
              </Link>
            </nav>
          </div>
        </header>
        <main 
          id="main-content"
          className="p-4 sm:p-6 container-responsive"
          role="main"
          aria-labelledby="page-title"
          aria-describedby="page-description"
        >
          {/* Live region for screen reader announcements */}
          <div 
            aria-live="polite" 
            aria-atomic="false"
            className="sr-only"
            id="status-announcements"
          >
            {loading.personal && "Loading personal drills..."}
            {loading.saved && "Loading saved drills..."}
            {loading.review && "Loading review drills..."}
            {errors.personal && `Error loading personal drills: ${getDisplayErrorMessage(errors.personal)}`}
            {errors.saved && `Error loading saved drills: ${getDisplayErrorMessage(errors.saved)}`}
            {errors.review && `Error loading review drills: ${errors.review}`}
          </div>

          {/* API Key Status */}
          <div className="mb-6">
            <ApiKeyStatus showDetails={false} />
          </div>
          
          {/* Stats Cards */}
          <StatsCards
            personalCount={personalDrills.length}
            savedCount={savedDrills.length}
            totalCount={personalDrills.length + savedDrills.length}
            loading={{
              personal: loading.personal,
              saved: loading.saved
            }}
          />
          
          {/* Review Queue Section */}
          {(reviewDrills.length > 0 || loading.review || errors.review) && (
            <section 
              className="mb-12"
              role="region"
              aria-labelledby="review-queue-heading"
            >
              <h2 
                id="review-queue-heading"
                className="text-2xl font-bold font-code7x5 mb-4 flex items-center text-primary"
              >
                <History 
                  className="mr-3 h-6 w-6" 
                  aria-hidden="true"
                />
                Review Queue
                {loading.review && (
                  <LoaderCircle 
                    className="ml-2 h-4 w-4 animate-spin" 
                    aria-label="Loading review drills"
                  />
                )}
              </h2>
              <DrillSection
                title=""
                drills={reviewDrills.map(drill => ({ ...drill, source: 'personal' as const }))}
                loading={loading.review}
                error={errors.review}
                emptyState={getEmptyStateConfig('review')}
                onRetry={retryReviewDrills}
                enableErrorBoundary={false}
                sectionId="review"
              >
                {(drill) => <BasicDrillCard drill={drill} isReview />}
              </DrillSection>
            </section>
          )}

          {/* Personal Drills Section */}
          <DrillSection
            title="My Drills"
            drills={personalDrills}
            loading={loading.personal}
            error={errors.personal ? createErrorState(
              getDisplayErrorMessage(errors.personal),
              errors.personal.type as any,
              errors.personal.retryable
            ) : null}
            emptyState={getEmptyStateConfig('personal')}
            onRetry={retryPersonalDrills}
            enableErrorBoundary={true}
            sectionId="personal"
          >
            {(drill) => <DrillCard drill={drill} />}
          </DrillSection>

          {/* Saved Community Drills Section */}
          <DrillSection
            title="Saved from Community"
            drills={savedDrills}
            loading={loading.saved}
            error={errors.saved ? createErrorState(
              getDisplayErrorMessage(errors.saved),
              errors.saved.type as any,
              errors.saved.retryable
            ) : null}
            emptyState={getEmptyStateConfig('saved')}
            onRetry={retrySavedDrills}
            enableErrorBoundary={true}
            sectionId="saved"
          >
            {(drill) => <DrillCard drill={drill} onRemoveSaved={handleRemoveSavedDrill} />}
          </DrillSection>
        </main>
      </div>
    </ErrorBoundary>
  );
}


