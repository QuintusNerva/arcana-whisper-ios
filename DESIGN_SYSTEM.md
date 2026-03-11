# Arcana Whisper — Sacred Fintech Design System

> The definitive style guide extracted from the 0.93-rated Manifestation Hub prototype.
> Use this to make every screen in the app look and feel the same.

---

## 1. Color Tokens

### Brand Purples
Already in your `@theme` block — no changes needed:
```css
--color-altar-deep:   #120224   /* Darkest background */
--color-altar-dark:   #1F0D38   /* Card backgrounds */
--color-altar-mid:    #2d1b4e   /* Elevated surfaces */
--color-altar-bright: #432c7a   /* Highlight surfaces */
--color-altar-purple: #2A0B4B   /* Gradient endpoint */
```

### 5-Tier Gold System ← ADD THESE
```css
--gold-100: #F9E491;  /* Lightest — headings, hero text */
--gold-200: #D4A94E;  /* Accent — chevrons, icons, badges */
--gold-300: #C59341;  /* Primary — borders, progress bars */
--gold-400: #A67B2E;  /* Deep — CTA gradient endpoint */
--gold-500: #8a6914;  /* Darkest — CTA bottom shadow */
```

### Gold Glow System ← ADD THESE
```css
--gold-glow-soft:   rgba(212,175,55, 0.08);  /* BG wash, subtle */
--gold-glow-med:    rgba(212,175,55, 0.18);  /* Text shadow, borders */
--gold-glow-strong: rgba(212,175,55, 0.35);  /* Icon glow, progress bar */
--gold-glow-neon:   rgba(249,228,145, 0.4);  /* Rare — mandala, emphasis */
```

### Text
```css
--text:      #e2e8f0;           /* Primary text */
--muted:     #94a3b8;           /* Secondary text */
--muted-dim: rgba(148,163,184, 0.5);  /* Tertiary / disabled */
```

---

## 2. Typography

| Role | Font | Weight | Size | Spacing | Case |
|---|---|---|---|---|---|
| **Page title** | Cinzel | 700 | 13px | 6px | UPPERCASE |
| **Section hero** | Cinzel | 700 | 20px | 5px | Title Case |
| **Section label** | Cinzel | 400 | 9px | 5px | UPPERCASE |
| **Card title / declaration** | Cinzel | 400 | 16px | 0 | Natural (renders as caps) |
| **Info card title** | Cinzel | 600 | 11px | 2px | UPPERCASE |
| **Badge / pill text** | Cinzel | 400 | 9-10px | 1-1.5px | UPPERCASE |
| **Body text** | Inter | 300-400 | 11-12px | 0.5px | Normal |
| **Stat badge** | Inter | 500 | 10px | 0.3px | Normal |
| **Subtitle** | Inter | 300 | 12px | 0.5px | Normal |

---

## 3. Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `xs` | 4px | Tight gaps (e.g., moon banner to timing) |
| `sm` | 8px | Between info cards |
| `md` | 12px | Inter-element gaps, stat badge rows |
| `lg` | 16px | **Between primary cards** (the premium gap) |
| `xl` | 20px | Horizontal page padding |
| `2xl` | 24px | **Card inner padding**, section gaps |
| `3xl` | 28px | Above first card after CTA |

> **Rule:** When in doubt, add 4px more. Luxury = whitespace.

---

## 4. Shadow System

### Primary Card (`.clay-card` / `.glass`)
The workhorse — manifestation cards, portal cards, main content:
```css
box-shadow:
  0 8px 28px rgba(0,0,0, 0.5),     /* deep drop */
  0 2px 6px  rgba(0,0,0, 0.4),     /* tight contact */
  inset 0  1px 1px rgba(255,255,255, 0.08), /* top highlight */
  inset 0 -2px 5px rgba(0,0,0, 0.35);       /* bottom sculpt */
```

### Info Card (lighter — timing, supplementary)
For secondary content that should feel lighter:
```css
box-shadow: 0 2px 8px rgba(0,0,0, 0.2);
```

### CTA Button (embossed gold)
```css
box-shadow:
  0 2px 0   var(--gold-500),         /* hard bottom edge */
  0 4px 12px rgba(0,0,0, 0.5),       /* deep drop */
  0 0  40px  var(--gold-glow-soft),   /* ambient glow */
  inset 0 1px 0 rgba(255,255,255, 0.35); /* top shine */
```

---

## 5. Component Recipes

### Primary Card
Use for: manifestation cards, readings, any main content.
```
Background:    linear-gradient(160deg, #1c1538, #130f2e 55%, #0d0b22)
Border:        1px solid rgba(255,255,255, 0.07)
Border-radius: 22px
Padding:       24px (right: 44px if chevron needed)
Margin-bottom: 16px
Shadow:        [Primary Card shadow]
```

