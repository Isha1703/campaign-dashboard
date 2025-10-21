import React, { useState, useEffect } from 'react'
import ProfessionalDashboard from './components/ProfessionalDashboard'
import ApiTestDemo from './components/ApiTestDemo'
import TabTestPage from './pages/TabTestPage'
import AutoUpdatingTabs from './components/AutoUpdatingTabs'
import ErrorBoundary from './components/ErrorBoundary'
import { ErrorProvider } from './contexts/ErrorContext'
import { NotificationManager, useNotifications } from './components/ErrorNotification'
import { useAccessibility, useSkipLinks } from './hooks/useAccessibility'

function AppContent() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'apitest' | 'tabtest' | 'autoupdate'>('dashboard');
  const notifications = useNotifications();
  const { announce, preferences } = useAccessibility();
  const { SkipLinks } = useSkipLinks();

  // Check URL for different views
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('auto-update')) {
      setCurrentView('autoupdate');
    } else if (path.includes('test-tabs')) {
      setCurrentView('tabtest');
    } else if (path.includes('api-test')) {
      setCurrentView('apitest');
    } else {
      setCurrentView('dashboard');
    }
  }, []);

  // Announce app initialization
  useEffect(() => {
    announce('Campaign Dashboard application loaded', 'polite', 1000);
  }, [announce]);

  // Handle view switching announcements
  const handleViewToggle = () => {
    let newView: 'dashboard' | 'apitest' | 'tabtest' | 'autoupdate';
    if (currentView === 'dashboard') {
      newView = 'autoupdate';
    } else if (currentView === 'autoupdate') {
      newView = 'apitest';
    } else if (currentView === 'apitest') {
      newView = 'tabtest';
    } else {
      newView = 'dashboard';
    }
    
    setCurrentView(newView);
    
    // Update URL
    const newPath = newView === 'autoupdate' ? '/auto-update' : 
                   newView === 'tabtest' ? '/test-tabs' : 
                   newView === 'apitest' ? '/api-test' : '/';
    window.history.pushState({}, '', newPath);
    
    announce(
      `Switched to ${newView === 'autoupdate' ? 'Auto-Update Dashboard' : 
                     newView === 'tabtest' ? 'Tab Test' : 
                     newView === 'apitest' ? 'API Test' : 'Campaign Dashboard'} view`,
      'polite'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Links for keyboard navigation */}
      <SkipLinks />
      
      {/* Toggle button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleViewToggle}
          className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-label={`Switch to ${currentView === 'dashboard' ? 'Auto-Update' : 
                                        currentView === 'autoupdate' ? 'API Test' : 
                                        currentView === 'apitest' ? 'Tab Test' : 'Dashboard'}`}
        >
          {currentView === 'dashboard' ? 'Auto-Update' : 
           currentView === 'autoupdate' ? 'API Test' : 
           currentView === 'apitest' ? 'Tab Test' : 'Dashboard'}
        </button>
      </div>

      {/* Main content area */}
      <main id="main-content" className="focus:outline-none" tabIndex={-1}>
        {currentView === 'autoupdate' ? (
          <AutoUpdatingTabs sessionId="session-1760934452" />
        ) : currentView === 'tabtest' ? (
          <TabTestPage />
        ) : currentView === 'apitest' ? (
          <ApiTestDemo />
        ) : (
          <ProfessionalDashboard />
        )}
      </main>
      
      {/* Global notification system */}
      <NotificationManager
        notifications={notifications.notifications}
        onDismiss={notifications.removeNotification}
        maxNotifications={5}
      />

      {/* Live region for announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="live-region"
      />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Global error boundary caught error:', error, errorInfo);
        // In production, you would send this to your error tracking service
      }}
    >
      <ErrorProvider>
        <AppContent />
      </ErrorProvider>
    </ErrorBoundary>
  )
}

export default App