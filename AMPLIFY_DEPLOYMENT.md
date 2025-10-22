# AWS Amplify Deployment Guide

## Overview

AWS Amplify hosts the **frontend only** (static React app). To run real campaigns, you need a **backend server** running separately.

## Current Status

- ✅ **Frontend**: Deployed on Amplify at https://main.d296oiluscvwnx.amplifyapp.com
- ❌ **Backend**: Not deployed (causes "Network Error" when trying to create campaigns)

## Deployment Options

### Option 1: Demo Mode (Current Setup)

**Best for**: Showcasing the UI without real campaign execution

**Configuration**:
```env
# .env.production
VITE_DEMO_MODE=true
VITE_API_URL=
```

**Features**:
- ✅ View demo campaign data
- ✅ Explore all UI features
- ❌ Cannot create new campaigns
- ❌ Cannot execute real AI agents

### Option 2: Deploy Backend Separately (Recommended)

**Best for**: Production use with real campaigns

#### Step 1: Deploy Backend

Choose one of these platforms:

**A. Railway.app (Easiest)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy backend
railway up

# Get your backend URL (e.g., https://your-app.railway.app)
```

**B. AWS EC2 with Docker**
```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance

# Clone repo
git clone https://github.com/your-repo/campaign-dashboard.git
cd campaign-dashboard

# Run with Docker (requires Python 3.11+)
docker-compose up -d
```

**Note**: Backend requires Python 3.11+ due to `strands-agents` dependency.

**C. Render.com**
1. Connect your GitHub repo
2. Select `simple_dashboard_server.py` as entry point
3. Set environment variables
4. Deploy

#### Step 2: Update Amplify Environment

1. Go to AWS Amplify Console
2. Select your app
3. Go to "Environment variables"
4. Add/Update:
   ```
   VITE_DEMO_MODE=false
   VITE_API_URL=https://your-backend-url.com
   ```
5. Redeploy the frontend

#### Step 3: Configure CORS

Update `simple_dashboard_server.py` to allow Amplify origin:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://main.d296oiluscvwnx.amplifyapp.com",  # Your Amplify URL
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Option 3: Local Backend with Tunneling (Development)

**Best for**: Testing with real backend during development

```bash
# Terminal 1: Run backend locally
python simple_dashboard_server.py

# Terminal 2: Create tunnel with Cloudflare
npx cloudflared tunnel --url http://localhost:8000

# Update Amplify env with tunnel URL
VITE_API_URL=https://your-tunnel-url.trycloudflare.com
```

## Troubleshooting

### "Network Error" when creating campaigns

**Cause**: Backend is not running or not accessible

**Solutions**:
1. Check if backend is deployed and running
2. Verify `VITE_API_URL` is correct
3. Check CORS configuration includes Amplify URL
4. Enable demo mode as fallback

### Sessions not loading

**Cause**: No session data available

**Solutions**:
1. Create a campaign first (requires backend)
2. Use demo mode to see sample data
3. Check `public/agent_outputs/` directory for session files

### CORS errors

**Cause**: Backend doesn't allow Amplify origin

**Solution**: Update CORS configuration in `simple_dashboard_server.py`

## Architecture

```
┌─────────────────────────────────────┐
│   AWS Amplify (Frontend)            │
│   https://main.d296...amplifyapp.com│
└──────────────┬──────────────────────┘
               │ API Calls
               ▼
┌─────────────────────────────────────┐
│   Backend Server (Separate)         │
│   - Railway / EC2 / Render          │
│   - FastAPI + Python                │
│   - AI Agents + MCP Tools           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   AWS Services                       │
│   - S3 (Media Storage)              │
│   - Bedrock (AI Models)             │
│   - AgentCore (MCP Gateway)         │
└─────────────────────────────────────┘
```

## Recommended Production Setup

1. **Frontend**: AWS Amplify (current)
2. **Backend**: AWS ECS Fargate or Railway.app
3. **Database**: AWS RDS or DynamoDB (for session persistence)
4. **Storage**: AWS S3 (for media files)
5. **CDN**: CloudFront (for media delivery)

## Cost Estimate

- **Amplify**: ~$0-5/month (frontend hosting)
- **Railway**: ~$5-20/month (backend hosting)
- **S3**: ~$1-10/month (media storage)
- **Bedrock**: Pay per use (~$0.01-0.10 per campaign)

**Total**: ~$10-50/month depending on usage

## Next Steps

1. Choose deployment option (Demo vs Production)
2. Deploy backend if needed
3. Update Amplify environment variables
4. Test campaign creation
5. Monitor costs and performance

## Support

For issues or questions:
- Check logs in Amplify Console
- Review backend logs (Railway/EC2)
- Test API endpoints directly
- Enable demo mode as fallback
