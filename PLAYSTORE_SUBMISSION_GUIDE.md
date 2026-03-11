# Google Play Store Submission Guide for Ghost Reply

## Prerequisites
- ✅ Google Play Developer Account ($25 one-time fee)
- ✅ Signing key for your app
- ✅ App Store Listing prepared
- ✅ Icons and screenshots ready

---

## Step 1: Generate Release Build (AAB)

### 1.1 Create signing credentials

If you haven't already created a keystore, run:

```bash
# Generate a keystore for signing your app
keytool -genkey -v -keystore ghostreply.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias ghostreply
```

**IMPORTANT:** Save this command output and keep the keystore file safe:
- Keystore password
- Key alias password
- Store the `ghostreply.keystore` file securely

### 1.2 Set up Expo credentials for building

```bash
# Configure Expo to use your signing key
eas secret create --scope project --name ANDROID_KEYSTORE --value @ghostreply.keystore
eas secret create --scope project --name ANDROID_KEYSTORE_PASSWORD --value <your_keystore_password>
eas secret create --scope project --name ANDROID_KEY_ALIAS --value ghostreply
eas secret create --scope project --name ANDROID_KEY_PASSWORD --value <your_key_password>
```

### 1.3 Build the AAB for Play Store

```bash
# Build using Expo Application Services (EAS)
eas build --platform android --type app-bundle
```

This will:
- Create an Android App Bundle (AAB) format
- Sign it with your credentials
- Upload to Play Store directly (optional)

**Output:** A signed `.aab` file ready for Play Store

---

## Step 2: Prepare Your Play Store Listing

### 2.1 Create App on Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create App**
3. Fill in:
   - **App name:** Ghost Reply
   - **Default language:** English
   - **App or game:** App
   - **Category:** Social / Communication
   - **Content rating:** Complete questionnaire
   - **Privacy policy:** Add your privacy policy URL

### 2.2 Complete App Details

**Branding:**
- App icon (512x512 PNG) ✓ Already have in assets
- Feature graphic (1024x500 PNG)
- Screenshots (up to 8, 1080x1920 for portrait)
- Promotional graphic (180x120 PNG)

**Descriptions:**
- **Short description:** (50 chars max)
  - "AI-powered reply generator for conversations"
  
- **Full description:** (4000 chars)
  - Explain features, 5 personality types, OCR screenshot upload, etc.

**Contact:**
- Developer email
- Privacy policy URL
- Support website (optional)

### 2.3 Content Rating

Go to **Content ratings** and complete the IARC form:
- Age 3+ (No harmful content)
- No financial transactions in-app (if free)
- No location data (unless needed)

### 2.4 Pricing & Distribution

- **Free or Paid:** Select Free or $X.XX
- **Countries:** Select where to distribute
- **Target Android version:** 
  - Minimum: API 24 (Android 7.0)
  - Target: API 34 (Android 14)

---

## Step 3: Upload AAB to Play Store

### 3.1 Upload your build

1. In Play Console, go to **Release → Production**
2. Click **Create new release**
3. Upload your signed `.aab` file
4. Add release notes (e.g., "Initial release")
5. Review all details
6. Click **Save and review to production**

### 3.2 Final review checklist

Before submitting:
- [ ] All app details complete
- [ ] Privacy policy provided
- [ ] Content rating complete
- [ ] 3+ screenshots uploaded
- [ ] Feature graphic uploaded
- [ ] Release notes added
- [ ] versionCode incremented (app.json)
- [ ] All required permissions justified

### 3.3 Submit for review

Click **Start rollout to Production**

**Review time:** Usually 2-3 hours, can take up to 24 hours

---

## Step 4: Versioning & Future Updates

### When updating versionCode:

```json
// app.json
"android": {
  "versionCode": 2,  // Increment this for each Play Store update
  ...
}
```

### For subsequent releases:

1. Increment `versionCode` in app.json (version for Android)
2. Optionally update `version` (semantic version like 1.0.1)
3. Rebuild: `eas build --platform android --type app-bundle`
4. Upload new AAB: **Release → Production → Create new release**

---

## Troubleshooting

### "Build failed" error
- Check all permissions in app.json
- Ensure minimum SDK version is 24+
- Verify your signing credentials

### "App not signed properly"
- Regenerate keystore using keytool
- Update EAS secrets with new credentials
- Rebuild from scratch

### "Violates policy"
- Ensure all features work as described
- Remove any misleading claims from description
- Check permissions align with actual usage

### "Content not appropriate"
- Review content rating answers
- Ensure app doesn't collect sensitive data
- Add privacy policy if collecting user data

---

## Important Notes

⚠️ **Keep your signing key safe:**
- Don't commit `ghostreply.keystore` to version control
- Add to `.gitignore`
- Back it up securely
- You need the SAME key for all future updates

✅ **After first release:**
- Monitor crash reports in Play Console
- Check user reviews
- Fix bugs and resubmit
- Increment versionCode for each update

📊 **Track performance:**
- Play Console dashboard shows:
  - Downloads
  - Rankings
  - Crashes
  - User reviews
  - Install sources

---

## Next Steps

1. **Now:** Create your app listing in Google Play Console
2. **Generate signing credentials** using keytool above
3. **Build via EAS:** `eas build --platform android --type app-bundle`
4. **Upload AAB** to your production release
5. **Submit for review** and wait 2-24 hours
6. **Monitor** your app performance

Good luck! 🚀
