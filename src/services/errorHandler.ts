/**
 * Error handling service for API and application errors
 * Provides centralized error processing, logging, and user-friendly messages
 */

import type { ApiError } from '../types';

export interface ErrorContext {
  component?: string;
  action?: string;
  sessionId?: string;
  additionalData?: any;
}

export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableUserNotifications: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorListeners: Set<(error: ApiError, context?: ErrorContext) => void> = new Set();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableLogging: config.enableLogging ?? true,
      enableUserNotifications: config.enableUserNotifications ?? true,
      logLevel: config.logLevel ?? 'error',
      ...config
    };
  }

  /**
   * Handle API errors with context
   */
  handleApiError(error: any, context?: ErrorContext): ApiError {
    const apiError = this.normalizeError(error);
    
    if (this.config.enableLogging) {
      this.logError(apiError, context);
    }

    // Notify error listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(apiError, context);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });

    return apiError;
  }

  /**
   * Handle application errors
   */
  handleAppError(error: any, context?: ErrorContext): void {
    const apiError = this.normalizeError(error);
    
    if (this.config.enableLogging) {
      this.logError(apiError, context);
    }

    // Notify error listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(apiError, context);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Subscribe to error events
   */
  subscribe(callback: (error: ApiError, context?: ErrorContext) => void): () => void {
    this.errorListeners.add(callback);
    
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: ApiError): string {
    // Map common error types to user-friendly messages
    const errorMessages: Record<string, string> = {
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection and try again.',
      'TIMEOUT_ERROR': 'Request timed out. The operation is taking longer than expected.',
      'AUTH_ERROR': 'Authentication failed. Please refresh the page and try again.',
      'VALIDATION_ERROR': 'Invalid input data. Please check your entries and try again.',
      'NOT_FOUND': 'The requested resource was not found.',
      'SERVER_ERROR': 'Server error occurred. Please try again later.',
      'CAMPAIGN_START_ERROR': 'Failed to start campaign. Please check your inputs and try again.',
      'CONTENT_APPROVAL_ERROR': 'Failed to process content approval. Please try again.',
      'S3_DOWNLOAD_ERROR': 'Failed to download media content. Please check the file and try again.',
      'SESSION_ERROR': 'Session error occurred. Please refresh the page.',
      'POLLING_ERROR': 'Failed to get real-time updates. Retrying automatically...'
    };

    return errorMessages[error.code || ''] || error.message || 'An unexpected error occurred.';
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: ApiError): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'SERVER_ERROR',
      'POLLING_ERROR'
    ];

    return retryableCodes.includes(error.code || '');
  }

  /**
   * Normalize different error types to ApiError
   */
  private normalizeError(error: any): ApiError {
    if (error && typeof error === 'object' && 'message' in error) {
      return {
        message: error.message,
        code: error.code || this.inferErrorCode(error),
        details: error.details || error.response?.data
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
        code: 'UNKNOWN_ERROR'
      };
    }

    return {
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      details: error
    };
  }

  /**
   * Infer error code from error properties
   */
  private inferErrorCode(error: any): string {
    if (error.code) return error.code;
    
    if (error.name === 'NetworkError' || error.message?.includes('network')) {
      return 'NETWORK_ERROR';
    }
    
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    }
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      return 'AUTH_ERROR';
    }
    
    if (error.response?.status === 400) {
      return 'VALIDATION_ERROR';
    }
    
    if (error.response?.status === 404) {
      return 'NOT_FOUND';
    }
    
    if (error.response?.status >= 500) {
      return 'SERVER_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Log error with context
   */
  private logError(error: ApiError, context?: ErrorContext): void {
    const logData = {
      error: {
        message: error.message,
        code: error.code,
        details: error.details
      },
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    switch (this.config.logLevel) {
      case 'debug':
        console.debug('Error Debug:', logData);
        break;
      case 'info':
        console.info('Error Info:', logData);
        break;
      case 'warn':
        console.warn('Error Warning:', logData);
        break;
      case 'error':
      default:
        console.error('Error:', logData);
        break;
    }
  }
}

// Singleton instance for global use
export const errorHandler = new ErrorHandler();

// Utility functions for common error scenarios
export const ErrorUtils = {
  /**
   * Handle campaign-related errors
   */
  handleCampaignError: (error: any, sessionId?: string) => {
    return errorHandler.handleApiError(error, {
      component: 'Campaign',
      action: 'campaign_operation',
      sessionId
    });
  },

  /**
   * Handle content-related errors
   */
  handleContentError: (error: any, sessionId?: string, adId?: string) => {
    return errorHandler.handleApiError(error, {
      component: 'Content',
      action: 'content_operation',
      sessionId,
      additionalData: { adId }
    });
  },

  /**
   * Handle S3 media errors
   */
  handleS3Error: (error: any, s3Uri?: string) => {
    return errorHandler.handleApiError(error, {
      component: 'S3Media',
      action: 's3_download',
      additionalData: { s3Uri }
    });
  },

  /**
   * Handle polling errors
   */
  handlePollingError: (error: any, sessionId?: string) => {
    return errorHandler.handleApiError(error, {
      component: 'Polling',
      action: 'data_polling',
      sessionId
    });
  },

  /**
   * Handle streaming errors
   */
  handleStreamError: (error: any, sessionId?: string) => {
    return errorHandler.handleApiError(error, {
      component: 'Stream',
      action: 'real_time_stream',
      sessionId
    });
  }
};

export default ErrorHandler;