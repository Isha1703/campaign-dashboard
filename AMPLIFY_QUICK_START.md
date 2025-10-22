# ⚡ AWS Amplify - Quick Start

Your step-by-step guide to deploy on AWS Amplify.

## 🎯 What You Need

- [ ] GitHub account
- [ ] AWS account
- [ ] AWS credentials (Access Key ID & Secret)
- [ ] 30-45 minutes

---

## 📋 Quick Steps

### 1️⃣ Upload to GitHub (5 min)

```bash
# Commit your code
git commit -m "Initial commit: Campaign Dashboard"

# Create repo on GitHub: https://github.com/new
# Name: campaign-dashboard

# Push
git remote add origin https://github.com/YOUR_USERNAME/campaign-dashboard.git
git branch -M main
git push -u origin main
```

✅ **Done!** Code is on GitHub.

---

### 2️⃣ Deploy Backend - AWS App Runner (15 min)

1. **Go to:** https://console.aws.amazon.com/apprunner/

2. **Create Service:**
   - Source: GitHub repository
   - Repository: `campaign-dashboard`
   - Branch: `main`

3. **Build Settings:**
   - Runtime: Python 3
   - Build command: `pip install -r requirements.txt && pip install -r mcp_requirements.txt`
   - Start command: `python simple_dashboard_server.py`
   - Port: `8000`

4. **Environment Variables:**
   ```
   AWS_ACCESS_KEY_ID = your_key
   AWS_SECRET_ACCESS_KEY = your_secret
   AWS_DEFAULT_REGION = us-east-1
   PORT = 8000
   ```

5. **Create & Deploy**

6. **Copy Backend URL:**
   - Example: `https://abc123.us-east-1.awsapprunner.com`
   - **SAVE THIS!** You need it for step 3

✅ **Done!** Backend is running.

---

### 3️⃣ Deploy Frontend - AWS Amplify (10 min)

1. **Go to:** https://console.aws.amazon.com/amplify/

2. **New App:**
   - "Host web app" → GitHub
   - Repository: `campaign-dashboard`
   - Branch: `main`

3. **Build Settings:**
   - Auto-detected (just click Next)

4. **Save and Deploy**

5. **Add Environment Variable:**
   - Go to "Environment variables"
   - Add:
     - Name: `VITE_API_URL`
     - Value: `https://abc123.us-east-1.awsapprunner.com` (your backend URL from step 2)
   - Save

6. **Redeploy:**
   - Go to "Deployments"
   - Click "Redeploy this version"

✅ **Done!** Frontend is live!

---

### 4️⃣ Configure CORS (5 min)

1. **Get your Amplify URL:**
   - Example: `https://main.d1234567890.amplifyapp.com`

2. **Update `simple_dashboard_server.py`:**
   ```python
   allow_origins=[
       "https://main.d1234567890.amplifyapp.com",  # Your Amplify URL
       "http://localhost:5173",
   ]
   ```

3. **Push changes:**
   ```bash
   git add simple_dashboard_server.py
   git commit -m "Update CORS"
   git push
   ```

✅ **Done!** CORS configured.

---

### 5️⃣ Test (5 min)

1. **Open your Amplify URL**
2. **Create a campaign**
3. **Check it works!**

✅ **Success!** Your app is live! 🎉

---

## 🔗 Your URLs

**Frontend (Amplify):**
```
https://main.d1234567890.amplifyapp.com
```

**Backend (App Runner):**
```
https://abc123.us-east-1.awsapprunner.com
```

---

## 🚨 Common Issues

### "Network Error" when creating campaign

**Fix:**
1. Check `VITE_API_URL` is set in Amplify
2. Verify backend is running: `curl https://your-backend-url.com/health`
3. Check CORS includes your Amplify URL

### Blank page after deployment

**Fix:**
1. Check browser console (F12)
2. Verify `VITE_API_URL` environment variable
3. Check Amplify build logs

### CORS error

**Fix:**
1. Update `simple_dashboard_server.py` with correct Amplify URL
2. Push to GitHub
3. Wait for App Runner to redeploy

---

## 💰 Cost

- **Amplify:** $5-15/month
- **App Runner:** $25-40/month
- **S3:** $1-5/month
- **Total:** ~$30-70/month

**Free tier available for first 12 months!**

---

## 🔄 Update Your App

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Wait 5-10 minutes
# Changes are automatically deployed!
```

---

## 📚 Full Guide

For detailed instructions, see:
- **[AWS_AMPLIFY_DEPLOYMENT.md](./AWS_AMPLIFY_DEPLOYMENT.md)** - Complete guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - All deployment options

---

## ✅ Deployment Checklist

- [ ] Code on GitHub
- [ ] Backend deployed (App Runner)
- [ ] Backend URL copied
- [ ] Frontend deployed (Amplify)
- [ ] `VITE_API_URL` set in Amplify
- [ ] CORS updated
- [ ] Test: Campaign creation works
- [ ] Test: All features work

---

## 🎯 Quick Reference

| What | Where | Value |
|------|-------|-------|
| Backend | App Runner | `https://abc123.awsapprunner.com` |
| Frontend | Amplify | `https://main.d123.amplifyapp.com` |
| Environment Variable | Amplify | `VITE_API_URL` = Backend URL |
| CORS | `simple_dashboard_server.py` | Add Amplify URL |

---

**Ready to deploy?** Follow the 5 steps above! 🚀

**Need help?** Check [AWS_AMPLIFY_DEPLOYMENT.md](./AWS_AMPLIFY_DEPLOYMENT.md) for detailed guide.
