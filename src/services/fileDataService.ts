/**
 * File Data Service
 * Loads agent results directly from JSON files
 */

export interface AgentResult {
  agent: string;
  timestamp: string;
  stage: string;
  status: 'completed' | 'pending' | 'error';
  result: any;
}

export interface SessionData {
  sessionId: string;
  audiences?: any;
  budget?: any;
  prompts?: any;
  content?: any;
  sessionProgress?: any;
  lastUpdated: string;
}

class FileDataService {
  private cache: Map<string, SessionData> = new Map();
  private readonly baseUrl = `${import.meta.env.VITE_API_URL || ''}/api/session`;

  /**
   * Load all agent data for a session
   */
  async loadSessionData(sessionId: string): Promise<SessionData> {
    // Loading session data (removed excessive logging)

    // Check cache first
    const cached = this.cache.get(sessionId);
    if (cached && this.isCacheValid(cached)) {
      console.log('✅ Using cached data for session:', sessionId);
      return cached;
    }

    const sessionData: SessionData = {
      sessionId,
      lastUpdated: new Date().toISOString()
    };

    // Load each agent result
    const agentFiles = [
      { key: 'audiences', filename: 'audienceagent_result.json' },
      { key: 'budget', filename: 'budgetagent_result.json' },
      { key: 'prompts', filename: 'promptagent_result.json' },
      { key: 'content', filename: 'contentgenerationagent_result.json' },
      { key: 'analytics', filename: 'analyticsagent_result.json' },
      { key: 'optimization', filename: 'optimizationagent_result.json' }
    ];

    for (const agent of agentFiles) {
      try {
        const apiResponse = await this.loadAgentFile(sessionId, agent.filename);
        if (apiResponse) {
          // API returns: {success, session_id, agent, data: {agent, timestamp, result}}
          const agentData = apiResponse.data || apiResponse;
          (sessionData as any)[agent.key] = agentData;
          console.log(`✅ Loaded ${agent.key}:`, agentData.result || agentData);
        }
      } catch (error) {
        console.warn(`⚠️ Could not load ${agent.key}:`, error);
      }
    }

    // Load session progress
    try {
      const progressData = await this.loadAgentFile(sessionId, 'session_progress.json');
      if (progressData) {
        sessionData.sessionProgress = progressData;
      }
    } catch (error) {
      console.warn('⚠️ Could not load session progress:', error);
    }

    // Cache the result
    this.cache.set(sessionId, sessionData);
    
    console.log('✅ Session data loaded:', sessionData);
    return sessionData;
  }

