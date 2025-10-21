/**
 * Unified API client that integrates all backend communication services
 * Provides a single interface for campaign management, real-time monitoring, and content handling
 */

import { ApiService } from './api';
import { RealTimeStreamService } from './websocket';
import { PollingService } from './polling';
import { ErrorHandler, ErrorUtils } from './errorHandler';
import type {
  CampaignStartRequest,
  ContentApprovalRequest,
  AgentResults,
  SessionProgress,
  StreamMessage,
  ProfessionalDashboardState
} from '../types';

export interface ApiClientConfig {
  enableRealTimeStream: boolean;
  enablePolling: boolean;
  pollingInterval: number;
  streamReconnectAttempts: number;
}

export interface ApiClientCallbacks {
  onAgentOutput?: (output: string) => void;
  onProgressUpdate?: (progress: SessionProgress) => void;
  onResultsUpdate?: (results: AgentResults) => void;
  onError?: (error: Error) => void;
  onConnectionStatusChange?: (status: string) => void;
}

export class ApiClient {
  private config: ApiClientConfig;
  private callbacks: ApiClientCallbacks = {};
  private streamService: RealTimeStreamService;
  private pollingService: PollingService;
  private errorHandler: ErrorHandler;
  private currentSessionId: string | null = null;
  private isInitialized = false;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = {
      enableRealTimeStream: config.enableRealTimeStream ?? true,
      enablePolling: config.enablePolling ?? true,
      pollingInterval: config.pollingInterval ?? 2000,
      streamReconnectAttempts: config.streamReconnectAttempts ?? 10,
      ...config
    };

    this.streamService = new RealTimeStreamService({
      maxReconnectAttempts: this.config.streamReconnectAttempts
    });

    this.pollingService = new PollingService({
      interval: this.config.pollingInterval
    });

