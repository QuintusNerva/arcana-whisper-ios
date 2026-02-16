# ✦ Arcana Whisper

**Your mystical tarot & astrology companion** — a premium iOS app built with React, Vite, and Capacitor.

---

## Features

🃏 **Tarot Readings** — Daily card draws, multi-card spreads (Celtic Cross, Horseshoe, Relationship, Career, Mind-Body-Spirit), custom question readings

🤖 **AI Interpretations** — Personalized readings powered by Gemini 2.0 Flash via OpenRouter, with structured response formatting (Theme → Lesson → Action Steps)

🔮 **Natal Chart** — Sun, Moon, and Rising sign analysis with AI-synthesized cosmic profiles

♊ **Compatibility** — Partner compatibility scoring with zodiac triad matching

🔢 **Numerology** — Life path, expression, and soul urge number calculations

📜 **Reading History** — Full history with theme filtering and memory-based personalization

🧠 **Memory Agent** — Learns your reading patterns to progressively personalize the experience

🔔 **Daily Reminders** — Configurable notification reminders for daily readings

🎴 **Card Library** — Complete 78-card Major & Minor Arcana reference with meanings

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI** | React 19 + TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Build** | Vite 7 |
| **iOS Native** | Capacitor 7 |
| **AI** | OpenRouter (Gemini 2.0 Flash) |
| **Data** | localStorage (fully offline, no backend) |

---

## Project Structure

```
├── index.html              # App entry point
├── capacitor.config.ts     # iOS native config
├── vite.config.ts          # Build config
├── public/
│   └── privacy.html        # Privacy policy (App Store requirement)
├── src/
│   ├── App.tsx             # Root component & routing
│   ├── main.tsx            # React entry
│   ├── index.css           # Global styles & design tokens
│   ├── components/         # 26 UI components
│   │   ├── HeroCard.tsx        # Daily card with flip animation
│   │   ├── ReadingResult.tsx   # Spread reading display
│   │   ├── NatalChart.tsx      # Zodiac natal chart
│   │   ├── Compatibility.tsx   # Partner matching
│   │   ├── Numerology.tsx      # Number analysis
│   │   ├── Horoscope.tsx       # Daily horoscope
│   │   ├── Onboarding.tsx      # First-launch flow
│   │   ├── PremiumOverlay.tsx  # Premium gate
│   │   └── ...
│   ├── services/           # Business logic
│   │   ├── ai.service.ts       # OpenRouter AI integration
│   │   ├── tarot.service.ts    # 78-card deck & spread logic
│   │   ├── astrology.service.ts # Zodiac calculations
│   │   ├── memory.service.ts   # User pattern learning
│   │   └── reminder.service.ts # Daily notifications
│   └── models/
│       └── card.model.ts       # Card type definitions
└── ios/                    # Capacitor iOS project (gitignored, rebuilt via sync)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Xcode 15+ (for iOS builds)
- Apple Developer account (for App Store submission)

### Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```
App runs at `http://localhost:8081`

### iOS Build
```bash
# Production build
npm run build

# Sync to iOS project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Then in Xcode: set your Team → Product → Archive → Upload to App Store Connect.

---

## Environment Variables

Create a `.env` file in the project root:

```
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

---

## Privacy

Arcana Whisper stores all user data locally on-device. No analytics, no tracking, no data collection. See [Privacy Policy](public/privacy.html) for details.

---

## License

Proprietary — All rights reserved.
