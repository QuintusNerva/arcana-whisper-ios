---
description: How to apply the Sacred Fintech design system when building or redesigning any screen in Arcana Whisper
---

# Apply Sacred Fintech Design System

Follow these steps exactly when building or redesigning any screen.

## 1. Read the Design System
// turbo
Read `DESIGN_SYSTEM.md` in the project root. Understand all 8 sections:
- Color Tokens (Brand Purples, 5-Tier Gold, Gold Glow, Text)
- Typography (Cinzel headings, Inter body — see full role table)
- Spacing Scale (xs=4px through 3xl=28px)
- Shadow System (Primary Card, Info Card, CTA)
- Component Recipes (Primary Card, Info Card, Gold CTA, Status Pills, Progress Bar, Stat Badges, Section Label)
- Animations (breathe, shimmer-sweep, fade-up, live-pulse — max 2 ambient per screen)
- Page Layout Pattern (Header → Hero → CTA → Cards → Info → Banner → Nav)
- Do's and Don'ts

## 2. Study the Current Screen
// turbo
Pull the current screen code. Identify:
- What components are already used
- What deviates from the design system
- What's missing (e.g., proper shadows, correct spacing, animation limits)

## 3. Build a Standalone Prototype
Create a standalone HTML/CSS prototype in `/prototypes/`. Rules:
- Use Google Fonts CDN for Cinzel + Inter (prototype only)
- Implement ALL design system tokens as CSS custom properties
- Build every component using the exact recipes from DESIGN_SYSTEM.md
- Follow the Page Layout Pattern exactly
- Set viewport to 500px wide (mobile-first)
- Include ambient particles, fade-up animations, and shimmer sweep

## 4. Run Through Neocortex (All Gears)
Run the prototype through Neocortex analysis:
1. `deep_reason` — Full UX audit against design system compliance
2. `simulate` — User flow evaluation from landing to bottom nav
3. `critique` — Adversarial critique identifying weakest assumptions
4. If steelman > 0.5, resolve with a new `thought` before continuing
5. Apply all fixes to the prototype
6. `quick_sim` — Final verification

## 5. Verify Before/After
- Open the fixed prototype in browser at 500x900
- Capture screenshots (top, middle, bottom)
- Create a walkthrough artifact with before/after comparison

## 6. Design System Updates
If Neocortex suggests a NEW pattern not in DESIGN_SYSTEM.md:
- Document it in the walkthrough
- Get user approval FIRST
- Only then update DESIGN_SYSTEM.md

## 7. Wait for Approval
**NEVER** integrate into the app until the user explicitly approves.
Present the prototype + walkthrough and wait.
