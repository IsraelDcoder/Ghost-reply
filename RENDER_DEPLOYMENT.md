# Deploy Ghost Reply Backend to Render

Complete guide to host your Express backend on Render.com

---

## 📋 Pre-Deployment Checklist

Before you start, have these ready:

✅ Your GitHub repository URL: 
```
https://github.com/Israeldcoder/Ghost-reply
```

✅ Your Supabase Database URL (from .env):
```
postgresql://postgres.vnwrscbopifsrkkhahkh:Hopefullyilaunchthismonth@aws-1-eu-central-2.pooler.supabase.com:6543/postgres
```

✅ Your OpenRouter API Key (from .env):
```
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
```

---

## 🚀 Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Click **Sign Up**
3. Choose **Sign up with GitHub**
4. Authorize Render to access your GitHub account
5. Complete the sign-up

---

## 📦 Step 2: Create New Web Service

1. Click **New +** button → **Web Service**
2. Under "Connect a repository", click **Connect**
3. Find and select: **Ghost-reply**
4. Click **Connect**

---

## ⚙️ Step 3: Configure Web Service

Fill in these details exactly as shown:

### Basic Settings

| Field | Value |
|-------|-------|
| **Name** | `ghostreply-api` |
| **Environment** | `Node` |
| **Region** | `Frankfurt (EU Central)` or your closest region |
| **Branch** | `main` |

### Build & Deploy Settings

| Field | Value |
|-------|-------|
| **Build Command** | `npm install && npm run server:build` |
| **Start Command** | `npm run server:prod` |
| **Plan** | Free (or Starter if free is full) |

---

## 🔑 Step 4: Add Environment Variables

Click **Add Environment Variable** for each one:

### Variable 1: Database URL
```
KEY:   DATABASE_URL
VALUE: postgresql://postgres.vnwrscbopifsrkkhahkh:Hopefullyilaunchthismonth@aws-1-eu-central-2.pooler.supabase.com:6543/postgres
```

### Variable 2: Node Environment
```
KEY:   NODE_ENV
VALUE: production
```

### Variable 3: OpenRouter Base URL
```
KEY:   AI_INTEGRATIONS_OPENROUTER_BASE_URL
VALUE: https://openrouter.ai/api/v1
```

### Variable 4: OpenRouter API Key
```
KEY:   AI_INTEGRATIONS_OPENROUTER_API_KEY
VALUE: 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
```

---

## ✅ Step 5: Deploy

1. Scroll down and click **Create Web Service**
2. Render will automatically start building 🏗️
3. You'll see logs as it builds
4. This takes ~3-5 minutes

Wait for the message:
```
✓ Your service is live
```

---

## 🔗 Step 6: Get Your URL

Once deployed, you'll see your service URL like:
```
https://ghostreply-api.onrender.com
```

Copy this URL - you'll need it next!

---

## 📱 Step 7: Update Your Mobile App

Now update your app to use the Render backend:

### Option A: Use Environment File

1. Open `c:\Ghost-Reply\.env.local`
2. Change:
   ```env
   EXPO_PUBLIC_DOMAIN=localhost:5000
   ```
   To:
   ```env
   EXPO_PUBLIC_DOMAIN=ghostreply-api.onrender.com
   ```
3. Save the file

### Option B: Use .env.production

1. Create `.env.production` (or copy from `.env.production.example`)
2. Add:
   ```env
   EXPO_PUBLIC_DOMAIN=ghostreply-api.onrender.com
   NODE_ENV=production
   ```

---

## 🏗️ Step 8: Rebuild Mobile App for Play Store

After updating the domain, rebuild your app:

```bash
cd c:\Ghost-Reply

# Build AAB for Play Store
eas build --platform android --wait
```

This will:
- Build a new APK/AAB
- Connect to your Render backend
- Ready to submit to Google Play

---

## 🧪 Step 9: Test Your Backend

Test that the API is working:

### PowerShell
```powershell
$uri = "https://ghostreply-api.onrender.com/api/health"
Invoke-WebRequest -Uri $uri
```

### Or just open in browser:
```
https://ghostreply-api.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-03-11T..."
}
```

---

## 📊 Monitor Your Service

In Render dashboard:

1. Click on your service `ghostreply-api`
2. View **Logs** - see API requests in real-time
3. View **Metrics** - CPU, memory usage
4. View **Environment** - verify all variables are set

---

## 🔄 Update Code After Deployment

When you update your code:

```bash
# Make your changes
git add .
git commit -m "Update backend"
git push origin main
```

Render will automatically redeploy! 🚀

---

## 🆘 Troubleshooting

### Build Failed
- Check logs in Render dashboard
- Ensure all npm scripts in `package.json` are correct
- Verify environment variables are set

### App Can't Connect to API
- Verify `EXPO_PUBLIC_DOMAIN` is set correctly
- Check it matches your Render service URL
- Test the health endpoint manually

### Database Connection Error
- Verify `DATABASE_URL` is correct in Render environment
- Check Supabase is running and accessible
- Test connection string in local environment first

---

## 📝 Your Service Details (For Reference)

```
Repository: https://github.com/Israeldcoder/Ghost-reply
Backend URL: https://ghostreply-api.onrender.com
Database: Supabase PostgreSQL
API Key Provider: OpenRouter

Environment:
- NODE_ENV: production
- Region: EU Central (Frankfurt)
- Plan: Free Tier
```

---

## 🎯 Next Steps

1. ✅ Deploy backend on Render (YOU ARE HERE)
2. ⬜ Update mobile app with new domain
3. ⬜ Rebuild AAB for Play Store
4. ⬜ Submit to Google Play Console
5. ⬜ Monitor performance and errors

---

## 💡 Tips

- Render free tier sleeps after 15 min of inactivity - data is preserved
- You get 750 free compute hours/month on free tier
- Upgrade to Starter ($7/month) for always-on service
- Set up notifications in Render for deployment issues
