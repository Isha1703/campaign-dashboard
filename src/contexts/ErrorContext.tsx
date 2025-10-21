import React, { createContext, useContext, useCallback, useRef } from 'react';
import { errorHandler, ErrorUtils } from '../services/errorHandler';
import { useNotifications } from '../components/ErrorNotification';
import { RetryUtils } from '../utils/retryMechanism';
import type { ApiError, ErrorContext as ErrorContextType } from '../types';

interface ErrorContextValue {
  // Error handling methods
  handleError: (error: any, context?: ErrorContextType) => ApiError;
  handleApiError: (error: any, context?: ErrorContextType) => ApiError;
  handleCampaignError: (error: any, sessionId?: string) => ApiError;
  handleContentError: (error: any, sessionId?: string, adId?: string) => ApiError;
  handleS3Error: (error: any, s3Uri?: string) => ApiError;
  handlePollingError: (error: any, sessionId?: string) => ApiError;
  
  // Retry utilities
  retryApiCall: <T>(fn: () => Promise<T>, context?: string) => Promise<T>;
  retryS3Download: <T>(fn: () => Promise<T>, s3Uri?: string) => Promise<T>;
  retryPolling: <T>(fn: () => Promise<T>, sessionId?: string) => Promise<T>;
  
  // Notification methods
  showError: (title: string, message: string, retryable?: boolean) => void;
  showWarning: (title: string, message: string) => void;
  showSuccess: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  
  // Error recovery
  clearErrors: () => void;
  isRetryable: (error: ApiError) => boolean;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

interface ErrorProviderProps {
  children: React.ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const notifications = useNotifications();
  const errorCountRef = useRef<Map<string, number>>(new Map());

  // Track error frequency to prevent spam
  const trackError = useCallback((errorKey: string): boolean => {
    const count = errorCountRef.current.get(errorKey) || 0;
    const newCount = count + 1;
    errorCountRef.current.set(errorKey, newCount);
    
    // Reset count after 1 minute
    setTimeout(() => {
      errorCountRef.current.set(errorKey, Math.max(0, newCount - 1));
    }, 60000);
    
    // Don't show notification if too many similar errors (more than 3 per minute)
    return newCount <= 3;
  }, []);

  const handleError = useCallback((error: any, context?: ErrorContextType): ApiError => {
    const apiError = errorHandler.handleApiError(error, context);
    
    // Create error key for tracking
    const errorKey = `${context?.component || 'unknown'}_${apiError.code || 'unknown'}`;
    
    if (trackError(errorKey)) {
      const contextTitle = context?.component ? `${context.component} Error` : 'Application Error';
      notifications.showApiError(apiError, contextTitle);
    }
    
    return apiError;
  }, [notifications, trackError]);

  const handleApiError = useCallback((error: any, context?: ErrorContextType): ApiError => {
    return handleError(error, { ...context, component: context?.component || 'API' });
  }, [handleError]);

  const handleCampaignError = useCallback((error: any, sessionId?: string): ApiError => {
    return ErrorUtils.handleCampaignError(error, sessionId);
  }, []);

  const handleContentError = useCallback((error: any, sessionId?: string, adId?: string): ApiError => {
    return ErrorUtils.handleContentError(error, sessionId, adId);
  }, []);

  const handleS3Error = useCallback((error: any, s3Uri?: string): ApiError => {
    return ErrorUtils.handleS3Error(error, s3Uri);
  }, []);

  const handlePollingError = useCallback((error: any, sessionId?: string): ApiError => {
    return ErrorUtils.handlePollingError(error, sessionId);
  }, []);

  // Retry utilities with error handling
  const retryApiCall = useCallback(async <T,>(
    fn: () => Promise<T>, 
    context?: string
  ): Promise<T> => {
    return RetryUtils.apiCall(fn, {
      onRetry: (attempt, error) => {
        console.warn(`API call retry ${attempt}:`, error);
        if (attempt === 1) {
          notifications.showWarning(
            'Connection Issue',
            `Retrying ${context || 'operation'}... (Attempt ${attempt})`
          );
        }
      }
    });
  }, [notifications]);

  const retryS3Download = useCallback(async <T,>(
    fn: () => Promise<T>, 
    s3Uri?: string
  ): Promise<T> => {
    return RetryUtils.s3Download(fn, {
      onRetry: (attempt, error) => {
        console.warn(`S3 download retry ${attempt} for ${s3Uri}:`, error);
        if (attempt === 1) {
          notifications.showWarning(
            'Download Issue',
            `Retrying media download... (Attempt ${attempt})`
          );
        }
      }
    });
  }, [notifications]);

  const retryPolling = useCallback(async <T,>(
    fn: () => Promise<T>, 
    sessionId?: string
  ): Promise<T> => {
    return RetryUtils.polling(fn, {
      onRetry: (attempt, error) => {
        console.warn(`Polling retry ${attempt} for session ${sessionId}:`, error);
        // Don't show notifications for polling retries as they're frequent
      }
    });
  }, []);

  // Notification wrapper methods
  const showError = useCallback((title: string, message: string, retryable = false) => {
    notifications.showError(title, message, { retryable });
  }, [notifications]);

  const showWarning = useCallback((title: string, message: string) => {
    notifications.showWarning(title, message);
  }, [notifications]);

  const showSuccess = useCallback((title: string, message: string) => {
    notifications.showSuccess(title, message);
  }, [notifications]);

  const showInfo = useCallback((title: string, message: string) => {
    notifications.showInfo(title, message);
  }, [notifications]);

  const clearErrors = useCallback(() => {
    notifications.clearAll();
    errorCountRef.current.clear();
  }, [notifications]);

  const isRetryable = useCallback((error: ApiError): boolean => {
    return errorHandler.isRetryable(error);
  }, []);

  const contextValue: ErrorContextValue = {
    handleError,
    handleApiError,
    handleCampaignError,
    handleContentError,
    handleS3Error,
    handlePollingError,
    retryApiCall,
    retryS3Download,
    retryPolling,
    showError,
    showWarning,
    showSuccess,
    showInfo,
    clearErrors,
    isRetryable
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

// Hook to use error context
export const useErrorHandler = (): ErrorContextValue => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within an ErrorProvider');
  }
  return context;
};

// Higher-order component for error handling
export const withErrorHandling = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => {
    const errorHandler = useErrorHandler();
    
    return (
      <Component 
        {...props} 
        errorHandler={errorHandler}
      />
    );
  };
  
  WrappedComponent.displayName = `withErrorHandling(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorContext;