# 🚀 AI-Powered Marketing Campaign Dashboard

A professional, full-stack marketing campaign management platform with AI-powered content generation, real-time analytics, and intelligent budget optimization.

![Campaign Dashboard](https://img.shields.io/badge/Status-Production%20Ready-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Python](https://img.shields.io/badge/Python-3.9+-3776ab)

## ✨ Features

### 🎯 Campaign Management
- **Multi-Platform Support**: Instagram, LinkedIn, Facebook, Pinterest, TikTok, Google Search
- **AI Content Generation**: Automated ad creation with text, images, and videos
- **Real-Time Monitoring**: Track agent progress and campaign status
- **Approval Workflow**: Review and approve generated content with revision requests

### 📊 Analytics & Insights
- **Performance Metrics**: CTR, conversion rates, engagement analytics
- **Audience Insights**: Demographics, behavior patterns, and preferences
- **Platform Comparison**: Cross-platform performance analysis
- **ROI Tracking**: Revenue, cost, and profitability metrics

### 💰 Budget Optimization
- **AI-Powered Reallocation**: Intelligent budget distribution
- **ROI Forecasting**: Predictive revenue and performance modeling
- **Strategic Recommendations**: Data-driven optimization suggestions
- **Real-Time Adjustments**: Dynamic budget management

### 🎨 Content Creation
- **Text Ads**: Platform-optimized copy generation
- **Image Generation**: AI-powered visual content (Amazon Nova Canvas)
- **Video Creation**: 6-second video ads (Amazon Nova Reel)
- **Content Revision**: Feedback-driven content improvements

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Icons**: Lucide React

### Backend
- **Framework**: Python FastAPI
- **AI Integration**: AWS AgentCore + MCP Tools
- **Media Storage**: AWS S3
- **Real-Time Updates**: File-based polling system

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx
- **Deployment**: AWS, Vercel, Railway, or self-hosted

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Docker (optional)
- AWS Account (for S3 media storage)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/campaign-dashboard.git
   cd campaign-dashboard
   ```

2. **Install dependencies:**
   ```bash
   # Frontend
   npm install

   # Backend
   pip install -r requirements.txt
   pip install -r mcp_requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials
   ```

4. **Start development servers:**
   ```bash
   # Terminal 1 - Frontend
   npm run dev

   # Terminal 2 - Backend
   python simple_dashboard_server.py
   ```

5. **Access the dashboard:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

### Docker Deployment (Recommended)

1. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. **Deploy:**
   ```bash
   docker-compose up -d
   ```

3. **Access:**
   - Dashboard: http://localhost:3000
   - API: http://localhost:8000

## 📦 Deployment

### Quick Deploy Options

#### 🐳 Docker (5 minutes)
```bash
docker-compose up -d
```

#### ☁️ Vercel + Railway (10 minutes)
```bash
# Frontend
vercel

# Backend
# Deploy via Railway.app dashboard
```

#### 🌐 AWS Amplify (Frontend Only)

**Important**: AWS Amplify only hosts the static frontend. You need to deploy the backend separately.

**Option 1: Demo Mode (No Backend Required)**
```bash
# Use .env.production for demo mode
VITE_DEMO_MODE=true
VITE_API_URL=
```

**Option 2: With Backend**
1. Deploy backend to EC2, ECS, or Lambda
2. Update `.env.production`:
```bash
VITE_DEMO_MODE=false
VITE_API_URL=https://your-backend-url.com
```

**Current Amplify URL**: https://main.d296oiluscvwnx.amplifyapp.com

#### 🐳 Full Stack Deployment (Recommended)

For production with real campaigns, deploy both frontend and backend:

**Backend Options:**
- AWS EC2 with Docker
- AWS ECS/Fargate
- Railway.app (easiest)
- Render.com
- Fly.io

**Quick Deploy with Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy backend
railway up

# Get backend URL and update frontend env
VITE_API_URL=https://your-app.railway.app
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

#### Backend (.env)
```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=us-east-1

# AgentCore Configuration (Optional)
AGENTCORE_API_KEY=your_key
AGENTCORE_ENDPOINT=https://api.agentcore.aws.dev

# Application Settings
PORT=8000
ENVIRONMENT=development
LOG_LEVEL=INFO
```

## 📖 Documentation

### User Guides
- [Campaign Creation Guide](./docs/campaign-creation.md)
- [Content Approval Workflow](./docs/content-approval.md)
- [Analytics Dashboard Guide](./docs/analytics-guide.md)
- [Budget Optimization Guide](./docs/optimization-guide.md)

### Developer Guides
- [API Documentation](./docs/api-documentation.md)
- [Component Architecture](./docs/architecture.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend tests
pytest

# E2E tests
npm run test:e2e
```

## 📊 Project Structure

```
campaign-dashboard/
├── src/                      # Frontend source code
│   ├── components/          # React components
│   ├── contexts/            # React contexts
│   ├── services/            # API services
│   ├── types/               # TypeScript types
│   └── App.tsx              # Main app component
├── public/                   # Static assets
│   ├── agent_outputs/       # Generated campaign data
│   └── downloads/           # Downloaded media files
├── simple_dashboard_server.py  # Backend API server
├── market_campaign.py       # Campaign orchestration
├── Dockerfile               # Backend container
├── Dockerfile.frontend      # Frontend container
├── docker-compose.yml       # Full stack deployment
├── package.json             # Frontend dependencies
├── requirements.txt         # Backend dependencies
└── README.md               # This file
```

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- Axios (HTTP client)

### Backend
- Python 3.9+
- FastAPI
- AWS SDK (boto3)
- AgentCore MCP
- Uvicorn (ASGI server)

### Infrastructure
- Docker & Docker Compose
- Nginx
- AWS S3
- AWS AgentCore

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- AWS AgentCore for AI agent orchestration
- Amazon Nova for image and video generation
- React and Vite communities
- FastAPI framework
- All contributors and supporters

## 📞 Support

- **Documentation**: Check the [docs](./docs) folder
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/campaign-dashboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/campaign-dashboard/discussions)

## 🗺️ Roadmap

- [ ] Multi-user support with authentication
- [ ] Advanced A/B testing capabilities
- [ ] Integration with more ad platforms
- [ ] Enhanced analytics with ML predictions
- [ ] Mobile app (React Native)
- [ ] API rate limiting and caching
- [ ] Webhook support for real-time updates

## 📈 Status

- ✅ Core features complete
- ✅ Production-ready
- ✅ Docker deployment ready
- ✅ Cloud deployment ready
- 🚧 Documentation in progress
- 🚧 Additional platform integrations

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Built with ❤️ by the Campaign Dashboard Team**

**Ready to deploy?** Check out [START_HERE.md](./START_HERE.md) to get started!
