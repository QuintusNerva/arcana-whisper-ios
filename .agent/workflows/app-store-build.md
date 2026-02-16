---
description: Build and submit Arcana Whisper to the iOS App Store
---

# App Store Build & Submission Workflow

## Prerequisites
- Active Apple Developer Program membership
- Xcode installed with your Team configured
- All code changes committed

## Steps

// turbo-all

1. **Build the production web app**
```bash
cd /Users/quintusnerva/Desktop/arcana-whisper-ios && npm run build
```

2. **Sync to Capacitor iOS project**
```bash
cd /Users/quintusnerva/Desktop/arcana-whisper-ios && npx cap sync ios
```

3. **Open in Xcode**
```bash
cd /Users/quintusnerva/Desktop/arcana-whisper-ios && npx cap open ios
```

4. **Configure Signing in Xcode** (manual)
   - Select the `App` target in the left sidebar
   - Go to **Signing & Capabilities** tab
   - Check **Automatically manage signing**
   - Select your **Team** from the dropdown
   - Verify the Bundle Identifier is `com.arcanawhisper.app`

5. **Verify deployment target** (manual)
   - In the `App` target → **General** tab
   - Set **Minimum Deployments** to iOS 16.0 (or your preference)

6. **Set Version & Build Number** (manual)
   - **Version**: `1.0.0` (Marketing Version)
   - **Build**: `1` (increment this for each upload)

7. **Verify PrivacyInfo.xcprivacy is included** (manual)
   - Check that `PrivacyInfo.xcprivacy` appears under `App > App` in the project navigator
   - If missing, drag it from `ios/App/App/PrivacyInfo.xcprivacy` into Xcode

8. **Archive the app** (manual)
   - Select **Any iOS Device (arm64)** as the build destination (not a simulator)
   - **Product → Archive**
   - Wait for the archive to complete

9. **Upload to App Store Connect** (manual)
   - In the Organizer window (Window → Organizer)
   - Select the latest archive
   - Click **Distribute App**
   - Choose **App Store Connect** → **Upload**
   - Follow the prompts

10. **Complete App Store Connect listing** (manual)
    - Go to [App Store Connect](https://appstoreconnect.apple.com)
    - Fill in: App description, subtitle, keywords
    - Upload screenshots for required device sizes
    - Set Privacy Policy URL (host `public/privacy.html` and enter the URL)
    - Complete the age rating questionnaire
    - Submit for review
