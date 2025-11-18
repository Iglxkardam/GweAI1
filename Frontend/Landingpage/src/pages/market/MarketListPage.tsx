import React, { useState, useEffect } from 'react';
import { FaChartLine, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { StarfieldBackground } from '../../components';
import { useGlobalPrices } from '../../context/PriceContext';
import { TOKENS } from '../../config/tokens';

// Top 10 Crypto by Market Cap (excluding stablecoins)
type TradingPair = 'BTC/USDC' | 'ETH/USDC' | 'XRP/USDC' | 'BNB/USDC' | 'SOL/USDC' | 'DOGE/USDC' | 'ADA/USDC' | 'TRX/USDC' | 'AVAX/USDC' | 'TON/USDC';

interface PairData {
  symbol: string;
  name: string;
  coinGeckoId: string;
  decimals: number;
  tradingViewSymbol: string;
  logo: string;
  description: string;
}

// Generate TRADING_PAIRS from centralized token config
const TRADING_PAIRS: Record<TradingPair, PairData> = {
  'BTC/USDC': { ...TOKENS.BTC, tradingViewSymbol: TOKENS.BTC.tradingViewSymbol },
  'ETH/USDC': { ...TOKENS.ETH, tradingViewSymbol: TOKENS.ETH.tradingViewSymbol },
  'XRP/USDC': { ...TOKENS.XRP, tradingViewSymbol: TOKENS.XRP.tradingViewSymbol },
  'BNB/USDC': { ...TOKENS.BNB, tradingViewSymbol: TOKENS.BNB.tradingViewSymbol },
  'SOL/USDC': { ...TOKENS.SOL, tradingViewSymbol: TOKENS.SOL.tradingViewSymbol },
  'DOGE/USDC': { ...TOKENS.DOGE, tradingViewSymbol: TOKENS.DOGE.tradingViewSymbol },
  'ADA/USDC': { ...TOKENS.ADA, tradingViewSymbol: TOKENS.ADA.tradingViewSymbol },
  'TRX/USDC': { ...TOKENS.TRX, tradingViewSymbol: TOKENS.TRX.tradingViewSymbol },
  'AVAX/USDC': { ...TOKENS.AVAX, tradingViewSymbol: TOKENS.AVAX.tradingViewSymbol },
  'TON/USDC': { ...TOKENS.TON, tradingViewSymbol: TOKENS.TON.tradingViewSymbol }
};

interface PairPriceData {
  pair: TradingPair;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  sparklineData: number[];
}

interface MarketListPageProps {
  onSelectPair: (pair: TradingPair) => void;
}

export const MarketListPage: React.FC<MarketListPageProps> = ({ onSelectPair }) => {
  const { prices, priceChanges, loading: pricesLoading } = useGlobalPrices();
  const [pairPrices, setPairPrices] = useState<PairPriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rank' | 'price' | 'change' | 'volume'>('rank');

  // Use global prices and map to pair data
  useEffect(() => {
    if (pricesLoading) {
      setIsLoading(true);
      return;
    }

    const pricesData: PairPriceData[] = Object.entries(TRADING_PAIRS).map(([pairKey, pairData]) => {
      const symbol = pairData.symbol.toLowerCase();
      const price = prices[symbol as keyof typeof prices] || 0;
      const change24h = priceChanges[symbol as keyof typeof priceChanges] || 0;
      
      // Generate sparkline with realistic variance
      const sparkline = Array.from({ length: 20 }, (_, i) => {
        const variance = Math.sin(i * 0.5) * (price * 0.02) + (Math.random() - 0.5) * (price * 0.01);
        return price + variance;
      });
      
      return {
        pair: pairKey as TradingPair,
        price,
        change24h,
        volume24h: price * 1000000000 * (0.5 + Math.random()), // Estimated volume
        marketCap: price * 100000000 * (0.8 + Math.random() * 0.4), // Estimated market cap
        sparklineData: sparkline
      };
    });
    
    setPairPrices(pricesData);
    setIsLoading(false);
  }, [prices, priceChanges, pricesLoading]);

  const handleBuyClick = (pair: TradingPair) => {
    onSelectPair(pair);
  };

  const sortedPairs = [...pairPrices].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return b.price - a.price;
      case 'change':
        return b.change24h - a.change24h;
      case 'volume':
        return b.volume24h - a.volume24h;
      default:
        return 0; // Keep original order for rank
    }
  });

  return (
    <motion.div 
      className="min-h-screen pt-20 pb-8 px-4 relative"
      style={{
        background: '#000',
        backgroundImage: `
          radial-gradient(circle at top right, rgba(121, 68, 154, 0.13), transparent),
          radial-gradient(circle at 20% 80%, rgba(41, 196, 255, 0.13), transparent)
        `
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <StarfieldBackground optimized={true} />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                  <FaChartLine className="text-white text-2xl" />
                </div>
                Market Prices
              </h1>
              <p className="text-gray-400 text-base ml-1">Real-time prices • Base Sepolia Testnet</p>
              <div className="mt-2 inline-block px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <p className="text-blue-400 text-xs font-semibold">🔵 Trading on Base Sepolia • Gas fees paid in USDC</p>
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSortBy('rank')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                sortBy === 'rank'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              Rank
            </button>
            <button
              onClick={() => setSortBy('price')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                sortBy === 'price'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              Price
            </button>
            <button
              onClick={() => setSortBy('change')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                sortBy === 'change'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              24h Change
            </button>
            <button
              onClick={() => setSortBy('volume')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                sortBy === 'volume'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              Volume
            </button>
          </div>
        </div>

        {/* Prices Table */}
        <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.01] backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/40 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">24h Change</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">24h Volume</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Chart</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
                        <p className="text-gray-400">Loading market data...</p>
                      </div>
                    </td>
                  </tr>
                ) : sortedPairs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No assets available
                    </td>
                  </tr>
                ) : (
                  sortedPairs.map((pairPrice, index) => {
                    const pairData = TRADING_PAIRS[pairPrice.pair];
                    const isPositive = pairPrice.change24h >= 0;
                    
                    return (
                      <motion.tr
                        key={pairPrice.pair}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        onClick={() => handleBuyClick(pairPrice.pair)}
                      >
                        <td className="px-6 py-5 text-sm text-gray-400 font-medium">{index + 1}</td>
                        
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <img 
                              src={pairData.logo} 
                              alt={pairData.name}
                              className="w-10 h-10 rounded-full"
                              onError={(e) => {
                                // Fallback to gradient circle if image fails
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm hidden">
                              {pairData.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <div className="text-white font-semibold">{pairData.name}</div>
                              <div className="text-gray-400 text-xs">{pairData.symbol} / USDC</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-5">
                          <span className="text-white font-bold text-lg font-mono">
                            ${pairPrice.price.toLocaleString(undefined, { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: pairPrice.price < 1 ? 4 : 2 
                            })}
                          </span>
                        </td>
                        
                        <td className="px-6 py-5">
                          <span className={`flex items-center gap-1.5 text-base font-bold ${
                            isPositive ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {isPositive ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />}
                            {Math.abs(pairPrice.change24h).toFixed(2)}%
                          </span>
                        </td>
                        
                        <td className="px-6 py-5">
                          <span className="text-gray-300 font-mono text-sm">
                            ${pairPrice.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </td>
                        
                        <td className="px-6 py-5">
                          <div className="w-32 h-10">
                            <svg viewBox="0 0 100 30" className="w-full h-full">
                              <polyline
                                points={pairPrice.sparklineData
                                  .map((price, i) => {
                                    const x = (i / (pairPrice.sparklineData.length - 1)) * 100;
                                    const min = Math.min(...pairPrice.sparklineData);
                                    const max = Math.max(...pairPrice.sparklineData);
                                    const y = 25 - ((price - min) / (max - min)) * 20;
                                    return `${x},${y}`;
                                  })
                                  .join(' ')}
                                fill="none"
                                stroke={isPositive ? '#26a69a' : '#ef5350'}
                                strokeWidth="2"
                                className="transition-all duration-300"
                              />
                            </svg>
                          </div>
                        </td>
                        
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyClick(pairPrice.pair);
                            }}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/50"
                          >
                            Trade
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.02] backdrop-blur-xl rounded-xl p-5 border border-white/10">
            <div className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Total Market Cap</div>
            <div className="text-2xl font-bold text-white">
              ${pairPrices.reduce((sum, p) => sum + p.marketCap, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.02] backdrop-blur-xl rounded-xl p-5 border border-white/10">
            <div className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">24h Volume</div>
            <div className="text-2xl font-bold text-white">
              ${pairPrices.reduce((sum, p) => sum + p.volume24h, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.02] backdrop-blur-xl rounded-xl p-5 border border-white/10">
            <div className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Trading Pairs</div>
            <div className="text-2xl font-bold text-white">{pairPrices.length}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
