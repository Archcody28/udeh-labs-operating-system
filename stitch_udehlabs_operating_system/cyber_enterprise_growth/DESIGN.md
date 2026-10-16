---
name: Cyber-Enterprise Growth
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#c4c1fb'
  on-secondary: '#2d2a5b'
  secondary-container: '#444173'
  on-secondary-container: '#b3afe9'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#009eb9'
  on-tertiary-container: '#002f38'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#e3dfff'
  secondary-fixed-dim: '#c4c1fb'
  on-secondary-fixed: '#181445'
  on-secondary-fixed-variant: '#444173'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 72px
    fontWeight: '800'
    lineHeight: 80px
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
  cta-text:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 32px
  margin-x: 24px
  section-gap: 120px
  feature-gap: 48px
---

## Brand & Style
The design system manifests a "Cyber-Enterprise" aesthetic—a fusion of high-tier corporate reliability and cutting-edge technological prowess. It is designed to evoke absolute trust while signaling rapid growth and innovation. 

The style leans into **Minimalist-Techno**: deep obsidian surfaces, precision-engineered whitespace, and purposeful "electric" accents. It utilizes subtle glassmorphic overlays to represent transparency and depth, ensuring the UI feels like a high-performance instrument. The target audience includes CMOs, growth engineers, and enterprise stakeholders who value both data-driven results and visionary technology.

## Colors
The palette is rooted in a "Deep Indigo" spectrum to establish an authoritative enterprise foundation. 

- **Primary (Electric Violet):** Used for interactive elements and brand signaling.
- **Secondary (Midnight Navy):** Provides structural depth and background layering.
- **Tertiary (Cyber Cyan):** Used sparingly for data visualization and "success" indicators.
- **Background:** A near-black `#020617` creates the infinite canvas required for the cyber aesthetic.
- **Primary CTA:** A high-vibrancy Violet-to-Indigo gradient is reserved exclusively for conversion points to ensure they "pop" against the dark UI.

## Typography
The typographic scale emphasizes authority and technical precision. 

- **Headlines:** Hanken Grotesk provides a sharp, contemporary "tech-giant" feel. Use tight letter-spacing on display sizes to create a high-impact, editorial look.
- **Body:** Inter is utilized for maximum legibility in long-form marketing copy and feature descriptions.
- **Labels:** JetBrains Mono is used for small metadata, "Kicker" text above headlines, and technical specs to reinforce the developer-centric enterprise vibe.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. Content is contained within a 1280px central track, but decorative background elements (gradients and blurs) bleed to the edges of the viewport.

- **Marketing Heroes:** Use a centered or 60/40 split layout with a minimum height of 80vh to command attention.
- **Feature Grids:** Use a 3-column grid on desktop, collapsing to 1-column on mobile. Use 48px gaps to maintain "air" and premium feel.
- **Sectioning:** Large vertical gaps (120px+) are mandatory between major narrative shifts to prevent cognitive overload.

## Elevation & Depth
In this dark "Cyber-Enterprise" environment, depth is created through **Tonal Layering** and **Luminescence** rather than traditional shadows.

1.  **Level 0 (Base):** `#020617` — The core background.
2.  **Level 1 (Cards):** `#0F172A` — Surfaces for feature cards and testimonials.
3.  **Level 2 (Modals/Popovers):** `#1E293B` — Highest surface elevation.
4.  **Accents:** Use low-opacity violet glow (`drop-shadow`) on primary buttons and active states to simulate light emitting from the screen.
5.  **Borders:** Use subtle 1px "ghost borders" (Indigo-900 at 50% opacity) to define shapes without creating visual noise.

## Shapes
This design system utilizes **Soft (0.25rem)** roundedness for a precision-engineered, architectural feel. 

- **Small elements (Buttons, Inputs):** 4px radius.
- **Medium elements (Cards, Pricing Tables):** 8px radius.
- **Large elements (Hero Containers):** 12px radius.
Avoid pill shapes or aggressive rounding; the goal is a "sharp" professional look that feels stable and structural.

## Components
- **Primary CTA Button:** High-contrast Electric Violet background. Use bold Hanken Grotesk text. On hover, apply a subtle cyan outer glow.
- **Secondary Button:** Ghost style with a 1px Indigo border. 
- **Marketing Hero:** H1 text should use the `display-lg` token with a subtle linear gradient from White to Slate-300.
- **Feature Cards:** Dark Slate background with a top-left accent border (1px violet). Icons should be monochromatic Cyan or Violet.
- **Pricing Tables:** The "Pro/Enterprise" tier should be highlighted with a subtle backdrop-blur (Glassmorphism) and a 1px glowing border to differentiate it from the standard tiers.
- **Social Proof / Testimonials:** Use a simple, borderless layout with the company logo in grayscale (0.5 opacity) until hover.
- **Input Fields:** Darker than the surface color (`#020617`) with a Violet focus ring.