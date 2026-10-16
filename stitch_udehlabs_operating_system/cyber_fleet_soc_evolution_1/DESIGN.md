---
name: Cyber-Fleet SOC Evolution
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#ddfcff'
  on-secondary: '#00363a'
  secondary-container: '#00f1fe'
  on-secondary-container: '#006a70'
  tertiary: '#bec6e0'
  on-tertiary: '#283044'
  tertiary-container: '#5e667d'
  on-tertiary-container: '#dee5ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#74f5ff'
  secondary-fixed-dim: '#00dbe7'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-mono-lg:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  data-mono-sm:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Geist Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 1440px
  gutter: 16px
---

## Brand & Style

The design system is engineered for high-stakes cybersecurity environments where precision, rapid data synthesis, and authoritative action are paramount. The personality is sophisticated, technical, and unwavering, designed to evoke a sense of "command and control."

The aesthetic blends **Corporate Modern** structure with **Glassmorphism** depth. It utilizes deep navy layered surfaces to reduce ocular strain during long shifts, while vibrant neon accents draw immediate attention to critical telemetry. The interface is dense but organized, prioritizing information density without sacrificing clarity. Every element feels like a high-fidelity instrument in a modern Security Operations Center (SOC).

## Colors

The palette is optimized for dark-mode-only environments. 

- **Primary (Indigo/Violet):** Used for primary actions, active states, and brand-level trust indicators.
- **Secondary (Cyan):** Reserved for technical instrumentation, data visualization accents, and scanning animations.
- **Surface Strategy:** The foundation is `surface_navy`. Layered containers use subtle shifts in lightness and opacity to create hierarchy.
- **Semantics:** High-saturation reds and ambers are used sparingly to ensure "alert fatigue" is minimized, while emerald is used to denote "system healthy" states.

## Typography

This design system utilizes a dual-font strategy to balance readability with technical rigor.

- **Hanken Grotesk** is used for all UI prose, headings, and general interface elements. It provides a contemporary, clean feel that remains legible in dense layouts.
- **Geist Mono** is the functional engine for the system. It is used exclusively for log data, IP addresses, code snippets, and small labels. 
- **Scale:** Large display sizes are significantly reduced on mobile (e.g., `display-lg` becomes 32px) to maintain the layout's structural integrity.

## Layout & Spacing

The layout follows a **Fluid Grid** model built on a 4px baseline shift. 

- **Desktop:** A 12-column grid with 16px gutters. Dashboards use a "modular bento" approach where widgets span 3, 4, 6, or 12 columns.
- **Density:** To accommodate the high volume of security data, the system supports a "Compact" mode where vertical padding is reduced by 50%.
- **Margins:** Standard page margins are 24px on desktop, scaling down to 16px on mobile. 
- **Reflow:** On tablet, 12 columns collapse to 8; on mobile, the layout shifts to a single column with horizontal scrolling enabled for data tables.

## Elevation & Depth

Depth is established through **Tonal Layering** and **Glassmorphism** rather than traditional drop shadows.

- **Base Layer:** Darkest navy (#020617).
- **Surface Layers:** Elements "lift" by becoming slightly lighter and more translucent. 
- **Glass Effects:** Modal overlays and side panels use a 12px backdrop blur with a 10% white tint and a subtle 1px border (#ffffff15) to simulate reinforced glass.
- **Glows:** High-priority items (e.g., Critical Threats) use a subtle outer glow of the semantic color (Red) to indicate urgency without adding physical weight.

## Shapes

The shape language is disciplined and professional.

- **Base (0.5rem):** Used for buttons, input fields, and small UI widgets.
- **Large (1rem):** Used for cards and primary content containers.
- **Extra Large (1.5rem):** Used exclusively for modal windows and large dashboard panels.
- **Technical Detail:** 1px "inner-stroke" borders are applied to all cards to define edges in the dark environment.

## Components

- **Buttons:** Primary buttons are solid Indigo. Secondary buttons use a "Ghost" style with a Cyan border and text. All buttons have a 200ms transition on hover with a subtle "inner glow" effect.
- **Data Grids:** Highly dense. Rows use zebra-striping with `rgba(255,255,255,0.02)`. Headers use `label-caps` in Geist Mono for a terminal-like appearance.
- **Chips/Badges:** Use a semi-transparent fill of their respective semantic color with 100% opaque text. (e.g., Red badge = `rgba(239, 68, 68, 0.1)` background).
- **Input Fields:** Dark background with a 1px border. On focus, the border transitions to Cyan and gains a subtle outer glow.
- **Cards:** Dashboard cards utilize the glassmorphic style with a subtle gradient background from top-left to bottom-right.
- **Instrumentation:** Custom components include "Threat Meters" (radial gauges) and "Traffic Sparklines" (monotone line charts) using the secondary Cyan color.