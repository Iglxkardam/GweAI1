/**
 * Binance Data Service for AI Agent Training
 * Fetches ALL Binance coins data for AI context
 */

export interface BinanceCoinData {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap?: number;
  category: string;
  rank?: number;
}

export interface BinanceMarketSummary {
  totalCoins: number;
  totalMarketCap: number;
  topGainers: BinanceCoinData[];
  topLosers: BinanceCoinData[];
  highVolume: BinanceCoinData[];
  allCoins: BinanceCoinData[];
  lastUpdate: string;
}

// Cache for Binance data (60 second TTL)
let binanceDataCache: BinanceMarketSummary | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 60 seconds

/**
 * Fetch ALL trading pairs from Binance
 * FREE API - No authentication needed!
 */
export async function fetchAllBinanceCoins(): Promise<BinanceMarketSummary> {
  const now = Date.now();
  
  // Return cache if fresh
  if (binanceDataCache && (now - lastFetchTime) < CACHE_DURATION) {
    return binanceDataCache;
  }

  try {
    // Fetch all 24hr ticker data from Binance (includes ALL coins)
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const allTickers = await response.json();
    
    // Filter only USDT pairs (most liquid and relevant)
    const usdtPairs = allTickers.filter((ticker: any) => 
      ticker.symbol.endsWith('USDT') && 
      parseFloat(ticker.quoteVolume) > 100000 // Min $100k daily volume
    );

    // Transform data
    const coins: BinanceCoinData[] = usdtPairs.map((ticker: any) => ({
      symbol: ticker.symbol.replace('USDT', ''),
      name: ticker.symbol.replace('USDT', ''),
      price: parseFloat(ticker.lastPrice),
      priceChange24h: parseFloat(ticker.priceChangePercent),
      volume24h: parseFloat(ticker.quoteVolume),
      category: getCoinCategory(ticker.symbol),
    }));

    // Sort by volume for relevance
    coins.sort((a, b) => b.volume24h - a.volume24h);

    // Extract top gainers/losers/volume
    const topGainers = [...coins]
      .sort((a, b) => b.priceChange24h - a.priceChange24h)
      .slice(0, 10);
    
    const topLosers = [...coins]
      .sort((a, b) => a.priceChange24h - b.priceChange24h)
      .slice(0, 10);
    
    const highVolume = [...coins]
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 20);

    const totalMarketCap = coins.reduce((sum, coin) => sum + (coin.volume24h * coin.price), 0);

    const summary: BinanceMarketSummary = {
      totalCoins: coins.length,
      totalMarketCap,
      topGainers,
      topLosers,
      highVolume,
      allCoins: coins,
      lastUpdate: new Date().toISOString(),
    };

    // Update cache
    binanceDataCache = summary;
    lastFetchTime = now;

    return summary;
  } catch (error) {
    console.error('Error fetching Binance data:', error);
    
    // Return empty data on error
    return {
      totalCoins: 0,
      totalMarketCap: 0,
      topGainers: [],
      topLosers: [],
      highVolume: [],
      allCoins: [],
      lastUpdate: new Date().toISOString(),
    };
  }
}

/**
 * Categorize coins by type
 */
