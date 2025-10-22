# 🚀 AI-Powered Marketing Campaign Dashboard

> **Revolutionizing Marketing with Agentic AI**  
> Autonomous AI agents that analyze audiences, allocate budgets, generate content, and optimize campaigns—all in 5-10 minutes.

![Campaign Dashboard](https://img.shields.io/badge/Status-Production%20Ready-success)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Python](https://img.shields.io/badge/Python-3.11+-3776ab)
![AWS](https://img.shields.io/badge/AWS-Bedrock%20%7C%20S3-orange)

**Live Demo**: https://main.d296oiluscvwnx.amplifyapp.com

---

## 🤖 What is Agentic AI Marketing?

### Traditional Marketing (7-14 days, $5,000-$10,000)
```
Human Research → Manual Planning → Creative Team → Launch → Weekly Optimization
```

### Agentic AI Marketing (5-10 minutes, $1.86)
```
AI Analysis → AI Planning → AI Content → Auto Launch → Real-time Optimization
```

**Result**: 8,000% cost reduction, 2,000x faster, consistent quality

---

## ✨ Key Features

- **🎯 Autonomous Agents**: 6 specialized AI agents work together
- **🎨 Content Generation**: Text, images (Nova Canvas), videos (Nova Reel)
- **📊 Real-Time Analytics**: CTR, ROI, conversion tracking
- **💰 Smart Optimization**: AI-powered budget reallocation
- **🔄 Continuous Learning**: Improves with every campaign
- **👤 Human-in-Loop**: Review and approve AI decisions

---

## 🚀 Quick Start

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/campaign-dashboard.git
cd campaign-dashboard

# 2. Backend setup
pip install -r requirements.txt
cp .env.example .env  # Add AWS credentials
python simple_dashboard_server.py

# 3. Frontend setup (new terminal)
npm install
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev

# 4. Open http://localhost:5173
```

**Detailed guide**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)

### Docker (Recommended)

```bash
cp .env.example .env  # Add AWS credentials
docker-compose up -d
# Open http://localhost:3000
```

---

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Local development setup |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | How agentic AI works |
| [FILE_GUIDE.md](./FILE_GUIDE.md) | File structure & descriptions |
| [AMPLIFY_DEPLOYMENT.md](./AMPLIFY_DEPLOYMENT.md) | Deploy to AWS Amplify |
| [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) | Deploy to Railway |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common errors & fixes |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Step-by-step deployment |

---

## 🏗️ Architecture

```
Frontend (React)
    ↓ API calls
Backend (FastAPI)
    ↓ Orchestrates
6 AI Agents (Strands)
    ↓ Uses
MCP Gateway (AgentCore)
    ↓ Accesses
AWS Services (Bedrock, Nova, S3)
```

### The 6 AI Agents

1. **Audience Agent** - Identifies target audiences (2 min)
2. **Budget Agent** - Allocates budget optimally (1 min)
3. **Prompt Agent** - Creates ad strategies (1 min)
4. **Content Agent** - Generates ads via MCP (2-3 min)
5. **Analytics Agent** - Analyzes performance (real-time)
6. **Optimization Agent** - Improves campaigns (continuous)

**Learn more**: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 🛠️ Technology Stack

### Frontend
- React 18 + TypeScript
- Vite, Tailwind CSS
- Hosted on AWS Amplify

### Backend
- Python 3.11 + FastAPI
- Strands Agents framework
- Claude 3.7 Sonnet (Bedrock)
- Hosted on Railway/ECS

### AWS Services
- **Bedrock**: AI model hosting
- **Nova Canvas**: Image generation
- **Nova Reel**: Video generation
- **S3**: Media storage
- **AgentCore**: MCP gateway

---

## 💰 Cost Comparison

### Per Campaign

| Method | Time | Cost | Quality |
|--------|------|------|---------|
| Traditional | 7-14 days | $5,000-$10,000 | Variable |
| Agentic AI | 5-10 min | $1.86 | Consistent |

### Monthly (100 campaigns)
- Campaign costs: ~$186
- Hosting: ~$25
- **Total**: ~$211/month

---

## 🔌 MCP Gateway Integration

**What is MCP?**  
Model Context Protocol - allows AI agents to use external tools

**Current Integration**:
- Amazon Nova Canvas (images)
- Amazon Nova Reel (videos)
- AWS S3 (storage)

**Future Integration** (Real-world scenario):
```python
# Agent automatically posts to social media
agent("Post this ad to Facebook targeting tech professionals")

# Behind the scenes:
# 1. Agent calls facebook___post_ad via MCP
# 2. MCP gateway authenticates
# 3. Ad posted automatically
# 4. Agent monitors performance
# 5. Agent optimizes budget in real-time
```

**Learn more**: [ARCHITECTURE.md](./ARCHITECTURE.md#mcp-gateway)

---

## 📁 Project Structure

```
campaign-dashboard/
├── src/                          # Frontend React app
│   ├── components/tabs/          # UI components
│   ├── services/api.ts           # Backend client
│   └── types/                    # TypeScript types
├── simple_dashboard_server.py    # Backend API
├── market_campaign.py            # AI agents
├── mcp_utils.py                  # MCP integration
├── public/agent_outputs/         # Campaign data
├── Dockerfile                    # Backend container
├── docker-compose.yml            # Full stack
└── requirements.txt              # Dependencies
```

**Detailed guide**: [FILE_GUIDE.md](./FILE_GUIDE.md)

---

## 🚀 Deployment

### Production Setup

**Frontend**: AWS Amplify (static hosting)  
**Backend**: Railway/AWS ECS (server hosting)

```bash
# 1. Deploy backend to Railway
railway up

# 2. Get Railway URL
# e.g., https://campaign-dashboard.railway.app

# 3. Update Amplify environment
VITE_API_URL=https://campaign-dashboard.railway.app

# 4. Amplify auto-deploys from GitHub
```

**Guides**:
- [AMPLIFY_DEPLOYMENT.md](./AMPLIFY_DEPLOYMENT.md)
- [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "Network Error" | Backend not running - see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#network-error) |
| "No matching distribution" | Need Python 3.11+ - see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#python-version) |
| "CORS blocked" | Add frontend URL to CORS - see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#cors) |
| Railway build fails | Already fixed (Python 3.11) - see [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) |

**Full guide**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 🎯 Workflow

1. **Create Campaign** - Enter product details and budget
2. **AI Execution** - 6 agents work autonomously (5-10 min)
3. **Review Content** - Approve or request revisions
4. **Launch** - Deploy to social platforms
5. **Optimize** - AI continuously improves performance

---

## 📊 Features

### Campaign Management
- Multi-platform support (Instagram, Facebook, TikTok, LinkedIn)
- Real-time agent progress tracking
- Content approval workflow

### Content Generation
- Text ads with compelling CTAs
- Professional images (1024x1024)
- Marketing videos (6 seconds, 1280x720)
- Automatic S3 upload

### Analytics
- Performance metrics (CTR, ROI, conversions)
- Platform comparison
- Audience insights
- Real-time tracking

### Optimization
- AI-powered budget reallocation
- Creative improvement suggestions
- A/B testing recommendations
- Continuous learning

---

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

## 📄 License

All rights reserved.

---

## 📞 Support

- **Documentation**: See guides above
- **Issues**: GitHub Issues
- **Questions**: Open a discussion

---

**Built with ❤️ using AWS Bedrock, Strands Agents, and Model Context Protocol**

**Live Demo**: https://main.d296oiluscvwnx.amplifyapp.com
