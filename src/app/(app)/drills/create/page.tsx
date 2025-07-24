'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, FileText, Code, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ContentBlock = {
  id: number;
  type: 'theory' | 'code' | 'mcq';
  value: string;
};

export default function CreateDrillPage() {
  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const { toast } = useToast();

  const addContentBlock = (type: 'theory' | 'code' | 'mcq') => {
    setContentBlocks([...contentBlocks, { id: Date.now(), type, value: '' }]);
  };

  const removeContentBlock = (id: number) => {
    setContentBlocks(contentBlocks.filter(block => block.id !== id));
  };
  
  const handleContentChange = (id: number, value: string) => {
      setContentBlocks(contentBlocks.map(block => block.id === id ? {...block, value} : block));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to a server
    console.log({ title, concept, difficulty, contentBlocks });
    toast({
        title: 'Drill Created!',
        description: 'Your new drill has been saved successfully.',
    });
  };

  return (
    <div className="min-h-screen">
      <header className="p-6 border-b">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold font-headline">Create a Custom Drill</h1>
          <p className="text-muted-foreground">Design your own machine learning exercises.</p>
        </div>
      </header>
      <main className="p-6 container mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Drill Details</CardTitle>
              <CardDescription>Start with the basic information for your drill.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Drill Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Python Basics for ML" />
                </div>
                 <div>
                  <Label htmlFor="concept">ML Concept</Label>
                  <Input id="concept" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="e.g., Data Preprocessing" />
                </div>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select onValueChange={setDifficulty} value={difficulty}>
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select a difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Content Blocks</CardTitle>
              <CardDescription>Add theory, code challenges, and multiple-choice questions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {contentBlocks.map(block => (
                   <div key={block.id} className="p-4 border rounded-lg relative">
                      <Label className="capitalize font-semibold">{block.type} Block</Label>
                      <Textarea 
                        value={block.value}
                        onChange={(e) => handleContentChange(block.id, e.target.value)}
                        placeholder={`Enter ${block.type} content here...`}
                        rows={block.type === 'code' ? 6 : 3}
                        className="mt-2 font-code"
                      />
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeContentBlock(block.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                   </div>
               ))}
               <div className="flex gap-2 justify-center pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => addContentBlock('theory')}><FileText className="mr-2 h-4 w-4"/>Add Theory</Button>
                    <Button type="button" variant="outline" onClick={() => addContentBlock('code')}><Code className="mr-2 h-4 w-4"/>Add Code</Button>
                    <Button type="button" variant="outline" onClick={() => addContentBlock('mcq')}><CheckSquare className="mr-2 h-4 w-4"/>Add MCQ</Button>
               </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg"><PlusCircle className="mr-2 h-4 w-4"/>Create Drill</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
