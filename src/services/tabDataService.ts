/**
 * Unified data loading service for all dashboard tabs
 * Loads data once per tab and caches it to prevent repeated API calls
 */

import { ApiService } from './api';

interface TabData {
  audiences?: any;
  budget?: any;
  prompts?: any;
  content?: any;
  analytics?: any;
}

class TabDataService {
  private cache: Map<string, TabData> = new Map();
  private loadingStates: Map<string, boolean> = new Map();

  /**
   * Load all data for a session once and cache it
   */
  async loadSessionData(sessionId: string): Promise<TabData> {
    if (this.cache.has(sessionId)) {
      // Returning cached data (removed excessive logging)
      return this.cache.get(sessionId)!;
    }

    if (this.loadingStates.get(sessionId)) {
      // Already loading data (removed excessive logging)
      return {};
    }

    this.loadingStates.set(sessionId, true);
    // Loading fresh data (removed excessive logging)

    try {
      const [audienceResult, budgetResult, promptResult, contentResult] = await Promise.allSettled([
        ApiService.getAgentResult(sessionId, 'AudienceAgent'),
        ApiService.getAgentResult(sessionId, 'BudgetAgent'),
        ApiService.getAgentResult(sessionId, 'PromptAgent'),
        ApiService.getAgentResult(sessionId, 'ContentGenerationAgent')
      ]);

      const tabData: TabData = {
        audiences: audienceResult.status === 'fulfilled' ? this.extractAudienceData(audienceResult.value) : null,
        budget: budgetResult.status === 'fulfilled' ? this.extractBudgetData(budgetResult.value) : null,
        prompts: promptResult.status === 'fulfilled' ? this.extractPromptData(promptResult.value) : null,
        content: contentResult.status === 'fulfilled' ? this.extractContentData(contentResult.value) : null
      };

      this.cache.set(sessionId, tabData);
      // Cached data (removed excessive logging)
      
      return tabData;
    } catch (error) {
      console.error('Error loading session data:', error);
      return {};
    } finally {
      this.loadingStates.set(sessionId, false);
    }
  }

  /**
   * Get specific tab data
   */
  async getTabData(sessionId: string, tabType: 'audiences' | 'budget' | 'prompts' | 'content'): Promise<any> {
    const sessionData = await this.loadSessionData(sessionId);
    return sessionData[tabType] || null;
  }

  /**
   * Clear cache for a session (useful when starting a new campaign)
   */
  clearSessionCache(sessionId: string): void {
    this.cache.delete(sessionId);
    this.loadingStates.delete(sessionId);
    console.log('Cleared cache for session:', sessionId);
  }

  /**
   * Extract and format audience data from API response
   */
  private extractAudienceData(apiResponse: any): any {
    // API returns: {success, session_id, agent, data: {agent, timestamp, result}}
    const result = apiResponse?.data?.data?.result || apiResponse?.data?.result;
    if (!result?.audiences) {
      console.warn('No audience data found in API response', apiResponse);
      return null;
    }

    const audiences = result.audiences;
    return {
      audiences: audiences.map((audience: any) => ({
        name: audience.name,
        demographics: audience.demographics,
        platforms: audience.platforms || []
      }))
    };
  }

  /**
   * Extract and format budget data from API response
   */
  private extractBudgetData(apiResponse: any): any {
    const result = apiResponse?.data?.data?.result || apiResponse?.data?.result;
    if (!result) {
      console.warn('No budget data found in API response', apiResponse);
      return null;
    }

    const budgetData = result;
    return {
      total_budget: budgetData.total_budget || 0,
      allocations: budgetData.allocations || []
    };
  }

  /**
   * Extract and format prompt data from API response
   */
  private extractPromptData(apiResponse: any): any {
    const result = apiResponse?.data?.data?.result || apiResponse?.data?.result;
    if (!result?.audience_prompts) {
      console.warn('No prompt data found in API response', apiResponse);
      return null;
    }

    return {
      audience_prompts: result.audience_prompts
    };
  }

  /**
   * Extract and format content data from API response
   */
  private extractContentData(apiResponse: any): any {
    const result = apiResponse?.data?.data?.result || apiResponse?.data?.result;
    if (!result?.ads) {
      console.warn('No content data found in API response', apiResponse);
      return null;
    }

    const ads = result.ads;
    return {
      ads: ads,
      summary: {
        total_ads: ads.length,
        by_type: this.groupBy(ads, 'ad_type'),
        by_platform: this.groupBy(ads, 'platform'),
        by_audience: this.groupBy(ads, 'audience')
      }
    };
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
   * Get cache status for debugging
   */
  getCacheStatus(): { sessions: string[], loadingStates: Record<string, boolean> } {
    return {
      sessions: Array.from(this.cache.keys()),
      loadingStates: Object.fromEntries(this.loadingStates)
    };
  }
}

// Export singleton instance
export const tabDataService = new TabDataService();
export default tabDataService;