'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast = ({ id, type, title, message, duration = 5000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto-dismiss timer
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'error': return <XCircle className="w-5 h-5 text-error" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'info': return <Info className="w-5 h-5 text-info" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success': return 'border-success/20 bg-success/10';
      case 'error': return 'border-error/20 bg-error/10';
      case 'warning': return 'border-warning/20 bg-warning/10';
      case 'info': return 'border-info/20 bg-info/10';
    }
  };

  return (
    <div
      className={`
        fixed right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      style={{
        top: `${20 + parseInt(id) * 80}px`
      }}
    >
      <div className={`
        health-card p-4 border-l-4 ${getColorClasses()}
        shadow-lg backdrop-blur-sm
      `}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-base-content">
                {title}
              </p>
              {message && (
                <p className="mt-1 text-sm text-base-content/70">
                  {message}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-4 btn btn-ghost btn-xs btn-circle"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface ToastNotificationProps {
  toasts: ToastProps[];
  onRemoveToast: (id: string) => void;
}

export default function ToastNotification({ toasts, onRemoveToast }: ToastNotificationProps) {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemoveToast}
        />
      ))}
    </>
  );
}

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  };

  const showError = (title: string, message?: string) => {
    addToast({ type: 'error', title, message });
  };

  const showWarning = (title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  };

  const showInfo = (title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  };

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ToastContainer: () => <ToastNotification toasts={toasts} onRemoveToast={removeToast} />
  };
}; 