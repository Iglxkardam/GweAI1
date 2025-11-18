/**
 * Hook to fetch recent trades from blockchain
 * Listens to Router contract Bought/Sold events
 * Stores last 50 trades per token in localStorage
 * OPTIMIZED: Uses fallback RPC providers with caching
 * SECURITY: Uses verified contract address (hardcoded, not from env)
 */

import { useState, useEffect, useCallback } from 'react';
import { parseAbiItem } from 'viem';
import { getPublicClient, getCurrentBlock, safeRPCCall } from '../../../utils/rpcProvider';
import { getVerifiedContract } from '../../../config/contracts';

// Use verified contract address (cannot be modified via env)
const ROUTER_ADDRESS = getVerifiedContract('ROUTER');
const BASE_SEPOLIA_EXPLORER = 'https://sepolia.basescan.org';

export interface Trade {
  id: string;
  txHash: string;
  user: string;
  price: number;
  amount: number;
  total: number;
  time: Date;
  type: 'buy' | 'sell';
  blockNumber: number;
  explorerLink: string;
}

const MAX_TRADES_PER_TOKEN = 50;

// Event signatures
const BOUGHT_EVENT = parseAbiItem('event Bought(address indexed user, address indexed token, uint256 usdcIn, uint256 outBeforeFee, uint256 protocolFee, uint256 outAfterFee)');
const SOLD_EVENT = parseAbiItem('event Sold(address indexed user, address indexed token, uint256 tokenIn, uint256 outBeforeFee, uint256 protocolFee, uint256 outAfterFee)');

// Use optimized singleton client with fallback providers
const publicClient = getPublicClient();

export const useRecentTrades = (tokenAddress: string, _tokenSymbol: string, tokenDecimals: number, userAddress?: string) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get storage key for this token and user
  const getStorageKey = useCallback(() => {
    if (userAddress) {
      return `trades_${tokenAddress.toLowerCase()}_${userAddress.toLowerCase()}`;
    }
    return `trades_${tokenAddress.toLowerCase()}_all`;
  }, [tokenAddress, userAddress]);

  // Load trades from localStorage
  const loadFromStorage = useCallback((): Trade[] => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((t: any) => ({
        ...t,
        time: new Date(t.time)
      }));
    } catch (err) {
      console.error('Error loading trades from storage:', err);
      return [];
    }
  }, [getStorageKey]);

  // Save trades to localStorage
  const saveToStorage = useCallback((tradesToSave: Trade[]) => {
    try {
      // Keep only last 50 trades
      const limited = tradesToSave.slice(0, MAX_TRADES_PER_TOKEN);
      localStorage.setItem(getStorageKey(), JSON.stringify(limited));
    } catch (err) {
      console.error('Error saving trades to storage:', err);
    }
  }, [getStorageKey]);

  // Fetch recent trades from blockchain
  const fetchTrades = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use cached block number to reduce RPC calls
      const currentBlock = await getCurrentBlock();
      const fromBlock = currentBlock - 5000n; // Last 5k blocks (~1.5 hours)

      // Fetch events in parallel with safeRPCCall wrapper
      const [buyLogs, sellLogs] = await Promise.all([
        safeRPCCall(
          () => publicClient.getLogs({
            address: ROUTER_ADDRESS,
            event: BOUGHT_EVENT,
            args: userAddress ? {
              user: userAddress as `0x${string}`,
              token: tokenAddress as `0x${string}`,
            } : {
              token: tokenAddress as `0x${string}`,
            },
            fromBlock: fromBlock > 0n ? fromBlock : 0n,
            toBlock: 'latest',
          }),
          3, // max retries
          `buy-logs-${tokenAddress}-${userAddress || 'all'}` // cache key
        ),
        safeRPCCall(
          () => publicClient.getLogs({
            address: ROUTER_ADDRESS,
            event: SOLD_EVENT,
            args: userAddress ? {
              user: userAddress as `0x${string}`,
              token: tokenAddress as `0x${string}`,
            } : {
              token: tokenAddress as `0x${string}`,
            },
            fromBlock: fromBlock > 0n ? fromBlock : 0n,
            toBlock: 'latest',
          }),
          3,
          `sell-logs-${tokenAddress}-${userAddress || 'all'}`
        ),
      ]);

      // Process buy trades - NO block timestamp fetching to avoid rate limits
      const buyTrades: Trade[] = buyLogs.map(log => {
        const args = log.args as any;
        const amountOut = Number(args.outAfterFee) / Math.pow(10, tokenDecimals); // Token amount received
        const amountIn = Number(args.usdcIn) / 1e6; // USDC has 6 decimals
        const price = amountIn / amountOut; // USD per token

        return {
          id: `${log.transactionHash}-${log.logIndex}`,
          txHash: log.transactionHash,
          user: args.user,
          price: price,
          amount: amountOut,
          total: amountIn,
          time: new Date(), // Use current time to avoid RPC calls
          type: 'buy' as const,
          blockNumber: Number(log.blockNumber),
          explorerLink: `${BASE_SEPOLIA_EXPLORER}/tx/${log.transactionHash}`,
        };
      });

      // Process sell trades - NO block timestamp fetching
      const sellTrades: Trade[] = sellLogs.map(log => {
        const args = log.args as any;
        const amountIn = Number(args.tokenIn) / Math.pow(10, tokenDecimals); // Token amount sold
        const amountOut = Number(args.outAfterFee) / 1e6; // USDC has 6 decimals
        const price = amountOut / amountIn; // USD per token

        return {
          id: `${log.transactionHash}-${log.logIndex}`,
          txHash: log.transactionHash,
          user: args.user,
          price: price,
          amount: amountIn,
          total: amountOut,
          time: new Date(), // Use current time
          type: 'sell' as const,
          blockNumber: Number(log.blockNumber),
          explorerLink: `${BASE_SEPOLIA_EXPLORER}/tx/${log.transactionHash}`,
        };
      });

      // Combine and sort by block number (newest first)
      const allTrades = [...buyTrades, ...sellTrades].sort((a, b) => b.blockNumber - a.blockNumber);

      // Load existing trades from storage
      const existingTrades = loadFromStorage();

      // Merge new trades with existing ones (avoid duplicates)
      const existingIds = new Set(existingTrades.map(t => t.id));
      const newTrades = allTrades.filter(t => !existingIds.has(t.id));

      // Combine and sort by block number
      const combinedTrades = [...newTrades, ...existingTrades]
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, MAX_TRADES_PER_TOKEN);

      // Save to storage
      saveToStorage(combinedTrades);

      setTrades(combinedTrades);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching trades:', err);
      setError(err.message || 'Failed to fetch trades');
      
      // Load from storage as fallback
      const storedTrades = loadFromStorage();
      setTrades(storedTrades);
      setLoading(false);
    }
  }, [tokenAddress, tokenDecimals, userAddress]); // FIXED: Removed unstable dependencies

  // Initial fetch and periodic refresh
  useEffect(() => {
    // Load from storage immediately
    const storedTrades = loadFromStorage();
    setTrades(storedTrades);
    setLoading(false);

    // Fetch fresh data
    fetchTrades();

    // Refresh every 2 minutes to avoid rate limits
    const interval = setInterval(fetchTrades, 120000);

    return () => clearInterval(interval);
  }, [tokenAddress, userAddress]); // FIXED: Only stable dependencies

  return {
    trades,
    loading,
    error,
    refetch: fetchTrades,
  };
};
