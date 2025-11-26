import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaLock, FaChartLine, FaFire, FaCoins, FaUnlock, FaExternalLinkAlt } from 'react-icons/fa';
import { StarfieldBackground } from '../../components';
import { VaultCard, EarlyUnlockModal, StakePoolCard, LockAssetModal } from './components';
import { LockedAsset, VaultStats, StakePool, VaultHistory } from './types/vault.types';
import { useAgwWallet } from '../deposit/hooks/useAgwWallet';
import { showInfoToast, showSuccessToast, showErrorToast } from '../../utils/toastHelper';
import { TOKENS } from '../../config/tokens';
import { 
  calculateEarlyWithdrawalPenalty,
  validateStakeParams,
  getTokenAddress,
  getTokenDecimals,
  getUserStakeIds,
  getStakeDetails,
  getTokenSymbol
} from './services/vaultService';

type VaultTab = 'locked' | 'unlocked' | 'pools' | 'history';

export const VaultPage: React.FC = () => {
  const { connected, usdcBalance, btcBalance, solBalance, sendTransaction, address } = useAgwWallet();
  const [activeTab, setActiveTab] = useState<VaultTab>('pools');
  const [showEarlyUnlockModal, setShowEarlyUnlockModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<LockedAsset | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<StakePool | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [history, setHistory] = useState<VaultHistory[]>([]);
  
  // Load staked assets from wallet-specific localStorage (each wallet has their own data)
  const [lockedAssets, setLockedAssets] = useState<LockedAsset[]>([]);

  // Real-time clock update - updates every second for countdown and yield calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      
      // Auto-update asset status when unlocked
      setLockedAssets(prevAssets => 
        prevAssets.map(asset => {
          const now = Date.now();
          if (asset.status === 'locked' && now >= asset.unlockDate) {
            return { ...asset, status: 'unlocked' as const };
          }
          return asset;
        })
      );
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Sync stakes with contract - ALWAYS fetch from blockchain (localStorage is just cache)
  const syncStakesWithContract = async () => {
    if (!connected || !address) {
      setLockedAssets([]);
      return;
    }

    try {
      console.log('🔄 Fetching stakes from contract...');
      const onChainStakeIds = await getUserStakeIds(address);
      console.log('📊 On-chain stakeIds:', onChainStakeIds);

      if (onChainStakeIds.length === 0) {
        console.log('✅ No stakes found on-chain');
        setLockedAssets([]);
        // Clear localStorage since there are no stakes
        const storageKey = `stakedAssets_${address.toLowerCase()}`;
        localStorage.removeItem(storageKey);
        return;
      }

      // ALWAYS rebuild from contract - localStorage is just cache
      const rebuiltStakes: LockedAsset[] = [];

      // Token prices for USD value calculation
      const tokenPrices: Record<string, number> = {
        'BTC': 45000,
        'SOL': 100,
        'USDC': 1
      };

      // Fetch details for each stake from contract
      for (const stakeId of onChainStakeIds) {
        try {
          const stakeDetails = await getStakeDetails(stakeId);
          
          // Skip withdrawn stakes
          if (!stakeDetails || stakeDetails.withdrawn) {
            console.log(`⏭️ Skipping withdrawn stake ${stakeId}`);
            continue;
          }

          const tokenSymbol = getTokenSymbol(stakeDetails.token);
          
          // Only support BTC, SOL, USDC
          if (!['BTC', 'SOL', 'USDC'].includes(tokenSymbol)) {
            console.log(`⚠️ Unsupported token ${tokenSymbol} for stake ${stakeId}`);
            continue;
          }

          const decimals = getTokenDecimals(tokenSymbol);
          const divisor = Math.pow(10, decimals);
          const amount = parseFloat((Number(stakeDetails.amount) / divisor).toFixed(6));
          const tokenPrice = tokenPrices[tokenSymbol] || 1;
          const apy = Number(stakeDetails.apy) / 100;
          const totalYield = parseFloat((Number(stakeDetails.totalYield) / divisor).toFixed(6));
          const lockDate = Number(stakeDetails.lockDate) * 1000;
          const unlockDate = Number(stakeDetails.unlockDate) * 1000;
          const lockDuration = Number(stakeDetails.lockDuration);

          // Get token logo
          const tokenLogos: Record<string, string> = {
            'BTC': TOKENS.BTC.logo,
            'SOL': TOKENS.SOL.logo,
            'USDC': TOKENS.USDC.logo
          };

          rebuiltStakes.push({
            id: `stake-${stakeId}`,
            stakeId: stakeId,
            token: tokenSymbol,
            tokenLogo: tokenLogos[tokenSymbol],
            amount: amount,
            usdValue: amount * tokenPrice,
            lockDate: lockDate,
            unlockDate: unlockDate,
            lockDuration: lockDuration,
            apy: apy,
            earnedYield: 0,
            totalYield: totalYield,
            status: Date.now() >= unlockDate ? 'unlocked' : 'locked',
            strategy: 'fixed' as const
          });
          
          console.log(`✅ Loaded stake ${stakeId}: ${amount} ${tokenSymbol}`);
        } catch (error) {
          console.error(`❌ Error loading stake ${stakeId}:`, error);
        }
      }

      // Update state with stakes from contract
      setLockedAssets(rebuiltStakes);
      console.log(`✅ Loaded ${rebuiltStakes.length} stakes from contract`);

      // Cache in localStorage for faster initial load next time
      if (rebuiltStakes.length > 0) {
        const storageKey = `stakedAssets_${address.toLowerCase()}`;
        localStorage.setItem(storageKey, JSON.stringify(rebuiltStakes));
      }
    } catch (error) {
      console.error('❌ Error syncing stakes:', error);
      setLockedAssets([]);
    }
  };

  // Load user's staked assets when wallet connects/changes
  useEffect(() => {
    if (connected && address) {
      // Show cached data immediately for better UX (optimistic UI)
      const storageKey = `stakedAssets_${address.toLowerCase()}`;
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        try {
          setLockedAssets(JSON.parse(cached));
          console.log('📦 Loaded cached stakes (will refresh from contract)');
        } catch (e) {
          console.error('Failed to parse cached stakes:', e);
        }
      }
      
      // ALWAYS fetch fresh data from contract (source of truth)
      syncStakesWithContract();
      
      // Load history from localStorage
      const historyKey = `vaultHistory_${address.toLowerCase()}`;
      const historyData = localStorage.getItem(historyKey);
      if (historyData) {
        try {
          setHistory(JSON.parse(historyData));
        } catch (e) {
          console.error('Failed to parse history:', e);
          setHistory([]);
        }
      }
    } else {
      // No wallet connected, show empty state
      setLockedAssets([]);
      setHistory([]);
    }
  }, [connected, address]);
  
  // Helper function to add history entry
  const addHistoryEntry = (entry: Omit<VaultHistory, 'id'>) => {
    if (!address) return;
    
    const newEntry: VaultHistory = {
      ...entry,
      id: `${entry.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    const updatedHistory = [newEntry, ...history].slice(0, 100); // Keep last 100 entries
    setHistory(updatedHistory);
    
    // Save to localStorage
    const historyKey = `vaultHistory_${address.toLowerCase()}`;
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
  };

  // Stake Pools - BTC, SOL, and USDC only (Real pools - recalculates when lockedAssets change)
  const stakePools = useMemo<StakePool[]>(() => {
    // Calculate dynamic stats from actual stakes
    const btcStakes = lockedAssets.filter(s => s.token === 'BTC');
    const solStakes = lockedAssets.filter(s => s.token === 'SOL');
    const usdcStakes = lockedAssets.filter(s => s.token === 'USDC');
    
    // Token prices (simplified)
    const BTC_PRICE = 45000;
    const SOL_PRICE = 100;
    const USDC_PRICE = 1;
    
    return [
      {
        id: 'btc-pool',
        token: 'BTC',
        tokenLogo: TOKENS.BTC.logo,
        apy: 10.0, // Base APY for BTC
        totalStaked: btcStakes.reduce((sum, s) => sum + s.amount, 0),
        totalStakedUSD: btcStakes.reduce((sum, s) => sum + s.amount * BTC_PRICE, 0),
        minLockPeriod: 30,
        maxLockPeriod: 365,
        participants: btcStakes.length
      },
      {
        id: 'sol-pool',
        token: 'SOL',
        tokenLogo: TOKENS.SOL.logo,
        apy: 9.0, // Base APY for SOL
        totalStaked: solStakes.reduce((sum, s) => sum + s.amount, 0),
        totalStakedUSD: solStakes.reduce((sum, s) => sum + s.amount * SOL_PRICE, 0),
        minLockPeriod: 30,
        maxLockPeriod: 365,
        participants: solStakes.length
      },
      {
        id: 'usdc-pool',
        token: 'USDC',
        tokenLogo: TOKENS.USDC.logo,
        apy: 6.0, // Base APY for USDC stablecoin
        totalStaked: usdcStakes.reduce((sum, s) => sum + s.amount, 0),
        totalStakedUSD: usdcStakes.reduce((sum, s) => sum + s.amount * USDC_PRICE, 0),
        minLockPeriod: 30,
        maxLockPeriod: 365,
        participants: usdcStakes.length
      }
    ];
  }, [lockedAssets]);

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

  // Filter assets based on active tab
  const filteredAssets = lockedAssets.filter(asset => {
    // Tab-based filtering
    if (activeTab === 'locked' && asset.status === 'unlocked') return false;
    if (activeTab === 'unlocked' && asset.status !== 'unlocked') return false;
    return true;
  });

  const handleUnlock = async (id: string) => {
    const asset = lockedAssets.find(a => a.id === id);
    if (!asset) return;

    if (!connected || !address) {
      showErrorToast(new Error('Please connect your wallet first'));
      return;
    }

    try {
      showInfoToast('Claiming Asset', `Processing unlock for ${asset.amount} ${asset.token}...`, 'Please wait');

      // Check if we have stakeId from contract
      if (!asset.stakeId || asset.stakeId < 0) {
        showErrorToast(new Error('Invalid stake ID. Please sync with contract first.'));
        return;
      }
      
      // Validate unlock date
      if (Date.now() < asset.unlockDate) {
        showErrorToast(new Error('Asset is still locked. Use early unlock if needed.'));
        return;
      }

      // VaultStaking contract address
      const VAULT_STAKING_ADDRESS = '0xB156a66521BCB5A903daA42879A3e562E402Fa41';
      
      // Call withdraw(uint256 stakeId)
      // Function selector: 0x2e1a7d4d
      const stakeIdHex = asset.stakeId.toString(16).padStart(64, '0');
      const data = `0x2e1a7d4d${stakeIdHex}`;
      
      console.log('Normal unlock transaction:', {
        contract: VAULT_STAKING_ADDRESS,
        stakeId: asset.stakeId,
        data
      });
      
      // Use 'ETH' as tokenType since we're calling a contract function
      const result = await sendTransaction(
        VAULT_STAKING_ADDRESS,
        '0',
        'ETH',
        data,
        true
      );

      console.log('Withdrawal transaction sent:', result.hash);

      // Add to history
      addHistoryEntry({
        type: 'unstake',
        token: asset.token,
        tokenLogo: asset.tokenLogo,
        amount: asset.amount,
        timestamp: Date.now(),
        txHash: result.hash,
        apy: asset.apy,
        lockDuration: asset.lockDuration,
        status: 'completed'
      });
      
      showSuccessToast(
        'Asset Unlocked!',
        `${asset.amount} ${asset.token} unlocked successfully`,
        `Earned: ${asset.earnedYield.toFixed(4)} ${asset.token}`
      );

      // Wait for transaction to be mined then refresh from contract
      await new Promise(resolve => setTimeout(resolve, 3000));
      await syncStakesWithContract();
    } catch (error: any) {
      console.error('Unlock failed:', error);
      showErrorToast(error);
    }
  };

  const handleEarlyUnlock = (id: string) => {
    const asset = lockedAssets.find(a => a.id === id);
    if (asset) {
      // Calculate penalty before showing modal
      const penaltyInfo = calculateEarlyWithdrawalPenalty(
        asset.amount,
        asset.lockDate,
        asset.unlockDate,
        asset.totalYield,
        currentTime
      );
      console.log('Early unlock penalty:', penaltyInfo);
      setSelectedAsset(asset);
      setShowEarlyUnlockModal(true);
    }
  };

  const handleEarlyUnlockConfirm = async (assetId: string) => {
    const asset = lockedAssets.find(a => a.id === assetId);
    if (!asset) return;

    if (!connected || !address) {
      showErrorToast(new Error('Please connect your wallet first'));
      return;
    }

    try {
      // Calculate penalty for display
      const penaltyInfo = calculateEarlyWithdrawalPenalty(
        asset.amount,
        asset.lockDate,
        asset.unlockDate,
        asset.totalYield,
        currentTime
      );

      showInfoToast(
        'Processing Early Unlock',
        `Processing with ${penaltyInfo.penaltyPercentage.toFixed(1)}% penalty...`,
        'Penalty is unearned yield deducted from your principal'
      );

      // Check if we have stakeId from contract
      if (!asset.stakeId || asset.stakeId < 0) {
        showErrorToast(new Error('Invalid stake ID. Please sync with contract first.'));
        return;
      }
      
      // Validate it's actually early (still locked)
      if (Date.now() >= asset.unlockDate) {
        showErrorToast(new Error('Asset already unlocked. Use normal withdraw.'));
        return;
      }

      // VaultStaking contract address
      const VAULT_STAKING_ADDRESS = '0xB156a66521BCB5A903daA42879A3e562E402Fa41';
      
      // Validate contract address
      if (!VAULT_STAKING_ADDRESS || !VAULT_STAKING_ADDRESS.startsWith('0x')) {
        throw new Error('Invalid contract address');
      }
      
      // Call withdrawEarly(uint256 stakeId)
      // Function selector: 0x4f4b48f2 (ethers.id('withdrawEarly(uint256)'))
      const stakeIdHex = asset.stakeId.toString(16).padStart(64, '0');
      const data = `0x4f4b48f2${stakeIdHex}`;
      
      console.log('Early unlock transaction:', {
        contract: VAULT_STAKING_ADDRESS,
        stakeId: asset.stakeId,
        stakeIdHex,
        data,
        token: asset.token
      });
      
      // Use 'ETH' as tokenType since we're calling a contract function, not transferring tokens
      const result = await sendTransaction(
        VAULT_STAKING_ADDRESS,
        '0',
        'ETH',
        data,
        true
      );

      console.log('Early withdrawal transaction sent:', result.hash);

      const effectiveAmount = penaltyInfo.amountAfterPenalty;
      
      // Add to history
      addHistoryEntry({
        type: 'early_unstake',
        token: asset.token,
        tokenLogo: asset.tokenLogo,
        amount: asset.amount,
        timestamp: Date.now(),
        txHash: result.hash,
        penalty: penaltyInfo.penalty,
        apy: asset.apy,
        lockDuration: asset.lockDuration,
        status: 'completed'
      });
      
      showSuccessToast(
        'Early Unlock Complete!',
        `Unlocked ${asset.amount} ${asset.token}`,
        `Yield after penalty: ${effectiveAmount.toFixed(4)} ${asset.token}`
      );

      // Close modal
      setShowEarlyUnlockModal(false);
      setSelectedAsset(null);

      // Wait for transaction to be mined then refresh from contract
      await new Promise(resolve => setTimeout(resolve, 3000));
      await syncStakesWithContract();
    } catch (error: any) {
      console.error('Early unlock failed:', error);
      showErrorToast(error);
    }
  };

  const handleStake = (pool: StakePool) => {
    setSelectedPool(pool);
    setShowLockModal(true);
  };

  const handleStakeConfirm = async (token: string, amount: number, duration: number) => {
    console.log('Staking:', { token, amount, duration });
    
    if (!connected || !address) {
      console.error('Wallet not connected');
      throw new Error('Please connect your wallet first');
    }
    
    // Validate duration (only specific durations allowed)
    const validDurations = [30, 60, 90, 180, 365];
    if (!validDurations.includes(duration)) {
      throw new Error('Invalid lock duration. Must be 30, 60, 90, 180, or 365 days.');
    }

    try {
      // Get user balance for validation
      let userBalanceStr: string;
      switch (token) {
        case 'BTC':
          userBalanceStr = btcBalance;
          break;
        case 'SOL':
          userBalanceStr = solBalance;
          break;
        case 'USDC':
          userBalanceStr = usdcBalance;
          break;
        default:
          userBalanceStr = '0';
      }
      const userBalance = parseFloat(userBalanceStr);
      
      console.log('Staking validation:', {
        token,
        amount,
        userBalance,
        userBalanceStr
      });
      
      // Check if user has enough balance
      if (userBalance === 0 || isNaN(userBalance)) {
        throw new Error(`You don't have any ${token}. Please add funds to your wallet first.`);
      }
      
      // Validate stake parameters
      const validation = validateStakeParams(token, amount, userBalance);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // VaultStaking contract address
      const VAULT_STAKING_ADDRESS = '0xB156a66521BCB5A903daA42879A3e562E402Fa41';
      
      showInfoToast(
        'Staking to Vault Contract',
        `Staking ${amount} ${token} for ${duration} days...`,
        'Processing transaction'
      );

      let result;
      const decimals = getTokenDecimals(token);
      
      // Sanitize and validate amount before conversion
      if (!isFinite(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }
      
      // Use BigInt for large number handling (prevents overflow)
      // Convert decimal amount to wei using string manipulation to avoid precision loss
      const amountStr = amount.toFixed(decimals); // e.g., "1.5" -> "1.500000" for USDC
      const [whole, decimal = ''] = amountStr.split('.');
      const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);
      const amountInWei = BigInt(whole + paddedDecimal);
      
      // For ERC20 tokens (BTC, SOL, USDC): First approve, then call stakeToken
      const tokenAddress = getTokenAddress(token);
        
        showInfoToast(
          'Approval Required',
          `Approving ${token} for staking...`,
          'Step 1 of 2'
        );
        
        // Approve contract to spend tokens
        // approve(address spender, uint256 amount)
        // Function selector: 0x095ea7b3
        const spenderAddress = VAULT_STAKING_ADDRESS.toLowerCase().replace('0x', '');
        const spenderParam = spenderAddress.padStart(64, '0');
        const approveAmountHex = amountInWei.toString(16);
        const approveAmountParam = approveAmountHex.padStart(64, '0');
        const approveData = `0x095ea7b3${spenderParam}${approveAmountParam}`;
        
        console.log('Approve transaction details:', {
          tokenAddress,
          spender: VAULT_STAKING_ADDRESS,
          amountInWei: amountInWei.toString(),
          amountDecimal: amount,
          decimals,
          spenderParam,
          approveAmountParam,
          fullData: approveData,
          dataLength: approveData.length
        });
        
        // Verify data is correct length (should be 138 chars: 0x + 8 chars selector + 64 chars address + 64 chars amount)
        if (approveData.length !== 138) {
          throw new Error(`Invalid approve data length: ${approveData.length}, expected 138`);
        }
        
        await sendTransaction(tokenAddress, '0', 'ETH', approveData, true);
        
        showInfoToast(
          'Staking Tokens',
          `Staking ${amount} ${token}...`,
          'Step 2 of 2'
        );
        
        // Call stakeToken(address token, uint256 amount, uint256 lockDuration)
        // Function selector: 0x2a69b56f
        const tokenParam = tokenAddress.toLowerCase().replace('0x', '').padStart(64, '0');
        const stakeAmountParam = amountInWei.toString(16).padStart(64, '0');
        const durationParam = duration.toString(16).padStart(64, '0');
        const stakeData = `0x2a69b56f${tokenParam}${stakeAmountParam}${durationParam}`;
        
        result = await sendTransaction(
          VAULT_STAKING_ADDRESS,
          '0',
          'ETH',
          stakeData,
          true
        );

      console.log('Stake transaction sent:', result.hash);

      // Calculate effective APY for display
      const pool = stakePools.find(p => p.token === token);
      const durationMultipliers: Record<number, number> = {
        30: 0.7,
        60: 0.85,
        90: 1.0,
        180: 1.15,
        365: 1.3
      };
      const multiplier = durationMultipliers[duration] || 1.0;
      const effectiveAPY = pool ? pool.apy * multiplier : 0;
      
      // Add to history
      const stakePool = stakePools.find(p => p.token === token);
      addHistoryEntry({
        type: 'stake',
        token: token,
        tokenLogo: stakePool?.tokenLogo || '',
        amount: amount,
        timestamp: Date.now(),
        txHash: result.hash,
        apy: effectiveAPY,
        lockDuration: duration,
        status: 'completed'
      });
      
      showSuccessToast(
        'Staking Successful!',
        `Staked ${amount} ${token} for ${duration} days`,
        `APY: ${effectiveAPY.toFixed(2)}%`
      );
      
      // Wait for transaction to be mined then fetch from contract
      console.log('Waiting for transaction to be indexed...');
      await new Promise(resolve => setTimeout(resolve, 4000));
      await syncStakesWithContract();
      
      // Modal will auto-close after showing success (handled in LockAssetModal)
    } catch (error: any) {
      console.error('Staking failed:', error);
      showErrorToast(error);
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

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-orange-500/20 border-2 border-orange-500/40 text-orange-300'
                : 'bg-white/[0.03] border-2 border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
            }`}
          >
            <FaChartLine className="text-lg" />
            <span>History</span>
            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
              activeTab === 'history' ? 'bg-orange-500/30 text-orange-200' : 'bg-white/[0.05] text-gray-500'
            }`}>
              {history.length}
            </span>
          </motion.button>
        </motion.div>

        {/* Refresh Button */}
        {connected && (activeTab === 'locked' || activeTab === 'unlocked') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end mb-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => syncStakesWithContract()}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 rounded-lg text-blue-300 font-semibold text-sm transition-all duration-200"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                🔄
              </motion.div>
              <span>Refresh from Contract</span>
            </motion.button>
          </motion.div>
        )}

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
          ) : activeTab === 'history' ? (
            // Transaction History Section
            history.length === 0 ? (
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-12 border border-white/[0.08] text-center">
                <FaChartLine className="text-gray-600 text-5xl mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Transaction History</h3>
                <p className="text-gray-400">Your vault transactions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.slice().reverse().map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="bg-white/[0.03] backdrop-blur-sm rounded-lg p-4 border border-white/[0.08] hover:border-white/[0.15] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Type Badge */}
                        <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          item.type === 'stake' ? 'bg-purple-500/20 text-purple-300' :
                          item.type === 'unstake' ? 'bg-green-500/20 text-green-300' :
                          'bg-orange-500/20 text-orange-300'
                        }`}>
                          {item.type === 'stake' ? 'STAKED' : item.type === 'unstake' ? 'UNSTAKED' : 'EARLY UNLOCK'}
                        </div>

                        {/* Token & Amount */}
                        <div>
                          <div className="text-white font-semibold">
                            {Number(item.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })} {item.token}
                          </div>
                          <div className="text-gray-400 text-xs mt-0.5">
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* APY & Lock */}
                        {item.type === 'stake' && (
                          <div className="text-right">
                            <div className="text-green-400 text-sm font-bold">{item.apy}% APY</div>
                            <div className="text-gray-400 text-xs">{item.lockDuration} days</div>
                          </div>
                        )}

                        {/* Penalty */}
                        {item.penalty && (
                          <div className="text-right">
                            <div className="text-orange-400 text-sm font-bold">-{item.penalty}%</div>
                            <div className="text-gray-400 text-xs">Penalty</div>
                          </div>
                        )}

                        {/* Status & TX */}
                        <div className="text-right">
                          <div className={`text-sm font-bold mb-1 ${
                            item.status === 'completed' ? 'text-green-400' :
                            item.status === 'failed' ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>
                            {item.status.toUpperCase()}
                          </div>
                          <a
                            href={`https://sepolia.basescan.org/tx/${item.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-xs flex items-center space-x-1"
                          >
                            <span>{item.txHash.slice(0, 6)}...{item.txHash.slice(-4)}</span>
                            <FaExternalLinkAlt className="text-[8px]" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            // Locked/Unlocked Vault Cards
            filteredAssets.length === 0 ? (
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-12 border border-white/[0.08] text-center">
                <FaLock className="text-gray-600 text-5xl mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Vaults Found</h3>
                <p className="text-gray-400">Create your first vault to start earning yield</p>
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

        {/* Info Banner - Only show when NOT in history tab */}
        {activeTab !== 'history' && (
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
        )}

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
          userBalance={
            selectedPool?.token === 'BTC' ? btcBalance :
            selectedPool?.token === 'SOL' ? solBalance :
            usdcBalance
          }
          onConfirm={handleStakeConfirm}
        />
      </div>
    </div>
  );
};
