/**
 * Utility functions for managing personal API keys
 */

export interface ApiKeyConfig {
  id: string;
  name: string;
  description: string;
  required: boolean;
}

export const API_KEY_CONFIGS: ApiKeyConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI API Key',
    description: 'Popular AI provider for drill generation and code assistance',
    required: false,
  },
  {
    id: 'anthropic',
    name: 'Anthropic API Key',
    description: 'Alternative AI provider for drill generation',
    required: false,
  },
  {
    id: 'google',
    name: 'Google AI API Key',
    description: 'Google Gemini AI for drill generation and assistance',
    required: false,
  }
];

/**
 * Get an API key from local storage
 */
export function getApiKey(keyId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`api_key_${keyId}`);
}

/**
 * Set an API key in local storage
 */
export function setApiKey(keyId: string, value: string): void {
  if (typeof window === 'undefined') return;
  if (value.trim()) {
    localStorage.setItem(`api_key_${keyId}`, value.trim());
  } else {
    localStorage.removeItem(`api_key_${keyId}`);
  }
}

/**
 * Get all configured API keys
 */
export function getAllApiKeys(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  const keys: Record<string, string> = {};
  API_KEY_CONFIGS.forEach(config => {
    const value = getApiKey(config.id);
    if (value) {
      keys[config.id] = value;
    }
  });
  return keys;
}

/**
 * Check if all required API keys are configured
 */
export function hasRequiredApiKeys(): boolean {
  // Check if ANY API key is configured (since all are now optional)
  return API_KEY_CONFIGS.some(config => {
    const key = getApiKey(config.id);
    return key && key.trim().length > 0;
  });
}

/**
 * Get the primary API key for AI operations (OpenAI first, then fallbacks)
 */
export function getPrimaryApiKey(): { provider: string; key: string } | null {
  // Try OpenAI first
  const openaiKey = getApiKey('openai');
  if (openaiKey) {
    return { provider: 'openai', key: openaiKey };
  }
  
  // Try Anthropic as fallback
  const anthropicKey = getApiKey('anthropic');
  if (anthropicKey) {
    return { provider: 'anthropic', key: anthropicKey };
  }
  
  // Try Google as last fallback
  const googleKey = getApiKey('google');
  if (googleKey) {
    return { provider: 'google', key: googleKey };
  }
  
  return null;
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(keyId: string, key: string): boolean {
  if (!key || key.trim().length === 0) return false;
  
  switch (keyId) {
    case 'openai':
      return key.startsWith('sk-') && key.length > 20;
    case 'anthropic':
      return key.startsWith('sk-ant-') && key.length > 20;
    case 'google':
      return key.startsWith('AIza') && key.length > 20;
    default:
      return key.length > 10;
  }
}

/**
 * Get API key status for UI display
 */
export function getApiKeyStatus(keyId: string): 'missing' | 'configured' | 'invalid' {
  const key = getApiKey(keyId);
  if (!key) return 'missing';
  
  if (validateApiKeyFormat(keyId, key)) {
    return 'configured';
  }
  
  return 'invalid';
}