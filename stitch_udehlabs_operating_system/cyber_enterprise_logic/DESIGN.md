---
name: Cyber-Enterprise Logic
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
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#c4c1fb'
  on-secondary: '#2d2a5b'
  secondary-container: '#444173'
  on-secondary-container: '#b3afe9'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#007184'
  on-tertiary-container: '#b7efff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#e3dfff'
  secondary-fixed-dim: '#c4c1fb'
  on-secondary-fixed: '#181445'
  on-secondary-fixed-variant: '#444173'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  meta-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: JetBrains Mono
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
  unit: 4px
  gutter: 16px
  margin: 24px
  container-max: 1440px
  density-compact: 4px
  density-comfortable: 12px
---

## Brand & Style

This design system is engineered for the high-stakes environment of Enterprise AI Orchestration. The brand personality is **Technical, Authoritative, and Predictive**. It balances the reliability of institutional finance with the cutting-edge velocity of deep-tech AI.

The aesthetic follows a **Cyber-Enterprise** direction: a fusion of professional Modern SaaS layouts with high-density technical details. It utilizes high-contrast typography, subtle glassmorphism for layering, and microscopic UI details (like monospaced metadata and data-density grids) to evoke a sense of precision. The UI should feel like a high-performance instrument—cold, efficient, and powerful.

## Colors

The palette is anchored in a deep **Midnight Navy (#020617)** to provide a stable, high-contrast foundation for technical data.

*   **Primary (Electric Violet):** Used for primary actions and active agent states. It represents the "intelligence" layer.
*   **Secondary (Deep Indigo):** Used for structural depth, such as sidebar backgrounds and nested containers.
*   **Tertiary (Cyber Cyan):** Reserved for data visualization highlights, code snippets, and terminal outputs.
*   **Status Colors:** Critical for agent lifecycles. **Running** uses a vibrant Emerald, **Waiting** an Amber glow, and **Approved** a Solid Blue. All status colors should be paired with a subtle glow (20% opacity) in high-density views.

## Typography

The typography strategy leverages **Geist** for its clinical, Swiss-inspired precision in headings and UI controls. **JetBrains Mono** is utilized for all technical metadata, agent IDs, and status labels to reinforce the "built for engineers" sentiment.

High-density views should prioritize `body-sm` and `meta-mono` to maximize the information visible on-screen. All uppercase labels must have increased letter-spacing for legibility at small sizes.

## Layout & Spacing

The layout utilizes a **12-column fluid grid** with a tight **16px gutter** to support high-density information layouts. 

*   **Desktop:** 12 columns, 24px side margins.
*   **Tablet:** 8 columns, 16px side margins.
*   **Mobile:** 4 columns, 12px side margins.

A strict **4px baseline grid** is enforced. All components must have paddings and margins in multiples of 4px. Marketplace listings should use a masonry or strict grid layout depending on the complexity of the agent metadata.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Micro-Borders** rather than heavy shadows.

1.  **Floor (020617):** The base background.
2.  **Surface (0F172A):** Primary card and container color.
3.  **Raised (1E293B):** Hover states and active navigation items.

**Accents:** Use a 1px solid border (`#1E293B`) for all cards. For active agents, use a subtle `primary` glow (0px 0px 8px rgba(124, 58, 237, 0.3)).
**Glassmorphism:** Apply a `backdrop-filter: blur(12px)` with a 50% transparent surface color for modal overlays and sticky headers to maintain the "cyber" aesthetic without sacrificing legibility.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a professional, "machined" look that feels more precise than rounder consumer apps.

*   **Buttons & Inputs:** 4px radius.
*   **Cards & Marketplace Tiles:** 8px radius.
*   **Status Indicators:** Perfect circles for running states, or 2px radius for pill-labels.
*   **Selection Wrappers:** Use a "bracket" visual (top-left and bottom-right L-shapes) for selected agent nodes in technical flows.

## Components

### Buttons & Controls
*   **Primary:** Solid Electric Violet with white text.
*   **Ghost/Technical:** Transparent background, 1px border (#1E293B), JetBrains Mono text.
*   **Iconography:** Use 1.5px stroke weight icons. Avoid filled icons unless indicating a toggled "On" state.

### Agent Lifecycle Indicators
*   **Running State:** Pulsing 8px dot next to a `meta-mono` label.
*   **Waiting/Paused:** Solid Amber circle with a "dash" icon.
*   **Approved:** A distinct 1px border in Cyan with a checkmark badge.

### Marketplace Cards
*   **High-Fidelity:** Cards must include: Agent Name (Geist Medium), Model Type (Mono Tag), Performance Metric (Sparkline or Percentage), and a "Quick Deploy" ghost button.
*   **Hover State:** Increase border-color to Primary and show a hidden "View Documentation" link.

### Input Fields
*   **Style:** Dark background (#020617) with a 1px border. On focus, the border turns Primary and a subtle glow is applied.
*   **Labels:** Always top-aligned, using `label-caps`.

### Data Grids
*   **Density:** Row heights should be kept to 40px for compact viewing.
*   **Zebra Striping:** Use 2% opacity white on alternate rows for large datasets.