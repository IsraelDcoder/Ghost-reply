# Free Trial & Subscription System - Implementation Guide

## Overview

This system provides complete free trial and subscription management with the following features:

✅ **3-day free trial** with full feature access  
✅ **Automatic trial expiration** handling  
✅ **Daily limits** enforcement (2 free analyses/day)  
✅ **Seamless trial-to-paid conversion**  
✅ **Edge case handling** (device changes, app data clear, etc.)  

---

## Architecture

### Backend: `server/subscription-service.ts`

Core service with 5 main functions:

1. **`getUserSubscriptionStatus(userId)`**
   - Returns: `{ isSubscribed, isPaid, isTrialActive, plan, daysRemaining }`
   - Handles all edge cases (expired trials, subscriptions, etc.)
   - Called on every request via middleware

2. **`startFreeTrial(userId)`**
   - Creates subscription record if needed
   - Sets trial start = now, trial expiration = +30 days
   - Returns updated status

3. **`shouldEnforceDailyLimits(userId)`**
   - Returns `true` only for free users (not trial, not paid)
   - Used to determine if daily limit check is needed

4. **`getDailyLimitForUser(userId)`**
   - Free users: 2 per day
   - Trial users & paid: Infinity

5. **`handleTrialExpiration(userId)`**
   - Called when trial expires
   - Triggers RevenueCat payment flow

### API Endpoints: `server/subscription-routes.ts`

#### 1. GET `/api/subscription/status`
```javascript
// Response
{
  isSubscribed: true/false,
  isPaid: true/false,
  isTrialActive: true/false,
  plan: "free-trial" | "premium" | "free",
  daysRemaining?: 15,
  trialExpiresAt?: "2026-04-12T...",
  subscriptionExpiresAt?: "2026-04-12T..."
}
```

#### 2. POST `/api/subscription/start-trial`
```javascript
// No request body needed
// Response: Same as /api/subscription/status
{
  success: true,
  message: "Free trial started successfully",
  isTrialActive: true,
  daysRemaining: 30,
  ...
}
```

#### 3. GET `/api/subscription/daily-limit`
```javascript
// Response
{
  dailyLimit: 2,
  used: 1,
  remaining: 1,
  isUnlimited: false,
  plan: "free"
}
```

---

## Frontend: `context/SubscriptionContext.tsx`

### Setup

1. **Add provider to app layout:**

```tsx
// app/_layout.tsx
import { SubscriptionProvider } from "@/context/SubscriptionContext";

export default function RootLayout() {
  return (
    <SubscriptionProvider>
      {/* Other providers */}
      <Stack />
    </SubscriptionProvider>
  );
}
```

2. **Use in any screen:**

```tsx
import { useSubscription } from "@/context/SubscriptionContext";

export default function HomeScreen() {
  const {
    subscriptionStatus,
    dailyLimit,
    canAnalyzeConversation,
    getRemainingAnalyses,
    startTrial,
  } = useSubscription();

  // subscriptionStatus = { isSubscribed, isPaid, isTrialActive, plan, daysRemaining }
  // canAnalyzeConversation() = true if user can analyze (trial/paid/free with limit remaining)
  // getRemainingAnalyses() = number remaining for today (infinity if trial/paid)
}
```

### Key Methods

#### `canAnalyzeConversation()`
```tsx
// BEFORE making API call to /api/analyze, check this
if (!canAnalyzeConversation()) {
  Alert.alert("Daily Limit Reached", "Subscribe for unlimited access");
  return;
}

// Safe to proceed with analysis
const result = await apiRequest("POST", "/api/analyze", { text });
```

#### `startTrial()`
```tsx
// Called from paywall or onboarding screen
const { startTrial } = useSubscription();

await startTrial();
// Auto-triggers Alert with success message
// Updates subscriptionStatus automatically
```

#### `refreshSubscriptionStatus()`
```tsx
// Manually refresh subscription status
// Useful after user returns from app background
const { refreshSubscriptionStatus } = useSubscription();

useEffect(() => {
  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      refreshSubscriptionStatus(); // Check if trial expired while app was closed
    }
  });
  return () => subscription.remove();
}, []);
```

