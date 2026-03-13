# RevenueCat Setup Guide for GhostReply

Complete guide to configure subscriptions and link RevenueCat with Google Play Console.

---

## App Configuration

| Field | Value |
|-------|-------|
| **App Name** | GhostReply |
| **Package Name** | com.ghostreply |
| **App Version** | 1.0.0 |
| **Version Code** | 3 |
| **Min SDK** | As per Expo SDK 54 requirements |
| **Platform** | Android (with iOS support planned) |

---

## Subscription Plans & Pricing

### Plan 1: Free (No subscription needed)

| Feature | Details |
|---------|---------|
| **Name** | Free |
| **Price** | Free |
| **Daily Limit** | 2 analyses per day |
| **Trial** | No |
| **Renewal** | N/A |

**Use Case:** Users start on free plan with limited daily usage

---

### Plan 2: Free Trial

| Feature | Details |
|---------|---------|
| **Name** | Free Trial |
| **Duration** | 3 days |
| **Price** | Free |
| **Daily Limit** | Unlimited |
| **Max Trials** | 1 per user |
| **Renewal** | Does NOT auto-renew to paid |
| **Expiration Handling** | Triggers conversion flow after expiration |

**Use Case:** Users get 3 days to test premium features for free

---

### Plan 3: Premium (Main Monetization)

| Feature | Details |
|---------|---------|
| **Name** | Premium |
| **Billing Cycle** | Monthly OR Annual (offer both) |
| **Daily Limit** | Unlimited |
| **Auto-Renewal** | Yes |
| **Cancellation** | User can cancel anytime |

#### Recommended Pricing

**Monthly Subscription:**
- **Price:** $4.99/month
- **Description:** "Unlimited replies, ad-free experience"
- **Billing Cycle:** 30 days

**Annual Subscription (Optional - for retention):**
- **Price:** $39.99/year
- **Description:** "Unlimited replies, 33% savings"
- **Billing Cycle:** 365 days

---

## Step 1: Set Up RevenueCat

### 1.1 Create RevenueCat Account

1. Go to https://www.revenuecat.com/
2. Sign up and create organization
3. Create a new app called "GhostReply"
4. Select "Android" as the platform

### 1.2 Generate RevenueCat API Keys

1. In RevenueCat dashboard, go to **Settings → API Keys**
2. Copy your:
   - **Public SDK Key** (for client-side)
   - **Secondary API Key** (for server-side, if needed)

### 1.3 Configure Products in RevenueCat

Go to **Products** and create 3 products:

#### Product 1: Monthly Premium

| Field | Value |
|-------|-------|
| **Product ID** | `com.ghostreply.premium.monthly` |
| **Type** | Renewable Subscription |
| **Platform** | Google Play |
| **Display Name** | Premium Monthly |
| **Description** | Unlimited replies, no ads |

#### Product 2: Annual Premium

| Field | Value |
|-------|-------|
| **Product ID** | `com.ghostreply.premium.annual` |
| **Type** | Renewable Subscription |
| **Platform** | Google Play |
| **Display Name** | Premium Annual |
| **Description** | Unlimited replies, no ads, best value |

#### Product 3: Free Trial

| Field | Value |
|-------|-------|
| **Product ID** | `com.ghostreply.freetrial` |
| **Type** | Free Trial (linked to monthly) |
| **Platform** | Google Play |
| **Display Name** | Free Trial - 3 Days |
| **Description** | 3-day free access to premium features |
| **Trial Duration** | 3 days |
| **Converts To** | `com.ghostreply.premium.monthly` |

---

## Step 2: Google Play Console Setup

### 2.1 Create In-App Products

1. Open **Google Play Console** → Select **GhostReply** app
2. Go to **Monetize → In-app products → Subscriptions**

### 2.2 Create Monthly Subscription

Click **Create product:**

| Field | Value |
|-------|-------|
| **Product ID** | `com.ghostreply.premium.monthly` |
| **Product name** | Premium Monthly |
| **Title** | Premium Monthly |
| **Description** | Unlimited analyses, no daily limits, priority support |
| **Price** | $4.99 (set for your region) |
| **Billing period** | Monthly (30 days) |
| **Auto-renewal** | Enabled |
| **Grace period** | 3 days (optional) |
| **Account hold period** | 3 days (optional) |

