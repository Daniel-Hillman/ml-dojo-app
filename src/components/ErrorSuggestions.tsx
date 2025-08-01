'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Lightbulb, 
  Code, 
  ExternalLink, 
  Copy, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Wrench,
  Zap
} from 'lucide-react';
import { ErrorSuggestion, ProcessedError } from '@/lib/code-execution/error-handler';

interface ErrorSuggestionsProps {
  processedError: ProcessedError;
  onApplySuggestion?: (suggestion: ErrorSuggestion) => void;
  className?: string;
}

export const ErrorSuggestions: React.FC<ErrorSuggestionsProps> = ({
  processedError,
  onApplySuggestion,
  className = ''
}) => {
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<number>>(new Set([0])); // First suggestion expanded by default
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());

  const toggleSuggestion = (index: number) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSuggestions(newExpanded);
  };

  const handleApplySuggestion = (suggestion: ErrorSuggestion, index: number) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
      setAppliedSuggestions(prev => new Set(prev).add(index));
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getSuggestionIcon = (type: ErrorSuggestion['type']) => {
    switch (type) {
      case 'fix':
        return Wrench;
      case 'alternative':
        return Zap;
      case 'documentation':
        return BookOpen;
      case 'example':
        return Code;
      default:
        return Lightbulb;
    }
  };

  const getSuggestionColor = (type: ErrorSuggestion['type']) => {
    switch (type) {
      case 'fix':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'alternative':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'documentation':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'example':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: ProcessedError['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100 border-red-300';
      case 'high':
        return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low':
        return 'text-blue-700 bg-blue-100 border-blue-300';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  if (!processedError.suggestions || processedError.suggestions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Lightbulb className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No suggestions available for this error.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Suggestions to Fix This Issue
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getSeverityColor(processedError.severity)}>
              {processedError.severity} severity
            </Badge>
            <Badge variant="outline" className="text-xs">
              {processedError.suggestions.length} suggestions
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {processedError.suggestions
          .sort((a, b) => b.priority - a.priority)
          .map((suggestion, index) => {
            const Icon = getSuggestionIcon(suggestion.type);
            const isExpanded = expandedSuggestions.has(index);
            const isApplied = appliedSuggestions.has(index);
            const colorClasses = getSuggestionColor(suggestion.type);

            return (
              <Collapsible key={index} open={isExpanded} onOpenChange={() => toggleSuggestion(index)}>
                <div className={`border rounded-lg ${colorClasses}`}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-opacity-80 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{suggestion.title}</h4>
                          <p className="text-xs opacity-80 mt-1 line-clamp-2">
                            {suggestion.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {suggestion.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Priority: {suggestion.priority}
                          </Badge>
                          {isApplied && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 ml-2 flex-shrink-0" />
                      )}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-3 border-t border-current border-opacity-20">
                      {/* Detailed Description */}
                      <div className="pt-3">
                        <p className="text-sm leading-relaxed">
                          {suggestion.description}
                        </p>
                      </div>

                      {/* Code Example */}
                      {suggestion.code && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-medium opacity-80">Example Code:</h5>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(suggestion.code!)}
                              className="h-6 px-2 text-xs"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
                            <pre className="whitespace-pre-wrap">{suggestion.code}</pre>
                          </div>
                        </div>
                      )}

                      {/* External Link */}
                      {suggestion.link && (
                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(suggestion.link, '_blank')}
                            className="h-7 px-3 text-xs"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Learn More
                          </Button>
                        </div>
                      )}

                      {/* Apply Suggestion Button */}
                      {suggestion.code && onApplySuggestion && !isApplied && (
                        <div className="pt-2 border-t border-current border-opacity-20">
                          <Button
                            size="sm"
                            onClick={() => handleApplySuggestion(suggestion, index)}
                            className="h-7 px-3 text-xs"
                          >
                            <Wrench className="w-3 h-3 mr-1" />
                            Apply This Fix
                          </Button>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}

        {/* Retry Information */}
        {processedError.canRetry && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-800 text-sm mb-1">
                  This error can be retried
                </h4>
                <p className="text-blue-700 text-xs">
                  You can try running your code again. 
                  {processedError.retryDelay && (
                    ` We recommend waiting ${processedError.retryDelay / 1000} seconds before retrying.`
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Context Information */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-800 text-sm mb-2">Error Context</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Language:</span>
              <Badge variant="outline" className="text-xs">
                {processedError.context.language}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Error Type:</span>
              <Badge variant="outline" className="text-xs">
                {processedError.errorType}
              </Badge>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-gray-600">Execution ID:</span>
              <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                {processedError.context.executionId.slice(0, 8)}...
              </code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};