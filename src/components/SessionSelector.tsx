/**
 * Session Selector Component
 * Allows users to select from available sessions
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, Database, RefreshCw } from 'lucide-react';
import { useCampaignData } from '../contexts/CampaignDataContext';
import sessionDetectionService, { SessionInfo } from '../services/sessionDetectionService';

interface SessionSelectorProps {
  currentSessionId: string | null;
  onSessionChange: (sessionId: string) => void;
}

const SessionSelector: React.FC<SessionSelectorProps> = ({
  currentSessionId,
  onSessionChange
}) => {
  const { loadSessionData, isLoading } = useCampaignData();
  const [isOpen, setIsOpen] = useState(false);
  const [availableSessions, setAvailableSessions] = useState<SessionInfo[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Load available sessions on component mount
  useEffect(() => {
    loadAvailableSessions();
  }, []);

  const loadAvailableSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const sessions = await sessionDetectionService.getAvailableSessions();
      
      // Detect campaign types for better display names
      const sessionsWithTypes = await Promise.all(
        sessions.map(async (session) => {
          if (session.sessionId !== 'session-workflow-test') {
            const campaignType = await sessionDetectionService.detectCampaignType(session.sessionId);
            return {
              ...session,
              displayName: session.status === 'latest' ? `${campaignType} (Latest)` : campaignType
            };
          }
          return session;
        })
      );
      
      setAvailableSessions(sessionsWithTypes);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleSessionSelect = async (sessionId: string) => {
    setIsOpen(false);
    onSessionChange(sessionId);
    await loadSessionData(sessionId);
  };

  const handleRefresh = async () => {
    sessionDetectionService.clearCache();
    await loadAvailableSessions();
  };

  const formatSessionId = (session: SessionInfo) => {
    return session.displayName;
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'latest':
        return { color: 'text-purple-600', bg: 'bg-purple-50' };
      case 'recent':
        return { color: 'text-orange-600', bg: 'bg-orange-50' };
      case 'demo':
        return { color: 'text-green-600', bg: 'bg-green-50' };
      default:
        return { color: 'text-blue-600', bg: 'bg-blue-50' };
    }
  };

  const currentSession = availableSessions.find(s => s.sessionId === currentSessionId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || isLoadingSessions}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 min-w-[250px]"
      >
        <Database className="w-4 h-4 text-gray-500" />
        <span className="flex-1 text-left text-sm">
          {currentSession ? formatSessionId(currentSession) : 'Select Session'}
        </span>
        {(isLoading || isLoadingSessions) ? (
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <div className="text-xs font-medium text-gray-500">Available Sessions</div>
              <button
                onClick={handleRefresh}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
            {availableSessions.map((session) => {
              const statusColor = getSessionStatusColor(session.status);
              const isSelected = session.sessionId === currentSessionId;
              
              return (
                <button
                  key={session.sessionId}
                  onClick={() => handleSessionSelect(session.sessionId)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 flex items-center justify-between ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{formatSessionId(session)}</div>
                    <div className="text-xs text-gray-500 truncate">{session.sessionId}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(session.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1 ml-2">
                    <div className={`px-2 py-1 rounded-full text-xs ${statusColor.bg} ${statusColor.color}`}>
                      {session.status}
                    </div>
                    {session.hasContent && (
                      <div className="text-xs text-green-600">✓ Content</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SessionSelector;