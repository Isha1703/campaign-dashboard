import React from 'react';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';
import type { CalculatedMetrics } from '../types';

interface PerformanceChartProps {
  metrics: CalculatedMetrics[];
  chartType: 'bar' | 'pie' | 'line';
  selectedMetric: string;
  className?: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  metrics,
  chartType,
  selectedMetric,
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

  const getMetricValue = (metric: CalculatedMetrics, key: string): number => {
    return (metric as any)[key] || 0;
  };

  const maxValue = Math.max(...metrics.map(m => getMetricValue(m, selectedMetric)));
  const minValue = Math.min(...metrics.map(m => getMetricValue(m, selectedMetric)));

  const getBarHeight = (value: number) => {
    if (maxValue === minValue) return 50;
    return ((value - minValue) / (maxValue - minValue)) * 80 + 20;
  };

  const getColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-indigo-500'
    ];
    return colors[index % colors.length];
  };

  const getBorderColor = (index: number) => {
    const colors = [
      'border-blue-500',
      'border-green-500', 
      'border-purple-500',
      'border-yellow-500',
      'border-red-500',
      'border-indigo-500'
    ];
    return colors[index % colors.length];
  };

  if (chartType === 'bar') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold text-gray-900 capitalize">
            {selectedMetric.replace('_', ' ')} by Platform
          </h4>
        </div>
        
        <div className="flex items-end justify-between space-x-2 h-64">
          {metrics.map((metric, index) => {
            const value = getMetricValue(metric, selectedMetric);
            const height = getBarHeight(value);
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="flex-1 flex items-end justify-center w-full">
                  <div
                    className={`w-full max-w-16 ${getColor(index)} rounded-t-md transition-all duration-300 hover:opacity-80 relative group`}
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatValue(value, selectedMetric)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600 text-center font-medium">
                  {metric.platform}
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {formatValue(value, selectedMetric)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (chartType === 'pie') {
    const total = metrics.reduce((sum, m) => sum + getMetricValue(m, selectedMetric), 0);
    let currentAngle = 0;
    
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <PieChart className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold text-gray-900 capitalize">
            {selectedMetric.replace('_', ' ')} Distribution
          </h4>
        </div>
        
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {metrics.map((metric, index) => {
                const value = getMetricValue(metric, selectedMetric);
                const percentage = (value / total) * 100;
                const angle = (percentage / 100) * 360;
                
                const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                const x2 = 50 + 40 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
                const y2 = 50 + 40 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
                
                const largeArcFlag = angle > 180 ? 1 : 0;
                const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                
                const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6366F1'];
                const color = colors[index % colors.length];
                
                currentAngle += angle;
                
                return (
                  <path
                    key={index}
                    d={pathData}
                    fill={color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    title={`${metric.platform}: ${formatValue(value, selectedMetric)}`}
                  />
                );
              })}
            </svg>
          </div>
          
          <div className="ml-6 space-y-2">
            {metrics.map((metric, index) => {
              const value = getMetricValue(metric, selectedMetric);
              const percentage = ((value / total) * 100).toFixed(1);
              
              return (
                <div key={index} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getColor(index)}`}></div>
                  <span className="text-sm text-gray-700">{metric.platform}</span>
                  <span className="text-sm text-gray-500">
                    {percentage}% ({formatValue(value, selectedMetric)})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Line chart (simplified version)
  if (chartType === 'line') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold text-gray-900 capitalize">
            {selectedMetric.replace('_', ' ')} Trend
          </h4>
        </div>
        
        <div className="relative h-64">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="0"
                y1={i * 40}
                x2="400"
                y2={i * 40}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            ))}
            
            {/* Data line */}
            <polyline
              points={metrics.map((metric, index) => {
                const x = (index / (metrics.length - 1)) * 380 + 10;
                const value = getMetricValue(metric, selectedMetric);
                const y = 180 - (getBarHeight(value) / 100) * 160;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="3"
              className="drop-shadow-sm"
            />
            
            {/* Data points */}
            {metrics.map((metric, index) => {
              const x = (index / (metrics.length - 1)) * 380 + 10;
              const value = getMetricValue(metric, selectedMetric);
              const y = 180 - (getBarHeight(value) / 100) * 160;
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#3B82F6"
                  className="hover:r-6 transition-all cursor-pointer"
                  title={`${metric.platform}: ${formatValue(value, selectedMetric)}`}
                />
              );
            })}
          </svg>
          
          {/* Platform labels */}
          <div className="flex justify-between mt-2">
            {metrics.map((metric, index) => (
              <div key={index} className="text-xs text-gray-600 text-center">
                {metric.platform}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PerformanceChart;