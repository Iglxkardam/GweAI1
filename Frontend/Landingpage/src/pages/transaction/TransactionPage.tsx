import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaHistory, FaFilter, FaCheckCircle, FaClock, FaArrowDown, FaArrowUp, FaExchangeAlt, FaWallet } from 'react-icons/fa';
import { StarfieldBackground } from '../../components';
import { useAgwWallet } from '../deposit/hooks/useAgwWallet';
import { SUPPORTED_TOKENS } from '../deposit/hooks/useAgwWallet';
import { useSwapTransactions } from '../swap/hooks/useSwapTransactions';
import { TOKENS } from '../../config/tokens';
import { formatUnits } from 'viem';

// Helper to get token symbol from address - Fixed mapping
const getTokenSymbol = (address: string): string => {
  const addr = address.toLowerCase();
  
  // Create reverse mapping for proper symbols
  const symbolMap: Record<string, string> = {
    [SUPPORTED_TOKENS.BTC.address.toLowerCase()]: 'BTC',
    [SUPPORTED_TOKENS.SOL.address.toLowerCase()]: 'SOL',
    [SUPPORTED_TOKENS.BNB.address.toLowerCase()]: 'BNB',
    [SUPPORTED_TOKENS.XRP.address.toLowerCase()]: 'XRP',
    [SUPPORTED_TOKENS.TON.address.toLowerCase()]: 'TON',
    [SUPPORTED_TOKENS.AVAX.address.toLowerCase()]: 'AVAX',
    [SUPPORTED_TOKENS.TRON.address.toLowerCase()]: 'TRX', // TRON -> TRX
    [SUPPORTED_TOKENS.CARDANO.address.toLowerCase()]: 'ADA', // CARDANO -> ADA
    [SUPPORTED_TOKENS.DOGE.address.toLowerCase()]: 'DOGE',
    [SUPPORTED_TOKENS.USDC.address.toLowerCase()]: 'USDC',
  };
  
  return symbolMap[addr] || 'TOKEN';
};

interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'withdrawal' | 'swap';
  asset: string;
  symbol: string;
  amount: string;
  value: string;
  date: string;
  status: 'completed' | 'pending' | 'processing';
  toAsset?: string; // For swap transactions
  toSymbol?: string;
  txHash?: string;
}

