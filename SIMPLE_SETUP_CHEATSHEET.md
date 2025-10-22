# 📝 Simple Setup Cheat Sheet

## 🎯 The Backend URL in 3 Steps

### Step 1: Deploy Backend → Get URL

```
┌──────────────────────────────────────┐
│   AWS App Runner                     │
│                                      │
│   After you deploy, you get:         │
│                                      │
│   https://abc123.awsapprunner.com    │
│   👆 THIS IS YOUR BACKEND URL        │
│                                      │
│   COPY THIS! ✂️                      │
└──────────────────────────────────────┘
```

---

### Step 2: Put URL in Amplify

```
┌──────────────────────────────────────┐
│   AWS Amplify                        │
│   → Environment variables            │
│   → Add variable                     │
│                                      │
│   Name:  VITE_API_URL                │
│   Value: https://abc123.awsapprunner.com │
│          👆 PASTE HERE               │
│                                      │
│   Click: Save                        │
└──────────────────────────────────────┘
```

---

### Step 3: Redeploy Frontend

```
┌──────────────────────────────────────┐
│   AWS Amplify                        │
│   → Deployments                      │
│   → Click "Redeploy this version"    │
│                                      │
│   Wait 5 minutes...                  │
│                                      │
│   ✅ Done!                           │
└──────────────────────────────────────┘
```

---

## 🔍 Real Example

### Your Backend URL Looks Like:
```
https://p7k2m3n4x5.us-east-1.awsapprunner.com
```

### You Put It Here:
```
AWS Amplify → Environment variables

Variable name: VITE_API_URL
Value: https://p7k2m3n4x5.us-east-1.awsapprunner.com
```

### That's It! ✅

---

## ❓ FAQ

### Q: Where do I find the backend URL?
**A:** AWS App Runner Console → Click your service → Look for "Default domain"

### Q: What exactly do I copy?
**A:** The entire URL starting with `https://`
Example: `https://abc123.us-east-1.awsapprunner.com`

### Q: Where do I paste it?
**A:** AWS Amplify Console → Environment variables → VITE_API_URL

### Q: Do I add /api at the end?
**A:** NO! Just the base URL. The code adds /api automatically.

### Q: What if I make a mistake?
**A:** Just edit the environment variable in Amplify and redeploy.

---

## ✅ Checklist

- [ ] Backend deployed to App Runner
- [ ] Backend URL copied (starts with https://)
- [ ] Opened Amplify Console
- [ ] Clicked "Environment variables"
- [ ] Added VITE_API_URL with backend URL
- [ ] Clicked "Save"
- [ ] Redeployed frontend
- [ ] Tested - it works!

---

## 🚨 Common Mistakes

### ❌ WRONG:
```
VITE_API_URL = main.d123.amplifyapp.com
```
This is your frontend URL!

### ✅ CORRECT:
```
VITE_API_URL = https://abc123.awsapprunner.com
```
This is your backend URL!

---

### ❌ WRONG:
```
VITE_API_URL = abc123.awsapprunner.com
```
Missing `https://`

### ✅ CORRECT:
```
VITE_API_URL = https://abc123.awsapprunner.com
```
Includes `https://`

---

### ❌ WRONG:
```
VITE_API_URL = https://abc123.awsapprunner.com/api
```
Don't add `/api`

### ✅ CORRECT:
```
VITE_API_URL = https://abc123.awsapprunner.com
```
Just the base URL

---

## 🎯 Quick Test

After setup, test if it works:

```bash
# 1. Test backend is running
curl https://your-backend-url.com/health

# Should return:
{"status": "healthy"}

# 2. Open your Amplify URL in browser
# 3. Create a campaign
# 4. If it works → Success! ✅
```

---

## 📞 Need More Help?

**Detailed explanation:**
→ [BACKEND_URL_EXPLAINED.md](./BACKEND_URL_EXPLAINED.md)

**Full deployment guide:**
→ [AWS_AMPLIFY_DEPLOYMENT.md](./AWS_AMPLIFY_DEPLOYMENT.md)

**Quick start:**
→ [AMPLIFY_QUICK_START.md](./AMPLIFY_QUICK_START.md)

---

**Remember:** 
1. Deploy backend → Get URL
2. Put URL in Amplify → VITE_API_URL
3. Redeploy → Done! ✅

**That's all there is to it!** 🚀
