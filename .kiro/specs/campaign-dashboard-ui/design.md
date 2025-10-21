# Design Document

## Overview

The Campaign Dashboard UI is a professional-grade multi-tab web application that provides a comprehensive interface for managing marketing campaigns powered by AWS AgentCore multi-agent framework with MCP (Model Context Protocol) integration. The UI operates as a deployable web application that communicates with simple_dashboard_server.py, which orchestrates the execution of agents from market_campaign.py through the AgentCore gateway.

The system follows a modern web architecture with real-time monitoring, S3 media integration, approval workflows, and guided navigation. The application provides five main tabs: Home (campaign setup), Real-Time Monitoring (agent execution), Audience Analysis (demographics and budget), Content Generation (ad review and approval), Analytics (performance metrics), and Optimization (budget reallocation recommendations).

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Professional Dashboard UI                       │
│            (Deployable Web Application)                     │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────────┐    │
│  │  Home   │Monitor  │Audience │Content  │Analytics/Opt│    │
│  │  Tab    │  Tab    │  Tab    │  Tab    │    Tabs     │    │
│  └─────────┴─────────┴─────────┴─────────┴─────────────┘    │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTP API calls
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              simple_dashboard_server.py                      │
│              (FastAPI Backend Server)                       │
└───────────────────┬─────────────────────────────────────────┘
                    │ execute_real_agents()
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              market_campaign.py                             │
│    (AudienceAgent, BudgetAgent, PromptAgent,               │
│     ContentGenerationAgent, ContentRevisionAgent,          │
│     AnalyticsAgent, OptimizationAgent)                     │
└───────────────────┬─────────────────────────────────────────┘
                    │ MCP Integration
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              AgentCore Gateway                              │
│        (Nova Canvas, Nova Reel, S3 Storage)                │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

The Professional Dashboard UI will be structured with the following component hierarchy:

```
ProfessionalDashboard (Root)
├── NavigationHeader (Tab Navigation with Progress Indicators)
├── WorkflowGuide (Visual Navigation Pointers)
├── TabContainer
│   ├── HomeTab (Campaign Setup Form)
│   ├── MonitoringTab (Real-time Agent Execution)
│   ├── AudienceTab (Demographics & Budget Distribution)
│   ├── ContentTab (Ad Review & Approval Workflow)
│   ├── AnalyticsTab (Performance Metrics Display)
│   └── OptimizationTab (Budget Reallocation)
├── S3MediaHandler (Image/Video Download & Display)
├── ApprovalWorkflow (Content Review System)
├── LoadingIndicators (Progress & Status Display)
└── DeploymentManager (Deployable Link Creation)
```

## Components and Interfaces

### 1. ProfessionalDashboard (Root Component)

**Purpose:** Main container component that manages global state, workflow progression, and orchestrates the professional campaign dashboard experience.

**State Management:**
- Campaign session data and workflow stage tracking
- Real-time agent execution status and outputs
- Content approval states and revision history
- Performance analytics and optimization data
- Navigation guidance and tab accessibility

**Key Methods:**
- `startCampaign(product, cost, budget)` - Initiates campaign via simple_dashboard_server.py
- `monitorAgentExecution()` - Tracks real-time agent progress and outputs
- `handleContentApproval(adId, action, feedback)` - Manages approval/revision workflow
- `downloadS3Media(s3Uri, type)` - Handles S3 file downloads with progress indicators
- `updateWorkflowGuidance()` - Updates navigation pointers and tab accessibility

### 2. NavigationHeader Component

**Purpose:** Professional tab navigation with workflow progress indicators and visual guidance.

**Props:**
- `currentTab: string` - Currently active tab
- `workflowStage: string` - Current campaign stage
- `tabAccessibility: object` - Which tabs are accessible based on workflow progress
- `onTabChange: (tabId) => void` - Tab switching handler

**Features:**
- Five main tabs: Home, Monitoring, Audience, Content, Analytics, Optimization
- Visual progress indicators showing completion status
- Workflow guidance pointers indicating next recommended tab
- Disabled state management for tabs not yet accessible

### 3. WorkflowGuide Component

**Purpose:** Visual navigation guidance system that helps users understand workflow progression.

**Props:**
- `currentStage: string` - Current workflow stage
- `nextRecommendedTab: string` - Next tab user should visit
- `completedStages: string[]` - Array of completed workflow stages

**Features:**
- Dynamic visual pointers (arrows, highlights, badges)
- Progress breadcrumbs showing campaign progression
- Contextual messages like "Next: Review Content" or "Ready: View Analytics"
- Workflow completion percentage display

### 4. HomeTab Component

**Purpose:** Professional campaign setup form with enhanced user experience and validation.

**Props:**
- `onCampaignStart: (data) => void` - Callback for "Start Campaign" button
- `isLoading: boolean` - Loading state during campaign initialization

**Features:**
- Professional form design with clear field labels and validation
- Input fields: product description, product cost, campaign budget
- Enhanced "Start Campaign" button with loading animations
- Real-time form validation with helpful error messages
- Campaign parameter preview and confirmation dialog

