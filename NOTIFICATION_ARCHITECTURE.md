# GhostReply Notifications Architecture Summary

## Complete Notification System

GhostReply now has a fully integrated push notification system with four key components:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  REACT NATIVE APP (Frontend Listeners)                          │
│  ├─ Requests notification permission                            │
│  ├─ Stores Expo push token                                      │
│  ├─ Listens for incoming notifications                          │
│  └─ Routes user when notification tapped                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓ (API calls)
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  EXPRESS BACKEND (Node.js/PostgreSQL)                           │
│  ├─ Stores push tokens in database                              │
│  ├─ Sends notifications via Expo API                            │
│  ├─ Tracks notification history                                 │
│  └─ Manages subscription state                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
    ↓ (Scheduled 9 AM)     ↓ (Scheduled midnight)     ↓ (Webhooks)
    
CRON JOB 1               CRON JOB 2               REVENUECAT
Trial Expiration         Daily Limit              Webhooks
Check                    Reset                    
└─ Sends warnings        └─ 2 replies ready       └─ Purchase events
   at 3 & 1 days           for free users           to notification
   before expiry                                    system
```

## Component Breakdown

### 1. Frontend (React Native + Expo)
**File**: [lib/notifications.ts](lib/notifications.ts), [app/_layout.tsx](app/_layout.tsx)

```
On App Start:
1. Request notification permission (user-facing prompt)
2. Get Expo push token if permission granted
3. Send token to backend via POST /api/notifications/token
4. Set up listeners for incoming notifications
5. Route user appropriately when notification tapped
```

**Notification Actions** (when user taps):
- Trial warning → Navigate to paywall
- Trial expired → Navigate to paywall (upsell)
- Daily reset → Navigate to home
- Subscription success → Navigate to home
- Engagement → Navigate to home

### 2. Backend - Core Notification Service
**File**: [server/push-notifications.ts](server/push-notifications.ts)

```
Functions:
├─ sendPushNotification()           - Low-level Expo API call
├─ sendTrialExpiringWarning()       - Trial expiration warnings
├─ sendTrialExpiredUpsell()         - Conversion upsell
├─ sendDailyLimitReset()            - Daily limit notification
├─ sendSubscriptionUpgradeSuccess() - Purchase confirmation
├─ sendEngagementNotification()     - Re-engagement (not yet active)
└─ Endpoints:
   ├─ POST /api/notifications/token  - Register push token
   └─ POST /api/notifications/test   - Send test notification
```

### 3. Backend - Cron Scheduler
**File**: [server/cron-scheduler.ts](server/cron-scheduler.ts)

```
Job 1: Trial Expiration Check (9:00 AM Daily)
└─ Loop through all users
   └─ Call handleTrialExpiration() for each
      ├─ Send 3-day warning
      ├─ Send 1-day warning  
      └─ Send trial expired upsell

Job 2: Daily Limit Reset (12:00 AM Daily)
└─ Loop through all users
   └─ Call notifyDailyLimitReset() if free tier
      └─ Send "Your Daily Replies Are Ready"
```

### 4. Backend - RevenueCat Webhooks
**File**: [server/revenuecat-webhook.ts](server/revenuecat-webhook.ts)

```
Endpoint: POST /api/webhooks/revenuecat

Event Handlers:
├─ initial_purchase        → Send congratulations notification
├─ renewal                 → Log renewal
├─ subscription_started    → Send welcome notification
├─ transfer                → Send welcome notification
└─ cancellation            → Log cancellation

Security:
├─ Verify signature with REVENUECAT_WEBHOOK_KEY
├─ Reject unsigned events (401)
└─ Timing-safe comparison
```

### 5. Database
**Tables**:
- `push_tokens` - Stores user device tokens
- `notification_history` - Tracks all sent notifications

## Data Flow Examples

### Example 1: User Starts Trial
```
1. User downloads app → onboarding
2. User grants notification permission → Token generated
3. POST /api/notifications/token → Token stored in database
4. User clicks "Start Free Trial" → Trial created (7 days)
5. (Wait)
6. Day 4, 9 AM: Cron job runs
7. handleTrialExpiration(userId) called
8. daysRemaining = 3 → Send warning notification
9. User receives: "Your trial expires in 3 days"
10. User taps notification → Redirect to paywall
```

### Example 2: User Subscribes
```
1. User on paywall → Taps "Subscribe"
2. PaymentSheet opens
3. User completes purchase
4. Payment processed by Google Play / App Store
5. RevenueCat receives purchase event
6. RevenueCat sends webhook to: POST /api/webhooks/revenuecat
7. Server validates signature
8. Handler: handleInitialPurchase(userId)
9. Call: notifySubscriptionSuccess(userId, "Premium Monthly")
10. User receives: "Welcome to Premium"
11. User taps notification → App opens with "Welcome!" screen
```

### Example 3: Free User Daily Reset
```
Day 1, 10 AM: User uses 2 replies (free limit reached)
Day 2, 12:00 AM: Cron job runs
└─ notifyDailyLimitReset(userId) 
└─ User status is free tier
└─ sendDailyLimitReset() called
└─ Expo API sends notification
Day 2, 12:05 AM: User receives: "Your Daily Replies Are Ready - 2 new"
Day 2, 12:10 AM: User opens app and has 2 new replies to use
```

## Configuration Needed

### 1. Database
```bash
npm run db:push  # Creates push_tokens and notification_history tables
```

### 2. Environment Variables (Render)
```
REVENUECAT_WEBHOOK_KEY=<signing-key-from-revenuecat>
EXPO_PUBLIC_DOMAIN=https://ghost-reply.onrender.com
DATABASE_URL=<your-postgres-url>
```

### 3. RevenueCat Webhook Configuration
Dashboard → Settings → Webhooks
- URL: `https://ghost-reply.onrender.com/api/webhooks/revenuecat`
- Events: initial_purchase, renewal, subscription_started, transfer, cancellation
- Signing Key: Paste in env var above

