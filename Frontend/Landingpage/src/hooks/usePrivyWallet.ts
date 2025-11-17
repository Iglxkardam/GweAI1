import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useCallback } from 'react';
import { formatEther, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';

export const useDynamicWallet = () => {
  const { 
    primaryWallet,
    user,
    setShowAuthFlow,
    handleLogOut,
  } = useDynamicContext();
  
  // Get wallet address
  const address = primaryWallet?.address;
  const authenticated = !!primaryWallet;
  
  // Connect wallet (login with Dynamic)
  const connect = useCallback(async () => {
    if (!authenticated) {
      setShowAuthFlow(true);
    }
  }, [authenticated, setShowAuthFlow]);
  
  // Disconnect wallet
  const disconnect = useCallback(async () => {
    await handleLogOut();
  }, [handleLogOut]);
  
  // Get balance
  const getBalance = useCallback(async (): Promise<string> => {
    if (!primaryWallet) return '0';
    
    try {
      const provider = await (primaryWallet as any).getWalletClient?.();
      const balance = await provider.request({
        method: 'eth_getBalance',
        params: [primaryWallet.address, 'latest'],
      });
      
      // Convert hex balance to decimal
      const balanceInWei = BigInt(balance as string);
      return formatEther(balanceInWei);
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }, [primaryWallet]);
  
  // Send transaction
  const send = useCallback(async (to: string, amount: string) => {
    if (!primaryWallet) {
      throw new Error('No wallet connected');
    }
    
    try {
      const provider = await (primaryWallet as any).getWalletClient?.();
      const amountInWei = parseEther(amount);
      
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: primaryWallet.address,
          to,
          value: `0x${amountInWei.toString(16)}`,
          chainId: baseSepolia.id,
        }],
      });
      
      return { hash: txHash as string };
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }, [primaryWallet]);
  
  return {
    // Connection state
    isReady: true,
    isConnected: authenticated,
    address,
    user,
    
    // Wallet info
    chainId: baseSepolia.id,
    chainName: baseSepolia.name,
    
    // Actions
    connect,
    disconnect,
    getBalance,
    send,
    
    // Primary wallet
    primaryWallet,
  };
};
