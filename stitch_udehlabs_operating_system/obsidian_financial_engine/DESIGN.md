---
name: Obsidian Financial Engine
colors:
  surface: '#0c141e'
  surface-dim: '#0c141e'
  surface-bright: '#323a45'
  surface-container-lowest: '#070f18'
  surface-container-low: '#141c26'
  surface-container: '#18202b'
  surface-container-high: '#232b35'
  surface-container-highest: '#2d3540'
  on-surface: '#dbe3f1'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#dbe3f1'
  inverse-on-surface: '#29313c'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0c141e'
  on-background: '#dbe3f1'
  surface-variant: '#2d3540'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-sm:
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
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  data-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
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
  container-padding: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for high-stakes financial environments where precision and trust are paramount. The aesthetic merges **Corporate Modernism** with a **Tactile Digital** finish, utilizing deep obsidian surfaces to reduce cognitive load during long periods of data analysis. 

The interface should feel "heavy" and grounded. Use subtle gradients and micro-interactions to signify system responsiveness. While the background remains dark and professional, the "Electric Violet" primary accent provides a high-energy focal point for critical actions and navigational cues. The overall tone is authoritative, secure, and technologically advanced.

## Colors
The palette is rooted in a deep "Obsidian" spectrum to provide maximum contrast for financial data. 

- **Primary (Electric Violet):** Reserved for primary CTAs, active states, and progress indicators.
- **Success (Emerald):** Used for positive revenue growth, completed transactions, and system health.
- **Alert (Amber):** Indicates approaching limits or pending approvals.
- **Risk/Critical (Rose):** Highlights data anomalies, failed payments, or high-risk accounts.
- **Neutral/Surface:** The base layer is `#0c141e`, with `#05080b` used for background depth and `#161f2a` for interactive components like cards and headers.

## Typography
This design system employs a dual-font strategy to separate narrative UI from raw financial data.

- **Hanken Grotesk:** The primary typeface for all interface labels, headers, and descriptive text. It offers a contemporary, sharp look that remains legible at high densities.
- **JetBrains Mono:** Utilized exclusively for currency values, token counts, timestamps, and tabular data. The monospaced nature ensures that columns of numbers align perfectly, facilitating rapid scanning of financial reports.

Use `label-caps` for table headers and small metadata tags to maximize space efficiency in dense layouts.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. Navigation and sidebars are fixed, while the primary data workspace is fluid. 

- **Grid:** A 12-column system with 16px gutters for desktop.
- **Density:** High density is preferred. Use 8px (stack-sm) for grouping related inputs and 16px (stack-md) for separating logical sections within cards.
- **Mobile:** On mobile devices, columns collapse to a single stack, and container padding reduces to 16px. Ensure financial data tables are horizontally scrollable with frozen first columns.

## Elevation & Depth
In this dark-mode system, depth is conveyed through **Tonal Layering** and **High-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Background):** `#05080b` - The canvas.
- **Level 1 (Cards/Containers):** `#0c141e` - Subtle 1px border using `#1e293b`.
- **Level 2 (Modals/Popovers):** `#161f2a` - Elevated with a soft, diffused navy shadow (`0 10px 15px -3px rgba(0, 0, 0, 0.5)`).

Use "Inner Glow" effects (a subtle top-border highlight of 1px) on buttons and cards to give them a tactile, machined quality.

## Shapes
A consistent 8px (`rounded-md`) radius is used for all primary UI elements, including cards, input fields, and buttons. This provides a balance between the "sharp" professional look of legacy finance tools and the "soft" approachable feel of modern SaaS.

Smaller elements like Tags/Chips should use a 4px radius, while progress bar tracks use a fully rounded (pill) style to distinguish them from structural containers.

## Components
- **Data Cards:** High-contrast containers with a JetBrains Mono header for numerical values. Include a micro-sparkline or percentage change indicator in the top right.
- **Buttons:** 
    - *Primary:* Electric Violet background with white text.
    - *Secondary:* Outline only (`#1e293b`) with violet text.
    - *Upgrade CTA:* Electric Violet background with a subtle "shimmer" animation or a high-contrast right-arrow icon.
- **Progress Bars:** Used for usage limits. The track should be a dark neutral (`#1e293b`) with the fill color reflecting the status (Emerald for safe, Amber for >80%, Rose for >95%).
- **Input Fields:** Dark background (`#05080b`) with a 1px border that glows Electric Violet on focus. Use monospaced font for numeric inputs.
- **Lists:** Transaction lists should use zebra-striping with a very subtle difference in background hex to maintain readability across long rows.