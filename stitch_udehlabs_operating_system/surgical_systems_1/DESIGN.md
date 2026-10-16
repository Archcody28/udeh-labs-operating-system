---
name: Surgical Systems
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0e1c2d'
  surface-container: '#122031'
  surface-container-high: '#1d2b3c'
  surface-container-highest: '#283647'
  on-surface: '#d5e4fa'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#d5e4fa'
  inverse-on-surface: '#233143'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffb783'
  on-tertiary: '#4f2500'
  tertiary-container: '#d97721'
  on-tertiary-container: '#452000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#051424'
  on-background: '#d5e4fa'
  surface-variant: '#283647'
  surface-raised: '#0a1f35'
  surface-border: '#1e293b'
  violation-red: '#ef4444'
  drift-amber: '#f59e0b'
  compliance-green: '#10b981'
  text-muted: '#94a3b8'
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
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
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
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for **High-Density Engineering** environments, specifically tailored for architects and lead engineers managing complex system lifecycles. The brand personality is **Surgical and Objective**, prioritizing information density over ornamentation. It targets technical leadership who require immediate clarity on trade-offs, decision histories, and system drift.

The visual style is **Cyber-Enterprise**, utilizing a deep, atmospheric dark mode paired with high-contrast functional accents. It borrows from professional developer tools and aerospace instrumentation, focusing on precision, technical rigor, and a "dashboard-first" mentality. Every pixel serves a data-driven purpose, creating a workspace that feels stable, reliable, and profoundly capable.

## Colors

The palette is anchored in a specialized **Cyber-Enterprise Dark** theme. The primary background (`#051424`) is deep and desaturated to reduce eye strain during long-form architectural reviews.

- **Primary Indigo (`#6366f1`):** Used for structural elements, primary actions, and "active" states in system maps.
- **Accent Cyan (`#06b6d4`):** Used for data highlights, technical nodes, and secondary insights within trade-off matrices.
- **Semantic Signals:** A strict set of named colors manages alerts. `violation-red` indicates architectural debt, while `drift-amber` flags deviations from the established ADRs.
- **Contrast Strategy:** All text utilizes high-contrast whites and muted grays (`#94a3b8`) to maintain a clear hierarchy against the dark background.

## Typography

The typography strategy leverages **Hanken Grotesk** for structural headings to provide a modern, sharp edge, while **Inter** handles high-density body content for maximum legibility. **JetBrains Mono** (or similar monospaced font) is integrated for technical labels, ADR IDs (e.g., `ADR-001`), and data points.

Scale is used aggressively to distinguish between system-level overviews and component-level details. All labels for technical charts should use `label-caps` or `code-sm` to maintain the "Surgical" aesthetic. Line heights are tight but intentional, optimizing for the vertical scanning of registries and matrices.

## Layout & Spacing

This design system utilizes a **Fixed Grid** approach for dashboards and a **Flexible Technical Grid** for the Architecture Map. The spacing rhythm is based on a **4px base unit**, emphasizing a high-density UI.

- **Grid:** A 12-column grid is standard for registry pages and comparison tables.
- **Architecture Map:** Uses a non-linear, canvas-based layout. Safe margins of 32px are maintained around the canvas perimeter.
- **Matrices:** Trade-off comparison tables use condensed vertical padding (8px) to allow for the simultaneous viewing of multiple technical criteria without excessive scrolling.
- **Breakpoints:** Mobile reflows to a single column for ADR reading, but the "Architecture Center" is optimized for Large Desktop (1440px+) viewing to support multi-pane analysis.

## Elevation & Depth

In a dark, high-density environment, depth is established through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Surface Levels:** 
  - Level 0 (`#051424`): The base canvas.
  - Level 1 (`#0a1f35`): Cards, registry items, and sidebars.
  - Level 2 (`#1e293b`): Hover states and active modal layers.
- **Outlines:** All containers use a 1px solid border (`#1e293b`). This creates a "blueprint" feel, defining boundaries clearly without adding visual weight.
- **Interactive Depth:** Only active alerts or critical "Drift" warnings use a soft glow (0-0-12px) in their respective semantic color (Amber/Red) to break the flat plane.

## Shapes

The shape language is **Soft (0.25rem)**, leaning toward sharp to reinforce the "Surgical" precision. 

- **Nodes:** System map nodes use a 4px corner radius.
- **Status Pills:** ADR status indicators (e.g., "Accepted", "Superseded") use a 2px radius to look like technical tags rather than consumer-grade buttons.
- **Buttons:** Primary actions utilize the same 4px radius, maintaining a uniform, modular appearance.

## Components

### 1. Architecture Map (Node-Link)
- **Nodes:** Level 1 surfaces with 1px borders. Header of the node uses `label-caps`. 
- **Links:** Directed edges should be 1px lines using the `text-muted` color, turning `primary` on hover.
- **Groupings:** Dashed boundaries to indicate service clusters or VPC boundaries.

### 2. Trade-off Comparison Tables
- **Header Row:** Darker than the body, using `code-sm` for technical metrics.
- **Cells:** Use a "Score" indicator (e.g., ++, +, -, --) color-coded with primary and secondary tints.
- **Row Hover:** Highlight the entire row in `surface-raised` to maintain focus across wide data sets.

### 3. ADR Timeline / Registry
- **List Items:** Vertical stacked cards with a left-accent border color indicating status.
- **Timeline Rail:** A subtle 2px vertical line connecting decisions chronologically.
- **Metadata:** Use `code-sm` for ADR numbers, dates, and author tags.

### 4. Drift/Violation Alerts
- **Inline Alerts:** High-saturation background (10% opacity) with a bold 2px left border in the semantic color.
- **Global Indicators:** A persistent "System Health" header component that toggles a detailed view of architectural violations.

### 5. Input Fields & Controls
- **Inputs:** Dark backgrounds with internal 1px borders. Focus states use the `accent-cyan` for a "scanning" effect.
- **Chips:** Small, square-cornered labels for tagging technologies (e.g., "Kubernetes", "Kafka").