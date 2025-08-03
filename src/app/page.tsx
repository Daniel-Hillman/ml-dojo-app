'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Code, 
  BookOpen, 
  Users, 
  ArrowRight, 
  Zap,
  Target,
  Sparkles
} from 'lucide-react';
import { LiveCodeBlock } from '@/components/LiveCodeBlock';
import { SSRSafe } from '@/components/SSRSafe';
import { HydrationErrorBoundary } from '@/components/error/HydrationErrorBoundary';
import FaultyTerminal from '@/components/FaultyTerminal';

const FEATURED_EXAMPLES = [
  {
    id: 'js-basics',
    title: 'JavaScript Fundamentals',
    description: 'Learn the basics of JavaScript with interactive examples',
    language: 'javascript' as const,
    difficulty: 'Beginner',
    code: `// Welcome to OmniCode! 🚀
// Try editing and running this code

function greetUser(name) {
    const greeting = \`Hello, \${name}! Welcome to OmniCode.\`;
    console.log(greeting);
    return greeting;
}

// Interactive example - try changing the names!
const users = ['Alice', 'Bob', 'Charlie'];
users.forEach(user => {
    greetUser(user);
});

// Challenge: Add your own name to the array
console.log('\\n🎯 Challenge: Add your name and run again!');`,
    tags: ['fundamentals', 'functions', 'arrays']
  },
  {
    id: 'python-data',
    title: 'Python Data Analysis',
    description: 'Explore data with Python, pandas, and visualization',
    language: 'python' as const,
    difficulty: 'Intermediate',
    code: `# Python Data Analysis Demo 📊
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Create sample dataset
np.random.seed(42)
data = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
    'age': [25, 30, 35, 28, 32],
    'score': [85, 92, 78, 88, 95],
    'department': ['Engineering', 'Marketing', 'Engineering', 'Design', 'Marketing']
})

print("📋 Sample Dataset:")
print(data)

print("\\n📈 Statistics by Department:")
dept_stats = data.groupby('department').agg({
    'age': 'mean',
    'score': ['mean', 'max']
}).round(2)
print(dept_stats)

# Create visualization
plt.figure(figsize=(10, 6))
plt.scatter(data['age'], data['score'], c=data['department'].astype('category').cat.codes, alpha=0.7)
plt.xlabel('Age')
plt.ylabel('Score')
plt.title('Age vs Score by Department')
plt.colorbar(label='Department')
plt.show()

print("\\n🎯 Try modifying the data or adding new analysis!")`,
    tags: ['data-analysis', 'pandas', 'visualization']
  },
  {
    id: 'html-modern',
    title: 'Modern Web Layout',
    description: 'Build responsive layouts with modern CSS',
    language: 'html' as const,
    difficulty: 'Beginner',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OmniCode - Learn to Code</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }
        
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .logo {
            font-size: 2.5rem;
            font-weight: bold;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }
        
        .tagline {
            color: #666;
            font-size: 1.2rem;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        
        .feature {
            padding: 1.5rem;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 15px;
            text-align: center;
            transition: transform 0.3s ease;
        }
        
        .feature:hover {
            transform: translateY(-5px);
        }
        
        .feature-icon {
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        
        .cta {
            text-align: center;
            margin-top: 2rem;
        }
        
        .btn {
            display: inline-block;
            padding: 1rem 2rem;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            transition: transform 0.3s ease;
        }
        
        .btn:hover {
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">OmniCode</div>
            <div class="tagline">Learn to Code Interactively</div>
        </div>
        
        <div class="features">
            <div class="feature">
                <div class="feature-icon">🚀</div>
                <h3>Live Code Execution</h3>
                <p>Run code instantly in your browser</p>
            </div>
            <div class="feature">
                <div class="feature-icon">📚</div>
                <h3>Interactive Learning</h3>
                <p>Practice with hands-on examples</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🎯</div>
                <h3>Multiple Languages</h3>
                <p>JavaScript, Python, HTML, CSS & more</p>
            </div>
        </div>
        
        <div class="cta">
            <a href="#" class="btn">Start Coding Now</a>
        </div>
    </div>
</body>
</html>`,
    tags: ['html', 'css', 'responsive', 'modern']
  }
];

export default function HomePage() {
  return (
    <HydrationErrorBoundary>
      <div className="relative min-h-screen overflow-hidden" suppressHydrationWarning>
        {/* Terminal Background Effect */}
        <div className="absolute inset-0 z-0">
          <FaultyTerminal
            scale={0.8}
            gridMul={[2, 1]}
            digitSize={1.0}
            timeScale={0.3}
            pause={false}
            scanlineIntensity={0.4}
            glitchAmount={0.8}
            flickerAmount={0.3}
            noiseAmp={0.4}
            chromaticAberration={1}
            dither={0.2}
            curvature={0.05}
            tint="#00ff41"
            mouseReact={false}
            brightness={0.2}
            className="w-full h-full opacity-30"
          />
        </div>

        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-background/95 z-10" />

        {/* Content */}
        <div className="relative z-20 min-h-screen bg-gradient-to-br from-background/50 via-background/80 to-background/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center max-w-4xl mx-auto">
            {/* OmniCode Logo - Premium Styling */}
            <div className="mb-8">
              <h1 className="text-8xl font-aurora text-green-400 tracking-wider mb-4 drop-shadow-2xl">
                OmniCode
              </h1>
              <div className="h-1 w-64 bg-gradient-to-r from-transparent via-green-400 to-transparent mx-auto mb-4"></div>
              <p className="text-green-300/80 font-mono text-lg">
                Full Stack AI Training Environment
              </p>
            </div>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Learn to code interactively with live execution, practice drills, and a supportive community. 
              Master programming languages through hands-on experience.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/playground">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg">
                  <Play className="w-5 h-5 mr-2" />
                  Try Live Code
                </Button>
              </Link>
              <Link href="/drills">
                <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                  <Target className="w-5 h-5 mr-2" />
                  Practice Drills
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Choose OmniCode?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to learn programming effectively in one place
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Play className="w-8 h-8" />,
                title: 'Live Code Execution',
                description: 'Run code instantly in your browser with real-time output',
                color: 'bg-blue-500'
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: 'Practice Drills',
                description: 'Structured exercises to build your programming skills',
                color: 'bg-green-500'
              },
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: 'Code Templates',
                description: 'Ready-to-use examples and learning materials',
                color: 'bg-purple-500'
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: 'Community',
                description: 'Share knowledge and learn from other developers',
                color: 'bg-orange-500'
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-4`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Code Examples */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-3xl font-bold text-foreground">
                Featured Code Examples
              </h2>
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Try these interactive examples to see OmniCode in action
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {FEATURED_EXAMPLES.map((example) => (
              <Card key={example.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{example.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {example.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{example.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {example.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <HydrationErrorBoundary>
                    <SSRSafe fallback={
                      <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Code className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Loading code editor...</p>
                        </div>
                      </div>
                    }>
                      <LiveCodeBlock
                        code={example.code}
                        language={example.language}
                        height="300px"
                        editable={true}
                      />
                    </SSRSafe>
                  </HydrationErrorBoundary>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/playground">
              <Button size="lg" variant="outline" className="px-8 py-3">
                <Code className="w-5 h-5 mr-2" />
                Explore More Examples
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Coding Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of developers learning and practicing with OmniCode's interactive platform
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/playground">
              <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
                <Play className="w-5 h-5 mr-2" />
                Start Coding Now
              </Button>
            </Link>
            <Link href="/learn">
              <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-white text-white hover:bg-white hover:text-blue-600">
                <BookOpen className="w-5 h-5 mr-2" />
                Browse Examples
              </Button>
            </Link>
          </div>
        </div>
      </section>
        </div>
      </div>
    </HydrationErrorBoundary>
  );
}
