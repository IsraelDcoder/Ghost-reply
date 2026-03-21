# Push Notifications Implementation Guide

## Overview

GhostReply now has a complete push notification system to keep users engaged and drive monetization. Notifications are sent via Expo Push Notifications API and are triggered by key subscription lifecycle events.

## Architecture

### Frontend (React Native)
- **File**: `lib/notifications.ts`
- **Setup**: Initialized in `app/_layout.tsx` on app startup
- **Handlers**: Responds to notifications and routes users appropriately

### Backend (Node.js/Express)
- **File**: `server/push-notifications.ts`
- **Database**: Stores push tokens and notification history
- **Integration**: Integrated with subscription lifecycle in `server/subscription-service.ts`

### Database
- **Table**: `push_tokens` - Stores Expo push tokens per user
- **Table**: `notification_history` - Tracks sent notifications to prevent duplicates

## Notification Types

### 1. Trial Expiration Reminders
**When**: Sent when user's trial is about to expire
- **3 days remaining**: "Your trial expires in 3 days"
- **1 day remaining**: "Your AI reply trial expires tomorrow"
- **0 days (expired)**: "Your Trial Has Ended" + conversion upsell

**Purpose**: Drive conversion to paid subscription

**Backend Function**: `sendTrialExpiringWarning()`, `sendTrialExpiredUpsell()`

### 2. Daily Limit Reset
**When**: Sent at midnight or when free user's daily limit resets
**Message**: "Your Daily Replies Are Ready - You have 2 new replies to use today"
**Purpose**: Increase daily active users, encourage more engagement

**Backend Function**: `sendDailyLimitReset()`

### 3. Subscription Success
**When**: Sent immediately after user successfully subscribes
**Message**: "Welcome to Premium - You're all set with unlimited AI-powered replies"
**Purpose**: Celebrate upgrade, set engagement expectations

**Backend Function**: `sendSubscriptionUpgradeSuccess()`

### 4. Engagement/Retention
**When**: Sent to inactive users (optional, not yet implemented)
**Messages** (rotates):
- "Someone Replied - See how GhostReply would respond"
- "Boost Your Conversations - Get AI-powered suggestions"
- "Quick Win - Craft the perfect response in seconds"

**Purpose**: Re-engage lapsed users

**Backend Function**: `sendEngagementNotification()`

## Setup Instructions

### 1. Frontend Setup (Already Configured)

The app now automatically:
1. **Requests notification permissions** during onboarding (allow-notifications.tsx screen)
2. **Gets Expo push token** when permission is granted
3. **Registers token with backend** via `/api/notifications/token`
4. **Sets up listeners** for incoming notifications
5. **Routes user** when notification is tapped

### 2. Backend Setup

#### Environment Variables Needed
Already configured in Render:
- `DATABASE_URL` - PostgreSQL connection
- `EXPO_PUBLIC_PROJECT_ID` - (Optional, for Expo CLI integration)

#### Dependencies
Added to `package.json`:
- `axios` - For HTTP requests to Expo API

#### Database Migrations
Run to set up notification tables:
```bash
npm run db:push
```

This creates:
- `push_tokens` table - Stores user's push tokens
- `notification_history` table - Tracks sent notifications

### 3. Expo Configuration

Your app is already configured with Expo. To enable push notifications in the Expo CLI:

1. Make sure your `app.json` has:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "colors": ["#FFFFFF"]
        }
      ]
    ]
  }
}
```

2. The app is configured to use Expo's managed pushing service.

## Testing

### Test Notification (Development)
Send a test notification via API:
```bash
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: your-device-id" \
  -d '{ "token": "ExponentPushToken[...]" }'
