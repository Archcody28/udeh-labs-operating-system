---
name: UdehLabs Cyber-Intelligence
colors:
  surface: '#121315'
  surface-dim: '#121315'
  surface-bright: '#38393a'
  surface-container-lowest: '#0d0e0f'
  surface-container-low: '#1b1c1d'
  surface-container: '#1f2021'
  surface-container-high: '#292a2b'
  surface-container-highest: '#343536'
  on-surface: '#e3e2e3'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#e3e2e3'
  inverse-on-surface: '#303032'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#006e4b'
  on-tertiary-container: '#67f4b7'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#121315'
  on-background: '#e3e2e3'
  surface-variant: '#343536'
  surface-elevated: '#111214'
  border-subtle: '#1f2124'
  text-muted: '#8b93a1'
  warning-amber: '#e4f222'
  danger-red: '#ef4444'
typography:
  display:
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
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for high-stakes cyber-intelligence environments. It prioritizes information density, surgical precision, and a "command center" aesthetic. The brand personality is technical, authoritative, and ultra-modern—designed for operators who require immediate clarity in complex data landscapes.

The visual style is a fusion of **Corporate Minimalism** and **Technical Futurism**. It utilizes a "Dark Mode" foundation to reduce eye strain during prolonged monitoring, featuring sharp contrasts, subtle glowing accents, and a strict adherence to a grid-based architectural logic. Every pixel serves a functional purpose, eliminating decorative bloat in favor of utility and performance.

## Colors

This design system operates on a "Deep Space" palette. The foundation is a true-dark neutral (`#08090a`) to ensure maximum contrast for data visualization. 

- **Primary (Indigo):** Used for primary actions and focus states.
- **Secondary (Cyan):** Reserved for telemetry, active scanning indicators, and secondary data points.
- **Tertiary (Emerald):** Exclusively for "System Healthy," "Success," and "Secure" status signals.
- **Warning (Amber):** Sourced from the brand profile to highlight non-critical anomalies.

Color is used sparingly as a functional signal rather than a decorative element. Surface layers use subtle increments in lightness to denote hierarchy without the use of heavy shadows.

## Typography

The system utilizes **Hanken Grotesk** for its clean, geometric legibility and professional weight distribution. For technical data, code snippets, and telemetry labels, **JetBrains Mono** is employed to provide a clear distinction between narrative content and system data.

All labels and metadata should use `label-caps` for a structured, engineering-grade feel. Tracking (letter-spacing) is tightened on headlines for a compact look and widened on mono labels to ensure readability at small scales.

## Layout & Spacing

This design system uses a strict **4px grid system** to achieve "engineering-grade" density. The layout philosophy is a **Fixed-Fluid Hybrid**:
- **Sidebars & Panels:** Fixed widths (e.g., 240px, 320px) to maintain consistent scanning patterns for tools and navigation.
- **Main Content:** Fluid 12-column grid that expands to fill the viewport up to 1440px.

Margins and gutters are kept tight (16px) to maximize screen real estate for data tables and dashboards. On mobile, the layout collapses into a single column with horizontal scrolling enabled for wide data tables to preserve the integrity of the information.

## Elevation & Depth

In this design system, depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than traditional shadows. 

1.  **Level 0 (Base):** `#08090a` - The background canvas.
2.  **Level 1 (Card/Panel):** `#111214` - For primary containers, outlined with a 1px border of `#1f2124`.
3.  **Level 2 (Popovers/Modals):** `#1c1e21` - For floating elements, using a subtle 16px blur backdrop to separate from the content below.

This "flat-stack" approach maintains the minimalist, technical aesthetic and ensures the UI feels like a single, integrated piece of hardware.

## Shapes

The shape language is "Soft-Mechanical." We use a **0.25rem (4px) base radius** for buttons, input fields, and cards. This slight rounding prevents the UI from feeling overly aggressive (brutalist) while maintaining a precise, structured appearance. 

Larger containers like modals may scale to `rounded-lg` (8px), but should never exceed this to maintain the technical rigor of the system.

## Components

- **Buttons:** Primary buttons are solid `#4f46e5` with white text. Secondary buttons use a ghost style (1px border) with Cyan text. State changes (hover/active) should be immediate with no transition lag to emphasize performance.
- **Input Fields:** Dark backgrounds (`#08090a`) with 1px `#1f2124` borders. On focus, the border transitions to Cyan with a subtle outer glow.
- **Status Chips:** High-contrast capsules. Success uses Emerald text on a 10% opacity Emerald background. Danger uses Red text on a 10% Red background.
- **Data Tables:** Strict 1px horizontal dividers. No vertical lines. Row hover states use a subtle tint to highlight the active data point.
- **Telemetric Widgets:** Small-scale charts and sparklines should use Indigo for trends and Cyan/Emerald for specific data markers.
- **Command Palette:** A central component for this system, allowing operators to navigate via keyboard. It uses the Level 2 elevation with a mono-font search bar.