import { ApiService } from './api';
import type { GeneratedAd } from '../types';

export interface RevisionRequest {
  sessionId: string;
  adId: string;
  originalAd: GeneratedAd;
  feedback: string;
  revisionType: 'content' | 'tone' | 'length' | 'cta' | 'visual' | 'platform' | 'audience' | 'brand';
}

export interface RevisionResponse {
  success: boolean;
  revisedAd?: GeneratedAd;
  revisionId?: string;
  error?: string;
  processingTime?: number;
  revisionSummary?: {
    revision_approach: string;
    key_improvements: string[];
    expected_impact: string;
  };
  comparisonData?: {
    original: GeneratedAd;
    revised: GeneratedAd;
    changes: string[];
  };
}

export interface RevisionHistory {
  revisionId: string;
  timestamp: string;
  feedback: string;
  revisionType: string;
  originalContent: string;
  revisedContent: string;
  status: 'pending' | 'completed' | 'failed';
}

export class ContentRevisionService {
  /**
   * Submits a revision request to the ContentRevisionAgent
   */
  static async submitRevision(request: RevisionRequest): Promise<RevisionResponse> {
    const startTime = Date.now();
    
    try {
      console.log('Submitting revision request:', request);

      // Determine revision type from feedback content
      const revisionType = this.detectRevisionType(request.feedback);

      // Call the advanced revision API endpoint
      const response = await ApiService.submitAdvancedRevision({
        session_id: request.sessionId,
        asset_id: request.adId, // Use asset_id as expected by backend
        feedback: request.feedback,
        revision_type: revisionType
      });

      if (response.success && response.revision_result) {
        const revisionResult = response.revision_result;
        const revisedContent = revisionResult.revised_content;
        
        // Find the specific revised ad for this asset
        const revisedAd = this.findRevisedAdInContent(revisedContent, request.adId, request.originalAd);
        
        // Generate comparison data
        const comparisonData = this.generateComparisonData(request.originalAd, revisedAd);
        
        return {
          success: true,
          revisedAd,
          revisionId: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          processingTime: Date.now() - startTime,
          revisionSummary: revisionResult.summary,
          comparisonData
        };
      } else {
        return {
          success: false,
          error: response.error || 'Revision failed'
        };
      }
    } catch (error: any) {
      console.error('Revision service error:', error);
      return {
        success: false,
        error: error.message || 'Failed to process revision'
      };
    }
  }

  /**
   * Detects the type of revision based on feedback content
   */
  private static detectRevisionType(feedback: string): string {
    const feedbackLower = feedback.toLowerCase();
    
    // Define keywords for different revision types
    const revisionKeywords = {
      tone: ['tone', 'voice', 'formal', 'casual', 'professional', 'friendly', 'urgent', 'conversational'],
      length: ['shorter', 'longer', 'brief', 'expand', 'concise', 'detailed', 'length', 'word count'],
      cta: ['call to action', 'cta', 'button', 'click', 'action', 'compelling', 'stronger'],
      visual: ['color', 'image', 'visual', 'design', 'layout', 'composition', 'graphics', 'video'],
      platform: ['instagram', 'facebook', 'linkedin', 'tiktok', 'platform', 'social media'],
      audience: ['audience', 'target', 'demographic', 'customer', 'user', 'persona'],
      brand: ['brand', 'guidelines', 'voice', 'style', 'messaging', 'identity'],
      content: ['content', 'message', 'copy', 'text', 'wording', 'phrasing']
    };

    // Score each revision type based on keyword matches
    const scores: Record<string, number> = {};
    
    for (const [type, keywords] of Object.entries(revisionKeywords)) {
      scores[type] = keywords.reduce((score, keyword) => {
        return score + (feedbackLower.includes(keyword) ? 1 : 0);
      }, 0);
    }

    // Return the type with the highest score, defaulting to 'content'
    const bestMatch = Object.entries(scores).reduce((best, [type, score]) => {
      return score > best.score ? { type, score } : best;
    }, { type: 'content', score: 0 });

    return bestMatch.type;
  }

