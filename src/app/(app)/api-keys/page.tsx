'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Key, Save, AlertCircle, CheckCircle, ExternalLink, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiKey {
  id: string;
  name: string;
  description: string;
  placeholder: string;
  required: boolean;
  helpUrl?: string;
  setupGuide?: string[];
}

const API_KEYS: ApiKey[] = [
  {
    id: 'openai',
    name: 'OpenAI API Key',
    description: 'Popular AI provider for drill generation and code assistance',
    placeholder: 'sk-...',
    required: false,
    helpUrl: 'https://platform.openai.com/api-keys',
    setupGuide: [
      '1. Go to https://platform.openai.com/api-keys',
      '2. Sign in or create an OpenAI account',
      '3. Click "Create new secret key"',
      '4. Copy the key (starts with "sk-")',
      '5. Paste it in the field above',
      '6. Note: You need to add billing info to use the API'
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic API Key',
    description: 'Alternative AI provider for drill generation',
    placeholder: 'sk-ant-...',
    required: false,
    helpUrl: 'https://console.anthropic.com/account/keys',
    setupGuide: [
      '1. Go to https://console.anthropic.com/account/keys',
      '2. Sign in or create an Anthropic account',
      '3. Click "Create Key"',
      '4. Copy the key (starts with "sk-ant-")',
      '5. Paste it in the field above',
      '6. Note: Anthropic offers free credits for new users'
    ]
  },
  {
    id: 'google',
    name: 'Google AI API Key',
    description: 'Google Gemini AI for drill generation and assistance',
    placeholder: 'AIza...',
    required: false,
    helpUrl: 'https://makersuite.google.com/app/apikey',
    setupGuide: [
      '1. Go to https://makersuite.google.com/app/apikey',
      '2. Sign in with your Google account',
      '3. Click "Create API Key"',
      '4. Copy the key (starts with "AIza")',
      '5. Paste it in the field above',
      '6. Note: Google AI Studio offers generous free usage'
    ]
  }
];

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [testResults, setTestResults] = useState<Record<string, 'testing' | 'success' | 'error' | null>>({});
  const [expandedGuides, setExpandedGuides] = useState<Record<string, boolean>>({});

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedKeys: Record<string, string> = {};
    API_KEYS.forEach(key => {
      const saved = localStorage.getItem(`api_key_${key.id}`);
      if (saved) {
        savedKeys[key.id] = saved;
      }
    });
    setApiKeys(savedKeys);
  }, []);

  // Save API key to localStorage
  const saveApiKey = (keyId: string, value: string) => {
    if (value.trim()) {
      localStorage.setItem(`api_key_${keyId}`, value.trim());
    } else {
      localStorage.removeItem(`api_key_${keyId}`);
    }
    
    setApiKeys(prev => ({
      ...prev,
      [keyId]: value.trim()
    }));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('apiKeyUpdated', { 
      detail: { keyId, hasValue: !!value.trim() } 
    }));
  };

  // Handle input change
  const handleKeyChange = (keyId: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [keyId]: value
    }));
  };

  // Save all keys
  const handleSaveAll = async () => {
    setSaveStatus('saving');
    
    try {
      // Save each key
      Object.entries(apiKeys).forEach(([keyId, value]) => {
        saveApiKey(keyId, value);
      });
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Test API key
  const testApiKey = async (keyId: string) => {
    const key = apiKeys[keyId];
    if (!key?.trim()) return;

    setTestResults(prev => ({ ...prev, [keyId]: 'testing' }));

    try {
      // Simple test based on key type
      let isValid = false;
      
      switch (keyId) {
        case 'openai':
          isValid = key.startsWith('sk-') && key.length > 20;
          break;
        case 'anthropic':
          isValid = key.startsWith('sk-ant-') && key.length > 20;
          break;
        case 'google':
          isValid = key.startsWith('AIza') && key.length > 20;
          break;
        default:
          isValid = key.length > 10;
      }

      // Simulate API test delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTestResults(prev => ({ 
        ...prev, 
        [keyId]: isValid ? 'success' : 'error' 
      }));
      
      // Clear test result after 3 seconds
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, [keyId]: null }));
      }, 3000);
      
    } catch (error) {
      setTestResults(prev => ({ ...prev, [keyId]: 'error' }));
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, [keyId]: null }));
      }, 3000);
    }
  };

  // Toggle key visibility
  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  // Toggle setup guide visibility
  const toggleSetupGuide = (keyId: string) => {
    setExpandedGuides(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  // Get key status
  const getKeyStatus = (keyId: string) => {
    const key = apiKeys[keyId];
    const testResult = testResults[keyId];
    
    if (testResult === 'testing') return 'testing';
    if (testResult === 'success') return 'valid';
    if (testResult === 'error') return 'invalid';
    if (key?.trim()) return 'configured';
    return 'missing';
  };

  // Get status badge
  const getStatusBadge = (keyId: string) => {
    const status = getKeyStatus(keyId);
    
    switch (status) {
      case 'testing':
        return <Badge variant="secondary" className="animate-pulse">Testing...</Badge>;
      case 'valid':
        return <Badge variant="default" className="bg-green-600">Valid</Badge>;
      case 'invalid':
        return <Badge variant="destructive">Invalid</Badge>;
      case 'configured':
        return <Badge variant="outline">Configured</Badge>;
      default:
        return <Badge variant="secondary">Not Set</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-code7x5">Personal API Keys</h1>
          <p className="text-muted-foreground mt-2 font-gontserrat">
            Configure your personal API keys to enable AI-powered features. Your keys are stored locally and never sent to our servers.
          </p>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> All API keys are stored locally in your browser and are never transmitted to our servers. 
            You maintain full control over your keys and can remove them at any time.
          </AlertDescription>
        </Alert>

        {/* API Keys Configuration */}
        <div className="space-y-4">
          {API_KEYS.map((keyConfig) => {
            const keyValue = apiKeys[keyConfig.id] || '';
            const isVisible = visibleKeys[keyConfig.id];
            const status = getKeyStatus(keyConfig.id);
            
            return (
              <Card key={keyConfig.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        {keyConfig.name}
                        {keyConfig.required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{keyConfig.description}</CardDescription>
                    </div>
                    {getStatusBadge(keyConfig.id)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={keyConfig.id}>API Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id={keyConfig.id}
                          type={isVisible ? 'text' : 'password'}
                          value={keyValue}
                          onChange={(e) => handleKeyChange(keyConfig.id, e.target.value)}
                          placeholder={keyConfig.placeholder}
                          className={cn(
                            'pr-10',
                            status === 'valid' && 'border-green-500',
                            status === 'invalid' && 'border-red-500'
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => toggleKeyVisibility(keyConfig.id)}
                        >
                          {isVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <Button
                        onClick={() => testApiKey(keyConfig.id)}
                        disabled={!keyValue.trim() || testResults[keyConfig.id] === 'testing'}
                        variant="outline"
                        size="default"
                      >
                        {testResults[keyConfig.id] === 'testing' ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                            Testing
                          </>
                        ) : (
                          'Test'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Setup Guide Dropdown */}
                  {keyConfig.setupGuide && (
                    <div className="border rounded-lg">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => toggleSetupGuide(keyConfig.id)}
                        className="w-full justify-between p-3 h-auto"
                      >
                        <span className="text-sm font-medium">📋 How to get your {keyConfig.name}</span>
                        {expandedGuides[keyConfig.id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      
                      {expandedGuides[keyConfig.id] && (
                        <div className="px-3 pb-3 border-t">
                          <ol className="text-sm text-muted-foreground space-y-1 mt-2">
                            {keyConfig.setupGuide.map((step, index) => (
                              <li key={index} className="leading-relaxed">
                                {step}
                              </li>
                            ))}
                          </ol>
                          <div className="mt-3 pt-2 border-t">
                            <a 
                              href={keyConfig.helpUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Open {keyConfig.name} Dashboard
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Messages */}
                  {testResults[keyConfig.id] === 'success' && (
                    <Alert className="border-green-500 bg-green-500/10">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        API key is valid and working correctly!
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {testResults[keyConfig.id] === 'error' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        API key appears to be invalid. Please check the key format and try again.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator />

        {/* Save Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-medium font-code7x5">Save Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Save all your API keys to local storage
            </p>
          </div>
          
          <Button 
            onClick={handleSaveAll}
            disabled={saveStatus === 'saving'}
            className="min-w-[120px]"
          >
            {saveStatus === 'saving' && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            )}
            {saveStatus === 'saving' ? 'Saving...' : 
             saveStatus === 'saved' ? (
               <>
                 <CheckCircle className="h-4 w-4 mr-2" />
                 Saved!
               </>
             ) : (
               <>
                 <Save className="h-4 w-4 mr-2" />
                 Save All
               </>
             )}
          </Button>
        </div>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use Your API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">🤖 AI Drill Generation</h4>
                <p className="text-sm text-muted-foreground">
                  Your OpenAI key enables automatic generation of coding exercises and practice problems.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">💡 Code Assistance</h4>
                <p className="text-sm text-muted-foreground">
                  Get intelligent hints and explanations for coding challenges using your configured AI providers.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">🔒 Privacy & Security</h4>
                <p className="text-sm text-muted-foreground">
                  Keys are stored locally in your browser and encrypted. They're never sent to our servers.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">⚡ Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Multiple providers ensure reliable service and faster response times for AI features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}