---

## Database Schema

Already in `shared/schema.ts`:

```typescript
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  
  // Trial fields
  trialStartedAt: timestamp("trial_started_at"),      // When trial started
  trialExpiresAt: timestamp("trial_expires_at"),      // When trial ends
  
  // Paid subscription fields
  isSubscribed: boolean("is_subscribed").default(false),
  subscriptionProvider: varchar("subscription_provider"),  // "revenuecat"
  subscriptionId: varchar("subscription_id"),
  plan: varchar("plan"),  // "monthly" or "yearly"
  subscriptionStartedAt: timestamp("subscription_started_at"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

## Flow Diagrams

### User Opens App (First Time)

```
User opens app
  ↓
App Context fetches subscription status
  ├─ No subscription record? → plan: "free"
  └─ Has record? Check dates:
     ├─ Trial active? → plan: "free-trial"
     ├─ Paid active? → plan: "premium"
     └─ Both expired? → plan: "free"
  ↓
User sees appropriate UI
  ├─ Free: "2 analyses/day" + "Start Trial" button
  ├─ Trial: "Unlimited" + days remaining
  └─ Premium: "Unlimited" + subscription info
```

### User Clicks "Start Free Trial"

```
User clicks "Start Trial"
  ↓
POST /api/subscription/start-trial
  ↓
Backend:
  ├─ Check if user already has active subscription
  ├─ If not: Create subscription record with:
  │   ├─ trialStartedAt = NOW
  │   ├─ trialExpiresAt = NOW + 3 days
  │   └─ isSubscribed = false
  └─ Return updated status
  ↓
Frontend:
  ├─ Update subscriptionStatus in context
  ├─ Show success Alert
  └─ UI automatically updates to show "30 days remaining"
```

### User Analyzes Conversation (Free User)

```
User enters conversation text
  ↓
Click "Analyze"
  ↓
Frontend checks: canAnalyzeConversation()?
  ├─ false (hit limit)? → Show "Subscribe" alert
  └─ true? Continue...
  ↓
POST /api/analyze
  ↓
Backend:
  ├─ Get subscription status for user
  ├─ shouldEnforceDailyLimits? YES
  ├─ Count today's conversations
  ├─ Limit = 2, Used = 2? → 429 error
  └─ Limit = 2, Used = 1? → Process analysis
  ↓
Return AI reply or error
```

### Trial Expires While App Open

```
User is using app
  ↓
App periodically calls GET /api/subscription/status
  ↓
Backend checks: isTrialActive? (trialExpiresAt > NOW?)
  ├─ YES → return isTrialActive: true
  └─ NO → return isTrialActive: false, plan: "free"
  ↓
Frontend Context detects status changed
  ↓
Show Alert:
  "Your Trial Ended"
  "Subscribe now or continue free with limits"
```

### Trial Expires While App Closed

```
User opens app after trial expired
  ↓
App calls GET /api/subscription/status
  ↓
Backend: isTrialActive? (trialExpiresAt > NOW?)
  └─ NO → return plan: "free"
  ↓
Frontend updates UI
  ├─ Hides "trial remaining" message
  ├─ Shows "2 free/day" limit
  └─ Shows "Subscribe" button (if not already subscribed)
```

---

## Integration Checklist

### Backend

- [ ] Copy `server/subscription-service.ts` to your project
- [ ] Copy `server/subscription-routes.ts` - add routes to `registerRoutes()` in routes.ts
- [ ] Copy `server/subscription-middleware.ts` - replace old middleware with this
- [ ] Run migrations (schema already in `migrations/0001_initial_schema.sql`)
- [ ] Update `app.use(subscriptionCheckMiddleware)` in server/index.ts

### Frontend

- [ ] Copy `context/SubscriptionContext.tsx` to your project
- [ ] Add `<SubscriptionProvider>` to `app/_layout.tsx`
- [ ] Import and use `useSubscription()` in screens
- [ ] Update `/api/analyze` call sites to check `canAnalyzeConversation()` first
- [ ] Update paywall to call `startTrial()` when user clicks "Start Free Trial"

### Testing

```tsx
// Test 1: First-time user (should be free)
const { subscriptionStatus } = useSubscription();
console.log(subscriptionStatus); // { plan: "free", isSubscribed: false }

