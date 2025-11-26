export interface LockedAsset {
  id: string;
  stakeId?: number; // On-chain stake ID from VaultStaking contract
  token: string;
  tokenLogo: string;
  amount: number;
  usdValue: number;
  lockDate: number; // timestamp
  unlockDate: number; // timestamp
  lockDuration: number; // in days
  apy: number; // annual percentage yield
  earnedYield: number;
  totalYield: number;
  status: 'locked' | 'unlocking' | 'unlocked';
  strategy: 'fixed' | 'flexible' | 'perpetual';
}

export interface FreeAsset {
  token: string;
  tokenLogo: string;
  balance: number;
  usdValue: number;
  apy: number;
}

export interface StakePool {
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

export interface VaultStats {
  totalLocked: number;
  totalYieldEarned: number;
  activeVaults: number;
  averageAPY: number;
  totalAssets: number;
}

export interface VaultFilter {
  status: 'all' | 'locked' | 'unlocking' | 'unlocked';
  token: 'all' | string;
  sortBy: 'apy' | 'amount' | 'timeLeft' | 'yield';
}

export interface VaultHistory {
  id: string;
  type: 'stake' | 'unstake' | 'early_unstake';
  token: string;
  tokenLogo: string;
  amount: number;
  timestamp: number;
  txHash: string;
  penalty?: number;
  apy?: number;
  lockDuration?: number;
  status: 'completed' | 'pending' | 'failed';
}
