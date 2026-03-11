# Ghost Reply - Google Play Store Upload Guide

Complete step-by-step guide to submit your app to the Play Store.

---

## ✅ Pre-Submission Checklist

Before you start, verify:

- ✅ Backend is live: `https://ghost-reply.onrender.com`
- ✅ App configured to use live backend
- ✅ Version 1.0.0 in `app.json`
- ✅ All screenshots and graphics ready
- ✅ Privacy policy written
- ✅ Google Play Developer Account created ($25 fee)

---

## 📱 Step 1: Build the AAB for Play Store

```bash
cd c:\Ghost-Reply

# Build signed AAB (Android App Bundle)
eas build --platform android --wait
```

This will:
- Compile your app
- Sign with your certificate
- Generate `.aab` file (~19-20MB)
- Upload to EAS cloud

**Wait time:** 5-10 minutes

When done, you'll see:
```
✓ Build finished!
Build URL: https://...build-id...
```

---

## 🎮 Step 2: Prepare Play Store Listing

### Go to Google Play Console

1. Visit [play.google.com/console](https://play.google.com/console)
2. Click **Create app** (if you haven't already)
3. Fill in:
   - **App name:** Ghost Reply
   - **Default language:** English  
   - **App or game:** App
   - **Type:** Recommended for families ✓

---

## 📝 Step 3: Fill App Details

In Play Console, go to **App details** → fill in:

### App Branding

**Icon (512×512 PNG)**
- Your app icon (already in assets/images/icon.png)

**Feature Graphic (1024×500 PNG)**
- Create a banner showing your app's main feature
- Example: "Get AI Reply Suggestions for Any Chat"

**Screenshots (1080×1920 PNG, portrait)**
Create 3-5 screenshots showing:
1. Main screen with "Upload Screenshot" button
2. Results showing 5 personality replies
3. Pickup lines suggestion
4. Settings/preferences

**Short Description (50 chars max)**
```
AI-powered conversation reply generator
```

**Full Description (4000 chars)**
```
Ghost Reply generates creative replies for any conversation.

Features:
• 5 Personality Types: Confident, Flirty, Funny, Savage, Smart
• Screenshot OCR: Extract text from chat images
• Paste & Analyze: Paste any conversation text
• Conversation Scoring: Get insights on engagement
• Unlimited Replies: Pro subscription available

Perfect for:
- Dating apps (Tinder, Bumble, Hinge)
- Text messaging
- Social media comments
- Any conversation needing a witty reply

How it works:
1. Upload a screenshot or paste a conversation
2. Our AI analyzes the tone and context
3. Get 5 different reply options
4. Choose your favorite or regenerate

Free tier: 2 replies/day
Pro: Unlimited replies

Privacy first - we don't store your conversations.

Support: support@ghostreply.app
```

---

## 🔞 Step 4: Content Rating

1. Go to **Content ratings** 
2. Click **Set content rating**
3. Complete the IARC questionnaire:
   - Violence: None ✓
   - Sexual content: None ✓  
   - Profanity: None ✓
   - Alcohol/Drugs: None ✓
   - All others: No ✓
4. Click **Save**

---

## 🌍 Step 5: Pricing & Distribution

1. Go to **Pricing & distribution**
2. **Price:** Free (for now, you can add Pro subscription later)
3. **Target countries:** Select all or your preferred regions
4. **APIs & services:** 
   - Target Android: 14+
   - Minimum Android: 7.0 (API 24)

---

## 🔐 Step 6: Add Privacy Policy

1. Go to **App details → Privacy policy**
2. Enter your privacy policy URL
3. Make sure it covers:
   - Data collection (minimal - just device ID)
   - How it's used (analytics)
   - No personal data storage

**Simple template:**
```
Privacy Policy for Ghost Reply

We collect:
- Anonymous device ID (for analytics)
- Your conversations (only to generate replies, never stored)

We don't sell your data.
Contact: support@ghostreply.app
```

---

## 📦 Step 7: Upload Your AAB

1. Go to **Release → Production**
2. Click **Create new release**
3. Click **Browse files** under Android App Bundle
4. Select your `.aab` file from EAS:
   - You can download it from the build URL
   - Or use `eas build:download [BUILD_ID]`

5. Add **Release notes:**
   ```
   Initial release - Ghost Reply v1.0.0
   
   Features:
   • AI-powered reply generation
   • 5 personality types
   • Screenshot OCR analysis
   • Conversation scoring
   ```

6. Review all details
7. Click **Save and review to production**

---

## ✅ Step 8: Final Review

Before submitting, verify:

**Listing completeness:**
- ✅ App name and icon
- ✅ 3+ screenshots
- ✅ Full description
- ✅ Privacy policy
- ✅ Contact email
- ✅ Content rating

**Technical:**
- ✅ AAB file uploaded
- ✅ Version code incremented (1)
- ✅ Release notes added

**Permissions:**
- ✅ Camera (for OCR)
- ✅ Photo library access
- ✅ Internet

---

## 🚀 Step 9: Submit for Review

1. After reviewing, click **Start rollout to production**
2. Confirm you want to submit
3. App will be queued for review

**Review typically takes:** 2-24 hours

You'll get an email when:
- ✅ App approved → Goes live on Play Store
- ❌ App rejected → Fix issues and resubmit

---

## 📊 After Approval

Once approved, your app will be available at:
```
https://play.google.com/store/apps/details?id=com.ghostreply
```

### Monitor Your App:

1. **Ratings & Reviews** - Address user feedback
2. **Crashes & ANRs** - Fix reported bugs  
3. **Install trends** - Track downloads
4. **Revenue** - Monitor any purchases (once payments set up)

---

## 💰 Step 10: Set Up RevenueCat (After App Goes Live)

Once your app is approved and live on Play Store, you can enable subscriptions:

1. **In Google Play Console:**
   - Go to **Monetization setup**
   - Create subscription product for "Pro"
   - Set price ($9.99/month or yearly option)

2. **In RevenueCat:**
   - Create account at revenucat.com
   - Add your Play Store credentials
   - Configure "Pro" subscription
   - Get API key

3. **In your app code:**
   - Add RevenueCat SDK
   - Check subscription status
   - Show paywall to free users

---

## 🆘 Common Issues

### "App not signed properly"
- Ensure you used correct signing certificate
- Rebuild with: `eas build --platform android --wait`

### "Violates family policy"
- Ensure content rating is correct
- Your app doesn't violate Play Store policies

### "Screenshots don't meet size requirements"
- Use exactly 1080×1920 PNG
- Portrait orientation only
- No watermarks

### "Release notes too long"
- Keep to 500 chars max
- Focus on what's new this version

---

## 📝 Your Play Store Info (Copy)

```
Package Name: com.ghostreply
App Name: Ghost Reply
Version: 1.0.0
Build: AAB format
Signed: Yes ✓

Description:
AI-powered conversation reply generator. Get 5 different 
reply personalities for any chat - Confident, Flirty, 
Funny, Savage, or Smart.

Features:
- 5 personality types for replies
- Upload screenshot or paste text
- AI conversation analysis
- Free tier (2 replies/day) + Pro (unlimited)
- Privacy-first design

Support: support@ghostreply.app
```

---

## ✨ Success!

Once your app is live on Play Store:

1. ✅ Share your Play Store link
2. ✅ Marketing & promotion
3. ✅ Collect user reviews
4. ✅ Fix bugs & update regularly
5. ✅ Set up RevenueCat for Pro subscription
6. ✅ Monitor analytics

**Your Ghost Reply app is now globally available!** 🎉

---

## 📚 Resources

- Play Store Console: https://play.google.com/console
- App signing: https://developer.android.com/studio/publish/app-signing
- ReviewGuidelines: https://play.google.com/about/developer-content-policy/
- RevenueCat: https://www.revenuecat.com
