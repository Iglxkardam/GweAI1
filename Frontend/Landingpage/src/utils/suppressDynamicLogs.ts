/**
 * Suppress Dynamic SDK Debug Logs
 * 
 * Dynamic SDK logs [DEBUG], [INFO], [WARN] messages internally.
 * This utility patches console methods to filter out Dynamic SDK logs.
 */

const DYNAMIC_LOG_PATTERNS = [
  '[DynamicWaasWalletClient]',
  '[Dynamic',
  'Dynamic Waas Wallet SDK',
  'XHR finished loading',
  'Fetch finished loading',
];

export const suppressDynamicLogs = () => {
  // Only suppress in production
  if (import.meta.env.MODE !== 'development') {
    const originalLog = console.log;
    const originalDebug = console.debug;
    const originalInfo = console.info;

    console.log = (...args: any[]) => {
      const message = args.join(' ');
      if (!DYNAMIC_LOG_PATTERNS.some(pattern => message.includes(pattern))) {
        originalLog.apply(console, args);
      }
    };

    console.debug = (...args: any[]) => {
      const message = args.join(' ');
      if (!DYNAMIC_LOG_PATTERNS.some(pattern => message.includes(pattern))) {
        originalDebug.apply(console, args);
      }
    };

    console.info = (...args: any[]) => {
      const message = args.join(' ');
      if (!DYNAMIC_LOG_PATTERNS.some(pattern => message.includes(pattern))) {
        originalInfo.apply(console, args);
      }
    };
  }
};
