# GhostReply Demo Video Onboarding - Video Creation Guide

## Overview
This guide explains how to create the 30-40 second demo video for the `DemoVideoScreen.tsx` component.

## Video Requirements

- **Duration**: 30-40 seconds
- **Format**: MP4 (H.264 video codec, AAC audio)
- **Resolution**: 1080x1920 (9:16 aspect ratio - mobile vertical)
- **Frame Rate**: 30fps
- **Location**: `/assets/onboarding/demo-video.mp4`

## Scene Breakdown (Narrative Structure)

### Scene 1: Problem (0-4 seconds)
**Visual**: Dark background, large bold text
**Text**: "Ever stared at a message and didn't know what to reply?"
**Effect**: Text fade-in

### Scene 2: Social Pressure (4-8 seconds)
**Visual**: iPhone-style chat UI mockup
**Message**: 
```
Her:
"So are you just going to ignore me now?"
```
**Effect**: Message slides in, looks tense/anxious

### Scene 3: Anxiety (8-11 seconds)
**Visual**: Red/orange overlay on previous chat
**Text**: "One wrong reply can ruin everything."
**Effect**: Pulsing red glow, dramatic music spike

### Scene 4: Solution Introduction (11-15 seconds)
**Visual**: Transition to GhostReply branding
**Text**: "Meet GhostReply."
**Effect**: Logo animation, name appears

### Scene 5: AI in Action (15-23 seconds)
**Visual**: 
1. User taps upload button
2. Screenshot appears
3. Loading animation: "Analyzing conversation..."
4. 5 reply options appear one-by-one:
   - "Relax, I was just thinking of the perfect reply."
   - "I was waiting to make you miss me first 😌"
   - [3 more creative replies]

**Effect**: Smooth animations, success sound

### Scene 6: Success (23-29 seconds)
**Visual**: Back to original chat
**Message**: "Okay that was smooth 😂"
**Effect**: Green/success highlight, satisfaction audio cue

### Scene 7: Identity Hook (29-34 seconds)
**Visual**: Full screen, centered text
**Text**: "Never struggle with replies again."
**Effect**: Fade-in

### Scene 8: Final Call-to-Action (34-40 seconds)
**Visual**: Branding + tagline
**Text**: "GhostReply - AI that writes the perfect reply."
**Effect**: Fade to black, music crescendo

---

## Tools to Create This Video

### Option 1: Adobe Premiere Pro / Final Cut Pro (Professional)
- Create vertical timeline (1080x1920)
- Import UI mockups/screenshots
- Add text overlays with animation
- Export as MP4

### Option 2: DaVinci Resolve (Free, Professional-grade)
1. **Download**: https://www.blackmagicdesign.com/products/davinciresolve/
2. **Create Project**: 
   - Set resolution: 1080x1920
   - Frame rate: 30fps
   - 16:9 mobile vertical
3. **Edit Timeline**: Add clips, text, effects
4. **Export**: 
   - Format: MP4
   - Codec: H.264
   - Quality: High

### Option 3: Figma + Loom (Quick & Easy)
1. Create mobile UI mockups in Figma
2. Screen record your Figma interactions
3. Edit in Loom
4. Export as MP4

### Option 4: Design + Video Generator (AI-Assisted)
Services like:
- **Synthesia**: AI video generation
- **Runway**: AI video editing
- **Descript**: Auto-generated video from script

---

## UI Mockups Needed

Create these as Figma/design files or screenshots:

1. **Chat Screen Mock**
```
┌─────────────────────┐
│ Messages            │
├─────────────────────┤
│ You: [trying text]  │
│ Her: So are you...? │
│                     │
│ You: [uploading]    │
└─────────────────────┘
```

2. **GhostReply Interface**
```
┌─────────────────────┐
│ GhostReply          │
├─────────────────────┤
│ Upload Screenshot   │
├─────────────────────┤
│ ✓ Option 1: Relax.. │
│ ✓ Option 2: I was.. │
│ ✓ Option 3: ...     │
│ ✓ Option 4: ...     │
│ ✓ Option 5: ...     │
└─────────────────────┘
```

3. **Branding Screen**
```
GhostReply

AI that writes the perfect reply.
```

---

## Quick Production Steps

### Using DaVinci Resolve:
1. **Create new project** → 1080x1920 @ 30fps
2. **Add media**:
   - Background color (dark #0B0B1A)
   - Screenshot of chat UI
   - GhostReply logo
   - Text/title graphics
3. **Add text overlays** with fade-in animations
4. **Add transitions** between scenes
5. **Color correction**: Ensure consistency
6. **Audio**: Add subtle background music/SFX
7. **Export**: MP4, H.264, High bitrate

### Tips:
- **Make it smooth**: Use 0.5-1 second transitions
- **Bold text**: Use large, readable fonts
- **Emotional pacing**: Speed up during anxiety, slow down during success
- **Music**: Get royalty-free from Epidemic Sound or Artlist
- **Sound effects**: Success sounds from Freesound.org

---

## Audio/Music Suggestions

- **Background**: Uplifting, modern electronic (Epidemic Sound)
- **Tension moment**: Minor key, slightly darker
- **Success moment**: Major key resolution, satisfying chord
- **Throughout**: Subtle, not distracting

Royalty-free sources:
- Epidemic Sound
- Artlist
- Freesound.org
- YouTube Audio Library

---

## File Management

```
Ghost-Reply/
└── assets/
    └── onboarding/
        └── demo-video.mp4  ← Place video here
```

### Create the directory if it doesn't exist:
```bash
mkdir -p assets/onboarding
# Then move your MP4 file here
```

---

## Video Encoding Settings (Export/Render)

**Format**: MP4
**Video Codec**: H.264 (AVC)
**Audio Codec**: AAC
**Resolution**: 1080x1920
**Frame Rate**: 30fps
**Bitrate**: 8-10 Mbps (good balance of quality/size)
**Duration**: 30-40 seconds

---

## Testing in App

Once video is placed in `assets/onboarding/`:

```bash
# Rebuild the app
expo prebuild --clean
eas build --platform android --profile preview
```

The video will autoplay on DemoVideoScreen.tsx with:
- Progress bar at bottom
- Skip button (top right)
- Auto-loop until user watches 50%
- Smooth Continue button transition

---

## Next Steps

1. **Choose creation tool** (DaVinci Resolve recommended for quality)
2. **Build UI mockups** (Figma/screenshot based)
3. **Edit video** with narrative structure above
4. **Add music + SFX** for emotion
5. **Export as MP4** at 1080x1920
6. **Place in** `assets/onboarding/demo-video.mp4`
7. **Test in app**
8. **Iterate** based on user feedback

---

## Pro Tips for High-Converting Video

✅ **DO:**
- Keep pacing: Slow problem intro, medium solution, fast success
- Use real-looking chat UI (not cartoon)
- Show actual AI responses (make them impressive)
- Add authentic emotion (anxiety → relief → happiness)
- Use premium audio/music
- Make text huge and readable
- Show genuine user success moment

❌ **DON'T:**
- Make it too long (30-40 sec sweet spot)
- Use bad/low-res mockups
- Overload with text
- Use generic/cheap music
- Show failed examples
- Make it feel like marketing (feel like product demo)

---

## Questions?

For specific technical help with video editing:
1. Check DaVinci Resolve tutorials on YouTube
2. Search "[tool name] mobile vertical video tutorial"
3. Test locally before deploying to production

Good luck! 🚀
