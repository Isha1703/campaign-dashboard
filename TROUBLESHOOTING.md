# Troubleshooting Guide

## Common Errors & Solutions

### Backend Errors

#### "No matching distribution found for strands-agents"
**Cause**: Python version too old

**Solution**:
```bash
python --version  # Must be 3.11+
# Install Python 3.11+ if needed
```

#### "AWS credentials not found"
**Cause**: Missing AWS credentials

**Solution**:
```bash
# Create .env file with:
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=us-east-1
```

#### "Port already in use"
**Cause**: Port 8000 is occupied

**Solution**:
```bash
# Windows: Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :8000
kill -9 <PID>
```

### Frontend Errors

#### "Network Error" when creating campaign
**Cause**: Backend not running or wrong URL

**Solution**:
```bash
# 1. Check backend is running
curl http://localhost:8000/test

# 2. Check .env.local has correct URL
cat .env.local
# Should show: VITE_API_URL=http://localhost:8000

# 3. Restart frontend
npm run dev
```

#### "CORS policy blocked"
**Cause**: Frontend URL not in CORS config

**Solution**:
Edit `simple_dashboard_server.py`:
```python
allow_origins=[
    "http://localhost:5173",  # Add your URL
    # ... other URLs
]
```

### Deployment Errors

#### Railway build fails
**Solution**: Already fixed - Dockerfile uses Python 3.11

#### Amplify shows network error
**Solution**: 
1. Deploy backend to Railway first
2. Get Railway URL
3. Update Amplify env: `VITE_API_URL=https://your-app.railway.app`
4. Redeploy Amplify

## Quick Checks

- [ ] Python 3.11+ installed
- [ ] AWS credentials in .env
- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] CORS includes frontend URL
- [ ] No firewall blocking ports
