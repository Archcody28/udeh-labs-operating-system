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
  secondary: '#d2bbff'
  on-secondary: '#3f008e'
  secondary-container: '#6001d1'
  on-secondary-container: '#c9aeff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00a572'
  on-tertiary-container: '#00311f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#a4c9ff'
  on-primary-fixed: '#001c39'
  on-primary-fixed-variant: '#004884'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#081425'
  on-background: '#d7e3fb'
  surface-variant: '#2a3548'
  status-healthy: '#10b981'
  status-warning: '#f59e0b'
  status-critical: '#ef4444'
  surface-deep: '#040e1f'
  border-active: '#1e293b'
  data-text: '#d8e3fb'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
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

The design system embodies the **Nexus SRE Command** aesthetic: a high-density, mission-critical environment designed for Site Reliability Engineers. The brand personality is clinical, vigilant, and authoritative, optimized for rapid cognitive processing under high-pressure scenarios.

The design style is a refined **Modern Brutalism** mixed with **Technical Minimalism**. It prioritizes information density over white space, using razor-sharp borders and high-contrast semantic signals. The interface should feel like a physical instrument—a "glass cockpit" for digital infrastructure where every pixel serves a functional purpose. Expect heavy usage of monospaced data grids, real-time telemetry streams, and structural containment that mirrors the logic of the systems being monitored.

## Colors

The palette is anchored in a **Deep Indigo Core** to minimize eye strain during long-watch shifts. 

- **Primary Surfaces:** Use `neutral` (#081425) for the base and `surface-deep` (#040e1f) for recessed areas like terminal backgrounds.
- **Operational Status:** This is the most critical color tier. **Healthy** states use Emerald (#10b981), **Warnings** use Amber (#f59e0b), and **Critical Alerts** use a sharp Ruby (#ef4444).
- **Accents:** `primary` (Data Blue) is used for active telemetry and interactive variables. `secondary` (Execution Violet) is reserved for system-level actions and brand-defining moments.
- **Data Fidelity:** Text uses a high-legibility off-white (#d8e3fb) to prevent the "vibrating" effect of pure white on dark backgrounds.

## Typography

Typography is bifurcated by function: **Hanken Grotesk** provides a clean, humanist interface for navigation and descriptions, while **Geist Mono** handles all dynamic data and telemetry.

For mobile devices, `headline-lg` should scale down to `24px` (`headline-lg-mobile`) to ensure dashboard widgets remain readable. All data-driven values must use **Geist Mono** to ensure tabular lining, allowing engineers to compare numerical values vertically with ease. Use `label-caps` for metadata, timestamps, and column headers to create a clear visual distinction from the data values themselves.

## Layout & Spacing

This design system utilizes a **Fixed-Modular Grid**. The layout is designed for maximum information density, favoring a 12-column grid on desktop and a 4-column grid on mobile.

- **Sidebar:** A fixed 240px navigation rail on the left.
- **Modules:** Use "Bento-box" style modularity. Every card should align to the 4px base grid.
- **Density:** Padding within telemetry cards is set to `compact` (8px) to maximize the amount of visible data points on a single screen.
- **Breakpoints:**
  - **Desktop (1440px+):** Full 12-column dashboard.
  - **Tablet (768px - 1439px):** Sidebar collapses to icons only; 8-column grid.
  - **Mobile (<767px):** Single column stack; hidden sidebar accessible via drawer.

## Elevation & Depth

In a mission-critical SRE context, depth is used for organization rather than decoration. We use **Tonal Layering** supplemented by **Glow States** for urgent alerts.

- **Surface Tiers:** Backgrounds use the darkest indigo. Containers use a slightly lighter indigo with a subtle `1px` border (#1e293b).
- **Z-Index Strategy:** Overlays and modals use a distinct background blur (12px) and a slightly brighter surface-container to separate from the live data stream.
- **Active Indicators:** Instead of shadows, active components are elevated using high-contrast inner borders or "neon" glow effects (e.g., a 2px outer glow using the `status-critical` color when a node is failing).
- **Interactive States:** Hovering over a data row should trigger a `surface-bright` highlight rather than a drop shadow to maintain the flat, technical aesthetic.

## Shapes

The shape language is **Soft-Technical**. We use a baseline `0.25rem` (4px) corner radius for most UI elements to maintain a professional, precision-engineered feel.

- **Data Cells:** Use sharp `0px` corners for internal grid elements to emphasize the rigid, data-first structure.
- **Action Elements:** Primary buttons and chips use the standard `4px` radius.
- **Status Pills:** Status indicators and tags use a `pill-shaped` (999px) radius to differentiate "state" information from "structural" components.
- **Focus Rings:** Use a `2px` offset with a sharp corner to maintain the technical brutalist vibe.

## Components

- **Status Gauges:** Circular or linear indicators using semantic colors. Healthy states feature a subtle pulsing animation (2s ease-in-out).
- **Telemetry Cards:** Must contain a header with `label-caps` text and a main value in `data-lg`. Footers should contain a sparkline graph.
- **Buttons:**
  - **Primary:** Solid `secondary` color with white text.
  - **Ghost:** `1px` border of `border-active` with `primary` text.
- **Input Fields:** Dark background (#040e1f), 1px border, and `Geist Mono` text. The cursor should be a solid block for a terminal-inspired feel.
- **Logs / Consoles:** Monospaced text on a `surface-deep` background. Use semantic color-coding for line prefixes (e.g., `[ERR]`, `[WRN]`, `[INF]`).
- **Data Tables:** High-density rows (32px height) with `1px` horizontal dividers. No vertical lines. The header row should be "sticky" and use a darker tint than the body rows.
- **Incident Banners:** Full-width, high-contrast banners in `status-critical` for active outages, utilizing bold `headline-sm` white text.