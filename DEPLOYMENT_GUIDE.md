# 🚀 Campaign Dashboard - Deployment Guide

Complete guide to deploy your Marketing Campaign Dashboard publicly.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Deploy Options](#quick-deploy-options)
3. [AWS Deployment (Recommended)](#aws-deployment)
4. [Vercel + Railway Deployment](#vercel--railway)
5. [Docker Deployment](#docker-deployment)
6. [Environment Configuration](#environment-configuration)

---

## Prerequisites

### Required
- Node.js 18+ and npm
- Python 3.9+
- AWS Account (for S3 media storage)
- Git repository

### Optional
- Docker (for containerized deployment)
- Domain name (for custom URL)

---

## Quick Deploy Options

### Option 1: AWS (Recommended for Production)
**Best for:** Full-featured deployment with S3 integration
- Frontend: AWS Amplify or S3 + CloudFront
- Backend: AWS App Runner or ECS
- Cost: ~$20-50/month

### Option 2: Vercel + Railway
**Best for:** Quick deployment, easy setup
- Frontend: Vercel (Free tier available)
- Backend: Railway (Free tier available)
- Cost: Free to start, ~$5-20/month for production

### Option 3: Docker + Any Cloud Provider
**Best for:** Maximum flexibility
- Works on: AWS, GCP, Azure, DigitalOcean, etc.
- Cost: Varies by provider

---

## AWS Deployment (Recommended)

### Step 1: Prepare Your Application

```bash
# Build the frontend
npm run build

# Test the build locally
npm run preview
```

### Step 2: Deploy Frontend to AWS Amplify

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/campaign-dashboard.git
git push -u origin main
```

2. **Deploy via AWS Amplify Console:**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" → "Host web app"
   - Connect your GitHub repository
   - Configure build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

3. **Add Environment Variables:**
   - `VITE_API_URL`: Your backend API URL (will be set after backend deployment)

### Step 3: Deploy Backend to AWS App Runner

1. **Create Dockerfile for Backend:**

Create `Dockerfile` in project root:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
COPY mcp_requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir -r mcp_requirements.txt

# Copy application files
COPY simple_dashboard_server.py .
COPY market_campaign.py .
COPY mcp_*.py .
COPY strands_tools.py .
COPY *.json .

# Create necessary directories
RUN mkdir -p public/agent_outputs public/downloads

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "simple_dashboard_server.py"]
```

2. **Deploy to AWS App Runner:**
   - Go to [AWS App Runner Console](https://console.aws.amazon.com/apprunner/)
   - Click "Create service"
   - Choose "Source code repository" or "Container registry"
   - Configure:
     - Port: 8000
     - Environment variables (see below)
   - Deploy!

3. **Get Backend URL:**
   - Copy the App Runner service URL (e.g., `https://xxx.us-east-1.awsapprunner.com`)
   - Update Amplify environment variable `VITE_API_URL` with this URL

### Step 4: Configure CORS

Update `simple_dashboard_server.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-amplify-domain.amplifyapp.com",  # Your Amplify URL
        "http://localhost:5173",  # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Vercel + Railway Deployment

### Step 1: Deploy Frontend to Vercel

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy:**
```bash
vercel
```

3. **Configure:**
   - Follow prompts to link project
   - Set environment variables in Vercel dashboard
   - Production URL will be provided

### Step 2: Deploy Backend to Railway

1. **Create `railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python simple_dashboard_server.py",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **Create `Procfile`:**
```
web: python simple_dashboard_server.py
```

3. **Deploy to Railway:**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Add environment variables
   - Deploy!

4. **Get Railway URL:**
   - Copy the Railway service URL
   - Update Vercel environment variable `VITE_API_URL`

---

## Docker Deployment

### Step 1: Create Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://backend:8000
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION}
    volumes:
      - ./public:/app/public
```

### Step 2: Create Frontend Dockerfile

Create `Dockerfile.frontend`:
```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Step 3: Create Nginx Config

Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # API proxy
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 4: Deploy

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Environment Configuration

### Frontend Environment Variables

Create `.env.production`:
```env
VITE_API_URL=https://your-backend-url.com
VITE_APP_NAME=Campaign Dashboard
VITE_ENABLE_ANALYTICS=true
```

### Backend Environment Variables

Required for all deployments:
```env
# AWS Credentials (for S3 access)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=us-east-1

# AgentCore Configuration
AGENTCORE_API_KEY=your_agentcore_key
AGENTCORE_ENDPOINT=https://api.agentcore.aws.dev

# Application Settings
PORT=8000
ENVIRONMENT=production
LOG_LEVEL=INFO

# CORS Origins (comma-separated)
CORS_ORIGINS=https://your-frontend-url.com,https://www.your-domain.com
```

---

## Post-Deployment Checklist

### ✅ Frontend
- [ ] Build completes without errors
- [ ] All routes are accessible
- [ ] API calls work correctly
- [ ] Media files load properly
- [ ] Mobile responsive
- [ ] HTTPS enabled

### ✅ Backend
- [ ] Health check endpoint responds
- [ ] API endpoints return correct data
- [ ] S3 integration works
- [ ] MCP tools are accessible
- [ ] Error logging configured
- [ ] Rate limiting enabled

### ✅ Security
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] API authentication enabled
- [ ] HTTPS enforced
- [ ] Secrets not in code

### ✅ Performance
- [ ] Frontend assets minified
- [ ] Gzip compression enabled
- [ ] CDN configured (optional)
- [ ] Database indexed (if applicable)
- [ ] Caching configured

---

## Monitoring & Maintenance

### Health Checks

Frontend:
```bash
curl https://your-frontend-url.com
```

Backend:
```bash
curl https://your-backend-url.com/health
```

### Logs

**AWS Amplify:**
- View in Amplify Console → App → Logs

**AWS App Runner:**
- View in App Runner Console → Service → Logs

**Railway:**
- View in Railway Dashboard → Deployments → Logs

**Docker:**
```bash
docker-compose logs -f
```

### Updating

```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
npm run build
# Then redeploy via your platform
```

---

## Troubleshooting

### Frontend Issues

**Build fails:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**API calls fail:**
- Check `VITE_API_URL` environment variable
- Verify CORS configuration on backend
- Check browser console for errors

### Backend Issues

**Server won't start:**
- Check Python version (3.9+)
- Verify all dependencies installed
- Check port availability

**S3 access denied:**
- Verify AWS credentials
- Check IAM permissions
- Ensure bucket policy allows access

### Common Errors

**CORS Error:**
```python
# Add your frontend URL to CORS origins
allow_origins=["https://your-frontend-url.com"]
```

**Module not found:**
```bash
# Reinstall dependencies
pip install -r requirements.txt
pip install -r mcp_requirements.txt
```

---

## Cost Estimates

### AWS (Production)
- Amplify: $0-15/month
- App Runner: $25-50/month
- S3 Storage: $1-5/month
- **Total: ~$30-70/month**

### Vercel + Railway (Starter)
- Vercel: Free (hobby) or $20/month (pro)
- Railway: $5-20/month
- **Total: ~$5-40/month**

### Docker (Self-hosted)
- DigitalOcean Droplet: $12-24/month
- AWS EC2: $10-30/month
- **Total: ~$10-30/month**

---

## Support & Resources

- **AWS Amplify Docs:** https://docs.amplify.aws
- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **Docker Docs:** https://docs.docker.com

---

## Quick Start Commands

```bash
# Local development
npm run dev                    # Frontend
python simple_dashboard_server.py  # Backend

# Build for production
npm run build

# Deploy (choose one)
vercel                        # Vercel
amplify publish              # AWS Amplify
docker-compose up -d         # Docker

# Test production build locally
npm run preview
```

---

**Need help?** Check the troubleshooting section or review platform-specific documentation.

**Ready to deploy?** Choose your platform above and follow the step-by-step guide!
