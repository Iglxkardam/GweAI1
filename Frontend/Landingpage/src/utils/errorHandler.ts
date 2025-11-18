/**
 * User-Friendly Error Message Handler
 * Converts technical blockchain errors to simple, actionable messages
 */

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  type?: 'error' | 'success' | 'warning' | 'info';
}

/**
 * Convert technical error to user-friendly message
 */
export function getUserFriendlyError(error: any): UserFriendlyError {
  const errorMessage = error?.message?.toLowerCase() || error?.toString()?.toLowerCase() || '';
  const errorCode = error?.code;

  // User cancelled/rejected transaction
  if (
    errorCode === 4001 ||
    errorCode === 'ACTION_REJECTED' ||
    errorMessage.includes('user rejected') ||
    errorMessage.includes('user denied') ||
    errorMessage.includes('user cancelled') ||
    errorMessage.includes('rejected the request') ||
    errorMessage.includes('transaction was rejected')
  ) {
    return {
      title: 'Transaction Cancelled',
      message: 'You cancelled the transaction',
      action: 'Try again when ready',
      type: 'warning',
    };
  }

  // Insufficient balance
  if (
    errorMessage.includes('insufficient funds') ||
    errorMessage.includes('insufficient balance') ||
    errorMessage.includes('not enough') ||
    errorMessage.includes('exceeds balance')
  ) {
    return {
      title: 'Insufficient Balance',
      message: 'You don\'t have enough funds for this transaction',
      action: 'Add more funds to your wallet',
      type: 'error',
    };
  }

  // Insufficient allowance
  if (
    errorMessage.includes('insufficient allowance') ||
    errorMessage.includes('allowance') ||
    errorMessage.includes('erc20: transfer amount exceeds allowance')
  ) {
    return {
      title: 'Approval Required',
      message: 'Token approval needed before trading',
      action: 'Approve the transaction first',
      type: 'warning',
    };
  }

  // Slippage error
  if (
    errorMessage.includes('slippage') ||
    errorMessage.includes('price impact') ||
    errorMessage.includes('min amount') ||
    errorMessage.includes('min received')
  ) {
    return {
      title: 'Slippage Too High',
      message: 'Price moved too much during transaction',
      action: 'Increase slippage tolerance or try again',
      type: 'warning',
    };
  }

  // Network/RPC errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('rpc') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('429') ||
    errorMessage.includes('too many requests')
  ) {
    return {
      title: 'Network Issue',
      message: 'Having trouble connecting to blockchain',
      action: 'Check your connection and try again',
      type: 'error',
    };
  }

  // Gas related errors
  if (
    errorMessage.includes('gas') ||
    errorMessage.includes('out of gas') ||
    errorMessage.includes('intrinsic gas too low')
  ) {
    return {
      title: 'Gas Issue',
      message: 'Not enough gas for this transaction',
      action: 'Try again with higher gas',
      type: 'error',
    };
  }

  // Transaction reverted (generic contract error)
  if (
    errorMessage.includes('reverted') ||
    errorMessage.includes('execution reverted') ||
    errorMessage.includes('transaction failed')
  ) {
    return {
      title: 'Transaction Failed',
      message: 'The transaction couldn\'t be completed',
      action: 'Check details and try again',
      type: 'error',
    };
  }

  // Wallet not connected
  if (
    errorMessage.includes('wallet') ||
    errorMessage.includes('not connected') ||
    errorMessage.includes('connect your wallet')
  ) {
    return {
      title: 'Wallet Not Connected',
      message: 'Please connect your wallet first',
      action: 'Click "Connect Wallet" to continue',
      type: 'warning',
    };
  }

  // Invalid input
  if (
    errorMessage.includes('invalid') ||
    errorMessage.includes('malformed') ||
    errorMessage.includes('parse')
  ) {
    return {
      title: 'Invalid Input',
      message: 'The amount or address entered is not valid',
      action: 'Check your input and try again',
      type: 'warning',
    };
  }

  // Default friendly error
  return {
    title: 'Something Went Wrong',
    message: 'Unable to complete the transaction',
    action: 'Please try again or contact support',
    type: 'error',
  };
}

/**
 * Get user-friendly error message as string
 */
export function getErrorMessage(error: any): string {
  const friendlyError = getUserFriendlyError(error);
  return `${friendlyError.title}\n${friendlyError.message}${friendlyError.action ? `\n${friendlyError.action}` : ''}`;
}

/**
 * Get short error message (for toasts/alerts)
 */
export function getShortErrorMessage(error: any): string {
  const friendlyError = getUserFriendlyError(error);
  return friendlyError.message;
}

/**
 * Log error with context
 */
export function logError(context: string, error: any) {
  console.error(`[${context}] Error:`, error);
  const friendlyError = getUserFriendlyError(error);
  console.error('User-friendly message:', friendlyError.message);
}
