---
name: Nexus SRE Command
colors:
  surface: '#081425'
  surface-dim: '#081425'
  surface-bright: '#2f3a4c'
  surface-container-lowest: '#030e1f'
  surface-container-low: '#101c2d'
  surface-container: '#152031'
  surface-container-high: '#1f2a3c'
  surface-container-highest: '#2a3548'
  on-surface: '#d7e3fb'
  on-surface-variant: '#c3c6d0'
  inverse-surface: '#d7e3fb'
  inverse-on-surface: '#263143'
  outline: '#8d919a'
  outline-variant: '#43474f'
  surface-tint: '#a4c9ff'
  primary: '#d4e4ff'
  on-primary: '#00315d'
  primary-container: '#a4c9ff'
  on-primary-container: '#2d5483'
  inverse-primary: '#3a6090'
  secondary: '#d2bbff'
  on-secondary: '#38255e'
  secondary-container: '#523e79'
  on-secondary-container: '#c4adf0'
  tertiary: '#70fcbf'
  on-tertiary: '#003824'
  tertiary-container: '#4fdfa4'
  on-tertiary-container: '#005f40'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d3e3ff'
  primary-fixed-dim: '#a4c9ff'
  on-primary-fixed: '#001c39'
  on-primary-fixed-variant: '#1f4876'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#230e48'
  on-secondary-fixed-variant: '#4f3c76'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005236'
  background: '#081425'
  on-background: '#d7e3fb'
  surface-variant: '#2a3548'
  surface-deep: '#040e1f'
  status-healthy: '#10b981'
  status-warning: '#f59e0b'
  status-critical: '#ef4444'
  border-active: '#1e293b'
  data-text: '#d8e3fb'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  data-lg:
    fontFamily: Geist Mono
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.02em
  data-md:
    fontFamily: Geist Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  data-sm:
    fontFamily: Geist Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: Geist Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  compact: 8px
  standard: 16px
  gutter: 12px
  sidebar: 240px
  margin-desktop: 24px
  margin-mobile: 12px
---

## Brand & Style

The design system is engineered for **UdehLabs** as a mission-critical "glass cockpit" for digital infrastructure. The brand personality is clinical, vigilant, and authoritative, optimized for rapid cognitive processing under high-pressure scenarios. 

The aesthetic is a fusion of **Modern Brutalism** and **Technical Minimalism**. It prioritizes information density over whitespace, utilizing razor-sharp borders and high-contrast semantic signals. The UI should feel like a precision instrument—a high-density command center where every pixel serves a functional purpose, mirroring the logic of the complex systems being monitored.

## Colors

The palette is anchored in a **Deep Indigo Core** to minimize eye strain during long-watch shifts. 

- **Primary Surfaces:** Utilize the `neutral` base for the primary canvas and `surface-deep` for recessed terminal environments or log streams.
- **Operational Status:** These are sharp, high-chroma colors for production observability. **Healthy** uses Emerald, **Warning** uses Amber, and **Critical** uses Ruby.
- **Accents:** The `primary` (Data Blue) is reserved for active telemetry and interactive variables. `secondary` (Execution Violet) is the signature color for system-level actions.
- **Data Fidelity:** All primary text uses `data-text` (#d8e3fb) rather than pure white to prevent visual vibration and "halo" effects on dark backgrounds.

## Typography

Typography is functionally bifurcated. **Hanken Grotesk** is used for interface chrome, navigation, and general descriptions. **Geist Mono** is mandatory for all dynamic telemetry, numerical values, and system logs to ensure tabular lining and perfect vertical alignment of data.

`label-caps` must be used for metadata, timestamps, and table headers to distinguish structural labels from the actual data. For mobile, use the `headline-lg-mobile` variant to maintain dashboard density without breaking container boundaries.

## Layout & Spacing

This design system uses a **Fixed-Modular Grid** optimized for massive information density. 

- **Structure:** A fixed 240px navigation rail on the left on desktop. Content follows a 12-column grid.
- **Density:** Use a 4px base increment. Internal padding for data cards is strictly `compact` (8px) to maximize the "at-a-glance" visibility of metrics.
- **Responsiveness:** 
    - **Desktop:** Full dashboard with 24px margins.
    - **Tablet:** 768px - 1439px; sidebar collapses to an icon-only rail; 8-column grid.
    - **Mobile:** Under 767px; vertical stack with 12px margins. The sidebar is moved to a hidden drawer.

## Elevation & Depth

Depth is used exclusively for information hierarchy, not decoration. We employ **Tonal Layering** and **Active Glows**.

- **Surfaces:** Use `surface-container` tiers to create hierarchy. Recessed areas (terminals) use `surface-deep`. 
- **Borders:** Instead of heavy shadows, use `1px` solid borders (#1e293b) to define component boundaries. 
- **Status Glows:** Critical alerts use a subtle outer glow (0px 0px 8px) in the `status-critical` color to draw immediate attention.
- **Interactions:** Hover states should use `surface-bright` background shifts. Do not use elevation shadows for interactive elements to keep the interface feeling flat and technical.

## Shapes

The shape language is **Soft-Technical**, providing a precision-engineered feel.

- **Standard Radius:** Use `0.25rem` (4px) for cards, inputs, and primary buttons.
- **Data Grids:** Use `0px` sharp corners for internal grid cells and table rows to emphasize the rigid data structure.
- **Status Indicators:** Use `pill-shaped` (999px) for status badges and chips to visually separate "state" from "action."
- **Focus States:** Use a sharp 2px offset ring to maintain the brutalist aesthetic.

## Components

- **Telemetry Cards:** Must use `label-caps` for the title and `data-lg` for the primary value. Sparklines should be embedded in the card footer with no axes.
- **Buttons:**
    - **Primary:** Solid `secondary` fill with `on-secondary` text.
    - **Secondary:** Ghost style with `1px` border of `border-active` and `primary` text.
- **Input Fields:** Terminal-styled with `surface-deep` background and a block cursor. Use `Geist Mono` for all input text.
- **Data Tables:** High-density 32px row heights. Use 1px horizontal dividers in `outline-variant`. No vertical dividers. Headers are sticky with a darker background than the body.
- **Status Gauges:** Utilize semantic colors. Healthy states should have a subtle 2s "pulse" opacity animation.
- **Logs:** Monospaced text on `surface-deep`. Use semantic color prefixes: `[ERR]` (Ruby), `[WRN]` (Amber), `[INF]` (Data Blue).
- **Incident Banners:** Full-width alerts in `status-critical` using white `headline-sm` text for maximum urgency.