# Railway Deployment Guide

## Quick Deploy to Railway

Railway will automatically detect your Dockerfile and deploy the backend.

### Prerequisites
- Railway account (free tier available)
- GitHub repository connected

### Step 1: Create New Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `campaign-dashboard` repository
5. Railway will auto-detect the Dockerfile

### Step 2: Configure Environment Variables

Add these environment variables in Railway dashboard:

```env
# AWS Configuration (Required for real campaigns)
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=us-east-1

# AgentCore Configuration (Optional - for MCP tools)
AGENTCORE_API_KEY=your_agentcore_key_here
AGENTCORE_ENDPOINT=https://api.agentcore.aws.dev

# Application Settings
PORT=8000
ENVIRONMENT=production
LOG_LEVEL=INFO

# CORS Origins (Add your Amplify URL)
CORS_ORIGINS=https://main.d296oiluscvwnx.amplifyapp.com,http://localhost:5173
```

### Step 3: Deploy

Railway will automatically:
1. Build the Docker image (Python 3.11)
2. Install dependencies from requirements.txt
3. Start the FastAPI server
4. Provide a public URL (e.g., `https://your-app.railway.app`)

### Step 4: Update Amplify

Once deployed, update your Amplify environment variables:

1. Go to AWS Amplify Console
2. Select your app
3. Go to "Environment variables"
4. Update:
   ```
   VITE_DEMO_MODE=false
   VITE_API_URL=https://your-app.railway.app
   ```
5. Redeploy frontend

### Step 5: Update CORS

Update `simple_dashboard_server.py` to include your Railway URL:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://main.d296oiluscvwnx.amplifyapp.com",  # Amplify
        "https://your-app.railway.app",                 # Railway backend
        "http://localhost:5173",                        # Local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit and push this change - Railway will auto-redeploy.

## Troubleshooting

### Build fails with "No matching distribution found for strands-agents"

**Cause**: Python version too old (needs 3.11+)

**Solution**: Already fixed in Dockerfile - use Python 3.11-slim

### "Module not found" errors

**Cause**: Missing dependencies

**Solution**: Check requirements.txt and mcp_requirements.txt are complete

### Port binding errors

**Cause**: Railway expects app to bind to PORT environment variable

**Solution**: Already configured in simple_dashboard_server.py:
```python
port = int(os.getenv("PORT", 8000))
uvicorn.run(app, host="0.0.0.0", port=port)
```

### CORS errors from Amplify

**Cause**: Amplify URL not in allow_origins

**Solution**: Add Amplify URL to CORS configuration (see Step 5)

## Monitoring

### View Logs
```bash
# In Railway dashboard
1. Click on your deployment
2. Go to "Deployments" tab
3. Click on latest deployment
4. View logs in real-time
```

### Check Health
```bash
# Test backend is running
curl https://your-app.railway.app/test

# Expected response:
{"message": "Server is running", "timestamp": 1234567890}
```

### Test Campaign Creation
```bash
# Test campaign endpoint
curl -X POST https://your-app.railway.app/api/campaign/start \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Test Product",
    "product_cost": 29.99,
    "budget": 5000
  }'
```

## Cost Estimate

Railway pricing:
- **Free Tier**: $5 credit/month (good for testing)
- **Hobby Plan**: $5/month (500 hours)
- **Pro Plan**: $20/month (unlimited)

Estimated usage:
- Backend server: ~$5-10/month
- Database (if added): ~$5/month
- Total: ~$10-15/month

## Automatic Deployments

Railway automatically redeploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update backend"
git push

# Railway will automatically:
# 1. Detect the push
# 2. Rebuild Docker image
# 3. Deploy new version
# 4. Zero-downtime deployment
```

## Custom Domain (Optional)

1. Go to Railway dashboard
2. Click on your service
3. Go to "Settings" > "Domains"
4. Add custom domain
5. Update DNS records as instructed
6. Update Amplify VITE_API_URL to custom domain

## Scaling

Railway automatically scales based on:
- CPU usage
- Memory usage
- Request volume

For high traffic:
1. Upgrade to Pro plan
2. Enable autoscaling
3. Add Redis for session storage
4. Add database for persistence

## Next Steps

After successful deployment:

1. ✅ Test campaign creation from Amplify
2. ✅ Verify AI agents execute correctly
3. ✅ Check S3 media uploads work
4. ✅ Monitor logs for errors
5. ✅ Set up alerts for downtime

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Your repository issues page
