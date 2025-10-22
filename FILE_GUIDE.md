# File Directory Guide

## Essential Files

### Backend (Python)

**simple_dashboard_server.py** - Main API server
- FastAPI application
- Handles campaign creation, content approval, analytics
- Serves static files
- Port: 8000 (reads from PORT env var)

**market_campaign.py** - AI agent system
- Defines 6 Strands agents
- Agent orchestration logic
- MCP tool integration
- Session management
- Key functions:
  - `AudienceAgent()` - Audience analysis
  - `BudgetAgent()` - Budget allocation
  - `PromptAgent()` - Ad strategy
  - `create_content_generation_agent()` - Content with MCP
  - `AnalyticsAgent()` - Performance analysis
  - `OptimizationAgent()` - Campaign optimization

**mcp_utils.py** - MCP gateway utilities
- OAuth token management
- MCP client creation
- Gateway connectivity testing

**strands_tools.py** - Custom Strands tools
- Additional tools for agents

### Frontend (React/TypeScript)

**src/App.tsx** - Main application
**src/main.tsx** - Entry point

**src/components/tabs/**
- `CampaignTab.tsx` - Create campaigns
- `ContentTab.tsx` - Review/approve content
- `AnalyticsTab.tsx` - View performance
- `OptimizationTab.tsx` - See recommendations

**src/services/**
- `api.ts` - Backend API client
- `mockApi.ts` - Demo mode data
- `fileDataService.ts` - Session management

**src/types/index.ts** - TypeScript definitions

### Configuration

**Dockerfile** - Backend container (Python 3.11)
**Dockerfile.frontend** - Frontend container
**docker-compose.yml** - Full stack deployment

**package.json** - Frontend dependencies
**requirements.txt** - Backend dependencies
**mcp_requirements.txt** - MCP dependencies

**vite.config.ts** - Build configuration
**tsconfig.json** - TypeScript config
**tailwind.config.js** - Styling config

**.env.local** - Local development
**.env.production** - Production (Amplify)

### Generated Data

**public/agent_outputs/session-*/** - Campaign sessions
- `audienceagent_result.json`
- `budgetagent_result.json`
- `promptagent_result.json`
- `contentgenerationagent_result.json`
- `session_progress.json`

**public/downloads/** - Downloaded S3 media

## What Each File Does

### Backend Flow
1. `simple_dashboard_server.py` receives API request
2. Calls `market_campaign.py` to execute agents
3. Agents use `mcp_utils.py` to access MCP tools
4. Results saved to `public/agent_outputs/`

### Frontend Flow
1. User interacts with `src/components/tabs/`
2. Components call `src/services/api.ts`
3. API client sends requests to backend
4. Results displayed in UI

### Deployment Flow
1. `Dockerfile` builds backend container
2. `Dockerfile.frontend` builds frontend
3. `docker-compose.yml` orchestrates both
4. Or deploy separately (Amplify + Railway)
