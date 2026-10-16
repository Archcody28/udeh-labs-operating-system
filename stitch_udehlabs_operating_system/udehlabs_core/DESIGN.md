---
name: UdehLabs Core
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#c3c0ff'
  on-secondary: '#1f00a4'
  secondary-container: '#3a2dc2'
  on-secondary-container: '#b4b0ff'
  tertiary: '#c0c1ff'
  on-tertiary: '#1000a9'
  tertiary-container: '#8083ff'
  on-tertiary-container: '#0d0096'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#e3dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#100069'
  on-secondary-fixed-variant: '#372abf'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-safe: 24px
  density-high: 8px
  density-comfortable: 16px
  max-width: 1440px
---

## Brand & Style
The design system for UdehLabs embodies a **Cyber-enterprise** aesthetic: a fusion of high-precision technical tools and high-end corporate reliability. The target audience consists of data scientists, analysts, and executive stakeholders who require high-density information environments that remain legible during long-duration focus sessions.

The visual direction prioritizes **Technical Precision**. It utilizes a dark-mode-first architecture with "Deep Indigo" surfaces to reduce eye strain, while "Electric Violet" provides high-energy focal points for critical path actions. The style is clean but data-rich, avoiding unnecessary ornamentation in favor of structural clarity, reminiscent of a modern terminal or a high-end financial trading platform.

## Colors
This design system operates on a primary **Dark Mode** foundation. 

- **Primary (Electric Violet):** Used exclusively for primary buttons, active states, and critical success indicators. It is the "action" color.
- **Secondary (Deep Indigo):** Used for structural surfaces, navigation sidebars, and background layering.
- **Tertiary (Intelligence Indigo):** Reserved for data visualization, trends, and accented informational chips.
- **Neutrals:** A range of cool-toned slates and grays serve as borders and secondary text to maintain high contrast without vibrating against the indigo base.

## Typography
**Hanken Grotesk** is the workhorse of this system, selected for its sharp geometry and exceptional legibility in high-density layouts. 

- **Headlines:** Use tight letter-spacing and bold weights to establish clear hierarchy.
- **Data Display:** For tabular data and technical coordinates, fall back to a monospaced font (JetBrains Mono) to ensure vertical alignment of digits.
- **Labels:** Small caps or increased tracking should be used for secondary metadata to distinguish it from body prose.
- **Mobile scaling:** Decrease `headline-lg` to 24px on mobile devices to prevent excessive wrapping in data-heavy views.

## Layout & Spacing
The layout follows a **4px baseline grid** to achieve high-density professional aesthetics. 

- **Grid System:** A 12-column fluid grid for desktop, switching to an 8-column grid for tablet and 4-column for mobile.
- **Density:** Components should default to "High Density" (8px internal padding) to allow maximum data visibility on screen. 
- **Z-Axis:** Use consistent horizontal alignment for data columns. Tables and lists should align to the grid gutters to maintain the "technical precision" look.

## Elevation & Depth
In this design system, depth is communicated through **Tonal Layering** rather than traditional shadows.

- **Base Layer:** The deepest Indigo (#020617) for the application background.
- **Surface Layer:** One step lighter (#0F172A) for cards, containers, and table rows.
- **Overlay Layer:** A subtle border (1px solid, low-opacity white or secondary indigo) defines the edges of interactive elements.
- **Active State:** Use a 2px inner glow or a subtle "Electric Violet" drop shadow (blur: 8px, opacity: 0.3) only for the most critical active elements like selected data points or primary action buttons.

## Shapes
The shape language balances modern approachability with professional rigidity. 

- **General Elements:** Buttons, inputs, and cards use a **0.5rem (8px)** radius (Level 2).
- **Small Elements:** Tooltips and tags use a **0.25rem (4px)** radius for a sharper, more technical feel.
- **Containers:** Large dashboard widgets use **1rem (16px)** radius to create a distinct frame for complex data visualizations.

## Components
- **Buttons:** Primary buttons are solid "Electric Violet" with white text. Secondary buttons use an "Intelligence Indigo" outline with a subtle hover fill.
- **Input Fields:** Dark background (#020617) with a 1px slate border. On focus, the border transitions to Electric Violet with a minimal outer glow.
- **Data Tables:** High-density rows with 1px divider lines (opacity 10%). Alternating "Zebra" striping is encouraged for wide datasets.
- **Chips/Tags:** Used for status (e.g., "Processing", "Stable"). Backgrounds are semi-transparent versions of the status color with high-contrast text.
- **Cards:** No external shadows; use subtle borders and a slightly lighter fill color than the page background to indicate elevation.
- **Data Visualizations:** Use "Intelligence Indigo" as the primary trend line, with "Electric Violet" for outliers or selected data ranges.