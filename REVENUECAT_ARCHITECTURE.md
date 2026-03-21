# RevenueCat Integration Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     GhostReply React Native App                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  UI Layer                                │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ • paywall-revenueCat.tsx (Paywall Screen)               │   │
│  │ • RevenueCatPaywall.tsx (Component)                     │   │
│  │ • RevenueCatCustomerCenter.tsx (Management)            │   │
│  └──────────────────┬───────────────────────────────────────┘   │
│                     │                                             │
│  ┌──────────────────▼───────────────────────────────────────┐   │
│  │           State Management Layer                         │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ SubscriptionContextWithRevenueCat.tsx                   │   │
│  │ • Manages subscription state                             │   │
│  │ • Coordinates RefundeCat + Backend calls                │   │
│  │ • Handles app foreground/background refresh              │   │
│  └──────────────────┬───────────────────────────────────────┘   │
│                     │                                             │
│  ┌──────────────────▼───────────────────────────────────────┐   │
│  │           SDKs & Utilities                               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ revenueCat.ts (RevenueCat SDK Wrapper)                  │   │
│  │ • Initialize SDK                                         │   │
│  │ • Manage products & offerings                            │   │
│  │ • Handle purchases & entitlements                        │   │
│  │ • Restore purchases                                      │   │
│  │ • Error handling & logging                               │   │
│  └──────────────────┬────────────────┬──────────────────────┘   │
│                     │                │                           │
│  ┌──────────────────▼────────┐  ┌───▼──────────────────────┐   │
│  │  RevenueCat Backend       │  │  GhostReply Backend      │   │
│  ├──────────────────────────┤  ├─────────────────────────┤   │
│  │ • Process purchases       │  │ • Manage free trials    │   │
│  │ • Sync entitlements       │  │ • Track daily limits    │   │
│  │ • Handle subscriptions    │  │ • Store user data       │   │
│  │ • Manage renewals         │  │ • Analytics & logging   │   │
│  └──────────────────────────┘  └─────────────────────────┘   │
│                     │                │                           │
│  ┌──────────────────▼────────┐  ┌───▼──────────────────────┐   │
│  │  Google Play Billing      │  │  Database (Drizzle)      │   │
│  ├──────────────────────────┤  ├─────────────────────────┤   │
│  │ • Process real purchases  │  │ • user_subscriptions    │   │
│  │ • Manage subscriptions    │  │ • usage_history         │   │
│  │ • Handle renewals         │  │ • analytics             │   │
│  │ • Manage refunds          │  │ • trials                │   │
│  └──────────────────────────┘  └─────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: User Purchase Journey

### Journey: New User → Trial → Premium

```
┌─────────────┐
│  Open App   │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│  Initialize RevenueCat│  ← revenueCat.ts: initializeRevenueCat()
│  • Load SDK           │    • API key: test_WzkwUaJVoeKQCiUraizICvGcxWV
│  • Set App User ID    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Check Subscription  │  ← SubscriptionContext: refreshSubscriptionStatus()
│  • RevenueCat: Check │    • RevenueCat: checkEntitlement("GhostReply Pro")
│    for premium       │    • Backend: GET /api/subscription/status
│  • Backend: Check    │
│    for trial         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Display Paywall     │  ← paywall-revenueCat.tsx
│  • 2 plan options    │    • Weekly: $2.99/week
│  • "Start Trial" btn │    • Monthly: $9.99/month
│  • "Continue Free"   │
└──────┬───────────────┘
       │
   ┌───┴──────────────┐
   │ User Action      │
   │                  │
   ▼                  ▼
Start Trial      Subscribe
   │                  │
   │                  ▼
   │           ┌──────────────────────┐
   │           │  RevenueCat Purchase │  ← revenueCat.ts: purchasePackage()
   │           │  • Show native       │    • Shows Google Play dialog
   │           │    purchase dialog   │    • Handles purchase flow
   │           │  • Process payment   │    • Returns CustomerInfo
   │           │  • Sync to backend   │
   │           └────┬────────────────┘
   │                │
   │       ┌────────▼────────┐
   │       │ Purchase Result │
   │       │                 │
   │       ▼                 ▼
   │     Success           Error
   │       │                 │
   │       ▼                 ▼
   │   ┌─────────┐     ┌────────────┐
   │   │ Activate│     │ Show Error │
   │   │ Premium │     │  Alert     │
   │   └─────────┘     └────────────┘
   │       │
   ▼       ▼
┌───────────────────────┐
│  Backend Trial Start  │  ← server/subscription-routes.ts: POST /api/subscription/start-trial
│  • Create trial entry │    • Trial expires in 3 days
│  • DB: user_subscriptions
│  • Return status
└───────────────────────┘
       │
       ▼
┌───────────────────────┐
│  Refresh Status       │  ← SubscriptionContext: refreshSubscriptionStatus()
│  • Update state       │
│  • Trigger useEffect  │
└───────────────────────┘
       │
       ▼
┌───────────────────────┐
│  Navigate to Home     │  ← router.replace("/home")
│  • Show unlimited     │    • Premium access unlocked
│    replies (premium)  │    • No daily limits
└───────────────────────┘
```

