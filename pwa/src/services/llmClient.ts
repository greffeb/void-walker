/**
 * Void Walker PWA - LLM Client
 *
 * API wrapper for Google GenAI with rate limiting and retry logic.
 * Ported from cli/void_walker/llm/client.py
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractJson } from './parser';

// Model configuration
// Based on actual Google AI Studio free tier availability (Jan 2026)
// Note: gemini-2.5-flash has output truncation issues on free tier
// Using gemma-3-27b-it for everything - best free tier quota (14.4K RPD)
export const MODELS = {
  world_gen: 'gemma-3-27b-it',         // High quota, no truncation issues
  gameplay: 'gemma-3-27b-it',          // High quota (14.4K RPD) for gameplay
  fallback: 'gemini-2.5-flash-lite',   // Backup if gemma fails
} as const;

export type ModelKey = keyof typeof MODELS;

// Rate limits per model (from Google AI Studio Jan 2026)
const RATE_LIMITS: Record<string, { rpm: number; rpd: number }> = {
  'gemma-3-27b-it': { rpm: 30, rpd: 14400 },
  'gemini-2.5-flash-lite': { rpm: 10, rpd: 20 },
  'gemini-2.5-flash': { rpm: 5, rpd: 20 },
};

// Fallback chain: when a model hits rate limits, try the next one
const FALLBACK_ORDER: Record<ModelKey, ModelKey | null> = {
  world_gen: 'fallback',   // gemma-3-27b-it → gemini-2.5-flash-lite
  gameplay: 'fallback',    // gemma-3-27b-it → gemini-2.5-flash-lite
  fallback: null,          // no further fallback
};

export class LLMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMError';
  }
}

export class RateLimitError extends LLMError {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Simple rate limiter for API calls.
 */
class RateLimiter {
  private rpm: number;
  private rpd: number;
  private minuteCalls: number[] = [];
  private dayCalls: number[] = [];

  constructor(rpm: number, rpd: number) {
    this.rpm = rpm;
    this.rpd = rpd;
  }

  canCall(): boolean {
    const now = Date.now();

    // Clean old calls
    this.minuteCalls = this.minuteCalls.filter(t => now - t < 60000);
    this.dayCalls = this.dayCalls.filter(t => now - t < 86400000);

    return this.minuteCalls.length < this.rpm && this.dayCalls.length < this.rpd;
  }

  waitTime(): number {
    if (this.canCall()) return 0;

    const now = Date.now();

    // Check minute limit
    if (this.minuteCalls.length >= this.rpm) {
      const oldest = Math.min(...this.minuteCalls);
      const wait = 60000 - (now - oldest) + 100;
      if (wait > 0) return wait;
    }

    // Check day limit
    if (this.dayCalls.length >= this.rpd) {
      const oldest = Math.min(...this.dayCalls);
      return 86400000 - (now - oldest) + 100;
    }

    return 0;
  }

  recordCall(): void {
    const now = Date.now();
    this.minuteCalls.push(now);
    this.dayCalls.push(now);
  }
}

/**
 * Client for interacting with Google GenAI.
 */
export class LLMClient {
  private client: GoogleGenerativeAI | null = null;
  private rateLimiters: Map<string, RateLimiter> = new Map();

  constructor() {
    // Initialize rate limiters for each model
    for (const [modelName, limits] of Object.entries(RATE_LIMITS)) {
      this.rateLimiters.set(modelName, new RateLimiter(limits.rpm, limits.rpd));
    }
  }

