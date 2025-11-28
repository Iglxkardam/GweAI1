/**
 * Improved AI Trade Parser with Enhanced Accuracy
 * Uses comprehensive system prompt and fallback patterns
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'x-ai/grok-4.1-fast:free';
const SITE_URL = 'https://gweai.com';
const SITE_NAME = 'GweAI';

export interface TradeCommand {
  type: 'buy' | 'sell' | 'swap' | 'vault' | 'stake';
  amount: number | 'MAX';
  token?: string;
  fromToken?: string;
  toToken?: string;
  action?: 'stake' | 'unstake';
  duration?: number;
  slippage?: number;
  isTokenAmount?: boolean;
}

const ENHANCED_SYSTEM_PROMPT = `You are a specialized trade command parser for a cryptocurrency trading platform.

Your ONLY job is to parse user trading commands into structured JSON format.

SUPPORTED OPERATIONS:
1. BUY - User wants to buy crypto with USDC
2. SELL - User wants to sell crypto for USDC  
3. SWAP - User wants to exchange one crypto for another
4. VAULT/STAKE - User wants to stake tokens

SUPPORTED TOKENS:
BTC, ETH, SOL, BNB, XRP, TON, AVAX, DOGE, ADA, TRX, USDC

TOKEN ALIASES (map to symbols):
- bitcoin, btc → BTC
- ethereum, eth, ether → ETH
- solana, sol → SOL
- binance coin, bnb → BNB
- ripple, xrp → XRP
- toncoin, ton → TON
- avalanche, avax → AVAX
- dogecoin, doge → DOGE
- cardano, ada → ADA
- tron, trx → TRX

AMOUNT DETECTION RULES:
1. USD Amount: "$100", "100 dollars", "100 usd", "$50 worth"
   → isTokenAmount: false
   
2. Token Amount: "0.1 btc", "5 eth", "0.0001 bitcoin"
   → isTokenAmount: true
   
3. "MAX" or "all": User wants to sell/swap all holdings
   → amount: "MAX"

LANGUAGE SUPPORT:
- English: buy, sell, swap, stake, etc.
- Hindi/Hinglish: kharido, becho, badlo, jama, nikalo

OUTPUT FORMAT:

For BUY:
{"type":"buy","amount":100,"token":"BTC","slippage":0.5,"isTokenAmount":false}

For SELL:
{"type":"sell","amount":0.5,"token":"ETH","slippage":0.5,"isTokenAmount":true}

For SWAP:
{"type":"swap","amount":100,"fromToken":"SOL","toToken":"BNB","slippage":0.5}

For STAKE:
{"type":"vault","action":"stake","amount":1000,"token":"USDC","duration":30}

For UNSTAKE:
{"type":"vault","action":"unstake","amount":500,"token":"USDC"}

For NON-TRADE commands:
null

CRITICAL RULES:
- Always output valid JSON only, no explanation
- Never add markdown code blocks
- If not a trade command, output: null
- Default slippage is 0.5
- Default staking duration is 30 days
- Be case-insensitive
- Handle typos reasonably

EXAMPLES:
Input: "buy 100$ of btc"
Output: {"type":"buy","amount":100,"token":"BTC","slippage":0.5,"isTokenAmount":false}

Input: "sell 0.0001 btc"
Output: {"type":"sell","amount":0.0001,"token":"BTC","slippage":0.5,"isTokenAmount":true}

Input: "swap 50 sol to bnb"
Output: {"type":"swap","amount":50,"fromToken":"SOL","toToken":"BNB","slippage":0.5}

Input: "what is bitcoin price"
Output: null`;

/**
 * Parse trade command using AI with fallback patterns
 */
export async function parseTradeCommandImproved(message: string): Promise<TradeCommand | null> {
  const lowerMsg = message.toLowerCase();
  
  // Quick validation - must have trade keywords
  const tradeKeywords = /(buy|sell|swap|exchange|trade|stake|vault|kharido|becho|badlo|purchase|get|dump|lock|deposit|withdraw|unstake|nikalo)/i;
  if (!tradeKeywords.test(lowerMsg)) {
    return null;
  }

  try {
    // Call AI for parsing
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: ENHANCED_SYSTEM_PROMPT },
          { role: 'user', content: `Parse this command: ${message}` }
        ],
        temperature: 0.1, // Low temperature for consistent output
        max_tokens: 200,
      })
    });

    if (!response.ok) {
      console.error('AI parsing API error:', response.status);
      return fallbackParse(message);
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || 'null';
    
    // Clean response
    aiResponse = aiResponse.trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    console.log('🤖 AI parsed:', aiResponse);
    
    // Parse JSON
    const parsed = aiResponse.toLowerCase() === 'null' ? null : JSON.parse(aiResponse);
    
    if (!parsed) return null;

    // Validate and normalize
    return validateAndNormalize(parsed);

  } catch (error) {
    console.error('AI parsing error:', error);
    // Fallback to pattern matching
    return fallbackParse(message);
  }
}

/**
 * Validate and normalize parsed command
 */
