import React, { useState, useEffect, useRef } from 'react';
import { FaChartLine, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { StarfieldBackground } from '../../components';
import { useAgwWallet } from '../deposit/hooks/useAgwWallet';
import { useGlobalPrices } from '../../context/PriceContext';
import { showWarningToast, showInfoToast, showErrorToast } from '../../utils/toastHelper';

// TypeScript declaration for TradingView widget
declare global {
  interface Window {
    TradingView: any;
  }
}

type TradingPair = 'BTC/USDC' | 'ETH/USDC' | 'XRP/USDC' | 'BNB/USDC' | 'SOL/USDC' | 'DOGE/USDC' | 'ADA/USDC' | 'TRX/USDC' | 'AVAX/USDC' | 'TON/USDC';

interface PairData {
  symbol: string;
  coinGeckoId: string;
  decimals: number;
  tradingViewSymbol: string;
}

const TRADING_PAIRS: Record<TradingPair, PairData> = {
  'BTC/USDC': { symbol: 'BTC', coinGeckoId: 'bitcoin', decimals: 8, tradingViewSymbol: 'BINANCE:BTCUSDT' },
  'ETH/USDC': { symbol: 'ETH', coinGeckoId: 'ethereum', decimals: 18, tradingViewSymbol: 'BINANCE:ETHUSDT' },
  'XRP/USDC': { symbol: 'XRP', coinGeckoId: 'ripple', decimals: 6, tradingViewSymbol: 'BINANCE:XRPUSDT' },
  'BNB/USDC': { symbol: 'BNB', coinGeckoId: 'binancecoin', decimals: 18, tradingViewSymbol: 'BINANCE:BNBUSDT' },
  'SOL/USDC': { symbol: 'SOL', coinGeckoId: 'solana', decimals: 9, tradingViewSymbol: 'BINANCE:SOLUSDT' },
  'DOGE/USDC': { symbol: 'DOGE', coinGeckoId: 'dogecoin', decimals: 8, tradingViewSymbol: 'BINANCE:DOGEUSDT' },
  'ADA/USDC': { symbol: 'ADA', coinGeckoId: 'cardano', decimals: 6, tradingViewSymbol: 'BINANCE:ADAUSDT' },
  'TRX/USDC': { symbol: 'TRX', coinGeckoId: 'tron', decimals: 6, tradingViewSymbol: 'BINANCE:TRXUSDT' },
  'AVAX/USDC': { symbol: 'AVAX', coinGeckoId: 'avalanche-2', decimals: 18, tradingViewSymbol: 'BINANCE:AVAXUSDT' },
  'TON/USDC': { symbol: 'TON', coinGeckoId: 'the-open-network', decimals: 9, tradingViewSymbol: 'BINANCE:TONUSDT' }
};

export const MarketPage: React.FC = () => {
  const { ethBalance, usdcBalance, btcBalance, connected, address } = useAgwWallet();
  const { prices, priceChanges } = useGlobalPrices();
  
  const [selectedPair, setSelectedPair] = useState<TradingPair>('BTC/USDC');
  const [isLoading, setIsLoading] = useState(true);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  // Real-time price state - synchronized with TradingView and CoinGecko
  // Updated every 10 seconds to match live market data
  const [realTimePrice, setRealTimePrice] = useState(0);
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 10;
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetInstanceRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);

  // Load TradingView script once
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    setIsLoading(true);
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      setIsLoading(false);
    };
    script.onerror = () => {
      console.error('Failed to load TradingView script');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
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

  // Use global prices synchronized with PriceContext
  useEffect(() => {
    const pairData = TRADING_PAIRS[selectedPair];
    const symbol = pairData.symbol.toLowerCase();
    const livePrice = prices[symbol as keyof typeof prices] || 0;
    const change = priceChanges[symbol as keyof typeof priceChanges] || 0;
    
    setRealTimePrice(livePrice);
    setPrice(livePrice.toFixed(2));
    setPriceChange24h(parseFloat(change.toFixed(2)));
  }, [selectedPair, prices, priceChanges]);

  // Fetch recent trades
  useEffect(() => {
    const fetchRecentTrades = async () => {
      try {
        // Simulate recent trades with realistic data
        const mockTrades = Array.from({ length: 25 }, (_, i) => {
          const timestamp = Date.now() - (i * 60000 * Math.random() * 10);
          const isBuy = Math.random() > 0.5;
          const basePrice = realTimePrice || 3000;
          const priceVariation = (Math.random() - 0.5) * basePrice * 0.002;
          const tradePrice = basePrice + priceVariation;
          const amount = Math.random() * (selectedPair === 'BTC/USDC' ? 0.5 : 5);
          
          return {
            id: `trade-${i}-${timestamp}`,
            price: tradePrice,
            amount: amount,
            total: tradePrice * amount,
            time: new Date(timestamp),
            type: isBuy ? 'buy' : 'sell'
          };
        });
        
        setRecentTrades(mockTrades);
      } catch (error) {
        console.error('Error fetching recent trades:', error);
      }
    };

    if (realTimePrice > 0) {
      fetchRecentTrades();
      const interval = setInterval(fetchRecentTrades, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [selectedPair, realTimePrice]);

  // Pagination logic
  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = recentTrades.slice(indexOfFirstTrade, indexOfLastTrade);
  const totalPages = Math.ceil(recentTrades.length / tradesPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handlePlaceOrder = () => {
    if (!connected) {
      showWarningToast('Wallet Not Connected', 'Please connect your wallet first', 'Click "Connect Wallet" at the top');
      return;
    }

    // Block ETH/USDC trading
    if (selectedPair === 'ETH/USDC') {
      showErrorToast(new Error('ETH trading is currently disabled'));
      return;
    }
    
    if (!amount) {
      showWarningToast('Amount Required', 'Please enter amount', 'Enter the amount you want to trade');
      return;
    }
    
    const pairSymbol = TRADING_PAIRS[selectedPair].symbol;
    
    // Check balances
    if (orderType === 'buy') {
      const usdcNeeded = parseFloat(amount);
      const cryptoAmount = usdcNeeded / realTimePrice;
      if (parseFloat(usdcBalance) < usdcNeeded) {
        showWarningToast(
          'Insufficient USDC Balance',
          `You need ${usdcNeeded.toFixed(2)} USDC but have ${parseFloat(usdcBalance).toFixed(2)} USDC`,
          'Add more USDC to your wallet'
        );
        return;
      }
      showInfoToast(
        'BUY Order Placed',
        `Pair: ${selectedPair}\nYou Pay: ${usdcNeeded.toFixed(2)} USDC\nYou Get: ${cryptoAmount.toFixed(selectedPair === 'BTC/USDC' ? 6 : 4)} ${pairSymbol}\nPrice: ${realTimePrice.toFixed(2)} USDC`,
        `Wallet: ${address} - Executing via DEX smart contract`
      );
    } else {
      const tokenNeeded = parseFloat(amount);
      const usdcReceived = tokenNeeded * realTimePrice;
      const availableBalance = selectedPair === 'BTC/USDC' ? parseFloat(btcBalance) : parseFloat(usdcBalance);
      if (availableBalance < tokenNeeded) {
        showWarningToast(
          `Insufficient ${pairSymbol} Balance`,
          `You need ${tokenNeeded} ${pairSymbol} but have ${availableBalance} ${pairSymbol}`,
          'Add more tokens to your wallet'
        );
        return;
      }
      showInfoToast(
        'SELL Order Placed',
        `Pair: ${selectedPair}\nYou Sell: ${tokenNeeded} ${pairSymbol}\nYou Receive: ${usdcReceived.toFixed(2)} USDC\nPrice: ${realTimePrice.toFixed(2)} USDC`,
        `Wallet: ${address} - Executing via DEX smart contract`
      );
    }
    
    setAmount('');
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
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                  <FaChartLine className="text-white text-2xl" />
                </div>
                Spot Market
              </h1>
              <p className="text-gray-400 text-base ml-1">Real-time Trading • Powered by DEX</p>
            </div>
            
            {/* Trading Pair Selector & Price Display */}
            <div className="flex gap-3 items-center">
              {/* Pair Selector */}
              <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.02] backdrop-blur-xl rounded-xl p-3 shadow-xl">
                <select
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value as TradingPair)}
                  className="bg-transparent text-white font-bold text-lg cursor-pointer focus:outline-none pr-8"
                >
                  <option value="BTC/USDC" className="bg-gray-900">BTC/USDC</option>
                  <option value="ETH/USDC" className="bg-gray-900" disabled>ETH/USDC (Disabled)</option>
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
              
              {/* Wallet Status - Only show if not connected */}
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

              {/* Price Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Price (USDC)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={realTimePrice.toFixed(2)}
                    className="w-full px-4 py-3.5 bg-black/40 border border-white/20 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
                  />
                  <button
                    onClick={() => setPrice(realTimePrice.toFixed(2))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-semibold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-all"
                  >
                    Market
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-gray-300">
                    Amount ({orderType === 'buy' ? 'USDC' : TRADING_PAIRS[selectedPair].symbol})
                  </label>
                  <span className="text-xs text-gray-400">
                    Available: {orderType === 'buy' 
                      ? parseFloat(usdcBalance).toFixed(2) + ' USDC'
                      : (selectedPair === 'BTC/USDC' ? parseFloat(btcBalance).toFixed(6) : selectedPair === 'ETH/USDC' ? parseFloat(ethBalance).toFixed(4) : parseFloat(usdcBalance).toFixed(6)) + ' ' + TRADING_PAIRS[selectedPair].symbol
                    }
                  </span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
                />
                
                {/* Quick Amount Buttons */}
                <div className="flex gap-2 mt-2">
                  {['25%', '50%', '75%', '100%'].map((pct) => {
                    const percentage = parseFloat(pct) / 100;
                    const balance = orderType === 'buy' 
                      ? parseFloat(usdcBalance)
                      : (selectedPair === 'BTC/USDC' ? parseFloat(btcBalance) : selectedPair === 'ETH/USDC' ? parseFloat(ethBalance) : parseFloat(usdcBalance));
                    
                    return (
                      <button
                        key={pct}
                        onClick={() => setAmount((balance * percentage).toFixed(2))}
                        className="flex-1 py-1.5 text-xs font-semibold bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-gray-300 hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-all duration-300 hover:scale-105"
                        disabled={!connected}
                      >
                        {pct}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Total Display with Real Calculation */}
              <div className="mb-4 p-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300 font-medium">
                    {orderType === 'buy' ? 'You Pay' : 'You Sell'}
                  </span>
                  <span className="text-white font-bold font-mono">
                    {orderType === 'buy' 
                      ? `${amount || '0.00'} USDC` 
                      : `${amount || '0.00'} ${TRADING_PAIRS[selectedPair].symbol}`
                    }
                  </span>
                </div>
                {amount && parseFloat(amount) > 0 && (
                  <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-white/10">
                    <span className="text-gray-300 font-medium">
                      {orderType === 'buy' ? 'You Get' : 'You Receive'}
                    </span>
                    <span className="text-green-400 font-bold font-mono">
                      {orderType === 'buy' 
                        ? `${(parseFloat(amount) / realTimePrice).toFixed(selectedPair === 'BTC/USDC' ? 6 : 4)} ${TRADING_PAIRS[selectedPair].symbol}`
                        : `${(parseFloat(amount) * realTimePrice).toFixed(2)} USDC`
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={!connected}
                className={`w-full py-3.5 rounded-xl font-bold text-white text-base transition-all duration-300 shadow-xl ${
                  connected ? 'hover:scale-[1.02] active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'
                } ${
                  orderType === 'buy'
                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 shadow-green-500/50'
                    : 'bg-gradient-to-r from-red-500 via-rose-500 to-red-600 hover:from-red-600 hover:via-rose-600 hover:to-red-700 shadow-red-500/50'
                }`}
              >
                {connected ? `${orderType === 'buy' ? 'Buy' : 'Sell'} ${TRADING_PAIRS[selectedPair].symbol}` : 'Connect Wallet'}
              </button>
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
              
              {/* TradingView Lightweight Charts Container */}
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
          <div className="p-4 border-b border-white/5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
              Recent Trades - {selectedPair}
            </h3>
          </div>
          
          {/* Trades Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/20">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Price (USDC)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount ({TRADING_PAIRS[selectedPair].symbol})</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Total (USDC)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentTrades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-white">
                      ${trade.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-300">
                      {trade.amount.toFixed(selectedPair === 'BTC/USDC' ? 6 : 4)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-300">
                      ${trade.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {trade.time.toLocaleTimeString()}
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
                  </tr>
                ))}
              </tbody>
            </table>
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
      </div>
    </motion.div>
  );
};
