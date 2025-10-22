/**
 * Analytics Tab - Shows performance analysis of generated ads
 * Integrates with AnalyticsAgent results and displays interactive metrics
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Eye, MousePointer,
  DollarSign, Target, Users, RefreshCw
} from 'lucide-react';
import campaignWorkflowService, { CampaignState } from '../../services/campaignWorkflowService';
import { useCampaignData } from '../../contexts/CampaignDataContext';

interface AnalyticsTabProps {
  sessionId: string | null;
  onError: (error: string | null) => void;
}

interface CalculatedMetrics {
  audience: string;
  platform: string;
  impressions: number;
  clicks: number;
  redirects: number;
  conversions: number;
  likes: number;
  cost: number;
  revenue: number;
  roi: number;
  ctr: number;
  redirect_rate: number;
}



const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  sessionId
}) => {
  const { sessionData } = useCampaignData();
  const [workflowState, setWorkflowState] = useState<CampaignState>(campaignWorkflowService.getCurrentState());
  const [lastUpdated, setLastUpdated] = useState<string>('Never');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to workflow updates
    const handleWorkflowUpdate = (state: CampaignState) => {
      setWorkflowState(state);
      if (state.analytics) {
        setLastUpdated(new Date().toLocaleTimeString());
      }
    };

    campaignWorkflowService.addCallback(handleWorkflowUpdate);

    return () => {
      campaignWorkflowService.removeCallback(handleWorkflowUpdate);
    };
  }, []);

  // Use analytics data from session data or loaded data (no mock fallback)
  const analytics = (sessionData as any)?.analytics?.result || analyticsData || workflowState.analytics;

  // Update last updated time when session data changes
  // Load analytics data directly from files if not in session data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!sessionId) return;

      // Skip if we already have analytics data
      if ((sessionData as any)?.analytics?.result || analyticsData) return;

      setIsLoading(true);
      try {
        // Use backend API to load analytics data
        const API_BASE_URL = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/agent/AnalyticsAgent`);
        if (response.ok) {
          const data = await response.json();
          if (data.data?.result) {
            setAnalyticsData(data.data.result);
            setLastUpdated(new Date().toLocaleTimeString());
            console.log('✅ Loaded analytics data from API:', data.data.result);
          }
        } else {
          console.log(`⚠️ Analytics not found (${response.status}), will use mock data`);
        }
      } catch (error) {
        console.log('⚠️ Analytics data not yet available, will use mock data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalyticsData();
  }, [sessionId]);

  useEffect(() => {
    if ((sessionData as any)?.analytics?.timestamp) {
      setLastUpdated(new Date((sessionData as any).analytics.timestamp).toLocaleTimeString());
    }
  }, [sessionData]);

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold * 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (value: number, threshold: number) => {
    if (value >= threshold) return <TrendingUp className="w-4 h-4 text-green-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Show loading or no data state if analytics not available
  if (!analytics) {
    if (isLoading) {
      return (
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <RefreshCw className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Loading Analytics...</h3>
            <p className="text-gray-500">Fetching performance data...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Analytics Not Available Yet</h3>
          <p className="text-gray-500 mb-4">Performance analytics will appear here once all ads are approved and the analytics agent runs.</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-800">
              <strong>To generate analytics:</strong>
            </p>
            <ol className="text-sm text-blue-700 mt-2 text-left list-decimal list-inside">
              <li>Complete content generation</li>
              <li>Navigate to Content tab</li>
              <li>Click "Proceed to Analytics" button</li>
            </ol>
          </div>
          <p className="text-sm text-gray-400 mt-4">Last updated: {lastUpdated}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Performance Analytics</h2>
            <p className="text-gray-600">Campaign performance analysis • Last updated: {lastUpdated}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                if (!sessionId) return;
                setIsLoading(true);
                try {
                  const response = await fetch(`/agent_outputs/${sessionId}/analyticsagent_result.json`);
                  if (response.ok) {
                    const data = await response.json();
                    if (data.result) {
                      setAnalyticsData(data.result);
                      setLastUpdated(new Date().toLocaleTimeString());
                    }
                  }
                } catch (error) {
                  console.error('Failed to refresh analytics:', error);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Live Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.total_revenue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(analytics.total_cost)}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall ROI</p>
              <p className="text-2xl font-bold text-green-600">{formatPercentage(analytics.overall_roi)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Best Performer</p>
              <p className="text-sm font-medium text-gray-800">{analytics.best_performing}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Platform Performance */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Performance Breakdown</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Audience / Platform</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Impressions</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Clicks</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">CTR</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Conversions</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Revenue</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">ROI</th>
              </tr>
            </thead>
            <tbody>
              {analytics.platform_metrics.map((metric: CalculatedMetrics, index: number) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-800">{metric.audience}</p>
                      <p className="text-sm text-gray-500">{metric.platform}</p>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span>{metric.impressions.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <MousePointer className="w-4 h-4 text-gray-400" />
                      <span>{metric.clicks.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4">
                    <div className="flex items-center justify-end gap-1">
                      {getPerformanceIcon(metric.ctr, 4.0)}
                      <span className={getPerformanceColor(metric.ctr, 4.0)}>
                        {formatPercentage(metric.ctr)}
                      </span>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className="font-medium">{metric.conversions}</span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className="font-medium text-green-600">
                      {formatCurrency(metric.revenue)}
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <div className="flex items-center justify-end gap-1">
                      {getPerformanceIcon(metric.roi, 500)}
                      <span className={`font-medium ${getPerformanceColor(metric.roi, 500)}`}>
                        {formatPercentage(metric.roi)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold text-gray-800 mb-4">Top Performing Ads</h4>
          <div className="space-y-3">
            {analytics.platform_metrics
              .sort((a: CalculatedMetrics, b: CalculatedMetrics) => b.roi - a.roi)
              .slice(0, 3)
              .map((metric: CalculatedMetrics, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{metric.audience}</p>
                    <p className="text-sm text-gray-600">{metric.platform}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatPercentage(metric.roi)} ROI</p>
                    <p className="text-sm text-gray-500">{metric.conversions} conversions</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold text-gray-800 mb-4">Key Performance Indicators</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average CTR</span>
              <span className="font-medium">
                {formatPercentage(
                  analytics.platform_metrics.reduce((sum: number, m: CalculatedMetrics) => sum + m.ctr, 0) /
                  analytics.platform_metrics.length
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Conversions</span>
              <span className="font-medium">
                {analytics.platform_metrics.reduce((sum: number, m: CalculatedMetrics) => sum + m.conversions, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cost per Conversion</span>
              <span className="font-medium">
                {formatCurrency(
                  analytics.total_cost /
                  analytics.platform_metrics.reduce((sum: number, m: CalculatedMetrics) => sum + m.conversions, 0)
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenue per Conversion</span>
              <span className="font-medium text-green-600">
                {formatCurrency(
                  analytics.total_revenue /
                  analytics.platform_metrics.reduce((sum: number, m: CalculatedMetrics) => sum + m.conversions, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <div>
            <h4 className="font-medium text-blue-800">Ready for Optimization</h4>
            <p className="text-blue-600 text-sm">
              Based on this performance data, the optimization agent can now reallocate budget for better ROI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;