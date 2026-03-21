# Automated Notifications & Webhooks Setup Guide

## Overview

GhostReply now has two automated systems in place:

1. **Cron Jobs** - Scheduled daily tasks for trial expiration checks and daily limit resets
2. **RevenueCat Webhooks** - Real-time purchase notifications from RevenueCat

These systems work together to keep users engaged and drive monetization through timely notifications.

## Cron Jobs (Automated Daily Tasks)

### What They Do

Two scheduled jobs run daily:

| Job | Schedule | Function | Purpose |
|-----|----------|----------|---------|
| **Trial Expiration Check** | 9:00 AM daily | Sends reminders at 3 and 1 days before expiry, sends upsell at expiry | Drive conversion to paid |
| **Daily Limit Reset** | 12:00 AM (midnight) daily | Sends "Your Daily Replies Are Ready" to free tier users | Increase daily active users |

### How It Works

1. **Startup**: Server initializes cron jobs automatically via `initializeCronJobs()`
2. **Execution**: Jobs run on schedule - check all users in database
3. **Notifications**: Appropriate notifications sent to each user
4. **Logging**: All job executions logged to console
5. **Shutdown**: Jobs gracefully stop when server receives SIGTERM/SIGINT

### File Structure

```
server/cron-scheduler.ts       # Cron job definitions
server/subscription-service.ts # Notification functions called by jobs
server/index.ts                # Integrates and starts jobs
```

### Configuration

