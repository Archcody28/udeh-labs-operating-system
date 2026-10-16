---
name: Surgical Systems
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
  on-surface-variant: '#b9cacb'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dbe7'
  primary: '#e1fdff'
  on-primary: '#00363a'
  primary-container: '#00f2ff'
  on-primary-container: '#006a71'
  inverse-primary: '#00696f'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#fff6f0'
  on-tertiary: '#472a00'
  tertiary-container: '#ffd4a3'
  on-tertiary-container: '#875500'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#74f5ff'
  primary-fixed-dim: '#00dbe7'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  data-label:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
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
  container-padding: 16px
  gutter: 8px
  density-high: 4px
  density-medium: 12px
---

## Brand & Style
The design system is engineered for the high-stakes environment of Enterprise Quality Engineering and Release Intelligence. It prioritizes **Clinical Precision** and **Engineering-Grade Telemetry** over decorative aesthetics. The brand personality is authoritative, evidence-based, and unsentimental.

The design style is a hybrid of **Minimalism** and **Technical Industrialism**. It utilizes a "black-box" philosophy where the interface recedes to allow high-contrast status indicators and dense data streams to command attention. Every pixel must serve a diagnostic purpose, evoking the feeling of a mission-control terminal or a surgical monitoring suite.

## Colors
The palette is rooted in a **Deep Obsidian** (#051424) base to eliminate visual noise and reduce eye strain during prolonged analysis. 

- **Intelligence (Cyan #00f2ff):** Used for primary actions, active telemetry streams, and focal points of insight.
- **Verification (Emerald #10b981):** Reserved strictly for successful deployments, passed tests, and healthy architectural states.
- **Risk (Amber #f59e0b):** Denotes performance degradation, flakiness, or impending release bottlenecks.
- **Critical (Crimson #ef4444):** Signals immediate failures, broken builds, or security vulnerabilities.

Background surfaces use subtle tonal shifts of Obsidian to create a "nested" hierarchy without relying on borders or shadows.

## Typography
Typography is split between narrative clarity and raw data legibility.

- **Hanken Grotesk** is the primary interface typeface. It is used for headers, navigation, and instructional text to ensure the system remains approachable despite its density.
- **JetBrains Mono** is utilized for all "Evidence Layers." This includes commit hashes, log outputs, telemetry values, and timestamps. The monospaced nature ensures that columns of numbers align perfectly for easy scanning and comparison.

Hierarchy is strictly enforced through weight and case. Labels for data points should always be in uppercase JetBrains Mono to distinguish them from interactive interface elements.

## Layout & Spacing
The layout uses a **Fluid Grid** model optimized for high-density information display. The base unit is **4px**, allowing for tight, surgical alignment of components.

- **Desktop (1440px+):** 12-column grid, 8px gutters. Margins are fixed at 24px to maximize screen real estate for dashboards.
- **Tablet (768px - 1439px):** 8-column grid, 8px gutters.
- **Mobile (Under 768px):** 4-column grid. Complex data tables should transition to card-based summaries or horizontal scroll views.

Information density should be maximized by minimizing vertical padding in lists and tables. Use "Surgical Spacing" (4px) between related data points and "Structural Spacing" (16px+) between distinct functional modules.

## Elevation & Depth
In this design system, depth is communicated through **Tonal Layers** and **Low-Contrast Outlines**. 

Shadows are almost entirely avoided to maintain the "flat-panel" clinical aesthetic. Instead:
- **Level 0 (Base):** Obsidian (#051424).
- **Level 1 (Modules):** Surface offset (+3% lighter than base).
- **Level 2 (Popovers/Tooltips):** Surface offset (+7% lighter than base) with a 1px stroke of #ffffff10.

Active states are indicated by **Inner Glows** or **Cyan Borders** rather than traditional dropshadows. This keeps the interface feeling "lit from within," mimicking a diagnostic screen.

## Shapes
The shape language is **Sharp and Purposeful**. 

A standard border radius of **4px (Soft)** is used for primary containers to prevent the UI from feeling aggressive, but interactive elements like status chips, data cells, and buttons utilize a strict geometric profile. Large containers (panels) should use sharp corners (0px) to reinforce the architectural, structural nature of the release pipeline.

## Components
- **Buttons:** Rectangular with 4px radius. Primary buttons use a Cyan background with black text. Secondary buttons use a transparent background with a 1px Cyan border. 
- **Telemetry Chips:** Small, high-contrast badges using JetBrains Mono. The background color corresponds to the status (Success, Risk, Critical).
- **Data Tables:** The core of the system. Use zebra-striping with 2% opacity shifts. Headers are sticky and use `data-label` typography.
- **Risk Indicators:** Vertical bar gauges or sparklines that use the Amber-to-Crimson gradient to show health degradation over time.
- **Input Fields:** Minimalist design with only a bottom border (2px) that glows Cyan on focus.
- **Status Monoliths:** Large, high-visibility blocks used for "Release Readiness" (GO/NO-GO). These utilize the full background color of the status (e.g., a full Crimson screen header for a failed deployment).
- **Audit Trails:** Monospaced list items with a "Timeline" connector in 1px Cyan, showing the sequence of evidence and approvals.