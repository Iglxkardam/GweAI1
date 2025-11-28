/**
 * Query Router - Routes user queries to appropriate handlers
 * Prevents unnecessary AI calls for simple operations
 */

export type QueryType = 
  | 'portfolio'      // Balance/holdings queries
  | 'trade'          // Buy/sell/swap commands
  | 'dca'            // Dollar-cost averaging setup
  | 'price'          // Price information queries
  | 'general';       // General conversation/advice

export interface QueryRoute {
  type: QueryType;
  confidence: number; // 0-100
  extractedData?: any;
}

/**
 * Smart query router with confidence scoring
 */
export function routeQuery(userInput: string): QueryRoute {
  const input = userInput.toLowerCase().trim();
  
  // Portfolio queries (highest priority - no AI needed)
  const portfolioPatterns = [
    // Direct balance questions
    /\b(how much|how many|what('s| is) (my|the)|show (my|me))\s+(btc|eth|sol|bnb|usdc|avax|xrp|ton|doge|ada|trx|balance|portfolio|holdings?|wallet)/i,
    
    // "I have" questions
    /\b(do i have|i have|got any|have any)\s+(btc|eth|sol|bnb|usdc|avax|xrp|ton|doge|ada|trx|coins?|tokens?|crypto)/i,
    
    // Hindi/Hinglish
    /\b(kitna|kitne|mere pass|mera|dikhao|check karo)\s+(btc|eth|sol|balance|portfolio|wallet)/i,
    
    // Direct commands
    /\b(show|check|display|tell|get)\s+(my|me)?\s*(portfolio|balance|holdings?|wallet)/i,
  ];
  
  for (const pattern of portfolioPatterns) {
    if (pattern.test(input)) {
      return {
        type: 'portfolio',
        confidence: 95,
        extractedData: { query: userInput }
      };
    }
  }
  
  // Trade commands (AI parsing needed for amounts)
  const tradePatterns = [
    /\b(buy|purchase|get|kharido)\s+/i,
    /\b(sell|dump|becho)\s+/i,
    /\b(swap|exchange|trade|convert|badlo)\s+/i,
  ];
  
  for (const pattern of tradePatterns) {
    if (pattern.test(input)) {
      return {
        type: 'trade',
        confidence: 90,
        extractedData: { command: userInput }
      };
    }
  }
  
  // DCA/SIP queries
  const dcaPatterns = [
    /\b(dca|sip|dollar cost|systematic|recurring)\s+/i,
    /\b(invest|investing)\s+(\$?\d+|\d+\$)\s+(every|per|each)/i,
    /\b(auto(matic)?|schedule|repeat|monthly|weekly|daily)\s+(invest|buy|purchase)/i,
  ];
  
  for (const pattern of dcaPatterns) {
    if (pattern.test(input)) {
      return {
        type: 'dca',
        confidence: 85,
        extractedData: { strategy: userInput }
      };
    }
  }
  
  // Price queries
  const pricePatterns = [
    /\b(price|cost|value|worth)\s+of\s+(btc|eth|sol|bnb|xrp|ton|avax|doge|ada|trx)/i,
    /\b(btc|eth|sol|bnb|xrp|ton|avax|doge|ada|trx)\s+price/i,
    /\b(what('s| is) (the )?(current |live )?price)/i,
  ];
  
  for (const pattern of pricePatterns) {
    if (pattern.test(input)) {
      return {
        type: 'price',
        confidence: 80,
        extractedData: { query: userInput }
      };
    }
  }
  
  // Default to general conversation
  return {
    type: 'general',
    confidence: 50,
    extractedData: { query: userInput }
  };
}

/**
 * Check if query should skip AI and go directly to handler
 */
export function shouldSkipAI(route: QueryRoute): boolean {
  return route.type === 'portfolio' && route.confidence >= 90;
}

/**
 * Get system prompt based on query type
 */
export function getSystemPromptForQuery(queryType: QueryType): string {
  const baseContext = `You are IGL AI Agent, a professional crypto investment advisor for GweAI platform.`;
  
  switch (queryType) {
    case 'portfolio':
      return `${baseContext}

CRITICAL: When users ask about their portfolio, balances, or holdings:
1. NEVER say "I don't have access to your wallet"
2. ALWAYS respond: "Let me check your portfolio..." then use the portfolio service
3. You HAVE ACCESS to read public blockchain balances via connected wallet
4. Be confident: "I can see your wallet has..."

This is a READ-ONLY operation - you're just reading public blockchain data, no private keys involved.`;

    case 'trade':
      return `${baseContext}

You help users execute trades (buy/sell/swap). Parse their intent and create trade confirmation cards.
Focus on understanding amounts ($100 vs 100 tokens), tokens involved, and operation type.`;

    case 'dca':
      return `${baseContext}

You're an expert in Dollar-Cost Averaging (DCA) strategies. Help users create systematic investment plans.
Explain benefits, show calculations, and guide them through setup.`;

    case 'price':
      return `${baseContext}

You provide real-time price data and market analysis. Use Binance API for accurate prices.
Give context: 24h change, trading volume, and brief technical analysis.`;

    case 'general':
    default:
      return `${baseContext}

You provide comprehensive crypto investment advice, market analysis, and educational content.
Be bold, confident, and provide actionable recommendations. Never be passive or uncertain.`;
  }
}

/**
 * Validate query routing with detailed logging
 */
export function debugRoute(userInput: string): void {
  const route = routeQuery(userInput);
  console.log('🔍 Query Routing Debug:', {
    input: userInput,
    detectedType: route.type,
    confidence: `${route.confidence}%`,
    skipAI: shouldSkipAI(route),
    handler: shouldSkipAI(route) ? 'Direct Handler' : 'AI Processing'
  });
}
