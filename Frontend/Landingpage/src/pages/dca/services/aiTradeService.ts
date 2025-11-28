/**
 * AI Trade Service - TypeScript Integration with Python Backend
 * Connects Frontend/Landingpage with Python NLP engine
 */

import { getVerifiedContract } from '../../../config/contracts';

// ============================================================================
// TYPES - Match Python backend models
// ============================================================================

export type TradeAction = 'buy' | 'sell' | 'swap' | 'stake' | 'unstake' | 'unknown';

export interface ParsedTradeCommand {
  action: TradeAction;
  confidence: number;
  amount?: number;
  amount_type: 'usd' | 'token';
  from_token?: string;
  to_token?: string;
  duration?: number;
  slippage?: number;
  raw_command: string;
  parsed_intent: string;
  warnings: string[];
  detected_language?: string;
}

export interface TradeCommandResponse {
  success: boolean;
  parsed?: ParsedTradeCommand;
  error?: string;
  processing_time_ms?: number;
}

export interface TokenInfo {
  symbol: string;
  address: string;
  name: string;
  decimals: number;
  supported: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT = 10000; // 10 seconds

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Parse natural language trade command using AI backend
 */
export async function parseTradeCommand(
  command: string,
  userId?: string,
  language: 'en' | 'hi' | 'hinglish' = 'en'
): Promise<TradeCommandResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${AI_BACKEND_URL}/api/parse-command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command,
        user_id: userId,
        language,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: TradeCommandResponse = await response.json();
    return data;
  } catch (error) {
    console.error('❌ AI Backend Error:', error);

    // Check if it's a timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout - AI backend is not responding',
      };
    }

    // Check if backend is offline
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'AI backend is offline. Please start the Python server.',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get list of supported tokens from backend
 */