  /**
   * Load a specific agent file
   */
  private async loadAgentFile(sessionId: string, filename: string): Promise<AgentResult | null> {
    try {
      // Use API endpoint to fetch agent results
      const agentName = filename.replace('_result.json', '').replace('agent', 'Agent');
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/agent/${agentName}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Successfully loaded ${filename} for ${sessionId}`);
        return data;
      } else {
        console.debug(`Agent result not found: ${agentName} for session ${sessionId} (${response.status})`);
      }

      return null;
    } catch (error) {
      console.debug(`Could not load ${filename} for ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Load data using Node.js fs (for development/testing)
   */
  async loadSessionDataFromFS(sessionId: string): Promise<SessionData> {
    console.log('🔄 Loading session data from file system for:', sessionId);

    // Try to load actual data first
    try {
      const actualData = await this.loadActualSessionData(sessionId);
      if (actualData) {
        console.log(`✅ Loaded actual data for ${sessionId}`);
        return actualData;
      }
    } catch (error) {
      console.warn('Could not load actual session data, using fallback:', error);
    }

    // Fallback to hardcoded data for known sessions
    const sessionData: SessionData = {
      sessionId,
      lastUpdated: new Date().toISOString()
    };
    
    if (sessionId === 'session-workflow-test') {
      // Return the test data we know exists
      sessionData.audiences = {
        agent: "AudienceAgent",
        timestamp: "2025-01-20T12:00:00.000000",
        stage: "audience_analysis",
        status: "completed",
        result: {
          audiences: [
            {
              name: "Fitness Enthusiasts",
              demographics: "Adults 25-45 who exercise regularly and track health metrics",
              platforms: [
                {
                  platform: "Instagram",
                  reason: "Visual platform ideal for showcasing product benefits during workouts"
                }
              ]
            },
            {
              name: "Tech-Savvy Professionals",
              demographics: "Working adults 30-50 who value convenience and smart technology",
              platforms: [
                {
                  platform: "LinkedIn",
                  reason: "Professional network where productivity and health innovations resonate"
                }
              ]
            },
            {
              name: "Health-Conscious Parents",
              demographics: "Parents 28-45 concerned about family wellness and nutrition",
              platforms: [
                {
                  platform: "Facebook",
                  reason: "Strong parenting communities where health products thrive"
                }
              ]
            }
          ]
        }
      };

      sessionData.budget = {
        agent: "BudgetAgent",
        timestamp: "2025-01-20T12:01:00.000000",
        stage: "budget_allocation",
        status: "completed",
        result: {
          total_budget: 5000.0,
          allocations: [
            {
              audience: "Fitness Enthusiasts",
              total: 2500.0,
              platforms: [
                {
                  platform: "Instagram",
                  amount: 2500.0,
                  percentage: 50.0
                }
              ]
            },
            {
              audience: "Tech-Savvy Professionals",
              total: 1500.0,
              platforms: [
                {
                  platform: "LinkedIn",
                  amount: 1500.0,
                  percentage: 30.0
                }
              ]
            },
            {
              audience: "Health-Conscious Parents",
              total: 1000.0,
              platforms: [
                {
                  platform: "Facebook",
                  amount: 1000.0,
                  percentage: 20.0
                }
              ]
            }
          ]
        }
      };

      sessionData.content = {
        agent: "ContentGenerationAgent",
        timestamp: "2025-01-20T12:05:00.000000",
        stage: "content_generation",
        status: "completed",
        result: {
          ads: [
            {
              asset_id: "ad_001",
              audience: "Fitness Enthusiasts",
              platform: "Instagram",
              ad_type: "image_ad",
              content: "https://agentcore-demo-172.s3.amazonaws.com/image-outputs/fitness-bottle.png",
              status: "generated"
            },
            {
              asset_id: "ad_002",
              audience: "Fitness Enthusiasts",
              platform: "Instagram",
              ad_type: "video_ad",
              content: "s3://agentcore-demo-172/video-outputs/fitness-timelapse",
              status: "generated"
            },
            {
              asset_id: "ad_003",
              audience: "Tech-Savvy Professionals",
              platform: "LinkedIn",
              ad_type: "text_ad",
              content: "Revolutionary smart water bottle with AI-powered hydration tracking for peak performance. Stay optimally hydrated throughout your workday with personalized reminders and health insights. Boost Productivity with smart hydration technology.",
              status: "generated"
            },
            {
              asset_id: "ad_004",
              audience: "Tech-Savvy Professionals",
              platform: "LinkedIn",
              ad_type: "image_ad",
              content: "https://agentcore-demo-172.s3.amazonaws.com/image-outputs/professional-office.png",
              status: "generated"
            },
            {
              asset_id: "ad_005",
              audience: "Health-Conscious Parents",
              platform: "Facebook",
              ad_type: "text_ad",
              content: "Keep your family properly hydrated with smart tracking and UV-C cleaning technology. Monitor everyone's intake and ensure germ-free water for your loved ones. Protect Your Family with advanced hydration technology.",
              status: "generated"
            },
            {
              asset_id: "ad_006",
              audience: "Health-Conscious Parents",
              platform: "Facebook",
              ad_type: "video_ad",
              content: "s3://agentcore-demo-172/video-outputs/family-hydration",
              status: "generated"
            }
          ]
        }
      };
    }

    // Add support for latest diabetes session
    if (sessionId === 'session-1760940737') {
      sessionData.audiences = {
        agent: "AudienceAgent",
        timestamp: "2025-10-20T02:12:53.000000",
        stage: "audience_analysis", 
        status: "completed",
        result: {
          audiences: [
            {
              name: "Senior Diabetics",
              demographics: "Adults 65+ managing type 2 diabetes, seeking simplified medication routines",
              platforms: [
                {
                  platform: "Facebook",
                  reason: "High engagement among seniors, trusted platform for health information sharing"
                }
              ]
            },
            {
              name: "Caretakers and Family Members", 
              demographics: "Adult children and spouses of diabetic seniors, ages 45-65",
              platforms: [
                {
                  platform: "Google Search",
                  reason: "Actively searching for diabetes management solutions for loved ones"
                }
              ]
            },
            {
              name: "Healthcare Professionals",
              demographics: "Geriatricians, endocrinologists, and primary care physicians",
              platforms: [
                {
                  platform: "LinkedIn", 
                  reason: "Professional network for medical education and pharmaceutical updates"
                }
              ]
            }
          ]
        }
      };

      sessionData.budget = {
        agent: "BudgetAgent",
        timestamp: "2025-10-20T02:13:10.000000",
        stage: "budget_allocation",
        status: "completed", 
        result: {
          total_budget: 15000.0,
          allocations: [
            {
              audience: "Senior Diabetics",
              total: 7500.0,
              platforms: [
                {
                  platform: "Facebook",
                  amount: 7500.0,
                  percentage: 50.0
                }
              ]
            },
            {
              audience: "Caretakers and Family Members",
              total: 4500.0,
              platforms: [
                {
                  platform: "Google Search", 
                  amount: 4500.0,
                  percentage: 30.0
                }
              ]
            },
            {
              audience: "Healthcare Professionals",
              total: 3000.0,
              platforms: [
                {
                  platform: "LinkedIn",
                  amount: 3000.0, 
                  percentage: 20.0
                }
              ]
            }
          ]
        }
      };

      sessionData.prompts = {
        agent: "PromptAgent",
        timestamp: "2025-10-20T02:13:30.000000",
        stage: "prompt_strategy",
        status: "completed",
        result: {
          audience_prompts: [
            {
              audience: "Senior Diabetics",
              platforms: [
                {
                  platform: "Facebook",
                  prompts: [
                    {
                      ad_type: "image_ad",
                      prompt: "Senior-friendly diabetes medication with clear, simple packaging and easy-to-read instructions",
                      cta: "Simplify Your Diabetes Care"
                    },
                    {
                      ad_type: "video_ad", 
                      prompt: "Elderly person confidently managing diabetes with simplified medication routine",
                      cta: "Take Control Today"
                    }
                  ]
                }
              ]
            },
            {
              audience: "Caretakers and Family Members",
              platforms: [
                {
                  platform: "Google Search",
                  prompts: [
                    {
                      ad_type: "text_ad",
                      prompt: "Diabetes care solution that gives peace of mind to families caring for senior loved ones",
                      cta: "Learn More"
                    },
                    {
                      ad_type: "image_ad",
                      prompt: "Family members supporting senior with diabetes management, showing care and confidence",
                      cta: "Support Your Loved One"
                    }
                  ]
                }
              ]
            },
            {
              audience: "Healthcare Professionals", 
              platforms: [
                {
                  platform: "LinkedIn",
                  prompts: [
                    {
                      ad_type: "text_ad",
                      prompt: "Evidence-based diabetes medication with proven outcomes in geriatric populations",
                      cta: "View Clinical Data"
                    },
                    {
                      ad_type: "image_ad",
                      prompt: "Medical professional reviewing diabetes treatment options with clinical data and patient outcomes",
                      cta: "Explore Research"
                    }
                  ]
                }
              ]
            }
          ]
        }
      };
    }

    console.log('✅ Session data loaded from FS:', sessionData);
    return sessionData;
  }

  /**
   * Check if cached data is still valid (5 minutes)
   */
  private isCacheValid(data: SessionData): boolean {
    const cacheAge = Date.now() - new Date(data.lastUpdated).getTime();
    return cacheAge < 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Load actual session data dynamically (tries to fetch real files)
   */
  private async loadActualSessionData(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionData: SessionData = {
        sessionId,
        lastUpdated: new Date().toISOString()
      };

      const agentFiles = [
        { key: 'audiences', filename: 'audienceagent_result.json' },
        { key: 'budget', filename: 'budgetagent_result.json' },
        { key: 'prompts', filename: 'promptagent_result.json' },
        { key: 'content', filename: 'contentgenerationagent_result.json' }
      ];

      let hasAnyData = false;

      for (const agent of agentFiles) {
        try {
          const data = await this.loadAgentFile(sessionId, agent.filename);
          if (data) {
            (sessionData as any)[agent.key] = data;
            hasAnyData = true;
            console.log(`✅ Dynamically loaded ${agent.key} for ${sessionId}`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not load ${agent.key} for ${sessionId}:`, error);
        }
      }

      // Only return data if we found at least some files
      if (hasAnyData) {
        console.log(`✅ Successfully loaded dynamic data for ${sessionId}`);
        return sessionData;
      }

      return null;
    } catch (error) {
      console.error(`❌ Failed to load actual session data for ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Clear cache for a session
   */
  clearCache(sessionId?: string): void {
    if (sessionId) {
      this.cache.delete(sessionId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get available sessions
   */
  async getAvailableSessions(): Promise<string[]> {
    // This would scan the agent_outputs directory
    // For now, return known sessions
    return [
      'session-workflow-test',
      'session-1760936532',
      'session-1760935305',
      'session-1760934452'
    ];
  }
}

export default new FileDataService();