  /**
   * Finds the revised ad for a specific asset ID in the revision response
   */
  private static findRevisedAdInContent(revisedContent: any, originalAdId: string, originalAd: GeneratedAd): GeneratedAd {
    // Look for the specific ad in the revised content
    const ads = revisedContent?.ads || [];
    let revisedAdData = ads.find((ad: any) => 
      ad.id === originalAdId || 
      ad.original_id === originalAdId ||
      ad.platform === originalAd.platform && ad.ad_type === originalAd.ad_type
    );

    // If not found, use the first ad or create a default revision
    if (!revisedAdData && ads.length > 0) {
      revisedAdData = ads[0];
    }

    return this.mapRevisedContent(revisedAdData || {}, originalAd);
  }

  /**
   * Maps the revised content from API response to GeneratedAd format
   */
  private static mapRevisedContent(revisedContent: any, originalAd: GeneratedAd): GeneratedAd {
    return {
      ...originalAd,
      id: `${originalAd.id}_rev_${Date.now()}`,
      content: revisedContent.content || revisedContent.text || originalAd.content,
      s3_uri: revisedContent.s3_uri || revisedContent.media_url || originalAd.s3_uri,
      status: 'revised',
      // Preserve original metadata
      platform: originalAd.platform,
      ad_type: originalAd.ad_type,
      audience: originalAd.audience,
      tools_used: [...(originalAd.tools_used || []), 'ContentRevisionAgent'],
      // Add revision metadata
      revision_metadata: {
        original_id: originalAd.id,
        revision_timestamp: new Date().toISOString(),
        revision_type: this.detectRevisionType(revisedContent.revision_notes || ''),
        improvements: revisedContent.improvements || []
      }
    };
  }

  /**
   * Generates comparison data between original and revised ads
   */
  private static generateComparisonData(originalAd: GeneratedAd, revisedAd: GeneratedAd): {
    original: GeneratedAd;
    revised: GeneratedAd;
    changes: string[];
  } {
    const changes: string[] = [];

    // Compare content
    if (originalAd.content !== revisedAd.content) {
      changes.push('Content text updated');
    }

    // Compare S3 URIs (for media changes)
    if (originalAd.s3_uri !== revisedAd.s3_uri) {
      changes.push('Media content updated');
    }

    // Compare tools used
    const originalTools = originalAd.tools_used || [];
    const revisedTools = revisedAd.tools_used || [];
    if (revisedTools.length > originalTools.length) {
      changes.push('Additional generation tools used');
    }

    // Add generic change if no specific changes detected
    if (changes.length === 0) {
      changes.push('Content optimized based on feedback');
    }

    return {
      original: originalAd,
      revised: revisedAd,
      changes
    };
  }