**Status:** Set to **Active**

### 2.3 Create Annual Subscription

Click **Create product:**

| Field | Value |
|-------|-------|
| **Product ID** | `com.ghostreply.premium.annual` |
| **Product name** | Premium Annual |
| **Title** | Premium Annual |
| **Description** | Unlimited analyses, no daily limits, save 33% |
| **Price** | $39.99 (set for your region) |
| **Billing period** | Yearly (365 days) |
| **Auto-renewal** | Enabled |
| **Grace period** | 3 days (optional) |
| **Account hold period** | 3 days (optional) |

**Status:** Set to **Active**

### 2.4 Create Free Trial Product

Click **Create product:**

| Field | Value |
|-------|-------|
| **Product ID** | `com.ghostreply.freetrial` |
| **Product name** | Free Trial - 3 Days |
| **Title** | 3-Day Free Trial |
| **Description** | Try premium features free for 3 days |
| **Price** | Free $0.00 |
| **Trial period** | 3 days |
| **Conversion** | Converts to `com.ghostreply.premium.monthly` at $4.99 |
| **Auto-renewal** | Enabled (into monthly plan) |

**Status:** Set to **Active**

---

## Step 3: Link RevenueCat to Google Play

### 3.1 Create Service Account in Google Play Console

1. Go to **Google Play Console → Settings → API and services**
2. Click **Create new service account**
3. A window opens with link to Google Cloud Console
4. In Google Cloud Console:
   - Go to **Service Accounts**
   - Create new service account named `revenuecat`
   - Grant roles: **Editor** (for testing) or **Service Account Editor**
   - Create new key (JSON format)
   - Download the JSON file

### 3.2 Add Service Account to Play Console

Back in Google Play Console:
1. Click the link to add service account to Play Console
2. Find your service account email
3. Grant **Financial Reporting, Payout Management, Order Management** permissions

### 3.3 Connect RevenueCat to Google Play

In **RevenueCat Dashboard:**
1. Go to **Settings → App Settings**
2. Select "Android" platform
3. Paste the **Google Service Account JSON** key
4. RevenueCat will validate the connection ✅

---

## Step 4: Configure RevenueCat Entitlements

Entitlements are logical groups of features users get when they buy a product.

### 4.1 Create Entitlement

In RevenueCat, go to **Entitlements** and create:

| Field | Value |
|-------|-------|
| **Identifier** | `premium` |
| **Display Name** | Premium Features |

### 4.2 Link Products to Entitlements

Map products to the premium entitlement:
- `com.ghostreply.premium.monthly` → `premium`
- `com.ghostreply.premium.annual` → `premium`
- `com.ghostreply.freetrial` → `premium`

**Result:** Users on ANY of these products get `premium` access

---

## Step 5: Frontend Integration

### 5.1 Install RevenueCat SDK

```bash
npm install react-native-purchases
```

### 5.2 Initialize RevenueCat in App

In `app/_layout.tsx`:

```tsx
import Purchases from 'react-native-purchases';

export default function RootLayout() {
  useEffect(() => {
    const setupRevenueCat = async () => {
      // Set API key
      await Purchases.configure({
        apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
        appUserID: user?.id, // Your user ID
      });
    };

    setupRevenueCat();
  }, []);

  return (
    // Layout code
  );
}
```

### 5.3 Display Paywall

Create a paywall component:

```tsx
import Purchases, { PurchasesEntitlementInfos } from 'react-native-purchases';

export function Paywall() {
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    const fetchPackages = async () => {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setPackages(offerings.current.monthly?.availablePackages || []);
      }
    };

    fetchPackages();
  }, []);

  const handlePurchase = async (package: any) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(package);
      
      // Check entitlements
      if (customerInfo.entitlements.active['premium']) {
        console.log('Purchase successful!');
        // Update app state
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  return (
    <View>
      {packages.map((pkg) => (
        <Button
          key={pkg.identifier}
          title={`Subscribe - ${pkg.product.priceString}`}
          onPress={() => handlePurchase(pkg)}
        />
      ))}
    </View>
  );
}
```

---

