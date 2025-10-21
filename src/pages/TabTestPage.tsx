/**
 * Tab Test Page - Standalone page for testing all tabs
 * Access this at /test-tabs to see how each tab displays data
 */

import React from 'react';
import TabTester from '../components/TabTester';

const TabTestPage: React.FC = () => {
  // Use the latest session ID from your logs
  const latestSessionId = 'session-1760932638';

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Marketing Campaign Dashboard - Tab Testing</h1>
          <p className="text-gray-600 mt-2">
            Testing individual tab functionality with real agent data
          </p>
        </div>
      </div>
      
      <div className="py-6">
        <TabTester sessionId={latestSessionId} />
      </div>
      
      <div className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="text-sm text-gray-500">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Click on any tab card to view its data in detail</li>
              <li>Use the "Export" button to download tab data as JSON</li>
              <li>Use "Refresh Tests" to reload data from the backend</li>
              <li>Green = Success, Yellow = No Data, Red = Error</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabTestPage;