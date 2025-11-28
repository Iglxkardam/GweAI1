import { http, createConfig, fallback } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';

// Multiple RPC endpoints for Base Sepolia - automatic fallback on rate limits
// NOTE: Removed sepolia.base.org due to aggressive rate limiting causing 403 errors
const BASE_SEPOLIA_RPCS = [
  'https://base-sepolia.g.alchemy.com/v2/demo',
  'https://base-sepolia.blockpi.network/v1/rpc/public',
  'https://base-sepolia-rpc.publicnode.com',
];

// Wagmi config for Base Sepolia with multiple wallet options
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(), // MetaMask, Brave Wallet, etc
    coinbaseWallet({
      appName: 'GweAI',
      preference: 'smartWalletOnly', // Use Coinbase Smart Wallet (embedded)
    }),
    walletConnect({
      projectId: '3fbb6bba6f1de962d911bb5b5c9ddd26',
      metadata: {
        name: 'GweAI',
        description: 'AI-Powered DeFi Trading Platform',
        url: 'https://gweai.com',
        icons: ['https://gweai.com/icon.png'],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [baseSepolia.id]: fallback(
      BASE_SEPOLIA_RPCS.map(url => http(url, {
        timeout: 10000,
        retryCount: 3,
        retryDelay: 150,
      }))
    ),
  },
});
