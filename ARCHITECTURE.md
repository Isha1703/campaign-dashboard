# Architecture & Technology

## How Agentic AI Works

### Traditional vs AI Marketing

**Traditional** (7-14 days):
- Human research → Manual planning → Creative team → Launch → Weekly optimization

**Agentic AI** (5-10 minutes):
- AI analysis → AI planning → AI content → Auto launch → Real-time optimization

### The 6 AI Agents

1. **Audience Agent** - Identifies target audiences (2 min)
2. **Budget Agent** - Allocates budget optimally (1 min)
3. **Prompt Agent** - Creates ad strategies (1 min)
4. **Content Agent** - Generates ads via MCP (2-3 min)
5. **Analytics Agent** - Analyzes performance (real-time)
6. **Optimization Agent** - Improves campaigns (continuous)

## System Architecture

```
Frontend (React) → Backend (FastAPI) → Strands Agents → AWS Services
                                     ↓
                              MCP Gateway → Nova Canvas/Reel
```

## Technology Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Axios (API client)

### Backend
- Python 3.11 + FastAPI
- Strands Agents (AI framework)
- Claude 3.7 Sonnet (via Bedrock)
- MCP integration

### AWS Services
- **Bedrock**: AI model hosting
- **Nova Canvas**: Image generation ($0.04/image)
- **Nova Reel**: Video generation ($0.80/video)
- **S3**: Media storage
- **AgentCore**: MCP gateway
- **Amplify**: Frontend hosting

## MCP Gateway Explained

**What is MCP?**
Model Context Protocol - allows AI agents to use external tools

**How it works**:
```
Your Agent → MCP Client → AgentCore Gateway → AWS Services
                                           → Social Media APIs (future)
```

**Real-world scenario**:
```python
# Agent automatically posts to Facebook
agent("Post this ad to Facebook targeting tech professionals")

# Behind the scenes:
# 1. Agent calls facebook___post_ad via MCP
# 2. MCP gateway authenticates with Facebook
# 3. Ad is posted automatically
# 4. Agent monitors performance via facebook___get_stats
# 5. Agent optimizes via facebook___update_budget
```

## File Structure

```
campaign-dashboard/
├── src/                    # Frontend React app
├── simple_dashboard_server.py  # Backend API
├── market_campaign.py      # AI agents
├── mcp_utils.py           # MCP integration
├── public/agent_outputs/  # Campaign data
└── Dockerfile             # Deployment
```

## Cost Per Campaign

- Bedrock: $0.05
- Images (5): $0.20
- Videos (2): $1.60
- S3: $0.01
**Total: ~$1.86**

Compare to traditional: $5,000-$10,000 + 7-14 days
