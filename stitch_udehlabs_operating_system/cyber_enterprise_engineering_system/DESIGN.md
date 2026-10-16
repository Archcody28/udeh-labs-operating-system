---
name: Cyber-Enterprise Engineering System
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
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#89ceff'
  on-tertiary: '#00344d'
  tertiary-container: '#009ada'
  on-tertiary-container: '#002d43'
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
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#051424'
  on-background: '#d5e4fa'
  surface-variant: '#283647'
typography:
  display-lg:
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
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '500'
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
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
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
  sidebar-width: 280px
  timeline-track: 64px
---

## Brand & Style

This design system is engineered for high-stakes technical environments, specifically the **UdehLabs Engineering Memory Center**. The aesthetic is defined as **Cyber-Enterprise**: a fusion of professional reliability and advanced technological futurism. It evokes the feeling of a "Command Center" where vast amounts of engineering data are synthesized into actionable intelligence.

The visual language balances the density of a complex IDE with the sleekness of high-fidelity data visualizations. It is designed to feel authoritative, precise, and permanent. Key visual motifs include architectural line-work inspired by circuit traces and hexagonal nodes, reflecting the UdehLabs core identity.

**Core Principles:**
- **Information Density:** Prioritize data-at-a-glance over whitespace.
- **Technical Fidelity:** Use subtle glows and monospaced accents to signal "live" engineering data.
- **Cognitive Clarity:** Distinguish between facts, decisions, and conflicts using high-contrast status markers.

## Colors

The palette is anchored in **Deep Navy (#051424)** to provide a stable, low-strain background for prolonged engineering sessions. **Indigo (#6366f1)** serves as the primary action color, providing a professional yet modern feel. **Electric Violet (#8b5cf6)** is used for highlighting architectural connections and high-level synthesis.

**Functional Color Application:**
- **Base Surfaces:** Use Deep Navy variants for background layers.
- **Accents:** Use Electric Violet for data "nodes" and connectivity lines in graphs.
- **Status Indicators:**
    - **Fact (Green):** Verifiable data points or stable nodes.
    - **Decision (Violet):** Strategic pivot points or finalized architecture.
    - **Conflict (Red):** System inconsistencies or engineering blockers.
- **Gradients:** Use an Indigo-to-Violet linear gradient (45deg) for primary buttons and high-priority branding elements to mirror the provided logo style.

## Typography

This system uses a tiered typography strategy to manage high information density. **Hanken Grotesk** provides a sharp, contemporary look for structural headlines. **Inter** is the workhorse for body text, ensuring maximum legibility in complex data tables and technical descriptions. 

**JetBrains Mono** (Label Font) is introduced for metadata, timestamps, and status labels to reinforce the engineering tool aesthetic.

**Styling Rules:**
- **Headlines:** Use tight letter-spacing on larger sizes to maintain a compact, "designed" feel.
- **Body:** Use Inter Regular (400) for general content and Medium (500) for emphasis within paragraphs.
- **Data Labels:** Always uppercase for `label-mono` to distinguish metadata from content.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. Navigation and detail panels (Sidebars) are fixed-width to ensure tool consistency, while the central workspace (Graph/Timeline area) is fluid.

**Grid System:**
- **Desktop:** 12-column grid with a 16px gutter. 
- **Density:** We utilize a 4px baseline grid. Most components should use `8px` or `12px` internal padding to maximize data visibility.
- **Vertical Rhythm:** Strict 4px increments for all vertical spacing between elements.

**Temporal Layouts:**
For timeline views, use a horizontal scroll model with a fixed 64px track height for the axis. Graph visualizations should utilize the full fluid viewport width with "safe zones" of 32px on all edges to prevent node clipping.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Luminous Accents** rather than traditional shadows.

- **Level 0 (Base):** Deep Navy (#051424). Used for the primary application background.
- **Level 1 (Surfaces):** A slightly lighter navy (#0a1f35). Used for cards, sidebars, and inactive panels. No shadow; 1px Indigo border at 10% opacity.
- **Level 2 (Popovers/Tooltips):** Lighter navy (#112944) with a subtle 16px backdrop blur (Glassmorphism). A 1px Electric Violet border at 30% opacity.
- **Depth Indicators:** Use 1px "trace lines" (Indigo, 15% opacity) to connect related data nodes, creating a sense of structural depth without physical shadows.
- **Interactive States:** Use a "Glow" effect (0px 0px 8px) using the Primary or Secondary color for active or hovered nodes.

## Shapes

The shape language is **Technical & Precise**. We avoid excessive roundness to maintain the engineering tool aesthetic.

- **Primary Radius:** 4px (Soft) for cards, input fields, and buttons.
- **Large Components:** 8px (rounded-lg) for main container areas or modals.
- **Hexagons:** The hexagonal shape from the UdehLabs logo should be used for status icons, node points in graphs, and decorative bullet points.
- **Dividers:** 1px solid lines using #1e293b (Slate 800) to separate data rows.

## Components

### Buttons
- **Primary:** Linear gradient (Indigo to Violet), 4px radius, White text.
- **Secondary:** Ghost style, 1px Indigo border, Indigo text.
- **Tertiary/Icon:** Deep Navy background, no border, subtle Violet hover glow.

### Status Indicators (Hexagonal)
Small hexagonal containers with a central icon or letter. 
- **Fact (F):** Green background, White text.
- **Decision (D):** Violet background, White text.
- **Conflict (C):** Red background, White text.

### Cards & Data Modules
Cards should be flat with a 1px border. The header of the card should use `label-mono` typography and a background tint 5% lighter than the card body.

### Graph Nodes
Circular or hexagonal points. Active nodes feature a 4px outer glow in Electric Violet. Connection lines (edges) should be 1.5px thick, utilizing the Indigo-to-Violet gradient for "active" data paths.

### Input Fields
Dark backgrounds (#020a12), 1px Slate borders. On focus, the border transitions to Indigo with a 2px inner glow. Use `label-mono` for input labels.

### Temporal Timeline
A horizontal axis using a 1px Indigo line. Markers (milestones) are small vertical ticks with `label-mono` timestamps positioned at 90 degrees.