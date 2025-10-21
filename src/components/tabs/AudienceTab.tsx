import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Target, TrendingUp, Instagram, Linkedin, Facebook, MessageCircle, Twitter, Youtube, RefreshCw } from 'lucide-react';
import type { CampaignData } from '../../types';
import BudgetDistributionChart from '../BudgetDistributionChart';
import campaignWorkflowService, { CampaignState } from '../../services/campaignWorkflowService';

interface AudienceTabProps {
  campaignData: CampaignData | null;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  onError: (error: string | null) => void;
}

const AudienceTab: React.FC<AudienceTabProps> = ({
  campaignData,
  sessionId,
  isLoading
}) => {
  const [workflowState, setWorkflowState] = useState<CampaignState>(campaignWorkflowService.getCurrentState());
  const [lastUpdated, setLastUpdated] = useState<string>('Never');

  useEffect(() => {
    // Subscribe to workflow updates
    const handleWorkflowUpdate = (state: CampaignState) => {
      setWorkflowState(state);
      if (state.audiences || state.budget) {
        setLastUpdated(new Date().toLocaleTimeString());
      }
    };

    campaignWorkflowService.addCallback(handleWorkflowUpdate);

    return () => {
      campaignWorkflowService.removeCallback(handleWorkflowUpdate);
    };
  }, []);

  // Use workflow data if available, otherwise fall back to campaignData
  const audienceData = workflowState.audiences || campaignData?.audiences;
  const budgetData = workflowState.budget || campaignData?.budgetAllocation;

  // Export functionality for audience and budget data
  const exportBudgetData = () => {
    if (!audienceData || !budgetData) return;
    
    const exportData = {
      campaign_budget: budgetData.total_budget,
      audiences: audienceData.audiences,
      budget_allocations: budgetData.allocations,
      export_timestamp: new Date().toISOString(),
      session_id: sessionId
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `audience-budget-data-${sessionId || 'export'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPlatformIcon = (platform: string) => {
    const iconProps = { className: "w-6 h-6" };
    
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram {...iconProps} className="w-6 h-6 text-pink-600" />;
      case 'linkedin':
        return <Linkedin {...iconProps} className="w-6 h-6 text-blue-600" />;
      case 'facebook':
        return <Facebook {...iconProps} className="w-6 h-6 text-blue-700" />;
      case 'tiktok':
        return <MessageCircle {...iconProps} className="w-6 h-6 text-black" />;
      case 'twitter':
        return <Twitter {...iconProps} className="w-6 h-6 text-blue-400" />;
      case 'youtube':
        return <Youtube {...iconProps} className="w-6 h-6 text-red-600" />;
      default:
        return <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
          {platform.charAt(0).toUpperCase()}
        </div>;
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      'Instagram': 'from-pink-500 to-purple-600',
      'LinkedIn': 'from-blue-600 to-blue-700',
      'Facebook': 'from-blue-500 to-blue-600',
      'TikTok': 'from-black to-gray-800',
      'Twitter': 'from-blue-400 to-blue-500'
    };
    return colors[platform] || 'from-gray-500 to-gray-600';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Audience Analysis & Budget Distribution
          </h2>
          <p className="text-gray-600">
            AI agents are analyzing your target audiences and optimizing budget allocation...
          </p>
        </div>
        
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!audienceData || !budgetData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Audience Analysis & Budget Distribution
          </h2>
          <p className="text-gray-600">
            Waiting for audience analysis and budget allocation data...
          </p>
        </div>
        
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Audience Analysis & Budget Distribution</h3>
          <p className="text-gray-500">Waiting for audience analysis and budget allocation data...</p>
          <p className="text-sm text-gray-400 mt-2">Last updated: {lastUpdated}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Audience Analysis & Budget Distribution
        </h2>
        <p className="text-gray-600">
          AI-generated target audience insights and optimized budget allocation across platforms
        </p>
      </div>

      {/* Audience Analysis - Multiple Audiences */}
      <div className="space-y-4">
        {audienceData.audiences.map((audience, audienceIndex) => (
          <div key={audienceIndex} className="card">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="w-6 h-6 text-primary-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                Target Audience {audienceIndex + 1}: {audience.name}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">{audience.name}</h4>
                <p className="text-gray-600">{audience.demographics}</p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Platform Strategy</h5>
                <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {audience.platforms.map((item, platformIndex) => (
                    <div key={platformIndex} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        {getPlatformIcon(item.platform)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 mb-1">{item.platform}</div>
                        <div className="text-sm text-gray-600 leading-relaxed">{item.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Budget Distribution */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-success-600" />
            <h3 className="text-xl font-semibold text-gray-900">Budget Allocation</h3>
          </div>
          <button
            onClick={() => exportBudgetData()}
            className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            Export Data
          </button>
        </div>

        {/* Total Budget Overview */}
        <div className="mb-6 p-4 bg-gradient-to-r from-success-50 to-primary-50 rounded-lg border border-success-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Total Campaign Budget</div>
              <div className="text-3xl font-bold text-success-600">
                ${budgetData.total_budget.toLocaleString()}
              </div>
            </div>
            <Target className="w-12 h-12 text-success-600" />
          </div>
        </div>

        {/* Budget Allocations by Audience */}
        <div className="space-y-6">
          <h5 className="text-sm font-medium text-gray-700">Budget Distribution by Audience & Platform</h5>
          
          {budgetData.allocations.map((allocation, allocationIndex) => (
            <div key={allocationIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h6 className="font-medium text-gray-900">{allocation.audience}</h6>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">${allocation.total.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">
                    {((allocation.total / budgetData.total_budget) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {allocation.platforms.map((platform, platformIndex) => (
                  <div key={platformIndex} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getPlatformIcon(platform.platform)}
                        <span className="font-medium text-gray-900">{platform.platform}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">${platform.amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{platform.percentage}%</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full bg-gradient-to-r ${getPlatformColor(platform.platform)} transition-all duration-700 ease-out`}
                        style={{ 
                          width: `${platform.percentage}%`,
                          animation: `slideIn 0.7s ease-out ${platformIndex * 0.1}s both`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Budget Summary */}
        <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <div className="flex items-start space-x-3">
            <TrendingUp className="w-5 h-5 text-primary-600 mt-0.5" />
            <div className="flex-1">
              <h6 className="font-medium text-primary-900 mb-2">Budget Strategy Insights</h6>
              <div className="grid gap-2 text-sm text-primary-700">
                {budgetData.allocations.map((allocation, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span>• {allocation.audience}:</span>
                    <span className="font-medium">
                      ${allocation.total.toLocaleString()} ({((allocation.total / budgetData.total_budget) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Budget Distribution Visualization */}
      <BudgetDistributionChart 
        budgetData={budgetData} 
        onExport={exportBudgetData}
      />

      {/* Performance Projections */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center hover:shadow-lg transition-shadow">
          <div className="text-2xl font-bold text-primary-600 mb-1">
            {audienceData.audiences.length}
          </div>
          <div className="text-sm text-gray-600">Target Audiences</div>
        </div>
        <div className="card text-center hover:shadow-lg transition-shadow">
          <div className="text-2xl font-bold text-success-600 mb-1">
            {budgetData.allocations.reduce((sum, alloc) => sum + alloc.platforms.length, 0)}
          </div>
          <div className="text-sm text-gray-600">Platform Channels</div>
        </div>
        <div className="card text-center hover:shadow-lg transition-shadow">
          <div className="text-2xl font-bold text-warning-600 mb-1">
            ${(budgetData.total_budget / budgetData.allocations.reduce((sum, alloc) => sum + alloc.platforms.length, 0)).toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">Avg. per Platform</div>
        </div>
        <div className="card text-center hover:shadow-lg transition-shadow">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {Math.max(...budgetData.allocations.map(alloc => Math.max(...alloc.platforms.map(p => p.percentage))))}%
          </div>
          <div className="text-sm text-gray-600">Highest Allocation</div>
        </div>
      </div>

      {/* Add CSS animation styles */}
      <style>{`
        @keyframes slideIn {
          from {
            width: 0%;
          }
          to {
            width: var(--target-width);
          }
        }
      `}</style>
    </div>
  );
};

export default AudienceTab;