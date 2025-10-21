/**
 * Mock API service for demo mode
 * Provides sample data when backend is not available
 */

import type { 
  CampaignStartRequest, 
  ContentApprovalRequest, 
  AgentExecutionResponse,
  S3MediaRequest,
  AgentResults,
  SessionProgress
} from '../types';

export class MockApiService {
  private static sessionData: any = null;

  static async healthCheck(): Promise<{ status: string }> {
    // Always fail to simulate no backend
    throw new Error('Backend not available - demo mode');
  }

  static async startCampaign(campaignData: CampaignStartRequest): Promise<{ success: boolean; data: any }> {
    const sessionId = `demo_${Date.now()}`;
    
    this.sessionData = {
      session_id: sessionId,
      status: 'running',
      agents_completed: [],
      current_stage: 'executing',
      progress_percentage: 0,
      results: {}
    };

    // Simulate async processing
    setTimeout(() => {
      this.simulateAgentExecution(sessionId);
    }, 1000);

    return {
      success: true,
      data: {
        session_id: sessionId,
        message: 'Campaign started in demo mode',
        status: 'running'
      }
    };
  }

  static async getSessionData(sessionId: string): Promise<any> {
    if (!this.sessionData || this.sessionData.session_id !== sessionId) {
      // Return completed demo session
      return {
        session_id: sessionId,
        status: 'completed',
        agents_completed: ['AudienceAgent', 'BudgetAgent', 'ContentGenerationAgent', 'AnalyticsAgent'],
        current_stage: 'completed',
        progress_percentage: 100,
        results: this.getDemoResults()
      };
    }

    return this.sessionData;
  }

  static async getAgentOutputs(sessionId: string): Promise<string[]> {
    return [
      'AudienceAgent: Analyzing target demographics...',
      'AudienceAgent: Identified Tech Enthusiasts as primary audience',
      'BudgetAgent: Calculating optimal budget allocation...',
      'BudgetAgent: Allocated 60% to Facebook, 40% to Instagram',
      'ContentGenerationAgent: Generating ad content...',
      'ContentGenerationAgent: Created engaging ad copy and visuals',
      'AnalyticsAgent: Calculating performance metrics...',
      'AnalyticsAgent: Campaign shows 150% ROI potential'
    ];
  }

  static async submitContentApproval(approvalData: ContentApprovalRequest): Promise<{ success: boolean }> {
    console.log('Demo: Content approval submitted', approvalData);
    return { success: true };
  }

  static async downloadS3Media(mediaRequest: S3MediaRequest): Promise<{ local_path: string }> {
    // Return a placeholder image URL
    return { 
      local_path: 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Demo+Image' 
    };
  }

  static async pollAgentResults(sessionId: string): Promise<AgentResults | null> {
    return this.getDemoResults();
  }

  static async getSessionProgress(sessionId: string): Promise<SessionProgress> {
    // Simulate progressive agent execution
    const now = Date.now();
    const sessionStart = parseInt(sessionId.split('_')[1]) || now;
    const elapsed = now - sessionStart;
    
    let agents_completed: string[] = [];
    let current_stage = 'initializing';
    let progress_percentage = 0;
    let status: 'running' | 'completed' | 'error' = 'running';

    // Simulate agent progression over time
    if (elapsed > 2000) { // 2 seconds
      agents_completed.push('AudienceAgent');
      current_stage = 'audience_complete';
      progress_percentage = 25;
    }
    if (elapsed > 5000) { // 5 seconds
      agents_completed.push('BudgetAgent');
      current_stage = 'budget_complete';
      progress_percentage = 50;
    }
    if (elapsed > 8000) { // 8 seconds
      agents_completed.push('PromptAgent');
      current_stage = 'prompt_complete';
      progress_percentage = 75;
    }
    if (elapsed > 12000) { // 12 seconds
      agents_completed.push('ContentGenerationAgent');
      current_stage = 'content_complete';
      progress_percentage = 100;
      status = 'completed';
    }

    return {
      session_id: sessionId,
      started_at: new Date(sessionStart).toISOString(),
      agents_completed,
      current_stage,
      progress_percentage,
      status,
      last_updated: new Date().toISOString()
    };
  }

