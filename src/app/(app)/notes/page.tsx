'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// A simple mock markdown to HTML renderer. In a real app, use a library like 'marked' or 'react-markdown'.
function renderMarkdown(md: string): string {
    return md
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold my-4">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold my-3">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold my-2">$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/`([^`]+)`/gim, '<code class="bg-muted text-muted-foreground font-code px-1 py-0.5 rounded">$1</code>')
        .replace(/```python\n([\s\S]*?)```/gim, '<pre class="bg-gray-900 text-white p-4 rounded-md my-4 overflow-x-auto"><code class="font-code">$1</code></pre>')
        .replace(/```\n([\s\S]*?)```/gim, '<pre class="bg-muted p-4 rounded-md my-4 overflow-x-auto"><code class="font-code">$1</code></pre>')
        .replace(/^\s*-\s(.*)/gim, '<ul class="list-disc pl-5 my-2"><li>$1</li></ul>') // Simplified list
        .replace(/\n/gim, '<br />'); // Basic line breaks
}


export default function NotesPage() {
  const [markdown, setMarkdown] = useState(
`# My ML Notes

## Linear Regression
This is a **fundamental** algorithm. It assumes a linear relationship between the independent variable(s) and the dependent variable.

\`\`\`python
from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(X, y)
\`\`\`

- Easy to implement
- Highly interpretable

Use \`model.predict()\` for predictions.`
  );

  return (
    <div className="min-h-screen flex flex-col">
       <header className="p-6 border-b">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold font-headline">Notes</h1>
          <p className="text-muted-foreground">Your personal space for ML thoughts and code snippets. Supports Markdown.</p>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardContent className="p-0 flex-grow">
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-full resize-none border-0 rounded-b-lg rounded-t-none focus-visible:ring-0 font-code text-base"
              placeholder="Write your notes here in Markdown..."
            />
          </CardContent>
        </Card>
        <Card className="flex flex-col">
            <CardContent className="p-6">
                <div 
                    className="prose max-w-none" 
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} 
                />
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
