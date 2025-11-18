import { showToast } from '../components/Toast';
import { getUserFriendlyError } from './errorHandler';

/**
 * Show error toast from any error object
 */
export function showErrorToast(error: any) {
  const friendlyError = getUserFriendlyError(error);
  showToast({
    title: friendlyError.title,
    message: friendlyError.message,
    action: friendlyError.action,
    type: friendlyError.type || 'error',
    duration: 5000,
  });
}

/**
 * Show success toast
 */
export function showSuccessToast(title: string, message: string, action?: string) {
  showToast({
    title,
    message,
    action,
    type: 'success',
    duration: 4000,
  });
}

/**
 * Show warning toast
 */
export function showWarningToast(title: string, message: string, action?: string) {
  showToast({
    title,
    message,
    action,
    type: 'warning',
    duration: 5000,
  });
}

/**
 * Show info toast
 */
export function showInfoToast(title: string, message: string, action?: string) {
  showToast({
    title,
    message,
    action,
    type: 'info',
    duration: 4000,
  });
}
