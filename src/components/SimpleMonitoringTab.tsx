/**
 * Simple Monitoring Tab - No polling, no real-time updates
 * Just displays the current session status and allows manual refresh
 */

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, Clock, AlertCircle, Users, DollarSign, FileText, Image } from 'lucide-react';
import tabDataService from '../services/tabDataService';

interface SimpleMonitoringTabProps {
  sessionId: string | null;
  onError: (error: string | null) => void;
}

interface AgentSummary {
  name: string;
  status: 'completed' | 'pending' | 'error';
  dataCount: number;
  icon: React.ComponentType<any>;
  color: string;
}

const SimpleMonitoringTab: React.FC<SimpleMonitoringTabProps> = ({
  sessionId,
  onError
}) => {
  const [agentSummaries, setAgentSummaries] = useState<AgentSummary[]>([
    { name: 'Audience', status: 'pending', dataCount: 0, icon: Users, color: 'blue' },
    { name: 'Budget', status: 'pending', dataCount: 0, icon: DollarSign, color: 'green' },
    { name: 'Prompts', status: 'pending', dataCount: 0, icon: FileText, color: 'purple' },
    { name: 'Content', status: 'pending', dataCount: 0, icon: Image, color: 'orange' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadAgentStatus = async () => {
    if (!sessionId) return;

    setIsLoading(true);
    console.log('🔄 Loading agent status for session:', sessionId);

    try {
      const sessionData = await tabDataService.loadSessionData(sessionId);
      
      const updatedSummaries: AgentSummary[] = [
        {
          name: 'Audience',
          status: sessionData.audiences ? 'completed' : 'pending',
          dataCount: sessionData.audiences?.audiences?.length || 0,
          icon: Users,
          color: 'blue'
        },
        {
          name: 'Budget',
          status: sessionData.budget ? 'completed' : 'pending',
          dataCount: sessionData.budget?.allocations?.length || 0,
          icon: DollarSign,
          color: 'green'
        },
        {
          name: 'Prompts',
          status: sessionData.prompts ? 'completed' : 'pending',
          dataCount: sessionData.prompts?.audience_prompts?.length || 0,
          icon: FileText,
          color: 'purple'
        },
        {
          name: 'Content',
          status: sessionData.content ? 'completed' : 'pending',
          dataCount: sessionData.content?.ads?.length || 0,
          icon: Image,
          color: 'orange'
        }
      ];

      setAgentSummaries(updatedSummaries);
      setLastUpdated(new Date().toLocaleTimeString());
      
      console.log('✅ Agent status loaded:', updatedSummaries);
    } catch (error) {
      console.error('❌ Error loading agent status:', error);
      onError('Failed to load agent status');
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
          </div>
          <button
            onClick={loadAgentStatus}
            disabled={isLoading || !sessionId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh Status'}
          </button>
        </div>
      </div>

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
                {agent.status === 'completed' ? `${agent.dataCount} items` : 'Pending'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">How to Use</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Click "Refresh Status" to check the latest agent progress</li>
          <li>• Navigate to individual tabs (Audience, Budget, etc.) to view detailed results</li>
          <li>• No automatic polling - manual refresh only to prevent loops</li>
          <li>• Green cards indicate completed agents with data available</li>
        </ul>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Debug Info</h4>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify({ sessionId, agentSummaries, lastUpdated }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SimpleMonitoringTab;