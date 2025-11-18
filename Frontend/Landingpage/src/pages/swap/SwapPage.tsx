import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaExchangeAlt, FaChevronDown, FaCog, FaArrowDown } from 'react-icons/fa';
import { StarfieldBackground } from '../../components';
import { useAgwWallet } from '../deposit/hooks/useAgwWallet';
import { BuyUSDCModal } from './components';
import { TOKENS } from '../../config/tokens';

interface Token {
  symbol: string;
  name: string;
  logo: string;
  balance: string;
  coinGeckoId: string;
}

interface MarketData {
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  ath: number;
  high24h: number;
  low24h: number;
}

interface ChartPoint {
  time: number;
  price: number;
}

export const SwapPage: React.FC = () => {
  // Get real wallet balances from AGW
  const { 
    ethBalance, usdcBalance, btcBalance, solBalance, bnbBalance,
    xrpBalance, tonBalance, avaxBalance, tronBalance, cardanoBalance, dogeBalance,
    connected, address 
  } = useAgwWallet();
  
  // Create tokens array with real balances (only when connected, otherwise show 0)
  const tokens: Token[] = [
    { 
      symbol: TOKENS.BTC.symbol, 
      name: TOKENS.BTC.name, 
      logo: TOKENS.BTC.logo, 
      balance: connected ? parseFloat(btcBalance).toFixed(8) : '0.00000000', 
      coinGeckoId: TOKENS.BTC.coinGeckoId 
    },
    { 
      symbol: TOKENS.ETH.symbol, 
      name: TOKENS.ETH.name, 
      logo: TOKENS.ETH.logo, 
      balance: connected ? parseFloat(ethBalance).toFixed(8) : '0.00000000', 
      coinGeckoId: TOKENS.ETH.coinGeckoId 
    },
    { 
      symbol: TOKENS.SOL.symbol, 
      name: TOKENS.SOL.name, 
      logo: TOKENS.SOL.logo, 
      balance: connected ? parseFloat(solBalance).toFixed(4) : '0.0000', 
      coinGeckoId: TOKENS.SOL.coinGeckoId 
    },
    { 
      symbol: TOKENS.BNB.symbol, 
      name: TOKENS.BNB.name, 
      logo: TOKENS.BNB.logo, 
      balance: connected ? parseFloat(bnbBalance).toFixed(8) : '0.00000000', 
      coinGeckoId: TOKENS.BNB.coinGeckoId 
    },
    { 
      symbol: TOKENS.XRP.symbol, 
      name: TOKENS.XRP.name, 
      logo: TOKENS.XRP.logo, 
      balance: connected ? parseFloat(xrpBalance).toFixed(2) : '0.00', 
      coinGeckoId: TOKENS.XRP.coinGeckoId 
    },
    { 
      symbol: TOKENS.TON.symbol, 
      name: TOKENS.TON.name, 
      logo: TOKENS.TON.logo, 
      balance: connected ? parseFloat(tonBalance).toFixed(4) : '0.0000', 
      coinGeckoId: TOKENS.TON.coinGeckoId 
    },
    { 
      symbol: TOKENS.AVAX.symbol, 
      name: TOKENS.AVAX.name, 
      logo: TOKENS.AVAX.logo, 
      balance: connected ? parseFloat(avaxBalance).toFixed(8) : '0.00000000', 
      coinGeckoId: TOKENS.AVAX.coinGeckoId 
    },
    { 
      symbol: TOKENS.TRX.symbol, 
      name: TOKENS.TRX.name, 
      logo: TOKENS.TRX.logo, 
      balance: connected ? parseFloat(tronBalance).toFixed(2) : '0.00', 
      coinGeckoId: TOKENS.TRX.coinGeckoId 
    },
    { 
      symbol: TOKENS.ADA.symbol, 
      name: TOKENS.ADA.name, 
      logo: TOKENS.ADA.logo, 
      balance: connected ? parseFloat(cardanoBalance).toFixed(2) : '0.00', 
      coinGeckoId: TOKENS.ADA.coinGeckoId 
    },
    { 
      symbol: TOKENS.DOGE.symbol, 
      name: TOKENS.DOGE.name, 
      logo: TOKENS.DOGE.logo, 
      balance: connected ? parseFloat(dogeBalance).toFixed(8) : '0.00000000', 
      coinGeckoId: TOKENS.DOGE.coinGeckoId 
    },
    { 
      symbol: TOKENS.USDC.symbol, 
      name: TOKENS.USDC.name, 
      logo: TOKENS.USDC.logo, 
      balance: connected ? parseFloat(usdcBalance).toFixed(2) : '0.00', 
      coinGeckoId: TOKENS.USDC.coinGeckoId 
    },
  ];

  const [fromToken, setFromToken] = useState<Token>(tokens[0]);
  const [toToken, setToToken] = useState<Token>(tokens[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [showFromTokens, setShowFromTokens] = useState(false);
  const [showToTokens, setShowToTokens] = useState(false);
  const [slippage] = useState('0.5');
  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [tokenPrices, setTokenPrices] = useState<{ [key: string]: number }>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  // Fetch real-time market data from CryptoCompare (fast, no CORS issues)
  const fetchMarketData = async (coinId: string) => {
    try {
      setLoading(true);
      const symbol = coinId === 'ethereum' ? 'ETH' : 'USDC';
      
      // Fetch current price and stats
      const priceResponse = await fetch(
        `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbol}&tsyms=USD`
      );
      const priceData = await priceResponse.json();
      
      if (priceData.Response === 'Error') {
        throw new Error(priceData.Message);
      }
      
      const coinData = priceData.RAW[symbol].USD;
      
      const marketInfo: MarketData = {
        price: coinData.PRICE,
        priceChange24h: coinData.CHANGEPCT24HOUR,
        marketCap: coinData.MKTCAP,
        volume24h: coinData.TOTALVOLUME24HTO,
        circulatingSupply: coinData.SUPPLY,
        ath: coinData.HIGHDAY, // Using today's high as approximation
        high24h: coinData.HIGH24HOUR,
        low24h: coinData.LOW24HOUR,
      };
      
      setMarketData(marketInfo);
    } catch (error) {
      console.error('Error fetching market data:', error);
      // Fallback to mock data if API fails
      setMarketData({
        price: coinId === 'ethereum' ? 2000 : 1,
        priceChange24h: 2.5,
        marketCap: coinId === 'ethereum' ? 240500000000 : 28300000000,
        volume24h: coinId === 'ethereum' ? 15200000000 : 6800000000,
        circulatingSupply: coinId === 'ethereum' ? 120200000 : 28300000000,
        ath: coinId === 'ethereum' ? 4891 : 1.00,
        high24h: coinId === 'ethereum' ? 2050 : 1.01,
        low24h: coinId === 'ethereum' ? 1950 : 0.99,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch chart data from CryptoCompare (fast hourly data)
  const fetchChartData = async (coinId: string) => {
    try {
      const symbol = coinId === 'ethereum' ? 'ETH' : 'USDC';
      
      // Fetch hourly data for last 24 hours
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${symbol}&tsym=USD&limit=24`
      );
      const data = await response.json();
      
      if (data.Response === 'Error') {
        throw new Error(data.Message);
      }
      
      const chartPoints: ChartPoint[] = data.Data.Data.map((point: any) => ({
        time: point.time * 1000, // Convert to milliseconds
        price: point.close
      }));
      
      setChartData(chartPoints);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Generate fallback mock data
      const generateMockData = () => {
        const data: ChartPoint[] = [];
        let basePrice = coinId === 'ethereum' ? 2000 : 1;
        for (let i = 0; i < 24; i++) {
          const variance = (Math.random() - 0.5) * basePrice * 0.02;
          basePrice += variance;
          data.push({
            time: Date.now() - (24 - i) * 3600000,
            price: basePrice
          });
        }
        return data;
      };
      setChartData(generateMockData());
    }
  };

  // Fetch real-time prices for swap calculation
  const fetchTokenPrices = async () => {
    try {
      setLoadingPrices(true);
      
      // Map token symbols for CryptoCompare API
      const symbolMap: { [key: string]: string } = {
        'ethereum': 'ETH',
        'usd-coin': 'USDC',
        'bitcoin': 'BTC',
        'tether': 'USDT'
      };
      
      // Get unique symbols
      const symbols = [...new Set(tokens.map(t => symbolMap[t.coinGeckoId] || t.symbol))].join(',');
      
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbols}&tsyms=USD`
      );
      const data = await response.json();
      
      if (data.Response === 'Error') {
        throw new Error(data.Message);
      }
      
      // Store prices with token symbol as key
      const prices: { [key: string]: number } = {};
      tokens.forEach(token => {
        const apiSymbol = symbolMap[token.coinGeckoId] || token.symbol;
        prices[token.symbol] = data[apiSymbol]?.USD || 0;
      });
      
      setTokenPrices(prices);
    } catch (error) {
      console.error('Error fetching token prices:', error);
      // Fallback prices if API fails
      setTokenPrices({
        'ETH': 2000,
        'USDC': 1,
        'BTC': 35000,
        'USDT': 1,
      });
    } finally {
      setLoadingPrices(false);
    }
  };

  // Fetch prices on component mount and refresh every 30 seconds
  useEffect(() => {
    fetchTokenPrices();
    const interval = setInterval(fetchTokenPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data when fromToken changes or chart is opened
  useEffect(() => {
    if (showChart && fromToken.coinGeckoId) {
      fetchMarketData(fromToken.coinGeckoId);
      fetchChartData(fromToken.coinGeckoId);
      
      // Refresh data every 30 seconds
      const interval = setInterval(() => {
        fetchMarketData(fromToken.coinGeckoId);
        fetchChartData(fromToken.coinGeckoId);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [showChart, fromToken]);

  const currentPrice = marketData?.price || 0;
  const priceChange = marketData?.priceChange24h?.toFixed(2) || '0.00';

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  // Update token balances when wallet balances change or connection status changes
  useEffect(() => {
    const updatedTokens = [
      { 
        symbol: TOKENS.ETH.symbol, 
        name: TOKENS.ETH.name, 
        logo: TOKENS.ETH.logo, 
        balance: connected ? parseFloat(ethBalance).toFixed(4) : '0.0000', 
        coinGeckoId: TOKENS.ETH.coinGeckoId 
      },
      { 
        symbol: TOKENS.USDC.symbol, 
        name: TOKENS.USDC.name, 
        logo: TOKENS.USDC.logo, 
        balance: connected ? parseFloat(usdcBalance).toFixed(2) : '0.00', 
        coinGeckoId: TOKENS.USDC.coinGeckoId 
      },
      { 
        symbol: TOKENS.BTC.symbol, 
        name: TOKENS.BTC.name, 
        logo: TOKENS.BTC.logo, 
        balance: connected ? parseFloat(btcBalance).toFixed(6) : '0.000000', 
        coinGeckoId: TOKENS.BTC.coinGeckoId 
      },
      { 
        symbol: 'USDT', 
        name: 'Tether', 
        logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png', 
        balance: '0.00', 
        coinGeckoId: 'tether' 
      },
    ];
    
    // Update fromToken and toToken with new balances while preserving selection
    setFromToken(prev => updatedTokens.find(t => t.symbol === prev.symbol) || updatedTokens[0]);
    setToToken(prev => updatedTokens.find(t => t.symbol === prev.symbol) || updatedTokens[1]);
  }, [ethBalance, usdcBalance, btcBalance, connected]);

  // Recalculate conversion when token prices change or tokens swap
  useEffect(() => {
    if (fromAmount && tokenPrices[fromToken.symbol] && tokenPrices[toToken.symbol]) {
      const fromPrice = tokenPrices[fromToken.symbol];
      const toPrice = tokenPrices[toToken.symbol];
      const convertedAmount = (parseFloat(fromAmount) * fromPrice) / toPrice;
      setToAmount(convertedAmount.toFixed(6));
    }
  }, [tokenPrices, fromToken, toToken]);

  const handleFromAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const regex = /^[0-9]*\.?[0-9]*$/;
    
    if (regex.test(value) || value === '') {
      setFromAmount(value);
      
      // Calculate conversion using real-time prices
      if (value && !isNaN(parseFloat(value))) {
        const fromPrice = tokenPrices[fromToken.symbol] || 0;
        const toPrice = tokenPrices[toToken.symbol] || 1;
        
        if (fromPrice > 0 && toPrice > 0) {
          // Convert: fromAmount * fromPrice / toPrice = toAmount
          const convertedAmount = (parseFloat(value) * fromPrice) / toPrice;
          setToAmount(convertedAmount.toFixed(6));
        } else {
          setToAmount('');
        }
      } else {
        setToAmount('');
      }
    }
  };

  return (
    <div 
      className="min-h-screen pt-20 pb-8 px-4 relative swap-page-container"
      style={{
        background: '#000',
        backgroundImage: `
          radial-gradient(circle at top right, rgba(121, 68, 154, 0.13), transparent),
          radial-gradient(circle at 20% 80%, rgba(41, 196, 255, 0.13), transparent)
        `
      }}
    >
      <StarfieldBackground optimized={true} />
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header - Responsive */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <FaExchangeAlt className="text-gray-300 text-2xl sm:text-3xl" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Token Swap
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg px-4">
            Swap tokens instantly with best rates
          </p>
          
          {/* Wallet Address Display */}
          {connected && address && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 inline-flex items-center space-x-2 bg-white/[0.05] backdrop-blur-sm px-4 py-2 rounded-full border border-white/[0.1]"
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-gray-300 text-xs sm:text-sm font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <span className="text-green-400 text-xs">Connected</span>
            </motion.div>
          )}
        </motion.div>

        {/* Swap Interface - Larger & More Transparent */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-transparent backdrop-blur-sm rounded-2xl border-0 p-4 sm:p-5 max-w-xl mx-auto"
        >
          {/* Swap/Buy Tabs and Settings */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 bg-white/5 rounded-lg p-1">
              <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-md">
                Swap
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBuyModal(true)}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Buy
              </motion.button>
            </div>
            <div className="flex items-center space-x-2">
              {loadingPrices && (
                <div className="w-4 h-4 border-2 border-white/20 border-t-green-400 rounded-full animate-spin"></div>
              )}
              <button 
                onClick={fetchTokenPrices}
                disabled={loadingPrices}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200 disabled:opacity-50"
                title="Refresh prices"
              >
                <span className="text-gray-400 hover:text-white text-base">&#x21bb;</span>
              </button>
              <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200">
                <FaCog className="text-gray-400 hover:text-white text-base" />
              </button>
            </div>
          </div>

          {/* Wallet Connection Status & Price Info */}
          <div className="space-y-2 mb-4">
            {/* Wallet Connection Warning */}
            {!connected && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 flex items-center justify-between text-sm"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400">⚠️</span>
                  <span className="text-yellow-300">
                    Wallet not connected - Using default balances
                  </span>
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem('currentPage', 'deposit');
                    window.location.reload();
                  }}
                  className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg text-yellow-300 text-xs font-medium transition-all"
                >
                  Connect Wallet
                </button>
              </motion.div>
            )}

           
          </div>

          {/* From Token Section - Larger */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Sell</span>
              <span className="text-sm text-gray-400">Balance: {fromToken.balance}</span>
            </div>
            
            <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl border border-white/[0.08] p-4 hover:border-white/[0.12] transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={fromAmount}
                    onChange={(e) => handleFromAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent border-none outline-none text-white text-2xl sm:text-3xl font-semibold placeholder-gray-600"
                  />
                  {fromAmount && tokenPrices[fromToken.symbol] && (
                    <p className="text-gray-400 text-sm mt-1">
                      ≈ ${(parseFloat(fromAmount) * tokenPrices[fromToken.symbol]).toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => setShowFromTokens(!showFromTokens)}
                  className="flex items-center bg-white/[0.08] hover:bg-white/[0.12] px-3 py-2 rounded-xl border border-white/[0.15] transition-all duration-200 gap-2 flex-shrink-0"
                >
                  <img src={fromToken.logo} alt={fromToken.symbol} className="w-5 h-5" />
                  <span className="text-white font-semibold text-sm">{fromToken.symbol}</span>
                  <FaChevronDown className="text-gray-400 text-xs" />
                </button>
              </div>

              {showFromTokens && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-2 max-h-60 overflow-y-auto scrollable-area"
                >
                  {tokens.filter(t => t.symbol !== toToken.symbol).map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => {
                        setFromToken(token);
                        setShowFromTokens(false);
                      }}
                      className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <img src={token.logo} alt={token.symbol} className="w-8 h-8" />
                        <div className="text-left">
                          <p className="text-white font-semibold text-sm">{token.symbol}</p>
                          <p className="text-gray-400 text-xs">{token.name}</p>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm">{token.balance}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Swap Arrow Button - Centered */}
          <div className="flex justify-center -my-2 relative z-20">
            <button
              onClick={handleSwapTokens}
              className="p-2 bg-transparent hover:bg-white/[0.08] rounded-full transition-all duration-200"
            >
              <FaArrowDown className="text-gray-400 hover:text-white text-base transition-colors" />
            </button>
          </div>

          {/* To Token Section - Larger */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Buy</span>
              <span className="text-sm text-gray-400">Balance: {toToken.balance}</span>
            </div>
            
            <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl border border-white/[0.08] p-4 hover:border-white/[0.12] transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={toAmount}
                    readOnly
                    placeholder="0"
                    className="w-full bg-transparent border-none outline-none text-white text-2xl sm:text-3xl font-semibold placeholder-gray-600"
                  />
                  {toAmount && tokenPrices[toToken.symbol] && (
                    <p className="text-gray-400 text-sm mt-1">
                      ≈ ${(parseFloat(toAmount) * tokenPrices[toToken.symbol]).toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => setShowToTokens(!showToTokens)}
                  className="flex items-center bg-white/[0.08] hover:bg-white/[0.12] px-3 py-2 rounded-xl border border-white/[0.15] transition-all duration-200 gap-2 flex-shrink-0"
                >
                  <img src={toToken.logo} alt={toToken.symbol} className="w-5 h-5" />
                  <span className="text-white font-semibold text-sm">{toToken.symbol}</span>
                  <FaChevronDown className="text-gray-400 text-xs" />
                </button>
              </div>

              {showToTokens && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-2 max-h-60 overflow-y-auto scrollable-area"
                >
                  {tokens.filter(t => t.symbol !== fromToken.symbol).map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => {
                        setToToken(token);
                        setShowToTokens(false);
                      }}
                      className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <img src={token.logo} alt={token.symbol} className="w-8 h-8" />
                        <div className="text-left">
                          <p className="text-white font-semibold text-sm">{token.symbol}</p>
                          <p className="text-gray-400 text-xs">{token.name}</p>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm">{token.balance}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Swap Details - Larger */}
          {fromAmount && toAmount && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/20 p-3 mb-4 space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Rate</span>
                <span className="text-white">
                  1 {fromToken.symbol} ≈ {
                    fromAmount && toAmount 
                      ? (parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)
                      : tokenPrices[fromToken.symbol] && tokenPrices[toToken.symbol]
                        ? (tokenPrices[fromToken.symbol] / tokenPrices[toToken.symbol]).toFixed(6)
                        : '0.00'
                  } {toToken.symbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Slippage</span>
                <span className="text-white">{slippage}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Network Fee</span>
                <span className="text-white">~$2.50</span>
              </div>
            </motion.div>
          )}

          {/* Swap Button - Larger */}
          <button
            disabled={!fromAmount || !toAmount}
            className="w-full py-4 bg-white/[0.08] hover:bg-white/[0.12] disabled:bg-white/[0.03] disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl transition-all duration-200 border border-white/[0.12] hover:border-white/[0.2] disabled:border-white/[0.05]"
          >
            {!fromAmount || !toAmount ? 'Enter Amount' : 'Swap Tokens'}
          </button>

          {/* Expand Chart */}
          <button 
            onClick={() => setShowChart(!showChart)}
            className="w-full mt-3 flex items-center justify-center space-x-2 text-gray-400 hover:text-white text-sm py-2 transition-colors"
          >
            <span>📈</span>
            <span>{showChart ? 'Hide Chart' : 'Expand Chart'}</span>
          </button>
        </motion.div>

        {/* Chart Panel - Slides in from left */}
        <motion.div
          initial={{ x: -420, opacity: 0 }}
          animate={{ 
            x: showChart ? 0 : -420,
            opacity: showChart ? 1 : 0
          }}
          transition={{ 
            type: "spring",
            stiffness: 120,
            damping: 25
          }}
          className="fixed left-6 top-28 bottom-8 w-[340px] z-50 pointer-events-none"
          style={{ display: showChart ? 'block' : 'none' }}
        >
          <div className="h-full bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/[0.15] p-4 flex flex-col pointer-events-auto overflow-y-auto shadow-2xl"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.1)'
            }}
          >
            {/* Chart Header */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/[0.08]">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/[0.1]">
                    <img src={fromToken.logo} alt={fromToken.symbol} className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{fromToken.symbol}/{toToken.symbol}</h3>
                </div>
                <button
                  onClick={() => setShowChart(false)}
                  className="p-1.5 bg-white/[0.05] hover:bg-white/[0.15] rounded-lg transition-all duration-200 border border-white/[0.1]"
                >
                  <span className="text-gray-400 hover:text-white text-sm">✕</span>
                </button>
              </div>
              
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white">
                  {marketData ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Loading...'}
                </p>
                <p className={`text-xs font-semibold ${parseFloat(priceChange) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {marketData ? (
                    <>
                      {parseFloat(priceChange) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(priceChange))}% (24h)
                    </>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </p>
              </div>
            </div>

            {/* Mini Chart Visualization */}
            <div className="flex-1 mb-3 relative bg-white/[0.02] rounded-xl border border-white/[0.08] p-3 overflow-hidden backdrop-blur-sm">
              {loading || chartData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-green-400 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-400">Loading chart data...</p>
                  </div>
                </div>
              ) : (
                <>
                  <svg 
                    width="100%" 
                    height="100%" 
                    className="absolute inset-0" 
                    viewBox="0 0 350 200" 
                    preserveAspectRatio="none"
                    onMouseMove={(e) => {
                      const svg = e.currentTarget;
                      const rect = svg.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const width = 350;
                      const padding = 20;
                      
                      // Calculate which data point we're hovering over
                      const dataIndex = Math.round(((x - padding) / (width - padding * 2)) * (chartData.length - 1));
                      const clampedIndex = Math.max(0, Math.min(chartData.length - 1, dataIndex));
                      
                      if (chartData[clampedIndex]) {
                        setHoveredPoint(chartData[clampedIndex]);
                        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredPoint(null);
                      setMousePosition(null);
                    }}
                  >
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={parseFloat(priceChange) >= 0 ? "#10b981" : "#ef4444"} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={parseFloat(priceChange) >= 0 ? "#10b981" : "#ef4444"} stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    
                    {/* Chart Line */}
                    <path
                      d={(() => {
                        const width = 350;
                        const height = 200;
                        const padding = 20;
                        const points = chartData.map((d, i) => {
                          const x = padding + (i / (chartData.length - 1)) * (width - padding * 2);
                          const minPrice = Math.min(...chartData.map(d => d.price));
                          const maxPrice = Math.max(...chartData.map(d => d.price));
                          const y = height - padding - ((d.price - minPrice) / (maxPrice - minPrice)) * (height - padding * 2);
                          return `${x},${y}`;
                        });
                        return `M ${points.join(' L ')}`;
                      })()}
                      stroke={parseFloat(priceChange) >= 0 ? "#10b981" : "#ef4444"}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Chart Area Fill */}
                    <path
                      d={(() => {
                        const width = 350;
                        const height = 200;
                        const padding = 20;
                        const points = chartData.map((d, i) => {
                          const x = padding + (i / (chartData.length - 1)) * (width - padding * 2);
                          const minPrice = Math.min(...chartData.map(d => d.price));
                          const maxPrice = Math.max(...chartData.map(d => d.price));
                          const y = height - padding - ((d.price - minPrice) / (maxPrice - minPrice)) * (height - padding * 2);
                          return `${x},${y}`;
                        });
                        const firstX = padding;
                        const lastX = padding + (width - padding * 2);
                        return `M ${firstX},${height - padding} L ${points.join(' L ')} L ${lastX},${height - padding} Z`;
                      })()}
                      fill="url(#chartGradient)"
                    />
                    
                    {/* Hover Line and Dot */}
                    {hoveredPoint && mousePosition && (() => {
                      const width = 350;
                      const height = 200;
                      const padding = 20;
                      const dataIndex = chartData.findIndex(d => d.time === hoveredPoint.time);
                      const x = padding + (dataIndex / (chartData.length - 1)) * (width - padding * 2);
                      const minPrice = Math.min(...chartData.map(d => d.price));
                      const maxPrice = Math.max(...chartData.map(d => d.price));
                      const y = height - padding - ((hoveredPoint.price - minPrice) / (maxPrice - minPrice)) * (height - padding * 2);
                      
                      return (
                        <>
                          {/* Vertical line */}
                          <line
                            x1={x}
                            y1={padding}
                            x2={x}
                            y2={height - padding}
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          {/* Dot on line */}
                          <circle
                            cx={x}
                            cy={y}
                            r="4"
                            fill={parseFloat(priceChange) >= 0 ? "#10b981" : "#ef4444"}
                            stroke="white"
                            strokeWidth="2"
                          />
                        </>
                      );
                    })()}
                  </svg>
                  
                  {/* Tooltip */}
                  {hoveredPoint && mousePosition && (
                    <div
                      className="absolute pointer-events-none z-10"
                      style={{
                        left: `${mousePosition.x + 10}px`,
                        top: `${mousePosition.y - 10}px`,
                        transform: mousePosition.x > 250 ? 'translateX(-110%)' : 'translateX(0)',
                      }}
                    >
                      <div className="bg-black/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 shadow-lg">
                        <p className="text-white font-bold text-sm">
                          ${hoveredPoint.price.toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {new Date(hoveredPoint.time).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Market Stats */}
            <div className="space-y-2.5">
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white/[0.02] rounded-lg p-2 border border-white/[0.05]">
                    <p className="text-[10px] text-gray-400 mb-1">Market Cap</p>
                    <p className="text-xs font-bold text-white">
                      {marketData ? `$${(marketData.marketCap / 1e9).toFixed(2)}B` : '-'}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-2 border border-white/[0.05]">
                    <p className="text-[10px] text-gray-400 mb-1">24h Volume</p>
                    <p className="text-xs font-bold text-white">
                      {marketData ? `$${(marketData.volume24h / 1e9).toFixed(2)}B` : '-'}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-2 border border-white/[0.05]">
                    <p className="text-[10px] text-gray-400 mb-1">Circulating Supply</p>
                    <p className="text-xs font-bold text-white">
                      {marketData ? `${(marketData.circulatingSupply / 1e6).toFixed(2)}M ${fromToken.symbol}` : '-'}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-2 border border-white/[0.05]">
                    <p className="text-[10px] text-gray-400 mb-1">All-Time High</p>
                    <p className="text-xs font-bold text-white">
                      {marketData ? `$${marketData.ath.toLocaleString()}` : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center space-x-1.5 bg-white/[0.03] rounded-lg p-1 border border-white/[0.08]">
                <button className="flex-1 px-2 py-1.5 text-[10px] font-semibold text-white bg-white/[0.12] rounded-md border border-white/[0.15] transition-all">
                  24H
                </button>
                <button className="flex-1 px-2 py-1.5 text-[10px] font-medium text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-md transition-all">
                  7D
                </button>
                <button className="flex-1 px-2 py-1.5 text-[10px] font-medium text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-md transition-all">
                  1M
                </button>
                <button className="flex-1 px-2 py-1.5 text-[10px] font-medium text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-md transition-all">
                  1Y
                </button>
              </div>

              {/* Price Stats */}
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-2.5 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
                  <span className="text-[10px] text-gray-400">24h High</span>
                  <span className="text-xs font-bold text-green-400">
                    {marketData ? `$${marketData.high24h.toLocaleString()}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
                  <span className="text-[10px] text-gray-400">24h Low</span>
                  <span className="text-xs font-bold text-red-400">
                    {marketData ? `$${marketData.low24h.toLocaleString()}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">24h Avg</span>
                  <span className="text-xs font-bold text-white">
                    {chartData.length > 0 
                      ? `$${(chartData.reduce((sum, d) => sum + d.price, 0) / chartData.length).toFixed(2)}`
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Swaps - Larger & Transparent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-transparent backdrop-blur-sm rounded-xl border-0 p-4 sm:p-5 max-w-xl mx-auto"
        >
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-white/[0.03] rounded-lg border border-white/[0.08] hover:border-white/[0.12] transition-colors cursor-default">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <span className="text-xl text-white brightness-150">Ξ</span>
                  <span className="text-sm text-gray-400">→</span>
                  <span className="text-xl text-white brightness-150">$</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">ETH → USDC</p>
                  <p className="text-gray-400 text-xs">2 hours ago</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium text-sm">1.5 ETH</p>
                <p className="text-green-400 text-xs">Completed</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white/[0.03] rounded-lg border border-white/[0.08] hover:border-white/[0.12] transition-colors cursor-default">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <span className="text-xl text-white brightness-150">₿</span>
                  <span className="text-sm text-gray-400">→</span>
                  <span className="text-xl text-white brightness-150">Ξ</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">BTC → ETH</p>
                  <p className="text-gray-400 text-xs">1 day ago</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium text-sm">0.05 BTC</p>
                <p className="text-green-400 text-xs">Completed</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Buy USDC Modal */}
      <BuyUSDCModal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} />
    </div>
  );
};
