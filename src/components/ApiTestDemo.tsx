/**
 * Demo component to test API client integration
 * Provides a simple interface to test all API functionality
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import type { CampaignStartRequest, AgentResults, SessionProgress } from '../types';

const ApiTestDemo: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [agentOutputs, setAgentOutputs] = useState<string[]>([]);
  const [progress, setProgress] = useState<SessionProgress | null>(null);
  const [results, setResults] = useState<AgentResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Test campaign data
  const [campaignData, setCampaignData] = useState<CampaignStartRequest>({
    product: 'EcoSmart Water Bottle with UV-C Cleaning',
    product_cost: 29.99,
    budget: 5000
  });

  useEffect(() => {
    // Initialize API client with callbacks
    apiClient.initialize({
      onAgentOutput: (output: string) => {
        console.log('Agent output received:', output);
        setAgentOutputs(prev => [...prev, output]);
      },
      onProgressUpdate: (progressUpdate: SessionProgress) => {
        console.log('Progress update received:', progressUpdate);
        setProgress(progressUpdate);
      },
      onResultsUpdate: (resultsUpdate: AgentResults) => {
        console.log('Results update received:', resultsUpdate);
        setResults(resultsUpdate);
      },
      onError: (errorUpdate: Error) => {
        console.error('API error received:', errorUpdate);
        setError(errorUpdate.message);
      },
      onConnectionStatusChange: (status: string) => {
        console.log('Connection status changed:', status);
        setIsConnected(status === 'connected');
      }
    });

    // Test connection on mount
    testConnection();

    return () => {
      apiClient.disconnect();
    };
  }, []);

  const testConnection = async () => {
    try {
      setError(null);
      const isHealthy = await apiClient.testConnection();
      setIsConnected(isHealthy);
      
      if (isHealthy) {
        const health = await apiClient.healthCheck();
        console.log('Backend health:', health);
      }
    } catch (err) {
      setError(`Connection test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsConnected(false);
    }
  };

  const startCampaign = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setAgentOutputs([]);
      
      console.log('Starting campaign with data:', campaignData);
      const response = await apiClient.startCampaign(campaignData);
      
      if (response.success) {
        setSessionId(response.sessionId);
        console.log('Campaign started successfully:', response);
      }
    } catch (err) {
      setError(`Campaign start failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const approveContent = async () => {
    if (!sessionId) return;
    
    try {
      setError(null);
      await apiClient.submitContentApproval({
        session_id: sessionId,
        ad_id: 'test-ad-001',
        action: 'approve'
      });
      console.log('Content approved successfully');
    } catch (err) {
      setError(`Content approval failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const reviseContent = async () => {
    if (!sessionId) return;
    
    try {
      setError(null);
      await apiClient.submitContentApproval({
        session_id: sessionId,
        ad_id: 'test-ad-001',
        action: 'revise',
        feedback: 'Make the ad more engaging and add a call-to-action'
      });
      console.log('Content revision requested successfully');
    } catch (err) {
      setError(`Content revision failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const downloadS3Media = async () => {
    try {
      setError(null);
      const result = await apiClient.downloadS3Media(
        's3://agentcore-demo-172/image-outputs/nova/demo_image_001.png',
        'image'
      );
      
      if (result.success) {
        console.log('S3 media downloaded:', result.localUrl);
      }
    } catch (err) {
      setError(`S3 download failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const refreshData = async () => {
    try {
      setError(null);
      await apiClient.refreshData();
      console.log('Data refreshed successfully');
    } catch (err) {
      setError(`Data refresh failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const connectionStatus = apiClient.getConnectionStatus();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API Client Integration Test</h1>
      
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">Connection Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className="font-medium">Backend</div>
            <div className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</div>
          </div>
          <div className={`p-3 rounded ${connectionStatus.stream === 'connected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            <div className="font-medium">Stream</div>
            <div className="text-sm">{connectionStatus.stream}</div>
          </div>
          <div className={`p-3 rounded ${connectionStatus.polling === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            <div className="font-medium">Polling</div>
            <div className="text-sm">{connectionStatus.polling}</div>
          </div>
          <div className={`p-3 rounded ${sessionId ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
            <div className="font-medium">Session</div>
            <div className="text-sm">{sessionId ? 'Active' : 'None'}</div>
          </div>
        </div>
        <button
          onClick={testConnection}
          className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Connection
        </button>
      </div>

      {/* Campaign Setup */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">Campaign Setup</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Product</label>
            <input
              type="text"
              value={campaignData.product}
              onChange={(e) => setCampaignData(prev => ({ ...prev, product: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Product Cost ($)</label>
              <input
                type="number"
                value={campaignData.product_cost}
                onChange={(e) => setCampaignData(prev => ({ ...prev, product_cost: parseFloat(e.target.value) }))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Budget ($)</label>
              <input
                type="number"
                value={campaignData.budget}
                onChange={(e) => setCampaignData(prev => ({ ...prev, budget: parseFloat(e.target.value) }))}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button
            onClick={startCampaign}
            disabled={isLoading || !isConnected}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Starting Campaign...' : 'Start Campaign'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={approveContent}
            disabled={!sessionId}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            Approve Content
          </button>
          <button
            onClick={reviseContent}
            disabled={!sessionId}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
          >
            Revise Content
          </button>
          <button
            onClick={downloadS3Media}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test S3 Download
          </button>
          <button
            onClick={refreshData}
            disabled={!sessionId}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Progress Display */}
      {progress && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Progress</h2>
          <div className="space-y-2">
            <div>Session: {progress.session_id}</div>
            <div>Stage: {progress.current_stage}</div>
            <div>Progress: {progress.progress_percentage}%</div>
            <div>Status: {progress.status}</div>
            <div>Last Updated: {new Date(progress.last_updated).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Agent Outputs */}
      {agentOutputs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Agent Outputs</h2>
          <div className="bg-gray-100 p-3 rounded max-h-64 overflow-y-auto">
            {agentOutputs.map((output, index) => (
              <div key={index} className="text-sm mb-1 font-mono">
                {output}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-3">Results</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTestDemo;