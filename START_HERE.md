# 🚀 START HERE - Deploy Your Campaign Dashboard

Welcome! This guide will get your Campaign Dashboard deployed publicly in minutes.

## 🎯 What You're Deploying

A professional marketing campaign dashboard with:
- ✅ AI-powered content generation
- ✅ Multi-platform ad creation (Instagram, LinkedIn, Facebook, etc.)
- ✅ Real-time analytics
- ✅ Budget optimization
- ✅ Image & video generation
- ✅ Campaign approval workflow

---

## ⚡ Fastest Way to Deploy (5 minutes)

### Using Docker:

1. **Install Docker Desktop:**
   - Download: https://www.docker.com/products/docker-desktop
   - Install and start Docker

2. **Configure your credentials:**
   ```bash
   # Copy the example environment file
   copy .env.example .env
   
   # Edit .env with your AWS credentials
   notepad .env
   ```

3. **Deploy:**
   ```bash
   docker-compose up -d
   ```

4. **Access your dashboard:**
   - Open: http://localhost:3000
   - API: http://localhost:8000

**Done!** 🎉

---

## 🌐 Deploy Publicly (10 minutes)

### Option 1: Vercel (Frontend) + Railway (Backend)

**Frontend:**
```bash
npm install -g vercel
vercel
```

**Backend:**
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add environment variables (see below)
5. Deploy!

**Cost:** Free tier available

---

### Option 2: AWS (Production-ready)

**Frontend (Amplify):**
1. Push code to GitHub
2. Go to AWS Amplify Console
3. Connect repository
4. Deploy!

**Backend (App Runner):**
1. Build Docker image
2. Push to AWS ECR
3. Deploy via App Runner

**Cost:** ~$30-70/month

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed AWS instructions.

---

## 🔑 Required Credentials

### AWS (Required):
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=us-east-1
```

**How to get AWS credentials:**
1. Go to AWS Console → IAM
2. Create new user with S3 access
3. Generate access keys
4. Copy to `.env` file

### AgentCore (Optional):
```env
AGENTCORE_API_KEY=your_key
AGENTCORE_ENDPOINT=https://api.agentcore.aws.dev
```

---

## 📋 Deployment Files

All deployment files are ready:

- ✅ `Dockerfile` - Backend container
- ✅ `Dockerfile.frontend` - Frontend container
- ✅ `docker-compose.yml` - Full stack deployment
- ✅ `nginx.conf` - Web server config
- ✅ `vercel.json` - Vercel configuration
- ✅ `railway.json` - Railway configuration
- ✅ `.env.example` - Environment template

---

## 🛠️ Deployment Scripts

### Docker:
```bash
# Windows
docker-compose up -d

# Linux/Mac
chmod +x deploy-docker.sh
./deploy-docker.sh
```

### Vercel:
```bash
# Windows/Linux/Mac
npm install -g vercel
vercel
```

### AWS:
```bash
# Linux/Mac
chmod +x deploy-aws.sh
./deploy-aws.sh
```

---

## ✅ Verify Deployment

### Check Services:
```bash
# Frontend
curl http://localhost:3000

# Backend health
curl http://localhost:8000/health
```

### Test Features:
1. Open dashboard
2. Create a campaign
3. Generate content
4. View analytics

---

## 📚 Documentation

- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - Overview & quick start
- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - Fast deployment guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Comprehensive guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist

---

## 🚨 Troubleshooting

### Docker not starting?
```bash
# Check Docker is running
docker --version

# View logs
docker-compose logs -f

# Restart
docker-compose restart
```

### Port already in use?
```bash
# Edit docker-compose.yml
# Change ports from 3000:80 to 3001:80
```

### API not connecting?
1. Check backend is running: `curl http://localhost:8000/health`
2. Verify `VITE_API_URL` in `.env`
3. Check CORS settings in `simple_dashboard_server.py`

---

## 💡 Tips

### For Testing:
- Use Docker for quick local testing
- Test all features before public deployment
- Check logs regularly

### For Production:
- Use AWS or Vercel + Railway
- Enable HTTPS
- Set up monitoring
- Configure backups

### For Development:
```bash
# Frontend
npm run dev

# Backend
python simple_dashboard_server.py
```

---

## 🎯 Recommended Deployment Path

1. **Test Locally (Docker)** - 5 minutes
   - Verify everything works
   - Test all features
   - Check logs

2. **Deploy Publicly (Vercel + Railway)** - 10 minutes
   - Get it online quickly
   - Share with stakeholders
   - Collect feedback

3. **Scale to Production (AWS)** - When ready
   - Add custom domain
   - Enable auto-scaling
   - Set up monitoring

---

## 📊 Cost Comparison

| Platform | Setup | Monthly Cost | Best For |
|----------|-------|--------------|----------|
| Docker (self-hosted) | 5 min | $10-30 | Testing |
| Vercel + Railway | 10 min | $5-40 | Quick deploy |
| AWS | 30 min | $30-70 | Production |

---

## 🎉 Next Steps

After deployment:

1. **Test Everything:**
   - Create test campaign
   - Generate content
   - Check analytics

2. **Configure:**
   - Set up custom domain
   - Enable HTTPS
   - Configure monitoring

3. **Share:**
   - Share URL with team
   - Collect feedback
   - Iterate

---

## 📞 Need Help?

### Quick Fixes:
- **Build fails:** `npm run build` to test locally
- **Docker issues:** `docker-compose down -v && docker-compose up -d`
- **API errors:** Check `.env` file and CORS settings

### Documentation:
- Docker: https://docs.docker.com
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- AWS: https://docs.aws.amazon.com

---

## ✨ You're Ready!

Everything is set up and ready to deploy. Choose your method above and follow the steps.

**Recommended for first-time deployment:**
1. Start with Docker (5 minutes)
2. Test everything works
3. Then deploy publicly with Vercel + Railway

---

## 🚀 Quick Start Commands

```bash
# 1. Configure
copy .env.example .env
# Edit .env with your credentials

# 2. Deploy with Docker
docker-compose up -d

# 3. Access
# Dashboard: http://localhost:3000
# API: http://localhost:8000

# 4. View logs
docker-compose logs -f

# 5. Stop
docker-compose down
```

---

**Ready to deploy?** Pick a method above and let's go! 🚀

**Questions?** Check the troubleshooting section or review the detailed guides.

**Good luck!** 🎉