## Files & Lines of Code

| File | Purpose | Key Functions |
|------|---------|---------------|
| [lib/notifications.ts](lib/notifications.ts) | Frontend listener setup | initializeNotificationListeners, requestNotificationPermission |
| [app/_layout.tsx](app/_layout.tsx) | App startup integration | Initialize notifications on app launch |
| [server/push-notifications.ts](server/push-notifications.ts) | Notification sending | sendPushNotification, sendTrialExpiring*, sendDaily* |
| [server/subscription-service.ts](server/subscription-service.ts) | Subscription integration | handleTrialExpiration, notifyDailyLimitReset, notifySubscriptionSuccess |
| [server/cron-scheduler.ts](server/cron-scheduler.ts) | Scheduled tasks | initializeCronJobs, trialExpirationJob, dailyLimitResetJob |
| [server/revenuecat-webhook.ts](server/revenuecat-webhook.ts) | Purchase events | registerRevenueCatWebhook, handleRevenueCatEvent |
| [server/index.ts](server/index.ts) | Server integration | Import and initialize all components |
| [shared/schema.ts](shared/schema.ts) | Database | pushTokens table, notificationHistory table |
| [package.json](package.json) | Dependencies | axios, node-cron, @types/node-cron |

## Notification Types Summary

| Type | Trigger | When | Frequency | Goal |
|------|---------|------|-----------|------|
| Trial Expiring | Cron (9 AM) | 3 & 1 days before | Daily | Conversion prep |
| Trial Expired | Cron (9 AM) | At expiry | Daily | Direct upsell |
| Daily Reset | Cron (12 AM) | Midnight | Daily | Daily actives |
| Subscription Success | Webhook | Purchase complete | Per purchase | Celebrate upgrade |
| Engagement | (Optional) | Inactive users | Custom | Retention |

## Deployment Steps

1. **Push code to GitHub** ✓
2. **Render auto-deploys** (automatic)
3. **Set REVENUECAT_WEBHOOK_KEY** in Render env vars
4. **Restart server** (automatic or manual)
5. **Verify logs** show:
   - `[Cron] ✓ Trial expiration check scheduled...`
   - `[Cron] ✓ Daily limit reset scheduled...`
   - `[RevenueCat] Webhook endpoint registered...`

## Monitoring

### Key Metrics
```sql
-- Daily notification volume
SELECT DATE(sent_at), notification_type, COUNT(*) 
FROM notification_history 
GROUP BY DATE(sent_at), notification_type;

-- Trial conversion from notifications
SELECT COUNT(DISTINCT user_id) 
FROM notification_history 
WHERE notification_type = 'trial_expired';

-- Active users receiving daily reset
SELECT COUNT(DISTINCT user_id)
FROM notification_history
WHERE notification_type = 'daily_limit_reset'
AND DATE(sent_at) = CURRENT_DATE;
```

### Logs to Watch
```
[Cron] Starting trial expiration check...
[RevenueCat] Processing initial_purchase event for user...
[Notifications] Sending subscription success notification...
Error sending push notification → Check token validity
```

## Success Indicators (After 48 Hours)

✓ Cron jobs running (check logs)
✓ Notifications in database (query notification_history)  
✓ Push tokens stored (query push_tokens)
✓ Trial warnings sent to trial users
✓ Daily resets sent at midnight
✓ Test purchase triggers congratulations notification

## Documentation

- [NOTIFICATIONS_SETUP_GUIDE.md](NOTIFICATIONS_SETUP_GUIDE.md) - Frontend setup & API details
- [CRON_WEBHOOKS_SETUP.md](CRON_WEBHOOKS_SETUP.md) - Cron jobs & webhook configuration
- [This file](NOTIFICATION_ARCHITECTURE.md) - System overview

---

**System Status**: ✓ Complete and ready to deploy
**Components**: ✓ All implemented and tested
**Documentation**: ✓ Comprehensive setup guides provided
