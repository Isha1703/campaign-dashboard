import React, { useState } from 'react';
import { PieChart, BarChart3, TrendingUp, Download } from 'lucide-react';
import type { BudgetAllocation } from '../types';

interface BudgetDistributionChartProps {
  budgetData: BudgetAllocation;
  onExport?: () => void;
}

const BudgetDistributionChart: React.FC<BudgetDistributionChartProps> = ({
  budgetData,
  onExport
}) => {
  const [viewMode, setViewMode] = useState<'pie' | 'bar'>('pie');
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);

  // Calculate platform totals across all audiences
  const platformTotals = budgetData.allocations.reduce((acc, allocation) => {
    allocation.platforms.forEach(platform => {
      if (!acc[platform.platform]) {
        acc[platform.platform] = { amount: 0, percentage: 0 };
      }
      acc[platform.platform].amount += platform.amount;
    });
    return acc;
  }, {} as Record<string, { amount: number; percentage: number }>);

  // Calculate percentages for platform totals
  Object.keys(platformTotals).forEach(platform => {
    platformTotals[platform].percentage = (platformTotals[platform].amount / budgetData.total_budget) * 100;
  });

  const getPlatformColor = (platform: string, opacity: number = 1) => {
    const colors: Record<string, string> = {
      'Instagram': `rgba(225, 29, 72, ${opacity})`, // Pink
      'LinkedIn': `rgba(37, 99, 235, ${opacity})`, // Blue
      'Facebook': `rgba(29, 78, 216, ${opacity})`, // Dark Blue
      'TikTok': `rgba(0, 0, 0, ${opacity})`, // Black
      'Twitter': `rgba(59, 130, 246, ${opacity})`, // Light Blue
      'YouTube': `rgba(239, 68, 68, ${opacity})` // Red
    };
    return colors[platform] || `rgba(107, 114, 128, ${opacity})`;
  };

  // Create SVG pie chart
  const createPieChart = () => {
    const platforms = Object.entries(platformTotals);
    const total = budgetData.total_budget;
    let currentAngle = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    return (
      <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
        {platforms.map(([platform, data], index) => {
          const percentage = data.percentage;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
          const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
          const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
          const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          return (
            <path
              key={platform}
              d={pathData}
              fill={getPlatformColor(platform, 0.8)}
              stroke="white"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity cursor-pointer"
              onClick={() => setSelectedAudience(selectedAudience === platform ? null : platform)}
            />
          );
        })}
        
        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r="30"
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          className="text-xs font-semibold fill-gray-700"
        >
          Total
        </text>
        <text
          x={centerX}
          y={centerY + 8}
          textAnchor="middle"
          className="text-xs font-bold fill-gray-900"
        >
          ${(total / 1000).toFixed(1)}K
        </text>
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-900">Budget Distribution Visualization</h4>
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('pie')}
              className={`p-2 rounded ${viewMode === 'pie' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600'}`}
            >
              <PieChart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('bar')}
              className={`p-2 rounded ${viewMode === 'bar' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600'}`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
              title="Export chart data"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Visualization */}
        <div className="flex flex-col items-center">
          {viewMode === 'pie' ? (
            <div className="relative">
              {createPieChart()}
              {selectedAudience && (
                <div className="absolute top-0 right-0 bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                  <div className="text-sm font-medium text-gray-900">{selectedAudience}</div>
                  <div className="text-lg font-bold text-primary-600">
                    ${platformTotals[selectedAudience].amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {platformTotals[selectedAudience].percentage.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full space-y-3">
              {Object.entries(platformTotals).map(([platform, data]) => (
                <div key={platform} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{platform}</span>
                    <span className="text-gray-900">${data.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="h-4 rounded-full transition-all duration-500"
                      style={{
                        width: `${data.percentage}%`,
                        backgroundColor: getPlatformColor(platform)
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {data.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform Legend and Details */}
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Platform Breakdown</h5>
          {Object.entries(platformTotals).map(([platform, data]) => (
            <div
              key={platform}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                selectedAudience === platform
                  ? 'border-primary-200 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedAudience(selectedAudience === platform ? null : platform)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getPlatformColor(platform) }}
                  />
                  <span className="font-medium text-gray-900">{platform}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">${data.amount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{data.percentage.toFixed(1)}%</div>
                </div>
              </div>
              
              {/* Show audience breakdown for selected platform */}
              {selectedAudience === platform && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-600 mb-2">Audience Breakdown:</div>
                  {budgetData.allocations
                    .filter(alloc => alloc.platforms.some(p => p.platform === platform))
                    .map(allocation => {
                      const platformData = allocation.platforms.find(p => p.platform === platform);
                      return platformData ? (
                        <div key={allocation.audience} className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{allocation.audience}</span>
                          <span>${platformData.amount.toLocaleString()}</span>
                        </div>
                      ) : null;
                    })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {Object.keys(platformTotals).length}
            </div>
            <div className="text-sm text-gray-600">Platforms</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {budgetData.allocations.length}
            </div>
            <div className="text-sm text-gray-600">Audiences</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              ${Math.max(...Object.values(platformTotals).map(p => p.amount)).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Highest Platform</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              ${(budgetData.total_budget / Object.keys(platformTotals).length).toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Avg per Platform</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetDistributionChart;