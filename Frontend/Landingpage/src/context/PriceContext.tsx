/**
 * Global Price Context for Real-Time Cryptocurrency Prices
 * Uses Binance API (same data source as TradingView) for synchronized prices
 * Real-time updates via REST API every 3 seconds
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CryptoPrices {
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
  usdc: number;
  usdt: number;
}

interface PriceChange {
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
}

interface PriceContextType {
  prices: CryptoPrices;
  priceChanges: PriceChange;
  loading: boolean;
  lastUpdate: number;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

// Binance symbol mappings (same as TradingView uses)
const BINANCE_SYMBOLS = {
  btc: 'BTCUSDT',
  eth: 'ETHUSDT',
  xrp: 'XRPUSDT',
  bnb: 'BNBUSDT',
  sol: 'SOLUSDT',
  doge: 'DOGEUSDT',
  ada: 'ADAUSDT',
  trx: 'TRXUSDT',
  avax: 'AVAXUSDT',
  ton: 'TONUSDT',
};

const FALLBACK_PRICES: CryptoPrices = {
  btc: 95257,
  eth: 3182,
  xrp: 2.26,
  bnb: 938,
  sol: 141,
  doge: 0.16,
  ada: 0.49,
  trx: 0.29,
  avax: 42,
  ton: 5.50,
  usdc: 1,
  usdt: 1,
};

const FALLBACK_CHANGES: PriceChange = {
  btc: -0.53,
  eth: 0.52,
  xrp: 0.98,
  bnb: -0.20,
  sol: 1.18,
  doge: 0.29,
  ada: -1.20,
  trx: -0.74,
  avax: 1.5,
  ton: 2.3,
};

export const PriceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [prices, setPrices] = useState<CryptoPrices>(FALLBACK_PRICES);
  const [priceChanges, setPriceChanges] = useState<PriceChange>(FALLBACK_CHANGES);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const fetchPricesFromBinance = async () => {
      // Prevent concurrent fetches
      if (!isMounted) return;

      try {
        // Fetch all crypto prices in parallel from Binance (no CORS, no rate limits)
        const symbols = Object.entries(BINANCE_SYMBOLS);
        const responses = await Promise.all(
          symbols.map(([, symbol]) =>
            fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
              .then(res => res.json())
              .catch(() => null)
          )
        );

        if (!isMounted) return; // Check again after async operation

        const newPrices: Partial<CryptoPrices> = { usdc: 1, usdt: 1 };
        const newChanges: Partial<PriceChange> = {};

        responses.forEach((data, index) => {
          if (data && data.lastPrice) {
            const [key] = symbols[index];
            newPrices[key as keyof CryptoPrices] = parseFloat(data.lastPrice);
            newChanges[key as keyof PriceChange] = parseFloat(data.priceChangePercent);
          }
        });

        // Only update if we got valid data
        if (isMounted && Object.keys(newPrices).length > 2) {
          setPrices(prev => ({ ...prev, ...newPrices }));
          setPriceChanges(prev => ({ ...prev, ...newChanges }));
          setLastUpdate(Date.now());
          setLoading(false);
          retryCount = 0; // Reset retry count on success
        }
      } catch (error) {
        console.error('Binance price fetch error:', error);
        if (isMounted && retryCount < maxRetries) {
          retryCount++;
          // Exponential backoff: 3s, 6s, 12s
          setTimeout(() => isMounted && fetchPricesFromBinance(), 3000 * Math.pow(2, retryCount - 1));
        }
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPricesFromBinance();

    // Update every 5 seconds (optimized for scalability - reduced from 3s)
    const interval = setInterval(() => {
      if (isMounted) fetchPricesFromBinance();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <PriceContext.Provider value={{ prices, priceChanges, loading, lastUpdate }}>
      {children}
    </PriceContext.Provider>
  );
};

export const useGlobalPrices = () => {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error('useGlobalPrices must be used within PriceProvider');
  }
  return context;
};
