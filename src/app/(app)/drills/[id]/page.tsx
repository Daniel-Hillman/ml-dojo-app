"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AIAssistant } from '@/components/AIAssistant';
import { Lightbulb, LoaderCircle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Drill, DrillContent } from '../page';
import { db, auth } from '@/lib/firebase/client';
import { doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { notFound } from 'next/navigation';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';
import { calculateNextReviewDate } from '@/lib/srs';
import { generateDynamicDrill } from '@/ai/flows/generate-dynamic-drill';
import { useAuthState } from 'react-firebase-hooks/auth';

type WorkoutMode = 'Crawl' | 'Walk' | 'Run';

export default function DrillPage({ params }: { params: { id: string } }) {
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
          setLoading(false);
          return;
      }
      const drillDoc = doc(db, 'drills', params.id);
      const drillSnapshot = await getDoc(drillDoc);

      if (drillSnapshot.exists()) {
        const drillData = { id: drillSnapshot.id, ...drillSnapshot.data() } as Drill;
        setOriginalDrill(drillData);
        setDisplayDrill(drillData);
      } else {
        notFound();
      }
      setLoading(false);
    };

    fetchDrill();
  }, [params.id, user, authLoading]);

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
    const generateNewDrill = async () => {
        if(originalDrill){
            setIsGenerating(true);
            // This is a placeholder for the actual dynamic drill generation
            // In a real implementation, you would call your AI flow here
            // For now, we'll just simulate a delay
            setTimeout(() => {
                setDisplayDrill(originalDrill);
                setIsGenerating(false);
            }, 500);
        }
    }
    generateNewDrill();
  }, [workoutMode, originalDrill]);

  const debouncedCodeValidation = useCallback(debounce((contentIndex: number, blankIndex: number, value: string, correctAnswer: string) => {
    if (value.trim() === correctAnswer.trim()) {
        setCodeFeedback(prev => ({ ...prev, [`${contentIndex}-${blankIndex}`]: 'correct' }));
    } else {
        setCodeFeedback(prev => ({ ...prev, [`${contentIndex}-${blankIndex}`]: 'incorrect' }));
    }
  }, 500), []);


  if (loading || authLoading) {
    return <div>Loading...</div>;
  }

  if (!displayDrill) {
    return <div>Drill not found or you do not have permission to view it.</div>;
  }

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
        const solution = content.solution;
        for (let i = 0; i < (content.blanks || 0); i++) {
          const userAnswer = userAnswers[`${contentIndex}-${i}`] || '';
          const correctAnswer = solution[i];
          if (userAnswer.trim() !== correctAnswer.trim()) {
            isCorrect = false;
            break;
          }
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
          <div className="bg-gray-800 text-white rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre>
              <code>
                {content.value.split('____').map((part, i) => {
                  const feedbackKey = `${contentIndex}-${i}`;
                  const feedback = codeFeedback[feedbackKey];
                  return (
                  <span key={i} className="relative inline-flex items-center">
                    {part}
                    {i < (content.blanks || 0) && (
                      <div className="inline-block w-48 mx-1 relative">
                        <CodeMirror
                          value={userAnswers[`${contentIndex}-${i}`] || ''}
                          height="30px"
                          extensions={[python()]}
                          theme={vscodeDark}
                          onChange={(value) => handleInputChange(contentIndex, i, value, content.solution?.[i] || '')}
                          onFocus={() => setStuckOn(`${contentIndex}-${i}`)}
                          onBlur={() => setStuckOn(null)}
                          className="w-full"
                        />
                         {feedback === 'correct' && <CheckCircle className="absolute top-1/2 right-2 transform -translate-y-1/2 h-4 w-4 text-green-400" />}
                         {feedback === 'incorrect' && <XCircle className="absolute top-1/2 right-2 transform -translate-y-1/2 h-4 w-4 text-red-400" />}
                      </div>
                    )}
                  </span>
                )})}
              </code>
            </pre>
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
    .join('

') || "";

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
              {(['Crawl', 'Walk', 'Run'] as WorkoutMode[]).map(mode => (
                <Button 
                  key={mode} 
                  variant={workoutMode === mode ? 'default' : 'ghost'}
                  onClick={() => setWorkoutMode(mode)}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating && workoutMode === mode ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {mode}
                </Button>
              ))}
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
