# ⚡ Quick Deploy Guide

Choose your deployment method and follow the steps below.

## 🐳 Option 1: Docker (Easiest - 5 minutes)

**Best for:** Testing, local deployment, or self-hosted servers

### Steps:

1. **Install Docker:**
   - Windows/Mac: [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Linux: `curl -fsSL https://get.docker.com | sh`

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials
   ```

3. **Deploy:**
   ```bash
   # Linux/Mac
   chmod +x deploy-docker.sh
   ./deploy-docker.sh

   # Windows
   docker-compose up -d
   ```

4. **Access:**
   - Dashboard: http://localhost:3000
   - API: http://localhost:8000

**That's it!** 🎉

---

## ☁️ Option 2: Vercel + Railway (Free tier available)

**Best for:** Quick public deployment with minimal setup

### Frontend (Vercel):

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow prompts:**
   - Link to your account
   - Confirm project settings
   - Get your deployment URL

### Backend (Railway):

1. **Go to [Railway.app](https://railway.app)**

2. **Click "New Project" → "Deploy from GitHub repo"**

3. **Select your repository**

4. **Add environment variables:**
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_DEFAULT_REGION`
   - `AGENTCORE_API_KEY`

5. **Deploy!**

6. **Update Vercel:**
   - Go to Vercel dashboard
   - Add environment variable: `VITE_API_URL` = Your Railway URL

**Done!** Your app is live! 🚀

---

## 🌐 Option 3: AWS (Production-ready)

**Best for:** Scalable production deployment

### Quick AWS Deploy:

1. **Frontend (Amplify):**
   ```bash
   # Push to GitHub first
   git init
   git add .
   git commit -m "Initial commit"
   git push

   # Then deploy via AWS Amplify Console
   # https://console.aws.amazon.com/amplify/
   ```

2. **Backend (App Runner):**
   - Build Docker image: `docker build -t campaign-backend .`
   - Push to ECR
   - Deploy via App Runner Console

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed AWS instructions.

---

## 🔧 Configuration Checklist

Before deploying, make sure you have:

- [ ] AWS credentials (for S3 media storage)
- [ ] AgentCore API key (if using MCP tools)
- [ ] Updated CORS settings in backend
- [ ] Environment variables configured
- [ ] Build tested locally (`npm run build`)

---

## 🚨 Troubleshooting

### Docker Issues:

**Port already in use:**
```bash
# Change ports in docker-compose.yml
ports:
  - "3001:80"  # Frontend
  - "8001:8000"  # Backend
```

**Build fails:**
```bash
# Clean and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Vercel Issues:

**Build fails:**
```bash
# Check build locally first
npm run build
npm run preview
```

**API calls fail:**
- Update `VITE_API_URL` in Vercel dashboard
- Check backend CORS settings

### Railway Issues:

**Deployment fails:**
- Check logs in Railway dashboard
- Verify all environment variables are set
- Ensure `requirements.txt` is complete

---

## 📊 Deployment Comparison

| Feature | Docker | Vercel + Railway | AWS |
|---------|--------|------------------|-----|
| Setup Time | 5 min | 10 min | 30 min |
| Cost | Free (self-host) | Free tier available | ~$30/month |
| Scalability | Manual | Auto | Auto |
| Custom Domain | Yes | Yes | Yes |
| SSL/HTTPS | Manual | Auto | Auto |
| Best For | Testing | Quick deploy | Production |

---

## 🎯 Recommended Path

1. **Start with Docker** - Test everything works
2. **Deploy to Vercel + Railway** - Get it public quickly
3. **Move to AWS** - When you need production scale

---

## 📞 Need Help?

- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions
- Review platform-specific documentation
- Check logs for error messages

---

## ✅ Post-Deployment

After deployment:

1. **Test all features:**
   - Campaign creation
   - Content generation
   - Analytics
   - Optimization

2. **Monitor:**
   - Check logs regularly
   - Set up alerts
   - Monitor costs

3. **Secure:**
   - Enable HTTPS
   - Set up authentication
   - Configure rate limiting

**Congratulations!** Your Campaign Dashboard is now live! 🎉