export const TransactionPage: React.FC = () => {
  const { address, connected } = useAgwWallet();
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'withdrawal' | 'swap'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const ITEMS_PER_PAGE = 10;
  
  // Fetch real swap transactions from blockchain
  const { transactions: swapTransactions } = useSwapTransactions(address || undefined, connected);

  // Load all transactions from localStorage
  useEffect(() => {
    if (!address) {
      setAllTransactions([]);
      return;
    }

    const loadTransactions = () => {
      const txs: Transaction[] = [];

      // Load trading transactions (buy/sell) - from useRecentTrades storage keys
      try {
        // Get all localStorage keys that match trade patterns
        const allKeys = Object.keys(localStorage);
        const tradeKeys = allKeys.filter(key => 
          key.startsWith('trades_') && 
          key.includes(address.toLowerCase())
        );

        tradeKeys.forEach(key => {
          try {
            const tradeData = localStorage.getItem(key);
            if (tradeData) {
              const trades = JSON.parse(tradeData);
              trades.forEach((trade: any) => {
                // Extract token symbol from key (format: trades_0x...token_0x...user)
                const tokenAddress = key.split('_')[1];
                const symbol = getTokenSymbol(tokenAddress);
                
                // Get token name mapping
                const nameMap: Record<string, string> = {
                  'BTC': 'Bitcoin',
                  'ETH': 'Ethereum',
                  'SOL': 'Solana',
                  'BNB': 'BNB',
                  'XRP': 'Ripple',
                  'TON': 'Toncoin',
                  'AVAX': 'Avalanche',
                  'TRX': 'Tron',
                  'ADA': 'Cardano',
                  'DOGE': 'Dogecoin',
                  'USDC': 'USD Coin',
                };
                
                txs.push({
                  id: trade.id || trade.txHash,
                  type: trade.type === 'buy' ? 'buy' : 'sell',
                  asset: nameMap[symbol] || symbol,
                  symbol: symbol,
                  amount: trade.amount?.toFixed(symbol === 'BTC' ? 8 : symbol === 'DOGE' ? 8 : symbol === 'ETH' ? 6 : 4) || '0',
                  value: `$${trade.total?.toFixed(2) || '0.00'}`,
                  date: new Date(trade.time).toLocaleString(),
                  status: 'completed',
                  txHash: trade.txHash
                });
              });
            }
          } catch (err) {
            console.error(`Error parsing trade key ${key}:`, err);
          }
        });
      } catch (err) {
        console.error('Error loading trading transactions:', err);
      }

      // Load deposit/withdrawal transactions from wallet storage
      try {
        const walletKey = `wallet_${address.toLowerCase()}_transactions`;
        const walletData = localStorage.getItem(walletKey);
        if (walletData) {
          const walletTxs = JSON.parse(walletData);
          walletTxs.forEach((tx: any) => {
            txs.push({
              id: tx.id || tx.txHash,
              type: tx.type === 'deposit' ? 'buy' : 'withdrawal',
              asset: tx.tokenSymbol || 'ETH',
              symbol: tx.tokenSymbol || 'ETH',
              amount: tx.amount || '0',
              value: tx.amount ? `${tx.amount} ${tx.tokenSymbol}` : 'N/A',
              date: new Date(tx.timestamp).toLocaleString(),
              status: tx.status === 'completed' ? 'completed' : tx.status === 'pending' ? 'pending' : 'processing',
              txHash: tx.txHash
            });
          });
        }
      } catch (err) {
        console.error('Error loading wallet transactions:', err);
      }

      // Load real swap transactions from blockchain
      try {
        swapTransactions.forEach((swap) => {
          // Format token amounts with proper decimals
          const formatSwapAmount = (amount: string, symbol: string): string => {
            const decimals = TOKENS[symbol]?.decimals || 18;
            const formatted = formatUnits(BigInt(amount), decimals);
            return parseFloat(formatted).toFixed(decimals === 6 ? 2 : decimals === 8 ? 8 : 4);
          };

          const fromSymbol = getTokenSymbol(swap.tokenIn);
          const toSymbol = getTokenSymbol(swap.tokenOut);
          
          // Get token name mapping
          const nameMap: Record<string, string> = {
            'BTC': 'Bitcoin',
            'ETH': 'Ethereum',
            'SOL': 'Solana',
            'BNB': 'BNB',
            'XRP': 'Ripple',
            'TON': 'Toncoin',
            'AVAX': 'Avalanche',
            'TRX': 'Tron',
            'ADA': 'Cardano',
            'DOGE': 'Dogecoin',
            'USDC': 'USD Coin',
          };

          txs.push({
            id: swap.hash,
            type: 'swap',
            asset: nameMap[fromSymbol] || fromSymbol,
            symbol: fromSymbol,
            amount: formatSwapAmount(swap.amountIn, fromSymbol),
            value: `→ ${formatSwapAmount(swap.amountOut, toSymbol)} ${toSymbol}`,
            date: new Date(Number(swap.timestamp) * 1000).toLocaleString(),
            status: 'completed',
            toAsset: nameMap[toSymbol] || toSymbol,
            toSymbol: toSymbol,
            txHash: swap.hash
          });
        });
      } catch (err) {
        console.error('Error loading swap transactions:', err);
      }

      // Sort by date (newest first)
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log('[TransactionPage] Loaded transactions:', txs.length);
      setAllTransactions(txs);
    };

    loadTransactions();
    
    // Refresh every 10 seconds to catch new trades
    const interval = setInterval(loadTransactions, 10000);
    return () => clearInterval(interval);
  }, [address, swapTransactions]);

  // Fallback demo data if no wallet connected
  const demoTransactions: Transaction[] = [
    {
      id: '1',
      type: 'buy',
      asset: 'Bitcoin',
      symbol: 'BTC',
      amount: '0.0125',
      value: '$487.50',
      date: '2025-11-01 14:32',
      status: 'completed'
    },
    {
      id: '2',
      type: 'buy',
      asset: 'Ethereum',
      symbol: 'ETH',
      amount: '0.18',
      value: '$306.00',
      date: '2025-11-01 14:30',
      status: 'completed'
    },
    {
      id: '3',
      type: 'swap',
      asset: 'Solana',
      symbol: 'SOL',
      amount: '4.5',
      value: '$89.50',
      date: '2025-11-01 14:28',
      status: 'processing',
      toAsset: 'USDC',
      toSymbol: 'USDC'
    },
    {
      id: '4',
      type: 'withdrawal',
      asset: 'Bitcoin',
      symbol: 'BTC',
      amount: '0.0125',
      value: '$462.50',
      date: '2025-10-01 14:32',
      status: 'completed'
    },
    {
      id: '5',
      type: 'buy',
      asset: 'Ethereum',
      symbol: 'ETH',
      amount: '0.18',
      value: '$289.00',
      date: '2025-10-01 14:30',
      status: 'completed'
    },
    {
      id: '6',
      type: 'sell',
      asset: 'XRP',
      symbol: 'XRP',
      amount: '1000',
      value: '$550.00',
      date: '2025-09-28 11:15',
      status: 'completed'
    },
    {
      id: '7',
      type: 'swap',
      asset: 'BNB',
      symbol: 'BNB',
      amount: '2.5',
      value: '$420.00',
      date: '2025-09-25 09:45',
      status: 'completed',
      toAsset: 'Ethereum',
      toSymbol: 'ETH'
    },
    {
      id: '8',
      type: 'buy',
      asset: 'Cardano',
      symbol: 'ADA',
      amount: '500',
      value: '$235.00',
      date: '2025-09-20 16:20',
      status: 'completed'
    },
    {
      id: '9',
      type: 'withdrawal',
      asset: 'Solana',
      symbol: 'SOL',
      amount: '10',
      value: '$198.50',
      date: '2025-09-15 13:30',
      status: 'completed'
    },
    {
      id: '10',
      type: 'buy',
      asset: 'Dogecoin',
      symbol: 'DOGE',
      amount: '5000',
      value: '$800.00',
      date: '2025-09-12 10:10',
      status: 'completed'
    },
    {
      id: '11',
      type: 'sell',
      asset: 'Tron',
      symbol: 'TRX',
      amount: '2000',
      value: '$580.00',
      date: '2025-09-08 14:45',
      status: 'completed'
    },
    {
      id: '12',
      type: 'swap',
      asset: 'Avalanche',
      symbol: 'AVAX',
      amount: '15',
      value: '$345.00',
      date: '2025-09-05 12:00',
      status: 'completed',
      toAsset: 'Bitcoin',
      toSymbol: 'BTC'
    }
  ];

  // Use real transactions if wallet connected, otherwise show demo
  const transactions = connected ? allTransactions : demoTransactions;
  
  // Debug logs
  useEffect(() => {
    console.log('[TransactionPage] Connected:', connected);
    console.log('[TransactionPage] Address:', address);
    console.log('[TransactionPage] All Transactions:', allTransactions.length);
    console.log('[TransactionPage] Using:', connected ? 'REAL DATA' : 'DEMO DATA');
  }, [connected, address, allTransactions]);

  const filteredTransactions = transactions.filter(tx => 
    filter === 'all' || tx.type === filter
  );

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center space-x-1 text-green-600 bg-green-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium">
            <FaCheckCircle className="text-[10px] sm:text-xs" />
            <span className="hidden sm:inline">Completed</span>
            <span className="sm:hidden">Done</span>
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center space-x-1 text-blue-600 bg-blue-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium">
            <FaClock className="text-[10px] sm:text-xs" />
            <span className="hidden sm:inline">Processing</span>
            <span className="sm:hidden">Proc</span>
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center space-x-1 text-yellow-600 bg-yellow-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium">
            <FaClock className="text-[10px] sm:text-xs" />
            <span>Pending</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen pt-20 pb-8 px-4 relative"
      style={{
        background: '#000',
        backgroundImage: `
          radial-gradient(circle at top right, rgba(121, 68, 154, 0.13), transparent),
          radial-gradient(circle at 20% 80%, rgba(41, 196, 255, 0.13), transparent)
        `
      }}
    >
      <StarfieldBackground optimized={true} />
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header - Responsive */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center">
              <FaHistory className="text-white text-base sm:text-xl" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Transaction History
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg px-4">
            View all your DCA transactions and activities
          </p>
        </motion.div>

        {/* Filters - Responsive */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.02] backdrop-blur-sm rounded-xl p-4 border border-white/[0.08] mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400 text-sm" />
              <span className="font-semibold text-white text-sm">Filter:</span>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => { setFilter('all'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-200 border ${
                  filter === 'all'
                    ? 'bg-white/[0.12] text-white border-white/[0.2]'
                    : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.08] border-white/[0.08]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setFilter('buy'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-200 border ${
                  filter === 'buy'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.08] border-white/[0.08]'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => { setFilter('sell'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-200 border ${
                  filter === 'sell'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.08] border-white/[0.08]'
                }`}
              >
                Sell
              </button>
              <button
                onClick={() => { setFilter('swap'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-200 border ${
                  filter === 'swap'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.08] border-white/[0.08]'
                }`}
              >
                Swap
              </button>
              <button
                onClick={() => { setFilter('withdrawal'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-200 border ${
                  filter === 'withdrawal'
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.08] border-white/[0.08]'
                }`}
              >
                Withdrawal
              </button>
            </div>
          </div>
        </motion.div>

        {/* Transactions List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.02] backdrop-blur-sm rounded-xl border border-white/[0.08] overflow-hidden"
        >
          <div className="p-4 border-b border-white/[0.08]">
            <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
            <p className="text-xs text-gray-400 mt-1">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </p>
          </div>
          
          <div className="p-4">
            {currentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaHistory className="text-gray-500 text-2xl" />
                </div>
                <p className="text-gray-400 text-sm">No transactions found</p>
                <p className="text-gray-500 text-xs mt-1">
                  {connected ? 'Start trading to see your history' : 'Connect wallet to view your transactions'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      transaction.type === 'buy'
                        ? 'bg-gradient-to-br from-green-400 to-green-500'
                        : transaction.type === 'sell'
                        ? 'bg-gradient-to-br from-red-400 to-red-500'
                        : transaction.type === 'swap'
                        ? 'bg-gradient-to-br from-blue-400 to-blue-500'
                        : 'bg-gradient-to-br from-purple-400 to-purple-500'
                    }`}>
                      {transaction.type === 'buy' ? (
                        <FaArrowUp className="text-white text-sm" />
                      ) : transaction.type === 'sell' ? (
                        <FaArrowDown className="text-white text-sm" />
                      ) : transaction.type === 'swap' ? (
                        <FaExchangeAlt className="text-white text-sm" />
                      ) : (
                        <FaWallet className="text-white text-sm" />
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white text-sm">{transaction.asset}</h3>
                        <span className="px-2 py-0.5 bg-white/10 text-white/80 text-[10px] font-mono rounded">
                          {transaction.symbol}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {transaction.type === 'buy' ? 'Bought' : transaction.type === 'sell' ? 'Sold' : transaction.type === 'swap' ? `Swapped to ${transaction.toSymbol}` : 'Withdrew'} {transaction.amount} {transaction.symbol}
                      </p>
                      <p className="text-[10px] text-gray-500">{transaction.date}</p>
                    </div>
                  </div>

                  <div className="text-right space-y-1 flex-shrink-0 ml-2">
                    <p className="font-semibold text-white text-sm">{transaction.value}</p>
                    {getStatusBadge(transaction.status)}
                    {transaction.txHash && (
                      <a
                        href={`https://sepolia.basescan.org/tx/${transaction.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                      >
                        View TX
                      </a>
                    )}
                  </div>
                </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/[0.08] flex items-center justify-between">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] disabled:bg-white/[0.02] disabled:text-gray-600 disabled:cursor-not-allowed border border-white/[0.1] text-white text-sm rounded-lg transition-all"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.1]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] disabled:bg-white/[0.02] disabled:text-gray-600 disabled:cursor-not-allowed border border-white/[0.1] text-white text-sm rounded-lg transition-all"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>

        {/* Transaction Summary - Dynamic with Real Data */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6"
        >
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/[0.08] hover:border-white/[0.12] transition-all">
            <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Total Invested</h3>
            <p className="text-xl sm:text-2xl font-bold text-white">
              ${(() => {
                const total = transactions
                  .filter(tx => tx.type === 'buy')
                  .reduce((sum, tx) => {
                    const value = parseFloat(tx.value.replace('$', '').replace(',', ''));
                    return sum + (isNaN(value) ? 0 : value);
                  }, 0);
                return total.toFixed(2);
              })()}
            </p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/[0.08] hover:border-white/[0.12] transition-all">
            <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Total Transactions</h3>
            <p className="text-xl sm:text-2xl font-bold text-white">{transactions.length}</p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/[0.08] hover:border-white/[0.12] transition-all">
            <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Avg. Transaction</h3>
            <p className="text-xl sm:text-2xl font-bold text-white">
              ${(() => {
                const buyTxs = transactions.filter(tx => tx.type === 'buy');
                if (buyTxs.length === 0) return '0.00';
                const total = buyTxs.reduce((sum, tx) => {
                  const value = parseFloat(tx.value.replace('$', '').replace(',', ''));
                  return sum + (isNaN(value) ? 0 : value);
                }, 0);
                return (total / buyTxs.length).toFixed(2);
              })()}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
