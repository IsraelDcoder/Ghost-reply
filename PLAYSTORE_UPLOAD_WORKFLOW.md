# GhostReply - Play Store Upload Guide

## ✅ Completed Steps

1. **Logged in with new Expo account**: `onyekha`
2. **Updated app.json**: Owner changed to `onyekha`
3. **Generated Android keystore**: `ghostreply-release-key.keystore` (keep this safe!)
4. **EAS build configured**: Ready for production builds

---

## 📦 Next Steps: Build APK for Play Store

### Option A: Build with EAS (Recommended - Expo handles signing)

```bash
# Build production APK
eas build --platform android --type app-signing

# Or build App Bundle (recommended for Play Store)
eas build --platform android --type app-bundle
```

**What this does**:
- Uploads your code to Expo servers
- Builds the APK/AAB with your keystore credentials
- Stores signing key securely
- Downloads signed APK/AAB when complete

### Option B: Build Locally

```bash
# If you prefer to build on your machine
eas build --platform android --local
```

---

## 🏪 Upload to Google Play Store

### 1. Prepare Play Store Console
- Go to: https://play.google.com/console
- Select GhostReply app
- Navigate to: **Release → Production**
- Click **Create new release**

### 2. Upload APK/AAB
- Click **Browse files** or drag-and-drop
- Select the APK or AAB from EAS build
- Fill in release notes:
  ```
  • Added push notifications for engagement
  • Integrated subscription lifecycle notifications
  • Daily notification automation
  • Fixed Sentry production logging
  • Performance optimizations
  ```

### 3. Review Release Details
- **Version code**: `9` (from app.json)
- **Version name**: `1.0.0` (from app.json)
- **Rollout**: Start with 5-10% for testing
- **Targeting**: Android 6.0+ (from app.json permissions)

### 4. Submit for Review
- Review compliance settings
- Click **Review**
- Click **Confirm rollout**
- **Submit release** to Play Store

---

## 🔐 Important - Keystore Security

**Your keystore file**: `ghostreply-release-key.keystore`

⚠️ **BACKUP THIS FILE** - You need it for future updates:
```bash
# Copy to safe location
cp ghostreply-release-key.keystore ~/backup/
```

**Store password securely** - Save it in a password manager

---

## 📊 Expected Timeline

1. **Build time**: 5-15 minutes (depends on queue)
2. **Review time**: 24-48 hours (Google Play review)
3. **Release**: Usually available within 2-3 hours after approval

---

## 🐛 Troubleshooting

### Build fails with "Gradle error"
- Run: `npm install`
- Run: `eas build --platform android --local`
- Check build logs in EAS dashboard

### Upload rejected by Play Store
- Check app store listing is complete
- Verify app permissions in AndroidManifest
- Ensure screenshots and description are filled
- Check age rating questionnaire

### Version code mismatch
- Update `versionCode` in app.json
- Increment by 1 for each new release
- Never reuse same version code

---

## 📝 Checklist Before Upload

- [ ] Keystore generated successfully
- [ ] app.json updated with new owner (`onyekha`)
- [ ] Build completed from EAS
- [ ] APK/AAB downloaded locally
- [ ] App Store listing complete (title, description, screenshots)
- [ ] Content rating filled (Google Play standards)
- [ ] Version code incremented
- [ ] Release notes written
- [ ] Pricing & distribution configured

---

## 🎯 Command Summary

```bash
# 1. Build APK (recommended for testing first)
eas build --platform android --type apk

# 2. Build App Bundle (recommended for Play Store distribution)
eas build --platform android --type app-bundle

# 3. Check build status
eas build:list

# 4. Download specific build
eas build:download <build-id>
```

---

**Status**: ✅ Ready to build and upload

See your Play Store console at: https://play.google.com/console/u/0/developers
