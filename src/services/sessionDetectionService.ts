/**
 * Session Detection Service
 * Automatically detects the latest session and available sessions
 */

export interface SessionInfo {
  sessionId: string;
  timestamp: string;
  displayName: string;
  status: 'latest' | 'recent' | 'complete' | 'demo';
  hasContent: boolean;
}

class SessionDetectionService {
  private sessionCache: SessionInfo[] = [];
  private lastScan: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  /**
   * Get all available sessions, sorted by timestamp (newest first)
   */
  async getAvailableSessions(): Promise<SessionInfo[]> {
    // Always try to get fresh data for better session detection
    try {
      // Try to fetch session list from backend
      const sessions = await this.scanForSessions();
      this.sessionCache = sessions;
      this.lastScan = Date.now();
      return sessions;
    } catch (error) {
      console.warn('Could not scan for sessions, using fallback list');
      // Use cache if available, otherwise fallback
      if (this.sessionCache.length > 0) {
        return this.sessionCache;
      }
      return this.getFallbackSessions();
    }
  }

  /**
   * Get the latest session ID
   */
  async getLatestSessionId(): Promise<string> {
    // Clear cache to get fresh data
    this.clearCache();
    
    const sessions = await this.getAvailableSessions();
    console.log('🔍 Available sessions:', sessions);
    
    // Prioritize sessions with content that are not demo sessions
    const realSessions = sessions.filter(s => s.sessionId !== 'session-workflow-test');
    if (realSessions.length > 0) {
      const latestReal = realSessions[0];
      console.log('🎯 Selected latest real session:', latestReal.sessionId);
      return latestReal.sessionId;
    }
    
    // Fallback to any session
    const latestSession = sessions[0];
    const sessionId = latestSession?.sessionId || 'session-workflow-test';
    console.log('🎯 Selected fallback session:', sessionId);
    return sessionId;
  }