  /**
   * Validates revision feedback for completeness and clarity
   */
  static validateFeedback(feedback: string): { isValid: boolean; suggestions?: string[] } {
    const trimmedFeedback = feedback.trim();
    
    if (trimmedFeedback.length < 10) {
      return {
        isValid: false,
        suggestions: ['Please provide more detailed feedback (at least 10 characters)']
      };
    }

    if (trimmedFeedback.length > 1000) {
      return {
        isValid: false,
        suggestions: ['Please keep feedback under 1000 characters for better processing']
      };
    }

    const suggestions: string[] = [];
    
    // Check for specific improvement areas
    if (!this.containsSpecificRequest(trimmedFeedback)) {
      suggestions.push('Consider being more specific about what needs to change');
    }
    
    if (!this.containsReasoning(trimmedFeedback)) {
      suggestions.push('Explain why the change is needed for better results');
    }

    return {
      isValid: true,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  /**
   * Checks if feedback contains specific actionable requests
   */
  private static containsSpecificRequest(feedback: string): boolean {
    const specificWords = [
      'change', 'modify', 'adjust', 'improve', 'make', 'add', 'remove', 
      'replace', 'update', 'enhance', 'fix', 'correct', 'revise'
    ];
    
    return specificWords.some(word => 
      feedback.toLowerCase().includes(word)
    );
  }

  /**
   * Checks if feedback contains reasoning or explanation
   */
  private static containsReasoning(feedback: string): boolean {
    const reasoningWords = [
      'because', 'since', 'as', 'due to', 'reason', 'why', 'so that',
      'in order to', 'to ensure', 'for better', 'to improve'
    ];
    
    return reasoningWords.some(phrase => 
      feedback.toLowerCase().includes(phrase)
    );
  }

  /**
   * Generates revision suggestions based on ad type and platform
   */
  static generateRevisionSuggestions(ad: GeneratedAd): string[] {
    const suggestions: string[] = [];
    
    // Platform-specific suggestions
    switch (ad.platform?.toLowerCase()) {
      case 'instagram':
        suggestions.push('Consider adding more visual appeal and hashtags');
        suggestions.push('Make it more lifestyle-focused and authentic');
        break;
      case 'linkedin':
        suggestions.push('Focus on professional benefits and ROI');
        suggestions.push('Use industry-specific language and metrics');
        break;
      case 'facebook':
        suggestions.push('Add emotional appeal and social proof');
        suggestions.push('Consider family or community benefits');
        break;
      case 'tiktok':
        suggestions.push('Make it more trendy and engaging');
        suggestions.push('Focus on entertainment value and quick hooks');
        break;
    }

    // Ad type specific suggestions
    switch (ad.ad_type) {
      case 'text_ad':
        suggestions.push('Strengthen the call-to-action');
        suggestions.push('Add more compelling benefits');
        break;
      case 'image_ad':
        suggestions.push('Improve visual composition and colors');
        suggestions.push('Ensure text overlay is readable');
        break;
      case 'video_ad':
        suggestions.push('Optimize for mobile viewing');
        suggestions.push('Add captions for accessibility');
        break;
    }

    return suggestions;
  }

  /**
   * Estimates revision processing time based on complexity
   */
  static estimateRevisionTime(feedback: string, adType: string): number {
    let baseTime = 30; // 30 seconds base time
    
    // Add time based on feedback complexity
    const wordCount = feedback.split(' ').length;
    baseTime += Math.min(wordCount * 2, 60); // Max 60 seconds for word count
    
    // Add time based on ad type
    switch (adType) {
      case 'video_ad':
        baseTime += 120; // 2 minutes for video
        break;
      case 'image_ad':
        baseTime += 60; // 1 minute for image
        break;
      case 'text_ad':
        baseTime += 30; // 30 seconds for text
        break;
    }
    
    return baseTime;
  }

  /**
   * Tracks revision history for analytics
   */
  static trackRevisionHistory(
    adId: string, 
    feedback: string, 
    revisionType: string
  ): RevisionHistory {
    return {
      revisionId: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      feedback,
      revisionType,
      originalContent: '', // Would be filled from actual ad content
      revisedContent: '', // Would be filled after revision
      status: 'pending'
    };
  }

  /**
   * Checks if all ads in a campaign are approved for workflow progression
   */
  static checkWorkflowProgression(
    generatedAds: GeneratedAd[], 
    approvalStatus: Record<string, any>
  ): {
    canProceed: boolean;
    totalAds: number;
    approvedAds: number;
    pendingAds: number;
    revisingAds: number;
    blockers: string[];
  } {
    const totalAds = generatedAds.length;
    let approvedAds = 0;
    let pendingAds = 0;
    let revisingAds = 0;
    const blockers: string[] = [];

    generatedAds.forEach(ad => {
      const status = approvalStatus[ad.id]?.status || 'pending';
      
      switch (status) {
        case 'approved':
          approvedAds++;
          break;
        case 'pending':
          pendingAds++;
          blockers.push(`Ad ${ad.id} (${ad.platform}) awaiting review`);
          break;
        case 'revision_requested':
        case 'revising':
          revisingAds++;
          blockers.push(`Ad ${ad.id} (${ad.platform}) under revision`);
          break;
      }
    });

    return {
      canProceed: approvedAds === totalAds && totalAds > 0,
      totalAds,
      approvedAds,
      pendingAds,
      revisingAds,
      blockers
    };
  }

  /**
   * Processes batch revisions for multiple ads
   */
  static async submitBatchRevisions(
    requests: RevisionRequest[]
  ): Promise<RevisionResponse[]> {
    const results: RevisionResponse[] = [];
    
    // Process revisions sequentially to avoid overwhelming the backend
    for (const request of requests) {
      try {
        const result = await this.submitRevision(request);
        results.push(result);
        
        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          success: false,
          error: `Batch revision failed for ad ${request.adId}: ${error}`
        });
      }
    }
    
    return results;
  }
}

export default ContentRevisionService;