    this.errorHandler = new ErrorHandler();
    this.setupEventListeners();
  }

  /**
   * Initialize the API client with callbacks
   */
  initialize(callbacks: ApiClientCallbacks = {}): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
    this.isInitialized = true;
    console.log('API Client initialized with config:', this.config);
  }

  /**
   * Start a new marketing campaign
   */
  async startCampaign(campaignData: CampaignStartRequest): Promise<{ success: boolean; sessionId: string; data: any }> {
    try {
      console.log('Starting campaign through API client:', campaignData);
      
      const response = await ApiService.startCampaign(campaignData);
      
      if (response.success && response.data?.session_id) {
        const sessionId = response.data.session_id;
        await this.connectToSession(sessionId);
        
        return {
          success: true,
          sessionId,
          data: response.data
        };
      } else {
        throw new Error('Invalid campaign start response');
      }
    } catch (error) {
      const apiError = ErrorUtils.handleCampaignError(error);
      this.callbacks.onError?.(apiError);
      throw apiError;
    }
  }

  /**
   * Connect to a session for real-time monitoring
   */
  async connectToSession(sessionId: string): Promise<void> {
    try {
      this.currentSessionId = sessionId;
      console.log(`Connecting to session: ${sessionId}`);

      // Start real-time streaming if enabled
      if (this.config.enableRealTimeStream) {
        try {
          await this.streamService.connect(sessionId);
          console.log('Real-time stream connected');
        } catch (streamError) {
          console.warn('Real-time stream failed, falling back to polling only:', streamError);
        }
      }

      // Start polling if enabled
      if (this.config.enablePolling) {
        this.pollingService.startPolling(sessionId, {
          onResults: (results) => {
            console.log('Polling results update:', results);
            this.callbacks.onResultsUpdate?.(results);
          },
          onProgress: (progress) => {
            console.log('Polling progress update:', progress);
            this.callbacks.onProgressUpdate?.(progress);
          },
          onError: (error) => {
            const apiError = ErrorUtils.handlePollingError(error, sessionId);
            this.callbacks.onError?.(apiError);
          }
        });
      }

    } catch (error) {
      const apiError = ErrorUtils.handleStreamError(error, sessionId);
      this.callbacks.onError?.(apiError);
      throw apiError;
    }
  }

  /**
   * Disconnect from current session
   */
  disconnect(): void {
    console.log('Disconnecting from session:', this.currentSessionId);
    
    this.streamService.disconnect();
    this.pollingService.stopPolling();
    this.currentSessionId = null;
  }

  /**
   * Submit content approval or revision
   */
  async submitContentApproval(approvalData: ContentApprovalRequest): Promise<{ success: boolean }> {
    try {
      console.log('Submitting content approval:', approvalData);
      
      const response = await ApiService.submitContentApproval(approvalData);
      
      // If this is a revision request, we might need to handle advanced revision
      if (approvalData.action === 'revise' && approvalData.feedback) {
        try {
          const advancedResponse = await ApiService.submitAdvancedRevision({
            session_id: approvalData.session_id,
            ad_id: approvalData.ad_id,
            feedback: approvalData.feedback,
            revision_type: 'content_improvement'
          });
          
          if (advancedResponse.success) {
            console.log('Advanced revision completed:', advancedResponse);
          }
        } catch (revisionError) {
          console.warn('Advanced revision failed, using basic revision:', revisionError);
        }
      }
      
      return response;
    } catch (error) {
      const apiError = ErrorUtils.handleContentError(error, approvalData.session_id, approvalData.ad_id);
      this.callbacks.onError?.(apiError);
      throw apiError;
    }
  }

  /**
   * Download S3 media content
   */
  async downloadS3Media(s3Path: string, contentType: string = 'image'): Promise<{ success: boolean; localUrl?: string }> {
    try {
      console.log('Downloading S3 media:', s3Path);
      
      const response = await ApiService.downloadS3Media({
        s3_path: s3Path,
        content_type: contentType
      });
      
      if (response.success && response.local_url) {
        return {
          success: true,
          localUrl: response.local_url
        };
      } else {
        throw new Error(response.error || 'S3 download failed');
      }
    } catch (error) {
      const apiError = ErrorUtils.handleS3Error(error, s3Path);
      this.callbacks.onError?.(apiError);
      throw apiError;
    }
  }

  /**
   * Get session data
   */
  async getSessionData(sessionId?: string): Promise<any> {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) {
      throw new Error('No session ID available');
    }

    try {
      return await ApiService.getSessionData(targetSessionId);
    } catch (error) {
      const apiError = ErrorUtils.handleCampaignError(error, targetSessionId);
      this.callbacks.onError?.(apiError);
      throw apiError;
    }
  }

  /**
   * Get agent results
   */
  async getAgentResults(sessionId?: string): Promise<AgentResults | null> {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) {
      return null;
    }

    try {
      return await ApiService.pollAgentResults(targetSessionId);
    } catch (error) {
      console.error('Failed to get agent results:', error);
      return null;
    }
  }

  /**
   * Get specific agent result
   */
  async getAgentResult(agentName: string, sessionId?: string): Promise<any> {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) {
      return null;
    }

    try {
      return await ApiService.getAgentResult(targetSessionId, agentName);
    } catch (error) {
      console.error(`Failed to get ${agentName} result:`, error);
      return null;
    }
  }

  /**
   * Check backend health
   */
  async healthCheck(): Promise<{ status: string; mode: string; mcp_integration: boolean }> {
    try {
      return await ApiService.healthCheck();
    } catch (error) {
      const apiError = this.errorHandler.handleApiError(error, {
        component: 'HealthCheck',
        action: 'health_check'
      });
      throw apiError;
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await ApiService.testConnection();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): {
    stream: string;
    polling: string;
    session: string | null;
  } {
    return {
      stream: this.streamService.getConnectionStatus(),
      polling: this.pollingService.getStatus().isPolling ? 'active' : 'inactive',
      session: this.currentSessionId
    };
  }

  /**
   * Force immediate data refresh
   */
  async refreshData(): Promise<void> {
    if (!this.currentSessionId) {
      return;
    }

    try {
      // Force immediate poll
      await this.pollingService.pollNow();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }

  /**
   * Update callbacks
   */
  updateCallbacks(callbacks: Partial<ApiClientCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Setup event listeners for services
   */
  private setupEventListeners(): void {
    // Stream service listeners
    this.streamService.subscribe('agent_output', (message: StreamMessage) => {
      if (message.data?.output) {
        this.callbacks.onAgentOutput?.(message.data.output);
      }
    });

    this.streamService.subscribe('progress_update', (message: StreamMessage) => {
      if (message.data) {
        this.callbacks.onProgressUpdate?.(message.data);
      }
    });

    this.streamService.subscribe('error', (message: StreamMessage) => {
      const error = new Error(message.data?.message || 'Stream error occurred');
      this.callbacks.onError?.(error);
    });

    // Error handler listener
    this.errorHandler.subscribe((error, context) => {
      console.error('API Client Error:', error, context);
    });
  }
}

// Singleton instance for global use
export const apiClient = new ApiClient();

export default ApiClient;