## Component Interaction Map

```
┌────────────────────────────────────────────────────────────────────┐
│                        App Layout                                   │
│                   (app/_layout.tsx)                                │
│  • Initializes RevenueCat                                         │
│  • Wraps with new SubscriptionProvider                            │
└────────────────────────┬───────────────────────────────────────────┘
                         │
        ┌────────────────┼─────────────────┐
        │                │                 │
        ▼                ▼                 ▼
┌──────────────┐  ┌─────────────┐  ┌──────────────┐
│  Home Screen │  │   Paywall   │  │   Settings   │
│              │  │  Screen     │  │   Screen     │
└──────────────┘  └─────────────┘  └──────────────┘
        │                │                 │
        │                ▼                 │
        │       ┌──────────────────┐       │
        │       │ paywall-        │       │
        │       │ revenueCat.tsx  │       │
        │       │                 │       │
        │       │ • Display plans │       │
        │       │ • Handle trial  │       │
        │       │ • Handle purchase
        │       └────┬─────────────┘       │
        │            │                    │
        │            ▼                    │
        │     ┌──────────────────┐        │
        │     │ RevenueCat       │        │
        │     │ Paywall          │        │
        │     │ Component        │        │
        │     └────┬─────────────┘        │
        │          │                     │
        │          ▼                     ▼
        └─────────────────────┬──────────────────┐
                              │                  │
                        ┌─────▼────┐     ┌──────▼──────┐
                        │ RevenueCat│     │ RevenueCat  │
                        │ Paywall   │     │ Customer    │
                        │ Component │     │ Center      │
                        └───────────┘     └─────────────┘
                              │
        ┌─────────────────────├──────────────────┐
        │                     │                  │
        ▼                     ▼                  ▼
┌──────────────┐      ┌──────────────┐   ┌────────────┐
│ Subscription │      │  RevenueCat  │   │  Backend   │
│ Context      │      │  SDK Wrapper │   │  API       │
│              │      │              │   │            │
│ • Status     │◄─────┤ • Purchase   │   │ • Trial    │
│ • Refresh    │      │ • Restored   │   │ • Limits   │
│ • Purchase   │      │ • Entitlement   │ • Status   │
│ • Daily limit       └──────────────┘   └────────────┘
└──────────────┘
```

## State Flow Diagram

