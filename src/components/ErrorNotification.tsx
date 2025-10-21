import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, RefreshCw, Info, CheckCircle, XCircle } from 'lucide-react';
import type { ApiError } from '../types';

export interface NotificationData {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  retryable?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

interface ErrorNotificationProps {
  notification: NotificationData;
  onDismiss: (id: string) => void;
  onRetry?: (id: string) => void;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  notification,
  onDismiss,
  onRetry
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!notification.persistent && notification.duration) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.persistent]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss(notification.id);
      if (notification.onDismiss) {
        notification.onDismiss();
      }
    }, 300);
  };

  const handleRetry = () => {
    if (notification.onRetry) {
      notification.onRetry();
    }
    if (onRetry) {
      onRetry(notification.id);
    }
    handleDismiss();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'success':
        return 'text-green-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed bottom-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 
        ${getBackgroundColor()} 
        transform transition-all duration-300 ease-in-out z-50
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${getTextColor()}`}>
              {notification.title}
            </h3>
            <p className={`mt-1 text-sm ${getTextColor()} opacity-90`}>
              {notification.message}
            </p>
            
            {notification.retryable && (
              <div className="mt-3">
                <button
                  onClick={handleRetry}
                  className={`
                    inline-flex items-center px-3 py-1 rounded-md text-xs font-medium
                    ${notification.type === 'error' 
                      ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }
                    transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  `}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Try Again
                </button>
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className={`
                inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${notification.type === 'error' 
                  ? 'text-red-400 hover:bg-red-100 focus:ring-red-500' 
                  : 'text-gray-400 hover:bg-gray-100 focus:ring-gray-500'
                }
              `}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Manager Component
interface NotificationManagerProps {
  notifications: NotificationData[];
  onDismiss: (id: string) => void;
  onRetry?: (id: string) => void;
  maxNotifications?: number;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  notifications,
  onDismiss,
  onRetry,
  maxNotifications = 5
}) => {
  // Show only the most recent notifications
  const visibleNotifications = notifications.slice(-maxNotifications);

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            transform: `translateY(-${index * 8}px)`,
            zIndex: 50 - index
          }}
        >
          <ErrorNotification
            notification={notification}
            onDismiss={onDismiss}
            onRetry={onRetry}
          />
        </div>
      ))}
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = (notification: Omit<NotificationData, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: NotificationData = {
      id,
      duration: 5000, // Default 5 seconds
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Utility methods for different notification types
  const showError = (title: string, message: string, options?: Partial<NotificationData>) => {
    return addNotification({
      type: 'error',
      title,
      message,
      persistent: true,
      retryable: true,
      ...options
    });
  };

  const showWarning = (title: string, message: string, options?: Partial<NotificationData>) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: 7000,
      ...options
    });
  };

  const showSuccess = (title: string, message: string, options?: Partial<NotificationData>) => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration: 4000,
      ...options
    });
  };

  const showInfo = (title: string, message: string, options?: Partial<NotificationData>) => {
    return addNotification({
      type: 'info',
      title,
      message,
      duration: 5000,
      ...options
    });
  };

  // Convert API error to notification
  const showApiError = (error: ApiError, context?: string) => {
    const title = context ? `${context} Failed` : 'Operation Failed';
    return showError(title, error.message, {
      retryable: ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'SERVER_ERROR'].includes(error.code || '')
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showError,
    showWarning,
    showSuccess,
    showInfo,
    showApiError
  };
};

export default ErrorNotification;