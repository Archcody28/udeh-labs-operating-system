---
name: UdehLabs Nexus Command
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
  secondary: '#d3fbff'
  on-secondary: '#00363a'
  secondary-container: '#00eefc'
  on-secondary-container: '#00686f'
  tertiary: '#ebddff'
  on-tertiary: '#38255e'
  tertiary-container: '#d3bcff'
  on-tertiary-container: '#5c4883'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d3e3ff'
  primary-fixed-dim: '#a4c9ff'
  on-primary-fixed: '#001c39'
  on-primary-fixed-variant: '#1f4876'
  secondary-fixed: '#7df4ff'
  secondary-fixed-dim: '#00dbe9'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#230e48'
  on-tertiary-fixed-variant: '#4f3c76'
  background: '#081425'
  on-background: '#d7e3fb'
  surface-variant: '#2a3548'
  status-healthy: '#10b981'
  status-warning: '#f59e0b'
  status-critical: '#ef4444'
  surface-deep: '#040e1f'
  border-muted: '#1e293b'
  data-cyan: '#00f0ff'
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
  sidebar-width: 240px
  margin-desktop: 24px
  margin-mobile: 12px
---

## Brand & Style

The design system is a high-density, technical framework engineered for **Production Hardening and Reliability**. It evolves the SRE aesthetic into a "glass cockpit" environment where security posture and system resilience are paramount. The brand personality is vigilant, clinical, and uncompromising, designed to evoke a sense of absolute control and fail-safe reliability.

The design style is **Technical Minimalism** with **Cybernetic accents**. It prioritizes extreme information density and rapid cognitive processing. The UI avoids decorative elements, favoring structural containment and semantic signals that mirror the complexity of the underlying infrastructure. It feels like a high-end defense system: dark, precise, and authoritative.

## Colors

The color architecture is built on a **Deep Space** foundation to eliminate eye fatigue during extended monitoring shifts.

- **Core Palette:** The primary blue (#a4c9ff) is used for structural UI elements and primary navigation. The secondary Electric Cyan (#00f0ff) is strictly reserved for data visualization and real-time telemetry streams.
- **Resilience Semantics:** A refined traffic-light system is used for risk assessment. **Healthy** (Emerald) indicates a hardened posture; **Warning** (Amber) indicates resilience degradation; **Critical** (Ruby) indicates a fail-safe breach or active incident.
- **Surface Strategy:** Backgrounds utilize the deepest indigo tones. `surface-deep` is used for recessed areas like terminal consoles and log streams to create visual hierarchy through value rather than shadow.

## Typography

This design system employs a dual-font strategy to separate interface logic from system data.

**Hanken Grotesk** is the interface workhorse, providing a legible, humanist touch to headers and descriptive text. For mobile environments, large headlines scale down to `24px` to maintain dashboard density.

**Geist Mono** is used for all dynamic values, terminal outputs, and metrics. The monospaced nature ensures that numerical data is vertically aligned (tabular lining), allowing for instant comparison of performance metrics. `label-caps` should be used for all table headers, metadata tags, and timestamp markers to provide a technical, military-grade aesthetic.

## Layout & Spacing

The layout philosophy centers on a **Fixed-Modular Grid** optimized for 24/7 observability. 

- **Grid Model:** A 12-column grid is standard for desktop. Elements should snap to a 4px baseline grid to maintain surgical precision.
- **Modular Density:** The "Bento-box" layout is preferred, where components are packed tightly with `8px` (compact) internal padding. This maximizes the signal-to-noise ratio.
- **Responsiveness:** On tablet (under 1440px), the sidebar collapses into a high-density icon rail. On mobile, the layout reflows into a vertical stack of "Status Cards," prioritizing critical alerts at the top of the viewport.

## Elevation & Depth

In this system, depth is communicated through **Tonal Layering** and **Luminescent States** rather than traditional shadows.

- **Stacking:** The base background is the darkest value. Active modules are elevated by using slightly lighter indigo surfaces (`surface-container-high`) and a `1px` border of `border-muted`.
- **Glow Signifiers:** To indicate urgency or "live" data, use a subtle `2px` outer glow (0.4 opacity) in the color of the status (cyan for data, red for critical).
- **Recession:** Terminal windows and log viewers use `surface-deep` to appear carved into the interface, focusing the user's attention on the scrolling text.

## Shapes

The shape language is **Soft-Technical**. A subtle `4px` (0.25rem) radius is used for the majority of containers and interactive elements to provide a modern, engineered feel without losing the "hard" edge of a professional tool.

- **Internal Grids:** Elements inside data tables or complex charts should use `0px` (Sharp) corners to maintain the structural integrity of the data.
- **Pill Tags:** Use the `rounded-full` property only for status chips (e.g., "Active", "Standby") to distinguish them from structural components.
- **Interactive Focus:** Focus states should use a sharp, 2px offset border to emphasize precision.

## Components

- **Resilience Gauges:** Circular telemetry indicators that use Electric Cyan for active metrics. If a metric enters a risk zone, the gauge stroke transitions to the corresponding status color.
- **Fail-Safe Banners:** High-contrast, full-width headers used during critical incidents. They feature an animated "scanning" line to indicate real-time monitoring.
- **Telemetry Cards:** Cards must feature a `label-caps` title, a `data-lg` primary value, and a 24px-high sparkline in the footer.
- **Command Inputs:** Styled like a terminal with a block-style cursor. Use `Geist Mono` and a `surface-deep` background.
- **Action Buttons:**
    - **Primary:** Solid `primary` with `on-primary` text. 
    - **Danger:** Ghost-style with `status-critical` border and text for destructive actions.
- **Data Tables:** High-density (32px row height) with horizontal dividers only. Column headers are sticky and use `label-caps`.