/**
 * AI Portfolio Service - Read-Only Wallet Information
 * Provides safe, read-only access to user's portfolio data
 * NO ACCESS TO: Private keys, mnemonics, signing capabilities
 */

import { VERIFIED_TOKENS } from '../../../config/contracts';
import { TOKENS } from '../../../config/tokens';

export interface TokenBalance {
  symbol: string;
  balance: string;
  balanceUSD: string;
  price: string;
  logo: string;
}

export interface PortfolioData {
  totalBalanceUSD: string;
  tokens: TokenBalance[];
  walletAddress: string;
}

/**
 * Get user's portfolio balances (READ-ONLY)
 * Safe function - only reads public blockchain data
 */
export async function getUserPortfolio(address: string): Promise<PortfolioData> {
  if (!address) {
    throw new Error('Wallet address required');
  }

  try {
    const { createPublicClient, http, fallback, erc20Abi, formatUnits } = await import('viem');
    const { baseSepolia } = await import('viem/chains');

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: fallback([
        http('https://base-sepolia.g.alchemy.com/v2/demo', { timeout: 8000 }),
        http('https://base-sepolia.blockpi.network/v1/rpc/public', { timeout: 8000 }),
        http('https://base-sepolia-rpc.publicnode.com', { timeout: 8000 }),
      ]),
    });

    const tokens: TokenBalance[] = [];
    let totalUSD = 0;

    // Fetch balances for all verified tokens
    for (const [symbol, tokenAddress] of Object.entries(VERIFIED_TOKENS)) {
      try {
        const tokenConfig = TOKENS[symbol];
        if (!tokenConfig) continue;

        // Read token balance (PUBLIC DATA - SAFE)
        const balance = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        }) as bigint;

        const balanceFormatted = formatUnits(balance, tokenConfig.decimals);
        const balanceFloat = parseFloat(balanceFormatted);

        if (balanceFloat > 0) {
          // Get price from Binance (faster & more reliable)
          let price = 0;
          try {
            const binanceSymbol = `${symbol}USDT`;
            const priceResponse = await fetch(
              `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`
            );
            if (priceResponse.ok) {
              const priceData = await priceResponse.json();
              price = parseFloat(priceData.price) || 0;
            }
          } catch {
            console.warn(`Binance price fetch failed for ${symbol}`);
          }

          const balanceUSD = balanceFloat * price;
          totalUSD += balanceUSD;

          tokens.push({
            symbol,
            balance: balanceFloat.toFixed(tokenConfig.decimals === 6 ? 2 : tokenConfig.decimals === 8 ? 8 : 4),
            balanceUSD: balanceUSD.toFixed(2),
            price: price.toFixed(2),
            logo: tokenConfig.logo
          });
        }
      } catch (error) {
        console.error(`Error fetching balance for ${symbol}:`, error);
      }
    }

    return {
      totalBalanceUSD: totalUSD.toFixed(2),
      tokens: tokens.sort((a, b) => parseFloat(b.balanceUSD) - parseFloat(a.balanceUSD)),
      walletAddress: address
    };

  } catch (error) {
    console.error('Portfolio fetch error:', error);
    throw error;
  }
}

/**
 * Format portfolio data for AI response (SAFE)
 */
export function formatPortfolioForAI(portfolio: PortfolioData): string {
  if (!portfolio.tokens.length) {
    return `Your wallet is currently empty. No tokens found at address ${maskAddress(portfolio.walletAddress)}.`;
  }

  let response = `📊 **Your Portfolio** (${maskAddress(portfolio.walletAddress)})\n\n`;
  response += `💰 **Total Balance:** $${portfolio.totalBalanceUSD}\n\n`;
  response += `**Holdings:**\n`;

  portfolio.tokens.forEach((token, index) => {
    response += `${index + 1}. **${token.symbol}**: ${token.balance} ($${token.balanceUSD})\n`;
    response += `   Price: $${token.price}\n`;
  });

  response += `\n---\n`;
  response += `_Data is read from blockchain. Prices from Binance API (real-time)._`;

  return response;
}

/**
 * Mask wallet address for privacy (show first 6, last 4)
 */
function maskAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Parse portfolio query from user message
 */
export function isPortfolioQuery(message: string): boolean {
  const portfolioKeywords = /(my portfolio|my balance|my wallet|holdings|how much|how many|kitna|kitne|balance check|show balance|check.*balance|what.*balance)/i;
  const specificTokenQuery = /(how much|how many|kitna|kitne|do i have|i have) (btc|eth|sol|bnb|usdc|avax|xrp|ton|doge|ada|trx)/i;
  
  return portfolioKeywords.test(message) || specificTokenQuery.test(message);
}

/**
 * Extract specific token query
 */
export function extractTokenQuery(message: string): string | null {
  const match = message.match(/(btc|eth|sol|bnb|usdc|avax|xrp|ton|doge|ada|trx|bitcoin|ethereum|solana|binance|ripple|toncoin|avalanche|dogecoin|cardano|tron)/i);
  
  if (!match) return null;
  
  const token = match[1].toLowerCase();
  const tokenMap: Record<string, string> = {
    'bitcoin': 'BTC', 'btc': 'BTC',
    'ethereum': 'ETH', 'eth': 'ETH',
    'solana': 'SOL', 'sol': 'SOL',
    'binance': 'BNB', 'bnb': 'BNB',
    'ripple': 'XRP', 'xrp': 'XRP',
    'toncoin': 'TON', 'ton': 'TON',
    'avalanche': 'AVAX', 'avax': 'AVAX',
    'dogecoin': 'DOGE', 'doge': 'DOGE',
    'cardano': 'ADA', 'ada': 'ADA',
    'tron': 'TRX', 'trx': 'TRX',
    'usdc': 'USDC'
  };
  
  return tokenMap[token] || null;
}

/**
 * Format specific token balance for AI
 */
export function formatTokenBalance(portfolio: PortfolioData, tokenSymbol: string): string {
  const token = portfolio.tokens.find(t => t.symbol === tokenSymbol);
  
  if (!token) {
    return `You don't have any ${tokenSymbol} in your wallet. Your ${tokenSymbol} balance is 0.`;
  }

  return `💰 **${token.symbol} Balance**\n\n` +
         `Amount: ${token.balance} ${token.symbol}\n` +
         `Value: $${token.balanceUSD}\n` +
         `Current Price: $${token.price}\n\n` +
         `_Data from blockchain (${maskAddress(portfolio.walletAddress)})_`;
}
