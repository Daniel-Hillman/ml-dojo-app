/**
 * AI Client that uses personal API keys
 */

import { getPrimaryApiKey, getApiKey } from '@/lib/api-keys';

interface AIResponse {
  text: string;
  provider: string;
}

/**
 * Generate text using the user's personal API keys
 */
export async function generateWithPersonalKey(prompt: string): Promise<AIResponse> {
  const primaryKey = getPrimaryApiKey();
  
  if (!primaryKey) {
    throw new Error('No API key configured. Please configure your personal API keys in the settings.');
  }

  switch (primaryKey.provider) {
    case 'openai':
      return await generateWithOpenAI(prompt, primaryKey.key);
    case 'anthropic':
      return await generateWithAnthropic(prompt, primaryKey.key);
    case 'google':
      return await generateWithGoogle(prompt, primaryKey.key);
    default:
      throw new Error(`Unsupported AI provider: ${primaryKey.provider}`);
  }
}

/**
 * Generate text using OpenAI API
 */
async function generateWithOpenAI(prompt: string, apiKey: string): Promise<AIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`OpenAI API error: ${error.error?.message || 'Request failed'}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content || '',
    provider: 'openai'
  };
}

/**
 * Generate text using Anthropic API
 */
async function generateWithAnthropic(prompt: string, apiKey: string): Promise<AIResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Anthropic API error: ${error.error?.message || 'Request failed'}`);
  }

  const data = await response.json();
  return {
    text: data.content[0]?.text || '',
    provider: 'anthropic'
  };
}

/**
 * Generate text using Google AI API
 */
async function generateWithGoogle(prompt: string, apiKey: string): Promise<AIResponse> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Google AI API error: ${error.error?.message || 'Request failed'}`);
  }

  const data = await response.json();
  return {
    text: data.candidates[0]?.content?.parts[0]?.text || '',
    provider: 'google'
  };
}

/**
 * Test an API key to see if it's working
 */
export async function testApiKey(provider: string, apiKey: string): Promise<boolean> {
  try {
    const testPrompt = "Hello, this is a test. Please respond with 'API key is working'.";
    
    switch (provider) {
      case 'openai':
        await generateWithOpenAI(testPrompt, apiKey);
        return true;
      case 'anthropic':
        await generateWithAnthropic(testPrompt, apiKey);
        return true;
      case 'google':
        await generateWithGoogle(testPrompt, apiKey);
        return true;
      default:
        return false;
    }
  } catch (error) {
    console.error(`API key test failed for ${provider}:`, error);
    return false;
  }
}