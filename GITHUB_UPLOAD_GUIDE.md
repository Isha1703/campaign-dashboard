# 📤 GitHub Upload Guide

Complete guide to upload your Campaign Dashboard to GitHub.

## 🎯 Quick Upload (5 minutes)

### Step 1: Prepare Your Project

**Windows:**
```bash
prepare-github.bat
```

**Linux/Mac:**
```bash
chmod +x prepare-github.sh
./prepare-github.sh
```

This script will:
- ✅ Initialize Git repository
- ✅ Check for sensitive files
- ✅ Clean up temporary data
- ✅ Stage all files

### Step 2: Commit Your Changes

```bash
git commit -m "Initial commit: AI-Powered Campaign Dashboard"
```

### Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `campaign-dashboard` (or your choice)
3. Description: `AI-powered marketing campaign management platform`
4. Choose: **Public** or **Private**
5. **DO NOT** initialize with README (we already have one)
6. Click **Create repository**

### Step 4: Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/campaign-dashboard.git

# Push to main branch
git branch -M main
git push -u origin main
```

**Done!** 🎉 Your project is now on GitHub!

---

## 📋 Manual Upload Steps

If you prefer to do it manually:

### 1. Initialize Git

```bash
git init
```

### 2. Create .gitignore

Already created! It excludes:
- `node_modules/`
- `.env` files
- `public/agent_outputs/` (generated data)
- `public/downloads/` (downloaded media)
- Build artifacts
- IDE files

### 3. Stage Files

```bash
# Stage all files
git add .

# Check what will be committed
git status
```

### 4. Commit

```bash
git commit -m "Initial commit: Campaign Dashboard"
```

### 5. Create GitHub Repository

- Go to https://github.com/new
- Fill in repository details
- Create repository

### 6. Push

```bash
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## ⚠️ Important: Before Uploading

### Check for Sensitive Data

Make sure these are **NOT** included:

- [ ] `.env` file (contains AWS credentials)
- [ ] AWS access keys
- [ ] API keys
- [ ] Passwords
- [ ] Personal data

### Verify .gitignore

Run this to check:
```bash
git status --ignored
```

Should show:
- `.env` (ignored)
- `node_modules/` (ignored)
- `public/agent_outputs/` (ignored)

### Clean Up

Remove temporary files:
```bash
# Windows
del /s /q public\agent_outputs\*.*
del /s /q public\downloads\*.*

# Linux/Mac
rm -rf public/agent_outputs/*
rm -rf public/downloads/*
```

---

## 📦 What Gets Uploaded

### ✅ Included Files:

**Source Code:**
- `src/` - Frontend React code
- `*.py` - Backend Python code
- `*.tsx`, `*.ts` - TypeScript files
- `*.json` - Configuration files

**Configuration:**
- `package.json` - Frontend dependencies
- `requirements.txt` - Backend dependencies
- `tsconfig.json` - TypeScript config
- `vite.config.ts` - Vite config
- `tailwind.config.js` - Tailwind config

**Deployment:**
- `Dockerfile` - Backend container
- `Dockerfile.frontend` - Frontend container
- `docker-compose.yml` - Full stack deployment
- `nginx.conf` - Web server config
- `vercel.json` - Vercel config
- `railway.json` - Railway config

**Documentation:**
- `README.md` - Main documentation
- `START_HERE.md` - Quick start guide
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `CONTRIBUTING.md` - Contribution guidelines
- `LICENSE` - MIT License

**Scripts:**
- `deploy-*.sh` - Deployment scripts
- `.env.example` - Environment template

### ❌ Excluded Files:

**Sensitive:**
- `.env` - Environment variables
- AWS credentials
- API keys

**Generated:**
- `node_modules/` - Dependencies (reinstalled)
- `dist/` - Build output (regenerated)
- `public/agent_outputs/` - Session data (regenerated)
- `public/downloads/` - Media files (regenerated)

**Temporary:**
- `*.log` - Log files
- `*.tmp` - Temporary files
- `__pycache__/` - Python cache

---

## 🔧 Git Configuration

### Set Your Identity

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### SSH Key (Optional but Recommended)

1. **Generate SSH key:**
   ```bash
   ssh-keygen -t ed25519 -C "your.email@example.com"
   ```

2. **Add to GitHub:**
   - Copy key: `cat ~/.ssh/id_ed25519.pub`
   - Go to GitHub → Settings → SSH Keys
   - Add new SSH key

3. **Use SSH URL:**
   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/campaign-dashboard.git
   ```

---

## 📝 Repository Settings

After uploading, configure your repository:

### 1. Add Description

Go to repository settings and add:
```
AI-powered marketing campaign management platform with content generation, analytics, and budget optimization
```

### 2. Add Topics

Add these topics for discoverability:
- `react`
- `typescript`
- `python`
- `fastapi`
- `aws`
- `ai`
- `marketing`
- `campaign-management`
- `docker`
- `tailwindcss`

### 3. Enable Features

- ✅ Issues (for bug reports)
- ✅ Discussions (for Q&A)
- ✅ Wiki (optional)
- ✅ Projects (optional)

### 4. Set Up GitHub Pages (Optional)

For documentation hosting:
1. Go to Settings → Pages
2. Source: Deploy from branch
3. Branch: `main` / `docs`
4. Save

---

## 🚀 After Upload

### 1. Add Badges to README

Update README.md with your repository URL:
```markdown
![Build Status](https://github.com/YOUR_USERNAME/campaign-dashboard/workflows/CI/badge.svg)
![License](https://img.shields.io/github/license/YOUR_USERNAME/campaign-dashboard)
![Stars](https://img.shields.io/github/stars/YOUR_USERNAME/campaign-dashboard)
```

### 2. Create Releases

Tag your first release:
```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

### 3. Set Up CI/CD (Optional)

Create `.github/workflows/ci.yml` for automated testing.

### 4. Add Collaborators

Go to Settings → Collaborators to add team members.

---

## 🔄 Updating Your Repository

### Make Changes

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push
```

### Create Branches

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push branch
git push -u origin feature/new-feature

# Create Pull Request on GitHub
```

---

## 🐛 Troubleshooting

### "Permission denied" Error

**Solution:** Set up SSH key or use HTTPS with personal access token.

### "Repository not found" Error

**Solution:** Check repository URL and your access permissions.

### Large Files Error

**Solution:** Files over 100MB need Git LFS:
```bash
git lfs install
git lfs track "*.mp4"
git add .gitattributes
```

### Accidentally Committed .env

**Solution:** Remove from history:
```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
git push
```

Then rotate your credentials immediately!

---

## ✅ Pre-Upload Checklist

Before pushing to GitHub:

- [ ] `.env` file is in `.gitignore`
- [ ] No sensitive data in code
- [ ] `README.md` is complete
- [ ] `LICENSE` file included
- [ ] `.gitignore` configured
- [ ] Build works: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Documentation updated
- [ ] Commit messages are clear

---

## 📞 Need Help?

- **Git Documentation:** https://git-scm.com/doc
- **GitHub Guides:** https://guides.github.com
- **GitHub Support:** https://support.github.com

---

## 🎉 Success!

Your Campaign Dashboard is now on GitHub!

**Next Steps:**
1. Share your repository URL
2. Add collaborators
3. Set up CI/CD
4. Deploy to production
5. Star your own repo! ⭐

**Repository URL:**
```
https://github.com/YOUR_USERNAME/campaign-dashboard
```

---

**Happy coding!** 🚀
