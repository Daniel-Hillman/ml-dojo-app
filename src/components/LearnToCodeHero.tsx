'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Code2, 
  Play, 
  BookOpen, 
  Zap,
  Users,
  Trophy,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

interface LearnToCodeHeroProps {
  onStartLearning: () => void;
  onBrowseExamples: () => void;
}

export const LearnToCodeHero: React.FC<LearnToCodeHeroProps> = ({
  onStartLearning,
  onBrowseExamples
}) => {
  const features = [
    {
      icon: <Play className="w-6 h-6" />,
      title: 'Instant Execution',
      description: 'Run code directly in your browser'
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Structured Learning',
      description: 'Follow guided paths from beginner to advanced'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Real Examples',
      description: 'Learn with practical, real-world code'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Driven',
      description: 'Learn from a community of developers'
    }
  ];

  const languages = [
    'JavaScript', 'Python', 'HTML/CSS', 'SQL', 'JSON', 'YAML'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center space-y-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Code2 className="w-16 h-16" />
              <h1 className="text-6xl font-bold">Learn 2 Code</h1>
            </div>
            
            <p className="text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Master programming with interactive tutorials, real-time code execution, 
              and hands-on examples. Start coding in your browser right now!
            </p>

            <div className="flex items-center justify-center gap-6 mt-12">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 h-auto"
                onClick={onStartLearning}
              >
                <Play className="w-6 h-6 mr-3" />
                Start Learning Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4 h-auto"
                onClick={onBrowseExamples}
              >
                <BookOpen className="w-6 h-6 mr-3" />
                Browse Examples
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 mt-12 text-blue-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>No Sign-up Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Instant Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Why Choose Learn 2 Code?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We've built the most interactive and engaging way to learn programming. 
            No downloads, no setup - just pure learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Languages Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-6">Learn Multiple Languages</h2>
          <p className="text-lg text-gray-600 mb-8">
            Start with any language and expand your skills across the stack
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {languages.map((lang) => (
              <div
                key={lang}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-medium hover:shadow-lg transition-shadow cursor-pointer"
              >
                {lang}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">30+</div>
            <div className="text-gray-600">Code Examples</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">10+</div>
            <div className="text-gray-600">Languages</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">100%</div>
            <div className="text-gray-600">Interactive</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">0$</div>
            <div className="text-gray-600">Cost</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-12">
          <Trophy className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Coding Journey?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are mastering programming with Learn 2 Code. 
            No experience required - we'll guide you every step of the way.
          </p>
          
          <div className="flex items-center justify-center gap-6">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 h-auto"
              onClick={onStartLearning}
            >
              <Play className="w-6 h-6 mr-3" />
              Start Learning Now
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnToCodeHero;