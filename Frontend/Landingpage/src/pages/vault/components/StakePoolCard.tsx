import React from 'react';
import { motion } from 'framer-motion';
import { FaLock, FaCoins, FaClock } from 'react-icons/fa';

interface StakePool {
  id: string;
  token: string;
  tokenLogo: string;
  apy: number;
  totalStaked: number;
  totalStakedUSD: number;
  minLockPeriod: number;
  maxLockPeriod: number;
  participants: number;
}

interface StakePoolCardProps {
  pool: StakePool;
  onStake: (pool: StakePool) => void;
}

export const StakePoolCard: React.FC<StakePoolCardProps> = ({ pool, onStake }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300 relative overflow-hidden group"
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-white/[0.1]">
              <img src={pool.tokenLogo} alt={pool.token} className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{pool.token}</h3>
              <p className="text-gray-400 text-sm">Stake Pool</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl px-4 py-2">
              <p className="text-green-400 font-bold text-2xl">{pool.apy}%</p>
              <p className="text-green-300 text-xs">APY</p>
            </div>
          </div>
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
            <div className="flex items-center space-x-2 mb-2">
              <FaCoins className="text-blue-400 text-sm" />
              <p className="text-gray-400 text-xs">Total Value Locked</p>
            </div>
            <p className="text-white font-bold text-lg">{pool.totalStaked.toLocaleString()} {pool.token}</p>
            <p className="text-gray-500 text-xs mt-1">
              ≈ ${pool.totalStakedUSD.toLocaleString()}
            </p>
          </div>

          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
            <div className="flex items-center space-x-2 mb-2">
              <FaClock className="text-purple-400 text-sm" />
              <p className="text-gray-400 text-xs">Lock Period</p>
            </div>
            <p className="text-white font-bold text-lg">{pool.minLockPeriod}-{pool.maxLockPeriod}</p>
            <p className="text-gray-500 text-xs mt-1">days</p>
          </div>
        </div>

        {/* Pool Info Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs mb-1">Active Stakers</p>
              <p className="text-white font-bold text-lg">{pool.participants.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs mb-1">Your Stake</p>
              <p className="text-white font-bold text-lg">{pool.totalStaked.toFixed(4)} {pool.token}</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.05] text-center">
            <p className="text-green-400 font-bold text-sm">Auto-compound</p>
            <p className="text-gray-500 text-xs">Daily</p>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.05] text-center">
            <p className="text-blue-400 font-bold text-sm">Flexible</p>
            <p className="text-gray-500 text-xs">Duration</p>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.05] text-center">
            <p className="text-purple-400 font-bold text-sm">Non-custodial</p>
            <p className="text-gray-500 text-xs">Secure</p>
          </div>
        </div>

        {/* Stake Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onStake(pool)}
          className="w-full py-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/30 rounded-xl text-white font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-2 relative overflow-hidden group"
        >
          <FaLock className="group-hover:rotate-12 transition-transform" />
          <span>Stake {pool.token}</span>
          
          {/* Animated shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ pointerEvents: 'none' }}
          />
        </motion.button>

        {/* Info Text */}
        <p className="text-gray-500 text-xs text-center mt-3">
          Lock your {pool.token} and earn up to {pool.apy}% APY automatically
        </p>
      </div>
    </motion.div>
  );
};
