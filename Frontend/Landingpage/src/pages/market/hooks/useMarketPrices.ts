/**
 * Market Prices Hook - Real-time Binance Prices
 * Fetches live prices for all supported tokens
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

// Binance symbol mapping
const BINANCE_SYMBOLS = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  SOL: 'SOLUSDT',
  BNB: 'BNBUSDT',
  XRP: 'XRPUSDT',
  TON: 'TONUSDT',
  AVAX: 'AVAXUSDT',
  TRX: 'TRXUSDT',
  ADA: 'ADAUSDT',
  DOGE: 'DOGEUSDT',
};

export const useMarketPrices = (symbols: string[] = Object.keys(BINANCE_SYMBOLS)) => {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      // Fetch all prices in parallel
      const symbolsToFetch = symbols.map(s => BINANCE_SYMBOLS[s as keyof typeof BINANCE_SYMBOLS]).filter(Boolean);
      
      const [tickerResponse, statsResponse] = await Promise.all([
        axios.get('https://api.binance.com/api/v3/ticker/price', {
          params: { symbols: JSON.stringify(symbolsToFetch) }
        }),
        axios.get('https://api.binance.com/api/v3/ticker/24hr', {
          params: { symbols: JSON.stringify(symbolsToFetch) }
        }),
      ]);

      const priceData = tickerResponse.data;
      const statsData = statsResponse.data;

      const newPrices: Record<string, TokenPrice> = {};

      symbols.forEach((symbol) => {
        const binanceSymbol = BINANCE_SYMBOLS[symbol as keyof typeof BINANCE_SYMBOLS];
        if (!binanceSymbol) return;

        const price = priceData.find((p: any) => p.symbol === binanceSymbol);
        const stats = statsData.find((s: any) => s.symbol === binanceSymbol);

        if (price && stats) {
          newPrices[symbol] = {
            symbol,
            price: parseFloat(price.price),
            change24h: parseFloat(stats.priceChangePercent),
            high24h: parseFloat(stats.highPrice),
            low24h: parseFloat(stats.lowPrice),
            volume24h: parseFloat(stats.volume),
          };
        }
      });

      setPrices(newPrices);
      setLoading(false);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch prices:', err);
      setError(err.message || 'Failed to fetch prices');
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchPrices();

    // Refresh prices every 5 seconds
    const interval = setInterval(fetchPrices, 5000);

    return () => clearInterval(interval);
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    refresh: fetchPrices,
  };
};
