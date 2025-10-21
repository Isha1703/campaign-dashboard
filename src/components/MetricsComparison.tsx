import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, Target, Eye, MousePointer } from 'lucide-react';
import type { CalculatedMetrics } from '../types';

interface MetricsComparisonProps {
  selectedMetrics: CalculatedMetrics[];
  comparisonType: 'platform' | 'audience';
  className?: string;
}

const MetricsComparison: React.FC<MetricsComparisonProps> = ({
  selectedMetrics,
  comparisonType,
  className = ''
}) => {
  const formatValue = (value: number, metric: string) => {
    switch (metric) {
      case 'roi':
      case 'ctr':
      case 'redirect_rate':
        return `${value.toFixed(2)}%`;
      case 'revenue':
      case 'cost':
        return `$${value.toLocaleString()}`;
      default:
        return value.toLocaleString();
    }
  };

  const getMetricIcon = (metric: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'impressions': <Eye className="w-4 h-4" />,
      'clicks': <MousePointer className="w-4 h-4" />,
      'conversions': <Target className="w-4 h-4" />,
      'roi': <TrendingUp className="w-4 h-4" />
    };
    return icons[metric] || <TrendingUp className="w-4 h-4" />;
  };

  const getComparisonIcon = (value1: number, value2: number) => {
    const diff = ((value1 - value2) / value2) * 100;
    if (Math.abs(diff) < 5) return <Minus className="w-4 h-4 text-gray-500" />;
    return diff > 0 
      ? <ArrowUpRight className="w-4 h-4 text-green-500" />
      : <ArrowDownRight className="w-4 h-4 text-red-500" />;
  };

  const getComparisonColor = (value1: number, value2: number) => {
    const diff = ((value1 - value2) / value2) * 100;
    if (Math.abs(diff) < 5) return 'text-gray-600';
    return diff > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getComparisonPercentage = (value1: number, value2: number) => {
    const diff = ((value1 - value2) / value2) * 100;
    return `${Math.abs(diff).toFixed(1)}%`;
  };

  const metricKeys = ['impressions', 'clicks', 'conversions', 'revenue', 'roi', 'ctr', 'cost'];

  if (selectedMetrics.length < 2) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <h4 className="font-semibold text-gray-900 mb-4">Metrics Comparison</h4>
        <div className="text-center py-8 text-gray-500">
          Select at least 2 platforms to compare their performance
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h4 className="font-semibold text-gray-900 mb-6">
        {comparisonType === 'platform' ? 'Platform' : 'Audience'} Performance Comparison
      </h4>

      {/* Comparison Headers */}
      <div className="grid grid-cols-12 gap-4 mb-4 pb-2 border-b border-gray-200">
        <div className="col-span-3 text-sm font-medium text-gray-700">Metric</div>
        {selectedMetrics.map((metric, index) => (
          <div key={index} className="col-span-3 text-sm font-medium text-gray-700 text-center">
            {comparisonType === 'platform' ? metric.platform : metric.audience}
          </div>
        ))}
        {selectedMetrics.length === 2 && (
          <div className="col-span-3 text-sm font-medium text-gray-700 text-center">Difference</div>
        )}
      </div>

      {/* Metric Comparisons */}
      <div className="space-y-3">
        {metricKeys.map(metricKey => {
          const metric1 = selectedMetrics[0];
          const metric2 = selectedMetrics[1];
          const value1 = (metric1 as any)[metricKey] || 0;
          const value2 = metric2 ? (metric2 as any)[metricKey] || 0 : 0;

          return (
            <div key={metricKey} className="grid grid-cols-12 gap-4 items-center py-2 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="col-span-3 flex items-center space-x-2">
                {getMetricIcon(metricKey)}
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {metricKey.replace('_', ' ')}
                </span>
              </div>
              
              {selectedMetrics.map((metric, index) => {
                const value = (metric as any)[metricKey] || 0;
                const isHighest = selectedMetrics.every(m => ((m as any)[metricKey] || 0) <= value);
                
                return (
                  <div key={index} className="col-span-3 text-center">
                    <div className={`text-sm font-medium ${isHighest && selectedMetrics.length > 1 ? 'text-green-600' : 'text-gray-900'}`}>
                      {formatValue(value, metricKey)}
                    </div>
                    {isHighest && selectedMetrics.length > 1 && (
                      <div className="text-xs text-green-600 font-medium">Best</div>
                    )}
                  </div>
                );
              })}
              
              {selectedMetrics.length === 2 && (
                <div className="col-span-3 text-center">
                  <div className={`flex items-center justify-center space-x-1 ${getComparisonColor(value1, value2)}`}>
                    {getComparisonIcon(value1, value2)}
                    <span className="text-sm font-medium">
                      {getComparisonPercentage(value1, value2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Insights */}
      {selectedMetrics.length === 2 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h5 className="font-medium text-gray-900 mb-3">Comparison Insights</h5>
          <div className="space-y-2">
            {(() => {
              const metric1 = selectedMetrics[0];
              const metric2 = selectedMetrics[1];
              const roiDiff = ((metric1.roi - metric2.roi) / metric2.roi) * 100;
              const revenueDiff = ((metric1.revenue - metric2.revenue) / metric2.revenue) * 100;
              const costDiff = ((metric1.cost - metric2.cost) / metric2.cost) * 100;
              
              const insights = [];
              
              if (Math.abs(roiDiff) > 10) {
                const winner = roiDiff > 0 ? metric1.platform : metric2.platform;
                insights.push(
                  <div key="roi" className="text-sm text-gray-700">
                    <strong>{winner}</strong> has {Math.abs(roiDiff).toFixed(1)}% {roiDiff > 0 ? 'higher' : 'lower'} ROI
                  </div>
                );
              }
              
              if (Math.abs(revenueDiff) > 15) {
                const winner = revenueDiff > 0 ? metric1.platform : metric2.platform;
                insights.push(
                  <div key="revenue" className="text-sm text-gray-700">
                    <strong>{winner}</strong> generates {Math.abs(revenueDiff).toFixed(1)}% more revenue
                  </div>
                );
              }
              
              if (Math.abs(costDiff) > 20) {
                const winner = costDiff < 0 ? metric1.platform : metric2.platform;
                insights.push(
                  <div key="cost" className="text-sm text-gray-700">
                    <strong>{winner}</strong> is {Math.abs(costDiff).toFixed(1)}% more cost-effective
                  </div>
                );
              }
              
              return insights.length > 0 ? insights : (
                <div className="text-sm text-gray-600">
                  Both platforms show similar performance levels across key metrics
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsComparison;