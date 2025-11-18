import React, { useState, useEffect, useRef } from 'react';
import { FaArrowUp, FaArrowDown, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { StarfieldBackground } from '../../components';
import { useAgwWallet } from '../deposit/hooks/useAgwWallet';
import { useGlobalPrices } from '../../context/PriceContext';
import { BuyPanel, SellPanel } from './components';
import { useMarketPrices } from './hooks/useMarketPrices';
import { SUPPORTED_TOKENS } from '../deposit/hooks/useAgwWallet';
import { useRecentTrades } from './hooks/useRecentTrades';
import { getPublicClient } from '../../utils/rpcProvider';

// TypeScript declaration for TradingView widget
declare global {
  interface Window {
    TradingView: any;
  }
}

// Top 10 Crypto by Market Cap (excluding stablecoins)
import { TOKENS } from '../../config/tokens';

type TradingPair = 'BTC/USDC' | 'ETH/USDC' | 'XRP/USDC' | 'BNB/USDC' | 'SOL/USDC' | 'DOGE/USDC' | 'ADA/USDC' | 'TRX/USDC' | 'AVAX/USDC' | 'TON/USDC';

interface PairData {
  symbol: string;
  name: string;
  coinGeckoId: string;
  decimals: number;
  tradingViewSymbol: string;
  logo: string;
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

// Helper function to map trading pair symbols to SUPPORTED_TOKENS keys
const getTokenKey = (symbol: string): keyof typeof SUPPORTED_TOKENS | null => {
  const symbolMap: Record<string, keyof typeof SUPPORTED_TOKENS | null> = {
    'BTC': 'BTC',
    'ETH': null, // ETH not deployed - no token available
    'SOL': 'SOL',
    'BNB': 'BNB',
    'XRP': 'XRP',
    'TON': 'TON',
    'AVAX': 'AVAX',
    'TRX': 'TRON', // TRX maps to TRON
    'ADA': 'CARDANO', // ADA maps to CARDANO
    'DOGE': 'DOGE',
  };
  return symbolMap[symbol] || null;
};

interface TradingPageProps {
  pair: TradingPair;
  onBack: () => void;
}

export const TradingPage: React.FC<TradingPageProps> = ({ pair: initialPair, onBack }) => {
  const { 
    ethBalance, 
    usdcBalance, 
    btcBalance, 
    solBalance,
    bnbBalance,
    xrpBalance,
    tonBalance,
    avaxBalance,
    tronBalance,
    cardanoBalance,
    dogeBalance,
    connected,
    address,
    refreshBalance
  } = useAgwWallet();
  const { prices, priceChanges } = useGlobalPrices();
  const { prices: marketPrices } = useMarketPrices();
  
  const [selectedPair, setSelectedPair] = useState<TradingPair>(initialPair || 'BTC/USDC');
  const [isLoading, setIsLoading] = useState(true);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [realTimePrice, setRealTimePrice] = useState(0);
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 10;
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState('');
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetInstanceRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);

  // Get current token data
  const currentPairData = TRADING_PAIRS[selectedPair];
  const tokenKey = getTokenKey(currentPairData.symbol);
  const tokenAddress = tokenKey && SUPPORTED_TOKENS[tokenKey] ? SUPPORTED_TOKENS[tokenKey].address : null;

  // Fetch real trades from blockchain - only user's trades
  const { trades: recentTrades, loading: tradesLoading, refetch: refetchTrades } = useRecentTrades(
    tokenAddress || '0x0000000000000000000000000000000000000000',
    currentPairData.symbol,
    currentPairData.decimals,
    connected && address ? address : undefined // Only fetch user trades if connected
  );

  // Update selected pair when prop changes
  useEffect(() => {
    if (initialPair && initialPair in TRADING_PAIRS) {
      setSelectedPair(initialPair);
    }
  }, [initialPair]);

  // Load TradingView script once with timeout and retry
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    let retryCount = 0;
    const MAX_RETRIES = 3;
    const LOAD_TIMEOUT = 15000; // 15 seconds

    const loadScript = () => {
      setIsLoading(true);
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      
      // Timeout handler
      const timeoutId = setTimeout(() => {
        console.error('TradingView script load timeout');
        script.remove();
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying TradingView script load (${retryCount}/${MAX_RETRIES})...`);
          setTimeout(loadScript, 2000); // Retry after 2 seconds
        } else {
          setIsLoading(false);
          console.error('Failed to load TradingView after retries');
        }
      }, LOAD_TIMEOUT);
      
      script.onload = () => {
        clearTimeout(timeoutId);
        scriptLoadedRef.current = true;
        setIsLoading(false);
        console.log('✅ TradingView script loaded successfully');
      };
      
      script.onerror = () => {
        clearTimeout(timeoutId);
        console.error('TradingView script load error');
        script.remove();
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying TradingView script load (${retryCount}/${MAX_RETRIES})...`);
          setTimeout(loadScript, 2000);
        } else {
          setIsLoading(false);
        }
      };
      
      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      // Cleanup handled by retry logic
    };
  }, []);

  // Initialize/Update TradingView widget when pair changes
  useEffect(() => {
    if (!chartContainerRef.current || !window.TradingView) return;

    // Clear existing widget container
    if (chartContainerRef.current) {
      chartContainerRef.current.innerHTML = '';
    }

    // Create fresh container for widget
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'tradingview_widget';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';
    chartContainerRef.current.appendChild(widgetContainer);

    // Create new widget instance with current pair immediately
    try {
      widgetInstanceRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: TRADING_PAIRS[selectedPair].tradingViewSymbol,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#000000',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: 'tradingview_widget',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        disabled_features: ['use_localstorage_for_settings'],
        enabled_features: ['study_templates'],
        overrides: {
          'paneProperties.background': 'rgba(0, 0, 0, 0)',
          'paneProperties.backgroundType': 'solid',
          'mainSeriesProperties.candleStyle.upColor': '#26a69a',
          'mainSeriesProperties.candleStyle.downColor': '#ef5350',
          'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
          'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
          'paneProperties.vertGridProperties.color': 'rgba(255, 255, 255, 0.03)',
          'paneProperties.horzGridProperties.color': 'rgba(255, 255, 255, 0.03)',
        },
      });
    } catch (error) {
      console.error('TradingView widget error:', error);
    }

    return () => {
      if (widgetInstanceRef.current && widgetInstanceRef.current.remove) {
        try {
          widgetInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [selectedPair, scriptLoadedRef.current]);

  // Map selected pair to global price
  useEffect(() => {
    const pairSymbol = TRADING_PAIRS[selectedPair].symbol.toLowerCase();
    const globalPrice = prices[pairSymbol as keyof typeof prices] || 0;
    const globalChange = priceChanges[pairSymbol as keyof typeof priceChanges] || 0;
    
    if (globalPrice > 0) {
      setRealTimePrice(globalPrice);
      setPriceChange24h(parseFloat(globalChange.toFixed(2)));
    }
  }, [selectedPair, prices, priceChanges]);

  // Reset to first page when switching pairs
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPair]);

  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = recentTrades.slice(indexOfFirstTrade, indexOfLastTrade);
  const totalPages = Math.ceil(recentTrades.length / tradesPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

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
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                  title="Back to Market List"
                >
                  <FaArrowLeft className="text-white text-lg" />
                </button>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent flex items-center gap-3">
                  <img 
                    src={TRADING_PAIRS[selectedPair].logo} 
                    alt={TRADING_PAIRS[selectedPair].name}
                    className="w-12 h-12 rounded-full"
                  />
                  {TRADING_PAIRS[selectedPair].name} Trading
                </h1>
              </div>
              <p className="text-gray-400 text-base ml-1">Real-time Trading • Base Sepolia Testnet</p>
              <div className="mt-2 inline-block px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <p className="text-blue-400 text-xs font-semibold">🔵 Testnet Mode • Gas sponsored</p>
              </div>
            </div>
            
            {/* Trading Pair Selector & Price Display */}
            <div className="flex gap-3 items-center">
              {/* Pair Selector */}
              <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.02] backdrop-blur-xl rounded-xl p-3 shadow-xl">
                <select
                  value={selectedPair}
                  onChange={(e) => {
                    const newPair = e.target.value as TradingPair;
                    setSelectedPair(newPair);
                  }}
                  className="bg-transparent text-white font-bold text-lg cursor-pointer focus:outline-none pr-8"
                >
                  <option value="BTC/USDC" className="bg-gray-900">BTC/USDC</option>
                  <option value="ETH/USDC" className="bg-gray-900">ETH/USDC</option>
                  <option value="XRP/USDC" className="bg-gray-900">XRP/USDC</option>
                  <option value="BNB/USDC" className="bg-gray-900">BNB/USDC</option>
                  <option value="SOL/USDC" className="bg-gray-900">SOL/USDC</option>
                  <option value="DOGE/USDC" className="bg-gray-900">DOGE/USDC</option>
                  <option value="ADA/USDC" className="bg-gray-900">ADA/USDC</option>
                  <option value="TRX/USDC" className="bg-gray-900">TRX/USDC</option>
                  <option value="AVAX/USDC" className="bg-gray-900">AVAX/USDC</option>
                  <option value="TON/USDC" className="bg-gray-900">TON/USDC</option>
                </select>
              </div>
              
              {/* Current Price Display */}
              <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.02] backdrop-blur-xl rounded-xl p-5 shadow-xl">
                <div className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Current Price</div>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    ${realTimePrice.toFixed(2)}
                  </span>
                  <span className={`flex items-center gap-1.5 text-base font-bold px-3 py-1 rounded-lg ${
                    priceChange24h >= 0 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {priceChange24h >= 0 ? <FaArrowUp className="text-sm" /> : <FaArrowDown className="text-sm" />}
                    {Math.abs(priceChange24h).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Trading Interface */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Left Column - Place Order */}
          <div className="lg:col-span-4">
            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.01] backdrop-blur-sm rounded-2xl p-5 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-7 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                Place Order
              </h3>
              
              {!connected && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-xs font-semibold">⚠ Connect wallet to trade</p>
                </div>
              )}

              {/* Buy/Sell Toggle */}
              <div className="flex gap-2 mb-4 p-1.5 bg-black/40 rounded-xl">
                <button
                  onClick={() => setOrderType('buy')}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all duration-300 ${
                    orderType === 'buy'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50 scale-105'
                      : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setOrderType('sell')}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all duration-300 ${
                    orderType === 'sell'
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/50 scale-105'
                      : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* Buy or Sell Panel */}
              {orderType === 'buy' ? (
                <BuyPanel
                  tokenAddress={(() => {
                    const key = getTokenKey(TRADING_PAIRS[selectedPair].symbol);
                    return key ? SUPPORTED_TOKENS[key]?.address || '' : '';
                  })()}
                  tokenSymbol={TRADING_PAIRS[selectedPair].symbol}
                  tokenDecimals={TRADING_PAIRS[selectedPair].decimals}
                  currentPrice={marketPrices[TRADING_PAIRS[selectedPair].symbol]?.price || realTimePrice}
                  usdcBalance={usdcBalance}
                  onSuccess={async (txHash) => {
                    setSuccessTxHash(txHash);
                    setShowSuccessToast(true);
                    
                    // Wait for transaction confirmation before refreshing
                    try {
                      // Use singleton publicClient
                      const publicClient = getPublicClient();
                      
                      console.log('⏳ Waiting for transaction confirmation...');
                      await publicClient.waitForTransactionReceipt({ 
                        hash: txHash as `0x${string}`,
                        confirmations: 2,
                      });
                      console.log('✅ Transaction confirmed, refreshing balances...');
                      
                      // Refresh balances after confirmation
                      await refreshBalance();
                      console.log('✅ Balances refreshed');
                      
                      // Refresh trade history immediately
                      refetchTrades();
                      console.log('✅ Trade history refreshed');
                    } catch (err) {
                      console.error('Error waiting for confirmation:', err);
                      // Still try to refresh after delay as fallback
                      setTimeout(() => {
                        refreshBalance();
                        refetchTrades();
                      }, 3000);
                    }
                    
                    setTimeout(() => setShowSuccessToast(false), 5000);
                  }}
                />
              ) : (
                <SellPanel
                  tokenAddress={(() => {
                    const key = getTokenKey(TRADING_PAIRS[selectedPair].symbol);
                    return key ? SUPPORTED_TOKENS[key]?.address || '' : '';
                  })()}
                  tokenSymbol={TRADING_PAIRS[selectedPair].symbol}
                  tokenDecimals={TRADING_PAIRS[selectedPair].decimals}
                  currentPrice={marketPrices[TRADING_PAIRS[selectedPair].symbol]?.price || realTimePrice}
                  tokenBalance={(() => {
                    const symbol = TRADING_PAIRS[selectedPair].symbol;
                    switch(symbol) {
                      case 'BTC': return btcBalance;
                      case 'ETH': return ethBalance;
                      case 'SOL': return solBalance;
                      case 'BNB': return bnbBalance;
                      case 'XRP': return xrpBalance;
                      case 'TON': return tonBalance;
                      case 'AVAX': return avaxBalance;
                      case 'TRX': return tronBalance;
                      case 'ADA': return cardanoBalance;
                      case 'DOGE': return dogeBalance;
                      default: return '0';
                    }
                  })()}
                  onSuccess={async (txHash) => {
                    setSuccessTxHash(txHash);
                    setShowSuccessToast(true);
                    
                    // Wait for transaction confirmation before refreshing
                    try {
                      // Use singleton publicClient
                      const publicClient = getPublicClient();
                      
                      console.log('⏳ Waiting for transaction confirmation...');
                      await publicClient.waitForTransactionReceipt({ 
                        hash: txHash as `0x${string}`,
                        confirmations: 2,
                      });
                      console.log('✅ Transaction confirmed, refreshing balances...');
                      
                      // Refresh balances after confirmation
                      await refreshBalance();
                      console.log('✅ Balances refreshed');
                      
                      // Refresh trade history immediately
                      refetchTrades();
                      console.log('✅ Trade history refreshed');
                    } catch (err) {
                      console.error('Error waiting for confirmation:', err);
                      // Still try to refresh after delay as fallback
                      setTimeout(() => {
                        refreshBalance();
                        refetchTrades();
                      }, 3000);
                    }
                    
                    setTimeout(() => setShowSuccessToast(false), 5000);
                  }}
                />
              )}
            </div>
          </div>

          {/* Right Column - Price Chart */}
          <div className="lg:col-span-8">
            {/* TradingView Price Chart */}
            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.01] backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl" style={{height: '500px'}}>
              <div className="p-3 border-b border-white/5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                  {selectedPair} Live Chart
                </h3>
              </div>
              
              {/* TradingView Chart Container */}
              <div className="relative" style={{height: 'calc(100% - 50px)', overflow: 'hidden'}}>
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
                    <p className="text-white text-sm font-semibold">Loading TradingView Chart...</p>
                  </div>
                )}
                <div ref={chartContainerRef} className="w-full h-full bg-black/20" />
              </div>
              
            </div>
          </div>
        </div>

        {/* Recent Trades Section */}
        <div className="mt-8 bg-gradient-to-br from-white/[0.02] to-white/[0.01] backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
              {connected ? `My Trade History - ${selectedPair}` : `Recent Trades - ${selectedPair}`}
            </h3>
            {tradesLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            )}
          </div>
          
          {/* Trades Table */}
          <div className="overflow-x-auto">
            {recentTrades.length === 0 && !tradesLoading ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-2">📊</div>
                {connected ? (
                  <>
                    <p className="text-gray-400">You haven't made any trades yet</p>
                    <p className="text-xs text-gray-500 mt-1">Start trading to see your history!</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400">Connect wallet to see your trade history</p>
                    <p className="text-xs text-gray-500 mt-1">Your trades will appear here</p>
                  </>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-black/20">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Price (USDC)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount ({TRADING_PAIRS[selectedPair].symbol})</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Total (USDC)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-white">
                        ${trade.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-300">
                        {trade.amount.toFixed(TRADING_PAIRS[selectedPair].decimals === 8 ? 6 : TRADING_PAIRS[selectedPair].decimals === 18 ? 4 : 2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-300">
                        ${trade.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {trade.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          trade.type === 'buy' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <a
                          href={trade.explorerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline decoration-dotted underline-offset-2 transition-colors flex items-center gap-1"
                        >
                          View
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {indexOfFirstTrade + 1} to {Math.min(indexOfLastTrade, recentTrades.length)} of {recentTrades.length} trades
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-semibold bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-semibold bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                ✓
              </div>
              <div>
                <p className="font-bold">Transaction Submitted!</p>
                <p className="text-xs opacity-90">TxHash: {successTxHash.substring(0, 10)}...</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
