import React from 'react';
import { Info } from 'lucide-react';

interface DemoModeIndicatorProps {
  isVisible: boolean;
  onDismiss?: () => void;
}

const DemoModeIndicator: React.FC<DemoModeIndicatorProps> = ({ isVisible, onDismiss }) => {
  if (!isVisible) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-blue-700">
            <strong>Demo Mode:</strong> Backend server not available. The dashboard is running with sample data to demonstrate the user interface and error handling features.
          </p>
          <p className="text-xs text-blue-600 mt-1">
            To connect to a live backend, start the Python server with: <code className="bg-blue-100 px-1 rounded">python market_campaign.py</code>
          </p>
        </div>
        {onDismiss && (
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="text-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Dismiss demo mode notice"
            >
              <span className="sr-only">Dismiss</span>
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoModeIndicator;