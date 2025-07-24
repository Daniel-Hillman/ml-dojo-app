'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { drills, DrillContent } from '../data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import AIAssistant from '@/components/AIAssistant';
import { Lightbulb, LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DrillPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'success' | 'error' | null>(null);

  const drill = drills.find((d) => d.id === params.id);

  if (!drill) {
    notFound();
  }

  const handleInputChange = (contentIndex: number, blankIndex: number, value: string) => {
    setUserAnswers(prev => ({ ...prev, [`${contentIndex}-${blankIndex}`]: value }));
  };

  const handleMcqChange = (contentIndex: number, value: string) => {
    setMcqAnswers(prev => ({ ...prev, [contentIndex]: parseInt(value) }));
  };

  const handleSubmit = () => {
    setIsValidating(true);
    setValidationResult(null);

    setTimeout(() => {
        // Mock validation logic
        const isCorrect = true; // Replace with actual validation
        if (isCorrect) {
            setValidationResult('success');
            toast({
                title: 'Validation Successful!',
                description: 'Great job! All your answers are correct.',
                variant: 'default',
            });
        } else {
            setValidationResult('error');
            toast({
                title: 'Validation Failed',
                description: 'Some of your answers are incorrect. Keep trying!',
                variant: 'destructive',
            });
        }
        setIsValidating(false);
    }, 1500);
  };

  const renderContent = (content: DrillContent, contentIndex: number) => {
    switch (content.type) {
      case 'theory':
        return (
          <div className="prose prose-lg max-w-none text-card-foreground/90">
            <p>{content.value}</p>
          </div>
        );
      case 'code':
        let blankCounter = 0;
        const parts = content.value.split('____');
        return (
          <div className="bg-gray-900 rounded-lg p-4 font-code text-sm text-white overflow-x-auto">
            <pre>
              <code>
                {parts.map((part, i) => (
                  <span key={i}>
                    {part}
                    {i < parts.length - 1 && (
                      <Input
                        type="text"
                        className="inline-block w-32 h-7 mx-1 font-code bg-gray-700 border-gray-600 text-white focus:ring-accent"
                        placeholder={`blank ${++blankCounter}`}
                        onChange={(e) => handleInputChange(contentIndex, i, e.target.value)}
                      />
                    )}
                  </span>
                ))}
              </code>
            </pre>
          </div>
        );
      case 'mcq':
        return (
          <div>
            <p className="font-semibold mb-4 text-card-foreground">{content.value}</p>
            <RadioGroup onValueChange={(value) => handleMcqChange(contentIndex, value)}>
              {content.choices?.map((choice, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <RadioGroupItem value={String(i)} id={`mcq-${contentIndex}-${i}`} />
                  <Label htmlFor={`mcq-${contentIndex}-${i}`} className="text-card-foreground/90">{choice}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto">
        <Card className="bg-card text-card-foreground shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="text-3xl font-bold font-headline">{drill.title}</CardTitle>
                <Badge 
                    variant={drill.difficulty === 'Beginner' ? 'default' : drill.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}
                    className={`text-sm ${
                        drill.difficulty === 'Beginner' ? 'bg-green-500' :
                        drill.difficulty === 'Intermediate' ? 'bg-yellow-500 text-black' :
                        'bg-red-500'
                    }`}
                >
                    {drill.difficulty}
                </Badge>
            </div>
            <CardDescription className="text-lg text-card-foreground/70">{drill.concept}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {drill.content.map((content, i) => (
              <div key={i} className="p-6 rounded-lg bg-background/50 border">
                {renderContent(content, i)}
              </div>
            ))}
            {validationResult && (
                <Alert variant={validationResult === 'success' ? 'default' : 'destructive'} className={validationResult === 'success' ? 'bg-green-100 dark:bg-green-900 border-green-500' : 'bg-red-100 dark:bg-red-900 border-red-500'}>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>{validationResult === 'success' ? 'Success!' : 'Needs Improvement'}</AlertTitle>
                    <AlertDescription>
                        {validationResult === 'success' ? 'You have successfully completed the drill!' : 'There are some errors. Review your answers and try again.'}
                    </AlertDescription>
                </Alert>
            )}
            <div className="flex justify-end mt-8">
                <Button onClick={handleSubmit} disabled={isValidating} size="lg">
                    {isValidating && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    {isValidating ? 'Validating...' : 'Submit Answers'}
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <AIAssistant drillContext={drill.description} />
    </div>
  );
}