function validateAndNormalize(parsed: any): TradeCommand | null {
  if (!parsed || !parsed.type) return null;

  // Normalize token symbols
  if (parsed.token) {
    parsed.token = normalizeToken(parsed.token);
  }
  if (parsed.fromToken) {
    parsed.fromToken = normalizeToken(parsed.fromToken);
  }
  if (parsed.toToken) {
    parsed.toToken = normalizeToken(parsed.toToken);
  }

  // Validate amount
  if (parsed.amount !== 'MAX' && (typeof parsed.amount !== 'number' || parsed.amount <= 0)) {
    return null;
  }

  // Set defaults
  parsed.slippage = parsed.slippage || 0.5;
  
  if (parsed.type === 'vault' || parsed.type === 'stake') {
    parsed.duration = parsed.duration || 30;
  }

  return parsed as TradeCommand;
}

/**
 * Normalize token symbol
 */
function normalizeToken(token: string): string {
  const normalized = token.toUpperCase();
  
  const aliases: Record<string, string> = {
    'BITCOIN': 'BTC',
    'ETHEREUM': 'ETH',
    'ETHER': 'ETH',
    'SOLANA': 'SOL',
    'BINANCE': 'BNB',
    'BINANCECOIN': 'BNB',
    'RIPPLE': 'XRP',
    'TONCOIN': 'TON',
    'AVALANCHE': 'AVAX',
    'DOGECOIN': 'DOGE',
    'CARDANO': 'ADA',
    'TRON': 'TRX'
  };

  return aliases[normalized] || normalized;
}

/**
 * Fallback parser using regex patterns
 */
function fallbackParse(message: string): TradeCommand | null {
  const lowerMsg = message.toLowerCase();
  
  // Extract numbers
  const amounts = message.match(/\d+(?:\.\d+)?/g)?.map(parseFloat) || [];
  if (amounts.length === 0) return null;
  
  const amount = amounts[0];

  // Detect USD vs token amount
  const isUSD = /\$|dollar|usd/i.test(message);
  
  // Extract tokens
  const tokens = extractTokens(message);
  if (tokens.length === 0) return null;

  // Detect operation
  if (/\b(buy|purchase|get|kharido|lelo)\b/i.test(lowerMsg)) {
    return {
      type: 'buy',
      amount,
      token: tokens[0],
      slippage: 0.5,
      isTokenAmount: !isUSD
    };
  }

  if (/\b(sell|dump|becho)\b/i.test(lowerMsg)) {
    return {
      type: 'sell',
      amount: /all|max/i.test(message) ? 'MAX' : amount,
      token: tokens[0],
      slippage: 0.5,
      isTokenAmount: true
    };
  }

  if (/\b(swap|exchange|convert|trade|badlo)\b/i.test(lowerMsg) && tokens.length >= 2) {
    return {
      type: 'swap',
      amount,
      fromToken: tokens[0],
      toToken: tokens[1],
      slippage: 0.5
    };
  }

  if (/\b(stake|lock|vault|jama|deposit)\b/i.test(lowerMsg)) {
    return {
      type: 'vault',
      action: 'stake',
      amount,
      token: tokens[0] || 'USDC',
      duration: amounts[1] || 30
    };
  }

  if (/\b(unstake|withdraw|nikalo|claim)\b/i.test(lowerMsg)) {
    return {
      type: 'vault',
      action: 'unstake',
      amount: /all|max/i.test(message) ? 'MAX' : amount,
      token: tokens[0] || 'USDC'
    };
  }

  return null;
}

/**
 * Extract token symbols from message
 */
function extractTokens(message: string): string[] {
  const tokens: string[] = [];
  const tokenPatterns = [
    /\b(btc|bitcoin)\b/i,
    /\b(eth|ethereum|ether)\b/i,
    /\b(sol|solana)\b/i,
    /\b(bnb|binance)\b/i,
    /\b(xrp|ripple)\b/i,
    /\b(ton|toncoin)\b/i,
    /\b(avax|avalanche)\b/i,
    /\b(doge|dogecoin)\b/i,
    /\b(ada|cardano)\b/i,
    /\b(trx|tron)\b/i,
    /\b(usdc)\b/i
  ];

  const tokenMap: Record<string, string> = {
    'btc': 'BTC', 'bitcoin': 'BTC',
    'eth': 'ETH', 'ethereum': 'ETH', 'ether': 'ETH',
    'sol': 'SOL', 'solana': 'SOL',
    'bnb': 'BNB', 'binance': 'BNB',
    'xrp': 'XRP', 'ripple': 'XRP',
    'ton': 'TON', 'toncoin': 'TON',
    'avax': 'AVAX', 'avalanche': 'AVAX',
    'doge': 'DOGE', 'dogecoin': 'DOGE',
    'ada': 'ADA', 'cardano': 'ADA',
    'trx': 'TRX', 'tron': 'TRX',
    'usdc': 'USDC'
  };

  for (const pattern of tokenPatterns) {
    const match = message.match(pattern);
    if (match) {
      const token = tokenMap[match[1].toLowerCase()];
      if (token && !tokens.includes(token)) {
        tokens.push(token);
      }
    }
  }

  return tokens;
}
