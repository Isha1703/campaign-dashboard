# API Client Integration Documentation

This directory contains the complete backend API integration for the Campaign Dashboard UI, implementing task 2.1 from the specification.

## Overview

The API client integration provides:
- HTTP API communication with `simple_dashboard_server.py`
- Real-time agent output streaming using Server-Sent Events (SSE)
- JSON file polling for agent results and progress tracking
- Comprehensive error handling and retry mechanisms
- Unified interface for all backend operations

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              ApiClient (Unified Interface)          │    │
│  └─────────────────────────────────────────────────────┘    │
│           │              │              │                   │
│           ▼              ▼              ▼                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ ApiService  │ │ StreamService│ │PollingService│          │
│  │ (HTTP API)  │ │    (SSE)     │ │ (JSON Poll) │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (simple_dashboard_server.py)           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                FastAPI Endpoints                    │    │
│  │  • /api/campaign/start                             │    │
│  │  • /api/campaign/feedback                          │    │
│  │  • /api/session/{id}/stream (SSE)                 │    │
│  │  • /api/session/{id}/results (JSON)               │    │
│  │  • /api/download-s3-content                        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Core Services

### 1. ApiService (`api.ts`)

Handles direct HTTP communication with the backend server.

**Key Features:**
- Campaign management (start, feedback, revision)
- Session data retrieval
- S3 media download
- Health checks and testing
- Automatic retry logic with exponential backoff
- Comprehensive error handling

**Main Methods:**
```typescript
// Campaign operations
ApiService.startCampaign(campaignData)
ApiService.submitContentApproval(approvalData)
ApiService.submitAdvancedRevision(revisionData)

// Session operations
ApiService.getSessionData(sessionId)
ApiService.pollAgentResults(sessionId)
ApiService.getSessionProgress(sessionId)

// Media operations
ApiService.downloadS3Media(mediaRequest)

// System operations
ApiService.healthCheck()
ApiService.testConnection()
```

### 2. RealTimeStreamService (`websocket.ts`)

Manages real-time communication using Server-Sent Events (SSE).

**Key Features:**
- Real-time agent output streaming
- Automatic reconnection with exponential backoff
- Message type filtering and routing
- Connection status monitoring

**Usage:**
```typescript
const streamService = new RealTimeStreamService();

// Connect to session stream
await streamService.connect(sessionId);

// Subscribe to agent outputs
streamService.subscribe('agent_output', (message) => {
  console.log('Agent output:', message.data.output);
});

// Subscribe to progress updates
streamService.subscribe('progress_update', (message) => {
  console.log('Progress:', message.data);
});
```

### 3. PollingService (`polling.ts`)

Handles periodic polling of JSON files for agent results and progress.

**Key Features:**
- Configurable polling intervals
- Change detection to avoid unnecessary updates
- Automatic retry with backoff
- Parallel polling of multiple endpoints

**Usage:**
```typescript
const pollingService = new PollingService({
  interval: 2000, // Poll every 2 seconds
  maxRetries: 5
});

pollingService.startPolling(sessionId, {
  onResults: (results) => console.log('New results:', results),
  onProgress: (progress) => console.log('Progress update:', progress),
  onError: (error) => console.error('Polling error:', error)
});
```

### 4. ErrorHandler (`errorHandler.ts`)

Centralized error handling and user-friendly error messages.

**Key Features:**
- Error normalization and categorization
- User-friendly error messages
- Error logging and context tracking
- Retry-ability detection

**Usage:**
```typescript
import { ErrorUtils } from './errorHandler';

try {
  await ApiService.startCampaign(data);
} catch (error) {
  const apiError = ErrorUtils.handleCampaignError(error, sessionId);
  // Display user-friendly error message
  showError(errorHandler.getUserMessage(apiError));
}
```

### 5. ApiClient (`apiClient.ts`)

Unified interface that orchestrates all services.

**Key Features:**
- Single entry point for all API operations
- Automatic service coordination
- Callback-based event handling
- Connection management

**Usage:**
```typescript
import { apiClient } from './services/apiClient';

// Initialize with callbacks
apiClient.initialize({
  onAgentOutput: (output) => console.log('Agent:', output),
  onProgressUpdate: (progress) => updateProgress(progress),
  onResultsUpdate: (results) => updateResults(results),
  onError: (error) => showError(error.message)
});

// Start campaign
const response = await apiClient.startCampaign({
  product: 'EcoSmart Water Bottle',
  product_cost: 29.99,
  budget: 5000
});

// The client automatically handles:
// - Real-time streaming connection
// - Polling setup
// - Error handling
// - Progress tracking
```

## Backend API Endpoints

The integration supports all endpoints from `simple_dashboard_server.py`:

### Campaign Management
- `POST /api/campaign/start` - Start new campaign
- `POST /api/campaign/feedback` - Submit content approval/revision
- `POST /api/campaign/advanced-revision` - Advanced content revision

