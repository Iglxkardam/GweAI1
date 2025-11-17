/**
 * Hook to fetch real-time cryptocurrency prices for all top 10 coins
 * Uses CoinGecko API (same data source as TradingView, no CORS issues)
 */

import { useState, useEffect } from 'react';

interface PriceData {
  // Top 10 cryptocurrencies
  btc: number;
  eth: number;
  xrp: number;
  bnb: number;
  sol: number;
  doge: number;
  ada: number;
  trx: number;
  avax: number;
  ton: number;
  // Stablecoins
  usdc: number;
  usdt: number;
  // Status
  loading: boolean;
  error: string | null;
}

// Cache for price data
let cachedPrices: PriceData | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10000; // 10 seconds cache for real-time updates

export const useCryptoPrice = (): PriceData => {
  const [prices, setPrices] = useState<PriceData>({
    // Fallback prices (realistic Nov 2025 values)
    btc: 95000,
    eth: 3200,
    xrp: 1.45,
    bnb: 620,
    sol: 240,
    doge: 0.38,
    ada: 1.05,
    trx: 0.20,
    avax: 42,
    ton: 5.50,
    usdc: 1,
    usdt: 1,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchPrices = async () => {
      const now = Date.now();
      
      // Use cache if available and fresh
      if (cachedPrices && (now - lastFetchTime) < CACHE_DURATION) {
        setPrices(cachedPrices);
        return;
      }

      try {
        // Fetch all crypto prices from CoinGecko
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,binancecoin,solana,dogecoin,cardano,tron,avalanche-2,the-open-network,usd-coin,tether&vs_currencies=usd'
        );
        
        const data = await response.json();
        
        const newPrices = {
          btc: data.bitcoin?.usd || 95000,
          eth: data.ethereum?.usd || 3200,
          xrp: data.ripple?.usd || 1.45,
          bnb: data.binancecoin?.usd || 620,
          sol: data.solana?.usd || 240,
          doge: data.dogecoin?.usd || 0.38,
          ada: data.cardano?.usd || 1.05,
          trx: data.tron?.usd || 0.20,
          avax: data['avalanche-2']?.usd || 42,
          ton: data['the-open-network']?.usd || 5.50,
          usdc: data['usd-coin']?.usd || 1,
          usdt: data.tether?.usd || 1,
          loading: false,
          error: null,
        };
        
        // Update cache
        cachedPrices = newPrices;
        lastFetchTime = now;
        setPrices(newPrices);
      } catch (error) {
        console.error('Failed to fetch crypto prices from CoinGecko:', error);
        const fallbackPrices = {
          btc: 95000,
          eth: 3200,
          xrp: 1.45,
          bnb: 620,
          sol: 240,
          doge: 0.38,
          ada: 1.05,
          trx: 0.20,
          avax: 42,
          ton: 5.50,
          usdc: 1,
          usdt: 1,
          loading: false,
          error: 'Using fallback prices',
        };
        setPrices(fallbackPrices);
        if (!cachedPrices) {
          cachedPrices = fallbackPrices;
        }
      }
    };

    fetchPrices();

    // Refresh prices every 10 seconds for real-time updates (CoinGecko rate limit friendly)
    const interval = setInterval(fetchPrices, 10000);

    return () => clearInterval(interval);
  }, []);

  return prices;
};