```

### Manual Testing Steps
1. Run app on physical device or emulator
2. Grant notification permissions when prompted
3. Go to backend logs to confirm token was registered
4. Check `notification_history` table to see sent notifications

## Integration Points

### Trial Expiration Flow
1. User's trial is created → `startFreeTrial()` in subscription-service.ts
2. Each day, check if trial is expiring → `handleTrialExpiration()` 
3. If 3 or 1 day remain → `sendTrialExpiringWarning()`
4. If trial expired → `sendTrialExpiredUpsell()`
5. User taps notification → Routes to paywall

**How to trigger**: Call `handleTrialExpiration(userId)` daily via cron or when user opens app

### Daily Limit Reset Flow
1. User is free tier with limit enforcement
2. Daily reset happens → `notifyDailyLimitReset(userId)`
3. Push notification sent with 2 new replies
4. User opens app from notification

**How to trigger**: Call `notifyDailyLimitReset(userId)` at midnight daily or per-user

### Subscription Success Flow
1. RevenueCat webhook receives purchase event
2. Backend updates user subscription status
3. Call `notifySubscriptionSuccess(userId, planName)`
4. User receives congratulations notification

**How to trigger**: Call from subscription-routes.ts when purchase is confirmed

## Production Considerations

### Notification Fatigue
- Track notification history to prevent same notification sent twice
- Limit notifications to 1-2 per week per user for engagement types
- Always respect user notification preferences

### Error Handling
- If push token is invalid, Expo API returns error
- Failed notifications are logged but don't crash app
- Token registration failures don't block app startup

### Scaling
For production with thousands of users:
- Consider batch notification sending
- Use Expo Notifications API batching capabilities
- Monitor delivery rates via Expo dashboard
- Set up alerts for failed notification delivery

## Monitoring

### Key Metrics to Track
1. **Token registration rate**: How many users are registering push tokens
2. **Notification send success rate**: % of notifications successfully delivered
3. **Notification interaction rate**: % of users who tap notifications
4. **Conversion rate**: % of trial expiration notifications that lead to purchase

### View Notifications Sent
```sql
-- See all notifications sent
SELECT * FROM notification_history ORDER BY sent_at DESC LIMIT 10;

-- By notification type
SELECT notification_type, COUNT(*) as count 
FROM notification_history 
GROUP BY notification_type;

-- By user
SELECT user_id, notification_type, sent_at 
FROM notification_history 
WHERE user_id = 'your-user-id' 
ORDER BY sent_at DESC;
```

## Next Steps

### To Enable Automated Notifications
1. Set up a cron job to call `handleTrialExpiration()` daily
2. Set up daily reset notifications for free users
3. Hook into RevenueCat webhooks for purchase confirmations

### Example Cron Implementation (Node.js)
```typescript
import cron from 'node-cron';
import { getAllUsers } from '@/server/routes';
import { handleTrialExpiration } from '@/server/subscription-service';

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running trial expiration check...');
  const users = await getAllUsers();
  for (const user of users) {
    await handleTrialExpiration(user.id);
  }
});
```

### RevenueCat Webhook Integration
When RevenueCat sends a purchase webhook:
```typescript
app.post('/api/webhooks/revenuecat', async (req, res) => {
  const { event, uid } = req.body;
  
  if (event.type === 'initial_purchase' || event.type === 'renewal') {
    await notifySubscriptionSuccess(uid, 'Premium');
  }
});
```

## Troubleshooting

### Push Token Not Showing Up
1. Verify notification permissions were granted
2. Check that token matches format: `ExponentPushToken[...]`
3. Check network connectivity

### Notifications Not Arriving
1. Verify token is valid in `/push_tokens` table
2. Check Expo API endpoint is accessible
3. Verify notification data doesn't exceed size limits (4KB)
4. Check user's device notification settings

### Duplicate Notifications
Already prevented by `unique_daily_notification` constraint in database

## API Reference

### Frontend Functions
**lib/notifications.ts**
- `initializeNotificationListeners()` - Set up app listeners
- `requestNotificationPermission()` - Get user permission and token
- `registerPushTokenWithBackend(token, deviceId)` - Send token to server
- `sendTestNotification(token, deviceId)` - Send test notification

### Backend Functions
**server/push-notifications.ts**
- `sendPushNotification(token, title, body, data)` - Low-level send
- `sendTrialExpiringWarning(userId, daysRemaining)` - Trial warning
- `sendTrialExpiredUpsell(userId)` - Conversion upsell
- `sendDailyLimitReset(userId)` - Daily reset
- `sendSubscriptionUpgradeSuccess(userId, planName)` - Upgrade confirm
- `sendEngagementNotification(userId)` - Re-engagement

**server/subscription-service.ts**
- `handleTrialExpiration(userId)` - Check and send trial notifications
- `notifyDailyLimitReset(userId)` - Send daily reset notification
- `notifySubscriptionSuccess(userId, planName)` - Send purchase confirmation

## Files Modified

1. **app/_layout.tsx** - Added notification initialization
2. **lib/notifications.ts** - New, client-side notification handler
3. **server/push-notifications.ts** - New, notification sender service
4. **server/subscription-service.ts** - Added notification triggers
5. **server/index.ts** - Registered notification routes
6. **shared/schema.ts** - Added push_tokens and notification_history tables
7. **package.json** - Added axios dependency
8. **migrations/0002_push_notifications.sql** - New, database tables

## Support

For issues or questions:
1. Check notification_history table for send logs
2. Review Expo Push API documentation: https://docs.expo.dev/push-notifications
3. Check browser network tab for token registration requests
4. Verify database migrations ran successfully
