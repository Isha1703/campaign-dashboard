# Deployment Checklist

## ✅ Railway Backend Deployment

### 1. Prerequisites
- [ ] Railway account created
- [ ] GitHub repository connected to Railway
- [ ] AWS credentials ready (for S3 and Bedrock)

### 2. Railway Configuration
- [ ] Project created in Railway
- [ ] Repository connected
- [ ] Dockerfile detected automatically

### 3. Environment Variables (Railway Dashboard)
```env
# Required
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=us-east-1

# Optional (for MCP tools)
AGENTCORE_API_KEY=your_key
AGENTCORE_ENDPOINT=https://api.agentcore.aws.dev

# Application
PORT=8000
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### 4. Build & Deploy
- [ ] Railway automatically builds Docker image
- [ ] Build completes successfully (Python 3.11)
- [ ] Dependencies installed (requirements.txt + mcp_requirements.txt)
- [ ] Server starts on dynamic PORT
- [ ] Health check passes

### 5. Get Backend URL
- [ ] Copy Railway URL (e.g., `https://your-app.railway.app`)
- [ ] Test health endpoint: `https://your-app.railway.app/test`
- [ ] Verify API docs: `https://your-app.railway.app/docs`

## ✅ Amplify Frontend Configuration

### 6. Update Environment Variables
Go to AWS Amplify Console → Your App → Environment Variables:

```env
VITE_DEMO_MODE=false
VITE_API_URL=https://your-app.railway.app
```

### 7. Update CORS in Backend
Edit `simple_dashboard_server.py`:

```python
allow_origins=[
    "https://main.d296oiluscvwnx.amplifyapp.com",  # Your Amplify URL
    "https://your-app.railway.app",                 # Railway backend
    "http://localhost:5173",                        # Local dev
]
```

Commit and push - Railway will auto-redeploy.

### 8. Redeploy Amplify
- [ ] Trigger new deployment in Amplify Console
- [ ] Wait for build to complete
- [ ] Verify deployment successful

## ✅ Testing

### 9. Backend Tests
```bash
# Health check
curl https://your-app.railway.app/test

# Expected: {"message": "Server is running", "timestamp": ...}

# API docs
open https://your-app.railway.app/docs
```

### 10. Frontend Tests
- [ ] Open Amplify URL: https://main.d296oiluscvwnx.amplifyapp.com
- [ ] No "Network Error" shown
- [ ] Can create new campaign
- [ ] Campaign form submits successfully
- [ ] Progress bar shows agent execution
- [ ] Content generation completes
- [ ] Analytics tab loads data
- [ ] Optimization tab shows recommendations

### 11. End-to-End Campaign Test
- [ ] Click "Create New Campaign"
- [ ] Fill in product details
- [ ] Set budget (e.g., $5000)
- [ ] Submit campaign
- [ ] Watch real-time agent logs
- [ ] Wait for completion (2-3 minutes)
- [ ] Review generated content
- [ ] Check analytics data
- [ ] Test optimization recommendations

## ✅ Monitoring

### 12. Railway Monitoring
- [ ] Check deployment logs for errors
- [ ] Monitor CPU/Memory usage
- [ ] Set up alerts for downtime
- [ ] Review request logs

### 13. Amplify Monitoring
- [ ] Check build logs
- [ ] Monitor frontend errors
- [ ] Review CloudWatch logs
- [ ] Test from different browsers

## 🐛 Troubleshooting

### Railway Build Fails
**Issue**: "No matching distribution found for strands-agents"
- ✅ **Fixed**: Dockerfile now uses Python 3.11

**Issue**: Port binding error
- ✅ **Fixed**: Server reads PORT from environment

### Amplify Shows Network Error
**Issue**: Cannot connect to backend
- [ ] Verify Railway URL is correct in VITE_API_URL
- [ ] Check CORS includes Amplify URL
- [ ] Test backend health endpoint directly

### CORS Errors
**Issue**: "Access-Control-Allow-Origin" error
- [ ] Add Amplify URL to allow_origins in simple_dashboard_server.py
- [ ] Commit and push to trigger Railway redeploy
- [ ] Clear browser cache and retry

### Campaign Creation Fails
**Issue**: Agents don't execute
- [ ] Check AWS credentials in Railway
- [ ] Verify S3 bucket access
- [ ] Check Railway logs for errors
- [ ] Test MCP gateway connection

## 📊 Success Criteria

All these should work:
- ✅ Backend deployed and accessible
- ✅ Frontend deployed and accessible
- ✅ No network errors
- ✅ Can create campaigns
- ✅ AI agents execute successfully
- ✅ Content generation works
- ✅ Analytics display correctly
- ✅ Optimization recommendations shown
- ✅ S3 media uploads work
- ✅ Real-time logs stream properly

## 🎉 Deployment Complete!

Once all checkboxes are ticked, your campaign dashboard is fully deployed and operational!

**URLs:**
- Frontend: https://main.d296oiluscvwnx.amplifyapp.com
- Backend: https://your-app.railway.app
- API Docs: https://your-app.railway.app/docs

## 📚 Next Steps

1. Create your first real campaign
2. Monitor performance and costs
3. Set up custom domain (optional)
4. Configure database for persistence (optional)
5. Add authentication (optional)
6. Set up CI/CD pipeline (optional)

## 📞 Support

- Railway: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- Amplify: [AMPLIFY_DEPLOYMENT.md](./AMPLIFY_DEPLOYMENT.md)
- General: [README.md](./README.md)
