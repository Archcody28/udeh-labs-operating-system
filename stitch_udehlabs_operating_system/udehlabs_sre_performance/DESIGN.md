---
name: UdehLabs SRE & Performance
colors:
  surface: '#081425'
  surface-dim: '#081425'
  surface-bright: '#2e3a4c'
  surface-container-lowest: '#030e1f'
  surface-container-low: '#101c2d'
  surface-container: '#152031'
  surface-container-high: '#1f2a3c'
  surface-container-highest: '#2a3548'
  on-surface: '#d7e3fb'
  on-surface-variant: '#c0c7d5'
  inverse-surface: '#d7e3fb'
  inverse-on-surface: '#263143'
  outline: '#8a919e'
  outline-variant: '#404753'
  surface-tint: '#a4c9ff'
  primary: '#a4c9ff'
  on-primary: '#00315d'
  primary-container: '#3492f6'
  on-primary-container: '#002a52'
  inverse-primary: '#005fad'
  secondary: '#ddfcff'
  on-secondary: '#00363a'
  secondary-container: '#00f1fe'
  on-secondary-container: '#006a70'
  tertiary: '#c0c1ff'
  on-tertiary: '#1000a9'
  tertiary-container: '#8083ff'
  on-tertiary-container: '#0d0096'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#a4c9ff'
  on-primary-fixed: '#001c39'
  on-primary-fixed-variant: '#004884'
  secondary-fixed: '#74f5ff'
  secondary-fixed-dim: '#00dbe7'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#081425'
  on-background: '#d7e3fb'
  surface-variant: '#2a3548'
typography:
  display:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 1.5rem
  gutter: 1rem
  density-high: 0.25rem
  density-medium: 0.75rem
  max-width: 1440px
---

## Brand & Style
The design system is engineered for Site Reliability Engineers and performance analysts who require high-density data visualization and instant cognitive processing. The personality is precise, technical, and unwavering.

The aesthetic blends **Corporate Modern** structure with **Cyber-Technical** accents. It utilizes a deep navy background to reduce eye strain during long monitoring sessions, punctuated by sharp linework and focused glowing states. The UI must feel like a high-performance instrument—responsive, transparent, and authoritative.

## Colors
The palette is anchored in **Deep Navy (#081425)** for the canvas. 

- **Primary (Cyber Blue):** Used for primary actions, active navigation states, and core brand identifiers.
- **Secondary (Intel Cyan):** Reserved for telemetry data, live-updating metrics, and interactive data points.
- **Status Levels:** These must remain pure and high-contrast. Use `healthy` for uptime >99.9%, `warning` for threshold breaches, and `critical` for incident-level alerts.
- **Data Visualization:** Use the defined color ramps for heatmaps to ensure a logical progression from cool (low latency) to bright (high latency).

## Typography
This design system employs a dual-font strategy:
1. **Hanken Grotesk** is used for all structural UI elements, headings, and descriptive text. It provides a contemporary, professional look that remains readable at high densities.
2. **JetBrains Mono** is mandatory for all technical outputs, logs, code snippets, and metric values. The monospaced nature ensures that columns of numbers align perfectly for quick visual scanning.

**Hierarchy Rule:** Titles should be Hanken Grotesk, while any value that updates in real-time or represents a system state must be JetBrains Mono.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for wide-screen monitoring dashboards. 

- **Density:** Use a 4px baseline grid. For data-heavy views (e.g., log streams, node lists), use `density-high` padding.
- **Breakpoints:** 
  - Mobile (<768px): Single column, cards stack vertically.
  - Tablet (768px - 1024px): 2-column dashboard layout.
  - Desktop (>1024px): 12-column grid with a fixed left sidebar and fluid main content area.
- **Alignment:** All technical data must be top-aligned. Use `gutter` for spacing between metric widgets.

## Elevation & Depth
The system utilizes **Tonal Layers** and **Glassmorphism** to define hierarchy without heavy shadows that would clutter the high-density UI.

- **Level 0 (Background):** Deep Navy solid color.
- **Level 1 (Containers):** Background with 40% opacity and a 1px `border-white/10` stroke. 
- **Level 2 (Popovers/Modals):** Background with 80% opacity, 12px Backdrop Blur, and a subtle `0 8px 32px rgba(0,0,0,0.5)` shadow.
- **Status Elevation:** Use inner-glows (box-shadow: inset) for active status indicators rather than external shadows to keep the grid lines clean.

## Shapes
The shape language is **Soft (0.25rem)**. This provides a professional, rigid feel appropriate for engineering tools while preventing the UI from feeling dated or aggressive.

- **Buttons & Inputs:** Use the standard `rounded` (4px).
- **Metric Widgets:** Use `rounded-lg` (8px) for larger container groups.
- **Status Pills:** Use `rounded-xl` (12px) to differentiate them from functional buttons.

## Components
- **Command Buttons:** High-contrast background (Primary Blue), `mono-label` typography in uppercase, and a 2px hover border in Secondary Cyan. Transitions must be snappy (100ms).
- **Telemetry Chips:** Small `rounded-xl` badges. Use `mono-data` for the value and a small leading circle for the status color.
- **Metric Cards:** Translucent background, 1px border. The top-right corner should always house the "Status Level" indicator.
- **Data Grids:** Alternating row highlights (zebra striping) using 5% white overlay. On hover, the row should gain a subtle `Primary Blue` left-border accent.
- **Input Fields:** Darker than the container background, sharp borders, and a focus state that adds a subtle glow effect (`box-shadow: 0 0 8px var(--primary)`).
- **Status Indicators:** Pulsing animations are permitted only for "Critical" states. All other states should be static.