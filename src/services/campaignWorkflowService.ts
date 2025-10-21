/**
 * Campaign Workflow Service
 * Manages the complete campaign workflow from start to optimization
 */

import fileMonitorService from './fileMonitorService';

export interface CampaignState {
  sessionId: string | null;
  currentStage: 'setup' | 'executing' | 'content_review' | 'analytics' | 'optimization' | 'completed';
  progress: number;
  audiences?: any;
  budget?: any;
  prompts?: any;
  content?: any;
  analytics?: any;
  optimization?: any;
  approvals?: Record<string, 'pending' | 'approved' | 'revising'>;
}

type WorkflowCallback = (state: CampaignState) => void;

class CampaignWorkflowService {
  private callbacks: Set<WorkflowCallback> = new Set();
  private currentState: CampaignState = {
    sessionId: null,
    currentStage: 'setup',
    progress: 0
  };

  /**
   * Start a new campaign
   */
  async startCampaign(sessionId: string): Promise<void> {
    console.log('🚀 Starting campaign workflow for session:', sessionId);
    
    this.currentState = {
      sessionId,
      currentStage: 'executing',
      progress: 10,
      approvals: {}
    };
    
    this.notifyCallbacks();
    
    // Start monitoring files for this session
    fileMonitorService.addCallback(this.handleFileUpdate.bind(this));
    fileMonitorService.startMonitoring(sessionId);
  }

  /**
   * Handle file updates from the file monitor
   */
  private handleFileUpdate(sessionData: any): void {
    console.log('📊 Campaign workflow received data update:', sessionData);
    
    // Update state with new data
    this.currentState = {
      ...this.currentState,
      audiences: sessionData.audiences,
      budget: sessionData.budget,
      prompts: sessionData.prompts,
      content: sessionData.content
    };

    // Update progress based on completed agents
    this.updateProgress();
    
    // Check if we should move to next stage
    this.checkStageTransition();
    
    this.notifyCallbacks();
  }

  /**
   * Update progress based on completed data
   */
  private updateProgress(): void {
    let completedAgents = 0;
    const totalAgents = 4; // Audience, Budget, Prompts, Content
    
    if (this.currentState.audiences) completedAgents++;
    if (this.currentState.budget) completedAgents++;
    if (this.currentState.prompts) completedAgents++;
    if (this.currentState.content) completedAgents++;
    
    this.currentState.progress = Math.round((completedAgents / totalAgents) * 100);
  }

  /**
   * Check if we should transition to next stage
   */
  private checkStageTransition(): void {
    if (this.currentState.currentStage === 'executing' && this.currentState.content) {
      // All agents completed, move to content review
      this.currentState.currentStage = 'content_review';
      this.initializeApprovals();
    }
  }

  /**
   * Initialize approval states for all generated content
   */
  private initializeApprovals(): void {
    if (!this.currentState.content?.ads) return;
    
    const approvals: Record<string, 'pending' | 'approved' | 'revising'> = {};
    
    this.currentState.content.ads.forEach((ad: any) => {
      approvals[ad.asset_id] = 'pending';
    });
    
    this.currentState.approvals = approvals;
  }

  /**
   * Approve an ad
   */
  approveAd(assetId: string): void {
    if (this.currentState.approvals) {
      this.currentState.approvals[assetId] = 'approved';
      this.checkAllApprovals();
      this.notifyCallbacks();
    }
  }

  /**
   * Request revision for an ad
   */
  requestRevision(assetId: string, feedback: string): void {
    if (this.currentState.approvals) {
      this.currentState.approvals[assetId] = 'revising';
      // TODO: Call ContentRevisionAgent with feedback
      this.notifyCallbacks();
    }
  }

  /**
   * Check if all ads are approved
   */
  private checkAllApprovals(): void {
    if (!this.currentState.approvals) return;
    
    const allApproved = Object.values(this.currentState.approvals).every(
      status => status === 'approved'
    );
    
    if (allApproved && this.currentState.currentStage === 'content_review') {
      this.currentState.currentStage = 'analytics';
      // TODO: Trigger AnalyticsAgent
    }
  }

  /**
   * Add callback for state changes
   */
  addCallback(callback: WorkflowCallback): void {
    this.callbacks.add(callback);
  }

  /**
   * Remove callback
   */
  removeCallback(callback: WorkflowCallback): void {
    this.callbacks.delete(callback);
  }

  /**
   * Notify all callbacks of state change
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback({ ...this.currentState });
      } catch (error) {
        console.error('Error in workflow callback:', error);
      }
    });
  }

  /**
   * Get current state
   */
  getCurrentState(): CampaignState {
    return { ...this.currentState };
  }

  /**
   * Reset workflow
   */
  reset(): void {
    fileMonitorService.stopMonitoring();
    this.currentState = {
      sessionId: null,
      currentStage: 'setup',
      progress: 0
    };
    this.notifyCallbacks();
  }
}

export const campaignWorkflowService = new CampaignWorkflowService();
export default campaignWorkflowService;