  private static simulateAgentExecution(sessionId: string) {
    const agents = ['AudienceAgent', 'BudgetAgent', 'ContentGenerationAgent', 'AnalyticsAgent'];
    let currentAgent = 0;

    const updateProgress = () => {
      if (currentAgent < agents.length) {
        this.sessionData.agents_completed.push(agents[currentAgent]);
        this.sessionData.progress_percentage = ((currentAgent + 1) / agents.length) * 100;
        
        if (currentAgent === agents.length - 1) {
          this.sessionData.status = 'completed';
          this.sessionData.current_stage = 'completed';
          this.sessionData.results = this.getDemoResults();
        }
        
        currentAgent++;
        
        if (currentAgent < agents.length) {
          setTimeout(updateProgress, 2000);
        }
      }
    };

    updateProgress();
  }

  private static getDemoResults(): AgentResults {
    return {
      audience: {
        audiences: [
          {
            name: "Tech Enthusiasts",
            demographics: "Ages 25-40, interested in technology and innovation",
            platforms: [
              { platform: "Facebook", reason: "Large user base with detailed targeting" },
              { platform: "Instagram", reason: "Visual content performs well" }
            ]
          },
          {
            name: "Young Professionals",
            demographics: "Ages 22-35, career-focused individuals",
            platforms: [
              { platform: "LinkedIn", reason: "Professional networking platform" },
              { platform: "Twitter", reason: "Real-time engagement and news" }
            ]
          }
        ]
      },
      budget: {
        total_budget: 1000,
        allocations: [
          {
            audience: "Tech Enthusiasts",
            total: 600,
            platforms: [
              { platform: "Facebook", amount: 360, percentage: 60 },
              { platform: "Instagram", amount: 240, percentage: 40 }
            ]
          },
          {
            audience: "Young Professionals",
            total: 400,
            platforms: [
              { platform: "LinkedIn", amount: 240, percentage: 60 },
              { platform: "Twitter", amount: 160, percentage: 40 }
            ]
          }
        ]
      },
      content: [
        {
          id: "demo_ad_1",
          platform: "Facebook",
          ad_type: "image",
          audience: "Tech Enthusiasts",
          content: "🚀 Discover the future of technology with our innovative products! Join thousands of satisfied customers.",
          status: "generated"
        },
        {
          id: "demo_ad_2",
          platform: "Instagram",
          ad_type: "image",
          audience: "Tech Enthusiasts",
          content: "✨ Innovation meets excellence. Experience the difference with our cutting-edge solutions.",
          status: "generated"
        },
        {
          id: "demo_ad_3",
          platform: "LinkedIn",
          ad_type: "text",
          audience: "Young Professionals",
          content: "Advance your career with industry-leading tools. Professional solutions for professional success.",
          status: "generated"
        }
      ],
      analytics: {
        product_cost: 50,
        total_revenue: 2500,
        total_cost: 1000,
        overall_roi: 150,
        platform_metrics: [
          {
            audience: "Tech Enthusiasts",
            platform: "Facebook",
            impressions: 10000,
            clicks: 500,
            redirects: 250,
            conversions: 50,
            likes: 100,
            cost: 360,
            revenue: 1500,
            roi: 316.67,
            ctr: 5.0,
            redirect_rate: 50.0
          },
          {
            audience: "Tech Enthusiasts",
            platform: "Instagram",
            impressions: 8000,
            clicks: 320,
            redirects: 160,
            conversions: 32,
            likes: 80,
            cost: 240,
            revenue: 800,
            roi: 233.33,
            ctr: 4.0,
            redirect_rate: 50.0
          },
          {
            audience: "Young Professionals",
            platform: "LinkedIn",
            impressions: 5000,
            clicks: 150,
            redirects: 75,
            conversions: 15,
            likes: 30,
            cost: 240,
            revenue: 375,
            roi: 56.25,
            ctr: 3.0,
            redirect_rate: 50.0
          }
        ],
        best_performing: "Facebook - Tech Enthusiasts"
      },
      optimization: {
        summary: "Campaign performance analysis shows strong ROI across all platforms with Facebook leading performance.",
        recommendations: [
          "Increase Facebook budget by 20% for Tech Enthusiasts audience",
          "Optimize Instagram content for higher engagement rates",
          "Consider expanding LinkedIn targeting for Young Professionals",
          "Test video content on Instagram for improved performance"
        ],
        budget_changes: [
          {
            audience: "Tech Enthusiasts",
            platform: "Facebook",
            old_amount: 360,
            new_amount: 432,
            change: 72
          },
          {
            audience: "Tech Enthusiasts",
            platform: "Instagram",
            old_amount: 240,
            new_amount: 168,
            change: -72
          }
        ]
      }
    };
  }
}

export default MockApiService;