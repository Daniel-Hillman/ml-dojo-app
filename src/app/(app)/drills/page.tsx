
import Link from 'next/link';
import { PlusCircle, ChevronRight, FileText, CheckCircle, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { drills } from './data';

export default function DrillsPage() {
  return (
    <div className="min-h-screen">
      <header className="p-6 border-b">
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {drills.map((drill) => (
            <Card key={drill.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300 bg-secondary/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="font-headline text-xl">{drill.title}</CardTitle>
                  <Badge 
                    variant={drill.difficulty === 'Beginner' ? 'default' : drill.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}
                    className={
                        drill.difficulty === 'Beginner' ? 'bg-green-500 hover:bg-green-600' :
                        drill.difficulty === 'Intermediate' ? 'bg-yellow-500 hover:bg-yellow-600' :
                        'bg-red-500 hover:bg-red-600'
                    }
                  >
                    {drill.difficulty}
                  </Badge>
                </div>
                <CardDescription className="text-foreground/80">{drill.concept}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">{drill.description}</p>
                <div className="mt-4 flex space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4"/>
                        <span>{drill.content.filter(c => c.type === 'theory').length} Theory</span>
                    </div>
                     <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4"/>
                        <span>{drill.content.filter(c => c.type === 'mcq').length} MCQs</span>
                    </div>
                     <div className="flex items-center gap-1.5">
                        <BarChart className="w-4 h-4"/>
                        <span>{drill.content.filter(c => c.type === 'code').length} Code</span>
                    </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/drills/${drill.id}`} className="w-full">
                  <Button className="w-full">
                    Start Drill
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
