import ReactDOM from 'react-dom/client'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './utils/serviceWorkerRegistration'
import { initializeSecurity } from './utils/security';

// Initialize minimal security (like Uniswap/Hyperliquid)
initializeSecurity();

// Register service worker for PWA functionality
registerServiceWorker();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <DynamicContextProvider
    settings={{
      environmentId: 'e058e433-3566-4524-9f9f-5fb054a8e6bb',
      walletConnectors: [EthereumWalletConnectors],
      
      // Authentication mode - connect and sign for better security
      initialAuthenticationMode: 'connect-and-sign',
      
      // Recommended wallets configuration
      recommendedWallets: [
        { walletKey: 'metamask' },
        { walletKey: 'coinbase' },
        { walletKey: 'walletconnect' },
      ],
      
      // Network overrides
      overrides: {
        evmNetworks: [
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
            rpcUrls: ['https://sepolia.base.org'],
            vanityName: 'Base Sepolia',
          },
        ],
      },
      
      // Event listeners for wallet actions
      events: {
        onAuthSuccess: (args) => {
          console.log('✅ Auth success:', args);
          // Store user data or trigger analytics
          if (args.user) {
            localStorage.setItem('dynamic_user_id', args.user.userId || '');
          }
        },
        
        onAuthFailure: (error) => {
          console.error('❌ Auth failed:', error);
          // Show error notification or retry logic
        },
        
        onLogout: () => {
          console.log('👋 User logged out');
          // Clear user data
          localStorage.removeItem('dynamic_user_id');
        },
        
        onAuthFlowOpen: () => {
          console.log('🔐 Auth flow opened');
        },
        
        onAuthFlowClose: () => {
          console.log('🔒 Auth flow closed');
        },
        
        onEmbeddedWalletCreated: (wallet: any) => {
          console.log('🎉 Embedded wallet created:', wallet);
        },
      },
    }}
  >
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </DynamicContextProvider>,
)
