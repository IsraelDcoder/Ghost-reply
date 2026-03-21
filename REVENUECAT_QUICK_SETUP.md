# RevenueCat SDK Quick Setup Checklist

## ✅ Completed Tasks

- [x] Installed `react-native-purchases` and `react-native-purchases-ui` packages
- [x] Created `lib/revenueCat.ts` - SDK configuration and utilities
- [x] Created `context/SubscriptionContextWithRevenueCat.tsx` - State management
- [x] Created `app/paywall-revenueCat.tsx` - Updated paywall screen
- [x] Created `components/RevenueCatPaywall.tsx` - Paywall component
- [x] Created `components/RevenueCatCustomerCenter.tsx` - Customer management
- [x] Created `REVENUECAT_INTEGRATION_GUIDE.md` - Comprehensive documentation

## 📋 Next Steps - Implementation

### 1. Update App Layout to Initialize RevenueCat

**File:** `app/_layout.tsx`

Add this to your layout component:

```typescript
import { initializeRevenueCat } from "@/lib/revenueCat";

useEffect(() => {
  const setupRevenueCat = async () => {
    try {
      console.log("[App] Initializing RevenueCat...");
      await initializeRevenueCat();
      console.log("[App] RevenueCat ready");
    } catch (error) {
      console.error("[App] RevenueCat init failed:", error);
      // App continues even if RevenueCat fails
    }
  };

  setupRevenueCat();
}, []);
```

### 2. Update Subscription Context Provider

**File:** `app/_layout.tsx` (or wherever you initialize context)

Replace the old SubscriptionProvider with the new one:

```typescript
// OLD
// import { SubscriptionProvider } from "@/context/SubscriptionContext";

// NEW
import { SubscriptionProvider } from "@/context/SubscriptionContextWithRevenueCat";

export default function RootLayout() {
  return (
    <SubscriptionProvider>
      {/* Your app */}
    </SubscriptionProvider>
  );
}
```

### 3. Update Paywall Route

**Option A: Use New Paywall with RevenueCat**
```typescript
// app/paywall.tsx
export { default } from "./paywall-revenueCat";
```

**Option B: Keep Old, Add RevenueCat Alternative**
- Keep `app/paywall.tsx` as is
- Use `app/paywall-revenueCat.tsx` as alternate route
- Users can choose their preference

### 4. Test RevenueCat Initialization

Run your app and check logs:

```
[RevenueCat] SDK initialized successfully
[Subscription] Initializing RevenueCat...
[App] RevenueCat ready
```

### 5. RevenueCat Dashboard Configuration

Complete these in RevenueCat console:

- [ ] Add Google Play app (Android)
  - Go to RevenueCat dashboard → Projects → Android
  - Paste your Google Play Service Account JSON key
  - This links RevenueCat to your Play Console

- [ ] Configure Products
  - Product → Add `com-ghostreply-premium-weekly`
  - Product → Add `com-ghostreply-premium-monthly`

- [ ] Create Offering
  - Offerings → Create `default` offering
  - Add both products to the offering

- [ ] Configure Entitlements
  - Entitlements → Create `GhostReply Pro`
  - Link to both products

- [ ] (Optional) Create Paywall
  - Paywalls → Create new paywall
  - Choose template design
  - Configure products and pricing
  - Customize colors/text to match app

## 🧪 Testing Checklist

### Local Testing (Debug Build)

- [ ] App initializes without errors
- [ ] Check console logs for `[RevenueCat] SDK initialized successfully`
- [ ] Subscription status loads (might be free tier on fresh build)
- [ ] Can see paywall screen
- [ ] Paywall displays weekly and monthly plans
- [ ] Can toggle between custom and RevenueCat paywall modes

### Purchase Testing

1. **Sandbox Testing** (Recommended first):
   - RevenueCat sandbox environment allows free test purchases
   - No real charges
   - Set up in RevenueCat dashboard

2. **Internal Testing Track** (After AAB build):
   - Upload AAB to Play Console internal testing
   - Testers can make real purchases (charged to Play Store test card)
   - Verify purchases sync with RevenueCat

3. **Test Cases**:
   - [ ] Start trial → verify 3-day timer
   - [ ] Purchase weekly → verify premium access
   - [ ] Purchase monthly → verify premium access
   - [ ] Restore purchases on new device
   - [ ] Cancel subscription in Customer Center
   - [ ] Cross-device subscription sync

