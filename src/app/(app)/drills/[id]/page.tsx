"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AIAssistant } from '@/components/AIAssistant';
import { ProvenApproach } from '@/components/ProvenApproach';
import { Lightbulb, LoaderCircle, CheckCircle, XCircle, Baby, User, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Drill, DrillContent } from '../page';
import { db, auth } from '@/lib/firebase/client';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { php } from '@codemirror/lang-php';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { sql } from '@codemirror/lang-sql';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { markdown } from '@codemirror/lang-markdown';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { notFound } from 'next/navigation';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';
import { calculateNextReviewDate } from '@/lib/srs';
import { generateDynamicDrill } from '@/lib/actions';
import { useAuthState } from 'react-firebase-hooks/auth';
import { incrementDrillViews, isCommunityDrill, getCommunityDrill } from '@/lib/community';

type WorkoutMode = 'Crawl' | 'Walk' | 'Run';

// Helper function to get CodeMirror language extension
function getLanguageExtension(language: string) {
  switch (language?.toLowerCase()) {
    case 'python':
    case 'py':
      return python();
    case 'javascript':
    case 'js':
    case 'jsx':
      return javascript({ jsx: true });
    case 'typescript':
    case 'ts':
    case 'tsx':
      return javascript({ typescript: true, jsx: true });
    case 'html':
    case 'htm':
      return html();
    case 'css':
      return css();
    case 'java':
      return java();
    case 'cpp':
    case 'c++':
    case 'c':
      return cpp();
    case 'php':
      return php();
    case 'rust':
    case 'rs':
      return rust();
    case 'go':
      return go();
    case 'sql':
      return sql();
    case 'json':
      return json();
    case 'xml':
      return xml();
    case 'markdown':
    case 'md':
      return markdown();
    default:
      return python(); // Default fallback
  }
}

