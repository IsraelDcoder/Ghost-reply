<!-- INTEGRATION STEPS - Copy & Paste -->

# Quick Integration Checklist

## Step 1: Backend Setup

### 1.1 Update Server Index
In `server/index.ts`, update the middleware setup:

```typescript
import { subscriptionCheckMiddleware } from "./subscription-middleware";

// Replace the old middleware with:
app.use(subscriptionCheckMiddleware);
```

### 1.2 Update Routes
In `server/routes.ts`, add these imports at the top:

```typescript
import {
  getUserSubscriptionStatus,
  startFreeTrial,
  shouldEnforceDailyLimits,
  getDailyLimitForUser,
} from "./subscription-service";
```

Then update the `/api/analyze` endpoint - replace the subscription check:

```typescript
// OLD CODE:
if (!subscription?.isSubscribed) {
  const today = new Date().toDateString();
  const todayConversations = await db.query.conversations.findMany({...});
  if (todayConversations.length >= 2) {
    return res.status(429).json({error: "Daily free limit reached..."});
  }
}

// NEW CODE:
const shouldEnforce = await shouldEnforceDailyLimits(user.id);
if (shouldEnforce) {
  const today = new Date().toDateString();
  const todayConversations = await db.query.conversations.findMany({...});
  if (todayConversations.length >= 2) {
    return res.status(429).json({error: "Daily free limit reached..."});
  }
}
```

### 1.3 Add New Routes
Add these 3 new endpoints to `registerRoutes()`:

```typescript
import { getUserSubscriptionStatus, startFreeTrial, getDailyLimitForUser } from "./subscription-service";

// NEW ENDPOINT 1: Get subscription status
app.get("/api/subscription/status", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    const status = await getUserSubscriptionStatus(user.id);
    console.log(`[/api/subscription/status] User ${user.id}:`, status);
    return res.json(status);
  } catch (error) {
    console.error("Subscription status error:", error);
    return res.status(500).json({ error: "Failed to get subscription status" });
  }
});

// NEW ENDPOINT 2: Start free trial
app.post("/api/subscription/start-trial", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    const currentStatus = await getUserSubscriptionStatus(user.id);
    if (currentStatus.isSubscribed) {
      return res.status(400).json({
        error: "User already has an active subscription or trial",
        currentPlan: currentStatus.plan,
      });
    }
    
    const newStatus = await startFreeTrial(user.id);
    console.log(`[/api/subscription/start-trial] Started for user ${user.id}`);
    
    return res.json({
      success: true,
      message: "Free trial started successfully",
      ...newStatus,
    });
  } catch (error) {
    console.error("Start trial error:", error);
    return res.status(500).json({ error: "Failed to start free trial" });
  }
});

// NEW ENDPOINT 3: Get daily limit
app.get("/api/subscription/daily-limit", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    const dailyLimit = await getDailyLimitForUser(user.id);
    const status = await getUserSubscriptionStatus(user.id);
    
    const today = new Date().toDateString();
    const todayConversations = await db.query.conversations.findMany({
      where: (fields, operators) =>
        operators.and(
          operators.eq(fields.userId, user.id),
          operators.gte(fields.createdAt, new Date(today))
        ),
    });
    
    return res.json({
      dailyLimit,
      used: todayConversations.length,
      remaining: Math.max(0, dailyLimit - todayConversations.length),
      isUnlimited: dailyLimit === Infinity,
      plan: status.plan,
    });
  } catch (error) {
    console.error("Daily limit error:", error);
    return res.status(500).json({ error: "Failed to get daily limit" });
  }
});
```

### 1.4 Verify Database
Run migration if not already done:

```bash
npm run db:push
# or
npm run migrations
```

Should create `user_subscriptions` table.

---

## Step 2: Frontend Setup

### 2.1 Add SubscriptionContext Provider
In `app/_layout.tsx`, wrap your app:

```tsx
import { SubscriptionProvider } from "@/context/SubscriptionContext";

export default function RootLayout() {
  return (
    <SubscriptionProvider>
      {/* Your existing providers and Stack */}
      <Stack />
    </SubscriptionProvider>
  );
}
```

### 2.2 Update Paywall Screen
In `app/paywall.tsx`, update the trial button:

```tsx
import { useSubscription } from "@/context/SubscriptionContext";

export default function PaywallScreen() {
  const { startTrial, loading } = useSubscription();
  
  // OLD: setIsSubscribed(true) directly
  // NEW:
  const handleStartTrial = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await startTrial(); // Calls API and updates context
      router.replace("/home");
    } catch (error) {
      Alert.alert("Error", "Failed to start trial");
    }
  };

  return (
    // ... existing JSX ...
    <Pressable
      onPress={handleStartTrial}
      disabled={loading}
      style={styles.ctaButton}
    >
      <Text>{loading ? "Starting..." : "Start Free Trial"}</Text>
    </Pressable>
  );
}
```

