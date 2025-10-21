/**
 * Tab Tester Component - Tests all individual tabs with real data
 * This component loads data once and displays it in each tab for testing
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Eye, Download } from 'lucide-react';
import tabDataService from '../services/tabDataService';

interface TabTesterProps {
  sessionId: string;
}

interface TabTestResult {
  name: string;
  status: 'loading' | 'success' | 'error' | 'empty';
  data?: any;
  error?: string;
  dataCount?: number;
}

const TabTester: React.FC<TabTesterProps> = ({ sessionId }) => {
  const [testResults, setTestResults] = useState<TabTestResult[]>([
    { name: 'Audience', status: 'loading' },
    { name: 'Budget', status: 'loading' },
    { name: 'Prompts', status: 'loading' },
    { name: 'Content', status: 'loading' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      testAllTabs();
    }
  }, [sessionId]);

  const testAllTabs = async () => {
    setIsLoading(true);
    console.log('🧪 Testing all tabs for session:', sessionId);

    try {
      // Load all data at once
      const sessionData = await tabDataService.loadSessionData(sessionId);
      
      // Test each tab
      const results: TabTestResult[] = [
        {
          name: 'Audience',
          status: sessionData.audiences ? 'success' : 'empty',
          data: sessionData.audiences,
          dataCount: sessionData.audiences?.audiences?.length || 0
        },
        {
          name: 'Budget',
          status: sessionData.budget ? 'success' : 'empty',
          data: sessionData.budget,
          dataCount: sessionData.budget?.allocations?.length || 0
        },
        {
          name: 'Prompts',
          status: sessionData.prompts ? 'success' : 'empty',
          data: sessionData.prompts,
          dataCount: sessionData.prompts?.audience_prompts?.length || 0
        },
        {
          name: 'Content',
          status: sessionData.content ? 'success' : 'empty',
          data: sessionData.content,
          dataCount: sessionData.content?.ads?.length || 0
        }
      ];

      setTestResults(results);
      console.log('✅ Tab testing completed:', results);
    } catch (error) {
      console.error('❌ Tab testing failed:', error);
      setTestResults(prev => prev.map(tab => ({
        ...tab,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: TabTestResult['status']) => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'empty':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TabTestResult['status']) => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'empty':
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const exportTabData = (tabName: string, data: any) => {
    const exportData = {
      tab: tabName,
      sessionId,
      timestamp: new Date().toISOString(),
      data
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tabName.toLowerCase()}-data-${sessionId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderTabData = (result: TabTestResult) => {
    if (!result.data) return <p className="text-gray-500">No data available</p>;

    switch (result.name) {
      case 'Audience':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Target Audiences ({result.dataCount})</h4>
            {result.data.audiences?.map((audience: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <h5 className="font-medium text-blue-600">{audience.name}</h5>
                <p className="text-sm text-gray-600 mt-1">{audience.demographics}</p>
                <div className="mt-2">
                  <span className="text-xs font-medium text-gray-500">Platforms:</span>
                  {audience.platforms?.map((platform: any, pIndex: number) => (
                    <div key={pIndex} className="mt-1">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
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

      case 'Budget':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">
              Budget Allocation (${result.data.total_budget?.toLocaleString()})
            </h4>
            {result.data.allocations?.map((allocation: any, index: number) => (
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

      case 'Prompts':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Creative Prompts ({result.dataCount} audiences)</h4>
            {result.data.audience_prompts?.map((audiencePrompt: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <h5 className="font-medium text-purple-600">{audiencePrompt.audience}</h5>
                {audiencePrompt.platforms?.map((platform: any, pIndex: number) => (
                  <div key={pIndex} className="mt-3">
                    <h6 className="text-sm font-medium text-gray-700">{platform.platform}</h6>
                    {platform.prompts?.map((prompt: any, promptIndex: number) => (
                      <div key={promptIndex} className="mt-2 p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-start">
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            {prompt.ad_type}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {prompt.cta}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{prompt.prompt}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );

      case 'Content':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Generated Content ({result.dataCount} ads)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.data.ads?.map((ad: any, index: number) => (
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
                        <p className="text-xs text-gray-500">Image URL:</p>
                        <a href={ad.content} target="_blank" rel="noopener noreferrer" 
                           className="text-xs text-blue-600 hover:underline break-all">
                          {ad.content}
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
            {result.data.summary && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">Content Summary</h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">By Type:</p>
                    {Object.entries(result.data.summary.by_type).map(([type, count]) => (
                      <p key={type} className="text-gray-800">{type}: {count as number}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-gray-600">By Platform:</p>
                    {Object.entries(result.data.summary.by_platform).map(([platform, count]) => (
                      <p key={platform} className="text-gray-800">{platform}: {count as number}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-gray-600">By Audience:</p>
                    {Object.entries(result.data.summary.by_audience).map(([audience, count]) => (
                      <p key={audience} className="text-gray-800">{audience}: {count as number}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(result.data, null, 2)}</pre>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tab Data Tester</h2>
        <p className="text-gray-600">Session: {sessionId}</p>
        <button
          onClick={testAllTabs}
          disabled={isLoading}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Testing...' : 'Refresh Tests'}
        </button>
      </div>

      {/* Tab Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {testResults.map((result) => (
          <div
            key={result.name}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${getStatusColor(result.status)} ${
              selectedTab === result.name ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedTab(selectedTab === result.name ? null : result.name)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800">{result.name}</h3>
              {getStatusIcon(result.status)}
            </div>
            <p className="text-sm text-gray-600">
              {result.status === 'success' && `${result.dataCount} items`}
              {result.status === 'empty' && 'No data'}
              {result.status === 'error' && 'Error loading'}
              {result.status === 'loading' && 'Loading...'}
            </p>
            {result.status === 'success' && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTab(result.name);
                  }}
                  className="text-xs bg-white text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
                >
                  <Eye className="w-3 h-3 inline mr-1" />
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    exportTabData(result.name, result.data);
                  }}
                  className="text-xs bg-white text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
                >
                  <Download className="w-3 h-3 inline mr-1" />
                  Export
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Tab Data */}
      {selectedTab && (
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">{selectedTab} Tab Data</h3>
            <button
              onClick={() => setSelectedTab(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          {renderTabData(testResults.find(r => r.name === selectedTab)!)}
        </div>
      )}
    </div>
  );
};

export default TabTester;