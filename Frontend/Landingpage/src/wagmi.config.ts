import { http, createConfig } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';

// Wagmi config for Base Sepolia with multiple wallet options
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(), // MetaMask, Brave Wallet, etc
    coinbaseWallet({
      appName: 'SipLedger',
      preference: 'smartWalletOnly', // Use Coinbase Smart Wallet (embedded)
    }),
    walletConnect({
      projectId: '3fbb6bba6f1de962d911bb5b5c9ddd26',
      metadata: {
        name: 'SipLedger',
        description: 'DeFi Trading Platform',
        url: 'https://sipledger.com',
        icons: ['https://sipledger.com/icon.png'],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});