### 2.3 Update Home/Index Screen
In `app/index.tsx` or `app/home.tsx`, add subscription check:

```tsx
import { useSubscription } from "@/context/SubscriptionContext";
import { Alert } from "react-native";

export default function IndexScreen() {
  const { canAnalyzeConversation, subscriptionStatus } = useSubscription();
  
  const handleAnalyze = async (text: string) => {
    // CHECK BEFORE ANALYZING
    if (!canAnalyzeConversation()) {
      Alert.alert(
        "Daily Limit Reached",
        "You've used your 2 free analyses. Subscribe for unlimited access.",
        [{ text: "Subscribe", onPress: () => router.push("/paywall") }]
      );
      return;
    }
    
    // Safe to proceed
    const res = await apiRequest("POST", "/api/analyze", { text });
    // ... handle response
  };

  return (
    <View>
      {/* Show subscription status */}
      {subscriptionStatus?.isTrialActive && (
        <Text>🎉 {subscriptionStatus.daysRemaining} day{subscriptionStatus.daysRemaining !== 1 ? 's' : ''} of trial left!</Text>
      )}
      {subscriptionStatus?.plan === "free" && (
        <Text>2 free analyses today</Text>
      )}
      
      {/* Analyze button */}
      <Pressable onPress={() => handleAnalyze(text)}>
        <Text>Analyze</Text>
      </Pressable>
    </View>
  );
}
```

### 2.4 Optional: Refresh on App Foreground
In `app/_layout.tsx`:

```tsx
import { useEffect } from "react";
import { AppState } from "react-native";
import { useSubscription } from "@/context/SubscriptionContext";

export default function RootLayout() {
  const { refreshSubscriptionStatus } = useSubscription();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        // App came to foreground - refresh in case trial expired
        refreshSubscriptionStatus();
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <SubscriptionProvider>
      <Stack />
    </SubscriptionProvider>
  );
}
```

---

## Step 3: Testing

### Test 1: Fresh Install
```
1. Open app
2. Should show: plan: "free"
3. Should show: "2 free analyses/day"
4. Should show: "Start Free Trial" button
```

### Test 2: Start Trial
```
1. Click "Start Free Trial"
2. Should show: "30 days of trial left"
3. Should show "Unlimited analyses"
4. Refresh page → trial should persist
```

### Test 3: Daily Limit (Free User)
```
1. Delete subscription record: DELETE FROM user_subscriptions WHERE ...
2. Open app → plan: "free"
3. Analyze twice → both work
4. Analyze third time → ERROR: "Daily limit reached"
```

### Test 4: Trial Expiration
```
1. In DB: UPDATE user_subscriptions SET trial_expires_at = NOW() - INTERVAL '1 day'
2. Close and reopen app
3. Should show: plan: "free", no trial message
4. UI should update to show "2 free/day"
```

---

## Step 4: Deploy

```bash
# Push all changes
git add -A
git commit -m "Add free trial & subscription system"
git push

# Deploy backend (Render)
# - Push to main branch and Render auto-deploys
# - Or use: git push heroku main

# Rebuild APK for testing
eas build --platform android --profile preview --wait
```

---

## Troubleshooting

### Issue: `getUserSubscriptionStatus` returns undefined values
**Fix:** Check database has subscription record
```sql
SELECT * FROM user_subscriptions WHERE user_id = '<test_user>';
```
If empty, user hasn't started trial yet (expected).

### Issue: Daily limit not enforcing
**Fix:** Verify `shouldEnforceDailyLimits()` is called in `/api/analyze`
```typescript
const shouldEnforce = await shouldEnforceDailyLimits(user.id);
if (shouldEnforce) {
  // Check limit...
}
```

### Issue: Frontend doesn't show subscription status
**Fix:** Ensure `<SubscriptionProvider>` wraps your app in `_layout.tsx`

### Issue: Trial doesn't start
**Fix:** Check API endpoint exists: `POST /api/subscription/start-trial`
Check logs: `[/api/subscription/start-trial] Started for user ...`

---

## Files Created

✅ `server/subscription-service.ts` - Core logic  
✅ `server/subscription-routes.ts` - API endpoints  
✅ `server/subscription-middleware.ts` - Updated middleware  
✅ `context/SubscriptionContext.tsx` - Frontend context  
✅ `SUBSCRIPTION_SYSTEM_GUIDE.md` - Full documentation  

Copy these to your project and follow the steps above!