export async function getSupportedTokens(): Promise<TokenInfo[]> {
  try {
    const response = await fetch(`${AI_BACKEND_URL}/api/tokens`);

    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.status}`);
    }

    const data = await response.json();
    return data.tokens || [];
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return [];
  }
}

/**
 * Check if AI backend is healthy and ready
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${AI_BACKEND_URL}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return false;

    const data = await response.json();
    return data.status === 'healthy' && data.models_loaded === true;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

// ============================================================================
// FALLBACK NLP (Client-side - when backend is offline)
// ============================================================================

/**
 * Simple client-side NLP fallback (basic pattern matching)
 * Used when Python backend is unavailable
 */
export function parseCommandFallback(command: string): ParsedTradeCommand {
  const normalized = command.toLowerCase().trim();
  
  // Detect action
  let action: TradeAction = 'unknown';
  if (/\b(buy|purchase|get)\b/i.test(normalized)) action = 'buy';
  else if (/\b(sell|dump)\b/i.test(normalized)) action = 'sell';
  else if (/\b(swap|exchange|convert)\b/i.test(normalized)) action = 'swap';
  else if (/\b(stake|lock)\b/i.test(normalized)) action = 'stake';

  // Extract amount (basic)
  const amountMatch = normalized.match(/\$?\s*(\d+(?:\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;

  // Extract tokens (basic)
  const tokens = ['btc', 'eth', 'sol', 'usdc', 'bnb', 'xrp'];
  const foundTokens = tokens.filter(t => normalized.includes(t));
  
  let from_token: string | undefined;
  let to_token: string | undefined;
  
  if (action === 'buy' && foundTokens.length > 0) {
    to_token = foundTokens[0].toUpperCase();
    from_token = 'USDC';
  } else if (action === 'sell' && foundTokens.length > 0) {
    from_token = foundTokens[0].toUpperCase();
    to_token = 'USDC';
  } else if (action === 'swap' && foundTokens.length >= 2) {
    from_token = foundTokens[0].toUpperCase();
    to_token = foundTokens[1].toUpperCase();
  }

  const confidence = action !== 'unknown' && amount ? 60 : 30;

  return {
    action,
    confidence,
    amount,
    amount_type: 'usd',
    from_token,
    to_token,
    raw_command: command,
    parsed_intent: generateIntent(action, amount, from_token, to_token),
    warnings: confidence < 50 ? ['Using fallback parser - start AI backend for better accuracy'] : [],
  };
}

function generateIntent(
  action: TradeAction,
  amount?: number,
  from_token?: string,
  to_token?: string
): string {
  const amountStr = amount ? `$${amount.toFixed(2)}` : 'unspecified amount';
  
  switch (action) {
    case 'buy':
      return `Buy ${amountStr} worth of ${to_token || 'crypto'}`;
    case 'sell':
      return `Sell ${amountStr} of ${from_token || 'crypto'}`;
    case 'swap':
      return `Swap ${amountStr} from ${from_token || 'token'} to ${to_token || 'token'}`;
    case 'stake':
      return `Stake ${amountStr} of ${from_token || 'crypto'}`;
    default:
      return 'Unable to understand command';
  }
}

// ============================================================================
// SMART PARSING (Auto-fallback)
// ============================================================================

/**
 * Smart parse that automatically falls back to client-side if backend is offline
 */
export async function smartParseCommand(
  command: string,
  userId?: string,
  language: 'en' | 'hi' | 'hinglish' = 'en'
): Promise<ParsedTradeCommand> {
  // Try AI backend first
  const response = await parseTradeCommand(command, userId, language);

  if (response.success && response.parsed) {
    console.log('✅ Using AI backend (high accuracy)');
    return response.parsed;
  }

  // Fallback to client-side parsing
  console.warn('⚠️ AI backend unavailable, using fallback parser');
  return parseCommandFallback(command);
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate parsed command before execution
 */
export function validateParsedCommand(parsed: ParsedTradeCommand): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (parsed.action === 'unknown') {
    errors.push('Unable to determine trade action');
  }

  if (!parsed.amount || parsed.amount <= 0) {
    errors.push('Invalid or missing amount');
  }

  if (parsed.action === 'swap') {
    if (!parsed.from_token || !parsed.to_token) {
      errors.push('Swap requires both source and destination tokens');
    }
    if (parsed.from_token === parsed.to_token) {
      errors.push('Cannot swap a token to itself');
    }
  }

  if (parsed.action === 'buy' && !parsed.to_token) {
    errors.push('Buy requires specifying the token to purchase');
  }

  if (parsed.action === 'sell' && !parsed.from_token) {
    errors.push('Sell requires specifying the token to sell');
  }

  if (parsed.confidence < 60) {
    errors.push('Low confidence in parsing - please provide more details');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get token address from symbol
 */
export function getTokenAddress(symbol: string): string | null {
  const TOKEN_MAP: Record<string, string> = {
    'USDC': getVerifiedContract('USDC_TOKEN'),
    'BTC': '0x7d9E31f5cCac4b9c8566f343A6bD6f3263DFcC91',
    'SOL': '0x241ECE6Dce0E0825F9992410B3fA5d4b8fC8d199',
    'BNB': '0xAA9Be1a8A7f7254C1759bAa7e0f7864579c33a96',
    'XRP': '0x01E278B5421AAC93A206C15b2933419DA19E17b3',
    'TON': '0xC85D84a1092b81aCBA9bC75fad6063a7DA642E36',
    'AVAX': '0x5DC449E37b6DAAD182d4Fb13C8dFE53C383C2E46',
    'TRON': '0x45442ecB66A1a10c0F9817fb7F2B50a3bB99bd69',
    'CARDANO': '0xcB1A4c81E7a56cbE2246DA3aE256Ba0154940648',
    'DOGE': '0x803aD69f487536Ec1eE8a83Cd329e3d1703f8337',
  };

  return TOKEN_MAP[symbol.toUpperCase()] || null;
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

export const EXAMPLE_COMMANDS = [
  'buy $100 of BTC',
  'swap 50 USDC to ETH',
  'sell 0.5 bitcoin for dollars',
  'stake 1000 USDC for 30 days',
  '100 dollar ka btc kharido',
  'eth me invest karo 50 dollar',
];

// Test function (for debugging)
if (typeof window !== 'undefined') {
  (window as any).testAIService = async () => {
    console.log('🤖 Testing AI Trade Service\n');
    
    const health = await checkBackendHealth();
    console.log(`Backend Health: ${health ? '✅ Online' : '❌ Offline'}\n`);

    for (const cmd of EXAMPLE_COMMANDS.slice(0, 3)) {
      const result = await smartParseCommand(cmd);
      console.log(`Command: "${cmd}"`);
      console.log(`Action: ${result.action} | Confidence: ${result.confidence}%`);
      console.log(`Intent: ${result.parsed_intent}\n`);
    }
  };
}