### 5. MonitoringTab Component

**Purpose:** Real-time agent execution monitoring with live outputs and progress tracking.

**Props:**
- `agentOutputs: object[]` - Live agent execution outputs and logs
- `currentAgent: string` - Currently executing agent
- `campaignProgress: number` - Overall campaign completion percentage
- `agentStatuses: object` - Status of each agent (pending, running, completed, failed)

**Features:**
- Live streaming of agent outputs and execution logs
- Visual progress bars for each agent and overall campaign
- Real-time status indicators for AudienceAgent, BudgetAgent, PromptAgent, ContentGenerationAgent
- Execution timeline showing agent completion order
- Error handling and retry mechanisms for failed agents

### 6. AudienceTab Component

**Purpose:** Displays audience analysis results and budget distribution with professional visualizations.

**Props:**
- `audienceData: object` - AudienceAgent output with name, demographics, platforms
- `budgetAllocation: object` - BudgetAgent output with total_budget and allocations
- `isLoading: boolean` - Loading state while agents execute

**Features:**
- Structured display of target audience groups with demographics and platform reasoning
- Interactive budget distribution diagram showing amount and percentage splits
- Platform-specific allocation visualization (Instagram, Facebook, LinkedIn, TikTok, etc.)
- Responsive design for different screen sizes
- Export functionality for audience and budget data

### 7. ContentTab Component

**Purpose:** Individual ad windows with S3 media integration and approval/revision workflow.

**Props:**
- `generatedAds: object[]` - Array of generated ads from ContentGenerationAgent
- `onApproval: (adId, action, feedback) => void` - Approval/revision callback
- `revisionStatus: object` - Status of any ongoing revisions

**Features:**
- Individual windows for each generated ad showing platform, type, and tools used
- S3 media download and display with loading indicators ("retrieving the video/image")
- Text ad content display for text_ad types
- Image/video player for media ads downloaded from S3 URIs
- Approve/Revise buttons under each ad with feedback input modal
- ContentRevisionAgent integration for ad improvements
- Workflow progression blocking until all ads are approved

### 8. AnalyticsTab Component

**Purpose:** Interactive performance metrics display with comprehensive analytics visualization.

**Props:**
- `performanceMetrics: object[]` - CalculatedMetrics for each ad
- `performanceAnalysis: object` - PerformanceAnalysis from AnalyticsAgent
- `isAnalyzing: boolean` - Loading state during analytics execution

**Features:**
- Individual interactive boxes for each ad showing audience, platform, impressions, clicks, redirects, conversions, likes, cost, revenue, roi, ctr, redirect_rate
- Performance analysis display with product_cost, total_revenue, total_cost, overall_roi, platform_metrics, best_performing
- Color-coded performance indicators (green for high ROI, red for low performance)
- Interactive charts and graphs for performance visualization
- Comparison tools for analyzing performance across platforms and audiences

### 9. OptimizationTab Component

**Purpose:** Budget reallocation recommendations with forecasted ROI improvements.

**Props:**
- `optimizationDecision: object` - OptimizationDecision from OptimizationAgent
- `budgetChanges: object[]` - BudgetChange array with old_amount, new_amount, change
- `isOptimizing: boolean` - Loading state during optimization execution

**Features:**
- Budget reallocation visualization showing old vs new amounts for each audience/platform
- OptimizationDecision display with summary, recommendations, and budget_changes
- Forecasted ROI improvements and reasoning for each budget change
- Interactive budget adjustment sliders for manual fine-tuning
- Summary of expected performance improvements from optimization

### 10. S3MediaHandler Component

**Purpose:** Handles S3 file downloads and media display with proper loading states.

**Props:**
- `s3Uri: string` - S3 URI from ContentGenerationAgent output
- `mediaType: string` - Type of media (image, video)
- `onDownloadComplete: (localPath) => void` - Callback when download completes

**Features:**
- AWS S3 cp command execution for file downloads
- Loading indicators with "retrieving the video/image" messages
- Progress tracking for large file downloads
- Error handling and retry mechanisms for failed downloads
- Local caching to avoid repeated downloads
- Media player integration for downloaded content

### 11. ApprovalWorkflow Component

**Purpose:** Manages the content approval and revision workflow system.

**Props:**
- `ads: object[]` - Array of generated ads requiring approval
- `onApprovalAction: (adId, action, feedback) => void` - Approval/revision handler
- `revisionAgent: function` - ContentRevisionAgent integration

**Features:**
- Individual approval status tracking for each ad
- Feedback input modal with rich text editing capabilities
- ContentRevisionAgent integration for generating improved ads
- Workflow progression control (blocks Analytics until all approved)
- Revision history tracking and comparison tools
- Bulk approval options for efficient workflow management

### 12. DeploymentManager Component

**Purpose:** Handles the creation and management of deployable links for the professional UI.

**Props:**
- `applicationConfig: object` - Configuration for deployment
- `onDeploymentComplete: (deploymentUrl) => void` - Callback with deployment URL