  /**
   * Initialize or update the client with an API key.
   */
  setApiKey(apiKey: string): void {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Check if the client is initialized.
   */
  isInitialized(): boolean {
    return this.client !== null;
  }

  private getModelName(modelKey: ModelKey): string {
    const modelName = MODELS[modelKey];
    if (!modelName) {
      throw new LLMError(`Unknown model key: ${modelKey}`);
    }
    return modelName;
  }

  private getRateLimiter(modelKey: ModelKey): RateLimiter {
    const modelName = MODELS[modelKey];
    return this.rateLimiters.get(modelName) || new RateLimiter(10, 1000);
  }

  /**
   * Make an LLM call with rate limiting and retry logic.
   */
  async call(
    prompt: string,
    modelKey: ModelKey = 'gameplay',
    maxRetries: number = 3,
    temperature: number = 0.8,
    maxOutputTokens?: number
    maxOutputTokens?: number,
    timeoutMs?: number
  ): Promise<string> {
    if (!this.client) {
      throw new LLMError('API key not set. Call setApiKey() first.');
    }

    const modelName = this.getModelName(modelKey);
    const limiter = this.getRateLimiter(modelKey);

    // Use larger token limit for world generation
    const tokens = maxOutputTokens ?? (modelKey === 'world_gen' ? 8192 : 2048);

    // Default timeout: 120s for world_gen (large response), 30s for gameplay
    const timeout = timeoutMs ?? (modelKey === 'world_gen' ? 120000 : 30000);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Wait for rate limit if needed
        const waitTime = limiter.waitTime();
        if (waitTime > 0) {
          if (waitTime > 60000) {
            // Switch to next model in fallback chain if wait is too long
            const nextModel = FALLBACK_ORDER[modelKey];
            if (nextModel) {
              console.warn(`Rate limit exceeded for ${modelKey}, falling back to ${nextModel}`);
              return this.call(prompt, nextModel, maxRetries, temperature, tokens, timeout);
            }
            throw new RateLimitError(`All models exhausted, wait ${Math.round(waitTime / 1000)}s`);
          }
          await this.sleep(waitTime);
        }

        // Record the call
        limiter.recordCall();

        // Make the API call
        const model = this.client.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature,
            maxOutputTokens: tokens,
          },
        });

        console.log(`[LLM] Calling ${modelKey} (${modelName}) with ${timeout/1000}s timeout, attempt ${attempt + 1}/${maxRetries}`);

        // Wrap API call in timeout promise
        const result = await Promise.race([
          model.generateContent(prompt),
          this.createTimeoutPromise(timeout, `${modelKey} call timed out after ${timeout/1000}s`)
        ]);

        const response = result.response;
        const text = response.text();

        if (text) {
          console.log(`[LLM] Success: ${text.length} characters received`);
          return text;
        } else {
          console.warn(`Empty response from model ${modelKey}`);
          throw new LLMError('Empty response from model');
        }
      } catch (error) {
        const errorStr = String(error).toLowerCase();
        console.error(`[LLM] Error [${modelKey}] attempt ${attempt + 1}/${maxRetries}:`, error);

        // Handle timeout errors specially
        if (errorStr.includes('timeout') || errorStr.includes('timed out')) {
          console.error(`[LLM] Timeout detected for ${modelKey}`);
          if (attempt < maxRetries - 1) {
            const backoff = Math.pow(2, attempt) * 2000; // Longer backoff for timeouts
            console.log(`[LLM] Retrying after timeout in ${backoff}ms...`);
            await this.sleep(backoff);
            continue;
          } else {
            throw new LLMError(`Requête expirée après ${maxRetries} tentatives (${timeout/1000}s chacune). Vérifiez votre connexion.`);
          }
        }

        // Handle rate limit errors - use fallback chain
        if (errorStr.includes('rate') || errorStr.includes('quota') || errorStr.includes('429')) {
          const nextModel = FALLBACK_ORDER[modelKey];
          if (nextModel) {
            console.warn(`Rate limit hit for ${modelKey}, falling back to ${nextModel}`);
            return this.call(prompt, nextModel, maxRetries, temperature, tokens, timeout);
          }
          throw new RateLimitError(`All models exhausted: ${error}`);
        }

        // Retry on other errors
        if (attempt < maxRetries - 1) {
          const backoff = Math.pow(2, attempt) * 1000;
          console.log(`[LLM] Retrying in ${backoff}ms...`);
          await this.sleep(backoff);
        } else {
          throw new LLMError(`Échec après ${maxRetries} tentatives: ${error}`);
        }
      }
    }

    throw new LLMError('Unexpected error in LLM call');
  }

  /**
   * Create a promise that rejects after a timeout.
   */
  private createTimeoutPromise(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Make an LLM call expecting JSON response.
   */
  async callForJson<T = Record<string, unknown>>(
    prompt: string,
    modelKey: ModelKey = 'gameplay',
    maxRetries: number = 3
  ): Promise<T> {
    const responseText = await this.call(prompt, modelKey, maxRetries);

    // Try to parse as JSON
    try {
      return JSON.parse(responseText) as T;
    } catch {
      // Try to extract JSON from response
      const extracted = extractJson(responseText);
      if (extracted) {
        return extracted as T;
      }
      throw new LLMError(`Could not parse response as JSON: ${responseText.slice(0, 200)}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let _client: LLMClient | null = null;

/**
 * Get or create the global LLM client.
 */
export function getLLMClient(): LLMClient {
  if (!_client) {
    _client = new LLMClient();
  }
  return _client;
}

/**
 * Initialize the LLM client with an API key.
 */
export function initializeLLM(apiKey: string): LLMClient {
  const client = getLLMClient();
  client.setApiKey(apiKey);
  return client;
}

/**
 * Convenience function to call LLM.
 */
export async function callLLM(
  prompt: string,
  modelKey: ModelKey = 'gameplay',
  maxRetries: number = 3
): Promise<string> {
  const client = getLLMClient();
  return client.call(prompt, modelKey, maxRetries);
}

/**
 * Convenience function to call LLM and get JSON.
 */
export async function callLLMJson<T = Record<string, unknown>>(
  prompt: string,
  modelKey: ModelKey = 'gameplay',
  maxRetries: number = 3
): Promise<T> {
  const client = getLLMClient();
  return client.callForJson<T>(prompt, modelKey, maxRetries);
}
