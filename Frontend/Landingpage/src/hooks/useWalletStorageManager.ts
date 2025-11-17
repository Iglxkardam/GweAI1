/**
 * Hook to manage wallet-specific storage and auto-cleanup on wallet changes
 * Now uses Dynamic embedded wallet
 */

import { useEffect, useRef } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { initializeStorageManager, migrateOldStorageToWallet, cleanupOldStorage, getStorageStats } from '../utils/storageManager';

export function useWalletStorageManager() {
  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address;
  const authenticated = !!primaryWallet;
  const previousAddress = useRef<string | undefined>(undefined);
  const hasMigrated = useRef(false);

  useEffect(() => {
    // Initialize storage manager with current wallet
    initializeStorageManager(address);

    // If wallet just connected for the first time, try migration
    if (authenticated && address && !hasMigrated.current) {
      // Check if old global storage exists
      const hasOldData = 
        localStorage.getItem('igl_chat_conversations') ||
        localStorage.getItem('transactions');
      
      if (hasOldData) {
        console.log('[WalletStorage] Detected old global storage, migrating...');
        migrateOldStorageToWallet(address);
        
        // Clean up old keys after successful migration
        setTimeout(() => {
          cleanupOldStorage();
        }, 1000);
      }
      
      hasMigrated.current = true;
    }

    // Log storage stats when wallet changes (dev mode)
    if (previousAddress.current !== address) {
      const stats = getStorageStats();
      console.log('[WalletStorage] Storage stats:', stats);
      console.log(`[WalletStorage] Active wallet: ${address || 'none'}`);
    }

    previousAddress.current = address;
  }, [address, authenticated]);

  return {
    currentWallet: address,
    isConnected: authenticated
  };
}
