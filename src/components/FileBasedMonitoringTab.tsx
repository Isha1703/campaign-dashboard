/**
 * File-Based Monitoring Tab
 * Reads agent results directly from JSON files without backend dependency
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Clock, AlertCircle, Users, DollarSign, FileText, Image, Download, Eye } from 'lucide-react';
import { useCampaignData } from '../contexts/CampaignDataContext';
import CampaignSummary from './CampaignSummary';

interface FileBasedMonitoringTabProps {
  sessionId: string | null;
  onError: (error: string | null) => void;
}

interface AgentSummary {
  name: string;
  status: 'completed' | 'pending' | 'error';
  dataCount: number;
  icon: React.ComponentType<any>;
  color: string;
  timestamp?: string;
  data?: any;
}

const FileBasedMonitoringTab: React.FC<FileBasedMonitoringTabProps> = ({
  sessionId,
  onError
}) => {
  const { sessionData, refreshData, isLoading: contextLoading } = useCampaignData();
  
  const [agentSummaries, setAgentSummaries] = useState<AgentSummary[]>([
    { name: 'Audience', status: 'pending', dataCount: 0, icon: Users, color: 'blue' },
    { name: 'Budget', status: 'pending', dataCount: 0, icon: DollarSign, color: 'green' },
    { name: 'Prompts', status: 'pending', dataCount: 0, icon: FileText, color: 'purple' },
    { name: 'Content', status: 'pending', dataCount: 0, icon: Image, color: 'orange' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Update agent summaries when session data changes
  useEffect(() => {
    if (sessionData) {
      updateAgentSummariesFromSessionData();
    }
  }, [sessionData]);

  const updateAgentSummariesFromSessionData = () => {
    if (!sessionData) return;

    // Updating agent summaries (removed excessive logging)

    const updatedSummaries: AgentSummary[] = [
      {
        name: 'Audience',
        status: sessionData.audiences ? 'completed' : 'pending',
        dataCount: sessionData.audiences?.result?.audiences?.length || 0,
        icon: Users,
        color: 'blue',
        timestamp: sessionData.audiences?.timestamp,
        data: sessionData.audiences?.result
      },
      {
        name: 'Budget',
        status: sessionData.budget ? 'completed' : 'pending',
        dataCount: sessionData.budget?.result?.allocations?.length || 0,
        icon: DollarSign,
        color: 'green',
        timestamp: sessionData.budget?.timestamp,
        data: sessionData.budget?.result
      },
      {
        name: 'Prompts',
        status: sessionData.prompts ? 'completed' : 'pending',
        dataCount: sessionData.prompts?.result?.audience_prompts?.length || 0,
        icon: FileText,
        color: 'purple',
        timestamp: sessionData.prompts?.timestamp,
        data: sessionData.prompts?.result
      },
      {
        name: 'Content',
        status: sessionData.content ? 'completed' : 'pending',
        dataCount: sessionData.content?.result?.ads?.length || 0,
        icon: Image,
        color: 'orange',
        timestamp: sessionData.content?.timestamp,
        data: sessionData.content?.result
      }
    ];

    setAgentSummaries(updatedSummaries);
    setLastUpdated(new Date().toLocaleTimeString());
    
    console.log('✅ Agent summaries updated:', updatedSummaries);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshData();
    } catch (error) {
      onError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'pending':
        return 'border-gray-200 bg-gray-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const exportAgentData = (agent: AgentSummary) => {
    if (!agent.data) return;
    
    const exportData = {
      agent: agent.name,
      sessionId,
      timestamp: agent.timestamp,
      data: agent.data
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${agent.name.toLowerCase()}-data-${sessionId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const completedCount = agentSummaries.filter(agent => agent.status === 'completed').length;
  const totalAgents = agentSummaries.length;
  const progressPercentage = (completedCount / totalAgents) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Campaign Monitoring</h2>
            <p className="text-gray-600">Session: {sessionId || 'No session'}</p>
            {lastUpdated && (
              <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
            )}
            {sessionData?.sessionProgress && (
              <p className="text-sm text-blue-600">
                Progress: {sessionData.sessionProgress.progress_percentage?.toFixed(1)}% • 
                Status: {sessionData.sessionProgress.status} • 
                Stage: {sessionData.sessionProgress.current_stage}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading || contextLoading || !sessionId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${(isLoading || contextLoading) ? 'animate-spin' : ''}`} />
            {(isLoading || contextLoading) ? 'Loading...' : 'Refresh Status'}
          </button>
        </div>
      </div>

      {/* Campaign Workflow Status */}
      {sessionData && (
        <div className="mb-6">
          <CampaignSummary
            workflowStage={sessionData.sessionProgress?.current_stage || 'setup'}
            sessionData={sessionData}
            campaignProgress={sessionData.sessionProgress?.progress_percentage || 0}
          />
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{completedCount}/{totalAgents} agents completed</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Agent Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {agentSummaries.map((agent) => {
          const IconComponent = agent.icon;
          return (
            <div
              key={agent.name}
              className={`border rounded-lg p-4 ${getStatusColor(agent.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <IconComponent className={`w-6 h-6 text-${agent.color}-500`} />
                {getStatusIcon(agent.status)}
              </div>
              <h3 className="font-medium text-gray-800">{agent.name}</h3>
              <p className="text-sm text-gray-600">
                {agent.status === 'completed' ? `${agent.dataCount} items` : 
                 agent.status === 'error' ? 'Error loading' : 'Pending'}
              </p>
              {agent.timestamp && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(agent.timestamp).toLocaleTimeString()}
                </p>
              )}
              {agent.status === 'completed' && agent.data && (
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => exportAgentData(agent)}
                    className="text-xs bg-white text-gray-600 px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">File-Based Monitoring</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Reads agent results directly from JSON files in agent_outputs directory</li>
          <li>• No backend API dependency - works even when server is offline</li>
          <li>• Auto-refreshes when session changes</li>
          <li>• Click "Refresh Status" to check for new completed agents</li>
          <li>• Green cards indicate completed agents with data available</li>
        </ul>
      </div>

      {/* File Access Note */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This component reads files directly from the agent_outputs directory. 
          If you see "pending" status but agents have completed, the files may not be accessible via HTTP. 
          In that case, use the Tab Tester or ensure the agent_outputs directory is served as static files.
        </p>
      </div>
    </div>
  );
};

export default FileBasedMonitoringTab;