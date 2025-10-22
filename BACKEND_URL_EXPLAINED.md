# 🔗 Backend URL - Simple Explanation

## 🤔 What is the Backend URL?

**Simple answer:** It's the web address where your Python API server lives.

Think of it like this:
- **Frontend** = Your house (where you live)
- **Backend** = The grocery store (where you get food)
- **Backend URL** = The store's address (so you know where to go)

---

## 📍 Where Do You Get This URL?

### When You Deploy Backend to AWS App Runner:

**Step 1: Deploy Backend**
1. Go to AWS App Runner Console
2. Create a service
3. Deploy your Python code

**Step 2: AWS Gives You a URL**

After deployment, AWS App Runner shows you a URL like:
```
https://abc123xyz.us-east-1.awsapprunner.com
```

**This is your Backend URL!** Copy it!

---

## 📝 Where Do You Put This URL?

### You put it in AWS Amplify as an Environment Variable

**Location:** AWS Amplify Console → Your App → Environment Variables

**What to enter:**

| Field | What to Put |
|-------|-------------|
| **Variable name** | `VITE_API_URL` |
| **Value** | `https://abc123xyz.us-east-1.awsapprunner.com` |

---

## 🎯 Step-by-Step Visual Guide

### Step 1: Get Backend URL from App Runner

```
┌─────────────────────────────────────────────────┐
│  AWS App Runner Console                         │
│                                                 │
│  Service: campaign-dashboard-api                │
│  Status: ✅ Running                             │
│                                                 │
│  Default domain:                                │
│  ┌───────────────────────────────────────────┐ │
│  │ https://abc123xyz.us-east-1.awsapprunner.com│ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  👆 THIS IS YOUR BACKEND URL - COPY IT!        │
└─────────────────────────────────────────────────┘
```

**How to copy:**
1. Click on your App Runner service
2. Look for "Default domain"
3. Copy the entire URL (starts with `https://`)

---

### Step 2: Put It in Amplify

```
┌─────────────────────────────────────────────────┐
│  AWS Amplify Console                            │
│                                                 │
│  App: campaign-dashboard                        │
│                                                 │
│  Click: "Environment variables" (left sidebar)  │
│                                                 │
│  Click: "Manage variables"                      │
│                                                 │
│  Add variable:                                  │
│  ┌───────────────────────────────────────────┐ │
│  │ Variable name: VITE_API_URL               │ │
│  │                                           │ │
│  │ Value: https://abc123xyz.awsapprunner.com │ │
│  │        👆 PASTE YOUR BACKEND URL HERE     │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Click: "Save"                                  │
└─────────────────────────────────────────────────┘
```

---

## 🖼️ Real Example

### Example 1: Your Backend URL

Let's say AWS App Runner gives you:
```
https://p7k2m3n4x5.us-east-1.awsapprunner.com
```

### Example 2: Put It in Amplify

In Amplify Environment Variables:
```
Variable name: VITE_API_URL
Value: https://p7k2m3n4x5.us-east-1.awsapprunner.com
```

**That's it!** Now your frontend knows where to find your backend.

---

## 🔍 How It Works

### Before Setting VITE_API_URL:

```
Frontend (Amplify)
    │
    │ "Where is the backend?"
    │ ❌ Don't know!
    ▼
Backend (App Runner)
```

### After Setting VITE_API_URL:

```
Frontend (Amplify)
    │
    │ "Backend is at: https://abc123.awsapprunner.com"
    │ ✅ I know where to go!
    ▼
Backend (App Runner)
    https://abc123.awsapprunner.com
```

---

## 📋 Complete Example

### Scenario: You're deploying your app

**1. Deploy Backend First:**
```
You: Deploy Python code to App Runner
AWS: "Your backend is ready!"
AWS: "URL: https://xyz789.us-east-1.awsapprunner.com"
You: Copy this URL ✂️
```

**2. Configure Frontend:**
```
You: Go to Amplify Console
You: Click "Environment variables"
You: Add variable:
     Name: VITE_API_URL
     Value: https://xyz789.us-east-1.awsapprunner.com
You: Click "Save"
```

**3. Redeploy Frontend:**
```
You: Click "Redeploy"
Amplify: Rebuilds with new environment variable
Amplify: "Deployment complete!"
```

**4. Test:**
```
You: Open your Amplify URL
You: Create a campaign
Frontend: Calls https://xyz789.awsapprunner.com/api/campaign/start
Backend: Processes request
You: It works! 🎉
```

