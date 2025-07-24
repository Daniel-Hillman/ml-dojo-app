'use client';

import { useState, type FormEvent } from 'react';
import { Bot, Lightbulb, HelpCircle, Code, LoaderCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getHint, getClarification, getCodeCompletion } from '@/lib/actions';

type AssistantTab = 'hint' | 'clarify' | 'complete';

export default function AIAssistant({ drillContext }: { drillContext: string }) {
  const [activeTab, setActiveTab] = useState<AssistantTab>('hint');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [query, setQuery] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult('');
    
    try {
      let response;
      if (activeTab === 'hint') {
        response = await getHint({ drillContext, userQuery: query });
      } else if (activeTab === 'clarify') {
        response = await getClarification({ concept: drillContext, userQuestion: query });
      } else {
        response = await getCodeCompletion({ codeContext: query, language: 'python' });
      }
      setResult(response);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      setResult('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLabelText = () => {
    switch (activeTab) {
      case 'hint': return 'What do you need a hint for?';
      case 'clarify': return 'What concept needs clarification?';
      case 'complete': return 'Enter your code snippet to complete:';
      default: return '';
    }
  };
  
  const getButtonText = () => {
     switch (activeTab) {
      case 'hint': return 'Get Hint';
      case 'clarify': return 'Clarify Concept';
      case 'complete': return 'Complete Code';
      default: return '';
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl"
          size="icon"
        >
          <Bot className="h-8 w-8" />
          <span className="sr-only">Open AI Assistant</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-headline">
            <Sparkles className="text-accent" />
            AI Assistant
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AssistantTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hint"><Lightbulb className="mr-2 h-4 w-4" />Hint</TabsTrigger>
            <TabsTrigger value="clarify"><HelpCircle className="mr-2 h-4 w-4" />Clarify</TabsTrigger>
            <TabsTrigger value="complete"><Code className="mr-2 h-4 w-4" />Complete</TabsTrigger>
          </TabsList>
          <div className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <Label htmlFor="ai-query" className="text-md">{getLabelText()}</Label>
                  <Textarea 
                    id="ai-query" 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    placeholder="Type here..." 
                    className="mt-2"
                    rows={activeTab === 'complete' ? 6 : 3}
                  />
               </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {loading ? 'Generating...' : getButtonText()}
              </Button>
            </form>
            {result && (
              <div className="mt-6 p-4 bg-secondary rounded-lg border">
                <h4 className="font-semibold mb-2">Assistant's Response:</h4>
                <div className="prose prose-sm max-w-none text-secondary-foreground font-code whitespace-pre-wrap">
                  {result}
                </div>
              </div>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
