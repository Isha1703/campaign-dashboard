import React, { useState, useEffect } from 'react';
import { Home, Monitor, Users, FileText, BarChart3, TrendingUp } from 'lucide-react';
import NavigationHeader from './NavigationHeader';
import WorkflowGuide from './WorkflowGuide';
import HomeTab from './tabs/HomeTab';
import FileBasedMonitoringTab from './FileBasedMonitoringTab';
import AudienceTab from './tabs/AudienceTab';
import ContentTab from './tabs/ContentTab';
// import ContentGenerationTab from './tabs/ContentGenerationTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import OptimizationTab from './tabs/OptimizationTab';
import campaignWorkflowService from '../services/campaignWorkflowService';
import DemoModeIndicator from './DemoModeIndicator';
import ApiService from '../services/api';
import { CampaignDataProvider, useCampaignData } from '../contexts/CampaignDataContext';
import SessionSelector from './SessionSelector';
import sessionDetectionService from '../services/sessionDetectionService';
// import { pollingService } from '../services/polling';

import type {
  ProfessionalDashboardState,
  CampaignData,
  TabAccessibility,
  NavigationGuidance,
  CampaignStartRequest
} from '../types';

const TABS = [
  { id: 'home', label: 'Home', icon: Home, description: 'Campaign Setup' },
  { id: 'monitoring', label: 'Monitoring', icon: Monitor, description: 'Real-time Agent Tracking' },
  { id: 'audience', label: 'Audience', icon: Users, description: 'Demographics & Budget' },
  { id: 'content', label: 'Content', icon: FileText, description: 'Ad Review & Approval' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Performance Metrics' },
  { id: 'optimization', label: 'Optimization', icon: TrendingUp, description: 'Budget Optimization' }
];

const ProfessionalDashboardContent: React.FC = () => {
  const { sessionData, loadSessionData, clearSessionData, isLoading: dataLoading, error: dataError } = useCampaignData();

  const [state, setState] = useState<ProfessionalDashboardState>({
    sessionId: null,
    currentTab: 'home',
    workflowStage: 'setup',
    campaignProgress: 0,  // Always start at 0%
    tabAccessibility: {
      home: true,
      monitoring: false,  // Unlock when campaign starts
      audience: false,    // Unlock when audience agent completes
      content: false,     // Unlock when content generation completes
      analytics: false,   // Unlock when content is approved
      optimization: false // Unlock when analytics completes
    },
    navigationGuidance: {
      nextRecommendedTab: 'home',
      currentStageMessage: 'Start by setting up your campaign parameters',
      progressPercentage: 0,
      completedStages: []
    },
    campaignData: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update navigation guidance based on session data (clean, no loops)
  useEffect(() => {
    if (sessionData) {
      console.log('📊 Session data received:', {
        sessionId: sessionData.sessionId,
        hasAudiences: !!sessionData.audiences,
        hasBudget: !!sessionData.budget,
        hasPrompts: !!sessionData.prompts,
        hasContent: !!sessionData.content,
        contentAdsCount: sessionData.content?.result?.ads?.length || 0
      });

      // Update tab accessibility based on available data
      const newTabAccessibility = {
        home: true,
        monitoring: true,
        audience: !!sessionData.audiences,
        content: !!sessionData.content,
        analytics: !!(sessionData as any).analytics || !!sessionData.content,
        optimization: !!(sessionData as any).optimization || !!(sessionData as any).analytics
      };

      // Only update if accessibility actually changed
      if (JSON.stringify(newTabAccessibility) !== JSON.stringify(state.tabAccessibility)) {
        console.log('🔄 Updating tab accessibility:', newTabAccessibility);
        setState(prev => ({
          ...prev,
          tabAccessibility: newTabAccessibility
        }));
        
        // Auto-switch to content tab when content becomes available
        if (sessionData.content && !state.tabAccessibility.content && state.currentTab !== 'content') {
          console.log('🎯 Content generated! Auto-switching to Content tab');
          setTimeout(() => {
            setState(prev => ({ ...prev, currentTab: 'content' }));
          }, 1000);
        }
      }
    }
  }, [sessionData?.sessionId, !!sessionData?.audiences, !!sessionData?.content]); // Use boolean flags to prevent loops
  const [showDemoMode, setShowDemoMode] = useState(false);
  const [, setBackendAvailable] = useState<boolean | null>(null);

  // Health check on component mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        await ApiService.healthCheck();
        console.log('Backend connection established');
        setBackendAvailable(true);
        setShowDemoMode(false);

        // Always load the latest session data on startup
        console.log('🔄 Dashboard startup - detecting latest session...');

        // Dashboard startup - no default session loading
        // User must start a new campaign to see data
      } catch (error) {
        console.warn('Backend not available, running in demo mode');
        setBackendAvailable(false);
        setShowDemoMode(true);

        // Load latest session data when backend is not available
        console.log('🔄 Demo mode - detecting latest session...');

        // Demo mode - no default session loading
        // User must start a new campaign to see data
      }
    };

    checkBackendHealth();

    // Disable periodic session refresh to prevent switching away from forced session
    // const sessionRefreshInterval = setInterval(async () => {
    //   try {
    //     const latestSessionId = await sessionDetectionService.getLatestSessionId();
    //     if (latestSessionId !== state.sessionId) {
    //       console.log('🔄 New session detected, switching to:', latestSessionId);
    //       setState(prev => ({ ...prev, sessionId: latestSessionId }));
    //       await loadSessionData(latestSessionId);
    //     }
    //   } catch (error) {
    //     console.warn('Session refresh failed:', error);
    //   }
    // }, 10000); // Check every 10 seconds

    // return () => {
    //   clearInterval(sessionRefreshInterval);
    // };
  }, [state.sessionId]); // Removed loadSessionData to prevent loop

  // Load session data when sessionId changes (simplified - no polling loop)
  useEffect(() => {
    if (state.sessionId && state.sessionId !== sessionData?.sessionId) {
      // Loading session data (removed excessive logging)
      loadSessionData(state.sessionId);
    }
  }, [state.sessionId, sessionData?.sessionId]); // Removed loadSessionData to prevent loop

  // Update navigation guidance based on workflow stage and session data
  useEffect(() => {
    updateNavigationGuidance();
  }, [state.workflowStage, state.campaignProgress]); // Removed sessionData to prevent loop

  // Monitor session data changes to update workflow stage
  useEffect(() => {
    if (sessionData && state.sessionId) {
      // Session data updated - check for step-by-step progress

      // Step-by-step progress based on agent completion
      let newProgress = state.campaignProgress;
      let newStage = state.workflowStage;
      let newTabAccessibility = { ...state.tabAccessibility };
      let newGuidance = state.navigationGuidance;

      // Step 1: Audience Agent completed (25%)
      if (sessionData.audiences?.result && newProgress < 25) {
        newProgress = 25;
        newStage = 'reviewing';
        newTabAccessibility.audience = true;
        newGuidance = {
          nextRecommendedTab: 'audience',
          currentStageMessage: 'Audience analysis complete! Review demographics.',
          progressPercentage: 25,
          completedStages: ['setup', 'audience']
        };
      }

      // Step 2: Budget Agent completed (40%)
      if (sessionData.budget?.result && newProgress < 40) {
        newProgress = 40;
        newGuidance = {
          nextRecommendedTab: 'audience',
          currentStageMessage: 'Budget allocation complete! Review budget breakdown.',
          progressPercentage: 40,
          completedStages: ['setup', 'audience', 'budget']
        };
      }

      // Step 3: Prompt Agent completed (55%)
      if (sessionData.prompts?.result && newProgress < 55) {
        newProgress = 55;
        newGuidance = {
          nextRecommendedTab: 'audience',
          currentStageMessage: 'Ad prompts generated! Content generation starting...',
          progressPercentage: 55,
          completedStages: ['setup', 'audience', 'budget', 'prompts']
        };
      }

      // Step 4: Content Generation completed (75%)
      if (sessionData.content?.result?.ads && newProgress < 75) {
        newProgress = 75;
        newStage = 'approving';
        newTabAccessibility.content = true;
        newGuidance = {
          nextRecommendedTab: 'content',
          currentStageMessage: 'Content generated! Review and approve each ad.',
          progressPercentage: 75,
          completedStages: ['setup', 'audience', 'budget', 'prompts', 'content']
        };
      }

      // Update state if anything changed
      if (newProgress !== state.campaignProgress ||
        newStage !== state.workflowStage ||
        JSON.stringify(newTabAccessibility) !== JSON.stringify(state.tabAccessibility)) {
        setState(prev => ({
          ...prev,
          workflowStage: newStage,
          campaignProgress: newProgress,
          tabAccessibility: newTabAccessibility,
          navigationGuidance: newGuidance
        }));
      }

      // Check if analytics data is available
      if ((sessionData as any).analytics?.result && state.workflowStage !== 'analyzing' && state.workflowStage !== 'optimizing') {
        setState(prev => ({
          ...prev,
          workflowStage: 'analyzing',
          campaignProgress: 90,
          navigationGuidance: {
            nextRecommendedTab: 'analytics',
            currentStageMessage: 'Analytics complete! Review performance data.',
            progressPercentage: 90,
            completedStages: ['setup', 'executing', 'reviewing', 'approving']
          }
        }));
      }

      // Check if optimization data is available
      if ((sessionData as any).optimization?.result && state.workflowStage !== 'optimizing') {
        setState(prev => ({
          ...prev,
          workflowStage: 'optimizing',
          campaignProgress: 100,
          navigationGuidance: {
            nextRecommendedTab: 'optimization',
            currentStageMessage: 'Campaign complete! Review optimization recommendations.',
            progressPercentage: 100,
            completedStages: ['setup', 'executing', 'reviewing', 'approving', 'analyzing']
          }
        }));
      }
    }
  }, [sessionData, state.sessionId]); // Removed state.workflowStage to prevent loop

  // Ensure all tabs remain unlocked
  useEffect(() => {
    setState(prev => ({
      ...prev,
      tabAccessibility: {
        home: true,
        monitoring: true,
        audience: true,
        content: true,
        analytics: true,
        optimization: true
      }
    }));
  }, []);

  const updateNavigationGuidance = () => {
    let guidance: NavigationGuidance;

    switch (state.workflowStage) {
      case 'setup':
        guidance = {
          nextRecommendedTab: 'home',
          currentStageMessage: 'Start Campaign → AudienceAgent → BudgetAgent → PromptAgent → ContentGenerationAgent',
          progressPercentage: 0,
          completedStages: []
        };
        break;
      case 'executing':
        guidance = {
          nextRecommendedTab: 'monitoring',
          currentStageMessage: 'Agents Running: AudienceAgent → BudgetAgent → PromptAgent → ContentGenerationAgent (with MCP tools)',
          progressPercentage: 25,
          completedStages: ['setup']
        };
        break;
      case 'reviewing':
        guidance = {
          nextRecommendedTab: 'audience',
          currentStageMessage: 'Agent Results Ready: Review audience analysis and budget allocation',
          progressPercentage: 50,
          completedStages: ['setup', 'executing']
        };
        break;
      case 'approving':
        guidance = {
          nextRecommendedTab: 'content',
          currentStageMessage: 'Content Generated: Approve/Revise ads → Analytics → Optimization',
          progressPercentage: 75,
          completedStages: ['setup', 'executing', 'reviewing']
        };
        break;
      case 'analyzing':
        guidance = {
          nextRecommendedTab: 'analytics',
          currentStageMessage: 'All Ads Approved: AnalyticsAgent analyzing performance → OptimizationAgent next',
          progressPercentage: 90,
          completedStages: ['setup', 'executing', 'reviewing', 'approving']
        };
        break;
      case 'optimizing':
        guidance = {
          nextRecommendedTab: 'optimization',
          currentStageMessage: 'Campaign Complete: OptimizationAgent recommending budget changes for better ROI',
          progressPercentage: 100,
          completedStages: ['setup', 'executing', 'reviewing', 'approving', 'analyzing']
        };
        break;
      default:
        guidance = state.navigationGuidance;
    }

    // Only update if guidance actually changed
    if (JSON.stringify(guidance) !== JSON.stringify(state.navigationGuidance)) {
      setState(prev => ({ ...prev, navigationGuidance: guidance }));
    }
  };

  const handleTabChange = (tabId: string) => {
    if (state.tabAccessibility[tabId as keyof TabAccessibility]) {
      setState(prev => ({ ...prev, currentTab: tabId }));
    }
  };

  const handleCampaignStart = async (campaignData: CampaignStartRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate campaign data before sending
      if (!campaignData.product?.trim()) {
        throw new Error('Product description is required');
      }
      if (!campaignData.product_cost || campaignData.product_cost <= 0) {
        throw new Error('Valid product cost is required');
      }
      if (!campaignData.budget || campaignData.budget <= 0) {
        throw new Error('Valid campaign budget is required');
      }

      // Starting new campaign - reset all state (removed excessive logging)

      // Clear any existing session data from context
      clearSessionData();

      // Reset dashboard state completely for new campaign
      setState(prev => ({
        ...prev,
        sessionId: null,
        workflowStage: 'setup',
        campaignProgress: 0,  // Start at 0%
        campaignData: {
          product: campaignData.product,
          product_cost: campaignData.product_cost,
          budget: campaignData.budget
        },
        tabAccessibility: {
          home: true,
          monitoring: false,  // Will unlock when campaign starts
          audience: false,    // Will unlock when audience agent completes
          content: false,     // Will unlock when content generation completes
          analytics: false,   // Will unlock when content is approved
          optimization: false // Will unlock when analytics completes
        },
        currentTab: 'monitoring',
        navigationGuidance: {
          nextRecommendedTab: 'monitoring',
          currentStageMessage: 'Starting campaign...',
          progressPercentage: 0,
          completedStages: []
        }
      }));

      // Start campaign via API
      const response = await ApiService.startCampaign(campaignData);

      if (!response.success) {
        throw new Error(response.data?.error || 'Campaign start failed');
      }

      const sessionId = response.data?.session_id;
      if (!sessionId) {
        throw new Error('No session ID received from server');
      }

      // Campaign started with session (removed excessive logging)

      // Update state with new session and start monitoring
      setState(prev => ({
        ...prev,
        sessionId: sessionId,
        workflowStage: 'executing',
        campaignProgress: 10,  // 10% when campaign starts
        tabAccessibility: {
          ...prev.tabAccessibility,
          monitoring: true  // Unlock monitoring immediately
        },
        navigationGuidance: {
          nextRecommendedTab: 'monitoring',
          currentStageMessage: 'Campaign started! Agents are executing...',
          progressPercentage: 10,
          completedStages: ['setup']
        }
      }));

      // Campaign started successfully (removed excessive logging)

      // Load the new session data immediately
      await loadSessionData(sessionId);

      // Start the workflow service for automatic updates
      campaignWorkflowService.startCampaign(sessionId);

      // Auto-transition to monitoring tab after a brief delay
      setTimeout(() => {
        handleTabChange('monitoring');
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start campaign';
      setError(errorMessage);
      console.error('Campaign start failed:', error);

      // Reset state on error
      setState(prev => ({
        ...prev,
        workflowStage: 'setup',
        currentTab: 'home'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentApproval = async (adId: string, action: 'approve' | 'revise', feedback?: string) => {
    if (!state.sessionId) return;

    try {
      if (action === 'revise' && feedback) {
        console.log(`🔄 Triggering content revision for ad ${adId} with feedback: ${feedback}`);

        // Call the content revision endpoint
        const response = await ApiService.submitContentRevision({
          session_id: state.sessionId,
          ad_id: adId,
          feedback: feedback
        });

        if (response.success) {
          console.log('✅ Content revision agent triggered successfully');
          // The revised content will be picked up by the polling mechanism
        } else {
          throw new Error(response.data?.error || 'Content revision failed');
        }
      } else if (action === 'approve') {
        console.log(`✅ Content approved for ad ${adId}`);

        // Check if all ads are now approved
        const allAds = sessionData?.content?.result?.ads || [];
        const approvedAds = allAds.filter((ad: any) => ad.status === 'approved' || ad.asset_id === adId);

        if (approvedAds.length === allAds.length) {
          console.log('🎉 All content approved! Triggering analytics and optimization...');

          // Update workflow stage to analytics
          setState(prev => ({
            ...prev,
            workflowStage: 'analyzing',
            campaignProgress: 90,
            navigationGuidance: {
              nextRecommendedTab: 'analytics',
              currentStageMessage: 'All content approved! Running performance analytics...',
              progressPercentage: 90,
              completedStages: ['setup', 'executing', 'reviewing', 'approving']
            }
          }));

          // Analytics will be triggered when user clicks "Proceed to Analytics" button
        }
      }

      await ApiService.submitContentApproval({
        session_id: state.sessionId,
        ad_id: adId,
        action,
        feedback
      });

      console.log(`Content ${action} submitted for ad ${adId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit approval');
      console.error('Content approval failed:', error);
    }
  };

  const handleBulkContentApproval = async (adIds: string[], action: 'approve' | 'revise') => {
    if (!state.sessionId) return;

    try {
      // Process bulk approvals in parallel for better performance
      const approvalPromises = adIds.map(adId =>
        ApiService.submitContentApproval({
          session_id: state.sessionId!,
          ad_id: adId,
          action,
          feedback: action === 'revise' ? 'Bulk revision request' : undefined
        })
      );

      await Promise.all(approvalPromises);

      // If bulk approve, check if all ads are now approved
      if (action === 'approve') {
        const allAds = sessionData?.content?.result?.ads || [];
        if (adIds.length === allAds.length) {
          console.log('🎉 All content bulk approved! Triggering analytics and optimization...');

          // Update workflow stage to analytics
          setState(prev => ({
            ...prev,
            workflowStage: 'analyzing',
            campaignProgress: 90,
            navigationGuidance: {
              nextRecommendedTab: 'analytics',
              currentStageMessage: 'All content approved! Running performance analytics...',
              progressPercentage: 90,
              completedStages: ['setup', 'executing', 'reviewing', 'approving']
            }
          }));

          // Analytics will be triggered when user clicks "Proceed to Analytics" button
        }
      }

      // Bulk action submitted (removed excessive logging)
    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to bulk ${action} ads`);
      console.error('Bulk content approval failed:', error);
      throw error; // Re-throw to allow ContentTab to handle the error
    }
  };

  const downloadS3Media = async (s3Uri: string, mediaType: 'image' | 'video') => {
    try {
      const response = await ApiService.downloadS3Media({
        s3_path: s3Uri,
        content_type: mediaType
      });

      return response.local_url || '';
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to download media');
      console.error('S3 media download failed:', error);
      throw error;
    }
  };

  const [analyticsTriggered, setAnalyticsTriggered] = useState(false);

  const triggerAnalyticsAndOptimization = async () => {
    if (!state.sessionId) return;

    // Prevent multiple simultaneous calls
    if (state.workflowStage === 'analyzing' || state.workflowStage === 'optimizing' || analyticsTriggered) {
      console.log('🚫 Analytics already triggered or in progress');
      return; // Already in progress
    }

    setAnalyticsTriggered(true);
    console.log('🎯 Triggering analytics for session:', state.sessionId);

    try {
      // Call the new combined endpoint
      const response = await ApiService.proceedToAnalytics({
        session_id: state.sessionId
      });

      if (response.success) {
        console.log('✅ Analytics triggered successfully');
        // Analytics and optimization completed successfully
        // Force refresh session data to pick up results
        await loadSessionData(state.sessionId);
      }

    } catch (error) {
      console.error('❌ Analytics trigger failed:', error);
      setAnalyticsTriggered(false); // Reset on error
      // Don't throw error - we have sample data to fall back on
    }
  };

  // const updateWorkflowGuidance = () => {
  //   updateNavigationGuidance();
  // };

  const renderCurrentTab = () => {
    // Create enhanced campaign data from session data
    const enhancedCampaignData: CampaignData | null = sessionData ? {
      product: 'Smart Water Bottle',
      product_cost: 49.99,
      budget: sessionData.budget?.result?.total_budget || 5000,
      audiences: sessionData.audiences?.result,
      budgetAllocation: sessionData.budget?.result,
      generatedAds: sessionData.content?.result?.ads?.map((ad: any) => ({
        id: ad.asset_id,
        audience: ad.audience,
        platform: ad.platform,
        ad_type: ad.ad_type,
        content: ad.content,
        status: ad.status,
        timestamp: sessionData.content?.timestamp
      })) || []
    } : state.campaignData;

    const commonProps = {
      campaignData: enhancedCampaignData,
      sessionId: state.sessionId || sessionData?.sessionId || null,
      isLoading: isLoading || dataLoading,
      error: error || dataError,
      onError: setError
    };

    switch (state.currentTab) {
      case 'home':
        return (
          <HomeTab
            {...commonProps}
            onCampaignStart={handleCampaignStart}
          />
        );
      case 'monitoring':
        return (
          <FileBasedMonitoringTab
            sessionId={state.sessionId || sessionData?.sessionId || null}
            onError={setError}
          />
        );
      case 'audience':
        return (
          <AudienceTab
            {...commonProps}
          />
        );
      case 'content':
        return (
          <ContentTab
            {...commonProps}
            onContentApproval={handleContentApproval}
            onBulkApproval={handleBulkContentApproval}
            onS3MediaDownload={downloadS3Media}
            onProceedToAnalytics={async () => {
              // Prevent multiple calls
              if (analyticsTriggered) {
                console.log('🚫 Analytics already triggered, ignoring duplicate call');
                return;
              }

              console.log('🎯 Proceeding to analytics - all content approved');

              // Update workflow stage to analytics
              setState(prev => ({
                ...prev,
                currentTab: 'analytics',
                workflowStage: 'analyzing',
                campaignProgress: 90,
                navigationGuidance: {
                  nextRecommendedTab: 'analytics',
                  currentStageMessage: 'All content approved! Analyzing performance data...',
                  progressPercentage: 90,
                  completedStages: ['setup', 'executing', 'reviewing', 'approving']
                }
              }));

              // Trigger analytics and optimization agents (only once)
              await triggerAnalyticsAndOptimization();

              // Wait a moment for backend processing, then refresh session data
              setTimeout(async () => {
                console.log('🔄 Refreshing session data to load analytics results');
                await loadSessionData(state.sessionId!);

                // Move to optimization stage
                setState(prev => ({
                  ...prev,
                  workflowStage: 'optimizing',
                  campaignProgress: 100,
                  navigationGuidance: {
                    nextRecommendedTab: 'optimization',
                    currentStageMessage: 'Analytics complete! Review optimization recommendations.',
                    progressPercentage: 100,
                    completedStages: ['setup', 'executing', 'reviewing', 'approving', 'analyzing']
                  }
                }));
              }, 5000); // Wait 5 seconds for backend processing
            }}
          />
        );
      case 'analytics':
        return (
          <AnalyticsTab
            sessionId={state.sessionId || sessionData?.sessionId || null}
            onError={setError}
          />
        );
      case 'optimization':
        return (
          <OptimizationTab
            sessionId={state.sessionId || sessionData?.sessionId || null}
            onError={setError}
          />
        );
      default:
        return <HomeTab {...commonProps} onCampaignStart={handleCampaignStart} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campaign Dashboard</h1>
              <p className="text-sm text-gray-600">Professional Marketing Analytics Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <SessionSelector
                currentSessionId={state.sessionId || sessionData?.sessionId || null}
                onSessionChange={(sessionId) => setState(prev => ({ ...prev, sessionId }))}
              />
              <button
                onClick={async () => {
                  sessionDetectionService.clearCache();
                  const latestSessionId = await sessionDetectionService.getLatestSessionId();
                  // Manual refresh - loading session (removed excessive logging)
                  setState(prev => ({ ...prev, sessionId: latestSessionId }));
                  await loadSessionData(latestSessionId);
                }}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                title="Refresh to latest session"
              >
                🔄 Refresh
              </button>
              {sessionData && (
                <div className="text-xs text-blue-600">
                  {Object.keys(sessionData).filter(k => k !== 'sessionId' && k !== 'lastUpdated' && sessionData[k as keyof typeof sessionData]).length} agents loaded
                </div>
              )}
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Connected" />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <NavigationHeader
        tabs={TABS}
        currentTab={state.currentTab}
        tabAccessibility={state.tabAccessibility}
        onTabChange={handleTabChange}
        workflowStage={state.workflowStage}
      />

      {/* Workflow Guide */}
      <WorkflowGuide
        currentStage={state.workflowStage}
        nextRecommendedTab={state.navigationGuidance.nextRecommendedTab}
        completedStages={state.navigationGuidance.completedStages}
        currentStageMessage={state.navigationGuidance.currentStageMessage}
        progressPercentage={state.navigationGuidance.progressPercentage}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Mode Indicator */}
        <DemoModeIndicator
          isVisible={showDemoMode}
          onDismiss={() => setShowDemoMode(false)}
        />



        {renderCurrentTab()}
      </main>

      {/* Global Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-error-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up">
          <div className="flex items-center space-x-2">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-white hover:text-gray-200 ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfessionalDashboard: React.FC = () => {
  return (
    <CampaignDataProvider>
      <ProfessionalDashboardContent />
    </CampaignDataProvider>
  );
};

export default ProfessionalDashboard;