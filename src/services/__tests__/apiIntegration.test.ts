/**
 * Integration tests for API client services
 * Tests the complete backend integration including HTTP API, SSE streaming, and polling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiService } from '../api';
import { RealTimeStreamService } from '../websocket';
import { PollingService } from '../polling';
import { ApiClient } from '../apiClient';
import type { CampaignStartRequest } from '../../types';

// Mock axios for testing
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }))
  }
}));

// Mock EventSource for SSE testing
global.EventSource = vi.fn(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
  readyState: 1,
  onopen: null,
  onmessage: null,
  onerror: null
})) as any;

describe('API Integration Tests', () => {
  let apiClient: ApiClient;
  let mockAxios: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create fresh API client instance
    apiClient = new ApiClient({
      enableRealTimeStream: true,
      enablePolling: true,
      pollingInterval: 1000
    });

    // Mock axios instance
    mockAxios = {
      post: vi.fn(),
      get: vi.fn()
    };
  });

  afterEach(() => {
    apiClient.disconnect();
  });

  describe('Campaign Management', () => {
    it('should start campaign successfully', async () => {
      const campaignData: CampaignStartRequest = {
        product: 'EcoSmart Water Bottle',
        product_cost: 29.99,
        budget: 5000
      };

      const mockResponse = {
        success: true,
        data: {
          session_id: 'test-session-123',
          stage: 'initializing',
          message: 'Campaign started successfully'
        }
      };

      mockAxios.post.mockResolvedValue({ data: mockResponse });
      
      // Mock ApiService.startCampaign
      vi.spyOn(ApiService, 'startCampaign').mockResolvedValue(mockResponse);

      const result = await apiClient.startCampaign(campaignData);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('test-session-123');
      expect(ApiService.startCampaign).toHaveBeenCalledWith(campaignData);
    });

    it('should handle campaign start errors', async () => {
      const campaignData: CampaignStartRequest = {
        product: 'Test Product',
        product_cost: 10,
        budget: 1000
      };

      const mockError = new Error('Campaign start failed');
      vi.spyOn(ApiService, 'startCampaign').mockRejectedValue(mockError);

      await expect(apiClient.startCampaign(campaignData)).rejects.toThrow();
    });
  });

  describe('Session Management', () => {
    it('should connect to session successfully', async () => {
      const sessionId = 'test-session-123';

      // Mock successful connection
      vi.spyOn(RealTimeStreamService.prototype, 'connect').mockResolvedValue();
      vi.spyOn(PollingService.prototype, 'startPolling').mockImplementation(() => {});

      await expect(apiClient.connectToSession(sessionId)).resolves.not.toThrow();
    });

    it('should handle session connection errors gracefully', async () => {
      const sessionId = 'test-session-123';

      // Mock stream connection failure
      vi.spyOn(RealTimeStreamService.prototype, 'connect').mockRejectedValue(new Error('Stream failed'));
      vi.spyOn(PollingService.prototype, 'startPolling').mockImplementation(() => {});

      // Should not throw error, should fall back to polling
      await expect(apiClient.connectToSession(sessionId)).resolves.not.toThrow();
    });

    it('should get session data', async () => {
      const sessionId = 'test-session-123';
      const mockSessionData = {
        stage: 'content_review',
        progress: 75,
        results: {}
      };

      vi.spyOn(ApiService, 'getSessionData').mockResolvedValue(mockSessionData);

      const result = await apiClient.getSessionData(sessionId);
      expect(result).toEqual(mockSessionData);
      expect(ApiService.getSessionData).toHaveBeenCalledWith(sessionId);
    });
  });

  describe('Content Approval', () => {
    it('should submit content approval', async () => {
      const approvalData = {
        session_id: 'test-session-123',
        ad_id: 'ad-001',
        action: 'approve' as const
      };

      const mockResponse = { success: true };
      vi.spyOn(ApiService, 'submitContentApproval').mockResolvedValue(mockResponse);

      const result = await apiClient.submitContentApproval(approvalData);
      expect(result.success).toBe(true);
      expect(ApiService.submitContentApproval).toHaveBeenCalledWith(approvalData);
    });

    it('should handle content revision with feedback', async () => {
      const approvalData = {
        session_id: 'test-session-123',
        ad_id: 'ad-001',
        action: 'revise' as const,
        feedback: 'Make it more engaging'
      };

      const mockApprovalResponse = { success: true };
      const mockRevisionResponse = { success: true, revised_content: {} };

      vi.spyOn(ApiService, 'submitContentApproval').mockResolvedValue(mockApprovalResponse);
      vi.spyOn(ApiService, 'submitAdvancedRevision').mockResolvedValue(mockRevisionResponse);

      const result = await apiClient.submitContentApproval(approvalData);
      expect(result.success).toBe(true);
      expect(ApiService.submitContentApproval).toHaveBeenCalledWith(approvalData);
      expect(ApiService.submitAdvancedRevision).toHaveBeenCalled();
    });
  });

  describe('S3 Media Download', () => {
    it('should download S3 media successfully', async () => {
      const s3Path = 's3://bucket/path/to/image.jpg';
      const mockResponse = {
        success: true,
        local_url: '/downloads/image.jpg'
      };

      vi.spyOn(ApiService, 'downloadS3Media').mockResolvedValue(mockResponse);

      const result = await apiClient.downloadS3Media(s3Path, 'image');
      expect(result.success).toBe(true);
      expect(result.localUrl).toBe('/downloads/image.jpg');
    });

    it('should handle S3 download errors', async () => {
      const s3Path = 's3://bucket/invalid/path.jpg';
      const mockResponse = {
        success: false,
        error: 'File not found'
      };

      vi.spyOn(ApiService, 'downloadS3Media').mockResolvedValue(mockResponse);

      await expect(apiClient.downloadS3Media(s3Path)).rejects.toThrow('File not found');
    });
  });

  describe('Real-time Communication', () => {
    it('should handle agent output messages', async () => {
      const onAgentOutput = vi.fn();
      
      apiClient.initialize({ onAgentOutput });

      // Simulate receiving agent output
      const mockMessage = {
        type: 'agent_output' as const,
        session_id: 'test-session-123',
        timestamp: new Date().toISOString(),
        data: { output: 'Agent is processing...' }
      };

      // Access the stream service and trigger message
      const streamService = (apiClient as any).streamService;
      streamService.handleMessage(mockMessage);

      expect(onAgentOutput).toHaveBeenCalledWith('Agent is processing...');
    });

    it('should handle progress updates', async () => {
      const onProgressUpdate = vi.fn();
      
      apiClient.initialize({ onProgressUpdate });

      const mockProgress = {
        session_id: 'test-session-123',
        progress_percentage: 50,
        current_stage: 'content_generation'
      };

      // Simulate polling progress update
      const pollingService = (apiClient as any).pollingService;
      pollingService.callbacks.onProgress?.(mockProgress);

      expect(onProgressUpdate).toHaveBeenCalledWith(mockProgress);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const onError = vi.fn();
      apiClient.initialize({ onError });

      const mockError = new Error('API request failed');
      vi.spyOn(ApiService, 'healthCheck').mockRejectedValue(mockError);

      await expect(apiClient.healthCheck()).rejects.toThrow();
      expect(onError).toHaveBeenCalled();
    });

    it('should provide connection status', () => {
      const status = apiClient.getConnectionStatus();
      
      expect(status).toHaveProperty('stream');
      expect(status).toHaveProperty('polling');
      expect(status).toHaveProperty('session');
    });
  });

  describe('Health Check and Testing', () => {
    it('should perform health check', async () => {
      const mockHealthResponse = {
        status: 'healthy',
        mode: 'demo',
        mcp_integration: true
      };

      vi.spyOn(ApiService, 'healthCheck').mockResolvedValue(mockHealthResponse);

      const result = await apiClient.healthCheck();
      expect(result).toEqual(mockHealthResponse);
    });

    it('should test connection', async () => {
      const mockTestResponse = {
        message: 'Server is working!',
        timestamp: Date.now()
      };

      vi.spyOn(ApiService, 'testConnection').mockResolvedValue(mockTestResponse);

      const result = await apiClient.testConnection();
      expect(result).toBe(true);
    });

    it('should handle connection test failure', async () => {
      vi.spyOn(ApiService, 'testConnection').mockRejectedValue(new Error('Connection failed'));

      const result = await apiClient.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data when session is active', async () => {
      const sessionId = 'test-session-123';
      
      // Set up session
      (apiClient as any).currentSessionId = sessionId;
      
      const pollingService = (apiClient as any).pollingService;
      vi.spyOn(pollingService, 'pollNow').mockResolvedValue();

      await apiClient.refreshData();
      expect(pollingService.pollNow).toHaveBeenCalled();
    });

    it('should handle refresh when no session is active', async () => {
      // No session set
      (apiClient as any).currentSessionId = null;

      // Should not throw error
      await expect(apiClient.refreshData()).resolves.not.toThrow();
    });
  });
});