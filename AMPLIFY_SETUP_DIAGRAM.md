# 📊 AWS Amplify Setup - Visual Guide

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         YOUR USERS                          │
│                    (Web Browsers)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS AMPLIFY                              │
│                  (Frontend Hosting)                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React App (Your Dashboard)                          │  │
│  │  - Campaign creation UI                              │  │
│  │  - Content display                                   │  │
│  │  - Analytics charts                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Environment Variable:                                      │
│  VITE_API_URL = https://abc123.awsapprunner.com            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ API Calls
                         │ (VITE_API_URL)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   AWS APP RUNNER                            │
│                  (Backend API Server)                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Python FastAPI Server                               │  │
│  │  - Campaign orchestration                            │  │
│  │  - AI agent management                               │  │
│  │  - Content generation                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Environment Variables:                                     │
│  - AWS_ACCESS_KEY_ID                                        │
│  - AWS_SECRET_ACCESS_KEY                                    │
│  - PORT = 8000                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ S3 API Calls
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                       AWS S3                                │
│                  (Media Storage)                            │
│                                                             │
│  - Generated images                                         │
│  - Generated videos                                         │
│  - Campaign assets                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. User Creates Campaign

```
User Browser
    │
    │ 1. Click "Create Campaign"
    ▼
AWS Amplify (Frontend)
    │
    │ 2. POST /api/campaign/start
    │    URL: https://abc123.awsapprunner.com/api/campaign/start
    ▼
AWS App Runner (Backend)
    │
    │ 3. Process campaign
    │ 4. Generate content
    │ 5. Store in S3
    ▼
AWS S3 (Storage)
    │
    │ 6. Return URLs
    ▼
AWS App Runner (Backend)
    │
    │ 7. Return response
    ▼
AWS Amplify (Frontend)
    │
    │ 8. Display results
    ▼
User Browser
```

---

## 🔗 Connection Setup

### Step 1: Deploy Backend First

```
┌─────────────────────────────────────┐
│      AWS App Runner                 │
│                                     │
│  Deploy: simple_dashboard_server.py │
│  Port: 8000                         │
│                                     │
│  Result: Get URL                    │
│  https://abc123.awsapprunner.com    │
└─────────────────────────────────────┘
```

### Step 2: Configure Frontend

```
┌─────────────────────────────────────┐
│      AWS Amplify                    │
│                                     │
│  Environment Variable:              │
│  VITE_API_URL =                     │
│    https://abc123.awsapprunner.com  │
│                                     │
│  Frontend now knows where           │
│  to find backend!                   │
└─────────────────────────────────────┘
```

### Step 3: Configure CORS

```
┌─────────────────────────────────────┐
│  simple_dashboard_server.py         │
│                                     │
│  allow_origins=[                    │
│    "https://main.d123.amplifyapp.com"│
│  ]                                  │
│                                     │
│  Backend now accepts requests       │
│  from frontend!                     │
└─────────────────────────────────────┘
```

---

## 📝 Configuration Checklist

### ✅ Backend (App Runner)

```
Service Name: campaign-dashboard-api
Runtime: Python 3
Port: 8000

Environment Variables:
├── AWS_ACCESS_KEY_ID = your_key
├── AWS_SECRET_ACCESS_KEY = your_secret
├── AWS_DEFAULT_REGION = us-east-1
└── PORT = 8000

Build Command:
pip install -r requirements.txt && 
pip install -r mcp_requirements.txt

Start Command:
python simple_dashboard_server.py

Result URL:
https://abc123.us-east-1.awsapprunner.com
```

### ✅ Frontend (Amplify)

```
App Name: campaign-dashboard
Repository: YOUR_USERNAME/campaign-dashboard
Branch: main

Environment Variables:
└── VITE_API_URL = https://abc123.awsapprunner.com

Build Settings:
├── Build command: npm run build
├── Output directory: dist
└── Node version: 18

Result URL:
https://main.d1234567890.amplifyapp.com
```

### ✅ CORS Configuration

```python
# In simple_dashboard_server.py

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://main.d1234567890.amplifyapp.com",  # Amplify URL
        "http://localhost:5173",  # Local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🎯 Environment Variable Flow

### How VITE_API_URL Works:

```
1. Set in Amplify Console:
   VITE_API_URL = https://abc123.awsapprunner.com

2. During build, Vite reads it:
   const API_URL = import.meta.env.VITE_API_URL

3. Frontend uses it for API calls:
   fetch(`${API_URL}/api/campaign/start`)

4. Becomes:
   fetch('https://abc123.awsapprunner.com/api/campaign/start')

5. Request goes to App Runner backend ✅
```

---

## 🚨 Troubleshooting Flow

### Problem: "Network Error"

```
Check 1: Is backend running?
├── curl https://abc123.awsapprunner.com/health
├── Should return: {"status": "healthy"}
└── ❌ If fails → Check App Runner logs

Check 2: Is VITE_API_URL set?
├── Amplify Console → Environment variables
├── Should see: VITE_API_URL = https://...
└── ❌ If missing → Add and redeploy

Check 3: Is CORS configured?
├── Check simple_dashboard_server.py
├── Should include: Amplify URL in allow_origins
└── ❌ If missing → Update and push to GitHub
```

---

## 📊 Deployment Timeline

```
┌─────────────────────────────────────────────────────────┐
│ Time  │ Step                    │ Status                │
├───────┼─────────────────────────┼───────────────────────┤
│ 0 min │ Push to GitHub          │ ✅ Code uploaded      │
│ 5 min │ Create App Runner       │ 🔄 Deploying...       │
│ 10min │ Backend deployed        │ ✅ Running            │
│ 15min │ Create Amplify app      │ 🔄 Building...        │
│ 20min │ Frontend deployed       │ ✅ Live               │
│ 25min │ Add VITE_API_URL        │ ⚙️  Configuring...    │
│ 30min │ Redeploy frontend       │ 🔄 Redeploying...     │
│ 35min │ Update CORS             │ ⚙️  Updating...       │
│ 40min │ Test deployment         │ ✅ Working!           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎉 Success Indicators

### ✅ Backend Healthy
```bash
$ curl https://abc123.awsapprunner.com/health
{"status": "healthy"}
```

### ✅ Frontend Loads
```
Open: https://main.d123.amplifyapp.com
See: Campaign Dashboard homepage
No errors in console (F12)
```

### ✅ Connection Works
```
1. Create campaign
2. See "Campaign started" message
3. Content generates
4. No CORS errors
```

---

## 📚 Quick Links

- **App Runner Console:** https://console.aws.amazon.com/apprunner/
- **Amplify Console:** https://console.aws.amazon.com/amplify/
- **S3 Console:** https://console.aws.amazon.com/s3/
- **CloudWatch Logs:** https://console.aws.amazon.com/cloudwatch/

---

**Need the detailed guide?** See [AWS_AMPLIFY_DEPLOYMENT.md](./AWS_AMPLIFY_DEPLOYMENT.md)

**Ready to start?** See [AMPLIFY_QUICK_START.md](./AMPLIFY_QUICK_START.md)
