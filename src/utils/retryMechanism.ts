import type { RetryConfig } from '../types';

/**
 * Retry mechanism utility for handling failed operations
 * Implements exponential backoff with jitter
 */

export interface RetryOptions extends Partial<RetryConfig> {
  onRetry?: (attempt: number, error: any) => void;
  shouldRetry?: (error: any) => boolean;
  retryCondition?: (error: any) => boolean;
}

export class RetryMechanism {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 3,
      baseDelay: config.baseDelay ?? 1000,
      maxDelay: config.maxDelay ?? 10000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      ...config
    };
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = this.config.maxAttempts,
      baseDelay = this.config.baseDelay,
      maxDelay = this.config.maxDelay,
      backoffMultiplier = this.config.backoffMultiplier,
      onRetry,
      shouldRetry = this.defaultShouldRetry,
      retryCondition
    } = options;

    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        const shouldRetryError = retryCondition ? retryCondition(error) : shouldRetry(error);
        
        if (attempt === maxAttempts || !shouldRetryError) {
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, baseDelay, maxDelay, backoffMultiplier);
        
        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt, error);
        }

        console.warn(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms delay:`, error);
        
        // Wait before retrying
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Create a retryable version of a function
   */
  wrap<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: RetryOptions = {}
  ): T {
    return ((...args: Parameters<T>) => {
      return this.execute(() => fn(...args), options);
    }) as T;
  }

  /**
   * Default retry condition - retries on network and server errors
   */
  private defaultShouldRetry(error: any): boolean {
    // Don't retry on client errors (4xx) except for specific cases
    if (error.response?.status >= 400 && error.response?.status < 500) {
      // Retry on specific 4xx errors
      const retryable4xxCodes = [408, 429]; // Timeout, Too Many Requests
      return retryable4xxCodes.includes(error.response.status);
    }

    // Retry on server errors (5xx)
    if (error.response?.status >= 500) {
      return true;
    }

    // Retry on network errors
    if (error.code === 'NETWORK_ERROR' || error.name === 'NetworkError') {
      return true;
    }

    // Retry on timeout errors
    if (error.code === 'TIMEOUT_ERROR' || error.name === 'TimeoutError') {
      return true;
    }

    // Retry on connection errors
    if (error.message?.includes('connection') || error.message?.includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    backoffMultiplier: number
  ): number {
    // Exponential backoff: baseDelay * (backoffMultiplier ^ (attempt - 1))
    const exponentialDelay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
    
    // Apply jitter (random factor between 0.5 and 1.5)
    const jitter = 0.5 + Math.random();
    const delayWithJitter = exponentialDelay * jitter;
    
    // Cap at maxDelay
    return Math.min(delayWithJitter, maxDelay);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default retry instance
export const defaultRetry = new RetryMechanism();

// Utility functions for common retry scenarios
export const RetryUtils = {
  /**
   * Retry for API calls
   */
  apiCall: <T>(fn: () => Promise<T>, options: RetryOptions = {}) => {
    return defaultRetry.execute(fn, {
      maxAttempts: 3,
      baseDelay: 1000,
      shouldRetry: (error) => {
        // Retry on network, timeout, and server errors
        return defaultRetry['defaultShouldRetry'](error);
      },
      ...options
    });
  },

  /**
   * Retry for S3 downloads
   */
  s3Download: <T>(fn: () => Promise<T>, options: RetryOptions = {}) => {
    return defaultRetry.execute(fn, {
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      shouldRetry: (error) => {
        // Retry on network errors and specific S3 errors
        if (error.code === 'NoSuchKey') return false; // Don't retry if file doesn't exist
        if (error.code === 'AccessDenied') return false; // Don't retry on permission errors
        return defaultRetry['defaultShouldRetry'](error);
      },
      ...options
    });
  },

  /**
   * Retry for polling operations
   */
  polling: <T>(fn: () => Promise<T>, options: RetryOptions = {}) => {
    return defaultRetry.execute(fn, {
      maxAttempts: 10,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 1.5,
      shouldRetry: (error) => {
        // More aggressive retry for polling
        return true; // Retry all errors for polling
      },
      ...options
    });
  },

  /**
   * Retry for WebSocket connections
   */
  websocket: <T>(fn: () => Promise<T>, options: RetryOptions = {}) => {
    return defaultRetry.execute(fn, {
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 15000,
      shouldRetry: (error) => {
        // Retry connection errors but not authentication errors
        if (error.code === 1006 || error.code === 1011) return true; // Connection errors
        if (error.code === 1008) return false; // Policy violation
        return defaultRetry['defaultShouldRetry'](error);
      },
      ...options
    });
  }
};

export default RetryMechanism;