  /**
   * Scan for sessions by checking agent_outputs directory
   */
  private async scanForSessions(): Promise<SessionInfo[]> {
    // Try to dynamically detect sessions from the backend API
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        console.log('📡 Backend sessions response:', data);
        
        if (data.success && data.sessions && Array.isArray(data.sessions)) {
          // The API returns session IDs as strings, not objects
          const sessionPromises = data.sessions.map(async (sessionId: string, index: number) => {
            const hasContent = await this.checkSessionHasContent(sessionId);
            const campaignType = await this.detectCampaignType(sessionId);
            
            return {
              sessionId,
              timestamp: new Date().toISOString(),
              displayName: `${campaignType} (${sessionId})`,
              status: index === 0 ? 'latest' : (index < 3 ? 'recent' : 'complete'),
              hasContent
            };
          });
          
          const sessions = await Promise.all(sessionPromises);
          console.log('✅ Processed backend sessions:', sessions);
          return sessions;
        }
      }
    } catch (error) {
      console.log('Backend session API failed, trying directory scan:', error);
    }
    
    // Try to dynamically scan agent_outputs directory
    const dynamicSessions = await this.scanAgentOutputsDirectory();
    if (dynamicSessions.length > 0) {
      console.log('📁 Found sessions in agent_outputs:', dynamicSessions.map(s => s.sessionId));
      return dynamicSessions;
    }
    
    // Check for known active sessions by trying to load their files directly
    const potentialSessions = [
      'session-1760980079', // Current active session - Latest Campaign
      'session-1760972356', // Previous session - Water-Resistant Smartphone
      'session-1760971224', // Previous session - Diabetes Prevention Campaign
      'session-workflow-test' // Demo fallback
    ];
    
    const activeSessions: SessionInfo[] = [];
    
    for (let i = 0; i < potentialSessions.length; i++) {
      const sessionId = potentialSessions[i];
      const hasContent = await this.checkSessionHasContent(sessionId);
      
      if (hasContent || sessionId === 'session-workflow-test') {
        const campaignType = await this.detectCampaignType(sessionId);
        activeSessions.push({
          sessionId,
          timestamp: sessionId === 'session-workflow-test' ? '2025-01-20T12:00:00' : new Date().toISOString(),
          displayName: sessionId === 'session-workflow-test' ? 'Demo Session' : `${campaignType} (${sessionId})`,
          status: i === 0 ? 'latest' : (sessionId === 'session-workflow-test' ? 'demo' : 'recent'),
          hasContent
        });
      }
    }
    
    console.log('📁 Found active sessions:', activeSessions.map(s => s.sessionId));
    return activeSessions.length > 0 ? activeSessions : [
      {
        sessionId: 'session-workflow-test',
        timestamp: '2025-01-20T12:00:00',
        displayName: 'Demo Session (No Active Campaigns)',
        status: 'demo',
        hasContent: true
      }
    ];
  }

  /**
   * Check if a session has content generation data
   */
  private async checkSessionHasContent(sessionId: string): Promise<boolean> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/agent/ContentGenerationAgent`);
      if (response.ok) {
        const data = await response.json();
        return data.result?.ads?.length > 0;
      }
      return false;
    } catch (error) {
      // Fallback: assume it has content if it's a known session
      return !sessionId.includes('workflow-test');
    }
  }

  /**
   * Fallback sessions when scanning fails
   */
  private getFallbackSessions(): SessionInfo[] {
    return [
      {
        sessionId: 'session-workflow-test',
        timestamp: '2025-01-20T12:00:00',
        displayName: 'Demo Session (No Active Campaigns)',
        status: 'demo',
        hasContent: true
      }
    ];
  }

  /**
   * Detect campaign type from session data
   */
  async detectCampaignType(sessionId: string): Promise<string> {
    try {
      // Try to get audience data to determine campaign type
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/agent/AudienceAgent`);
      if (response.ok) {
        const data = await response.json();
        const audiences = data.result?.audiences || [];
        
        // Analyze audience names to determine campaign type
        const audienceText = audiences.map((a: any) => a.name).join(' ').toLowerCase();
        
        if (audienceText.includes('diabetic') || audienceText.includes('healthcare')) {
          return 'Diabetes Pills Campaign';
        } else if (audienceText.includes('fitness') || audienceText.includes('hydration')) {
          return 'Water Bottle Campaign';
        } else if (audienceText.includes('garden') || audienceText.includes('floral')) {
          return 'Flowers Campaign';
        } else if (audienceText.includes('gift') || audienceText.includes('shopper')) {
          return 'Gift Campaign';
        }
      }
      
      return 'Campaign';
    } catch (error) {
      return 'Campaign';
    }
  }

  /**
   * Clear cache to force refresh
   */
  clearCache(): void {
    this.sessionCache = [];
    this.lastScan = 0;
  }

  /**
   * Add a new session (when user creates one)
   */
  addSession(sessionId: string, displayName?: string): void {
    const newSession: SessionInfo = {
      sessionId,
      timestamp: new Date().toISOString(),
      displayName: displayName || 'New Campaign',
      status: 'latest',
      hasContent: false
    };

    // Update existing sessions status
    this.sessionCache.forEach(s => {
      if (s.status === 'latest') s.status = 'recent';
    });

    // Add new session at the beginning
    this.sessionCache.unshift(newSession);
    
    console.log('📝 Added new session to cache:', sessionId);
  }

  /**
   * Dynamically scan for new sessions in agent_outputs directory
   */
  async scanAgentOutputsDirectory(): Promise<SessionInfo[]> {
    try {
      const response = await fetch('/agent_outputs/');
      if (response.ok) {
        const html = await response.text();
        
        // Extract session directories from the HTML listing
        const sessionMatches = html.match(/session-\d+/g) || [];
        const uniqueSessions = [...new Set(sessionMatches)];
        
        const sessions: SessionInfo[] = [];
        
        for (let i = 0; i < uniqueSessions.length; i++) {
          const sessionId = uniqueSessions[i];
          const hasContent = await this.checkSessionHasContent(sessionId);
          
          sessions.push({
            sessionId,
            timestamp: new Date().toISOString(),
            displayName: `Campaign ${sessionId.split('-')[1]}`,
            status: i === 0 ? 'latest' : 'recent',
            hasContent
          });
        }
        
        return sessions.sort((a, b) => b.sessionId.localeCompare(a.sessionId)); // Sort by session ID (newest first)
      }
    } catch (error) {
      console.log('Could not scan agent_outputs directory:', error);
    }
    
    return [];
  }
}

export default new SessionDetectionService();