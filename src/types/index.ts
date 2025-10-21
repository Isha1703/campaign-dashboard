// Campaign Data Types
export interface CampaignStartRequest {
  product: string;
  product_cost: number;
  budget: number;
}

export interface ContentApprovalRequest {
  session_id: string;
  ad_id: string;
  action: "approve" | "revise";
  feedback?: string;
}

export interface AgentExecutionResponse {
  session_id: string;
  current_agent: string;
  stage: string;
  progress: number;
  outputs: string[];
  results?: AgentResults;
}

export interface S3MediaRequest {
  s3_uri: string;
  media_type: "image" | "video";
  download_path: string;
}

// S3MediaHandler specific types
export interface S3MediaHandlerProps {
  s3Uri: string;
  mediaType: 'image' | 'video';
  adId: string;
  className?: string;
  onDownloadComplete?: (localUrl: string) => void;
  onDownloadError?: (error: string) => void;
  enableCaching?: boolean;
}

export interface S3DownloadProgress {
  isDownloading: boolean;
  progress: number;
  error: string | null;
  localUrl: string | null;
  cached: boolean;
}

export interface S3CacheEntry {
  localUrl: string;
  timestamp: number;
  s3Uri: string;
  mediaType: 'image' | 'video';
}

export interface S3MediaCacheStats {
  size: number;
  entries: S3CacheEntry[];
}

// UI State Types
export interface ProfessionalDashboardState {
  sessionId: string | null;
  currentTab: string;
  workflowStage: string;
  campaignProgress: number;
  tabAccessibility: TabAccessibility;
  navigationGuidance: NavigationGuidance;
  campaignData: CampaignData | null;
}

export interface CampaignData {
  product: string;
  product_cost: number;
  budget: number;
  audiences?: AudienceAnalysis;
  budgetAllocation?: BudgetAllocation;
  generatedAds?: GeneratedAd[];
  approvalStatus?: ApprovalStatus;
  performanceMetrics?: CalculatedMetrics[];
  analytics?: PerformanceAnalysis;
  optimization?: OptimizationDecision;
}

export interface TabAccessibility {
  home: boolean;
  monitoring: boolean;
  audience: boolean;
  content: boolean;
  analytics: boolean;
  optimization: boolean;
}

export interface NavigationGuidance {
  nextRecommendedTab: string;
  currentStageMessage: string;
  progressPercentage: number;
  completedStages: string[];
}

export interface ApprovalStatus {
  [adId: string]: {
    status: "pending" | "approved" | "revision_requested" | "revising" | "revision_ready";
    feedback?: string;
    revisionHistory: RevisionEntry[];
  };
}

export interface RevisionEntry {
  timestamp: string;
  feedback: string;
  revisedContent: GeneratedAd;
}

// Agent Result Types
export interface AgentResults {
  audience?: AudienceAnalysis;
  budget?: BudgetAllocation;
  content?: GeneratedAd[];
  analytics?: PerformanceAnalysis;
  optimization?: OptimizationDecision;
}

export interface AudienceAnalysis {
  audiences: Array<{
    name: string;
    demographics: string;
    platforms: Array<{
      platform: string;
      reason: string;
    }>;
  }>;
}

export interface BudgetAllocation {
  total_budget: number;
  allocations: Array<{
    audience: string;
    total: number;
    platforms: Array<{
      platform: string;
      amount: number;
      percentage: number;
    }>;
  }>;
}

export interface GeneratedAd {
  id: string;
  asset_id?: string;
  platform: string;
  ad_type: string;
  audience?: string;
  tools_used?: string[];
  content?: string;
  s3_uri?: string;
  media_type?: "image" | "video";
  status?: string;
  revision_metadata?: {
    original_id: string;
    revision_timestamp: string;
    revision_type: string;
    improvements: string[];
  };
}

export interface CalculatedMetrics {
  audience: string;
  platform: string;
  impressions: number;
  clicks: number;
  redirects: number;
  conversions: number;
  likes: number;
  cost: number;
  revenue: number;
  roi: number;
  ctr: number;
  redirect_rate: number;
}

export interface PerformanceAnalysis {
  product_cost: number;
  total_revenue: number;
  total_cost: number;
  overall_roi: number;
  platform_metrics: CalculatedMetrics[];
  best_performing: string;
}

export interface OptimizationDecision {
  summary: string;
  recommendations: string[];
  budget_changes: BudgetChange[];
}

export interface BudgetChange {
  audience: string;
  platform: string;
  old_amount: number;
  new_amount: number;
  change: number;
}

// Session Progress Types
export interface SessionProgress {
  session_id: string;
  started_at: string;
  agents_completed: string[];
  current_stage: string;
  progress_percentage: number;
  status: 'running' | 'completed' | 'error';
  last_updated: string;
  error_message?: string;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'agent_output' | 'progress_update' | 'error' | 'status_change';
  session_id: string;
  timestamp: string;
  data: any;
}

// Error Handling Types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}