// Test 2: Start trial
await startTrial();
console.log(subscriptionStatus); // { plan: "free-trial", daysRemaining: 30 }

// Test 3: Hit daily limit (3 analyses)
await analyze("text1"); // OK
await analyze("text2"); // OK
await analyze("text3"); // ERROR: limit reached

// Test 4: Trial expired (manually set time in DB)
UPDATE user_subscriptions 
SET trial_expires_at = NOW() - INTERVAL '1 day'
WHERE user_id = '<test_user>';
// Refresh app → should show plan: "free"
```

---

## Edge Cases Handled

### 1. **User switches device**
- ✅ New device ID created
- ✅ New user record created
- ✅ Trial NOT carried over (intentional - prevent abuse)
- ✅ Treated as new user

### 2. **User clears app data**
- ✅ Device ID changes
- ✅ New user account created
- ✅ Old trial/subscription lost
- ✅ Can start new trial

### 3. **Trial started years ago**
- ✅ `getUserSubscriptionStatus()` checks: trialExpiresAt < NOW?
- ✅ Returns plan: "free"
- ✅ No errors

### 4. **User reopens app after trial expired**
- ✅ Next API call includes subscription check
- ✅ Detects trial expired
- ✅ Context updates UI
- ✅ No blocking Alert (only on first detection)

### 5. **Backend down or error**
- ✅ `subscriptionCheckMiddleware` has try-catch
- ✅ Defaults to plan: "free" on error
- ✅ App continues to work
- ✅ No crashes

### 6. **User tries to start trial twice**
- ✅ `startFreeTrial()` checks if subscription exists
- ✅ If already in trial: returns error 400
- ✅ If trial expired: starts new trial

---

## RevenueCat Integration (For Paid Subscriptions)

When trial expires, automatically trigger payment:

```typescript
// In subscription-service.ts handleTrialExpiration()

export async function handleTrialExpiration(userId: string): Promise<void> {
  // ... existing code ...
  
  if (isTrialExpired) {
    // Trigger RevenueCat payment prompt on frontend
    await apiRequest("POST", "/api/payment/start-conversion", {
      userId,
      reason: "trial_expired"
    });
    
    // OR send push notification with deep link to paywall
    // OR update RevenueCat offering on backend
  }
}
```

---

## Monitoring & Analytics

Track important events:

```typescript
// Log when trial starts
console.log(`Trial started: ${userId}, expires ${trialExpiresAt}`);

// Log when trial expires
console.log(`Trial expired: ${userId}, conversion ready`);

// Log daily limit hits
console.log(`Daily limit hit: ${userId}, plan: free`);

// Log conversions
console.log(`Trial → Paid conversion: ${userId}`);
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Trial not showing on frontend | Call `refreshSubscriptionStatus()` after starting trial |
| Daily limit not working | Check that `shouldEnforceDailyLimits()` is called in `/api/analyze` |
| Trial expired but user still sees it | Add `refreshSubscriptionStatus()` to app foreground listener |
| Backend returns undefined values | Check that subscription record exists in DB for user |
| New device gets trial | Expected behavior - each device is a separate user |

---

## Summary

This system provides:

1. **Backend**: Accurate trial/paid tracking with `getUserSubscriptionStatus()`
2. **API**: Three endpoints for subscription management
3. **Frontend**: Context hook for easy access across screens
4. **Database**: Existing schema supports all features
5. **edge cases**: Handled gracefully with sensible defaults

All subscription logic is centralized, making it easy to:
- Change trial duration (update: `3 * 24 * 60 * 60 * 1000`)
- Change daily limit (update: `2` to any number)
- Add new subscription tiers (extend schema + service)
- Integrate RevenueCat (update: `handleTrialExpiration()`)
