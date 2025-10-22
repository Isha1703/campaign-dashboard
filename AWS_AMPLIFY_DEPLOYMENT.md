# 🚀 AWS Amplify Deployment Guide

Complete step-by-step guide to deploy your Campaign Dashboard on AWS Amplify.

## 📋 Overview

**What we're deploying:**
- **Frontend**: AWS Amplify (React app)
- **Backend**: AWS App Runner or EC2 (Python API)
- **Storage**: AWS S3 (media files)

**Estimated time:** 30-45 minutes
**Cost:** ~$30-70/month

---

## 🎯 Step-by-Step Deployment

### Part 1: Upload to GitHub (Required First)

AWS Amplify deploys from GitHub, so we need to upload your code first.

#### 1. Commit Your Code
```bash
git commit -m "Initial commit: Campaign Dashboard"
```

#### 2. Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `campaign-dashboard`
3. Description: `AI-powered marketing campaign management platform`
4. Choose **Public** or **Private**
5. **DO NOT** check "Initialize with README"
6. Click **Create repository**

#### 3. Push to GitHub
```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/campaign-dashboard.git
git branch -M main
git push -u origin main
```

✅ **Checkpoint:** Your code is now on GitHub!

---

### Part 2: Deploy Backend (Python API)

You have two options for backend:

#### Option A: AWS App Runner (Recommended - Easier)

1. **Go to AWS App Runner Console:**
   - https://console.aws.amazon.com/apprunner/

2. **Create Service:**
   - Click "Create service"
   - Source: **Source code repository**
   - Connect to GitHub
   - Select your repository: `campaign-dashboard`
   - Branch: `main`

3. **Configure Build:**
   - Build settings: **Configure all settings here**
   - Runtime: **Python 3**
   - Build command:
     ```bash
     pip install -r requirements.txt && pip install -r mcp_requirements.txt
     ```
   - Start command:
     ```bash
     python simple_dashboard_server.py
     ```
   - Port: `8000`

4. **Add Environment Variables:**
   Click "Add environment variable" for each:
   ```
   AWS_ACCESS_KEY_ID = your_access_key
   AWS_SECRET_ACCESS_KEY = your_secret_key
   AWS_DEFAULT_REGION = us-east-1
   PORT = 8000
   ENVIRONMENT = production
   ```

5. **Configure Service:**
   - Service name: `campaign-dashboard-api`
   - Virtual CPU: 1 vCPU
   - Memory: 2 GB
   - Auto scaling: Min 1, Max 3

6. **Create & Deploy:**
   - Click "Create & deploy"
   - Wait 5-10 minutes for deployment

7. **Get Backend URL:**
   - After deployment, copy the URL
   - Example: `https://abc123.us-east-1.awsapprunner.com`
   - **Save this URL!** You'll need it for frontend

✅ **Checkpoint:** Backend is deployed and running!

#### Option B: AWS EC2 (More Control)

See detailed EC2 guide in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

### Part 3: Deploy Frontend (React App) on AWS Amplify

#### 1. Go to AWS Amplify Console
- https://console.aws.amazon.com/amplify/

#### 2. Create New App
- Click "New app" → "Host web app"
- Choose: **GitHub**
- Click "Connect branch"

#### 3. Authorize GitHub
- Click "Authorize AWS Amplify"
- Grant access to your repositories

#### 4. Select Repository
- Repository: `YOUR_USERNAME/campaign-dashboard`
- Branch: `main`
- Click "Next"

#### 5. Configure Build Settings

**App name:** `campaign-dashboard`

**Build settings** (auto-detected, but verify):
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

Click "Next"

#### 6. Review and Save
- Review all settings
- Click "Save and deploy"
- Wait 5-10 minutes for first deployment

✅ **Checkpoint:** Frontend is deployed!

---

### Part 4: Connect Frontend to Backend

#### 1. Add Environment Variable in Amplify

1. **Go to your Amplify app**
2. **Click "Environment variables"** (left sidebar)
3. **Click "Manage variables"**
4. **Add variable:**
   - **Variable name:** `VITE_API_URL`
   - **Value:** Your App Runner URL (from Part 2)
     - Example: `https://abc123.us-east-1.awsapprunner.com`
   - Click "Save"

#### 2. Redeploy Frontend

1. Go to "Deployments" tab
2. Click "Redeploy this version"
3. Wait for deployment to complete

✅ **Checkpoint:** Frontend can now talk to backend!

---

### Part 5: Configure CORS on Backend

Your backend needs to allow requests from your Amplify frontend.

#### 1. Update Backend Code

Edit `simple_dashboard_server.py` and update CORS:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://main.d1234567890.amplifyapp.com",  # Your Amplify URL
        "http://localhost:5173",  # Keep for local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 2. Get Your Amplify URL

1. Go to Amplify Console
2. Your app URL is shown at the top
3. Example: `https://main.d1234567890.amplifyapp.com`

#### 3. Push Changes

```bash
git add simple_dashboard_server.py
git commit -m "Update CORS for Amplify"
git push
```

App Runner will automatically redeploy with new CORS settings.

✅ **Checkpoint:** CORS configured!

---

### Part 6: Test Your Deployment

#### 1. Access Your App
- Go to your Amplify URL
- Example: `https://main.d1234567890.amplifyapp.com`

#### 2. Test Features
- [ ] Homepage loads
- [ ] Create a campaign
- [ ] Content generation works
- [ ] Images/videos load
- [ ] Analytics display
- [ ] No console errors (F12)

