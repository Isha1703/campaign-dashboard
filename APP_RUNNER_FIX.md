# 🔧 App Runner Build Fix

Your App Runner build failed. Here's how to fix it:

## ✅ **Solution: Push Updated Files**

I've created/updated these files:
1. `apprunner.yaml` - App Runner configuration
2. `requirements.txt` - Added FastAPI and Uvicorn

**Push these changes to GitHub:**

```bash
git add apprunner.yaml requirements.txt
git commit -m "Fix App Runner build configuration"
git push
```

---

## 🔄 **Then Retry Deployment:**

### Option 1: Automatic (Recommended)
App Runner will automatically detect the changes and redeploy.

### Option 2: Manual
1. Go to App Runner Console
2. Click "Deploy"
3. Wait for build to complete

---

## 📋 **App Runner Configuration:**

### **Build Settings:**

**If App Runner asks for manual configuration, use:**

```yaml
Build command:
pip install --upgrade pip && pip install -r requirements.txt && pip install -r mcp_requirements.txt

Start command:
python simple_dashboard_server.py

Port:
8000
```

---

## 🎯 **Alternative: Use Docker Instead**

If App Runner still fails, use Docker deployment:

### Step 1: Build Docker Image Locally

```bash
docker build -t campaign-backend .
```

### Step 2: Push to Amazon ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name campaign-backend

# Get login command
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag campaign-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/campaign-backend:latest

# Push image
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/campaign-backend:latest
```

### Step 3: Deploy to App Runner from ECR

1. Go to App Runner Console
2. Create service
3. Source: **Container registry**
4. Select your ECR image
5. Deploy

---

## 🚨 **Common Build Errors:**

### Error: "Failed to execute 'build' command"

**Cause:** Missing dependencies or wrong Python version

**Fix:**
1. Make sure `apprunner.yaml` exists
2. Make sure `requirements.txt` includes FastAPI and Uvicorn
3. Push changes to GitHub

### Error: "Module not found"

**Cause:** Missing package in requirements.txt

**Fix:**
Add missing package to `requirements.txt` and push

### Error: "Port already in use"

**Cause:** Wrong port configuration

**Fix:**
Make sure port is set to `8000` in App Runner settings

---

## ✅ **Simplified Deployment (Recommended)**

Instead of App Runner, you can use **AWS Lambda + API Gateway** which is easier:

### Using AWS Lambda:

1. **Install Serverless Framework:**
   ```bash
   npm install -g serverless
   ```

2. **Create serverless.yml:**
   ```yaml
   service: campaign-dashboard-api
   
   provider:
     name: aws
     runtime: python3.9
     region: us-east-1
   
   functions:
     api:
       handler: simple_dashboard_server.handler
       events:
         - http:
             path: /{proxy+}
             method: ANY
   ```

3. **Deploy:**
   ```bash
   serverless deploy
   ```

---

## 💡 **Easiest Solution: Use Railway Instead**

If AWS App Runner is giving you trouble, **Railway** is much simpler:

### Deploy to Railway (5 minutes):

1. **Go to:** https://railway.app

2. **Click:** "New Project" → "Deploy from GitHub"

3. **Select:** Your repository

4. **Add environment variables:**
   ```
   AWS_ACCESS_KEY_ID = your_key
   AWS_SECRET_ACCESS_KEY = your_secret
   PORT = 8000
   ```

5. **Deploy!**

Railway automatically:
- Detects Python
- Installs dependencies
- Starts your server
- Gives you a URL

**Much easier than App Runner!**

---

## 🎯 **What to Do Now:**

### Option 1: Fix App Runner (Current approach)
```bash
git add apprunner.yaml requirements.txt
git commit -m "Fix App Runner build"
git push
```
Wait for automatic redeploy.

### Option 2: Use Railway (Easier)
1. Go to https://railway.app
2. Deploy from GitHub
3. Get URL in 5 minutes

### Option 3: Use Docker + App Runner
Follow Docker steps above.

---

## 📞 **Need Help?**

**App Runner Logs:**
- Go to App Runner Console
- Click on your service
- Click "Logs" tab
- Look for specific error messages

**Test Locally First:**
```bash
# Install dependencies
pip install -r requirements.txt
pip install -r mcp_requirements.txt

# Run server
python simple_dashboard_server.py

# Should see: "Server running on http://localhost:8000"
```

---

## ✅ **Recommended Path:**

**I recommend using Railway instead of App Runner:**
- ✅ Easier setup
- ✅ Better error messages
- ✅ Automatic deployments
- ✅ Free tier available
- ✅ Works with your existing code

**Railway URL:** https://railway.app

---

**Choose your path and let me know if you need help!** 🚀
