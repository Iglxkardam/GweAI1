import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaWallet, FaChartLine, FaArrowUp, FaCog } from 'react-icons/fa';
import { StarfieldBackground, PerformanceChart } from '../../components';
import { useAgwWallet } from '../deposit/hooks/useAgwWallet';
import { useGlobalPrices } from '../../context/PriceContext';

export const PortfolioPage: React.FC = () => {
  const { ethBalance, usdcBalance, btcBalance, connected, address } = useAgwWallet();
  const { prices } = useGlobalPrices();
  const ETH_PRICE = prices.eth || 0;
  const USDC_PRICE = 1;
  const BTC_PRICE = prices.btc || 0;
  
  const totalValue = useMemo(() => {
    const ethValue = parseFloat(ethBalance) * ETH_PRICE;
    const usdcValue = parseFloat(usdcBalance) * USDC_PRICE;
    const btcValue = parseFloat(btcBalance) * BTC_PRICE;
    return ethValue + usdcValue + btcValue;
  }, [ethBalance, usdcBalance, btcBalance, ETH_PRICE, USDC_PRICE, BTC_PRICE]);

  const ethValue = useMemo(() => parseFloat(ethBalance) * ETH_PRICE, [ethBalance, ETH_PRICE]);
  const usdcValue = useMemo(() => parseFloat(usdcBalance) * USDC_PRICE, [usdcBalance, USDC_PRICE]);
  const btcValue = useMemo(() => parseFloat(btcBalance) * BTC_PRICE, [btcBalance, BTC_PRICE]);

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
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <FaWallet className="text-white text-base sm:text-xl" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Portfolio Overview
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg px-4">
            Track your DCA investments and performance
          </p>
        </motion.div>

        {/* Portfolio Stats */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/[0.08] hover:border-white/[0.12] transition-all">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-green-500/20">
                <span className="text-green-400 font-bold text-base sm:text-lg">$</span>
              </div>
              <FaArrowUp className="text-green-400 text-xl sm:text-2xl" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Total Value</h3>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {connected ? `$${totalValue.toFixed(2)}` : '$0.00'}
            </p>
            <p className="text-xs sm:text-sm text-gray-400 font-medium">
              {connected ? `${parseFloat(ethBalance).toFixed(4)} ETH + ${parseFloat(usdcBalance).toFixed(2)} USDC + ${parseFloat(btcBalance).toFixed(6)} BTC` : 'Connect wallet to view'}
            </p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/[0.08] hover:border-white/[0.12] transition-all">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400/20 to-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-blue-500/20">
                <FaChartLine className="text-blue-400 text-base sm:text-lg" />
              </div>
              <span className="text-blue-300 text-xs sm:text-sm font-medium bg-blue-500/20 px-2 py-1 rounded-lg border border-blue-500/30">Monthly</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">DCA Amount</h3>
            <p className="text-2xl sm:text-3xl font-bold text-white">$500</p>
            <p className="text-xs sm:text-sm text-gray-400">Next investment in 12 days</p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/[0.08] hover:border-white/[0.12] transition-all">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400/20 to-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-purple-500/20">
                <span className="text-purple-400 font-bold text-base sm:text-lg">+</span>
              </div>
              <FaCog className="text-purple-400 text-lg sm:text-xl" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Active Plans</h3>
            <p className="text-2xl sm:text-3xl font-bold text-white">3</p>
            <p className="text-xs sm:text-sm text-gray-400">BTC, ETH, SOL strategies</p>
          </div>
        </motion.div>

        {/* Holdings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-transparent backdrop-blur-sm rounded-2xl border-0 overflow-hidden mb-8"
        >
          <div className="p-4 sm:p-6 border-b border-white/[0.08]">
            <h2 className="text-lg sm:text-xl font-bold text-white">Your Holdings</h2>
          </div>
          
          <div className="p-4 sm:p-6">
            {connected ? (
              <div className="space-y-3 sm:space-y-4">
                {/* Ethereum */}
                {parseFloat(ethBalance) > 0 && (
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-white/[0.03] rounded-lg sm:rounded-xl border border-white/[0.08] hover:border-white/[0.12] transition-all duration-200">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400/20 to-blue-500/20 border border-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 font-bold text-base sm:text-lg">Ξ</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm sm:text-base">Ethereum</h3>
                        <p className="text-xs sm:text-sm text-gray-400">{parseFloat(ethBalance).toFixed(4)} ETH</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white text-sm sm:text-base">${ethValue.toFixed(2)}</p>
                      <p className="text-xs sm:text-sm text-gray-400">@ ${ETH_PRICE}</p>
                    </div>
                  </div>
                )}

                {/* USDC */}
                {parseFloat(usdcBalance) > 0 && (
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-white/[0.03] rounded-lg sm:rounded-xl border border-white/[0.08] hover:border-white/[0.12] transition-all duration-200">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400/20 to-green-500/20 border border-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-green-400 font-bold text-base sm:text-lg">$</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm sm:text-base">USDC</h3>
                        <p className="text-xs sm:text-sm text-gray-400">{parseFloat(usdcBalance).toFixed(2)} USDC</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white text-sm sm:text-base">${usdcValue.toFixed(2)}</p>
                      <p className="text-xs sm:text-sm text-gray-400">@ ${USDC_PRICE}</p>
                    </div>
                  </div>
                )}

                {/* Bitcoin */}
                {parseFloat(btcBalance) > 0 && (
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-white/[0.03] rounded-lg sm:rounded-xl border border-white/[0.08] hover:border-white/[0.12] transition-all duration-200">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400/20 to-orange-500/20 border border-orange-500/20 rounded-full flex items-center justify-center">
                        <span className="text-orange-400 font-bold text-base sm:text-lg">₿</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm sm:text-base">Bitcoin</h3>
                        <p className="text-xs sm:text-sm text-gray-400">{parseFloat(btcBalance).toFixed(6)} BTC</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white text-sm sm:text-base">${btcValue.toFixed(2)}</p>
                      <p className="text-xs sm:text-sm text-gray-400">@ ${BTC_PRICE.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {parseFloat(ethBalance) === 0 && parseFloat(usdcBalance) === 0 && parseFloat(btcBalance) === 0 && (
                  <div className="text-center py-8">
                    <FaWallet className="text-4xl text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No assets in your wallet</p>
                    <p className="text-sm text-gray-500 mt-2">Deposit ETH, USDC or BTC to get started</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FaWallet className="text-4xl text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Connect your wallet to view portfolio</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Performance Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.08] overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-white/[0.08]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white">Performance Overview</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs text-gray-400">Real-time</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            <PerformanceChart 
              currentValue={totalValue}
              isConnected={connected}
              walletAddress={address || undefined}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
