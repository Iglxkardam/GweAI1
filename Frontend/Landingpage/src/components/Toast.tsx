import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ToastProps {
  title: string;
  message: string;
  action?: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  title, 
  message, 
  action, 
  type = 'info', 
  onClose,
  duration = 5000 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'error': return 'bg-red-500/90';
      case 'success': return 'bg-green-500/90';
      case 'warning': return 'bg-yellow-500/90';
      default: return 'bg-blue-500/90';
    }
  };

  return createPortal(
    <div className="fixed top-20 right-4 z-[9999] animate-slide-in-right">
      <div className={`${getBackgroundColor()} backdrop-blur-sm text-white rounded-lg shadow-2xl p-4 max-w-md min-w-[320px]`}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg">{title}</h3>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <p className="text-sm mb-2 whitespace-pre-line">{message}</p>
        {action && (
          <p className="text-xs text-gray-200 mt-2 pt-2 border-t border-white/20">
            {action}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
};

// Toast Manager
let toastId = 0;
const toastQueue: Array<{ id: number; props: Omit<ToastProps, 'onClose'> }> = [];
const listeners = new Set<(queue: typeof toastQueue) => void>();

export const showToast = (props: Omit<ToastProps, 'onClose'>) => {
  const id = toastId++;
  toastQueue.push({ id, props });
  if (toastQueue.length > 3) {
    toastQueue.shift();
  }
  listeners.forEach(listener => listener([...toastQueue]));
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = React.useState<typeof toastQueue>([]);

  useEffect(() => {
    const listener = (queue: typeof toastQueue) => {
      setToasts(queue);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const handleClose = (id: number) => {
    const index = toastQueue.findIndex(t => t.id === id);
    if (index !== -1) {
      toastQueue.splice(index, 1);
      listeners.forEach(listener => listener([...toastQueue]));
    }
  };

  return (
    <>
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ top: `${80 + index * 120}px` }} className="fixed right-4 z-[9999]">
          <Toast {...toast.props} onClose={() => handleClose(toast.id)} />
        </div>
      ))}
    </>
  );
};