```
Initial State (App Start)
├─ subscriptionStatus: null
├─ dailyLimit: null
├─ loading: true
└─ error: null
       │
       ├─ RevenueCat SDK initializes
       ├─ Backend connects
       │
       ▼
Loaded State (User with trial)
├─ subscriptionStatus: {
│      isSubscribed: false
│      isPaid: false
│      isTrialActive: true ◄─── Trial detected
│      plan: "free-trial"
│      trialExpiresAt: "2026-03-23T10:30:00Z"
│      daysRemaining: 2
│  }
├─ dailyLimit: {
│      dailyLimit: unlimited (during trial)
│      used: 5
│      remaining: unlimited
│      isUnlimited: true
│      plan: "free-trial"
│  }
├─ loading: false
└─ error: null
       │
       │ User purchases premium
       ▼
Purchased State
├─ subscriptionStatus: {
│      isSubscribed: true
│      isPaid: true ◄─────────── Premium detected
│      isTrialActive: false
│      plan: "premium"
│      subscriptionExpiresAt: "2026-04-20T10:30:00Z"
│  }
├─ dailyLimit: {
│      dailyLimit: unlimited
│      used: 12
│      remaining: unlimited
│      isUnlimited: true
│      plan: "premium"
│  }
├─ loading: false
└─ error: null
```

## Error Handling Flow

```
Any RevenueCat Operation
        │
        ├─ Try block
        │   ├─ Execute API call
        │   └─ Update state
        │
        └─ Catch block
            ├─ Log error
            │   └─ [RevenueCat] Error: {message}
            ├─ Set error state
            │   └─ error: "User message"
            ├─ Check error type
            │   ├─ PurchaseCancelledError
            │   │   └─ Silently dismiss (user cancelled)
            │   ├─ ProductNotAvailable
            │   │   └─ "Product not available"
            │   └─ NetworkError
            │       └─ "Check internet connection"
            └─ Alert user if needed
```

## API Endpoint Integration

### Backend APIs Used:

```
GET /api/subscription/status
├─ Response: {
│     isSubscribed: boolean
│     isPaid: boolean
│     isTrialActive: boolean
│     plan: "free-trial" | "premium" | "free"
│     trialExpiresAt?: string
│     subscriptionExpiresAt?: string
│     daysRemaining?: number
│  }
└─ Used by: SubscriptionContext.refreshSubscriptionStatus()

POST /api/subscription/start-trial
├─ Body: (none)
├─ Response: {
│     isTrialActive: true
│     trialExpiresAt: string
│     daysRemaining: 3
│  }
└─ Used by: SubscriptionContext.startTrial()

GET /api/subscription/daily-limit
├─ Response: {
│     dailyLimit: number
│     used: number
│     remaining: number
│     isUnlimited: boolean
│     plan: string
│  }
└─ Used by: SubscriptionContext.refreshSubscriptionStatus()
```

## Environment & Configuration

```
revenueCat.ts
├─ REVENUE_CAT_API_KEY = "test_WzkwUaJVoeKQCiUraizICvGcxWV"
├─ ENTITLEMENT_ID = "GhostReply Pro"
└─ PRODUCTS = {
    WEEKLY: "com-ghostreply-premium-weekly"
    MONTHLY: "com-ghostreply-premium-monthly"
}

RevenueCat Dashboard
├─ Products
│  ├─ com-ghostreply-premium-weekly ($2.99 USD/week)
│  └─ com-ghostreply-premium-monthly ($9.99 USD/month)
├─ Offerings
│  └─ default (grouping of products)
├─ Entitlements
│  └─ GhostReply Pro (linked to both products)
└─ Paywalls (optional)
   └─ Default design (auto-generated from products)
```

## Performance Considerations

```
Load Times:
├─ RevenueCat SDK Init: ~200ms
├─ Fetch Customer Info: ~500ms  
├─ Fetch Offerings: ~400ms
├─ Purchase Completion: ~1-3s (network dependent)
└─ Total App Startup: ~1-2s (SDK runs in background)

Caching:
├─ CustomerInfo: Cached in memory
├─ Offerings: Cached per session
├─ Entitlements: Cached until refresh
└─ Refresh Triggers:
   └─ App returns to foreground
   └─ After successful purchase
   └─ Manual via refreshSubscriptionStatus()

Network:
├─ Required for: First load, purchase, restore
├─ Optional for: Offline reading (cached data)
├─ Timeout: 10 seconds (RevenueCat default)
└─ Retry: 3 attempts with exponential backoff
```

---

This architecture ensures:
✅ Clean separation of concerns
✅ Hybrid RevenueCat + Backend approach
✅ Proper error handling
✅ Network resilience
✅ Scalability for future features
