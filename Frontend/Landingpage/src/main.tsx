import ReactDOM from 'react-dom/client'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './utils/serviceWorkerRegistration'
import { initializeSecurity } from './utils/security';
import { suppressDynamicLogs } from './utils/suppressDynamicLogs';

// Initialize minimal security (like Uniswap/Hyperliquid)
initializeSecurity();

// Suppress Dynamic SDK debug logs
suppressDynamicLogs();

// Register service worker for PWA functionality
registerServiceWorker();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <DynamicContextProvider
    settings={{
      environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID,
      walletConnectors: [EthereumWalletConnectors],
      
      // Use connect-and-sign for authentication support
      initialAuthenticationMode: 'connect-and-sign',
      
      // Recommended wallets configuration
      recommendedWallets: [
        { walletKey: 'metamask' },
        { walletKey: 'coinbase' },
        { walletKey: 'walletconnect' },
      ],
      
      // Privacy settings for faster load
      privacyPolicyUrl: undefined,
      termsOfServiceUrl: undefined,
      
      // Network overrides - completely override default networks
      overrides: {
        evmNetworks: () => [
          // Base Sepolia
          {
            blockExplorerUrls: ['https://sepolia.basescan.org'],
            chainId: 84532,
            chainName: 'Base Sepolia',
            iconUrls: ['https://avatars.githubusercontent.com/u/108554348?s=280&v=4'],
            name: 'Base Sepolia Testnet',
            nativeCurrency: {
              decimals: 18,
              name: 'ETH',
              symbol: 'ETH',
            },
            networkId: 84532,
            rpcUrls: ['https://base-sepolia.g.alchemy.com/v2/-mGklZw8tTiO9fg9sRGQP'],
            vanityName: 'Base Sepolia',
          },
          // BNB Smart Chain Testnet
          {
            blockExplorerUrls: ['https://testnet.bscscan.com'],
            chainId: 97,
            chainName: 'BSC Testnet',
            iconUrls: ['https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png'],
            name: 'Binance Smart Chain Testnet',
            nativeCurrency: {
              decimals: 18,
              name: 'tBNB',
              symbol: 'tBNB',
            },
            networkId: 97,
            rpcUrls: ['https://data-seed-prebsc-1-s1.bnbchain.org:8545', 'https://bsc-testnet.publicnode.com'],
            vanityName: 'BSC Testnet',
          },
        ],
      },
      
      // Event listeners for wallet actions - optimized
      events: {
        onAuthSuccess: (args) => {
          // Minimal storage for faster response
          if (args.user?.userId) {
            localStorage.setItem('dynamic_user_id', args.user.userId);
          }
          console.log('✅ Auth successful:', args.user?.email || args.primaryWallet?.address);
        },
        
        onAuthFailure: (error) => {
          // Log auth errors for debugging
          console.error('❌ Auth failed:', error || 'Unknown error');
        },
        
        onLogout: () => {
          // Fast cleanup
          localStorage.removeItem('dynamic_user_id');
        },
        
        onEmbeddedWalletCreated: () => {
          // Wallet created successfully
        },
      },
    }}
  >
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </DynamicContextProvider>,
)
