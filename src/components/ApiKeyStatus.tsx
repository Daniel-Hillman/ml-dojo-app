'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Key, ExternalLink } from 'lucide-react';
import { hasRequiredApiKeys, getPrimaryApiKey, API_KEY_CONFIGS } from '@/lib/api-keys';
import Link from 'next/link';

interface ApiKeyStatusProps {
    showDetails?: boolean;
    className?: string;
}

export function ApiKeyStatus({ showDetails = false, className = '' }: ApiKeyStatusProps) {
    const [hasKeys, setHasKeys] = useState(false);
    const [primaryKey, setPrimaryKey] = useState<{ provider: string; key: string } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        checkApiKeys();

        // Listen for localStorage changes
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key && e.key.startsWith('api_key_')) {
                checkApiKeys();
            }
        };

        // Listen for custom events when keys are saved
        const handleApiKeyUpdate = () => {
            checkApiKeys();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('apiKeyUpdated', handleApiKeyUpdate);

        // Also check periodically in case of same-tab updates
        const interval = setInterval(checkApiKeys, 2000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('apiKeyUpdated', handleApiKeyUpdate);
            clearInterval(interval);
        };
    }, []);

    const checkApiKeys = () => {
        if (typeof window !== 'undefined') {
            const hasKeysNow = hasRequiredApiKeys();
            const primaryKeyNow = getPrimaryApiKey();

            setHasKeys(hasKeysNow);
            setPrimaryKey(primaryKeyNow);

            console.log('API Key Status Check:', {
                hasKeys: hasKeysNow,
                primaryKey: primaryKeyNow,
                localStorage: {
                    openai: localStorage.getItem('api_key_openai') ? 'present' : 'missing',
                    anthropic: localStorage.getItem('api_key_anthropic') ? 'present' : 'missing',
                    google: localStorage.getItem('api_key_google') ? 'present' : 'missing'
                }
            });
        }
    };

    // Don't render on server side to avoid hydration mismatch
    if (!mounted) {
        return null;
    }

    if (hasKeys) {
        if (!showDetails) {
            return (
                <div className={`flex items-center gap-2 text-sm text-green-600 ${className}`}>
                    <CheckCircle className="h-4 w-4" />
                    <span>API Keys Configured</span>
                </div>
            );
        }

        return (
            <Alert className={`border-green-500 bg-green-500/10 ${className}`}>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <strong>API Keys Configured</strong>
                            <br />
                            Primary provider: {primaryKey?.provider.toUpperCase() || 'Unknown'}
                        </div>
                        <Link href="/api-keys">
                            <Button variant="outline" size="sm">
                                <Key className="h-4 w-4 mr-2" />
                                Manage Keys
                            </Button>
                        </Link>
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    // No API keys configured
    if (!showDetails) {
        return (
            <div className={`flex items-center gap-2 text-sm text-amber-600 ${className}`}>
                <AlertCircle className="h-4 w-4" />
                <span>API Keys Required</span>
            </div>
        );
    }

    return (
        <Alert variant="destructive" className={className}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
                <div className="flex items-center justify-between">
                    <div>
                        <strong>API Keys Required</strong>
                        <br />
                        Configure your personal API keys to enable AI features.
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={checkApiKeys}
                            title="Refresh API key status"
                        >
                            🔄
                        </Button>
                        <Link href="/api-keys">
                            <Button variant="outline" size="sm">
                                <Key className="h-4 w-4 mr-2" />
                                Configure Keys
                            </Button>
                        </Link>
                    </div>
                </div>
            </AlertDescription>
        </Alert>
    );
}
