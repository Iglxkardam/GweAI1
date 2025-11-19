import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaExchangeAlt, FaChevronDown, FaCog, FaArrowDown } from 'react-icons/fa';
import { StarfieldBackground } from '../../components';
import { useAgwWallet } from '../deposit/hooks/useAgwWallet';
import { BuyUSDCModal } from './components';
import { TOKENS } from '../../config/tokens';
import { useSwapContract } from './hooks/useSwapContract';
import { VERIFIED_TOKENS } from '../../config/contracts';
import { useSwapTransactions } from './hooks/useSwapTransactions';
import { formatUnits } from 'viem';
import { SUPPORTED_TOKENS } from '../deposit/hooks/useAgwWallet';

interface Token {
  symbol: string;
  name: string;
  logo: string;
  balance: string;
  coinGeckoId: string;
}

export const SwapPage: React.FC = () => {
  // Get real wallet balances from AGW
  const { 
    ethBalance, usdcBalance, btcBalance, solBalance, bnbBalance,
    xrpBalance, tonBalance, avaxBalance, tronBalance, cardanoBalance, dogeBalance,
    connected, address 
  } = useAgwWallet();
  
  // Swap contract hook
  const { executeSwap, getSwapQuote, loading: swapLoading, error: swapError, quote } = useSwapContract();
  
  // Fetch user's swap transactions
  const { transactions: swapTransactions, loading: transactionsLoading } = useSwapTransactions(address || undefined, connected);
  
  // Pagination for transactions
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  const totalPages = Math.ceil(swapTransactions.length / transactionsPerPage);
  const paginatedTransactions = swapTransactions.slice(
    (currentPage - 1) * transactionsPerPage,
    currentPage * transactionsPerPage
  );
  
  // Token address mapping
  const getTokenAddress = (symbol: string): string => {
    const addressMap: Record<string, string> = {
      'USDC': VERIFIED_TOKENS.USDC,
      'BTC': VERIFIED_TOKENS.BTC,
      'SOL': VERIFIED_TOKENS.SOL,
      'BNB': VERIFIED_TOKENS.BNB,
      'XRP': VERIFIED_TOKENS.XRP,
      'TON': VERIFIED_TOKENS.TON,
      'AVAX': VERIFIED_TOKENS.AVAX,
      'TRX': VERIFIED_TOKENS.TRON,
      'ADA': VERIFIED_TOKENS.CARDANO,
      'DOGE': VERIFIED_TOKENS.DOGE,
    };
    return addressMap[symbol] || '';
  };

  // Get token symbol from address - using SUPPORTED_TOKENS like trading page
  const getTokenSymbol = (address: string): string => {
    const addr = address.toLowerCase();
    
    // Create reverse mapping using SUPPORTED_TOKENS
    const symbolMap: Record<string, string> = {
      [SUPPORTED_TOKENS.BTC.address.toLowerCase()]: 'BTC',
      [SUPPORTED_TOKENS.SOL.address.toLowerCase()]: 'SOL',
      [SUPPORTED_TOKENS.BNB.address.toLowerCase()]: 'BNB',
      [SUPPORTED_TOKENS.XRP.address.toLowerCase()]: 'XRP',
      [SUPPORTED_TOKENS.TON.address.toLowerCase()]: 'TON',
      [SUPPORTED_TOKENS.AVAX.address.toLowerCase()]: 'AVAX',
      [SUPPORTED_TOKENS.TRON.address.toLowerCase()]: 'TRX',
      [SUPPORTED_TOKENS.CARDANO.address.toLowerCase()]: 'ADA',
      [SUPPORTED_TOKENS.DOGE.address.toLowerCase()]: 'DOGE',
      [SUPPORTED_TOKENS.USDC.address.toLowerCase()]: 'USDC',
    };
    
    return symbolMap[addr] || 'TOKEN';
  };

  // Format token amount with proper decimals
  const formatTokenAmount = (amount: string, symbol: string): string => {
    const decimals = TOKENS[symbol]?.decimals || 18;
    const formatted = formatUnits(BigInt(amount), decimals);
    return parseFloat(formatted).toFixed(decimals === 6 ? 2 : decimals === 8 ? 8 : 4);
  };

  // Get token logo URL for display
  const getTokenLogo = (symbol: string): string => {
    return TOKENS[symbol]?.logo || 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png';
  };

  // Create tokens array with real balances (only when connected, otherwise show 0)
  const tokens: Token[] = [
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
  ];

  const [fromToken, setFromToken] = useState<Token>(tokens[0]);
  const [toToken, setToToken] = useState<Token>(tokens[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [showFromTokens, setShowFromTokens] = useState(false);
  const [showToTokens, setShowToTokens] = useState(false);
  const [slippage] = useState('0.5');
  const [tokenPrices, setTokenPrices] = useState<{ [key: string]: number }>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);



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
  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  /**
   * Handle swap execution
   */
  const handleSwap = async () => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseFloat(fromAmount) > parseFloat(fromToken.balance)) {
      alert('Insufficient balance');
      return;
    }

    // Get token addresses
    const tokenInAddress = getTokenAddress(fromToken.symbol);
    const tokenOutAddress = getTokenAddress(toToken.symbol);

    if (!tokenInAddress || !tokenOutAddress) {
      alert('Token not supported for swap');
      return;
    }

    // Get token decimals
    const tokenInDecimals = TOKENS[fromToken.symbol]?.decimals || 18;
    const tokenOutDecimals = TOKENS[toToken.symbol]?.decimals || 18;

    console.log('🔄 Initiating swap...');
    console.log('From:', fromToken.symbol, fromAmount);
    console.log('To:', toToken.symbol);
    console.log('Token In Address:', tokenInAddress);
    console.log('Token Out Address:', tokenOutAddress);

    // Execute swap
    const txHash = await executeSwap({
      tokenInAddress,
      tokenOutAddress,
      amountIn: fromAmount,
      tokenInDecimals,
      tokenOutDecimals,
      slippageBps: parseInt((parseFloat(slippage) * 100).toString()), // Convert % to bps
    });

    if (txHash) {
      console.log('✅ Swap successful:', txHash);
      // Reset form
      setFromAmount('');
      setToAmount('');
      
      // Refresh balances (handled automatically by useAgwWallet)
    }
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

  // Fetch real swap quote from router (optional enhancement)
  useEffect(() => {
    const fetchQuote = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0) {
        setToAmount('');
        return;
      }

      const tokenInAddress = getTokenAddress(fromToken.symbol);
      const tokenOutAddress = getTokenAddress(toToken.symbol);

      if (!tokenInAddress || !tokenOutAddress || !connected) {
        // Fall back to price-based calculation
        return;
      }

      const tokenInDecimals = TOKENS[fromToken.symbol]?.decimals || 18;
      const tokenOutDecimals = TOKENS[toToken.symbol]?.decimals || 18;

      try {
        const quoteResult = await getSwapQuote({
          tokenInAddress,
          tokenOutAddress,
          amountIn: fromAmount,
          tokenInDecimals,
          tokenOutDecimals,
        });

        if (quoteResult) {
          setToAmount(quoteResult.amountOut);
        }
      } catch (err) {
        console.error('Failed to fetch quote:', err);
        // Keep the price-based calculation as fallback
      }
    };

    // Debounce quote fetching
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, toToken, connected, getSwapQuote]);

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
                      : '0.00'
                  } {toToken.symbol}
                </span>
              </div>
              {quote && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Protocol Fee</span>
                  <span className="text-white">
                    {parseFloat(quote.protocolFee).toFixed(6)} {toToken.symbol}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Slippage</span>
                <span className="text-white">{slippage}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Network Fee</span>
                <span className="text-white">~$0.50</span>
              </div>
              {quote && quote.route && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Route</span>
                  <span className="text-white text-xs">{quote.route}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Swap Button - Larger */}
          <button
            onClick={handleSwap}
            disabled={!fromAmount || !toAmount || swapLoading || !connected}
            className="w-full py-4 bg-white/[0.08] hover:bg-white/[0.12] disabled:bg-white/[0.03] disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl transition-all duration-200 border border-white/[0.12] hover:border-white/[0.2] disabled:border-white/[0.05]"
          >
            {swapLoading ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Swapping...</span>
              </span>
            ) : !connected ? (
              'Connect Wallet'
            ) : !fromAmount || !toAmount ? (
              'Enter Amount'
            ) : (
              'Swap Tokens'
            )}
          </button>
          
          {/* Error Message */}
          {swapError && (
            <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{swapError}</p>
            </div>
          )}
        </motion.div>

        {/* Recent Swaps - Real Transaction Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-br from-white/[0.02] to-white/[0.01] backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl max-w-6xl mx-auto"
        >
          <div className="p-4 border-b border-white/5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
              Recent Swaps
            </h3>
          </div>
          
          {!connected ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Connect your wallet to view swap history</p>
            </div>
          ) : transactionsLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading transactions...</p>
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No swap transactions yet</p>
              <p className="text-gray-500 text-xs mt-1">Your swap history will appear here</p>
            </div>
          ) : (
            <>
              {/* Swaps Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/20">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Pair</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount In</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount Out</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tx Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedTransactions.map((tx) => {
                      const tokenInSymbol = getTokenSymbol(tx.tokenIn);
                      const tokenOutSymbol = getTokenSymbol(tx.tokenOut);
                      const amountIn = formatTokenAmount(tx.amountIn, tokenInSymbol);
                      const amountOut = formatTokenAmount(tx.amountOut, tokenOutSymbol);
                      const txTime = new Date(tx.timestamp * 1000);
                      
                      return (
                        <tr key={tx.hash} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <img src={getTokenLogo(tokenInSymbol)} alt={tokenInSymbol} className="w-6 h-6 rounded-full" />
                                <span className="text-gray-400 text-sm">→</span>
                                <img src={getTokenLogo(tokenOutSymbol)} alt={tokenOutSymbol} className="w-6 h-6 rounded-full" />
                              </div>
                              <span className="text-white font-medium text-sm">{tokenInSymbol}/{tokenOutSymbol}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-left">
                              <div className="text-white font-mono text-sm">{amountIn}</div>
                              <div className="text-gray-400 text-xs">{tokenInSymbol}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-left">
                              <div className="text-green-400 font-mono text-sm">{amountOut}</div>
                              <div className="text-gray-400 text-xs">{tokenOutSymbol}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-400 text-sm">
                            {txTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="px-4 py-4">
                            <a
                              href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 transition-colors font-mono text-xs"
                            >
                              {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-white/5 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Showing {((currentPage - 1) * transactionsPerPage) + 1} to {Math.min(currentPage * transactionsPerPage, swapTransactions.length)} of {swapTransactions.length} swaps
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm font-semibold bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
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
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm font-semibold bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Buy USDC Modal */}
      <BuyUSDCModal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} />
    </div>
  );
};
