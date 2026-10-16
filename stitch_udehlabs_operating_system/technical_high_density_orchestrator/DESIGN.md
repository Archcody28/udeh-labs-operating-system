---
name: Technical High-Density Orchestrator
colors:
  surface: '#101419'
  surface-dim: '#101419'
  surface-bright: '#363940'
  surface-container-lowest: '#0b0e14'
  surface-container-low: '#181c22'
  surface-container: '#1c2026'
  surface-container-high: '#272a31'
  surface-container-highest: '#31353b'
  on-surface: '#e0e2eb'
  on-surface-variant: '#c0c7d5'
  inverse-surface: '#e0e2eb'
  inverse-on-surface: '#2d3137'
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
  background: '#101419'
  on-background: '#e0e2eb'
  surface-variant: '#31353b'
  terminal-surface: '#091017'
  deep-space-navy: '#0c141e'
  charcoal-container: '#18202b'
  electric-cyan: '#22d3ee'
  status-review: '#f59e0b'
  status-pass: '#10b981'
  status-fail: '#ef4444'
  border-technical: '#1e293b'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  compact: 8px
  gutter: 12px
  margin-md: 16px
  margin-lg: 24px
---

## Brand & Style

This design system is a specialized extension of a high-stakes command aesthetic, refined specifically for **Engineering Workspace** environments. The brand personality is hyper-functional, precise, and authoritative, targeting engineers and architects who manage complex infrastructure. 

The design style is **Technical High-Density**, a hybrid of **Minimalism** and **Modern Corporate** with a "Terminal-First" philosophy. It prioritizes information density and operational efficiency over decorative elements. The visual language evokes the feeling of a sophisticated IDE (Integrated Development Environment), using ultra-dark surfaces and sharp accents to create a "heads-up display" (HUD) for technical workflows. The goal is to reduce cognitive load by clearly separating UI controls from technical data.

## Colors

The palette is optimized for long-duration focus and "Code/Terminal" contexts. The default mode is **Dark**.

- **Primary (Electric Cyan/Data Blue):** `#1C85E8` and `#22d3ee` are used for active states, primary actions, and interactive data points.
- **Secondary (Execution Violet):** `#7c3aed` is reserved for orchestration actions and high-level structural highlights.
- **Surface Strategy:** We utilize a "Deep Space" hierarchy. The background is `#0c141e`. Technical work areas, such as code editors and terminal outputs, use the darker `#091017` to visually recede and emphasize the data.
- **Semantic Accents:** 
    - **Emerald (`#10b981`):** Passing CI/CD pipelines and healthy infrastructure.
    - **Amber (`#f59e0b`):** Pending reviews, manual interventions, or warnings.
    - **Red (`#ef4444`):** System failures, critical errors, or blocked processes.

## Typography

This system uses a dual-font strategy to differentiate between the interface and the engineering data.

- **Hanken Grotesk:** The workhorse for the UI. It provides high legibility for menus, headers, and descriptions. Its modern, geometric curves soften the technical edge of the workspace.
- **JetBrains Mono:** The "Data-Mono" font. Mandatory for all machine-generated content, including Commit SHAs, file paths, logs, and code snippets. It provides the necessary character alignment for scanning tabular data.
- **Scaling:** Headlines are kept compact (max 32px) to preserve screen real estate for data. Mobile scaling reduces headlines by 20% while maintaining code sizes for legibility.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a focus on maximum information density.

- **Density:** Elements are packed tightly using a 4px base rhythm. Horizontal spacing is minimized to allow for multi-column data tables.
- **Grid:** A 12-column grid is used for desktop. In the Engineering Workspace, the center 8 columns are typically dedicated to the primary technical view (e.g., Code Editor or Graph), while the flanking columns handle navigation and metadata.
- **Breakpoints:**
  - **Desktop (1280px+):** Full multi-panel view with persistent sidebars.
  - **Tablet (768px-1279px):** Sidebars collapse into icons; main content area remains fluid.
  - **Mobile (<768px):** Single-pane view. Terminal windows and logs move to a bottom-drawer interface to prioritize visibility.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines**.

- **Base Layer:** Background (`#0c141e`) acts as the "void."
- **Interactive Layer:** Cards and panels (`#18202b`) use a 1px border (`#1e293b`) to define their footprint. No shadows are used for standard containers.
- **Data Layers:** Terminal areas are "carved" into the surface using a darker fill (`#091017`) and subtle inner-borders.
- **Overlays:** Modals and context menus use a slightly elevated tonal shift and a subtle, high-spread glow using the `primary_color` at 10% opacity to signal importance.

## Shapes

The shape language is **Soft**. This provides just enough rounding (4px - 8px) to feel modern and professional without sacrificing the rigid, industrial feel required for a technical workspace.

- **Interactive Elements:** Buttons and Input fields use a 4px radius (`rounded-sm`).
- **Containers:** Cards and primary workspace panels use a 8px radius (`rounded-lg`).
- **Technical Elements:** Status tags and "Code Chips" use a 2px radius for a sharper, more "instrumental" appearance.

## Components

- **Data-Dense Tables:** Use `body-sm` for content. Row height is fixed at 32px. Use `border-technical` for horizontal dividers.
- **Code Snippets:** Always use `terminal-surface` background. Include a language-specific syntax highlighter using the `electric-cyan` and `execution-violet` accents.
- **Status Tags:** Compact pills with 2px radius. Background at 15% opacity of the semantic color with a 1px solid border of the same color.
- **Navigation Items:** Use `label-caps` for section headers. Active states are indicated by an `electric-cyan` 2px vertical bar on the left edge.
- **Inputs:** Dark backgrounds with a 1px `border-technical`. On focus, the border transitions to `electric-cyan` with a 0 0 0 2px glow.
- **CI/CD Timeline:** A vertical stepper using `status-pass`, `status-review`, and `status-fail` dots connected by 1px muted lines.