// Render content function for different content types
function renderContent(content: DrillContent, contentIndex: number, props: {
  onAnswerChange: (contentIndex: number, answers: Record<string, string>) => void;
  onValidationChange: (contentIndex: number, isValid: boolean) => void;
  mcqAnswers: Record<string, number>;
  mcqFeedback: Record<string, 'correct' | 'incorrect'>;
  onMcqChange: (contentIndex: number, value: string, correctAnswer: number) => void;
}) {
  switch (content.type) {
    case 'theory':
      return (
        <div className="prose prose-invert max-w-none">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-semibold mb-2 flex items-center">
              📚 Theory
            </h4>
            <p className="text-gray-300 leading-relaxed">{content.value}</p>
          </div>
        </div>
      );

    case 'code':
      return (
        <div className="space-y-4">
          <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
            <h4 className="text-green-300 font-semibold mb-3 flex items-center">
              💻 Interactive Code Challenge
            </h4>
            <ProvenApproach
              content={content}
              contentIndex={contentIndex}
              onAnswerChange={props.onAnswerChange}
              onValidationChange={props.onValidationChange}
            />
          </div>
        </div>
      );

    case 'mcq':
      return (
        <div className="space-y-4">
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
            <h4 className="text-purple-300 font-semibold mb-3 flex items-center">
              ❓ Multiple Choice Question
            </h4>
            <p className="text-gray-300 mb-4">{content.value}</p>
            <RadioGroup
              value={props.mcqAnswers[contentIndex]?.toString() || ''}
              onValueChange={(value) => props.onMcqChange(contentIndex, value, content.answer || 0)}
            >
              {(content.choices || []).map((choice, choiceIndex) => (
                <div key={choiceIndex} className="flex items-center space-x-2">
                  <RadioGroupItem value={choiceIndex.toString()} id={`choice-${contentIndex}-${choiceIndex}`} />
                  <Label 
                    htmlFor={`choice-${contentIndex}-${choiceIndex}`}
                    className="text-gray-300 cursor-pointer"
                  >
                    {choice}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {props.mcqFeedback[contentIndex] && (
              <div className={`mt-3 p-2 rounded ${
                props.mcqFeedback[contentIndex] === 'correct' 
                  ? 'bg-green-900/30 text-green-300' 
                  : 'bg-red-900/30 text-red-300'
              }`}>
                {props.mcqFeedback[contentIndex] === 'correct' ? '✅ Correct!' : '❌ Incorrect, try again!'}
              </div>
            )}
          </div>
        </div>
      );

    default:
      return <div>Unknown content type</div>;
  }
}

export default function DrillPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
  const [originalDrill, setOriginalDrill] = useState<Drill | null>(null);
  const [displayDrill, setDisplayDrill] = useState<Drill | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [mcqFeedback, setMcqFeedback] = useState<Record<string, 'correct' | 'incorrect'>>({});
  const [codeFeedback, setCodeFeedback] = useState<Record<string, 'correct' | 'incorrect'>>({});
  const [codeValidation, setCodeValidation] = useState<Record<string, boolean>>({});
  const [currentUserCode, setCurrentUserCode] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'success' | 'error' | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [stuckOn, setStuckOn] = useState<string | null>(null);
  const [proactiveHint, setProactiveHint] = useState<string | null>(null);
  const stuckTimer = useRef<NodeJS.Timeout | null>(null);
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>('Walk');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCommunityDrillState, setIsCommunityDrillState] = useState(false);
  const [communityDrillData, setCommunityDrillData] = useState<any>(null);
  const [isSavedDrill, setIsSavedDrill] = useState(false);

  useEffect(() => {
    if (authLoading) return; 
    setStartTime(new Date());
    const fetchDrill = async () => {
      if (!user) {
          console.log('No user authenticated, skipping drill fetch');
          setLoading(false);
          return;
      }
      
      try {
        console.log('Fetching drill with ID:', resolvedParams.id);
        console.log('User authenticated:', user.uid);
        
        // First try to get from personal drills
        const drillDoc = doc(db, 'drills', resolvedParams.id);
        const drillSnapshot = await getDoc(drillDoc);

        if (drillSnapshot.exists()) {
          const drillData = { id: drillSnapshot.id, ...drillSnapshot.data() } as Drill;
          console.log('Personal drill data fetched successfully:', drillData);
          setOriginalDrill(drillData);
          setDisplayDrill(drillData);
          setIsCommunityDrillState(false);
        } else {
          // Check if this is a saved community drill first
          const savedDrillsQuery = query(
            collection(db, `users/${user.uid}/saved_drills`),
            where('drillId', '==', resolvedParams.id)
          );
          const savedDrillsSnapshot = await getDocs(savedDrillsQuery);
          
          if (!savedDrillsSnapshot.empty) {
            // This is a saved community drill - use the exact saved content
            const savedDrillDoc = savedDrillsSnapshot.docs[0];
            const savedDrillData = savedDrillDoc.data();
            
            console.log('Found saved community drill:', savedDrillData);
            
            // Use the original drill data that was saved
            const drillData = {
              id: savedDrillData.drillId,
              title: savedDrillData.originalDrillData.title,
              concept: savedDrillData.originalDrillData.concept,
              difficulty: savedDrillData.originalDrillData.difficulty,
              description: savedDrillData.originalDrillData.description,
              drill_content: savedDrillData.originalDrillData.content,
              userId: savedDrillData.originalDrillData.authorId,
              createdAt: savedDrillData.originalDrillData.createdAt?.toDate?.() || savedDrillData.originalDrillData.createdAt
            } as Drill;
            
            console.log('Saved community drill data loaded:', drillData);
            setOriginalDrill(drillData);
            setDisplayDrill(drillData);
            setIsCommunityDrillState(true);
            setIsSavedDrill(true); // Mark as saved drill
            setCommunityDrillData({
              ...savedDrillData.originalDrillData,
              id: savedDrillData.drillId
            });
            
            // Don't increment view count for saved drills to avoid inflating numbers
          } else {
            // Try to get from community drills (direct access)
            const communityDrill = await getCommunityDrill(resolvedParams.id);
            
            if (communityDrill) {
              // Convert community drill format to regular drill format
              const drillData = {
                id: communityDrill.id,
                title: communityDrill.title,
                concept: communityDrill.concept,
                difficulty: communityDrill.difficulty,
                description: communityDrill.description,
                drill_content: communityDrill.content,
                userId: communityDrill.authorId,
                createdAt: communityDrill.createdAt
              } as Drill;
              
              console.log('Community drill data fetched successfully:', drillData);
              setOriginalDrill(drillData);
              setDisplayDrill(drillData);
              setIsCommunityDrillState(true);
              setCommunityDrillData(communityDrill);
              
              // Increment view count for community drills (not saved ones)
              await incrementDrillViews(resolvedParams.id);
            } else {
              console.error('Drill not found with ID:', resolvedParams.id);
              notFound();
            }
          }
        }
      } catch (error) {
        console.error('Error fetching drill:', error);
        toast({
          title: 'Error Loading Drill',
          description: 'Failed to load the drill. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDrill();
  }, [resolvedParams.id, user, authLoading]);

  useEffect(() => {
    if (stuckTimer.current) {
      clearTimeout(stuckTimer.current);
    }
    if (stuckOn) {
      stuckTimer.current = setTimeout(() => {
        setProactiveHint(`It looks like you're pondering on blank ${stuckOn}. The goal here is to... Would you like a hint?`);
      }, 60000);
    }
    return () => {
      if (stuckTimer.current) {
        clearTimeout(stuckTimer.current);
      }
    };
  }, [stuckOn]);
  
  useEffect(() => {
    const adaptDrillForWorkoutMode = async () => {
        if(originalDrill){
            // Skip dynamic generation for saved community drills
            // Users should get the exact drill they saved
            if (isSavedDrill) {
              console.log('Skipping dynamic generation for saved community drill');
              setDisplayDrill(originalDrill);
              return;
            }
            
            setIsGenerating(true);
            
            try {
              console.log(`Adapting drill for ${workoutMode} mode`);
              console.log('Original drill content:', originalDrill.drill_content);
              
              // Use the server action to generate dynamic drill content
              // Serialize the drill object to avoid Firestore timestamp issues
              const serializedDrill = {
                ...originalDrill,
                createdAt: originalDrill.createdAt?.toDate?.() || originalDrill.createdAt
              };
              
              const result = await generateDynamicDrill({
                drill: serializedDrill,
                workoutMode: workoutMode
              });
              
              console.log(`${workoutMode} mode result:`, result.drillContent);
              
              // Create adapted drill with new content
              const adaptedDrill = {
                ...originalDrill,
                drill_content: result.drillContent
              };
              
              setDisplayDrill(adaptedDrill);
              
              // Reset user answers and feedback when drill content changes
              setUserAnswers({});
              setMcqAnswers({});
              setMcqFeedback({});
              setCodeFeedback({});
              setCodeValidation({});
              setValidationResult(null);
              setAttempts(0); // Reset attempts counter for new mode
            } catch (error) {
              console.error('Error adapting drill for workout mode:', error);
              // Fallback to original drill if adaptation fails
              setDisplayDrill(originalDrill);
              toast({
                title: 'Mode Generation Failed',
                description: `Could not generate ${workoutMode} mode content. Using original drill instead.`,
                variant: 'destructive',
              });
            } finally {
              setIsGenerating(false);
            }
        }
    }
    adaptDrillForWorkoutMode();
  }, [workoutMode, originalDrill, isSavedDrill]);

  const debouncedCodeValidation = useCallback(debounce((contentIndex: number, blankIndex: number, value: string, correctAnswer: string) => {
    if (value.trim() === '') {
      // Remove feedback for empty values
      setCodeFeedback(prev => {
        const newFeedback = { ...prev };
        delete newFeedback[`${contentIndex}-${blankIndex}`];
        return newFeedback;
      });
    } else if (value.trim() === correctAnswer.trim()) {
      setCodeFeedback(prev => ({ ...prev, [`${contentIndex}-${blankIndex}`]: 'correct' }));
    } else {
      setCodeFeedback(prev => ({ ...prev, [`${contentIndex}-${blankIndex}`]: 'incorrect' }));
    }
  }, 500), []);

  // Function to validate code answers by extracting from the full code
  const validateCodeAnswers = useCallback((contentIndex: number, userCode: string, originalCode: string, solutions: string[]) => {
    // Simple validation: just check if blanks are filled
    const hasUnfilledBlanks = userCode.includes('____');
    const feedback = hasUnfilledBlanks ? 'partial' : 'correct';
    
    setCodeFeedback(prev => ({ 
      ...prev, 
      [`${contentIndex}-overall`]: feedback 
    }));
    
    // Extract individual answers for form submission
    const originalParts = originalCode.split('____');
    let remainingCode = userCode;
    
    for (let i = 0; i < originalParts.length - 1; i++) {
      const beforePart = originalParts[i];
      const afterPart = originalParts[i + 1] || '';
      
      // Remove the before part
      if (beforePart) {
        const beforeIndex = remainingCode.indexOf(beforePart);
        if (beforeIndex !== -1) {
          remainingCode = remainingCode.substring(beforeIndex + beforePart.length);
        }
      }
      
      // Extract the answer
      let answer = '';
      if (afterPart.trim() === '') {
        answer = remainingCode.trim();
      } else {
        const afterIndex = remainingCode.indexOf(afterPart);
        if (afterIndex !== -1) {
          answer = remainingCode.substring(0, afterIndex).trim();
          remainingCode = remainingCode.substring(afterIndex);
        }
      }
      
      // Store the extracted answer
      setUserAnswers(prev => ({ 
        ...prev, 
        [`${contentIndex}-${i}`]: answer 
      }));
    }
  }, []);

  // Debounced version of code validation for the full editor
  const debouncedFullCodeValidation = useCallback(debounce((contentIndex: number, userCode: string, originalCode: string, solutions: string[]) => {
    validateCodeAnswers(contentIndex, userCode, originalCode, solutions);
  }, 800), [validateCodeAnswers]);


  if (loading || authLoading) {
    return <div>Loading...</div>;
  }

  if (!displayDrill) {
    return <div>Drill not found or you do not have permission to view it.</div>;
  }

  // Enhanced blank parsing function
  const parseCodeBlanks = (codeValue: string) => {
    const parts = codeValue.split('____');
    const blankCount = parts.length - 1;
    return { parts, blankCount };
  };

  // Handle code block answer changes
  const handleCodeAnswerChange = (contentIndex: number, answers: Record<string, string>) => {
    // Update user answers with the new code answers
    const updatedAnswers = { ...userAnswers };
    Object.entries(answers).forEach(([blankIndex, value]) => {
      updatedAnswers[`${contentIndex}-${blankIndex}`] = value;
    });
    setUserAnswers(updatedAnswers);
    
    // Update current user code for AI assistant
    const codeContent = displayDrill?.drill_content?.find((content, idx) => 
      idx === contentIndex && content.type === 'code'
    );
    if (codeContent) {
      // Reconstruct the code with user inputs
      const parts = codeContent.value.split('____');
      let reconstructedCode = parts[0];
      for (let i = 0; i < parts.length - 1; i++) {
        const userInput = answers[i] || '____';
        reconstructedCode += userInput + (parts[i + 1] || '');
      }
      setCurrentUserCode(reconstructedCode);
    }
  };

  // Handle code block validation changes
  const handleCodeValidationChange = (contentIndex: number, isValid: boolean) => {
    setCodeValidation(prev => ({ ...prev, [contentIndex]: isValid }));
  };



  const handleMcqChange = (contentIndex: number, value: string, correctAnswer: number) => {
    const selectedAnswer = parseInt(value);
    setMcqAnswers(prev => ({ ...prev, [contentIndex]: selectedAnswer }));
    if (selectedAnswer === correctAnswer) {
      setMcqFeedback(prev => ({ ...prev, [contentIndex]: 'correct' }));
    } else {
      setMcqFeedback(prev => ({ ...prev, [contentIndex]: 'incorrect' }));
    }
  };

  const handleSubmit = async () => {
    setIsValidating(true);
    setValidationResult(null);
    setAttempts(prev => prev + 1);

    let isCorrect = true;

    for (const [contentIndex, content] of (displayDrill.drill_content || []).entries()) {
      if (content.type === 'code') {
        // Check if the interactive code block validation is correct
        const isCodeValid = codeValidation[contentIndex];
        if (!isCodeValid) {
          isCorrect = false;
          break;
        }
      } else if (content.type === 'mcq') {
        const userAnswer = mcqAnswers[contentIndex];
        const correctAnswer = content.answer;
        if (userAnswer === undefined || userAnswer !== correctAnswer) {
          isCorrect = false;
        }
      }
      if (!isCorrect) {
        break;
      }
    }
    
    if (isCorrect) {
        setValidationResult('success');
        toast({
            title: 'Validation Successful!',
            description: 'Great job! All your answers are correct.',
        });

        if (user && startTime) {
            const historyCollection = collection(db, `users/${user.uid}/drill_history`);
            await addDoc(historyCollection, {
                drillId: displayDrill.id,
                completedAt: serverTimestamp(),
                timeToComplete: (new Date().getTime() - startTime.getTime()) / 1000,
                attempts,
                status: 'completed',
                nextReviewDate: calculateNextReviewDate(attempts)
            });
        }

    } else {
        setValidationResult('error');
        toast({
            title: 'Validation Failed',
            description: 'Some of your answers are incorrect. Keep trying!',
            variant: 'destructive',
        });
    }
    setIsValidating(false);
  };

  const renderContent = (content: DrillContent, contentIndex: number) => {
    switch (content.type) {
      case 'theory':
        return (
          <div className="prose prose-lg max-w-none">
            <p>{content.value}</p>
          </div>
        );
      case 'code':
        return (
          <ProvenApproach
            content={content}
            contentIndex={contentIndex}
            onAnswerChange={handleCodeAnswerChange}
            onValidationChange={handleCodeValidationChange}
          />
        );
      case 'mcq':
        const feedback = mcqFeedback[contentIndex];
        const isCorrect = feedback === 'correct';
        return (
          <div>
            <p className="font-semibold mb-4">{content.value}</p>
            <RadioGroup 
                onValueChange={(value) => handleMcqChange(contentIndex, value, content.answer || 0)}
                disabled={isCorrect}
            >
              {content.choices?.map((choice: string, i: number) => {
                const isSelected = mcqAnswers[contentIndex] === i;
                const showCorrect = isCorrect && isSelected;
                const showIncorrect = feedback === 'incorrect' && isSelected;
                return (
                    <div key={i} className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg border-2 transition-all",
                        showCorrect && "border-green-500 bg-green-500/10 text-green-300",
                        showIncorrect && "border-red-500 bg-red-500/10 text-red-300"
                    )}>
                        <RadioGroupItem value={String(i)} id={`mcq-${contentIndex}-${i}`} />
                        <Label htmlFor={`mcq-${contentIndex}-${i}`} className="flex-1 cursor-pointer">{choice}</Label>
                        {showCorrect && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {showIncorrect && <XCircle className="h-5 w-5 text-red-500" />}
                    </div>
                );
              })}
            </RadioGroup>
          </div>
        );
      default:
        return null;
    }
  };

  const codeContext = displayDrill.drill_content
    ?.filter((c) => c.type === 'code')
    .map((c) => c.value)
    .join('\n\n') || "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 sm:p-6 lg:p-8">
      <div className="lg:col-span-2">
        <Card className="shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-3xl font-headline">{displayDrill.title}</CardTitle>
                    {isCommunityDrillState && (
                      <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                        Community
                      </Badge>
                    )}
                  </div>
                  {isCommunityDrillState && communityDrillData && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Created by {communityDrillData.authorName}</span>
                      <span>•</span>
                      <span>{communityDrillData.views} views</span>
                      <span>•</span>
                      <span>{communityDrillData.likes} likes</span>
                    </div>
                  )}
                </div>
                <Badge 
                    variant={displayDrill.difficulty === 'Beginner' ? 'default' : displayDrill.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}
                    className="text-base"
                >
                    {displayDrill.difficulty}
                </Badge>
            </div>
            <CardDescription className="text-lg text-muted-foreground">{displayDrill.concept}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Hide workout mode selector for saved drills - users should get exact saved content */}
            {!isSavedDrill && (
              <div className="flex justify-center bg-background/30 p-2 rounded-lg space-x-2">
                {(['Crawl', 'Walk', 'Run'] as WorkoutMode[]).map(mode => {
                  const getModeIcon = (mode: WorkoutMode) => {
                    switch (mode) {
                      case 'Crawl': return <Baby className="mr-2 h-4 w-4" />;
                      case 'Walk': return <User className="mr-2 h-4 w-4" />;
                      case 'Run': return <Zap className="mr-2 h-4 w-4" />;
                    }
                  };
                  
                  const getModeTooltip = (mode: WorkoutMode) => {
                    switch (mode) {
                      case 'Crawl': return 'Beginner - Only essential concepts blanked out';
                      case 'Walk': return 'Intermediate - Fair amount of code to fill in';
                      case 'Run': return 'Expert - Most code blanked out for maximum challenge';
                    }
                  };
                  
                  return (
                    <Button 
                      key={mode} 
                      variant={workoutMode === mode ? 'default' : 'ghost'}
                      onClick={() => setWorkoutMode(mode)}
                      disabled={isGenerating}
                      className="flex-1"
                      title={getModeTooltip(mode)}
                    >
                      {isGenerating && workoutMode === mode ? 
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : 
                        getModeIcon(mode)
                      }
                      {mode}
                    </Button>
                  );
                })}
              </div>
            )}
            
            {/* Show a message for saved drills explaining they get the exact saved content */}
            {isSavedDrill && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-blue-300">
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    Saved Drill
                  </Badge>
                  <span className="text-sm">You're practicing the exact drill you saved from the community</span>
                </div>
              </div>
            )}
            {isGenerating ? <div className="flex justify-center p-12"><LoaderCircle className="h-8 w-8 animate-spin" /></div> : (displayDrill.drill_content || []).map((content, i) => (
              <div key={i} className="p-6 rounded-lg bg-background/50 border">
                {renderContent(content, i, {
                  onAnswerChange: handleCodeAnswerChange,
                  onValidationChange: handleCodeValidationChange,
                  mcqAnswers,
                  mcqFeedback,
                  onMcqChange: handleMcqChange
                })}
              </div>
            ))}
            {validationResult && (
                <Alert variant={validationResult === 'success' ? 'default' : 'destructive'} className="bg-background/80">
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>{validationResult === 'success' ? 'Success!' : 'Needs Improvement'}</AlertTitle>
                    <AlertDescription>
                        {validationResult === 'success' ? 'You have successfully completed the drill!' : 'There are some errors. Review your answers and try again.'}
                    </AlertDescription>
                </Alert>
            )}
            <div className="flex justify-end mt-8">
                <Button onClick={handleSubmit} disabled={isValidating || validationResult === 'success'} size="lg" className="text-lg">
                    {isValidating && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    {validationResult === 'success' ? 'Completed!' : isValidating ? 'Validating...' : 'Submit Answers'}
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <AIAssistant
          concept={displayDrill.concept}
          drillContext={displayDrill.description}
          codeContext={codeContext}
          proactiveHint={proactiveHint}
          drillCompleted={validationResult === 'success'}
          currentUserCode={currentUserCode}
        />
      </div>
    </div>
  );
}
