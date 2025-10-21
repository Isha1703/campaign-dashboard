/**
 * Auto-Updating Tabs Component
 * Automatically monitors JSON files and updates all tabs in real-time
 * No backend API required - reads files directly
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, FileText, Image, RefreshCw, 
  CheckCircle, Clock, AlertCircle, Play, Pause,
  Eye, Download, ExternalLink
} from 'lucide-react';
import fileMonitorService from '../services/fileMonitorService';

interface AutoUpdatingTabsProps {
  sessionId: string;
}

interface TabData {
  name: string;
  key: string;
  icon: React.ComponentType<any>;
  color: string;
  status: 'pending' | 'completed' | 'error';
  dataCount: number;
  data: any;
  lastUpdated?: string;
}

const AutoUpdatingTabs: React.FC<AutoUpdatingTabsProps> = ({ sessionId }) => {
  const [tabs, setTabs] = useState<TabData[]>([
    { name: 'Audience', key: 'audiences', icon: Users, color: 'blue', status: 'pending', dataCount: 0, data: null },
    { name: 'Budget', key: 'budget', icon: DollarSign, color: 'green', status: 'pending', dataCount: 0, data: null },
    { name: 'Prompts', key: 'prompts', icon: FileText, color: 'purple', status: 'pending', dataCount: 0, data: null },
    { name: 'Content', key: 'content', icon: Image, color: 'orange', status: 'pending', dataCount: 0, data: null }
  ]);
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [lastGlobalUpdate, setLastGlobalUpdate] = useState<string>('Never');

  useEffect(() => {
    // Start monitoring when component mounts
    startMonitoring();

    return () => {
      // Stop monitoring when component unmounts
      fileMonitorService.stopMonitoring();
    };
  }, [sessionId]);

  const startMonitoring = () => {
    console.log('🚀 Starting auto-updating tabs for session:', sessionId);
    
    // Add callback to receive updates
    fileMonitorService.addCallback(handleDataUpdate);
    
    // Start monitoring
    fileMonitorService.startMonitoring(sessionId);
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    console.log('⏸️ Stopping auto-updating tabs');
    
    fileMonitorService.removeCallback(handleDataUpdate);
    fileMonitorService.stopMonitoring();
    setIsMonitoring(false);
  };

  const handleDataUpdate = (sessionData: any) => {
    console.log('📊 Received data update:', sessionData);
    
    setTabs(prevTabs => prevTabs.map(tab => {
      const data = sessionData[tab.key];
      const hasData = data && Object.keys(data).length > 0;
      
      let dataCount = 0;
      if (hasData) {
        switch (tab.key) {
          case 'audiences':
            dataCount = data.audiences?.length || 0;
            break;
          case 'budget':
            dataCount = data.allocations?.length || 0;
            break;
          case 'prompts':
            dataCount = data.audience_prompts?.length || 0;
            break;
          case 'content':
            dataCount = data.ads?.length || 0;
            break;
        }
      }
      
      return {
        ...tab,
        status: hasData ? 'completed' : 'pending',
        dataCount,
        data,
        lastUpdated: hasData ? new Date().toLocaleTimeString() : undefined
      };
    }));
    
    setLastGlobalUpdate(new Date().toLocaleTimeString());
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  const exportTabData = (tab: TabData) => {
    if (!tab.data) return;
    
    const exportData = {
      tab: tab.name,
      sessionId,
      timestamp: new Date().toISOString(),
      data: tab.data
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tab.name.toLowerCase()}-data-${sessionId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
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
    }
  };

  const completedCount = tabs.filter(tab => tab.status === 'completed').length;
  const progressPercentage = (completedCount / tabs.length) * 100;

  const renderTabContent = (tab: TabData) => {
    if (!tab.data) {
      return (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Waiting for {tab.name.toLowerCase()} data...</p>
          <p className="text-sm text-gray-400 mt-2">Files are monitored every 5 seconds</p>
        </div>
      );
    }

    switch (tab.key) {
      case 'audiences':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Target Audiences ({tab.dataCount})</h4>
            {tab.data.audiences?.map((audience: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <h5 className="font-medium text-blue-600">{audience.name}</h5>
                <p className="text-sm text-gray-600 mt-1">{audience.demographics}</p>
                <div className="mt-2">
                  <span className="text-xs font-medium text-gray-500">Platforms:</span>
                  {audience.platforms?.map((platform: any, pIndex: number) => (
                    <div key={pIndex} className="mt-1">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                        {platform.platform}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{platform.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'budget':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">
              Budget Allocation (${tab.data.total_budget?.toLocaleString()})
            </h4>
            {tab.data.allocations?.map((allocation: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <h5 className="font-medium text-green-600">{allocation.audience}</h5>
                <p className="text-lg font-bold text-gray-800">${allocation.total?.toLocaleString()}</p>
                {allocation.platforms?.map((platform: any, pIndex: number) => (
                  <div key={pIndex} className="mt-2 text-sm">
                    <span className="text-gray-600">{platform.platform}: </span>
                    <span className="font-medium">${platform.amount?.toLocaleString()} ({platform.percentage}%)</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );

      case 'prompts':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Creative Prompts ({tab.dataCount} audiences)</h4>
            {tab.data.audience_prompts?.map((audiencePrompt: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <h5 className="font-medium text-purple-600">{audiencePrompt.audience}</h5>
                {audiencePrompt.platforms?.map((platform: any, pIndex: number) => (
                  <div key={pIndex} className="mt-3">
                    <h6 className="text-sm font-medium text-gray-700">{platform.platform}</h6>
                    {platform.prompts?.map((prompt: any, promptIndex: number) => (
                      <div key={promptIndex} className="mt-2 p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            {prompt.ad_type}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {prompt.cta}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{prompt.prompt}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );

      case 'content':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Generated Content ({tab.dataCount} ads)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tab.data.ads?.map((ad: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      {ad.ad_type}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {ad.status}
                    </span>
                  </div>
                  <h5 className="font-medium text-gray-800">{ad.asset_id}</h5>
                  <p className="text-sm text-gray-600">{ad.audience} • {ad.platform}</p>
                  <div className="mt-2">
                    {ad.content.startsWith('http') ? (
                      <div>
                        <p className="text-xs text-gray-500">Image:</p>
                        <a href={ad.content} target="_blank" rel="noopener noreferrer" 
                           className="text-xs text-blue-600 hover:underline break-all flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          View Image
                        </a>
                      </div>
                    ) : ad.content.startsWith('s3://') ? (
                      <div>
                        <p className="text-xs text-gray-500">Video S3:</p>
                        <p className="text-xs text-gray-600 break-all">{ad.content}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-500">Text Content:</p>
                        <p className="text-xs text-gray-600">{ad.content.substring(0, 100)}...</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {tab.data.summary && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">Content Summary</h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">By Type:</p>
                    {Object.entries(tab.data.summary.by_type).map(([type, count]) => (
                      <p key={type} className="text-gray-800">{type}: {count as number}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-gray-600">By Platform:</p>
                    {Object.entries(tab.data.summary.by_platform).map(([platform, count]) => (
                      <p key={platform} className="text-gray-800">{platform}: {count as number}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-gray-600">By Audience:</p>
                    {Object.entries(tab.data.summary.by_audience).map(([audience, count]) => (
                      <p key={audience} className="text-gray-800">{audience}: {count as number}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(tab.data, null, 2)}</pre>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Auto-Updating Campaign Dashboard</h2>
            <p className="text-gray-600">Session: {sessionId}</p>
            <p className="text-sm text-gray-500">
              Last update: {lastGlobalUpdate} • 
              Status: {isMonitoring ? '🟢 Monitoring' : '🔴 Stopped'} • 
              Checking files every 5 seconds
            </p>
          </div>
          <button
            onClick={toggleMonitoring}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isMonitoring 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{completedCount}/{tabs.length} agents completed</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Tab Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <div
              key={tab.name}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${getStatusColor(tab.status)} ${
                selectedTab === tab.name ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedTab(selectedTab === tab.name ? null : tab.name)}
            >
              <div className="flex items-center justify-between mb-2">
                <IconComponent className={`w-6 h-6 text-${tab.color}-500`} />
                {getStatusIcon(tab.status)}
              </div>
              <h3 className="font-medium text-gray-800">{tab.name}</h3>
              <p className="text-sm text-gray-600">
                {tab.status === 'completed' ? `${tab.dataCount} items` : 'Waiting...'}
              </p>
              {tab.lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">Updated: {tab.lastUpdated}</p>
              )}
              {tab.status === 'completed' && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTab(tab.name);
                    }}
                    className="text-xs bg-white text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
                  >
                    <Eye className="w-3 h-3 inline mr-1" />
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      exportTabData(tab);
                    }}
                    className="text-xs bg-white text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
                  >
                    <Download className="w-3 h-3 inline mr-1" />
                    Export
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Tab Content */}
      {selectedTab && (
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">{selectedTab} Data</h3>
            <button
              onClick={() => setSelectedTab(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          {renderTabContent(tabs.find(t => t.name === selectedTab)!)}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">🤖 Automated File Monitoring</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Automatic Updates:</strong> Checks for new JSON files every 5 seconds</li>
          <li>• <strong>Real-time Display:</strong> Tabs update automatically when agents complete</li>
          <li>• <strong>No Manual Work:</strong> No need to run copy scripts or refresh manually</li>
          <li>• <strong>File-based:</strong> Reads directly from agent_outputs/{sessionId}/ directory</li>
          <li>• <strong>Visual Feedback:</strong> Green cards show completed agents with data counts</li>
        </ul>
      </div>
    </div>
  );
};

export default AutoUpdatingTabs;