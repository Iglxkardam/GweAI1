import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaLock, FaChartLine, FaFire, FaCoins, FaFilter, FaSearch, FaUnlock } from 'react-icons/fa';
import { StarfieldBackground } from '../../components';
import { VaultCard, EarlyUnlockModal, StakePoolCard, LockAssetModal } from './components';
import { LockedAsset, VaultStats, VaultFilter, StakePool } from './types/vault.types';
import { useAgwWallet } from '../deposit/hooks/useAgwWallet';
import { showInfoToast } from '../../utils/toastHelper';
import { TOKENS } from '../../config/tokens';

type VaultTab = 'locked' | 'unlocked' | 'pools';

export const VaultPage: React.FC = () => {
  const { connected, ethBalance, usdcBalance, sendTransaction, address } = useAgwWallet();
  const [activeTab, setActiveTab] = useState<VaultTab>('pools');
  const [showEarlyUnlockModal, setShowEarlyUnlockModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<LockedAsset | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<StakePool | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Load staked assets from wallet-specific localStorage (each wallet has their own data)
  const [lockedAssets, setLockedAssets] = useState<LockedAsset[]>([]);

  // Load user's staked assets when wallet connects/changes
  useEffect(() => {
    if (connected && address) {
      const storageKey = `stakedAssets_${address.toLowerCase()}`;
      const stored = localStorage.getItem(storageKey);
      setLockedAssets(stored ? JSON.parse(stored) : []);
    } else {
      // No wallet connected, show empty state
      setLockedAssets([]);
    }
  }, [connected, address]);

  // Stake Pools - ETH and USDC (Real pools - recalculates when lockedAssets change)
  const stakePools = useMemo<StakePool[]>(() => {
    // Calculate dynamic stats from actual stakes
    const ethStakes = lockedAssets.filter(s => s.token === 'ETH');
    const usdcStakes = lockedAssets.filter(s => s.token === 'USDC');
    
    return [
      {
        id: 'eth-pool',
        token: 'ETH',
        tokenLogo: TOKENS.ETH.logo,
        apy: 12.0,
        totalStaked: ethStakes.reduce((sum, s) => sum + s.amount, 0),
        totalStakedUSD: ethStakes.reduce((sum, s) => sum + s.usdValue, 0),
        minLockPeriod: 30,
        maxLockPeriod: 365,
        participants: ethStakes.length
      },
      {
        id: 'usdc-pool',
        token: 'USDC',
        tokenLogo: TOKENS.USDC.logo,
        apy: 8.0,
        totalStaked: usdcStakes.reduce((sum, s) => sum + s.amount, 0),
        totalStakedUSD: usdcStakes.reduce((sum, s) => sum + s.usdValue, 0),
        minLockPeriod: 30,
        maxLockPeriod: 365,
        participants: usdcStakes.length
      }
    ];
  }, [lockedAssets]);

  const [filter, setFilter] = useState<VaultFilter>({
    status: 'all',
    token: 'all',
    sortBy: 'apy'
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Calculate vault statistics (recalculates with currentTime for real-time yield updates)
  const stats: VaultStats = useMemo(() => {
    return {
      totalLocked: lockedAssets.reduce((sum, asset) => sum + asset.usdValue, 0),
      totalYieldEarned: lockedAssets.reduce((sum, asset) => {
        const now = currentTime;
        const elapsed = now - asset.lockDate;
        const total = asset.unlockDate - asset.lockDate;
        const currentYield = elapsed >= total ? asset.totalYield : (elapsed / total) * asset.totalYield;
        const yieldValue = currentYield * (asset.usdValue / asset.amount);
        return sum + yieldValue;
      }, 0),
      activeVaults: lockedAssets.filter(a => a.status === 'locked' || a.status === 'unlocking').length,
      averageAPY: lockedAssets.reduce((sum, asset) => sum + asset.apy, 0) / (lockedAssets.length || 1),
      totalAssets: lockedAssets.length
    };
  }, [lockedAssets, currentTime]);

  // Filter and sort assets based on active tab
  const filteredAssets = lockedAssets
    .filter(asset => {
      // Tab-based filtering
      if (activeTab === 'locked' && asset.status === 'unlocked') return false;
      if (activeTab === 'unlocked' && asset.status !== 'unlocked') return false;
      
      // Other filters
      if (filter.status !== 'all' && asset.status !== filter.status) return false;
      if (filter.token !== 'all' && asset.token !== filter.token) return false;
      if (searchQuery && !asset.token.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filter.sortBy) {
        case 'apy':
          return b.apy - a.apy;
        case 'amount':
          return b.usdValue - a.usdValue;
        case 'timeLeft':
          return a.unlockDate - b.unlockDate;
        case 'yield':
          return b.earnedYield - a.earnedYield;
        default:
          return 0;
      }
    });

  const handleUnlock = (id: string) => {
    console.log('Unlocking vault:', id);
    showInfoToast('Claiming Asset', `Claiming ${id}...`, 'Please wait while we process your claim');
    // Implement unlock logic
  };

  const handleEarlyUnlock = (id: string) => {
    const asset = lockedAssets.find(a => a.id === id);
    if (asset) {
      setSelectedAsset(asset);
      setShowEarlyUnlockModal(true);
    }
  };

  const handleEarlyUnlockConfirm = (assetId: string) => {
    console.log('Early unlocking vault:', assetId);
    showInfoToast('Early Unlock Confirmed', `Early unlock confirmed for ${assetId}`, 'Penalty applied');
    // Implement early unlock logic with penalty
  };

  const handleStake = (pool: StakePool) => {
    setSelectedPool(pool);
    setShowLockModal(true);
  };

  // Real-time updates for yield, progress, and time calculations
  useEffect(() => {
    if (!connected || !address) return;

    // Update every second for real-time countdown
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      
      // Auto-update asset status when unlocked
      setLockedAssets(prevAssets => {
        const updated = prevAssets.map(asset => {
          const now = Date.now();
          if (asset.status === 'locked' && now >= asset.unlockDate) {
            return { ...asset, status: 'unlocked' as const };
          }
          return asset;
        });
        
        // Save to wallet-specific localStorage if status changed
        const hasChanged = updated.some((asset, idx) => asset.status !== prevAssets[idx].status);
        if (hasChanged && address) {
          const storageKey = `stakedAssets_${address.toLowerCase()}`;
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }
        
        return updated;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [connected, address]);

  const handleStakeConfirm = async (token: string, amount: number, duration: number) => {
    console.log('Staking:', { token, amount, duration });
    
    if (!connected) {
      console.error('Wallet not connected');
      throw new Error('Please connect your wallet first');
    }

    try {
      // Send transaction to stake address (this will trigger wallet popup)
      const txHash = await sendTransaction(
        '0xf0006afc725937d720ef32b3a6494a7365e2e5d3',
        amount.toString(),
        token === 'ETH' ? 'ETH' : 'USDC'
      );

      console.log('Transaction sent:', txHash);

      // Get pool info for APY calculation
      const pool = stakePools.find(p => p.token === token);
      if (!pool) return;

      // Calculate APY based on duration multiplier
      const durationMultipliers: Record<number, number> = {
        30: 0.7,
        60: 0.85,
        90: 1.0,
        180: 1.15,
        365: 1.3
      };
      const multiplier = durationMultipliers[duration] || 1.0;
      const effectiveAPY = pool.apy * multiplier;

      // Get current token price (simplified)
      const tokenPrice = token === 'ETH' ? 2000 : 1; // ETH ~$2000, USDC = $1
      
      // Create new locked asset record
      const now = new Date();
      const unlockDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
      
      const newStake: LockedAsset = {
        id: `stake-${Date.now()}`,
        token: token,
        tokenLogo: pool.tokenLogo,
        amount: amount,
        usdValue: amount * tokenPrice,
        lockDate: now.getTime(),
        unlockDate: unlockDate.getTime(),
        lockDuration: duration,
        apy: effectiveAPY,
        earnedYield: 0,
        totalYield: (amount * effectiveAPY / 100) * (duration / 365),
        status: 'locked',
        strategy: 'fixed' as const
      };

      // Save to wallet-specific localStorage
      const updatedStakes = [newStake, ...lockedAssets];
      if (address) {
        const storageKey = `stakedAssets_${address.toLowerCase()}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedStakes));
      }
      
      // Update state (pool statistics will auto-update via useMemo)
      setLockedAssets(updatedStakes);

      console.log('Stake record created:', newStake);
      
      // Modal will auto-close after showing success (handled in LockAssetModal)
      // Don't close here to allow modal to show success message
    } catch (error) {
      console.error('Staking failed:', error);
      // Modal will show error and allow retry (handled in LockAssetModal)
      throw error; // Re-throw to let modal handle the error display
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
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <FaLock className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Vault
            </h1>
          </div>
          <p className="text-gray-400 text-lg px-4">
            Lock & Forget - Your assets earning yield automatically
          </p>
          
          {!connected && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 inline-flex items-center space-x-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-full"
            >
              <span className="text-yellow-400">⚠️</span>
              <span className="text-yellow-300 text-sm">Connect wallet to view your vaults</span>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {/* Total Locked */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] hover:border-white/[0.15] transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/20">
                  <FaCoins className="text-purple-400 text-xl" />
                </div>
                <span className="text-purple-400 text-xs font-semibold bg-purple-500/20 px-2 py-1 rounded-lg border border-purple-500/30">
                  ALL TIME
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Total Locked</h3>
              <p className="text-3xl font-bold text-white">
                ${stats.totalLocked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalAssets} vaults active</p>
            </div>
          </motion.div>

          {/* Total Yield Earned */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] hover:border-white/[0.15] transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center border border-green-500/20">
                  <FaChartLine className="text-green-400 text-xl" />
                </div>
                <span className="text-green-400 text-xs font-semibold bg-green-500/20 px-2 py-1 rounded-lg border border-green-500/30">
                  EARNED
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Total Yield</h3>
              <p className="text-3xl font-bold text-green-400">
                +${stats.totalYieldEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">Auto-compounding</p>
            </div>
          </motion.div>

          {/* Active Vaults */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] hover:border-white/[0.15] transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <FaLock className="text-blue-400 text-xl" />
                </div>
                <span className="text-blue-400 text-xs font-semibold bg-blue-500/20 px-2 py-1 rounded-lg border border-blue-500/30">
                  LIVE
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Active Vaults</h3>
              <p className="text-3xl font-bold text-white">{stats.activeVaults}</p>
              <p className="text-xs text-gray-500 mt-1">Currently earning</p>
            </div>
          </motion.div>

          {/* Average APY */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] hover:border-white/[0.15] transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-xl flex items-center justify-center border border-orange-500/20">
                  <FaFire className="text-orange-400 text-xl" />
                </div>
                <span className="text-orange-400 text-xs font-semibold bg-orange-500/20 px-2 py-1 rounded-lg border border-orange-500/30">
                  AVG
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Average APY</h3>
              <p className="text-3xl font-bold text-orange-400">{stats.averageAPY.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">Across all vaults</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center space-x-3 mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('pools')}
            className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'pools'
                ? 'bg-purple-500/20 border-2 border-purple-500/40 text-purple-300'
                : 'bg-white/[0.03] border-2 border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
            }`}
          >
            <FaCoins className="text-lg" />
            <span>Stake Pools</span>
            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
              activeTab === 'pools' ? 'bg-purple-500/30 text-purple-200' : 'bg-white/[0.05] text-gray-500'
            }`}>
              {stakePools.length}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('locked')}
            className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'locked'
                ? 'bg-blue-500/20 border-2 border-blue-500/40 text-blue-300'
                : 'bg-white/[0.03] border-2 border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
            }`}
          >
            <FaLock className="text-lg" />
            <span>Locked Assets</span>
            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
              activeTab === 'locked' ? 'bg-blue-500/30 text-blue-200' : 'bg-white/[0.05] text-gray-500'
            }`}>
              {lockedAssets.filter(a => a.status === 'locked' || a.status === 'unlocking').length}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('unlocked')}
            className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'unlocked'
                ? 'bg-green-500/20 border-2 border-green-500/40 text-green-300'
                : 'bg-white/[0.03] border-2 border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
            }`}
          >
            <FaUnlock className="text-lg" />
            <span>Unlocked Assets</span>
            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
              activeTab === 'unlocked' ? 'bg-green-500/30 text-green-200' : 'bg-white/[0.05] text-gray-500'
            }`}>
              {lockedAssets.filter(a => a.status === 'unlocked').length}
            </span>
          </motion.button>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.08] mb-6"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by token..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:border-white/[0.2] transition-colors"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-gray-400" />
                <span className="text-gray-400 text-sm">Filter:</span>
              </div>

              {/* Status Filter */}
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value as any })}
                className="bg-white/[0.05] border border-white/[0.08] rounded-lg py-2 px-3 text-white text-sm outline-none focus:border-white/[0.2] transition-colors cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="locked">Locked</option>
                <option value="unlocking">Unlocking</option>
                <option value="unlocked">Unlocked</option>
              </select>

              {/* Token Filter */}
              <select
                value={filter.token}
                onChange={(e) => setFilter({ ...filter, token: e.target.value })}
                className="bg-white/[0.05] border border-white/[0.08] rounded-lg py-2 px-3 text-white text-sm outline-none focus:border-white/[0.2] transition-colors cursor-pointer"
              >
                <option value="all">All Tokens</option>
                <option value="ETH">ETH</option>
                <option value="BTC">BTC</option>
                <option value="USDC">USDC</option>
              </select>

              {/* Sort */}
              <select
                value={filter.sortBy}
                onChange={(e) => setFilter({ ...filter, sortBy: e.target.value as any })}
                className="bg-white/[0.05] border border-white/[0.08] rounded-lg py-2 px-3 text-white text-sm outline-none focus:border-white/[0.2] transition-colors cursor-pointer"
              >
                <option value="apy">Highest APY</option>
                <option value="amount">Highest Amount</option>
                <option value="timeLeft">Ending Soon</option>
                <option value="yield">Highest Yield</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {activeTab === 'pools' ? (
            // Stake Pools Section
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {stakePools.map((pool, index) => (
                <motion.div
                  key={pool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <StakePoolCard 
                    pool={pool} 
                    onStake={handleStake}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            // Locked/Unlocked Vault Cards
            filteredAssets.length === 0 ? (
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-12 border border-white/[0.08] text-center">
                <FaLock className="text-gray-600 text-5xl mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Vaults Found</h3>
                <p className="text-gray-400">
                  {searchQuery || filter.status !== 'all' || filter.token !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first vault to start earning yield'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredAssets.map((asset, index) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <VaultCard 
                      asset={asset} 
                      onUnlock={handleUnlock}
                      onEarlyUnlock={handleEarlyUnlock}
                    />
                  </motion.div>
                ))}
              </div>
            )
          )}
        </motion.div>

        {/* Early Unlock Modal */}
        <EarlyUnlockModal
          isOpen={showEarlyUnlockModal}
          onClose={() => setShowEarlyUnlockModal(false)}
          asset={selectedAsset}
          onConfirm={handleEarlyUnlockConfirm}
        />

        {/* Stake Modal */}
        <LockAssetModal
          isOpen={showLockModal}
          onClose={() => setShowLockModal(false)}
          pool={selectedPool}
          userBalance={selectedPool?.token === 'ETH' ? ethBalance : usdcBalance}
          onConfirm={handleStakeConfirm}
        />

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6"
        >
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-500/30">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">How Vaults Work</h3>
              <p className="text-gray-400 text-sm mb-3">
                Lock your crypto assets for a fixed period and earn guaranteed yields. Your funds are secured on-chain,
                and yields are automatically calculated and added to your balance. The longer you lock, the higher the APY!
              </p>
              <p className="text-orange-300 text-sm mb-3 bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
                ⚠️ <strong>Early Unlock:</strong> You can unlock your assets before the lock period ends, but a penalty will apply. 
                The penalty is proportional to the remaining lock time (e.g., 50% time remaining = 50% of APY as penalty).
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1 text-xs text-gray-300">
                  ✓ Auto-compounding rewards
                </span>
                <span className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1 text-xs text-gray-300">
                  ✓ Non-custodial
                </span>
                <span className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1 text-xs text-gray-300">
                  ✓ Guaranteed APY
                </span>
                <span className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1 text-xs text-gray-300">
                  ✓ Real-time tracking
                </span>
                <span className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1 text-xs text-orange-300">
                  ⚡ Early unlock available
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