## Step 6: Backend Integration (RevenueCat Webhooks)

### 6.1 Configure Webhook in RevenueCat

1. Go to **RevenueCat → Settings → Webhooks**
2. Add your backend URL: `https://yourapi.com/api/webhooks/revenuecat`
3. Select events:
   - `INITIAL_PURCHASE`
   - `RENEWAL`
   - `SUBSCRIPTION_PAUSED`
   - `SUBSCRIPTION_CANCELLED`
   - `BILLING_ISSUE`

### 6.2 Handle Webhook in Backend

In `server/routes.ts`:

```typescript
app.post("/api/webhooks/revenuecat", async (req: Request, res: Response) => {
  try {
    const { event, data } = req.body;

    console.log("RevenueCat webhook:", event);

    // Verify signature (RevenueCat provides the secret)
    // const isValid = verifyRevenueCatSignature(req);
    // if (!isValid) return res.status(401).send("Invalid signature");

    switch (event) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
        // Update user subscription in database
        await db
          .update(userSubscriptions)
          .set({
            isSubscribed: true,
            subscriptionProvider: "revenuecat",
            subscriptionId: data.subscription_id,
            plan: data.product_id.includes("annual") ? "yearly" : "monthly",
            subscriptionExpiresAt: new Date(data.expiration_date),
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.userId, data.app_user_id));
        break;

      case "SUBSCRIPTION_CANCELLED":
        await db
          .update(userSubscriptions)
          .set({
            isSubscribed: false,
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.userId, data.app_user_id));
        break;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});
```

---

## Step 7: Testing

### 7.1 Test on Physical Device

1. Install the APK on an Android device
2. Use a real Google Play account
3. Test purchasing flow
4. Verify entitlements are updated

### 7.2 RevenueCat Sandbox Mode

For testing without charges:
1. Add test Google Play accounts in Play Console
2. Use those accounts in RevenueCat sandbox/test mode
3. Purchases won't charge real money

---

## Environment Variables

Add to your `.env.local`:

```env
EXPO_PUBLIC_REVENUECAT_API_KEY=pk_test_xxxxxxxxxxxxx
REVENUECAT_SECRET=sk_test_xxxxxxxxxxxxx
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

---

## Pricing Strategy Notes

**Why this pricing?**
- **$4.99/month** - Competitive with similar apps, allows for discounting
- **$39.99/year** - 33% savings incentivizes annual commitment
- **3-day trial** - Long enough to experience value, short enough to convert

**Conversion Optimization:**
1. Show paywall after 2 free analyses
2. Highlight daily limit on free plan
3. Emphasize "unlimited" in trial copy
4. Show countdown timer in trial (2 days remaining)

---

## Checklist Before Launch

- [ ] All 3 products created in Google Play Console
- [ ] All 3 products created in RevenueCat
- [ ] Entitlements linked correctly
- [ ] Service account connected to RevenueCat
- [ ] Webhook URL configured
- [ ] RevenueCat SDK initialized in app
- [ ] Paywall UI implemented
- [ ] Backend webhook handler implemented
- [ ] Test purchase on internal tester account
- [ ] Verify entitlements update in app
- [ ] Verify subscription state persists
- [ ] Revenue reports showing in Play Console
- [ ] All analytics events firing correctly

---

## Support Resources

- **RevenueCat Docs:** https://docs.revenuecat.com/
- **Google Play Console Help:** https://support.google.com/googleplay/android-developer
- **React Native Purchases:** https://react-native-purchases-docs.web.app/
- **RevenueCat Community:** https://community.revenuecat.com/

---

## Common Issues & Solutions

### Issue: "Invalid signature" on webhook
**Solution:** Make sure you're verifying the signature using RevenueCat's provided secret key.

### Issue: Trial converting to wrong plan
**Solution:** Double-check the "converts to" field in RevenueCat or Play Console matches exactly.

### Issue: Entitlements not updating
**Solution:** Ensure the `app_user_id` in RevenueCat matches your database `userId`.

### Issue: Product showing as "Not available"
**Solution:** 
- Product must be "Active" in Play Console
- Service account must have proper permissions
- Wait 24 hours for sync

---

Last Updated: March 13, 2026
