---
name: Nexus SRE Command
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
  on-surface-variant: '#c0c7d5'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
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
  tertiary: '#ffb786'
  on-tertiary: '#502400'
  tertiary-container: '#df7415'
  on-tertiary-container: '#461f00'
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
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311300'
  on-tertiary-fixed-variant: '#723600'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
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
  headline-md:
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
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is engineered for high-stakes organizational intelligence and Site Reliability Engineering (SRE) aesthetics. The personality is **Cyber-Enterprise**: authoritative, precise, and technologically advanced. It is designed for senior leadership and technical architects who manage complex, multi-layered organizational data.

The style is a fusion of **Modern Corporate** structure and **Cyberpunk-Utility**. It leverages high-density information layouts, deep-space backgrounds, and electric accents to create a sense of focused control. Every interface element must feel like a tactical instrument within a command center, prioritizing legibility and relationship-mapping over decorative flair.

## Colors
The palette is rooted in a deep navy/black spectrum to reduce eye strain during prolonged "command" sessions. 

- **Primary (#1C85E8):** Use for active states, primary actions, and critical data paths.
- **Secondary (#7C3AED):** Use for AI-driven insights, temporal shifts, and relationship links.
- **Surface (#081425):** The base canvas. Tonal variations should be created by increasing brightness or adding subtle blue tints to represent hierarchy.
- **Data Accents:** Use high-vibrancy tones for status indicators (Danger/Success) to ensure they pop against the dark backgrounds.

## Typography
The typography uses **Hanken Grotesk** exclusively to maintain a sharp, contemporary, and engineered feel. 

- **Headlines:** Should be tight and impactful. Use semi-bold or bold weights to anchor sections.
- **Labels:** Use uppercase for `label-sm` to denote technical metadata or axis labels in charts, enhancing the "instrumental" look.
- **Readability:** Given the high-density nature of the design system, line heights for body text are generous to prevent information fatigue.

## Layout & Spacing
This design system utilizes a **Fixed Grid** on desktop (1280px or 1440px max-width) and a **Fluid Grid** on mobile devices. 

- **Density:** The spacing rhythm is based on a 4px module to allow for high-density layouts. 
- **Structure:** Use a 12-column grid for desktop views. Data visualization panels should occupy specific column spans (e.g., 4 columns for sidebars, 8 for main dashboards).
- **Responsive:** On mobile, margins shrink to 16px, and columns collapse into a single vertical stack. Timeline components should switch to a horizontal scroll or condensed vertical list.

## Elevation & Depth
Depth is communicated through **Tonal Layering** rather than traditional shadows. 

1. **Base:** Surface (#081425).
2. **Container:** 5-8% lighter than the base surface, used for cards and main content modules.
3. **Interactive:** High-clarity outlines (1px) using Primary or Secondary colors at low opacity (20-30%) to define boundaries without cluttering the UI.
4. **Active/Overlay:** Use subtle indigo inner glows or 2px solid borders for elements that are currently "selected" or "active" in the command hierarchy.

## Shapes
Following the **ROUND_FOUR** specification, the design system utilizes a balanced roundedness that softens the technical edge without appearing "bubbly."

- **Standard Elements:** 0.5rem (8px) for buttons, inputs, and small cards.
- **Large Containers:** 1rem (16px) for main dashboard sections and modal overlays.
- **Interactive Triggers:** Tab indicators and small badges use 0.5rem to remain consistent with the technical aesthetic.

## Components
- **Command Buttons:** Solid Primary or Secondary fills with white text for main actions. Ghost variants should use 1px Primary outlines.
- **Data Nodes:** Circular or hexagonal avatars/icons used to represent hierarchical entities, linked by 1px secondary-colored "threads" (lines).
- **Intelligence Chips:** Small, low-contrast pills used for tagging metadata. Use Secondary (#7C3AED) backgrounds at 15% opacity with full-saturation text for AI-generated tags.
- **Timeline Rails:** Horizontal axes with thin, vertical markers. Use Primary color for "Current State" and Neutral for "Historical/Projected" states.
- **Command Inputs:** Darker than the container background with a persistent 1px border. Focus state should trigger a Primary glow effect.
- **Metric Cards:** High-density cards featuring a label (label-sm), a large value (headline-md), and a Sparkline visualization to show temporal trends.