## 📦 Building & Deployment

### 1. Build AAB for Play Console

```bash
eas build --platform android --profile production --wait
```

**Note:** If Free tier quota exhausted, wait until April 1 or upgrade.

### 2. Upload to Internal Testing

```typescript
// In Play Console:
1. Go to Testing → Internal testing
2. Create new release
3. Upload AAB from EAS build
4. Link Products (Weekly & Monthly subscriptions)
5. Set required devices/regions
6. Release to testers
```

### 3. Verify Subscriptions in Play Console

In Play Console → Monetize → Subscriptions:
- [ ] Premium Weekly exists
- [ ] Premium Monthly exists
- [ ] Both linked to app version
- [ ] Pricing set correctly ($2.99 & $9.99)

## 🔐 Security Checklist

- [ ] Never commit API key in code (use .env in production)
- [ ] Test user ID linking: `setAppUserID(user.id)`
- [ ] Verify entitlements on backend (never trust client only)
- [ ] Enable app signing in Play Console
- [ ] Review privacy policy for RevenueCat sharing
- [ ] Test GDPR compliance (data deletion, export)

## 🚀 Production Readiness

- [ ] All test cases passing
- [ ] RevenueCat paywall configured in dashboard
- [ ] Customer Center working
- [ ] Entitlements properly validated
- [ ] Error handling implemented
- [ ] Logging enabled for debugging
- [ ] Analytics tracking subscriptions
- [ ] Support documentation updated
- [ ] Backup plan if RevenueCat service down
- [ ] Monitor RevenueCat & Play Console metrics

## 📊 Monitoring & Maintenance

### Daily Checks

```bash
# Monitor RevenueCat dashboard for:
- Revenue & MRR (Monthly Recurring Revenue)
- Subscription conversions
- Trial-to-paid conversion rate
- Churn rate (cancellations)
```

### Weekly Checks

- Check app logs for RevenueCat errors
- Monitor user feedback on subscriptions
- Verify purchases flowing through correctly

### Monthly

- Review revenue metrics
- Analyze conversion funnel
- Check for any support issues
- Plan optimizations

## 📞 Troubleshooting Reference

**Common Issues & Solutions:**

| Issue | Solution |
|-------|----------|
| Products not showing | Check product IDs match Play Console exactly |
| Entitlement not active | Verify entitlement ID = "GhostReply Pro" |
| Purchase fails silently | Enable verbose logging, check error codes |
| Restore not working | Verify correct Google account, wait 10 seconds |
| Multiple event firings | Add cleanup to useEffect dependencies |

See `REVENUECAT_INTEGRATION_GUIDE.md` for detailed troubleshooting.

## 📝 Files Reference

### New Files Created

```
lib/
  └─ revenueCat.ts                          (SDK wrapper + utilities)

context/
  └─ SubscriptionContextWithRevenueCat.tsx  (Updated state management)

app/
  └─ paywall-revenueCat.tsx                 (New paywall screen)

components/
  ├─ RevenueCatPaywall.tsx                  (Paywall component)
  └─ RevenueCatCustomerCenter.tsx           (Customer center component)

Documentation/
  └─ REVENUECAT_INTEGRATION_GUIDE.md        (This file)
  └─ REVENUECAT_QUICK_SETUP.md              (Quick reference)
```

### Modified Files

```
package.json  (Added react-native-purchases packages)
```

## 🎯 Success Criteria

✅ App initializes RevenueCat without errors
✅ Paywall displays correctly
✅ Test purchases complete successfully
✅ Premium users see unlimited access
✅ Free users see 2-daily limit
✅ Trial users see countdown timer
✅ Subscriptions sync across devices
✅ Customer can manage subscription
✅ Support team has documentation
✅ Analytics tracking revenue

## 📚 Additional Resources

- **RevenueCat Dashboard:** https://app.revenuecat.com
- **Docs:** https://www.revenuecat.com/docs
- **React Native SDK:** https://www.revenuecat.com/docs/getting-started/installation/reactnative
- **Google Play Billing:** https://developer.android.com/google/play/billing
- **Play Console Help:** https://support.google.com/googleplay/

---

**Last Updated:** March 20, 2026
**Status:** Ready for Implementation
**Next Step:** Initialize RevenueCat in `app/_layout.tsx`
