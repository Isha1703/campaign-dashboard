/**
 * JSON file polling service for agent results and progress tracking
 * Handles periodic polling of backend endpoints for session data
 */

import { ApiService } from './api';
import type { AgentResults, SessionProgress } from '../types';

export interface PollingConfig {
  interval: number;
  maxRetries: number;
  backoffMultiplier: number;
  maxInterval: number;
}

export interface PollingCallbacks {
  onResults?: (results: AgentResults) => void;
  onProgress?: (progress: SessionProgress) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: 'polling' | 'stopped' | 'error') => void;
}

export class PollingService {
  private config: PollingConfig;
  private sessionId: string | null = null;
  private isPolling = false;
  private pollingTimer: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private currentInterval: number;
  private callbacks: PollingCallbacks = {};
  private lastResultsHash: string | null = null;
  private lastProgressHash: string | null = null;

  constructor(config: Partial<PollingConfig> = {}) {
    this.config = {
      interval: config.interval || 2000, // Poll every 2 seconds
      maxRetries: config.maxRetries || 5,
      backoffMultiplier: config.backoffMultiplier || 1.5,
      maxInterval: config.maxInterval || 30000, // Max 30 seconds
      ...config
    };
    this.currentInterval = this.config.interval;
  }

  /**
   * Start polling for a specific session
   */
  startPolling(sessionId: string, callbacks: PollingCallbacks = {}): void {
    if (this.isPolling && this.sessionId === sessionId) {
      return; // Already polling this session
    }

    this.stopPolling();
    
    this.sessionId = sessionId;
    this.callbacks = callbacks;
    this.isPolling = true;
    this.retryCount = 0;
    this.currentInterval = this.config.interval;
    
    console.log(`Starting polling for session: ${sessionId}`);
    this.callbacks.onStatusChange?.('polling');
    
    this.scheduleNextPoll();
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }

    this.isPolling = false;
    this.sessionId = null;
    this.retryCount = 0;
    this.currentInterval = this.config.interval;
    this.lastResultsHash = null;
    this.lastProgressHash = null;
    
    console.log('Polling stopped');
    this.callbacks.onStatusChange?.('stopped');
  }

  /**
   * Update polling callbacks
   */
  updateCallbacks(callbacks: PollingCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get current polling status
   */
  getStatus(): { isPolling: boolean; sessionId: string | null; interval: number; retryCount: number } {
    return {
      isPolling: this.isPolling,
      sessionId: this.sessionId,
      interval: this.currentInterval,
      retryCount: this.retryCount
    };
  }

  /**
   * Force immediate poll
   */
  async pollNow(): Promise<void> {
    if (!this.sessionId) {
      throw new Error('No session ID set for polling');
    }

    await this.performPoll();
  }

  /**
   * Schedule the next polling attempt
   */
  private scheduleNextPoll(): void {
    if (!this.isPolling) return;

    this.pollingTimer = setTimeout(() => {
      this.performPoll();
    }, this.currentInterval);
  }

  /**
   * Perform the actual polling operation
   */
  private async performPoll(): Promise<void> {
    if (!this.isPolling || !this.sessionId) {
      return;
    }

    try {
      // Poll for agent results and progress in parallel
      const [resultsResponse, progressResponse] = await Promise.allSettled([
        ApiService.pollAgentResults(this.sessionId),
        ApiService.getSessionProgress(this.sessionId)
      ]);

      // Handle results
      if (resultsResponse.status === 'fulfilled' && resultsResponse.value) {
        const resultsHash = this.hashObject(resultsResponse.value);
        if (resultsHash !== this.lastResultsHash) {
          this.lastResultsHash = resultsHash;
          this.callbacks.onResults?.(resultsResponse.value);
        }
      }

      // Handle progress
      if (progressResponse.status === 'fulfilled' && progressResponse.value) {
        const progressHash = this.hashObject(progressResponse.value);
        if (progressHash !== this.lastProgressHash) {
          this.lastProgressHash = progressHash;
          this.callbacks.onProgress?.(progressResponse.value);
        }
      }

      // Reset retry count on successful poll
      this.retryCount = 0;
      this.currentInterval = this.config.interval;

      // Schedule next poll
      this.scheduleNextPoll();

    } catch (error) {
      console.error('Polling error:', error);
      this.handlePollingError(error as Error);
    }
  }

  /**
   * Handle polling errors with retry logic
   */
  private handlePollingError(error: Error): void {
    this.retryCount++;
    
    if (this.retryCount >= this.config.maxRetries) {
      console.error('Max polling retries reached, stopping polling');
      this.callbacks.onError?.(error);
      this.callbacks.onStatusChange?.('error');
      this.stopPolling();
      return;
    }

    // Exponential backoff
    this.currentInterval = Math.min(
      this.config.interval * Math.pow(this.config.backoffMultiplier, this.retryCount),
      this.config.maxInterval
    );

    console.log(`Polling retry ${this.retryCount}/${this.config.maxRetries} in ${this.currentInterval}ms`);
    this.scheduleNextPoll();
  }

  /**
   * Create a simple hash of an object for change detection
   */
  private hashObject(obj: any): string {
    return JSON.stringify(obj, Object.keys(obj).sort());
  }
}

// Singleton instance for global use
export const pollingService = new PollingService();

export default PollingService;