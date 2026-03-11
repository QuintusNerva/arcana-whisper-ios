# Arcana Whisper — Design System v2.0

> Source: Refero research (Moonly, Lumy, Verse) + user spec + mockup analysis.
> This file is the **single source of truth** for all UI implementation.

---

## 1. Color Palette

### Backgrounds
| Token | Hex | Usage |
|---|---|---|
| `bg-deep` | `#0C0118` | Deepest background (top of gradient, modals) |
| `bg-dark` | `#1A0830` | Primary background |
| `bg-mid` | `#2A1245` | Card interiors, elevated surfaces |
| `bg-purple` | `#3D1D5A` | Glassmorphism card fill (at 60% opacity) |
| `bg-surface` | `rgba(61, 29, 90, 0.6)` | **All cards** — semi-transparent purple |

### Gold Accent System
| Token | Hex | Usage |
|---|---|---|
| `gold-deep` | `#8B6914` | Shadows, emboss base |
| `gold-primary` | `#C59341` | Primary gold — borders, icons, secondary text |
| `gold-bright` | `#D4A94E` | Mid gold — gradients, progress bars |
| `gold-light` | `#F9E491` | Highlight gold — button tops, shimmer |
| `gold-glow` | `rgba(197, 147, 65, 0.15)` | Glow effects, ambient halos |

### Text
| Token | Hex | Usage |
|---|---|---|
| `text-primary` | `#E8E0F0` | Primary body text |
| `text-muted` | `#9B8FB8` | Secondary / supporting text |
| `text-gold` | `#F9E491` | Section headings, accent text |
| `text-dark` | `#0C0118` | Text on gold buttons |

### Borders
| Token | Value | Usage |
|---|---|---|
| `border-card` | `1px solid rgba(197, 147, 65, 0.20)` | All card borders — thin gold at 20% opacity |
| `border-active` | `2px solid rgba(197, 147, 65, 0.50)` | Active/CTA borders |
| `border-subtle` | `1px solid rgba(255, 255, 255, 0.06)` | Inactive/dimmed borders |

---

## 2. Typography

### Font Families
| Token | Family | Fallback | Usage |
|---|---|---|---|
| `font-display` | **Cinzel** | `Georgia, serif` | H1, H2, section headings, CTA buttons |
| `font-body` | **Inter** | `system-ui, sans-serif` | Body text, descriptions, captions |

### Font Sizes & Weights
| Level | Size | Weight | Letter-spacing | Transform | Font |
|---|---|---|---|---|---|
| **H1 (Page Title)** | `24px` | `700` (Bold) | `4px` | `uppercase` | Cinzel |
| **H2 (Section Title)** | `14px` | `600` (SemiBold) | `4px` | `uppercase` | Cinzel |
| **H3 (Card Title)** | `13px` | `600` (SemiBold) | `2px` | `uppercase` | Cinzel |
| **Body** | `13px` | `400` (Regular) | `0.3px` | `none` | Inter |
| **Caption** | `11px` | `400` (Regular) | `0.5px` | `none` | Inter |
| **Button** | `14px` | `800` (ExtraBold) | `3px` | `uppercase` | Cinzel |
| **Badge** | `11px` | `500` (Medium) | `0` | `none` | Inter |

---

## 3. Spacing & Layout

| Token | Value | Usage |
|---|---|---|
| `page-padding` | `16px` | Horizontal page margins |
| `card-padding` | `16px` | Internal card padding |
| `section-gap` | `16px` | Space between sections |
| `card-gap` | `10px` | Space between stacked cards |
| `element-gap` | `8px` | Space between inline elements |

---

## 4. Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-card` | `24px` | All cards, buttons, banners |
| `radius-pill` | `999px` | Badges, tags, progress bars |
| `radius-button` | `24px` | CTA and action buttons |
| `radius-circle` | `50%` | Avatars, planet glyph frames |

---

## 5. Effects

### Glassmorphism (All Cards)
```css
background: rgba(61, 29, 90, 0.6);
border: 1px solid rgba(197, 147, 65, 0.20);
backdrop-filter: blur(12px);
border-radius: 24px;
```

### Gold Button Gradient
```css
background: linear-gradient(180deg, #F9E491 0%, #D4A94E 35%, #C59341 65%, #A67B2E 100%);
border: 2px solid rgba(197, 147, 65, 0.50);
border-radius: 24px;
color: #0C0118;
box-shadow: 0 2px 0 #8B6914, 0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
```

### Background Gradient
```css
background: linear-gradient(180deg, #0C0118 0%, #1A0830 40%, #2A1245 100%);
```

### Progress Bar
```css
/* Track */
background: rgba(197, 147, 65, 0.12);
border-radius: 999px;

/* Fill */
background: linear-gradient(90deg, #C59341, #D4A94E, #F9E491, #D4A94E);
box-shadow: 0 0 12px rgba(197, 147, 65, 0.5);
```

### Planet Glyph Circle
```css
width: 44px;
height: 44px;
border-radius: 50%;
border: 1.5px solid rgba(197, 147, 65, 0.50);
background: radial-gradient(circle, rgba(197, 147, 65, 0.06) 0%, transparent 70%);
color: #C59341;
```

---

## 6. Shadows

| Token | Value | Usage |
|---|---|---|
| `shadow-card` | `0 4px 24px rgba(0,0,0,0.4)` | Elevated cards |
| `shadow-button` | `0 2px 0 #8B6914, 0 4px 8px rgba(0,0,0,0.4)` | Gold CTA buttons |
| `shadow-glow-gold` | `0 0 15px rgba(197,147,65,0.08)` | Subtle gold glow |
| `shadow-glow-ambient` | `0 0 30px rgba(197,147,65,0.2)` | Button ambient glow |

---

## 7. Component Specifications

### Manifestation Card (Active)
- Background: `rgba(61, 29, 90, 0.6)` + `backdrop-filter: blur(12px)`
- Border: `1px solid rgba(197, 147, 65, 0.20)`
- Border radius: `24px`
- Padding: `20px`
- Title: `16px Georgia/Cinzel, semibold, #E8E0F0`
- Progress bar: Gold gradient, `7px` height, `999px` radius

### Cosmic Timing Card
- Same glassmorphism as Manifestation Card
- Planet glyph: `44px` circle with gold border
- Title: `13px Cinzel, semibold, uppercase, 2px spacing`
- Description: `11px Inter, regular, #9B8FB8`
- Status label (Now/Coming): `11px Cinzel, rgba(180,170,200,0.7)`

### Moon Banner
- Same glassmorphism as all cards
- Moon emoji: `30px` with glow drop-shadow
- Title: `12px Cinzel, bold, uppercase, 2px spacing, #F9E491`
- Description: `12px Inter, italic, #9B8FB8`

### CTA Button (Gold)
- Full gold gradient (see Effects section)
- `24px` border radius
- `14px Cinzel, 800 weight, 3px letter-spacing, uppercase`
- Text color: `#0C0118`

---

*Generated from Refero analysis of Moonly, Lumy, and Verse apps.*
*Last updated: 2026-03-10*
