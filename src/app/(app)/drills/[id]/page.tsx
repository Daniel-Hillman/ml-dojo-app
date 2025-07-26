"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AIAssistant } from '@/components/AIAssistant';
import { Lightbulb, LoaderCircle, CheckCircle, XCircle, Baby, User, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Drill, DrillContent } from '../page';
import { db, auth } from '@/lib/firebase/client';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { notFound } from 'next/navigation';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';
import { calculateNextReviewDate } from '@/lib/srs';
import { generateDynamicDrill } from '@/lib/actions';
import { useAuthState } from 'react-firebase-hooks/auth';

type WorkoutMode = 'Crawl' | 'Walk' | 'Run';

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
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'success' | 'error' | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [stuckOn, setStuckOn] = useState<string | null>(null);
  const [proactiveHint, setProactiveHint] = useState<string | null>(null);
  const stuckTimer = useRef<NodeJS.Timeout | null>(null);
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>('Walk');
  const [isGenerating, setIsGenerating] = useState(false);

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
        
        const drillDoc = doc(db, 'drills', resolvedParams.id);
        const drillSnapshot = await getDoc(drillDoc);

        if (drillSnapshot.exists()) {
          const drillData = { id: drillSnapshot.id, ...drillSnapshot.data() } as Drill;
          console.log('Drill data fetched successfully:', drillData);
          setOriginalDrill(drillData);
          setDisplayDrill(drillData);
        } else {
          console.error('Drill not found with ID:', resolvedParams.id);
          notFound();
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
            setIsGenerating(true);
            
            try {
              console.log(`Adapting drill for ${workoutMode} mode`);
              console.log('Original drill content:', originalDrill.drill_content);
              
              // Use the server action to generate dynamic drill content
              const result = await generateDynamicDrill({
                drill: originalDrill,
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
  }, [workoutMode, originalDrill]);

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

  // Enhanced input change handler with better validation
  const handleInputChange = (contentIndex: number, blankIndex: number, value: string, correctAnswer: string) => {
    setUserAnswers(prev => ({ ...prev, [`${contentIndex}-${blankIndex}`]: value }));
    debouncedCodeValidation(contentIndex, blankIndex, value, correctAnswer);
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
        if (!content.solution) continue;
        
        // Check if the overall code validation is correct
        const overallFeedback = codeFeedback[`${contentIndex}-overall`];
        if (overallFeedback !== 'correct') {
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
        // Simple approach: always show editable code
        const initialCode = content.value;
        const currentCode = userAnswers[`${contentIndex}-code`] || initialCode;
        
        return (
          <div className="rounded-lg overflow-hidden border border-gray-700">
            <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 border-b border-gray-700 flex items-center justify-between">
              <span>💡 Edit the code directly - replace ____ with your answers</span>
              {codeFeedback[`${contentIndex}-overall`] === 'correct' && (
                <div className="flex items-center text-green-400">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Complete!
                </div>
              )}
            </div>
            <CodeMirror
              value={currentCode}
              height="auto"
              extensions={[python()]}
              theme={vscodeDark}
              editable={true}
              className="w-full"
              onChange={(value) => {
                // Store the entire code content
                setUserAnswers(prev => ({ ...prev, [`${contentIndex}-code`]: value }));
                
                // Simple validation: check if all blanks are filled
                const hasUnfilledBlanks = value.includes('____');
                const feedback = hasUnfilledBlanks ? 'partial' : 'correct';
                
                setCodeFeedback(prev => ({ 
                  ...prev, 
                  [`${contentIndex}-overall`]: feedback 
                }));
                
                // Extract individual answers for form submission
                const originalParts = content.value.split('____');
                const solutions = content.solution || [];
                
                // Simple extraction: split by the original parts
                let remainingCode = value;
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
              }}
              onFocus={() => setStuckOn(`${contentIndex}-code`)}
              onBlur={() => setStuckOn(null)}
            />
          </div>
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
                <CardTitle className="text-3xl font-headline">{displayDrill.title}</CardTitle>
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
                    case 'Crawl': return 'Easiest - More guidance with smaller blanks';
                    case 'Walk': return 'Standard - Original difficulty level';
                    case 'Run': return 'Hardest - Fewer hints, larger challenges';
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
            {isGenerating ? <div className="flex justify-center p-12"><LoaderCircle className="h-8 w-8 animate-spin" /></div> : (displayDrill.drill_content || []).map((content, i) => (
              <div key={i} className="p-6 rounded-lg bg-background/50 border">
                {renderContent(content, i)}
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
        />
      </div>
    </div>
  );
}
