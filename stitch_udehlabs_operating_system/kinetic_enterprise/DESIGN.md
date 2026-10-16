---
name: Kinetic Enterprise
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
  inverse-on-surface: '#213146'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#89ceff'
  on-tertiary: '#00344d'
  tertiary-container: '#006693'
  on-tertiary-container: '#b8e0ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
  surface-glass: rgba(30, 41, 59, 0.7)
  success-vibrant: '#10b981'
  activation-glow: rgba(139, 92, 246, 0.25)
  border-muted: '#464555'
  text-on-surface: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
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
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
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
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  sidebar-width: 260px
  max-content-width: 1280px
---

## Brand & Style

The design system is engineered for a high-conversion, developer-centric environment where technical precision meets frictionless motion. The brand personality is authoritative and intelligent, yet prioritizes the momentum of the user’s journey through complex workflows. 

The aesthetic is a refined **Cyber-Enterprise** style, blending **Minimalism** with **Glassmorphism**. It utilizes a deep-space foundation to reduce cognitive load, punctuated by vibrant, high-contrast accents that guide the eye toward conversion points and progress indicators. The interface feels like a premium command center—utilitarian and stable, but elevated through translucent layering, subtle AI-driven glows, and sharp, purposeful typography. The goal is to evoke a sense of "sophisticated speed" during the onboarding and product activation process.

## Colors

The palette is optimized for a dark-themed enterprise environment, focusing on depth and action-oriented hierarchy. 

- **Primary (Electric Indigo):** Reserved for the "North Star" actions. It is the color of progress, activation buttons, and completed milestones.
- **Secondary (AI Violet):** Used for intelligent features, status indicators for active processes, and subtle background glows that denote high-value workspace areas.
- **Tertiary (Infrastructure Blue):** Represents system health, data flows, and staging environments.
- **Success & Activation:** A distinct vibrant green is introduced specifically for "Success" states and final product activation confirmations to provide clear emotional closure on tasks.

Surface levels are created by layering semi-transparent slates over the deep neutral background. This creates a tiered hierarchy where information closer to the user is lighter and more translucent.

## Typography

This design system employs a functional, dual-font strategy. **Inter** is the primary driver for all UI elements, chosen for its exceptional legibility in data-dense environments. **JetBrains Mono** is utilized for technical metadata, code snippets, and system logs to ground the product in a developer-first aesthetic.

For high-conversion patterns, typography is used to create an undeniable hierarchy:
- **Headlines:** Use tight letter-spacing and bold weights to command attention during onboarding.
- **Label Caps:** Used for section headers and categorization to maintain an organized, "dashboard" feel.
- **Mobile Scaling:** Display styles must aggressively scale down to headline sizes on mobile to prevent layout breaking while maintaining the "bold" impact of the brand.

## Layout & Spacing

The layout follows a **Fixed-Fluid hybrid model**. A structural sidebar (260px) provides persistent navigation, while the main workspace expands fluidly to fill the screen, capped at a maximum width for readability on ultra-wide monitors.

A strict **4px/8px baseline grid** governs all component relationships. 
- **Frictionless Onboarding:** Layouts for activation flows should be centered and constrained (max 640px) to focus the user's attention.
- **Dashboard Grid:** Inside the workspace, a 12-column grid is used for modular widget placement.
- **Breakpoints:**
  - **Mobile (<768px):** Sidebar collapses into a bottom bar; horizontal margins reduce to 16px.
  - **Tablet (768px - 1024px):** Sidebar collapses to an icon-only rail.
  - **Desktop (>1024px):** Full expanded sidebar and fluid 12-column content.

## Elevation & Depth

Depth in this design system is conveyed through **Glassmorphism** and **Backdrop Filtering** rather than traditional drop shadows. This maintains a clean, modern aesthetic that feels digital-native.

1.  **Level 0 (Base):** Solid `#031427`.
2.  **Level 1 (Sub-surface):** Subtle `outline-muted` borders (1px) define zones without background change.
3.  **Level 2 (Panels):** Semi-transparent surfaces using `surface-glass` with a 12px backdrop-blur. These include a 1px top-border highlight at 10% white opacity to simulate physical "edge-lighting."
4.  **Level 3 (Interactive):** Elements like active cards or modals use the `activation-glow` (a soft, tinted outer glow in violet) to signify priority or "Active" AI states.

## Shapes

The shape language is "Soft-Technical." It balances the rigidity of enterprise software with the approachability of a modern startup.

- **Standard Elements (4px):** Used for buttons, inputs, and checkboxes to maintain a precise, engineered look.
- **Large Containers (8px):** Used for cards and primary onboarding panels to provide a slightly softer, more welcoming frame.
- **Functional Pills:** Used exclusively for tags, search bars, and progress pills to distinguish them from actionable square buttons.

## Components

### Buttons & CTAs
- **Primary Activation:** Solid `primary-container`. High-contrast text. On hover, apply a subtle violet glow.
- **Secondary:** Transparent with `border-muted`. Fill with `surface-glass` on hover.
- **Interaction:** Every button must support a `scale-95` press state for tactile feedback.

### Progress & Activation
- **Progress Bars:** Use a dual-track system. The background track is `surface-container-high`, and the active track is a gradient from `primary` to `secondary`.
- **Success States:** When a step is completed, icons should transition to `success-vibrant` with a momentary "bloom" animation.

### Form Inputs
- **Inputs:** Dark, recessed backgrounds (`surface-container-lowest`). Focused state uses a 1px `primary` border and a very faint `activation-glow` to keep the user locked in.

### Onboarding Cards
- **Cards:** Defined by the glassmorphism style. Feature a "Progress Badge" in the top right (using `label-caps`) to show step completion (e.g., "01/04").

### Lists & Tables
- **Interactive Rows:** Rows use a subtle highlight on hover. "Activated" items (e.g., a connected API key) should show a 50% opacity strike-through for secondary text but keep a bright status indicator to show they are live.