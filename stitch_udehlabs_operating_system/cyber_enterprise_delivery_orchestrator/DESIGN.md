---
name: UdehLabs Cyber-Admin
colors:
  surface: '#081425'
  surface-dim: '#081425'
  surface-bright: '#2f3a4c'
  surface-container-lowest: '#040e1f'
  surface-container-low: '#111c2d'
  surface-container: '#152031'
  surface-container-high: '#1f2a3c'
  surface-container-highest: '#2a3548'
  on-surface: '#d8e3fb'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#d8e3fb'
  inverse-on-surface: '#263143'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#d2bbff'
  on-secondary: '#3f008e'
  secondary-container: '#6001d1'
  on-secondary-container: '#c9aeff'
  tertiary: '#ffffff'
  on-tertiary: '#003824'
  tertiary-container: '#6ffbbe'
  on-tertiary-container: '#00734e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#081425'
  on-background: '#d8e3fb'
  surface-variant: '#2a3548'
  surface-card: '#0d1b2a'
  terminal-black: '#091017'
  data-blue: '#1C85E8'
  execution-violet: '#7c3aed'
  status-success: '#10b981'
  status-risk: '#f59e0b'
  status-critical: '#ef4444'
  border-muted: '#1e293b'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
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
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  density-compact: 8px
  gutter: 16px
  density-comfortable: 16px
  container-margin: 24px
  sidebar_width: 260px
---

## Brand & Style
The brand personality is high-stakes, technical, and authoritative, evoking a "Command Center" or "Terminal" aesthetic. It targets systems engineers and senior infrastructure architects who require real-time density without sacrificing visual clarity. 

The design style is a hybrid of **Brutalism** and **Modern Corporate**. It uses heavy structural borders, monospaced data displays, and a "Deep Space" dark mode to create a sense of focused immersion. The aesthetic is "Technical Fidelity"—where every line and pixel suggests precision engineering and system stability. High-contrast accent colors (Execution Violet, Status Emerald) are used sparingly to highlight critical system paths and status indicators.

## Colors
The palette is rooted in a "Deep Space" dark mode, utilizing a layered grayscale for surfaces to establish hierarchy without relying on traditional shadows. 

- **Primary & Neutral:** Pure white is reserved for high-level headings and active states, while a range of cool-toned slates (`#070f19` to `#2d3541`) define the UI structure.
- **System Accents:** `Execution Violet` is the primary action and brand color, representing the "active" thread of the system.
- **Status Semantic:** A strict traffic-light system is employed: `Status Success` (Emerald), `Status Risk` (Amber), and `Status Critical` (Red).
- **Data Accents:** `Data Blue` is used exclusively for system timestamps and telemetry variables to distinguish dynamic data from static labels.

## Typography
The typographic system relies on a functional duality between **Hanken Grotesk** (Humanist/Clean) and **JetBrains Mono** (Technical/Precise).

- **Hanken Grotesk** handles the primary interface narrative, used for headers and descriptive body text. Its clean, sharp curves provide a modern feel that balances the rigid grid.
- **JetBrains Mono** is utilized for all "system-generated" content, including button labels, navigation links, and telemetry data. It signals to the user that the information is precise and actionable.
- **Hierarchical Rules:** Use `label-caps` for all navigation and categorizations. Use `data-mono` for any dynamic values or log entries. Headers should use tight tracking (`-0.02em`) at larger scales to maintain a "heavy" presence.

## Layout & Spacing
The layout follows a **Rigid Dashboard Grid** model with a fixed left navigation sidebar (260px) and a fluid main content area.

- **Grid:** A 12-column grid is used for the main canvas. Content cards typically span 4 or 8 columns in a Bento-style arrangement.
- **Rhythm:** An 8px base unit is used for component internal padding, while a larger 24px `container-margin` provides breathing room around the primary canvas edges.
- **Adaptation:** On mobile, the sidebar collapses into a drawer, and the 12-column grid reflows into a single column. KPI cards stack vertically, and the Security Heatmap becomes horizontally scrollable to maintain data integrity.

## Elevation & Depth
Elevation is expressed through **Tonal Layering** and **Structural Outlines** rather than soft shadows. This maintains the "flat-fidelity" look of a technical terminal.

- **Base Layer:** `background` (#0c141e) is the furthest plane.
- **Component Layer:** Cards use `surface-card` (#0d1b2a) with a 1px border of `border-muted` (#1e293b).
- **Interactive Highlighting:** Elements like the active navigation link use `surface-container-high` and a high-contrast 4px left-border "active rail."
- **Overlays:** Hover states and tooltips utilize `surface-container-highest` with `shadow-lg` for subtle separation, but primary separation remains border-driven.

## Shapes
The shape language is primarily **Sharp and Geometric**. 

- **Containers:** Dashboard cards and input fields use a standard `0.25rem` (4px) corner radius to soften the technical edge without appearing "consumer-friendly" or bubbly.
- **Specific Elements:** Avatars and status indicators use `full` (pill) shapes to distinguish "human/status" elements from "structural" ones. 
- **Active Indicators:** Navigation highlights and status rails on the left side of cards use 0px roundedness to emphasize the vertical structural grid.

## Components
- **Buttons:** Primary buttons are solid `execution-violet` with `label-caps` white text. Secondary buttons use a transparent background with a `border-muted` stroke.
- **KPI Cards:** Feature a 4px left-hand color "rail" that indicates the status (Success, Risk, etc.). They include a decorative background icon in low-opacity `border-muted`.
- **Navigation Links:** Use a high-contrast hover state (`surface-container-low`) and a persistent 4px left-border for the active state.
- **Input Fields:** Styled with `terminal-black` backgrounds, 1px `border-muted` strokes, and `JetBrains Mono` text for a command-line feel.
- **Heatmaps:** Use color-intensity scales (e.g., `status-critical/20` to `status-critical/60`) within a strictly gridded layout.
- **Data Tables/Logs:** Rows should be separated by 1px `border-muted/50` lines with no horizontal borders, emphasizing vertical flow and data density.