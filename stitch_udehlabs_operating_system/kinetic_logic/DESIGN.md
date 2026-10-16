---
name: Kinetic Logic
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
  on-surface-variant: '#b9cacb'
  inverse-surface: '#d5e4fa'
  inverse-on-surface: '#233143'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dbe7'
  primary: '#e1fdff'
  on-primary: '#00363a'
  primary-container: '#00f2ff'
  on-primary-container: '#006a71'
  inverse-primary: '#00696f'
  secondary: '#d2bbff'
  on-secondary: '#3f008e'
  secondary-container: '#6001d1'
  on-secondary-container: '#c9aeff'
  tertiary: '#f5f7ff'
  on-tertiary: '#1f3149'
  tertiary-container: '#cadcfb'
  on-tertiary-container: '#4f617b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#74f5ff'
  primary-fixed-dim: '#00dbe7'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#d3e3ff'
  tertiary-fixed-dim: '#b5c8e6'
  on-tertiary-fixed: '#081c33'
  on-tertiary-fixed-variant: '#364861'
  background: '#051424'
  on-background: '#d5e4fa'
  surface-variant: '#283647'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.25'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.7'
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.7'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 280px
  gutter: 1.5rem
  margin-page: 2rem
  stack-compact: 0.5rem
  stack-default: 1rem
  stack-loose: 2rem
---

## Brand & Style

The design system is engineered for high-performance developer environments, prioritizing information density, technical precision, and logical hierarchy. It targets engineers, architects, and DevOps professionals who require a UI that feels like a natural extension of their terminal.

The aesthetic follows a **Modern-Technical** approach, blending high-contrast accents with deep, layered surfaces. It utilizes sharp geometry and subtle glass effects to maintain a clean, organized workspace even when displaying complex data structures. The interface is intentionally "dark-first" to reduce eye strain during prolonged sessions and to make syntax highlighting pop.

## Colors

The palette is anchored by **Deep Navy (#051424)**, which serves as the foundational "Void" color for the main application background. 

- **Primary (Electric Cyan):** Reserved for primary actions, terminal prompts, and successful deployment states. It represents the "Go" signal in the developer workflow.
- **Secondary (Execution Violet):** Specifically designated for AI features, orchestration logic, and background processing units.
- **Surfaces:** Use incremental lightness steps of the Deep Navy to create "Elevated Voids" for cards and sidebars.
- **Borders:** Use low-opacity Cyan or Violet (10-15%) for subtle containment without visual noise.

## Typography

This design system uses a dual-font strategy. **Hanken Grotesk** provides a clean, contemporary sans-serif feel for navigational elements, headings, and general UI labels, ensuring readability. 

**JetBrains Mono** is the workhorse for all technical data. Use it for:
- API Keys and UUIDs.
- Code snippets and terminal outputs.
- Table data values.
- Micro-labels for system status.

Line heights are generous in code blocks (1.7) to prevent vertical crowding, while UI text remains tight and efficient.

## Layout & Spacing

The layout is **Sidebar-Centric**. The primary navigation resides in a persistent left-hand rail, allowing for deep nested hierarchies (Organization > Project > App > Service).

- **Grid:** Use a 12-column grid for dashboard views.
- **Density:** High density is preferred. Minimize vertical padding in lists and tables to maximize the amount of visible data.
- **Breakpoints:**
  - **Mobile (<768px):** Sidebar collapses into a bottom-bar or hamburger menu; margins reduce to 1rem.
  - **Desktop (>1280px):** Content maintains a max-width of 1600px for readability on ultrawide monitors.

## Elevation & Depth

In this dark-mode system, depth is communicated through **Tonal Layering** and **Subtle Glows** rather than traditional shadows.

1.  **Level 0 (Base):** #051424 (Main Background).
2.  **Level 1 (Sidebar/Navigation):** #0a1e35 (Slightly lighter navy).
3.  **Level 2 (Cards/Content Blocks):** #0d2541 with a 1px solid border at 10% opacity of the accent color.
4.  **Level 3 (Modals/Popovers):** #122d4d with a subtle "Ambient Glow" — an outer shadow using the Primary color at 5% opacity and a 20px blur.

Use backdrop-blur (12px) on floating elements like tooltips or header bars to maintain context of the content beneath.

## Shapes

The shape language is **Technical and Crisp**. 

- **Containers:** Use `rounded-lg` (0.5rem) for main cards and dashboard modules.
- **Interactive Elements:** Buttons and inputs use `rounded` (0.25rem) to maintain a precise, engineered look.
- **Status Indicators:** Use perfect circles for status pips (Online/Offline) to distinguish them from interactive UI components.

## Components

### Buttons
- **Primary:** Solid Electric Cyan background with Dark Navy text. No gradient.
- **Secondary (AI):** Solid Execution Violet background with White text.
- **Ghost:** Border-only with the accent color. High contrast on hover.

### Inputs & Terminal
- **Input Fields:** Darker than the card surface. 1px border that glows (box-shadow) Cyan when focused.
- **Terminal Component:** A specific container with #000000 background, JetBrains Mono font, and a blinking cursor.

### Sidebar Management
- Active states use a vertical 2px "indicator bar" on the left edge in the respective accent color (Cyan for general, Violet for AI-driven sections).

### Cards & Data Tables
- Tables must support "Zebra Striping" using a 2% opacity increase on alternate rows. 
- Headers should use the `label-caps` typography style for a structured, metadata-heavy feel.

### Chips/Tags
- Small, low-saturation backgrounds with high-saturation text (e.g., a dark cyan background with bright cyan text) to denote environment tags like `production`, `staging`, or `v1.2.0`.