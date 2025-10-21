/**
 * Campaign Data Context
 * Provides persistent data across all tabs
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import fileDataService, { SessionData } from '../services/fileDataService';

interface CampaignDataContextType {
  sessionData: SessionData | null;
  isLoading: boolean;
  error: string | null;
  loadSessionData: (sessionId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
  clearSessionData: () => void;  // Add clear function
}

const CampaignDataContext = createContext<CampaignDataContextType | undefined>(undefined);

interface CampaignDataProviderProps {
  children: ReactNode;
}

export const CampaignDataProvider: React.FC<CampaignDataProviderProps> = ({ children }) => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessionData = async (sessionId: string) => {
    if (!sessionId) {
      console.log('⚠️ No sessionId provided to loadSessionData');
      return;
    }

    // Prevent loading the same session data multiple times
    if (sessionData?.sessionId === sessionId && !isLoading) {
      console.log('✅ Session data already loaded for:', sessionId);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading session data for:', sessionId);
      
      // Try to load from HTTP first, fallback to hardcoded data
      let data: SessionData;
      
      try {
        data = await fileDataService.loadSessionData(sessionId);
        console.log('✅ HTTP loading successful for session:', sessionId);
      } catch (httpError) {
        console.log('⚠️ HTTP loading failed, using fallback data for session:', sessionId);
        data = await fileDataService.loadSessionDataFromFS(sessionId);
        console.log('✅ Fallback loading successful for session:', sessionId);
      }

      setSessionData(data);
      console.log('✅ Session data loaded in context:', {
        sessionId: data.sessionId,
        hasAudiences: !!data.audiences,
        hasBudget: !!data.budget,
        hasPrompts: !!data.prompts,
        hasContent: !!data.content,
        contentAdsCount: data.content?.result?.ads?.length || 0
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session data';
      setError(errorMessage);
      console.error('❌ Error loading session data for:', sessionId, error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    if (sessionData?.sessionId) {
      // Clear cache and reload
      fileDataService.clearCache(sessionData.sessionId);
      await loadSessionData(sessionData.sessionId);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const clearSessionData = () => {
    setSessionData(null);
    setError(null);
    setIsLoading(false);
  };

  const contextValue: CampaignDataContextType = {
    sessionData,
    isLoading,
    error,
    loadSessionData,
    refreshData,
    clearError,
    clearSessionData
  };

  return (
    <CampaignDataContext.Provider value={contextValue}>
      {children}
    </CampaignDataContext.Provider>
  );
};

export const useCampaignData = (): CampaignDataContextType => {
  const context = useContext(CampaignDataContext);
  if (context === undefined) {
    throw new Error('useCampaignData must be used within a CampaignDataProvider');
  }
  return context;
};