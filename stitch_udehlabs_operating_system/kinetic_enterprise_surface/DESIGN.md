---
name: Kinetic Enterprise Surface
colors:
  surface: '#031427'
  surface-dim: '#031427'
  surface-bright: '#2a3a4f'
  surface-container-lowest: '#000f21'
  surface-container-low: '#0b1c30'
  surface-container: '#102034'
  surface-container-high: '#1b2b3f'
  surface-container-highest: '#26364a'
  on-surface: '#d3e4fe'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#d3e4fe'
  inverse-on-surface: '#213145'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#bec6e0'
  on-secondary: '#283044'
  secondary-container: '#3f465c'
  on-secondary-container: '#adb4ce'
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
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
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
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
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
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style
This design system is engineered for high-stakes customer success and enterprise support environments. The brand personality is authoritative, precise, and vigilantly responsive. It targets technical account managers and support engineers who require rapid information retrieval and high-trust data visualization.

The design style is **Corporate Modern with a "Command Center" lean**. It prioritizes a refined "Glassmorphism Lite" for secondary surfacing and a systematic "Tonal Layering" for primary workspaces. The aesthetic is clean and structured, borrowing the rigorous utility of SRE tools and the premium finish of modern fintech interfaces. It avoids unnecessary decoration in favor of functional density and clear status indicators.

## Colors
The palette is anchored in a deep indigo-to-slate spectrum to ensure visual comfort during extended shifts.

- **Primary (Indigo):** Used for primary actions, active navigation states, and branding accents. It represents the intelligence and movement of the "Labs" ecosystem.
- **Secondary (Deep Slate):** The foundational canvas color. It provides a high-contrast backdrop for data and reduces eye strain.
- **Success (Emerald Green):** Utilized strictly for positive health states, resolved tickets, and stable system performance.
- **Neutrals (Slate/Zinc):** Used for typography, borders, and secondary metadata to maintain a clean hierarchy without visual noise.

Surface colors should use subtle transparency (80-95% opacity) over deep backgrounds to maintain the continuity of the established aesthetic.

## Typography
The typographic system balances contemporary professionalism with technical precision.

- **Headlines:** Hanken Grotesk provides a sharp, modern edge for page titles and section headers.
- **Body:** Inter is the workhorse for ticket descriptions and customer communication due to its exceptional legibility at small sizes.
- **Technical Data:** JetBrains Mono is used for ticket IDs, system timestamps, and log snippets, ensuring that characters are distinct and data is easily scannable.

Use a strict hierarchy: bold weights for primary actions and semantic labels, regular weights for long-form content.

## Layout & Spacing
The layout follows a **structured fluid grid** optimized for information-rich dashboards. 

- **Grid Model:** A 12-column system is used for the primary workspace. On desktop, sidebars are fixed (280px) while the main content area expands.
- **Density:** High data density is prioritized. Use the 4px base unit for tight grouping of related information (e.g., ticket metadata) and 24px+ for separating distinct functional areas.
- **Breakpoints:**
  - **Mobile (<768px):** Single column, condensed margins, hidden sidebars behind a drawer.
  - **Tablet (768px - 1280px):** 2-column layout (Summary / Detail) with collapsed sidebars.
  - **Desktop (>1280px):** Full 3-pane view (Navigation / Queue / Workspace) for maximum efficiency.

## Elevation & Depth
Elevation is communicated through **Tonal Layering and Subtle Outlines** rather than heavy shadows, maintaining the "SRE Command" aesthetic.

1.  **Level 0 (Base):** The primary application background (Deep Slate).
2.  **Level 1 (Surfaces):** Cards and containers use a slightly lighter slate shade with a 1px border (#FFFFFF10) to define boundaries.
3.  **Level 2 (Popovers/Modals):** These use a subtle backdrop blur (12px) and a slightly more prominent border to appear "floated" above the workspace.
4.  **Interaction:** Hover states on interactive rows or cards should shift the background color slightly lighter rather than increasing shadow depth, ensuring the UI feels responsive and tactile without losing its flat, professional rigour.

## Shapes
The shape language is **Soft and Precise**. 

- **Radius (0.25rem):** Used for buttons, input fields, and small UI components. This keeps the interface feeling "engineered" and sharp.
- **Radius-LG (0.5rem):** Used for primary workspace cards and containers.
- **Radius-XL (0.75rem):** Reserved for large modal windows or global navigation containers.

Avoid fully rounded pill shapes except for specific status badges (e.g., "Online" indicators) to maintain the professional, enterprise-grade tone.

## Components
- **Buttons:** Solid Indigo for primary actions. Ghost buttons with 1px borders for secondary actions. Monospaced text for "Admin" or "System" level actions.
- **Health Chips:** Small, high-contrast badges. Use Success Green for "Healthy," Amber for "At Risk," and Crimson for "Critical."
- **Data Lists:** High-density rows with alternating "Zebra" striping (subtle opacity shifts). 12px JetBrains Mono for metadata.
- **Input Fields:** Darker than the surface background with a 1px stroke. Active states must use a 2px Indigo border glow.
- **Cards:** Minimal padding (16px), clear header borders, and integrated "Action Toolbars" in the top right.
- **Activity Feed:** A vertical timeline component using thin grey connectors and monospaced timestamps to reflect the "Nexus SRE" heritage.
- **Health Score Dial:** A specialized component showing a 0-100 score using a thick circular stroke, color-coded based on the success/error thresholds.