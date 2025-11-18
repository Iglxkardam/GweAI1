/**
 * Utility functions for formatting addresses, balances, and other data
 */

/**
 * Truncate Ethereum address for display
 * @example "0x1234...5678"
 */
export const truncateAddress = (address: string, startChars = 6, endChars = 4): string => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Format balance with specified decimals
 * @example formatBalance("1.23456789", 4) => "1.2346"
 */
export const formatBalance = (balance: string | number, decimals = 4): string => {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (isNaN(num)) return '0.0000';
  
  // Handle very small numbers
  if (num < 0.0001 && num > 0) {
    return '< 0.0001';
  }
  
  return num.toFixed(decimals);
};

/**
 * Format balance with token symbol
 * @example formatBalanceWithSymbol("1.5", "ETH") => "1.5000 ETH"
 */
export const formatBalanceWithSymbol = (
  balance: string | number, 
  symbol: string = 'ETH', 
  decimals = 4
): string => {
  // Map common token symbols to their proper display names
  const tokenNames: Record<string, string> = {
    'ETH': 'ETH',
    'USDC': 'USDC',
    'BTC': 'BTC',
    'SOL': 'SOL',
    'BNB': 'BNB',
    'XRP': 'XRP',
    'TON': 'TON',
    'AVAX': 'AVAX',
    'TRON': 'TRX',
    'TRX': 'TRX',
    'CARDANO': 'ADA',
    'ADA': 'ADA',
    'DOGE': 'DOGE',
  };
  
  const displaySymbol = tokenNames[symbol.toUpperCase()] || symbol;
  return `${formatBalance(balance, decimals)} ${displaySymbol}`;
};

/**
 * Format USD value
 * @example formatUSD(1234.56) => "$1,234.56"
 */
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format timestamp to readable date
 * @example formatDate(new Date()) => "Nov 4, 2025 3:45 PM"
 */
export const formatDate = (date: Date | number | string): string => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
};

/**
 * Format relative time
 * @example formatRelativeTime(Date.now() - 3600000) => "1 hour ago"
 */
export const formatRelativeTime = (timestamp: Date | number | string): string => {
  const now = Date.now();
  let then: number;
  
  if (typeof timestamp === 'string') {
    then = new Date(timestamp).getTime();
  } else if (typeof timestamp === 'number') {
    then = timestamp;
  } else {
    then = timestamp.getTime();
  }
  
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  
  return formatDate(timestamp);
};

/**
 * Generate QR code value for deposits
 * Uses simple address format for maximum wallet compatibility
 * Most wallets don't support chain-specific QR codes, so we use the plain address
 * Users will need to manually select the correct network (Abstract Testnet) in their wallet
 * @see https://eips.ethereum.org/EIPS/eip-681
 */
export const generateQRValue = (
  address: string,
  _chainId?: number,
  _tokenContract?: string
): string => {
  // For maximum compatibility with wallet apps, just return the address
  // Users will need to manually select the correct network (Abstract Testnet)
  // Most mobile wallets don't support chain-specific QR codes
  return address;
};

/**
 * Validate Ethereum address format
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Convert Wei to ETH
 */
export const weiToEth = (wei: string | number): string => {
  const weiNum = typeof wei === 'string' ? BigInt(wei) : BigInt(wei);
  const eth = Number(weiNum) / 1e18;
  return eth.toString();
};

/**
 * Convert ETH to Wei
 */
export const ethToWei = (eth: string | number): string => {
  const ethNum = typeof eth === 'string' ? parseFloat(eth) : eth;
  const wei = BigInt(Math.floor(ethNum * 1e18));
  return wei.toString();
};

/**
 * Get block explorer URL for transaction
 */
export const getExplorerUrl = (
  txHash: string, 
  chainId: number = 11124, 
  type: 'tx' | 'address' = 'tx'
): string => {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    5: 'https://goerli.etherscan.io',
    11124: 'https://explorer.testnet.abs.xyz', // Abstract Testnet
    // Add more chains as needed
  };
  
  const baseUrl = explorers[chainId] || explorers[11124];
  return `${baseUrl}/${type}/${txHash}`;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Format transaction status with emoji
 */
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '🕐 Pending',
    confirmed: '✅ Confirmed',
    completed: '✅ Completed',
    failed: '❌ Failed',
  };
  
  return statusMap[status.toLowerCase()] || status;
};
