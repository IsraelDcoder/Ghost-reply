# 🚀 Render Deployment - Quick Reference Card

## Copy-Paste Templates

### Web Service Basic Info
```
Name: ghostreply-api
Environment: Node
Region: Frankfurt (eu-central-1)
Branch: main
```

### Build & Deploy
```
Build Command:  npm install && npm run server:build
Start Command:  npm run server:prod
Plan:           Free
```

### Environment Variables (Copy-paste each)

#### 1. Database Connection
```
KEY:   DATABASE_URL
VALUE: postgresql://postgres.vnwrscbopifsrkkhahkh:Hopefullyilaunchthismonth@aws-1-eu-central-2.pooler.supabase.com:6543/postgres
```

#### 2. Node Environment
```
KEY:   NODE_ENV
VALUE: production
```

#### 3. OpenRouter Base URL
```
KEY:   AI_INTEGRATIONS_OPENROUTER_BASE_URL
VALUE: https://openrouter.ai/api/v1
```

#### 4. OpenRouter API Key
```
KEY:   AI_INTEGRATIONS_OPENROUTER_API_KEY
VALUE: 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
```

---

## After Deployment

Your backend URL will be something like:
```
https://ghostreply-api.onrender.com
```

Update your `.env.local`:
```env
EXPO_PUBLIC_DOMAIN=ghostreply-api.onrender.com
```

Then rebuild:
```bash
eas build --platform android --wait
```

---

## Status Checks

Health endpoint:
```
https://ghostreply-api.onrender.com/api/health
```

Render Dashboard:
```
https://dashboard.render.com
```
