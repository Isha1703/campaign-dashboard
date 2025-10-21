/**
 * Hook for reading agent data directly from static JSON files
 * No backend API dependency required
 */

import { useState, useEffect } from 'react';

interface UseFileBasedDataResult {
  data: any;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useFileBasedData(sessionId: string | null, agentName: string): UseFileBasedDataResult {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!sessionId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const filename = `${agentName.toLowerCase()}_result.json`;
      const url = `/agent_outputs/${sessionId}/${filename}`;
      
      console.log(`Loading ${agentName} data from: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`${agentName} data not found - agent not completed yet`);
          setData(null);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } else {
        const jsonData = await response.json();
        console.log(`✅ Loaded ${agentName} data:`, jsonData);
        setData(jsonData.result || jsonData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Error loading ${agentName} data:`, errorMessage);
      setError(errorMessage);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load when sessionId or agentName changes
  useEffect(() => {
    loadData();
  }, [sessionId, agentName]);

  return {
    data,
    isLoading,
    error,
    refresh: loadData
  };
}

export function useAllAgentsData(sessionId: string | null) {
  const audienceData = useFileBasedData(sessionId, 'AudienceAgent');
  const budgetData = useFileBasedData(sessionId, 'BudgetAgent');
  const promptData = useFileBasedData(sessionId, 'PromptAgent');
  const contentData = useFileBasedData(sessionId, 'ContentGenerationAgent');

  const isLoading = audienceData.isLoading || budgetData.isLoading || promptData.isLoading || contentData.isLoading;
  const hasError = audienceData.error || budgetData.error || promptData.error || contentData.error;

  const refreshAll = () => {
    audienceData.refresh();
    budgetData.refresh();
    promptData.refresh();
    contentData.refresh();
  };

  return {
    audiences: audienceData.data,
    budget: budgetData.data,
    prompts: promptData.data,
    content: contentData.data,
    isLoading,
    error: hasError,
    refresh: refreshAll
  };
}