**Features:**
- Automated deployment pipeline integration
- Deployable link generation with custom domains
- Environment configuration management
- Health check monitoring for deployed application
- Rollback capabilities for failed deployments
- Integration testing for deployed instances

## Data Models

### API Communication Models

```typescript
interface CampaignStartRequest {
  product: string;
  product_cost: number;
  budget: number;
}

interface ContentApprovalRequest {
  session_id: string;
  ad_id: string;
  action: "approve" | "revise";
  feedback?: string;
}

interface AgentExecutionResponse {
  session_id: string;
  current_agent: string;
  stage: string;
  progress: number;
  outputs: string[];
  results?: AgentResults;
}

interface S3MediaRequest {
  s3_uri: string;
  media_type: "image" | "video";
  download_path: string;
}
```

### UI State Models

```typescript
interface ProfessionalDashboardState {
  sessionId: string | null;
  currentTab: string;
  workflowStage: string;
  campaignProgress: number;
  tabAccessibility: TabAccessibility;
  navigationGuidance: NavigationGuidance;
  campaignData: CampaignData | null;
}

interface CampaignData {
  product: string;
  product_cost: number;
  budget: number;
  audiences: AudienceAnalysis;
  budgetAllocation: BudgetAllocation;
  generatedAds: GeneratedAd[];
  approvalStatus: ApprovalStatus;
  performanceMetrics: CalculatedMetrics[];
  analytics: PerformanceAnalysis;
  optimization: OptimizationDecision;
}

interface TabAccessibility {
  home: boolean;
  monitoring: boolean;
  audience: boolean;
  content: boolean;
  analytics: boolean;
  optimization: boolean;
}

interface NavigationGuidance {
  nextRecommendedTab: string;
  currentStageMessage: string;
  progressPercentage: number;
  completedStages: string[];
}

interface ApprovalStatus {
  [adId: string]: {
    status: "pending" | "approved" | "revision_requested" | "revising";
    feedback?: string;
    revisionHistory: RevisionEntry[];
  };
}

interface RevisionEntry {
  timestamp: string;
  feedback: string;
  revisedContent: GeneratedAd;
}
```

## Error Handling

### API Error Handling
- Network connectivity errors
- AWS authentication failures
- AgentCore service errors
- Invalid response format handling
- Timeout management for long-running operations

### UI Error Handling
- Form validation errors
- Component error boundaries
- Graceful degradation for missing data
- User-friendly error messages
- Retry mechanisms for failed operations

### Video-Specific Error Handling
- S3 access errors
- Video generation timeouts
- Unsupported video formats
- Network issues during video streaming

## Testing Strategy

### Unit Testing
- Component rendering tests
- State management logic tests
- API call mocking and testing
- Form validation testing
- Error handling verification

### Integration Testing
- End-to-end campaign workflow testing
- API integration testing with mock responses
- Video generation and display testing
- Tab navigation and state persistence testing

### User Acceptance Testing
- Campaign creation workflow validation
- Content review and approval process testing
- Performance metrics display verification
- Video generation progress tracking validation

## Technical Implementation Details

### Deployment Architecture
- Professional web application with deployable link generation
- FastAPI backend integration with simple_dashboard_server.py
- React frontend with modern component architecture
- Docker containerization for consistent deployment
- CI/CD pipeline for automated deployment and updates

### Agent Integration
- HTTP API communication with simple_dashboard_server.py
- Real-time WebSocket connections for agent monitoring
- JSON file polling for agent results and progress
- market_campaign.py agent orchestration integration
- MCP gateway integration for content generation tools

### S3 Media Handling
- AWS S3 cp command integration for file downloads
- Progress tracking with loading indicators
- Local file caching and management
- Video/image player components with fallback handling
- Secure S3 URI processing and validation

### Real-Time Monitoring
- WebSocket connections for live agent output streaming
- Server-sent events for progress updates
- Real-time status indicators and progress bars
- Agent execution timeline and logging
- Error handling and retry mechanisms

### Workflow Management
- State-driven tab accessibility control
- Approval workflow progression enforcement
- ContentRevisionAgent integration for ad improvements
- Navigation guidance system with visual pointers
- Workflow completion tracking and validation

### Professional UI Framework
- Modern CSS framework (Tailwind CSS or Material-UI)
- Responsive design with mobile-first approach
- Professional color scheme and typography
- Interactive animations and transitions
- Accessibility compliance (WCAG 2.1 AA)

### Performance Optimization
- Lazy loading for tab content
- Image/video optimization and compression
- Efficient state management with minimal re-renders
- Caching strategies for API responses
- Bundle optimization for fast loading times

## Security Considerations

### AWS Security
- IAM role-based access control
- Secure credential handling
- API endpoint validation
- Request/response sanitization

### Data Security
- Sensitive data handling in UI state
- Secure transmission of campaign data
- Input validation and sanitization
- XSS prevention measures

### Video Security
- S3 bucket access controls
- Secure video URL generation
- Content validation for generated videos
- Access logging and monitoring