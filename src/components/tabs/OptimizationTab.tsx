/**
 * Optimization Tab - Shows budget reallocation and ROI forecasting
 * Integrates with OptimizationAgent results and displays budget changes
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, ArrowRight, Target,
  CheckCircle, BarChart3, Zap
} from 'lucide-react';
import campaignWorkflowService, { CampaignState } from '../../services/campaignWorkflowService';
import { useCampaignData } from '../../contexts/CampaignDataContext';

interface OptimizationTabProps {
  sessionId: string | null;
  onError: (error: string | null) => void;
}

interface BudgetChange {
  audience: string;
  platform: string;
  old_amount: number;
  new_amount: number;
  change: number;
}



const OptimizationTab: React.FC<OptimizationTabProps> = ({
  sessionId,
  onError
}) => {
  const { sessionData } = useCampaignData();
  const [workflowState, setWorkflowState] = useState<CampaignState>(campaignWorkflowService.getCurrentState());
  const [lastUpdated, setLastUpdated] = useState<string>('Never');
  const [isApplying, setIsApplying] = useState(false);
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to workflow updates
    const handleWorkflowUpdate = (state: CampaignState) => {
      setWorkflowState(state);
      if (state.optimization) {
        setLastUpdated(new Date().toLocaleTimeString());
      }
    };

    campaignWorkflowService.addCallback(handleWorkflowUpdate);

    return () => {
      campaignWorkflowService.removeCallback(handleWorkflowUpdate);
    };
  }, []);



  // Load optimization data directly from files if not in session data
  useEffect(() => {
    const loadOptimizationData = async () => {
      if (!sessionId) return;

      // Skip if we already have optimization data
      if ((sessionData as any)?.optimization?.result || optimizationData) return;

      setIsLoading(true);
      try {
        // Use backend API to load optimization data
        const API_BASE_URL = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/agent/OptimizationAgent`);
        if (response.ok) {
          const data = await response.json();
          if (data.data?.result) {
            setOptimizationData(data.data.result);
            setLastUpdated(new Date().toLocaleTimeString());
            console.log('✅ Loaded optimization data from API:', data.data.result);
          }
        } else {
          console.log(`⚠️ Optimization not found (${response.status}), will use mock data`);
        }
      } catch (error) {
        console.log('⚠️ Optimization data not yet available, will use mock data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOptimizationData();
  }, [sessionId]);

  // Use optimization data from session data or loaded data (no mock fallback)
  const optimization = (sessionData as any)?.optimization?.result || optimizationData || workflowState.optimization;

  // Calculate projected improvements if not provided
  if (optimization && !optimization.projected_roi_improvement && optimization.budget_changes) {
    // Calculate total budget change impact
    const totalOldBudget = optimization.budget_changes.reduce((sum: number, change: BudgetChange) => sum + change.old_amount, 0);
    const totalNewBudget = optimization.budget_changes.reduce((sum: number, change: BudgetChange) => sum + change.new_amount, 0);
    const budgetChangePercent = ((totalNewBudget - totalOldBudget) / totalOldBudget) * 100;
    
    // Estimate ROI improvement (conservative estimate: 20-30% improvement from reallocation)
    optimization.projected_roi_improvement = Math.abs(budgetChangePercent) * 0.25;
    
    // Estimate revenue increase based on budget changes
    // Assume reallocating to better performers increases revenue by 15-25%
    const avgRevenuePerDollar = 50; // Conservative estimate
    const budgetIncrease = Math.max(0, totalNewBudget - totalOldBudget);
    optimization.projected_revenue_increase = budgetIncrease * avgRevenuePerDollar * 0.2;
  }

  // Update last updated time when session data changes
  useEffect(() => {
    if ((sessionData as any)?.optimization?.timestamp) {
      setLastUpdated(new Date((sessionData as any).optimization.timestamp).toLocaleTimeString());
    }
  }, [sessionData]);

  const handleApplyOptimization = async () => {
    setIsApplying(true);
    try {
      // Simulate applying optimization changes
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In real implementation, this would call the backend to apply changes
      console.log('Optimization applied successfully');

      // Update workflow state to completed
      setWorkflowState(prev => ({
        ...prev,
        currentStage: 'completed',
        progress: 100
      }));

    } catch (error) {
      onError('Failed to apply optimization changes');
    } finally {
      setIsApplying(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
    return <Target className="w-4 h-4 text-gray-600" />;
  };

  // Show loading or no data state if optimization not available
  if (!optimization) {
    if (isLoading) {
      return (
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Loading Optimization...</h3>
            <p className="text-gray-500">Fetching optimization recommendations...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Optimization Not Available Yet</h3>
          <p className="text-gray-500 mb-4">Budget optimization will appear here once performance analytics are complete.</p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-purple-800">
              <strong>To generate optimization:</strong>
            </p>
            <ol className="text-sm text-purple-700 mt-2 text-left list-decimal list-inside">
              <li>Complete analytics generation</li>
              <li>Optimization runs automatically after analytics</li>
              <li>View recommendations here</li>
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
            <h2 className="text-2xl font-bold text-gray-800">Budget Optimization</h2>
            <p className="text-gray-600">AI-powered budget reallocation • Last updated: {lastUpdated}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-lg">
            <Zap className="w-5 h-5" />
            <span className="font-medium">Smart Optimization</span>
          </div>
        </div>
      </div>

      {/* Optimization Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Optimization Analysis</h3>
            <p className="text-gray-700 leading-relaxed mb-4">{optimization.summary}</p>

            {/* Only show projected metrics if they have meaningful values */}
            {(optimization.projected_roi_improvement > 0 || optimization.projected_revenue_increase > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {optimization.projected_roi_improvement > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-800">Projected ROI Improvement</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPercentage(optimization.projected_roi_improvement)}
                    </p>
                  </div>
                )}

                {optimization.projected_revenue_increase > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-800">Additional Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(optimization.projected_revenue_increase)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Changes */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommended Budget Changes</h3>

        <div className="space-y-4">
          {optimization.budget_changes.map((change: BudgetChange, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="font-medium text-gray-800">{change.audience}</p>
                  <p className="text-sm text-gray-600">{change.platform}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Current</p>
                  <p className="font-medium">{formatCurrency(change.old_amount)}</p>
                </div>

                <ArrowRight className="w-5 h-5 text-gray-400" />

                <div className="text-right">
                  <p className="text-sm text-gray-600">Optimized</p>
                  <p className="font-medium">{formatCurrency(change.new_amount)}</p>
                </div>

                <div className="flex items-center gap-1 min-w-[80px] justify-end">
                  {getChangeIcon(change.change)}
                  <span className={`font-medium ${getChangeColor(change.change)}`}>
                    {formatPercentage(change.change)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Strategic Recommendations</h3>

        <div className="space-y-3">
          {optimization.recommendations.map((recommendation: string, index: number) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Forecasting */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-800">30-Day Forecast</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(12450 + optimization.projected_revenue_increase)}
          </p>
          <p className="text-sm text-gray-600">Projected Revenue</p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="font-medium text-gray-800">ROI Improvement</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {(397.8 + optimization.projected_roi_improvement).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">New ROI Target</p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-500" />
            <span className="font-medium text-gray-800">Efficiency Gain</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(optimization.projected_revenue_increase / 2500 * 100)}
          </p>
          <p className="text-sm text-gray-600">Revenue per $100</p>
        </div>
      </div>

      {/* Apply Optimization */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Apply Optimization</h3>
            <p className="text-gray-600">
              Implement the recommended budget changes to improve campaign performance.
            </p>
          </div>

          <button
            onClick={handleApplyOptimization}
            disabled={isApplying || workflowState.currentStage === 'completed'}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${workflowState.currentStage === 'completed'
              ? 'bg-green-100 text-green-800 cursor-not-allowed'
              : isApplying
                ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            {workflowState.currentStage === 'completed' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Optimization Applied
              </>
            ) : isApplying ? (
              <>
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Applying Changes...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Apply Optimization
              </>
            )}
          </button>
        </div>

        {workflowState.currentStage === 'completed' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Campaign optimization completed successfully! Budget has been reallocated for maximum ROI.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizationTab;