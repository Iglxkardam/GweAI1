/**
 * Hook to fetch user's swap transactions from blockchain
 */

import { useState, useEffect, useCallback } from 'react';
import { createPublicClient, http, fallback, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import { getVerifiedContract } from '../../../config/contracts';

const ROUTER_ADDRESS = getVerifiedContract('ROUTER');

export interface SwapTransaction {
  hash: string;
  timestamp: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  user: string;
  blockNumber: bigint;
}

export const useSwapTransactions = (userAddress: string | undefined, enabled: boolean = true) => {
  const [transactions, setTransactions] = useState<SwapTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!userAddress || !enabled) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: fallback([
          http('https://base-sepolia.g.alchemy.com/v2/-mGklZw8tTiO9fg9sRGQP', { timeout: 10000 }),
          http('https://base-sepolia.blockpi.network/v1/rpc/public', { timeout: 10000 }),
          http('https://base-sepolia-rpc.publicnode.com', { timeout: 10000 }),
        ]),
      });

      // Get current block
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock - BigInt(10000); // Last ~10k blocks (~5 hours on Base)

      // Fetch Swapped events for user
      // event Swapped(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 outBeforeFee, uint256 protocolFee, uint256 outAfterFee)
      const logs = await publicClient.getLogs({
        address: ROUTER_ADDRESS as `0x${string}`,
        event: parseAbiItem('event Swapped(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 outBeforeFee, uint256 protocolFee, uint256 outAfterFee)'),
        args: {
          user: userAddress as `0x${string}`,
        },
        fromBlock,
        toBlock: 'latest',
      });

      // Parse logs into transactions
      const parsedTransactions = await Promise.all(
        logs.map(async (log) => {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          
          return {
            hash: log.transactionHash,
            timestamp: Number(block.timestamp),
            tokenIn: log.args.tokenIn as string,
            tokenOut: log.args.tokenOut as string,
            amountIn: log.args.amountIn?.toString() || '0',
            amountOut: log.args.outAfterFee?.toString() || '0',
            user: log.args.user as string,
            blockNumber: log.blockNumber,
          };
        })
      );

      // Sort by timestamp (newest first)
      parsedTransactions.sort((a, b) => b.timestamp - a.timestamp);

      setTransactions(parsedTransactions);
    } catch (err: any) {
      console.error('Failed to fetch swap transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [userAddress, enabled]);

  useEffect(() => {
    fetchTransactions();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
};
