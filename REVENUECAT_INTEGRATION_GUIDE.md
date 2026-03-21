# RevenueCat SDK Integration Guide for GhostReply

Complete step-by-step guide for integrating RevenueCat subscription management into GhostReply React Native app.

## Table of Contents
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Product Setup in RevenueCat Dashboard](#product-setup)
4. [Implementation Files](#implementation-files)
5. [Usage Examples](#usage-examples)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Installation

### 1. Install Required Packages

```bash
npm install --save react-native-purchases react-native-purchases-ui
```

**Installed Packages:**
- `react-native-purchases` - Main RevenueCat SDK
- `react-native-purchases-ui` - UI components (Paywall & Customer Center)

**Total packages added:** 127 dependencies

---

## Configuration

### 1. API Key

Your RevenueCat API key is configured in `lib/revenueCat.ts`:

```typescript
const REVENUE_CAT_API_KEY = "test_WzkwUaJVoeKQCiUraizICvGcxWV";
```

**🔒 Security Note:** Store this in environment variables for production:

```typescript
const REVENUE_CAT_API_KEY = process.env.REACT_APP_REVENUE_CAT_API_KEY || "test_...";
```

### 2. Product IDs

Configure product IDs that match your Play Console setup:

```typescript
export const PRODUCTS = {
  WEEKLY: "com-ghostreply-premium-weekly",   // $2.99/week
  MONTHLY: "com-ghostreply-premium-monthly",  // $9.99/month
};
```

**⚠️ Important:** Product IDs must use **hyphens (-), not dots (.)** in RevenueCat.

### 3. Entitlement ID

Define your entitlement that users get when subscribed:

```typescript
const ENTITLEMENT_ID = "GhostReply Pro"; // Must match Play Console
```

---

## Product Setup in RevenueCat Dashboard

### 1. Configure Products in RevenueCat

1. Log in to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Select your GhostReply project
3. Navigate to **Products**
4. Add the products from your Play Console:
   - **Weekly:** `com-ghostreply-premium-weekly`
   - **Monthly:** `com-ghostreply-premium-monthly`

### 2. Create Offering

1. Navigate to **Offerings**
2. Create a new offering called `default`
3. Add both products to the offering:
   - Weekly package
   - Monthly package

### 3. Configure Entitlements

1. Navigate to **Entitlements**
2. Create entitlement `GhostReply Pro`
3. Link it to both subscription products
4. Users will get this entitlement upon successful purchase

### 4. Set Up Paywalls (Optional)

1. Navigate to **Paywalls**
2. Create a new paywall
3. Configure the design template and products (Weekly & Monthly)
4. This creates beautiful managed paywalls you can use via `<Paywall />` component

---

## Implementation Files

### Core Files Created

#### 1. `lib/revenueCat.ts` - SDK Wrapper
Provides utility functions:

```typescript
// Initialize SDK
await initializeRevenueCat();

// Check if user has premium access
const isPremium = await checkEntitlement("GhostReply Pro");

// Get customer info
const customerInfo = await getCustomerInfo();

// Make a purchase
const result = await purchasePackage("com-ghostreply-premium-weekly");

// Restore purchases
const restored = await restorePurchases();
```

#### 2. `context/SubscriptionContextWithRevenueCat.tsx` - State Management

Hybrid approach combining RevenueCat + backend:

- **RevenueCat handles:** Premium subscriptions, entitlements, purchases
- **Backend handles:** Free trials (3 days), daily limits, analytics

Usage:
```typescript
const { 
  subscriptionStatus,
  purchaseSubscription,
  startTrial,
  refreshSubscriptionStatus 
} = useSubscription();
```

#### 3. `app/paywall-revenueCat.tsx` - Paywall Screens

Two paywall modes:

**Mode 1: Custom Paywall**
- Shows weekly ($2.99/week) and monthly ($9.99/month) plans
- Custom styling matching app theme
- Direct integration with RevenueCat purchases

**Mode 2: RevenueCat Managed Paywall**
- Uses RevenueCat's designed paywall from dashboard
- Beautiful templates with automatic localization
- One-click configuration

#### 4. `components/RevenueCatPaywall.tsx` - Paywall Component

Self-contained paywall display:

```typescript
<RevenueCatPaywall
  onComplete={() => router.replace("/home")}
  onDismiss={() => setShowPaywall(false)}
  automaticallyDismissWhenPurchased={true}
/>
```

Features:
- Event handling (purchase, dismiss, restore)
- Error handling with user feedback
- Automatic status refresh on purchase

#### 5. `components/RevenueCatCustomerCenter.tsx` - Account Management

User subscription management UI:

```typescript
<RevenueCatCustomerCenter
  onDismiss={() => navigation.goBack()}
  displayCloseButton={true}
/>
```

Allows users to:
- View subscription status
- Manage billing
- Update payment methods
- View billing history
- Cancel subscription

---

## Usage Examples

### 1. Initialize on App Start

```typescript
// In your _layout.tsx or App.tsx
useEffect(() => {
  const init = async () => {
    try {
      await initializeRevenueCat();
      console.log("RevenueCat initialized");
    } catch (error) {
      console.error("Failed to initialize RevenueCat", error);
    }
  };
  
  init();
}, []);
```

### 2. Check Subscription Status

```typescript
import { useSubscription } from "@/context/SubscriptionContext";

export function HomeScreen() {
  const { subscriptionStatus, loading } = useSubscription();

  if (loading) {
    return <ActivityIndicator />;
  }

  if (subscriptionStatus?.isPaid) {
    return <PremiumContent />;
  }

  if (subscriptionStatus?.isTrialActive) {
    const days = subscriptionStatus.daysRemaining;
    return <TrialBanner daysRemaining={days} />;
  }

  return <FreeContent />;
}
```

### 3. Start a Trial (Backend-Managed)

```typescript
const { startTrial } = useSubscription();

const handleTrialStart = async () => {
  try {
    await startTrial();
    console.log("Trial started!");
  } catch (error) {
    console.error("Trial failed:", error);
  }
};
```

### 4. Purchase Subscription (RevenueCat-Managed)

```typescript
const { purchaseSubscription } = useSubscription();

const handleBuyWeekly = async () => {
  const success = await purchaseSubscription("com-ghostreply-premium-weekly");
  
  if (success) {
    Alert.alert("Success!", "Welcome to GhostReply Pro! 🎉");
  } else {
    Alert.alert("Error", "Purchase failed. Please try again.");
  }
};
```

### 5. Show Paywall

```typescript
import { RevenueCatPaywall } from "@/components/RevenueCatPaywall";

export function PaywallScreen() {
  return (
    <RevenueCatPaywall
      onComplete={() => router.replace("/home")}
      automaticallyDismissWhenPurchased={true}
    />
  );
}
```

### 6. Restore Purchases

```typescript
const { restorePurchases } = useSubscription();

const handleRestore = async () => {
  try {
    await restorePurchases();
    Alert.alert("Success", "Purchases restored!");
  } catch (error) {
    Alert.alert("Error", "Restore failed");
  }
};
```

### 7. Show Customer Center

```typescript
import { RevenueCatCustomerCenter } from "@/components/RevenueCatCustomerCenter";

export function SettingsScreen() {
  const [showCustomerCenter, setShowCustomerCenter] = useState(false);

  if (showCustomerCenter) {
    return (
      <RevenueCatCustomerCenter
        onDismiss={() => setShowCustomerCenter(false)}
      />
    );
  }

  return (
    <View>
      <Button
        title="Manage Subscription"
        onPress={() => setShowCustomerCenter(true)}
      />
    </View>
  );
}
```

---

## Testing

### 1. Sandbox Testing

RevenueCat provides sandbox environment for testing without real purchases:

```typescript
// In development, test purchases won't charge
// Configure test devices in RevenueCat Dashboard
```

### 2. Test Scenarios

**Test Case 1: New User → Trial**
1. Launch app
2. Tap "Start Trial"
3. Verify status shows: `isTrialActive: true`, `daysRemaining: 3`

**Test Case 2: Trial → Premium Purchase**
1. On trial, tap "Subscribe Now"
2. Select weekly or monthly plan
3. Complete purchase
4. Verify status: `isPaid: true`, `isTrialActive: false`

**Test Case 3: Free User → Direct Purchase**
1. Skip trial
2. Tap "Subscribe"
3. Complete purchase
4. Verify immediate premium access

**Test Case 4: Restore Purchases**
1. Install app on new device
2. Tap "Restore Purchases"
3. Verify previous subscriptions appear

### 3. Debug Logging

Enable verbose logging in development:

```typescript
if (__DEV__) {
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
}
```

Check console for detailed RevenueCat logs starting with `[RevenueCat]`.

---

## Subscription Flow

### Architecture Overview

```
┌─────────────────┐
│   App Launch    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Initialize RevenueCat SDK      │   ← lib/revenueCat.ts
│  - Set API key                  │
│  - Configure logging            │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Fetch Subscription Status      │   ← RevenueCat API
│  - Check entitlements           │
│  - Get customer info            │
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────┬──────────────────────┐
│   Check Backend      │   Check RevenueCat   │
│   - Trial status     │   - Premium active   │
│   - Daily limit      │   - Entitlements     │
└──────────────────────┴──────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Display Paywall / Home        │
│   - Premium users → full access │
│   - Trial users → limited       │
│   - Free users → 2 daily limit  │
└─────────────────────────────────┘
```

### User Journeys

**Journey 1: Free Trial Path**
```
User → Paywall → "Start Trial" → Backend (3-day trial) → Home (Premium)
```

**Journey 2: Direct Purchase Path**
```
User → Paywall → Select Plan → RevenueCat Purchase → Home (Premium)
```

**Journey 3: Free User Path**
```
User → "Continue Free" → Home (Free, 2 daily limit)
```

**Journey 4: Restore Purchases Path**
```
User → "Restore Purchases" → RevenueCat restorePurchases() → Premium Restored
```

---

## Best Practices

### 1. Error Handling

Always wrap RevenueCat calls in try-catch:

```typescript
try {
  const result = await purchasePackage(productID);
  if (result.success) {
    // Success
  }
} catch (error) {
  console.error("Purchase error:", error);
  Alert.alert("Error", "Purchase failed. Please try again.");
}
```

### 2. Refresh on App Foreground

Auto-refresh subscription when app comes to foreground:

```typescript
useEffect(() => {
  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      refreshSubscriptionStatus(); // Check for changes
    }
  });

  return () => subscription.remove();
}, []);
```

### 3. Entitlement Checking

Always check entitlements, not subscription directly:

```typescript
// ✅ Good - Check for entitlement
const isPremium = await checkEntitlement("GhostReply Pro");

// ❌ Avoid - Checking raw subscription
const isPremium = customerInfo.subscriptions.hasOwnProperty(...);
```

### 4. User ID Linking

Link users when they account or login:

```typescript
// On user registration
await setAppUserID(user.id);

// Enables:
// - Cross-device subscription sync
// - Backend linking
// - Analytics
```

### 5. Network Resilience

Handle network errors gracefully:

```typescript
if (!navigator.onLine) {
  Alert.alert("No Connection", "Please check your internet");
  return;
}

try {
  await purchaseSubscription(productID);
} catch (error) {
  // Retry logic or offline message
}
```

---

## Troubleshooting

### Issue: Products Not Appearing

**Symptom:** Offerings come back empty

**Solutions:**
1. Verify products exist in RevenueCat dashboard
2. Confirm offering is linked to products
3. Check product IDs match exactly:
   - Use hyphens: `com-ghostreply-premium-weekly` ✅
   - Not dots: `com.ghostreply.premium.weekly` ❌
4. Reinitialize RevenueCat: `initializeRevenueCat()`

### Issue: Entitlement Not Activating After Purchase

**Symptom:** Purchase succeeds but `checkEntitlement()` returns false

**Solutions:**
1. Verify entitlement ID matches: `"GhostReply Pro"`
2. Check entitlement is linked to product in dashboard
3. Call `refreshSubscriptionStatus()` or `getCustomerInfo()` again
4. Wait 2-3 seconds before checking (propagation delay)

### Issue: Purchase Cancelled by User

**Symptom:** User gets error after cancelling purchase

**Expected behavior:** This is normal
- RevenueCat fires `PURCHASE_FAILED` event
- User can retry
- No need for special error handling

### Issue: Restore Not Finding Previous Purchases

**Symptom:** User on new device, restore finds nothing

**Solutions:**
1. Verify user had active subscription in past
2. Check correct Google account is logged in
3. Make sure `setAppUserID()` is called for linked accounts
4. Sandbox purchases don't restore (testing only)

### Issue: Sandbox Errors in Development

**Symptom:** Test purchases failing with strange errors

**Solutions:**
1. Enable verbose logging: `LOG_LEVEL.VERBOSE`
2. Check Android:
   - Install app from Android Studio (debug build)
   - Use Play Console internal testing track
3. Check iOS:
   - Use TestFlight for testing
   - Set up sandbox Apple ID
4. Check revenueCat logs for specific error codes

### Issue: Multiple Event Handlers Firing

**Symptom:** Purchase success event fires multiple times

**Solutions:**
1. Use cleanup/abort controller in `useEffect`
2. Check for duplicate event listeners
3. Unsubscribe from AppState on unmount

```typescript
useEffect(() => {
  const subscription = AppState.addEventListener("change", handler);
  
  return () => subscription.remove(); // Cleanup!
}, []);
```

---

## Migration from Backend Subscriptions

If you're currently using only backend-managed subscriptions, here's the transition:

### Step 1: Keep Backend for Free Trials
- Trials continue to be managed by backend (3 days hardcoded)
- Easier to control duration without app updates

### Step 2: Switch Premium to RevenueCat
- New premium users purchase via RevenueCat
- Existing backend subscriptions grandfathered in
- Check both: Backend trial + RevenueCat premium

### Step 3: Monitor Dual State
```typescript
// Check both systems
const isTrialActive = subscriptionStatus.isTrialActive; // Backend
const isPremiumActive = await checkEntitlement("GhostReply Pro"); // RevenueCat
const canAccess = isTrialActive || isPremiumActive;
```

### Step 4: Full Cutover
- Once most users are on RevenueCat, fully retire backend subscriptions
- Keep analytics for historical analysis

---

## Support & Resources

- **RevenueCat Docs:** https://www.revenuecat.com/docs
- **React Native SDK:** https://www.revenuecat.com/docs/getting-started/installation/reactnative
- **Paywalls:** https://www.revenuecat.com/docs/tools/paywalls
- **Customer Center:** https://www.revenuecat.com/docs/tools/customer-center
- **Dashboard:** https://app.revenuecat.com

---

## Summary

✅ **RevenueCat SDK Installed**
✅ **API Key Configured** (test_WzkwUaJVoeKQCiUraizICvGcxWV)
✅ **Products Configured** (Weekly & Monthly)
✅ **Subscription Context Updated**
✅ **Paywall Components Created**
✅ **Customer Center Available**
✅ **Error Handling Implemented**

**Next Steps:**
1. Update `_layout.tsx` to initialize RevenueCat
2. Replace current paywall with new revenueCat version
3. Test purchase flow end-to-end
4. Upload AAB with new subscription code to Play Console
5. Test in internal testing track before production