function getCoinCategory(symbol: string): string {
  symbol = symbol.toUpperCase();
  
  // Layer 1 blockchains
  if (['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'ATOM', 'ALGO', 'NEAR', 'FTM', 'ONE', 'EGLD'].includes(symbol.replace('USDT', ''))) {
    return 'Layer 1';
  }
  
  // DeFi
  if (['UNI', 'AAVE', 'MKR', 'COMP', 'SNX', 'CRV', 'BAL', 'YFI', 'SUSHI', '1INCH'].includes(symbol.replace('USDT', ''))) {
    return 'DeFi';
  }
  
  // Layer 2
  if (['MATIC', 'ARB', 'OP', 'LRC', 'IMX', 'METIS'].includes(symbol.replace('USDT', ''))) {
    return 'Layer 2';
  }
  
  // Meme coins
  if (['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'BRETT'].includes(symbol.replace('USDT', ''))) {
    return 'Meme';
  }
  
  // AI tokens
  if (['FET', 'AGIX', 'OCEAN', 'RNDR', 'GRT', 'NMR'].includes(symbol.replace('USDT', ''))) {
    return 'AI';
  }
  
  // Gaming/Metaverse
  if (['AXS', 'SAND', 'MANA', 'ENJ', 'GALA', 'ILV', 'ALICE'].includes(symbol.replace('USDT', ''))) {
    return 'Gaming';
  }
  
  // Exchange tokens
  if (['BNB', 'FTT', 'OKB', 'HT', 'KCS', 'LEO'].includes(symbol.replace('USDT', ''))) {
    return 'Exchange';
  }
  
  // Oracles
  if (['LINK', 'BAND', 'TRB', 'API3'].includes(symbol.replace('USDT', ''))) {
    return 'Oracle';
  }
  
  return 'Other';
}

/**
 * Generate formatted data string for AI prompt injection
 */
export function formatBinanceDataForAI(data: BinanceMarketSummary): string {
  const timestamp = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return `
═══════════════════════════════════════════════
[BINANCE COMPLETE MARKET DATA - ${timestamp}]
═══════════════════════════════════════════════

📊 MARKET OVERVIEW:
• Total Tracked Coins: ${data.totalCoins}
• Total 24h Volume: $${(data.totalMarketCap / 1e9).toFixed(2)}B
• Data Source: Binance API (Real-time)

🚀 TOP 10 GAINERS (24h):
${data.topGainers.map((coin, i) => `${i + 1}. ${coin.symbol}: $${coin.price.toFixed(coin.price < 1 ? 4 : 2)} (+${coin.priceChange24h.toFixed(2)}%) | Vol: $${(coin.volume24h / 1e6).toFixed(1)}M`).join('\n')}

📉 TOP 10 LOSERS (24h):
${data.topLosers.map((coin, i) => `${i + 1}. ${coin.symbol}: $${coin.price.toFixed(coin.price < 1 ? 4 : 2)} (${coin.priceChange24h.toFixed(2)}%) | Vol: $${(coin.volume24h / 1e6).toFixed(1)}M`).join('\n')}

📈 HIGHEST VOLUME (Top 20):
${data.highVolume.map((coin, i) => `${i + 1}. ${coin.symbol}: $${coin.price.toFixed(coin.price < 1 ? 4 : 2)} | ${coin.priceChange24h >= 0 ? '+' : ''}${coin.priceChange24h.toFixed(2)}% | Vol: $${(coin.volume24h / 1e6).toFixed(1)}M | ${coin.category}`).join('\n')}

💡 FULL COIN LIST (Top 100 by Volume):
${data.allCoins.slice(0, 100).map((coin, i) => `${i + 1}. ${coin.symbol}: $${coin.price.toFixed(coin.price < 1 ? 4 : 2)} | ${coin.priceChange24h >= 0 ? '+' : ''}${coin.priceChange24h.toFixed(2)}% | Vol: $${(coin.volume24h / 1e6).toFixed(1)}M | ${coin.category}`).join('\n')}

═══════════════════════════════════════════════

🎯 HOW TO USE THIS DATA:

✅ ACCURATE RESPONSES:
- Use this data when users ask about ANY Binance-listed coin
- Provide real prices, not estimates
- Reference 24h performance data
- Mention trading volume for liquidity context
- Categorize coins properly (Layer 1, DeFi, Meme, etc.)

✅ WHAT YOU CAN NOW DO:
- Answer "What's the price of X?" for ANY Binance coin
- Compare multiple coins with real data
- Identify top performers by category
- Recommend coins based on volume/liquidity
- Provide complete market overview

❌ STILL CANNOT DO:
- Market cap calculations (not provided)
- Historical data beyond 24h (use "historically" disclaimers)
- Future price predictions (always disclaim)

═══════════════════════════════════════════════`;
}

/**
 * Search for specific coin in Binance data
 */
export function searchCoin(symbol: string, data: BinanceMarketSummary): BinanceCoinData | null {
  const searchSymbol = symbol.toUpperCase();
  return data.allCoins.find(coin => 
    coin.symbol === searchSymbol || 
    coin.name.toUpperCase() === searchSymbol
  ) || null;
}

/**
 * Get coins by category
 */
export function getCoinsByCategory(category: string, data: BinanceMarketSummary): BinanceCoinData[] {
  return data.allCoins.filter(coin => coin.category === category);
}
