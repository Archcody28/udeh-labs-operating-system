---
name: Synthetic Intelligence
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
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#4fdbc8'
  on-tertiary: '#003731'
  tertiary-container: '#00a392'
  on-tertiary-container: '#00302a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#71f8e4'
  tertiary-fixed-dim: '#4fdbc8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 240px
  sidebar-collapsed: 64px
  grid-margin: 24px
  gutter: 16px
  cell-padding-compact: 8px
  cell-padding-default: 12px
---

## Brand & Style
The design system is engineered for high-performance technical environments, specifically for UdehLabs Engineering Intelligence Center. The brand personality is precise, authoritative, and analytical. It targets senior engineers and technical leads who require rapid synthesis of complex data.

The visual style is **Minimalist-Technical**. It utilizes a "Deep-Space" dark theme to reduce eye strain during long sessions. The aesthetic combines clean, high-density layouts with subtle **Glassmorphism** for navigational depth and **Terminal-inspired** elements to honor engineering culture. The interface prioritizes information density and data-ink ratio, ensuring that every pixel serves a functional purpose.

## Colors
This design system operates on a primary dark-mode foundation. The palette is optimized for contrast and categorization in high-density data views.

- **Primary (Indigo #6366f1):** Used for primary actions, active states, and critical paths.
- **Secondary (Electric Violet #8b5cf6):** Used for secondary metrics and trend indicators.
- **Tertiary (Engineering Teal #14b8a6):** Dedicated to system health, success states, and "active" engineering signals.
- **Neutral (Slate #0f172a):** The core background. Variations in luminance define surface hierarchy.

## Typography
The typographic scale is designed for readability within complex layouts. 

- **Hanken Grotesk** is reserved for high-level dashboard metrics and section headings to provide a modern, sharp edge.
- **Inter** handles the bulk of data presentation and interface text, chosen for its exceptional legibility at small sizes.
- **JetBrains Mono** is utilized for code snippets, git hashes, terminal outputs, and metadata labels, reinforcing the "engineering-first" philosophy.

For mobile viewports, `headline-xl` should scale down to `28px` to maintain visual balance within the narrower grid.

## Layout & Spacing
The layout uses a **Fixed Sidebar** combined with a fluid, high-density content area. 

1. **Sidebar:** A persistent 240px navigation bar on the left.
2. **Dashboard Grid:** A 12-column grid system. In the Engineering Intelligence Center, widgets typically span 3, 4, 6, or 12 columns.
3. **Density:** This system prioritizes a "Compact" vertical rhythm. Gutters are kept at 16px to allow for maximum data surface area.

**Mobile Adaptivity:** On devices below 768px, the sidebar collapses into a bottom navigation bar or a hamburger menu, and the grid transitions to a single-column stack with reduced margins (16px).

## Elevation & Depth
In this dark-themed environment, depth is communicated through **Tonal Layering** and **Glassmorphism** rather than heavy shadows.

- **Level 0 (Background):** #0f172a. The base canvas.
- **Level 1 (Card/Surface):** #1e293b. Used for data widgets and grid containers. Features a 1px border (#334155).
- **Level 2 (Overlays):** Semi-transparent surfaces (rgba(30, 41, 59, 0.7)) with a 12px backdrop blur. Used for tooltips, dropdowns, and fly-out panels.
- **Interactive States:** Hovering over a card should slightly brighten the 1px border to the primary indigo color rather than increasing shadow depth.

## Shapes
The design system uses **Soft (0.25rem)** roundedness to maintain a professional, disciplined look. 

- **Inputs & Buttons:** 4px (0.25rem) corner radius.
- **Dashboard Widgets:** 8px (0.5rem) corner radius.
- **Status Pills:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.

This subtle rounding prevents the UI from feeling "sharp" or unfriendly while maintaining the precision expected of an engineering tool.

## Components
Consistent styling across components ensures the dashboard remains navigable despite high information density.

- **Buttons:** Primary buttons use a solid Indigo fill. Secondary buttons use a subtle outline (1px) with no fill. Always use `label-caps` for button text to maintain a "command-line" feel.
- **Data Grids:** Rows use alternating zebra-striping (subtle luminance shift). Hover states highlight the entire row in a low-opacity Indigo tint.
- **Interactive Dependency Graphs:** Nodes use the tertiary teal for healthy states and electric violet for complex intersections. Edges (lines) are thin (1px) and use #334155.
- **Impact Heatmaps:** Use a monochromatic scale of the Primary Indigo for frequency, transitioning to Engineering Teal for "positive impact" metrics.
- **Terminal Elements:** Any log output or console component must use #000000 background with `code-sm` typography and a 2px left-border accent in Primary Indigo.
- **Chips/Status:** Use low-saturation background tints with high-saturation text for readability (e.g., a dark teal background with bright teal text).