---
name: UdehLabs Engineering Planning
colors:
  surface: '#121315'
  surface-dim: '#121315'
  surface-bright: '#38393a'
  surface-container-lowest: '#0d0e0f'
  surface-container-low: '#1b1c1d'
  surface-container: '#1f2021'
  surface-container-high: '#292a2b'
  surface-container-highest: '#343536'
  on-surface: '#e3e2e3'
  on-surface-variant: '#c8c4d9'
  inverse-surface: '#e3e2e3'
  inverse-on-surface: '#303032'
  outline: '#928ea2'
  outline-variant: '#474556'
  surface-tint: '#c6bfff'
  primary: '#c6bfff'
  on-primary: '#2900a0'
  primary-container: '#5e43fb'
  on-primary-container: '#e7e2ff'
  inverse-primary: '#5638f3'
  secondary: '#f5ff7d'
  on-secondary: '#2f3300'
  secondary-container: '#d7e404'
  on-secondary-container: '#5d6400'
  tertiary: '#bfc7d6'
  on-tertiary: '#29313c'
  tertiary-container: '#5f6774'
  on-tertiary-container: '#dee6f5'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e4dfff'
  primary-fixed-dim: '#c6bfff'
  on-primary-fixed: '#160066'
  on-primary-fixed-variant: '#3c03dd'
  secondary-fixed: '#dfed1a'
  secondary-fixed-dim: '#c3d000'
  on-secondary-fixed: '#1b1d00'
  on-secondary-fixed-variant: '#454a00'
  tertiary-fixed: '#dbe3f2'
  tertiary-fixed-dim: '#bfc7d6'
  on-tertiary-fixed: '#141c27'
  on-tertiary-fixed-variant: '#3f4753'
  background: '#121315'
  on-background: '#e3e2e3'
  surface-variant: '#343536'
  deep-indigo: '#101214'
  electric-violet: '#DFD1FF'
  risk-high: '#FF4D4D'
  risk-medium: '#FFE48F'
  slate-surface: '#1C1E21'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
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
    lineHeight: 16px
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 12px
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
  gutter-md: 16px
  margin-lg: 24px
  density-compact: 8px
  density-comfortable: 16px
---

## Brand & Style

This design system is engineered for high-stakes technical environments. The brand personality is hyper-rational, precise, and authoritative, designed to instill confidence during complex task decomposition and risk assessment. It caters to a target audience of lead engineers and technical architects who require a high-density information environment without cognitive overload.

The design style is **Modern Technical Minimalism** with elements of **Glassmorphism**. It prioritizes clarity and structured data over decorative elements. The interface uses subtle translucent layers to maintain context across deep navigation stacks, while sharp, high-contrast typography ensures readability in data-heavy views like dependency graphs and requirement matrices.

## Colors

The color strategy utilizes a deep dark mode to reduce eye strain during prolonged engineering sessions. 
- **Primary & Accent:** The Electric Violet (`#DFD1FF`) and Primary Purple (`#5E43FB`) are used for primary actions and highlighting critical paths in dependency graphs.
- **Surface Strategy:** The neutral palette moves from the deepest black (`#08090A`) for backgrounds to `slate-surface` for cards and modals, creating a clear sense of Z-index hierarchy.
- **Semantic Indicators:** High-saturation accents like `risk-high` and the extracted yellow (`#E4F222`) are reserved strictly for metrics, warnings, and status indicators within the engineering workflow.

## Typography

The typography system uses a tri-font approach to categorize information types:
- **Hanken Grotesk** is used for structural headings, providing a sharp, modern professional look.
- **Inter** handles all standard body text and UI controls, chosen for its exceptional legibility at small sizes.
- **JetBrains Mono** is utilized for technical metadata, requirement IDs (e.g., `REQ-402`), and data metrics to differentiate between prose and structured engineering data.

Line heights are kept tight to support high-density layouts, and letter-spacing is increased for all-caps labels to ensure rapid scanning of status chips and column headers.

## Layout & Spacing

This design system employs a **12-column fluid grid** with fixed sidebars for navigation and property inspectors. 
- **Density:** High-density is the default. Use `density-compact` (8px) for padding within data tables and tree views.
- **Sidebars:** Left navigation is fixed at 240px; right-side "Inspector" panels for task decomposition are fixed at 320px.
- **Breakpoints:**
  - **Desktop (1440px+):** Full 12-column grid with dual sidebars.
  - **Tablet (768px - 1439px):** Sidebars collapse into overlays; primary content area remains fluid.
  - **Mobile (<767px):** Single column stack; graphs and complex tables horizontal scroll within containers.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows.
- **Level 0 (Background):** `#08090A` - The base work surface.
- **Level 1 (Cards/Panels):** `#1C1E21` with a 1px border of `#8B93A1` at 15% opacity.
- **Level 2 (Modals/Popovers):** Surface uses a background blur (20px) and a subtle inner glow from the top edge to simulate depth.
- **Interactive States:** Hovering over a dependency node or list item triggers a subtle glow using a primary color tint (`#5E43FB` at 10% opacity) rather than a lift in elevation.

## Shapes

To maintain a professional, "engineered" aesthetic, the design system uses **Soft (1)** roundedness. 
- **Standard UI Elements:** (Buttons, Inputs, Cards) use a 4px (0.25rem) radius.
- **Data Nodes:** Circular nodes in dependency graphs are the only exception, used to distinguish entities from UI containers.
- **Tabs:** Use a "folder" style with top-only rounding to reinforce the document/planning metaphor.

## Components

- **Buttons:** Primary buttons use a solid `#5E43FB` fill with white text. Secondary buttons are ghost-style with a 1px border.
- **Status Chips:** High-density chips with `label-caps` typography. Use background tints of the semantic colors (red, yellow, violet) with high-contrast text.
- **Input Fields:** Dark-filled with a subtle bottom border that glows when focused. Labels always remain visible as `body-sm`.
- **Dependency Graphs:** Connecting lines should be 1px solid `#8B93A1` with directional arrows. Active paths use `#E4F222` for high visibility.
- **Data Tables:** Zebra-striping is avoided; use 1px horizontal dividers. Cell padding is strictly 8px to maximize row count.
- **Risk Metrics:** Visualized using small sparklines or circular progress rings to save vertical space.