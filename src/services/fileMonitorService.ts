/**
 * File Monitor Service - Automatically monitors agent output JSON files
 * Polls the file system every 5 seconds to detect new agent results
 * Updates tabs automatically when new data is available
 */

interface AgentResult {
  agent: string;
  timestamp: string;
  stage: string;
  status: string;
  result: any;
}

interface SessionData {
  sessionId: string;
  audiences?: any;
  budget?: any;
  prompts?: any;
  content?: any;
  lastUpdated: string;
}

type FileMonitorCallback = (sessionData: SessionData) => void;

class FileMonitorService {
  private callbacks: Set<FileMonitorCallback> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private currentSessionId: string | null = null;
  private lastFileStates: Map<string, string> = new Map();
  private isMonitoring = false;

  /**
   * Start monitoring files for a specific session
   */
  startMonitoring(sessionId: string): void {
    console.log('🔍 Starting file monitoring for session:', sessionId);
    
    this.currentSessionId = sessionId;
    this.isMonitoring = true;
    
    // Clear any existing interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Start polling every 30 seconds (much reduced frequency)
    this.monitoringInterval = setInterval(() => {
      this.checkForUpdates();
    }, 30000);

    // Check immediately
    this.checkForUpdates();
  }

  /**
   * Stop monitoring files
   */
  stopMonitoring(): void {
    console.log('🛑 Stopping file monitoring');
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.lastFileStates.clear();
  }

  /**
   * Add a callback to be notified when data changes
   */
  addCallback(callback: FileMonitorCallback): void {
    this.callbacks.add(callback);
  }

  /**
   * Remove a callback
   */
  removeCallback(callback: FileMonitorCallback): void {
    this.callbacks.delete(callback);
  }

  /**
   * Check for file updates
   */
  private async checkForUpdates(): Promise<void> {
    if (!this.currentSessionId || !this.isMonitoring) return;

    try {
      const sessionData = await this.loadSessionData(this.currentSessionId);
      
      // Create a hash of the current data to detect changes
      const dataHash = JSON.stringify({
        audiences: !!sessionData.audiences,
        budget: !!sessionData.budget,
        prompts: !!sessionData.prompts,
        content: !!sessionData.content,
        contentCount: sessionData.content?.ads?.length || 0
      });
      
      // Only notify if data has actually changed
      const lastHash = this.lastFileStates.get(this.currentSessionId);
      if (dataHash !== lastHash) {
        this.lastFileStates.set(this.currentSessionId, dataHash);
        
        console.log(`📊 File monitor detected changes for ${this.currentSessionId}`);
        
        // Notify all callbacks
        this.callbacks.forEach(callback => {
          try {
            callback(sessionData);
          } catch (error) {
            console.error('Error in file monitor callback:', error);
          }
        });
      }
      
    } catch (error) {
      console.error('Error checking for file updates:', error);
    }
  }

  /**
   * Load session data from JSON files
   */
  private async loadSessionData(sessionId: string): Promise<SessionData> {
    const sessionData: SessionData = {
      sessionId,
      lastUpdated: new Date().toISOString()
    };

    // Try to load each agent's result
    const agents = [
      { name: 'AudienceAgent', key: 'audiences' },
      { name: 'BudgetAgent', key: 'budget' },
      { name: 'PromptAgent', key: 'prompts' },
      { name: 'ContentGenerationAgent', key: 'content' }
    ];

    for (const agent of agents) {
      try {
        const result = await this.loadAgentResult(sessionId, agent.name);
        if (result) {
          sessionData[agent.key as keyof SessionData] = this.extractAgentData(agent.name, result);
        }
      } catch (error) {
        // File doesn't exist yet or error reading - that's okay
        console.debug(`No data yet for ${agent.name} in session ${sessionId}`);
      }
    }

    return sessionData;
  }

  /**
   * Load individual agent result from JSON file
   */
  private async loadAgentResult(sessionId: string, agentName: string): Promise<AgentResult | null> {
    try {
      // Fetch from the unified agent_outputs directory (served from public/)
      const filename = `${agentName.toLowerCase()}_result.json`;
      const url = `/agent_outputs/${sessionId}/${filename}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.debug(`File not found: ${url} (${response.status})`);
        return null;
      }
      
      const data = await response.json();
      console.debug(`Loaded ${agentName} data:`, data);
      return data;
    } catch (error) {
      // File doesn't exist or can't be read - this is normal during polling
      console.debug(`Could not load ${agentName} for session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Extract and format agent data based on agent type
   */
  private extractAgentData(agentName: string, result: AgentResult): any {
    if (!result?.result) return null;

    switch (agentName) {
      case 'AudienceAgent':
        return {
          audiences: result.result.audiences || []
        };
      
      case 'BudgetAgent':
        return {
          total_budget: result.result.total_budget || 0,
          allocations: result.result.allocations || []
        };
      
      case 'PromptAgent':
        return {
          audience_prompts: result.result.audience_prompts || []
        };
      
      case 'ContentGenerationAgent':
        const ads = result.result.ads || [];
        return {
          ads,
          summary: {
            total_ads: ads.length,
            by_type: this.groupBy(ads, 'ad_type'),
            by_platform: this.groupBy(ads, 'platform'),
            by_audience: this.groupBy(ads, 'audience')
          }
        };
      
      default:
        return result.result;
    }
  }

  /**
   * Helper function to group array by property
   */
  private groupBy(array: any[], property: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const key = item[property] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Get current monitoring status
   */
  getStatus(): { isMonitoring: boolean; sessionId: string | null; callbackCount: number } {
    return {
      isMonitoring: this.isMonitoring,
      sessionId: this.currentSessionId,
      callbackCount: this.callbacks.size
    };
  }
}

// Export singleton instance
export const fileMonitorService = new FileMonitorService();
export default fileMonitorService;