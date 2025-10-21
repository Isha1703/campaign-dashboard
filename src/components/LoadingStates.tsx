import React from 'react';
import { Loader2, Download, Play, Image, FileText, BarChart3, TrendingUp, Users } from 'lucide-react';

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'red' | 'gray' | 'white';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'blue',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`} 
    />
  );
};

// Progress Bar Component
interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  color = 'blue',
  size = 'md',
  className = ''
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-gray-500">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

// Skeleton Screen Components
export const SkeletonText: React.FC<{ 
  lines?: number; 
  className?: string;
  animate?: boolean;
}> = ({ 
  lines = 1, 
  className = '',
  animate = true 
}) => (
  <div className={className}>
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={`bg-gray-200 rounded h-4 mb-2 last:mb-0 ${
          animate ? 'animate-pulse' : ''
        }`}
        style={{
          width: index === lines - 1 ? '75%' : '100%'
        }}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ 
  className?: string;
  animate?: boolean;
}> = ({ 
  className = '',
  animate = true 
}) => (
  <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
    <div className={`bg-gray-200 rounded h-6 w-3/4 mb-4 ${animate ? 'animate-pulse' : ''}`} />
    <div className={`bg-gray-200 rounded h-4 w-full mb-2 ${animate ? 'animate-pulse' : ''}`} />
    <div className={`bg-gray-200 rounded h-4 w-5/6 mb-2 ${animate ? 'animate-pulse' : ''}`} />
    <div className={`bg-gray-200 rounded h-4 w-2/3 ${animate ? 'animate-pulse' : ''}`} />
  </div>
);

export const SkeletonTable: React.FC<{ 
  rows?: number;
  columns?: number;
  className?: string;
  animate?: boolean;
}> = ({ 
  rows = 3, 
  columns = 4,
  className = '',
  animate = true 
}) => (
  <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
    {/* Header */}
    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={index}
            className={`bg-gray-300 rounded h-4 flex-1 ${animate ? 'animate-pulse' : ''}`}
          />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="px-6 py-4 border-b border-gray-200 last:border-b-0">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={`bg-gray-200 rounded h-4 flex-1 ${animate ? 'animate-pulse' : ''}`}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Specialized Loading States
interface MediaLoadingProps {
  mediaType: 'image' | 'video';
  message?: string;
  progress?: number;
  className?: string;
}

export const MediaLoading: React.FC<MediaLoadingProps> = ({
  mediaType,
  message,
  progress,
  className = ''
}) => {
  const Icon = mediaType === 'video' ? Play : Image;
  const defaultMessage = `Retrieving the ${mediaType}...`;

  return (
    <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
      <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <Icon className="w-8 h-8 text-blue-600" />
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <LoadingSpinner size="sm" className="mr-2" />
          <span className="text-sm font-medium text-gray-700">
            {message || defaultMessage}
          </span>
        </div>
        
        {typeof progress === 'number' && (
          <ProgressBar 
            progress={progress} 
            size="sm" 
            className="w-32"
            showPercentage={false}
          />
        )}
      </div>
    </div>
  );
};

interface AgentLoadingProps {
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  className?: string;
}

export const AgentLoading: React.FC<AgentLoadingProps> = ({
  agentName,
  status,
  progress,
  className = ''
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'blue';
      case 'completed': return 'green';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = () => {
    switch (agentName.toLowerCase()) {
      case 'audienceagent':
        return Users;
      case 'budgetagent':
        return TrendingUp;
      case 'contentgenerationagent':
        return FileText;
      case 'analyticsagent':
        return BarChart3;
      default:
        return Loader2;
    }
  };

  const StatusIcon = getStatusIcon();
  const color = getStatusColor();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
            status === 'running' ? 'bg-blue-100' :
            status === 'completed' ? 'bg-green-100' :
            status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            {status === 'running' ? (
              <LoadingSpinner size="sm" color={color} />
            ) : (
              <StatusIcon className={`w-4 h-4 ${
                status === 'completed' ? 'text-green-600' :
                status === 'failed' ? 'text-red-600' : 'text-gray-600'
              }`} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">{agentName}</h3>
            <p className="text-xs text-gray-500 capitalize">{status}</p>
          </div>
        </div>
        
        {status === 'completed' && (
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        )}
        {status === 'failed' && (
          <div className="w-2 h-2 bg-red-500 rounded-full" />
        )}
      </div>
      
      {typeof progress === 'number' && status === 'running' && (
        <ProgressBar 
          progress={progress} 
          size="sm" 
          color={color}
          showPercentage={false}
        />
      )}
    </div>
  );
};

// Full Page Loading
interface FullPageLoadingProps {
  message?: string;
  submessage?: string;
  progress?: number;
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({
  message = 'Loading...',
  submessage,
  progress
}) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="xl" className="mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{message}</h2>
      {submessage && (
        <p className="text-gray-600 mb-4">{submessage}</p>
      )}
      {typeof progress === 'number' && (
        <ProgressBar 
          progress={progress} 
          className="w-64 mx-auto"
          showPercentage={true}
        />
      )}
    </div>
  </div>
);

// Button Loading State
interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && <LoadingSpinner size="sm" color="white" className="mr-2" />}
      {children}
    </button>
  );
};

export default {
  LoadingSpinner,
  ProgressBar,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  MediaLoading,
  AgentLoading,
  FullPageLoading,
  LoadingButton
};