**Change job times** by editing the cron schedule pattern in [server/cron-scheduler.ts](server/cron-scheduler.ts#L33):

```typescript
// Cron format: second minute hour dayOfMonth month dayOfWeek
"0 9 * * *"    // 9:00 AM every day
"0 0 * * *"    // 12:00 AM (midnight) every day
```

Common patterns:
- `"0 9 * * *"` - 9:00 AM daily
- `"0 0 * * *"` - Midnight daily
- `"0 */6 * * *"` - Every 6 hours
- `"0 9 * * 1"` - 9:00 AM every Monday

**Disable a job** by commenting it out in `initializeCronJobs()`:
```typescript
// const trialExpirationJob = cron.schedule("0 9 * * *", async () => {
//   ...
// });
```

### Monitoring Job Execution

Jobs log detailed information:
```
[Cron] Starting trial expiration check...
[Cron] Checking 1234 users for trial expiration...
[Cron] Trial expiration check completed. Checked: 1234 users
```

**View logs in production**:
- **Render**: Dashboard → Logs tab
- **Local development**: Console output

**Database verification**: Check notification_history table
```sql
-- See recent notifications
SELECT notification_type, COUNT(*) as count 
FROM notification_history 
WHERE sent_at > NOW() - INTERVAL '24 hours'
GROUP BY notification_type;
```

### Jobs Are Already Running

When you deploy this code:
1. Server starts normally
2. Cron jobs initialize automatically
3. Jobs run on their schedules
4. No additional setup needed

---

## RevenueCat Webhooks (Real-Time Purchase Notifications)

### What They Do

Receive real-time events from RevenueCat when users:
- Make initial purchase
- Subscription renews (auto-renewal)
- Cancel subscription
- Transfer subscription

### Setup Instructions

### Step 1: Get Your Webhook Key

1. Go to **RevenueCat Dashboard**: https://app.revenuecat.com
2. Navigate to **Settings → Webhooks**
3. Under "Webhook Events", find your webhook key
4. Copy the **Signing Key** (used for signature validation)

### Step 2: Set Environment Variable

Add to your `.env` file (or Render environment variables):

```bash
REVENUECAT_WEBHOOK_KEY=<your-webhook-key-from-dashboard>
```

**Get current value if already set**:
```bash
# In production (Render)
# Dashboard → Environment → REVENUECAT_WEBHOOK_KEY
```

### Step 3: Configure Webhook URL in RevenueCat

1. In **RevenueCat Dashboard → Settings → Webhooks**
2. Add URL: `https://ghost-reply.onrender.com/api/webhooks/revenuecat`
3. Select events to receive:
   - ✓ Initial Purchase
   - ✓ Renewal
   - ✓ Cancellation
   - ✓ Subscription Started
   - ✓ Transfer
4. Save

### Step 4: Test Webhook

**Test from RevenueCat Dashboard**:
1. Go to Webhooks section
2. Click "Send Test Event"
3. Check server logs for delivery confirmation

**Test manually**:
```bash
curl -X POST https://ghost-reply.onrender.com/api/webhooks/revenuecat \
  -H "Content-Type: application/json" \
  -H "X-RevenueCat-Signature: test-signature" \
  -d '{
    "event": {
      "type": "initial_purchase",
      "app_user_id": "device-id-123",
      "product_id": "ghostreply_monthly"
    }
  }'
```

### How Webhooks Work

1. **User Purchases** → RevenueCat processes payment
2. **Webhook Event Triggered** → RevenueCat sends POST to `/api/webhooks/revenuecat`
3. **Signature Verified** → Server validates webhook authenticity
4. **Event Processed** → Send congratulations notification to user
5. **Logged** → Event recorded in database

### Events Handled

| Event | When | Action |
|-------|------|--------|
| `initial_purchase` | User buys subscription | Send congratulations notification |
| `renewal` | Subscription auto-renews | Log event (optional: send renewal confirmation) |
| `subscription_started` | New subscription begins | Send welcome notification |
| `transfer` | Subscription transferred | Send welcome notification |
| `cancellation` | User cancels | Log cancellation reason |

### File Structure

```
server/revenuecat-webhook.ts   # Webhook handler and event processor
server/index.ts                # Registers webhook endpoint
```

### Monitoring Webhooks

**View webhook logs**:
```sql
-- See recent webhook events
SELECT * FROM notification_history 
WHERE notification_type = 'subscription_success'
ORDER BY sent_at DESC 
LIMIT 10;
```

**In production logs**:
```
[RevenueCat] Processing initial_purchase event for user user-123
[RevenueCat] Sending congratulations notification...
```

### Webhook Security

✓ **Signature validation** - All webhooks validated with signing key
✓ **No signature = rejected** - Invalid signatures return 401
✓ **Development mode** - Falls back gracefully if key not set
✓ **Timing-safe comparison** - Protection against timing attacks

### Troubleshooting Webhooks

**Webhook not being received?**
1. ✓ Verify webhook URL is correct in RevenueCat dashboard
2. ✓ Verify server is running and accessible
3. ✓ Check network/firewall allows inbound requests
4. ✓ Review Render logs for errors

**"Invalid signature" error?**
1. ✓ Verify `REVENUECAT_WEBHOOK_KEY` is set correctly
2. ✓ Get latest key from RevenueCat dashboard (may have rotated)
3. ✓ Restart server after changing env var

**Purchase notification not sent?**
1. ✓ Verify user has push token in `push_tokens` table
2. ✓ Check `notification_history` to see if event was processed
3. ✓ Review server logs for notification send errors

---

## Combined Flow

### Purchase-to-Notification Flow

```
1. User downloads app
   ↓
2. App requests notification permission
   ↓
3. User grants permission → Token sent to backend
   ↓
4. User clicks "Subscribe" on paywall
   ↓
5. RevenueCat processes payment
   ↓
6. RevenueCat sends webhook to your server
   ↓
7. Server sends congratulations notification via Expo
   ↓
8. User receives notification on phone
   ↓
9. User opens app by tapping notification
   ↓
10. App shows "Welcome to Premium!" screen
```

### Trial Expiration-to-Subscription Flow

```
Day 1: User starts 7-day trial
   ↓
Day 4: Cron job runs at 9 AM
   ↓
Day 4: App has 3 days left → Warning notification sent
   ↓
Day 6: Cron job runs at 9 AM
   ↓
Day 6: App has 1 day left → Urgent warning notification sent
   ↓
Day 7: Trial expires
   ↓
Day 7: Cron job runs at 9 AM
   ↓
Day 7: Trial expired → Upsell notification sent
   ↓
User taps notification → Paywall opens
   ↓
User subscribes → Webhook received → Congratulations notification
``` ### Daily Free User Flow

```
User is on free tier (2 replies/day limit)
   ↓
Daily at 12:00 AM (midnight): Cron job runs
   ↓
"Your Daily Replies Are Ready" notification sent
   ↓
User receives notification and opens app
   ↓
User can now use 2 replies again
   ↓
Repeat daily
```

---

## Deployment Checklist

Before you consider automated notifications fully active:

- [ ] **Cron jobs** are running (check server logs for "[Cron]" messages)
- [ ] **RevenueCat webhook** is configured in RevenueCat dashboard
- [ ] **Environment variable** `REVENUECAT_WEBHOOK_KEY` is set in Render
- [ ] **Test webhook** sent successfully (check logs)
- [ ] **Purchase test** made to verify notifications work
- [ ] **Database migration** run (`npm run db:push`)
- [ ] **Push tokens** being stored in `push_tokens` table
- [ ] **Notifications** appearing in `notification_history` table

### Deployment Steps

1. **Commit code**:
   ```bash
   git add -A
   git commit -m "feat: Add cron scheduler and RevenueCat webhook integration"
   git push origin main
   ```

2. **Render auto-deploys** your code

3. **Set environment variable** in Render:
   - Dashboard → Environment Variables
   - Add: `REVENUECAT_WEBHOOK_KEY=<your-key>`
   - Save and restart server

4. **Verify in logs**:
   ```
   [Cron] ✓ Trial expiration check scheduled for 9:00 AM daily
   [Cron] ✓ Daily limit reset scheduled for 12:00 AM (midnight) daily
   [Cron] Jobs initialized successfully
   [RevenueCat] Webhook endpoint registered at POST /api/webhooks/revenuecat
   ```

---

## Advanced Configuration

### Custom Job Times

Edit [server/cron-scheduler.ts](server/cron-scheduler.ts) to modify schedules:

```typescript
// Trial check at 8 AM instead of 9 AM
const trialExpirationJob = cron.schedule("0 8 * * *", async () => {
  // ...
});

// Daily reset at 6 AM instead of midnight
const dailyLimitResetJob = cron.schedule("0 6 * * *", async () => {
  // ...
});
```

### Add New Jobs

Template for adding a new cron job:

```typescript
const myNewJob = cron.schedule("0 12 * * *", async () => {
  console.log("[Cron] Starting my new job...");
  try {
    const userIds = await getAllUsers();
    for (const userId of userIds) {
      try {
        // Your logic here
      } catch (error) {
        console.error(`Error for user ${userId}:`, error);
      }
    }
    console.log("[Cron] My new job completed.");
  } catch (error) {
    console.error("[Cron] Error in my new job:", error);
  }
});
```

### Webhook Event Customization

Edit [server/revenuecat-webhook.ts](server/revenuecat-webhook.ts) to customize what happens for each event type:

```typescript
async function handleInitialPurchase(userId: string, event: any) {
  // Send notification + any other custom logic
  await notifySubscriptionSuccess(userId, plan);
  // TODO: Add custom analytics
  // TODO: Update user preferences
}
```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Notification send rate**:
   ```sql
   SELECT DATE_TRUNC('day', sent_at) as day, 
          notification_type,
          COUNT(*) as count
   FROM notification_history
   GROUP BY day, notification_type
   ORDER BY day DESC;
   ```

2. **Trial conversion funnel**:
   - Users who see trial_expiring notification
   - Users who see trial_expired notification
   - Users who ultimately convert to paid

3. **Daily active engagement**:
   - Users who receive daily_limit_reset
   - Users who open app after notification

### Expected Results (After 30 days)

- **Cron jobs**: Running successfully every day (check logs)
- **Webhooks**: Receiving purchase events from RevenueCat
- **Notifications**: Stored in `notification_history` table
- **Trial conversion**: Should increase with timely trial expiration warnings

---

## Troubleshooting

### Cron Jobs Not Running

**Symptoms**: No "[Cron]" messages in logs

**Solutions**:
1. Verify `initializeCronJobs()` is called in server/index.ts
2. Check server logs for initialization errors
3. Verify server actually started (check Render dashboard)
4. Verify database connection is working

### Webhooks Not Being Received

**Symptoms**: Webhook sent but no logs in server

**Solutions**:
1. Verify webhook URL is correct: `https://ghost-reply.onrender.com/api/webhooks/revenuecat`
2. Verify `registerRevenueCatWebhook(app)` is called in index.ts
3. Test with curl command above
4. Check Render logs for errors
5. Verify server is running

### Notifications Not Sending

**Symptoms**: Job runs but no notifications

**Solutions**:
1. Verify users have push tokens: `SELECT * FROM push_tokens LIMIT 5;`
2. Check notification_history was updated: `SELECT * FROM notification_history ORDER BY sent_at DESC LIMIT 5;`
3. Verify Expo API is accessible
4. Check for errors in logs (look for "Error sending push notification")

---

## Next Steps

1. **Deploy** this code to production
2. **Set** `REVENUECAT_WEBHOOK_KEY` in Render environment
3. **Test** by making a test purchase
4. **Monitor** notification delivery for 24 hours
5. **Adjust** schedules based on user activity patterns
6. **Analyze** conversion rates from trial warnings to purchases

See [NOTIFICATIONS_SETUP_GUIDE.md](NOTIFICATIONS_SETUP_GUIDE.md) for frontend notification setup.

## Support

For issues:
1. Check logs (Render dashboard → Logs)
2. Query database tables for event history
3. Test webhook manually with curl
4. Review this guide for configuration steps
