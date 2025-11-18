import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaClock, FaFire } from 'react-icons/fa';
import { LockedAsset } from '../types/vault.types';
import { calculateTimeRemaining, calculateProgress, calculateCurrentYield, getStatusColor, getAPYColor } from '../utils/vaultCalculations';

interface VaultCardProps {
  asset: LockedAsset;
  onUnlock?: (id: string) => void;
  onEarlyUnlock?: (id: string) => void;
}

export const VaultCard: React.FC<VaultCardProps> = ({ asset, onUnlock, onEarlyUnlock }) => {
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(asset.unlockDate));
  const [currentYield, setCurrentYield] = useState(calculateCurrentYield(asset));
  const [progress, setProgress] = useState(calculateProgress(asset.lockDate, asset.unlockDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(asset.unlockDate));
      setCurrentYield(calculateCurrentYield(asset));
      setProgress(calculateProgress(asset.lockDate, asset.unlockDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [asset]);

  const statusColor = getStatusColor(asset.status);
  const apyColor = getAPYColor(asset.apy);

  const getStatusBadge = () => {
    const colors = {
      blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      green: 'bg-green-500/20 border-green-500/30 text-green-400',
      gray: 'bg-gray-500/20 border-gray-500/30 text-gray-400'
    };
    
    return (
      <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${colors[statusColor as keyof typeof colors]}`}>
        {asset.status.toUpperCase()}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -3 }}
      className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300 relative overflow-hidden group"
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-white/[0.1]">
              <img src={asset.tokenLogo} alt={asset.token} className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{asset.token}</h3>
              <p className="text-gray-400 text-xs">{asset.strategy} Strategy</p>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge()}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-3">
          <p className="text-gray-400 text-[10px] mb-1">Staked Amount</p>
          <div className="flex items-baseline space-x-1.5 min-w-0">
            <span className="text-2xl font-bold text-white truncate">{asset.amount.toFixed(4)}</span>
            <span className="text-sm text-white font-medium flex-shrink-0">{asset.token}</span>
          </div>
          <p className="text-blue-400 text-xs font-medium mt-0.5 truncate">
            ≈ ${asset.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* APY & Progress Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.05]">
            <div className="flex items-center space-x-1.5 mb-1">
              <FaFire className="text-orange-400 text-xs" />
              <p className="text-gray-400 text-[10px]">APY</p>
            </div>
            <p className={`text-lg font-bold ${apyColor} truncate`}>{asset.apy.toFixed(2)}%</p>
          </div>
          
          <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.05]">
            <div className="flex items-center space-x-1.5 mb-1">
              <FaClock className="text-blue-400 text-xs" />
              <p className="text-gray-400 text-[10px]">Progress</p>
            </div>
            <p className="text-white font-bold text-lg">{progress.toFixed(0)}%</p>
          </div>
        </div>

        {/* Time Remaining Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-[10px] mb-0.5">Time Remaining</p>
              {timeRemaining.isExpired ? (
                <p className="text-green-400 font-bold text-base">Unlocked!</p>
              ) : (
                <div className="flex items-center space-x-1">
                  <span className="text-white font-mono text-base font-bold">{timeRemaining.days}</span>
                  <span className="text-gray-400 text-xs">d</span>
                  <span className="text-white font-mono text-base font-bold">{timeRemaining.hours}</span>
                  <span className="text-gray-400 text-xs">h</span>
                  <span className="text-white font-mono text-base font-bold">{timeRemaining.minutes}</span>
                  <span className="text-gray-400 text-xs">m</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-[10px] mb-0.5">Unlock Date</p>
              <p className="text-white font-semibold text-xs">
                {new Date(asset.unlockDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-2">
            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Yield Information */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.05]">
            <p className="text-gray-400 text-[10px] mb-1">Earned Yield</p>
            <p className="text-green-400 font-bold text-sm truncate">
              +{currentYield.toFixed(4)}
            </p>
            <p className="text-gray-400 text-[10px] mt-0.5 truncate">
              ≈ ${(currentYield * (asset.usdValue / asset.amount)).toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.05]">
            <p className="text-gray-400 text-[10px] mb-1">Total Value</p>
            <p className="text-blue-400 font-bold text-sm truncate">
              {(asset.amount + asset.totalYield).toFixed(4)}
            </p>
            <p className="text-gray-400 text-[10px] mt-0.5 truncate">
              {asset.token}
            </p>
          </div>
        </div>

        {/* Action Button */}
        {asset.status === 'unlocked' && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onUnlock?.(asset.id)}
            className="w-full py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 rounded-lg text-white font-semibold text-sm transition-all duration-200 relative overflow-hidden group"
          >
            <span>Claim {(asset.amount + asset.totalYield).toFixed(4)} {asset.token}</span>
            
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
        )}

        {asset.status === 'unlocking' && (
          <div className="w-full py-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-yellow-400 font-semibold text-sm">Preparing to Unlock...</span>
            </div>
          </div>
        )}

        {asset.status === 'locked' && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onEarlyUnlock?.(asset.id)}
            className="w-full py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/30 rounded-lg text-white font-semibold text-sm transition-all duration-200 relative overflow-hidden group"
          >
            <span>Early Unlock (Penalty Applies)</span>
            
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
        )}
      </div>
    </motion.div>
  );
};
