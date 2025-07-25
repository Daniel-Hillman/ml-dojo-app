"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateDrillAction } from '@/lib/actions';
import { LoaderCircle, Sparkles } from 'lucide-react';

export default function TestAiPage() {
    const { toast } = useToast();
    const [prompt, setPrompt] = useState("a beginner-level python drill about for loops");
    const [isLoading, setIsLoading] = useState(false);
    
    const [rawCreativeText, setRawCreativeText] = useState("");
    const [finalJson, setFinalJson] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleTest = async () => {
        setIsLoading(true);
        setRawCreativeText("");
        setFinalJson("");
        setErrorMessage("");

        try {
            const result = await generateDrillAction(prompt);

            if (result.error) {
                setErrorMessage(result.error);
            }
            if (result.rawCreativeText) {
                setRawCreativeText(result.rawCreativeText);
            }
            if (result.finalJson) {
                setFinalJson(JSON.stringify(result.finalJson, null, 2));
            }
            
            toast({ title: "Success!", description: "AI generation test complete." });

        } catch (error: any) {
            setErrorMessage(error.message);
            toast({
                title: "Error",
                description: "The AI generation failed.",
                variant: "destructive",
            });
        }
        setIsLoading(false);
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold font-headline mb-4">AI Generation Test Page</h1>
            <p className="text-muted-foreground mb-6">
                Use this page to debug the AI drill generation process. Enter a prompt and click "Generate Test" to see the raw output from the AI and any errors that occur.
            </p>

            <div className="space-y-4 mb-8">
                <h2 className="text-2xl font-bold font-headline flex items-center">
                    <Sparkles className="mr-3 h-6 w-6 text-primary" />
                    Test Prompt
                </h2>
                <Textarea 
                    placeholder="Enter your prompt here..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                />
                <Button onClick={handleTest} disabled={isLoading} size="lg">
                    {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : "Generate Test"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <h3 className="text-xl font-bold">Raw Creative Text</h3>
                    <pre className="p-4 bg-muted rounded-md overflow-x-auto h-96">
                        <code>{rawCreativeText || "No output yet."}</code>
                    </pre>
                </div>
                <div className="space-y-4">
                    <h3 className="text-xl font-bold">Final JSON Output</h3>
                    <pre className="p-4 bg-muted rounded-md overflow-x-auto h-96">
                        <code>{finalJson || "No output yet."}</code>
                    </pre>
                </div>
                <div className="space-y-4 md:col-span-2">
                    <h3 className="text-xl font-bold text-destructive">Error Messages</h3>
                    <pre className="p-4 bg-destructive/10 text-destructive rounded-md">
                        <code>{errorMessage || "No errors yet."}</code>
                    </pre>
                </div>
            </div>
        </div>
    );
}
