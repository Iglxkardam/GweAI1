import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaWallet, FaChartLine, FaArrowUp } from 'react-icons/fa';
import { StarfieldBackground, PerformanceChart } from '../../components';
import { useAgwWallet } from '../deposit/hooks/useAgwWallet';
import { useGlobalPrices } from '../../context/PriceContext';
import { TOKENS } from '../../config/tokens';

export const PortfolioPage: React.FC = () => {
  const { 
    ethBalance, usdcBalance, btcBalance, solBalance, bnbBalance,
    xrpBalance, tonBalance, avaxBalance, tronBalance, cardanoBalance, dogeBalance,
    connected, address 
  } = useAgwWallet();
  const { prices } = useGlobalPrices();
  const ETH_PRICE = prices.eth || 0;
  const USDC_PRICE = 1;
  const BTC_PRICE = prices.btc || 0;
  const SOL_PRICE = prices.sol || 139;
  const BNB_PRICE = prices.bnb || 931;
  const XRP_PRICE = prices.xrp || 2.21;
  const TON_PRICE = 1.80;
  const AVAX_PRICE = 14.73;
  const TRON_PRICE = 0.29;
  const CARDANO_PRICE = prices.ada || 0.47;
  const DOGE_PRICE = prices.doge || 0.16;
  
  const totalValue = useMemo(() => {
    const ethValue = parseFloat(ethBalance) * ETH_PRICE;
    const usdcValue = parseFloat(usdcBalance) * USDC_PRICE;
    const btcValue = parseFloat(btcBalance) * BTC_PRICE;
    const solValue = parseFloat(solBalance) * SOL_PRICE;
    const bnbValue = parseFloat(bnbBalance) * BNB_PRICE;
    const xrpValue = parseFloat(xrpBalance) * XRP_PRICE;
    const tonValue = parseFloat(tonBalance) * TON_PRICE;
    const avaxValue = parseFloat(avaxBalance) * AVAX_PRICE;
    const tronValue = parseFloat(tronBalance) * TRON_PRICE;
    const cardanoValue = parseFloat(cardanoBalance) * CARDANO_PRICE;
    const dogeValue = parseFloat(dogeBalance) * DOGE_PRICE;
    return ethValue + usdcValue + btcValue + solValue + bnbValue + xrpValue + tonValue + avaxValue + tronValue + cardanoValue + dogeValue;
  }, [ethBalance, usdcBalance, btcBalance, solBalance, bnbBalance, xrpBalance, tonBalance, avaxBalance, tronBalance, cardanoBalance, dogeBalance, ETH_PRICE, USDC_PRICE, BTC_PRICE, SOL_PRICE, BNB_PRICE, XRP_PRICE, TON_PRICE, AVAX_PRICE, TRON_PRICE, CARDANO_PRICE, DOGE_PRICE]);

  const tokenHoldings = useMemo(() => [
    { symbol: TOKENS.BTC.symbol, name: TOKENS.BTC.name, balance: btcBalance, price: BTC_PRICE, logo: TOKENS.BTC.logo, color: TOKENS.BTC.color },
    { symbol: TOKENS.ETH.symbol, name: TOKENS.ETH.name, balance: ethBalance, price: ETH_PRICE, logo: TOKENS.ETH.logo, color: TOKENS.ETH.color },
    { symbol: TOKENS.SOL.symbol, name: TOKENS.SOL.name, balance: solBalance, price: SOL_PRICE, logo: TOKENS.SOL.logo, color: TOKENS.SOL.color },
    { symbol: TOKENS.BNB.symbol, name: TOKENS.BNB.name, balance: bnbBalance, price: BNB_PRICE, logo: TOKENS.BNB.logo, color: TOKENS.BNB.color },
    { symbol: TOKENS.XRP.symbol, name: TOKENS.XRP.name, balance: xrpBalance, price: XRP_PRICE, logo: TOKENS.XRP.logo, color: TOKENS.XRP.color },
    { symbol: TOKENS.TON.symbol, name: TOKENS.TON.name, balance: tonBalance, price: TON_PRICE, logo: TOKENS.TON.logo, color: TOKENS.TON.color },
    { symbol: TOKENS.AVAX.symbol, name: TOKENS.AVAX.name, balance: avaxBalance, price: AVAX_PRICE, logo: TOKENS.AVAX.logo, color: TOKENS.AVAX.color },
    { symbol: TOKENS.TRX.symbol, name: TOKENS.TRX.name, balance: tronBalance, price: TRON_PRICE, logo: TOKENS.TRX.logo, color: TOKENS.TRX.color },
    { symbol: TOKENS.ADA.symbol, name: TOKENS.ADA.name, balance: cardanoBalance, price: CARDANO_PRICE, logo: TOKENS.ADA.logo, color: TOKENS.ADA.color },
    { symbol: TOKENS.DOGE.symbol, name: TOKENS.DOGE.name, balance: dogeBalance, price: DOGE_PRICE, logo: TOKENS.DOGE.logo, color: TOKENS.DOGE.color },
    { symbol: TOKENS.USDC.symbol, name: TOKENS.USDC.name, balance: usdcBalance, price: USDC_PRICE, logo: TOKENS.USDC.logo, color: TOKENS.USDC.color },
  ].filter(token => parseFloat(token.balance) > 0), [ethBalance, usdcBalance, btcBalance, solBalance, bnbBalance, xrpBalance, tonBalance, avaxBalance, tronBalance, cardanoBalance, dogeBalance, ETH_PRICE, USDC_PRICE, BTC_PRICE, SOL_PRICE, BNB_PRICE, XRP_PRICE, TON_PRICE, AVAX_PRICE, TRON_PRICE, CARDANO_PRICE, DOGE_PRICE]);

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
            Track your crypto investments and performance
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
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400/20 to-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-purple-500/20">
                <FaChartLine className="text-purple-400 text-base sm:text-lg" />
              </div>
              <span className="text-purple-300 text-xs sm:text-sm font-medium bg-purple-500/20 px-2 py-1 rounded-lg border border-purple-500/30">Live</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Total Holdings</h3>
            <p className="text-2xl sm:text-3xl font-bold text-white">{connected ? tokenHoldings.length : '0'}</p>
            <p className="text-xs sm:text-sm text-gray-400">{connected ? 'Active tokens' : 'Connect to view'}</p>
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
                {tokenHoldings.length > 0 ? (
                  tokenHoldings.map((token) => {
                    const value = parseFloat(token.balance) * token.price;
                    
                    return (
                      <div key={token.symbol} className="flex items-center justify-between p-3 sm:p-4 bg-white/[0.03] rounded-lg sm:rounded-xl border border-white/[0.08] hover:border-white/[0.12] transition-all duration-200">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <img src={token.logo} alt={token.symbol} className="w-10 h-10 sm:w-12 sm:h-12" />
                          <div>
                            <h3 className="font-semibold text-white text-sm sm:text-base">{token.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-400">
                              {parseFloat(token.balance).toFixed(token.symbol === 'USDC' ? 2 : token.symbol === 'BTC' ? 6 : 4)} {token.symbol}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white text-sm sm:text-base">${value.toFixed(2)}</p>
                          <p className="text-xs sm:text-sm text-gray-400">@ ${token.price.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <FaWallet className="text-4xl text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No assets in your wallet</p>
                    <p className="text-sm text-gray-500 mt-2">Deposit tokens to get started</p>
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
