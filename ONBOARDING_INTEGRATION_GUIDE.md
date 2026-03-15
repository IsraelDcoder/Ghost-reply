# GhostReply Onboarding Flow Integration Guide

## New High-Converting Onboarding Structure

```
App Entry Point (index.tsx or _layout.tsx)
  ↓
Check if user has onboarded
  ↓
NO → /demo-video (NEW - High-Converting Demo)
  ↓
→ /onboarding (Features & Benefits)
  ↓
→ /paywall (Subscribe)
  ↓
YES → /home (Main App)
```

## Files Created/Modified

### New Screens Created:
1. **`app/demo-video.tsx`** - Video demo with narrative structure
2. **`app/gender-selection.tsx`** - Optional personaliz ation
3. **`DEMO_VIDEO_GUIDE.md`** - Video creation instructions

### Existing Screens (Unchanged):
- `app/onboarding.tsx` - Feature slides (already exists)
- `app/paywall.tsx` - Subscription prompt (already exists)

## Step-by-Step Integration

### Step 1: Identify Your App Entry Point

Look for the main routing logic, typically in:
- `app/_layout.tsx`
- `app/index.tsx`
- Or wherever you check `hasOnboarded` flag

### Step 2: Update Navigation Logic

**Current logic (example):**
```typescript
if (!hasOnboarded) {
  return <Redirect href="/onboarding" />;
}
```

**New logic (update to):**
```typescript
if (!hasOnboarded) {
  return <Redirect href="/demo-video" />;
}
```

### Step 3: Create Video Asset Directory

```bash
# From your Ghost-Reply project root
mkdir -p assets/onboarding
```

### Step 4: Add Demo Video

1. Create video using guide in `DEMO_VIDEO_GUIDE.md`
2. Export as MP4: `demo-video.mp4`
3. Place in: `assets/onboarding/demo-video.mp4`

### Step 5: Test Navigation Chain

```
1. Clear app state/reset user
2. Launch app
3. Should see: /demo-video (NEW)
4. Video auto-plays
5. Click Continue → /onboarding
6. Swipe through features
7. Click Continue → /paywall
8. Subscribe or skip → /home
```

## Optional: Add Gender/Preferences Screen

If you want to collect user data during onboarding:

### Before Paywall (Recommended):
```
/demo-video
  ↓
/onboarding
  ↓
/gender-selection (NEW OPTIONAL)
  ↓
/interests-selection (optional follow-up)
  ↓
/paywall
```

**Code example:**
```typescript
// In app/onboarding.tsx
const goNext = async () => {
  if (currentIndex < SLIDES.length - 1) {
    flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
  } else {
    router.replace("/gender-selection"); // NEW
  }
};

// In app/gender-selection.tsx
const handleContinue = async () => {
  if (selectedGender) {
    // Save gender to context/storage
    router.push("/paywall"); // Continue to paywall
  }
};
```

## Key Benefits of This Flow

✅ **Demo Video First:**
- Immediate visual proof that app works
- Narrative hook: Problem → Solution → Success
- Higher conversion without walls

✅ **Feature Slides After:**
- User already believes in solution
- Slides explain detailed features
- More likely to read/engage

✅ **Paywall at End:**
- User has seen full value proposition
- Higher willingness to pay
- Lower abandon rate before paywall

## Conversion Optimization Tips

### Video Metrics to Track:
```typescript
// Add analytics to demo-video.tsx
const trackVideoEvent = (event: string, timestamp: number) => {
  // Track:
  // - videoStarted
  // - video50ProcentWatched
  // - videoCompleted
  // - userSkipped
  // - userContinued
};
```

### Monitor:
1. **Video completion rate** - Target: >60%
2. **Skip rate** - Target: <20%
3. **Continue rate** - Target: >70%
4. **Time to paywall** - Should be <2 minutes
5. **Paywall conversion** - Track A/B vs old flow

## Customization Options

### Adjust Video Timing:
```typescript
// In demo-video.tsx, change autoplay behavior:
const shouldAutoLoop = !hasWatched; // Current: loops until 50% watched

// Alternative options:
const shouldAutoLoop = false; // Never auto-loop
const shouldAutoLoop = hasWatched; // Always loop
```

### Adjust Button Behavior:
```typescript
// Right now: Continue goes to /onboarding
// Options:
router.push("/onboarding"); // Full onboarding
router.push("/paywall"); // Skip to paywall
router.push("/gender-selection"); // Personalization first
```

### Customize Headlines:
```typescript
// In demo-video.tsx
const headline = "Never struggle with replies again.";
const subheading = "AI that writes the perfect reply.";

// Change to your messaging
```

## Testing the Video

### Local Testing:
```bash
# Make sure video file exists
ls assets/onboarding/demo-video.mp4

# Run app
expo start

# Navigate to /demo-video
# Verify:
# ✓ Video auto-plays
# ✓ Progress bar works
# ✓ Skip button functional
# ✓ Continue button navigates properly
```

### Video Troubleshooting:
If video doesn't play:
1. Check file location: `assets/onboarding/demo-video.mp4`
2. Verify file format: MP4, H.264 codec
3. Check file size: <50MB recommended
4. Try rebuilding: `expo prebuild --clean`

## Analytics Events to Add

```typescript
// In demo-video.tsx
const trackEvent = (action: string) => {
  // Events to track:
  // onboarding_demo_started
  // onboarding_demo_watched_25_percent
  // onboarding_demo_watched_50_percent
  // onboarding_demo_watched_75_percent
  // onboarding_demo_completed
  // onboarding_demo_skipped
  // onboarding_demo_continued
};
```

## Next Steps

1. ✅ Extract/run the new screens
2. ⏳ Create demo video (~2-4 hours)
3. ⏳ Place video in correct directory
4. ⏳ Update app entry point to route to `/demo-video`
5. ⏳ Test full onboarding flow
6. ⏳ Monitor conversion metrics
7. ⏳ Iterate based on user feedback

## A/B Testing Ideas

### Experiments:
1. **Video vs. Static Slides**: Test which converts better
2. **Video Length**: 20s vs. 35s vs. 60s?
3. **Skip Button Position**: Top right vs. bottom left
4. **CTA Text**: "Continue" vs. "See Features" vs. "Let's Go"
5. **Paywall Timing**: Before features vs. after features vs. after gender selection

---

## Support

For questions or issues:

1. Check `DEMO_VIDEO_GUIDE.md` for video creation help
2. Review React Native Expo video docs: https://docs.expo.dev/versions/latest/sdk/video/
3. Test locally before deploying to production

Good luck! 🚀
