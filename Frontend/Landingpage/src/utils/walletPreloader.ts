/**
 * Wallet Client Preloader
 * Preloads Dynamic wallet client on button hover/focus for instant popup
 */

let preloadPromise: Promise<any> | null = null;

/**
 * Preload wallet client (call on button hover/focus)
 * Safe to call multiple times - will only fetch once
 */
export function preloadWalletClient(primaryWallet: any) {
  if (!primaryWallet || preloadPromise) {
    return preloadPromise;
  }

  console.log('[WalletPreloader] ⚡ Preloading wallet client...');
  
  preloadPromise = (primaryWallet as any).getWalletClient?.()
    .then((client: any) => {
      console.log('[WalletPreloader] ✅ Wallet client preloaded successfully');
      return client;
    })
    .catch((error: any) => {
      console.warn('[WalletPreloader] ⚠️  Preload failed (will retry on click):', error);
      preloadPromise = null; // Reset so it can be retried
      return null;
    });

  return preloadPromise;
}

/**
 * Clear preload cache (call when wallet disconnects)
 */
export function clearPreloadCache() {
  preloadPromise = null;
  console.log('[WalletPreloader] 🗑️  Cache cleared');
}

/**
 * React hook for button preloading
 * Returns onMouseEnter and onFocus handlers to add to buttons
 */
export function useWalletPreload(primaryWallet: any) {
  return {
    onMouseEnter: () => preloadWalletClient(primaryWallet),
    onFocus: () => preloadWalletClient(primaryWallet),
  };
}