### Session Management
- `GET /api/session/{session_id}` - Get session data
- `GET /api/session/{session_id}/results` - Get all agent results
- `GET /api/session/{session_id}/progress` - Get session progress
- `GET /api/session/{session_id}/agent/{agent_name}` - Get specific agent result
- `GET /api/session/{session_id}/output` - Get agent outputs
- `GET /api/session/{session_id}/stream` - SSE stream for real-time updates

### Media Management
- `POST /api/download-s3-content` - Download S3 media files

### System
- `GET /health` - Health check
- `GET /test` - Connection test
- `GET /api/sessions` - List all sessions

## Error Handling

The integration includes comprehensive error handling:

### Error Types
- **Network Errors**: Connection failures, timeouts
- **API Errors**: 4xx/5xx HTTP responses
- **Validation Errors**: Invalid request data
- **Stream Errors**: SSE connection issues
- **Polling Errors**: JSON file access issues

### Retry Logic
- Automatic retry for network and server errors
- Exponential backoff with configurable limits
- Different retry strategies for different operations
- Graceful degradation when services fail

### User-Friendly Messages
```typescript
const errorMessages = {
  'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
  'CAMPAIGN_START_ERROR': 'Failed to start campaign. Please check your inputs.',
  'S3_DOWNLOAD_ERROR': 'Failed to download media content. Please try again.',
  // ... more mappings
};
```

## Real-Time Communication

### Server-Sent Events (SSE)
The backend provides real-time updates via SSE at `/api/session/{session_id}/stream`:

```typescript
// Automatic SSE connection
const eventSource = ApiService.createEventSource(sessionId);

eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle real-time updates
};
```

### JSON File Polling
Fallback mechanism that polls JSON files for updates:

```typescript
// Polls multiple endpoints
const results = await ApiService.pollAgentResults(sessionId);
const progress = await ApiService.getSessionProgress(sessionId);
```

## Configuration

### API Client Configuration
```typescript
const apiClient = new ApiClient({
  enableRealTimeStream: true,    // Enable SSE streaming
  enablePolling: true,           // Enable JSON polling
  pollingInterval: 2000,         // Poll every 2 seconds
  streamReconnectAttempts: 10    // Max reconnection attempts
});
```

### Retry Configuration
```typescript
const retryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};
```

## Testing

### Integration Tests
Run the comprehensive integration tests:

```bash
npm run test:run src/services/__tests__/apiIntegration.test.ts
```

### Manual Testing
Use the `ApiTestDemo` component for manual testing:

1. Toggle to "Show API Test" in the main app
2. Test connection to backend
3. Start a campaign
4. Test content approval/revision
5. Test S3 media download
6. Monitor real-time outputs

### Test Coverage
- Campaign management operations
- Real-time streaming
- JSON file polling
- Error handling scenarios
- Connection management
- S3 media operations

## Requirements Fulfilled

This implementation fulfills all requirements from task 2.1:

✅ **Write API functions for campaign start, content approval, and agent monitoring**
- `ApiService.startCampaign()` - Campaign initiation
- `ApiService.submitContentApproval()` - Content approval workflow
- `ApiService.getAgentOutputs()` - Real-time agent monitoring

✅ **Implement WebSocket connections for real-time agent output streaming**
- `RealTimeStreamService` using Server-Sent Events (SSE)
- Real-time agent output streaming
- Automatic reconnection and error handling

✅ **Add JSON file polling system for agent results and progress tracking**
- `PollingService` for periodic JSON file polling
- `ApiService.pollAgentResults()` and `ApiService.getSessionProgress()`
- Change detection and efficient polling

✅ **Create error handling and retry mechanisms for API failures**
- `ErrorHandler` for centralized error management
- Automatic retry with exponential backoff
- User-friendly error messages and categorization

✅ **Requirements: 1.2, 1.3, 2.1, 13.1**
- 1.2: Campaign start integration with simple_dashboard_server.py
- 1.3: Agent execution monitoring and status tracking
- 2.1: Real-time agent output display and progress tracking
- 13.1: Live agent execution status and outputs streaming

## Usage Examples

### Basic Campaign Flow
```typescript
// Initialize API client
apiClient.initialize({
  onAgentOutput: (output) => console.log('Agent:', output),
  onProgressUpdate: (progress) => updateUI(progress),
  onError: (error) => showError(error.message)
});

// Start campaign
const campaign = await apiClient.startCampaign({
  product: 'Smart Water Bottle',
  product_cost: 29.99,
  budget: 5000
});

// Monitor progress automatically via callbacks
// Submit approvals when ready
await apiClient.submitContentApproval({
  session_id: campaign.sessionId,
  ad_id: 'ad-001',
  action: 'approve'
});
```

### Advanced Error Handling
```typescript
try {
  await apiClient.startCampaign(data);
} catch (error) {
  if (errorHandler.isRetryable(error)) {
    // Show retry option to user
    showRetryButton();
  } else {
    // Show permanent error message
    showError(errorHandler.getUserMessage(error));
  }
}
```

This comprehensive API integration provides a robust foundation for the Campaign Dashboard UI's backend communication needs.