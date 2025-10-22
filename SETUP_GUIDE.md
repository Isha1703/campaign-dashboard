# Local Setup Guide

## Prerequisites

- **Node.js 18+**
- **Python 3.11+** (required by strands-agents)
- **AWS Account** with S3 and Bedrock access

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/campaign-dashboard.git
cd campaign-dashboard
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt
pip install -r mcp_requirements.txt

# Configure AWS credentials
cp .env.example .env
# Edit .env with your AWS credentials

# Start backend
python simple_dashboard_server.py
```

### 3. Frontend Setup
```bash
# Install Node dependencies
npm install

# Configure environment
echo "VITE_DEMO_MODE=false" > .env.local
echo "VITE_API_URL=http://localhost:8000" >> .env.local

# Start frontend
npm run dev
```

### 4. Access Dashboard
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/docs

## Environment Variables

### Backend (.env)
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=us-east-1
PORT=8000
```

### Frontend (.env.local)
```env
VITE_DEMO_MODE=false
VITE_API_URL=http://localhost:8000
```

## Test Your Setup

```bash
# Test backend
curl http://localhost:8000/test

# Create first campaign
# Go to http://localhost:5173
# Click "Create New Campaign"
```
