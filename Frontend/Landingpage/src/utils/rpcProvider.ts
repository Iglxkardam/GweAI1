/**
 * Optimized RPC Provider with fallback, caching, and rate limiting
 */

import { createPublicClient, http, PublicClient, fallback } from 'viem';
import { baseSepolia } from 'viem/chains';

// Multiple RPC endpoints for redundancy (ordered by reliability)
const RPC_ENDPOINTS = [
  'https://base-sepolia.g.alchemy.com/v2/demo', // Alchemy has best rate limits
  'https://base-sepolia.blockpi.network/v1/rpc/public',
  'https://base-sepolia-rpc.publicnode.com',
];

// Cache for frequently accessed data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class RPCCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly TTL = 10000; // 10 seconds cache

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const rpcCache = new RPCCache();

// Create singleton public client with fallback
let publicClientInstance: PublicClient | null = null;

export const getPublicClient = (): PublicClient => {
  if (!publicClientInstance) {
    publicClientInstance = createPublicClient({
      chain: baseSepolia,
      transport: fallback(
        RPC_ENDPOINTS.map(url => http(url, {
          timeout: 5000, // 5 second timeout per request
          retryCount: 2,
          retryDelay: 1000,
        })),
        {
          rank: false, // Use in order (primary first)
        }
      ),
      batch: {
        multicall: true, // Enable batch calls
      },
      cacheTime: 4000, // 4 second cache for RPC responses
    }) as PublicClient;

    console.log('✅ Public client initialized with', RPC_ENDPOINTS.length, 'fallback providers');
  }

  return publicClientInstance;
};

// Cached block number with smart refresh
let cachedBlockNumber: { block: bigint; timestamp: number } | null = null;
const BLOCK_CACHE_TIME = 2000; // 2 seconds (Base has ~2 sec blocks)

export const getCurrentBlock = async (): Promise<bigint> => {
  const now = Date.now();
  
  if (cachedBlockNumber && (now - cachedBlockNumber.timestamp) < BLOCK_CACHE_TIME) {
    return cachedBlockNumber.block;
  }

  const client = getPublicClient();
  const block = await client.getBlockNumber();
  
  cachedBlockNumber = { block, timestamp: now };
  return block;
};

// Rate limiter
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 50; // 50 requests
  private readonly timeWindow = 10000; // per 10 seconds

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove old requests outside time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      console.warn('⚠️ Rate limit reached, throttling requests');
      return false;
    }

    this.requests.push(now);
    return true;
  }

  getWaitTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    const waitTime = this.timeWindow - (Date.now() - oldestRequest);
    return Math.max(0, waitTime);
  }
}

export const rateLimiter = new RateLimiter();

// Safe RPC call wrapper with retry
export async function safeRPCCall<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  cacheKey?: string
): Promise<T> {
  // Check cache first
  if (cacheKey) {
    const cached = rpcCache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Rate limiting
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = rateLimiter.getWaitTime();
    console.log(`⏱️ Rate limited, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  // Retry logic
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn();
      
      // Cache successful result
      if (cacheKey) {
        rpcCache.set(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`RPC call attempt ${i + 1}/${maxRetries} failed:`, error);
      
      if (i < maxRetries - 1) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, i), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('RPC call failed after retries');
}

// Preload critical data on initialization
export const preloadCriticalData = async () => {
  try {
    getPublicClient();
    await Promise.all([
      getCurrentBlock(),
      // Add other critical preloads here
    ]);
    console.log('✅ Critical RPC data preloaded');
  } catch (error) {
    console.error('⚠️ Failed to preload RPC data:', error);
  }
};
