/**
 * Centralized Token Configuration
 * Single source of truth for all token data across the application
 */

export interface TokenConfig {
  symbol: string;
  name: string;
  logo: string;
  decimals: number;
  coinGeckoId: string;
  tradingViewSymbol: string;
  description: string;
  color: string;
}

export const TOKENS: Record<string, TokenConfig> = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
    decimals: 8,
    coinGeckoId: 'bitcoin',
    tradingViewSymbol: 'BINANCE:BTCUSDT',
    description: '#1 by Market Cap',
    color: '#F7931A',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    decimals: 18,
    coinGeckoId: 'ethereum',
    tradingViewSymbol: 'BINANCE:ETHUSDT',
    description: '#2 by Market Cap',
    color: '#627EEA',
  },
  XRP: {
    symbol: 'XRP',
    name: 'XRP',
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png',
    decimals: 6,
    coinGeckoId: 'ripple',
    tradingViewSymbol: 'BINANCE:XRPUSDT',
    description: '#3 by Market Cap',
    color: '#23292F',
  },
  BNB: {
    symbol: 'BNB',
    name: 'BNB',
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
    decimals: 18,
    coinGeckoId: 'binancecoin',
    tradingViewSymbol: 'BINANCE:BNBUSDT',
    description: '#4 by Market Cap',
    color: '#F3BA2F',
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
    decimals: 9,
    coinGeckoId: 'solana',
    tradingViewSymbol: 'BINANCE:SOLUSDT',
    description: '#5 by Market Cap',
    color: '#14F195',
  },
  DOGE: {
    symbol: 'DOGE',
    name: 'Dogecoin',
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png',
    decimals: 8,
    coinGeckoId: 'dogecoin',
    tradingViewSymbol: 'BINANCE:DOGEUSDT',
    description: '#6 by Market Cap',
    color: '#C2A633',
  },
  ADA: {
    symbol: 'ADA',
    name: 'Cardano',
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png',
    decimals: 6,
    coinGeckoId: 'cardano',
    tradingViewSymbol: 'BINANCE:ADAUSDT',
    description: '#7 by Market Cap',
    color: '#0033AD',
  },
  TRX: {
    symbol: 'TRX',
    name: 'TRON',
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png',
    decimals: 6,
    coinGeckoId: 'tron',
    tradingViewSymbol: 'BINANCE:TRXUSDT',
    description: '#8 by Market Cap',
    color: '#EB0029',
  },
  AVAX: {
    symbol: 'AVAX',
    name: 'Avalanche',
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
    decimals: 18,
    coinGeckoId: 'avalanche-2',
    tradingViewSymbol: 'BINANCE:AVAXUSDT',
    description: '#9 by Market Cap',
    color: '#E84142',
  },
  TON: {
    symbol: 'TON',
    name: 'Toncoin',
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11419.png',
    decimals: 9,
    coinGeckoId: 'the-open-network',
    tradingViewSymbol: 'BINANCE:TONUSDT',
    description: '#10 by Market Cap',
    color: '#0088CC',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
    decimals: 6,
    coinGeckoId: 'usd-coin',
    tradingViewSymbol: 'BINANCE:USDCUSDT',
    description: 'Stablecoin',
    color: '#2775CA',
  },
};

/**
 * Get token config by symbol
 */
export const getTokenConfig = (symbol: string): TokenConfig | undefined => {
  return TOKENS[symbol.toUpperCase()];
};

/**
 * Get token logo by symbol
 */
export const getTokenLogo = (symbol: string): string => {
  return TOKENS[symbol.toUpperCase()]?.logo || '';
};

/**
 * Get token name by symbol
 */
export const getTokenName = (symbol: string): string => {
  return TOKENS[symbol.toUpperCase()]?.name || symbol;
};