**Active state:** Add `border-left: 1.5px solid rgba(197,147,65, 0.4)`
**With chevron:** Add `›` character, absolute right 16px, gold-200 at 40% opacity
**History/completed:** `opacity: 0.5`, `border-color: rgba(255,255,255, 0.04)`

### Info Card (Intelligence Feed)
Use for: cosmic timing, contextual information, supplementary data.
```
Background:    rgba(61,29,90, 0.35)
Border:        1px solid rgba(212,175,55, 0.10)
Border-radius: 16px
Padding:       14px 16px
Margin-bottom: 8px
Backdrop:      blur(12px)
Shadow:        [Info Card shadow]
```

**Active variant:** Add `background: linear-gradient(135deg, rgba(197,147,65,0.08), rgba(61,29,90,0.4))`

### Gold CTA Button
Use for: primary actions only (1 per screen).
```
Background:    linear-gradient(180deg, #F9E491, #D4A94E 30%, #C59341 60%, #A67B2E)
Border:        2px solid rgba(212,175,55, 0.6)
Border-radius: 20px
Padding:       18px 24px
Font:          Cinzel 800, 14px, 3.5px spacing, uppercase
Color:         var(--deep)
Shadow:        [CTA shadow]
Active:        scale(0.98)
```
Add shimmer sweep child div for animation.

### Status Pills
Use for: live indicators, state labels.

**Active (Now):**
```css
background: rgba(197,147,65, 0.12);
color: var(--gold-200);
border: 1px solid rgba(197,147,65, 0.25);
/* Add .live-dot child with pulse animation */
```

**Inactive (Coming/Later):**
```css
background: rgba(148,163,184, 0.06);
color: rgba(180,170,200, 0.5);
border: 1px solid rgba(255,255,255, 0.06);
```

### Progress Bar
```css
/* Track */
height: 8px; border-radius: 8px;
background: rgba(197,147,65, 0.1);

/* Fill */
background: linear-gradient(90deg, gold-300, gold-200, gold-100, gold-200);
box-shadow: 0 0 14px gold-glow-med, 0 0 4px gold-glow-strong;
/* NO end dot — clean bar end only */
```

### Stat Badges
**Readings:** `bg: rgba(99,102,241, 0.1)` / `color: #a5b4fc` / `border: rgba(99,102,241, 0.15)`
**Actions:** `bg: rgba(52,211,153, 0.08)` / `color: #6ee7b7` / `border: rgba(52,211,153, 0.15)`
**Manifested:** `bg: rgba(197,147,65, 0.10)` / `color: gold-200` / `border: rgba(197,147,65, 0.2)`

### Section Label
```css
font: Cinzel 400, 9px, 5px spacing, uppercase;
color: var(--gold-200); opacity: 0.5;
text-shadow: 0 0 10px var(--gold-glow-soft);
```

---

## 6. Animations

| Name | Duration | Use |
|---|---|---|
| `breathe` | 4s ease-in-out ∞ | Mandala glow, hero accents |
| `shimmer-sweep` | 3.5s ease-in-out ∞ | CTA button overlay |
| `fade-up` | 0.8s ease-out | Page entry, stagger with 0.1-0.15s delay |
| `live-pulse` | 2s ease-in-out ∞ | Status dot ("Now" indicator) |

> **Rule:** Max 2 concurrent ambient animations per screen. Use `fade-up` for entry only.

---

## 7. Page Layout Pattern

Every page should follow:
```
┌─────────────────────────┐
│ Page Header (Cinzel)    │  ← 16px padding top
├─────────────────────────┤
│ Hero Section            │  ← Optional mandala/icon + title + subtitle
│ (icon, title, subtitle) │
├─────────────────────────┤
│ Primary CTA             │  ← Gold button, 1 per screen max
├─────────────────────────┤
│ Primary Cards           │  ← Clay cards, 16px gaps, 24px padding
│ (main content)          │
├─────────────────────────┤
│ Info Section            │  ← Lighter cards, 8px gaps, section label
│ (context/supplementary) │
├─────────────────────────┤
│ Banner (optional)       │  ← Full-width info pill
├─────────────────────────┤
│ Bottom Nav              │
└─────────────────────────┘
```

## 8. Quick Reference: Do's and Don'ts

| ✅ Do | ❌ Don't |
|---|---|
| Use Cinzel for headings, Inter for body | Mix in Georgia, system fonts |
| 16px gaps between primary cards | 8-10px cramped gaps |
| Gold-200 for accents, Gold-100 for headings | Use raw `#ffd700` |
| 2 ambient animations max per screen | 4+ simultaneous animations |
| Clean progress bar ends (border-radius) | Glow dots or artifacts |
| Gold for manifested/success badges | Green for success (breaks gold system) |
| Use Info Cards for supplementary content | Same heavy card style for everything |
| Add chevrons on tappable collapsed cards | Leave cards with no tap affordance |
