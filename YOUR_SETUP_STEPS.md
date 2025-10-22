# 🎯 Your Setup Steps - Simple Guide

Follow these steps to get your Campaign Dashboard running.

## 🚀 Option 1: Quick Local Test (5 minutes)

**Best for:** Testing everything works on your computer

### Step 1: Create .env file
```bash
copy .env.example .env
```

### Step 2: Edit .env file
Open `.env` in notepad and add your AWS credentials:
```env
# Frontend Configuration
VITE_API_URL=http://localhost:8000

# AWS Configuration (REQUIRED)
AWS_ACCESS_KEY_ID=AKIA...your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=us-east-1
```

### Step 3: Start Backend
```bash
python simple_dashboard_server.py
```
You should see: `Server running on http://localhost:8000`

### Step 4: Start Frontend (New Terminal)
```bash
npm run dev
```
You should see: `Local: http://localhost:5173`

### Step 5: Test
- Open http://localhost:5173
- Create a campaign
- It should work! ✅

---

## 🐳 Option 2: Docker (Easiest - 3 minutes)

**Best for:** Quick deployment without setup hassle

### Step 1: Create .env file
```bash
copy .env.example .env
```

### Step 2: Edit .env file
Add your AWS credentials:
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=us-east-1
```

### Step 3: Deploy
```bash
docker-compose up -d
```

### Step 4: Access
- Dashboard: http://localhost:3000
- Done! ✅

---

## ☁️ Option 3: Deploy Publicly (15 minutes)

**Best for:** Sharing with others

### Step 1: Deploy Backend (Railway)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add environment variables:
   ```
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   PORT=8000
   ```
5. Click "Deploy"
6. **Copy the URL** (e.g., `https://campaign-api.railway.app`)

### Step 2: Deploy Frontend (Vercel)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. When prompted, answer:
   - Set up and deploy? **Y**
   - Which scope? **Your account**
   - Link to existing project? **N**
   - Project name? **campaign-dashboard**
   - Directory? **./  (press Enter)**
   - Override settings? **N**

4. **Add environment variable:**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Settings → Environment Variables
   - Add:
     - **Name**: `VITE_API_URL`
     - **Value**: `https://campaign-api.railway.app` (your Railway URL)
   - Save

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

6. **Done!** Your app is live at: `https://campaign-dashboard.vercel.app`

---

## 🔧 What is VITE_API_URL?

Simple explanation:

- **Frontend** = The website (React)
- **Backend** = The API server (Python)
- **VITE_API_URL** = Address where frontend finds backend

### Examples:

**Local development:**
```
Frontend: http://localhost:5173
Backend: http://localhost:8000
VITE_API_URL: http://localhost:8000
```

**Production:**
```
Frontend: https://your-app.vercel.app
Backend: https://your-api.railway.app
VITE_API_URL: https://your-api.railway.app
```

---

## ✅ Quick Checklist

### For Local Development:
- [ ] `.env` file created
- [ ] AWS credentials added to `.env`
- [ ] `VITE_API_URL=http://localhost:8000` in `.env`
- [ ] Backend running: `python simple_dashboard_server.py`
- [ ] Frontend running: `npm run dev`
- [ ] Test: http://localhost:5173 works

### For Docker:
- [ ] `.env` file created
- [ ] AWS credentials added
- [ ] Run: `docker-compose up -d`
- [ ] Test: http://localhost:3000 works

### For Production:
- [ ] Backend deployed (Railway/AWS)
- [ ] Backend URL copied
- [ ] Frontend deployed (Vercel/Amplify)
- [ ] `VITE_API_URL` set in frontend platform
- [ ] Frontend redeployed
- [ ] Test: Create campaign works

---

## 🚨 Common Problems

### "Network Error" when creating campaign

**Fix:**
1. Check backend is running:
   ```bash
   curl http://localhost:8000/health
   ```
2. Check `.env` has correct `VITE_API_URL`
3. Restart frontend: `npm run dev`

### "CORS Error" in browser console

**Fix:**
Open `simple_dashboard_server.py` and add your frontend URL:
```python
allow_origins=[
    "http://localhost:5173",  # Local
    "https://your-app.vercel.app",  # Production
]
```

### Environment variable not working

**Fix:**
1. Make sure `.env` is in project root (same folder as `package.json`)
2. Restart dev server (Ctrl+C, then `npm run dev`)
3. Variable must start with `VITE_`

---

## 📞 Need Help?

**Check these files:**
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup guide
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Full deployment guide
- [README.md](./README.md) - Project overview

**Test commands:**
```bash
# Test backend
curl http://localhost:8000/health

# Check environment variable
echo $VITE_API_URL  # Mac/Linux
echo %VITE_API_URL%  # Windows
```

---

## 🎉 You're Ready!

Choose an option above and follow the steps. You'll have your dashboard running in minutes!

**Recommended path:**
1. Start with **Option 1** (Local Test) to verify everything works
2. Then try **Option 2** (Docker) for easy deployment
3. Finally **Option 3** (Public) when ready to share

**Good luck!** 🚀
