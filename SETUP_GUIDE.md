# 🛠️ Setup Guide - VITE_API_URL Configuration

Complete guide to configure your frontend-backend connection.

## 📍 What is VITE_API_URL?

`VITE_API_URL` tells your **frontend** where to find your **backend API**.

- **Frontend**: React app (the website)
- **Backend**: Python FastAPI server (the API)
- **VITE_API_URL**: The "address" connecting them

---

## 🏠 Setup for Different Scenarios

### Scenario 1: Local Development (Recommended for Testing)

**Both frontend and backend on your computer:**

1. **Create `.env` file:**
   ```bash
   copy .env.example .env
   ```

2. **Edit `.env`:**
   ```env
   # Frontend Configuration
   VITE_API_URL=http://localhost:8000
   
   # AWS Configuration (required)
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_DEFAULT_REGION=us-east-1
   ```

3. **Start Backend:**
   ```bash
   python simple_dashboard_server.py
   ```
   Backend runs on: http://localhost:8000

4. **Start Frontend:**
   ```bash
   npm run dev
   ```
   Frontend runs on: http://localhost:5173

5. **Test:**
   - Open http://localhost:5173
   - Frontend will call http://localhost:8000/api/...

✅ **Done!** Frontend and backend are connected.

---

### Scenario 2: Docker Deployment (Easiest)

**Both in Docker containers:**

1. **Edit `.env`:**
   ```env
   VITE_API_URL=http://localhost:8000
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   ```

2. **Deploy:**
   ```bash
   docker-compose up -d
   ```

3. **Access:**
   - Dashboard: http://localhost:3000
   - API: http://localhost:8000

✅ **Done!** Docker handles the connection automatically.

---

### Scenario 3: Separate Deployment (Production)

**Frontend and backend on different servers:**

#### Example: Vercel (Frontend) + Railway (Backend)

**Step 1: Deploy Backend First**

1. **Deploy to Railway:**
   - Go to https://railway.app
   - Connect GitHub repo
   - Add environment variables:
     ```
     AWS_ACCESS_KEY_ID=your_key
     AWS_SECRET_ACCESS_KEY=your_secret
     PORT=8000
     ```
   - Deploy!

2. **Get Backend URL:**
   - Railway gives you: `https://campaign-api-production.up.railway.app`
   - Copy this URL!

**Step 2: Deploy Frontend**

1. **Deploy to Vercel:**
   ```bash
   vercel
   ```

2. **Set Environment Variable in Vercel:**
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Add:
     - **Name**: `VITE_API_URL`
     - **Value**: `https://campaign-api-production.up.railway.app`
   - Save

3. **Redeploy:**
   ```bash
   vercel --prod
   ```

✅ **Done!** Frontend now connects to backend on Railway.

---

### Scenario 4: AWS Deployment

**Frontend on Amplify, Backend on App Runner:**

**Step 1: Deploy Backend to App Runner**

1. Build and push Docker image to ECR
2. Deploy via App Runner
3. Get URL: `https://xxx.us-east-1.awsapprunner.com`

**Step 2: Configure Frontend on Amplify**

1. In Amplify Console → Environment Variables
2. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://xxx.us-east-1.awsapprunner.com`
3. Redeploy

✅ **Done!** Frontend connects to App Runner backend.

---

## 🔍 How It Works

### In Your Code:

**Frontend (`src/services/api.ts`):**
```typescript
// Reads VITE_API_URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// Makes API calls
fetch(`${API_BASE_URL}/campaign/start`, {...})
// Becomes: https://your-backend.com/api/campaign/start
```

**Backend (`simple_dashboard_server.py`):**
```python
# CORS must allow your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local dev
        "https://your-frontend.vercel.app",  # Production
    ],
    ...
)
```

---

## ⚙️ Configuration Files

### `.env` (Local - NOT committed to Git)
```env
# Frontend
VITE_API_URL=http://localhost:8000

# Backend
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=us-east-1
PORT=8000
```

### `.env.example` (Template - Committed to Git)
```env
# Frontend Configuration
VITE_API_URL=http://localhost:8000

# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=us-east-1
```

### `docker-compose.yml` (Docker)
```yaml
services:
  frontend:
    environment:
      - VITE_API_URL=http://localhost:8000
  
  backend:
    environment:
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Network Error" or "Failed to fetch"

**Problem:** Frontend can't reach backend

**Solutions:**

1. **Check backend is running:**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status": "healthy"}`

2. **Check VITE_API_URL:**
   ```bash
   # In frontend terminal
   echo $VITE_API_URL  # Mac/Linux
   echo %VITE_API_URL%  # Windows
   ```

3. **Check CORS settings in backend:**
   ```python
   # simple_dashboard_server.py
   allow_origins=[
       "http://localhost:5173",  # Add your frontend URL
   ]
   ```

### Issue 2: "CORS Error"

**Problem:** Backend blocking frontend requests

**Solution:** Update CORS in `simple_dashboard_server.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local dev
        "http://localhost:3000",  # Docker
        "https://your-app.vercel.app",  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 3: Environment Variable Not Working

**Problem:** `VITE_API_URL` not being read

**Solutions:**

1. **Restart dev server:**
   ```bash
   # Stop (Ctrl+C)
   npm run dev  # Start again
   ```

2. **Check .env file location:**
   - Must be in project root (same folder as `package.json`)

3. **Check variable name:**
   - Must start with `VITE_` for Vite to read it
   - Correct: `VITE_API_URL`
   - Wrong: `API_URL`

---

## ✅ Quick Test

### Test Backend:
```bash
curl http://localhost:8000/health
```
Expected: `{"status": "healthy"}`

### Test Frontend Connection:
1. Open browser console (F12)
2. Go to Network tab
3. Start a campaign
4. Check requests go to correct URL

---

## 📋 Deployment Checklist

- [ ] Backend deployed and running
- [ ] Backend URL copied
- [ ] `VITE_API_URL` set in frontend deployment
- [ ] CORS configured with frontend URL
- [ ] Frontend redeployed
- [ ] Test: Create campaign works
- [ ] Test: Content generation works
- [ ] Test: Analytics works

---

## 🎯 Quick Reference

| Environment | VITE_API_URL Value |
|------------|-------------------|
| Local Dev | `http://localhost:8000` |
| Docker | `http://localhost:8000` |
| Vercel + Railway | `https://your-backend.railway.app` |
| Amplify + App Runner | `https://xxx.awsapprunner.com` |

---

## 💡 Pro Tips

1. **Always deploy backend first**, then configure frontend
2. **Test backend health** before deploying frontend
3. **Update CORS** when adding new frontend URLs
4. **Use HTTPS** in production (not HTTP)
5. **Keep `.env` secret** - never commit to Git

---

## 📞 Need Help?

**Backend not responding:**
- Check logs: `docker-compose logs backend`
- Check health: `curl http://localhost:8000/health`

**Frontend can't connect:**
- Check browser console for errors
- Verify `VITE_API_URL` is set
- Check CORS settings

**Still stuck?**
- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Review platform-specific docs

---

**Ready to set up?** Choose your scenario above and follow the steps!