---

## 🎯 Quick Reference Card

### What You Need:

| Item | Where to Get It | Example |
|------|----------------|---------|
| **Backend URL** | AWS App Runner Console | `https://abc123.awsapprunner.com` |
| **Where to Put It** | AWS Amplify → Environment Variables | Variable: `VITE_API_URL` |
| **What to Name It** | Must be exactly this | `VITE_API_URL` |

---

## 🚨 Common Mistakes

### ❌ Wrong: Using Frontend URL
```
VITE_API_URL = https://main.d123.amplifyapp.com  ❌
```
This is your frontend URL, not backend!

### ✅ Correct: Using Backend URL
```
VITE_API_URL = https://abc123.awsapprunner.com  ✅
```
This is your backend URL from App Runner!

---

### ❌ Wrong: Missing https://
```
VITE_API_URL = abc123.awsapprunner.com  ❌
```
Must include `https://`

### ✅ Correct: With https://
```
VITE_API_URL = https://abc123.awsapprunner.com  ✅
```

---

### ❌ Wrong: Adding /api at the end
```
VITE_API_URL = https://abc123.awsapprunner.com/api  ❌
```
Don't add `/api` - the code does this automatically!

### ✅ Correct: Just the base URL
```
VITE_API_URL = https://abc123.awsapprunner.com  ✅
```

---

## 🎓 Understanding the Flow

### What Happens When You Set VITE_API_URL:

**1. You set in Amplify:**
```
VITE_API_URL = https://abc123.awsapprunner.com
```

**2. During build, your code reads it:**
```javascript
// In src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// Becomes:
const API_BASE_URL = "https://abc123.awsapprunner.com/api"
```

**3. When user creates campaign:**
```javascript
// Frontend makes this call:
fetch(`${API_BASE_URL}/campaign/start`)

// Which becomes:
fetch('https://abc123.awsapprunner.com/api/campaign/start')

// Request goes to your backend! ✅
```

---

## 📸 Screenshot Guide

### Finding Backend URL in App Runner:

```
1. Go to: https://console.aws.amazon.com/apprunner/

2. Click on your service name

3. Look for "Default domain" section

4. You'll see something like:
   ┌─────────────────────────────────────────┐
   │ Default domain                          │
   │ https://xyz.us-east-1.awsapprunner.com  │
   │ [Copy] button                           │
   └─────────────────────────────────────────┘

5. Click [Copy] or select and copy the URL
```

### Adding to Amplify:

```
1. Go to: https://console.aws.amazon.com/amplify/

2. Click on your app

3. Left sidebar → Click "Environment variables"

4. Click "Manage variables" button

5. Click "Add variable"

6. Fill in:
   Variable name: VITE_API_URL
   Value: [Paste your backend URL here]

7. Click "Save"

8. Go to "Deployments" tab

9. Click "Redeploy this version"
```

---

## ✅ Verification

### How to Check It's Working:

**1. Check Environment Variable is Set:**
```
Amplify Console → Environment variables
Should see:
VITE_API_URL = https://abc123.awsapprunner.com
```

**2. Check Backend is Running:**
```bash
curl https://abc123.awsapprunner.com/health
```
Should return: `{"status": "healthy"}`

**3. Check Frontend Can Connect:**
```
1. Open your Amplify URL
2. Open browser console (F12)
3. Go to Network tab
4. Create a campaign
5. Check requests go to: https://abc123.awsapprunner.com/api/...
```

---

## 🎯 Summary

**What:** Backend URL is the address of your Python API server

**Where to get it:** AWS App Runner Console → Your service → Default domain

**Where to put it:** AWS Amplify Console → Environment variables → VITE_API_URL

**Format:** `https://abc123.us-east-1.awsapprunner.com` (no /api at end)

**Why:** So your frontend knows where to send API requests

---

## 💡 Still Confused?

Think of it like ordering pizza:

- **Frontend** = You (at home)
- **Backend** = Pizza restaurant
- **Backend URL** = Restaurant's phone number
- **VITE_API_URL** = Saving the number in your phone

Without the number (URL), you can't order pizza (make API calls)!

---

**Need more help?** See:
- [AMPLIFY_QUICK_START.md](./AMPLIFY_QUICK_START.md) - Step-by-step guide
- [AWS_AMPLIFY_DEPLOYMENT.md](./AWS_AMPLIFY_DEPLOYMENT.md) - Detailed guide

**Ready to deploy?** Follow the steps above! 🚀