#### 3. Check Backend Health
```bash
curl https://your-apprunner-url.com/health
```
Should return: `{"status": "healthy"}`

✅ **Success!** Your app is live on AWS!

---

## 🔧 Configuration Summary

### Frontend (Amplify)
- **URL:** `https://main.d1234567890.amplifyapp.com`
- **Environment Variables:**
  - `VITE_API_URL` = Your App Runner URL

### Backend (App Runner)
- **URL:** `https://abc123.us-east-1.awsapprunner.com`
- **Environment Variables:**
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_DEFAULT_REGION`
  - `PORT = 8000`

### CORS Configuration
```python
allow_origins=[
    "https://main.d1234567890.amplifyapp.com",  # Amplify
    "http://localhost:5173",  # Local dev
]
```

---

## 🎨 Optional: Custom Domain

### Add Custom Domain to Amplify

1. **Go to Amplify Console**
2. **Domain management** → "Add domain"
3. **Enter your domain:** `campaigndashboard.com`
4. **Configure DNS:**
   - Amplify provides DNS records
   - Add them to your domain registrar
5. **Wait for SSL certificate** (5-10 minutes)

### Update CORS for Custom Domain

```python
allow_origins=[
    "https://campaigndashboard.com",
    "https://www.campaigndashboard.com",
    "https://main.d1234567890.amplifyapp.com",
]
```

---

## 🔄 Continuous Deployment

**Automatic deployments are now enabled!**

Every time you push to GitHub:
1. Amplify automatically detects changes
2. Builds and deploys frontend
3. App Runner redeploys backend (if backend files changed)

**To deploy updates:**
```bash
git add .
git commit -m "Update feature"
git push
```

Wait 5-10 minutes, changes are live!

---

## 💰 Cost Breakdown

### AWS Amplify (Frontend)
- **Build minutes:** $0.01/minute
- **Hosting:** $0.15/GB stored + $0.15/GB served
- **Estimated:** $5-15/month

### AWS App Runner (Backend)
- **Compute:** $0.064/vCPU-hour + $0.007/GB-hour
- **1 vCPU, 2GB:** ~$25-40/month
- **Auto-scaling:** Pay only for what you use

### AWS S3 (Storage)
- **Storage:** $0.023/GB
- **Requests:** $0.0004/1000 requests
- **Estimated:** $1-5/month

### Total: ~$30-70/month

**Free tier eligible for first 12 months!**

---

## 🚨 Troubleshooting

### Frontend builds but shows blank page

**Fix:**
1. Check browser console (F12) for errors
2. Verify `VITE_API_URL` is set in Amplify
3. Check build logs in Amplify Console

### "Network Error" when creating campaign

**Fix:**
1. Verify backend is running:
   ```bash
   curl https://your-apprunner-url.com/health
   ```
2. Check `VITE_API_URL` in Amplify environment variables
3. Verify CORS includes your Amplify URL

### Backend deployment fails

**Fix:**
1. Check App Runner logs
2. Verify all environment variables are set
3. Check `requirements.txt` is complete

### CORS errors in browser

**Fix:**
1. Update `simple_dashboard_server.py` with correct Amplify URL
2. Push changes to GitHub
3. Wait for App Runner to redeploy

---

## 📊 Monitoring

### Amplify Monitoring
- **Console:** https://console.aws.amazon.com/amplify/
- **Metrics:** Build success rate, deployment time
- **Logs:** Build logs, deployment logs

### App Runner Monitoring
- **Console:** https://console.aws.amazon.com/apprunner/
- **Metrics:** CPU, memory, requests
- **Logs:** Application logs, access logs

### CloudWatch (Optional)
- Set up alarms for errors
- Monitor costs
- Track performance

---

## 🔒 Security Best Practices

1. **Use IAM roles** instead of access keys (when possible)
2. **Enable AWS WAF** for DDoS protection
3. **Use Secrets Manager** for sensitive data
4. **Enable CloudTrail** for audit logs
5. **Regular security updates** via GitHub pushes

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] AWS account created
- [ ] AWS credentials ready
- [ ] Domain purchased (optional)

### Backend Deployment
- [ ] App Runner service created
- [ ] Environment variables set
- [ ] Backend deployed successfully
- [ ] Health check passes
- [ ] Backend URL copied

### Frontend Deployment
- [ ] Amplify app created
- [ ] GitHub connected
- [ ] Build settings configured
- [ ] `VITE_API_URL` environment variable set
- [ ] Frontend deployed successfully

### Configuration
- [ ] CORS updated with Amplify URL
- [ ] Backend redeployed with CORS changes
- [ ] Test: Create campaign works
- [ ] Test: All features work
- [ ] No console errors

### Optional
- [ ] Custom domain added
- [ ] SSL certificate active
- [ ] Monitoring set up
- [ ] Alarms configured

---

## 🎉 Success!

Your Campaign Dashboard is now live on AWS!

**Your URLs:**
- **Frontend:** `https://main.d1234567890.amplifyapp.com`
- **Backend:** `https://abc123.us-east-1.awsapprunner.com`

**Share your app with the world!** 🚀

---

## 📞 Need Help?

- **AWS Amplify Docs:** https://docs.amplify.aws
- **AWS App Runner Docs:** https://docs.aws.amazon.com/apprunner/
- **AWS Support:** https://console.aws.amazon.com/support/

---

**Questions?** Check the troubleshooting section or AWS documentation.

**Ready to deploy?** Start with Part 1 above! 🎯
