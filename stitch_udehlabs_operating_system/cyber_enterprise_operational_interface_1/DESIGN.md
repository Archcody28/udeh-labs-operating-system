---
name: Cyber-Enterprise Operational Interface
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394e'
  surface-container-lowest: '#060d20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3e'
  surface-container-highest: '#2d3449'
  on-surface: '#dbe2fd'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#dbe2fd'
  inverse-on-surface: '#283044'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#adc6ff'
  on-tertiary: '#002e6a'
  tertiary-container: '#0062d2'
  on-tertiary-container: '#dce5ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#0b1326'
  on-background: '#dbe2fd'
  surface-variant: '#2d3449'
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
  title-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
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
  label-lg:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  mono-data:
    fontFamily: monospace
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  data-row-height: 32px
  section-gap: 32px
---

## Brand & Style

The design system is engineered for high-stakes enterprise administration where data density and operational speed are paramount. The personality is "Command-Center Professional"—authoritative, precise, and technologically advanced. It moves away from soft consumer aesthetics toward a rigid, high-utility framework that prioritizes information hierarchy and system status.

The style is a hybrid of **Corporate Modern** and **Glassmorphism**. While the core interface relies on sharp, high-contrast structural elements to maintain clarity in dense environments, secondary layers like modals and popovers utilize frosted glass effects to maintain context of the underlying data. This creates a sophisticated, multi-layered depth model that mimics advanced heads-up displays (HUDs).

## Colors

The palette is anchored in a deep-space navy background to reduce eye strain during long operational sessions. 

- **Primary Action:** Electric Violet (#7c3aed) is used exclusively for interactive elements and primary call-to-actions, ensuring high visibility against the dark backdrop.
- **System Status:** Success Green (#10b981) denotes healthy system states, while Tertiary Blue (#3b82f6) is reserved for informational highlights and secondary data points.
- **Neutral Scales:** The system uses a strictly cool-toned neutral scale. Surfaces are layered using slight variations of the base navy to create structural separation without relying on heavy borders.

## Typography

This design system utilizes **Hanken Grotesk** across all roles to ensure maximum legibility at small scales. The typeface's geometric clarity excels in dense data tables and complex configuration panels.

To handle high-density information, the system relies heavily on `body-sm` and `label-md` for secondary metadata. For technical data points (IDs, IP addresses, logs), a monospaced font is used to ensure character alignment and rapid scanning. Headers use tighter letter spacing to maintain a "tight" professional feel.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a strictly enforced 4px baseline shift. This "High-Density" approach minimizes vertical whitespace to keep the maximum amount of data "above the fold."

- **Desktop:** 12-column grid with 16px gutters. Sidebars are fixed-width (240px) to maximize the fluid central data area.
- **Tablet:** 8-column grid with 12px gutters. Sidebars collapse into an icon-only "rail."
- **Mobile:** 4-column grid. Complex data tables should transition to card-based summaries or horizontal scroll views.

Standard table rows are capped at a 32px height to achieve the command-center density required for large-scale system monitoring.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** for the base UI and **Glassmorphism** for temporary overlays.

1.  **Level 0 (Base):** The primary background (#0b1326).
2.  **Level 1 (Cards/Panels):** Surfaces slightly lighter than the base (approx. 5% lighter) with a 1px solid border (#ffffff10) to define edges.
3.  **Level 2 (Overlays/Modals):** A high-blur glass effect (20px-30px blur) with a 20% transparent navy tint. This allows the operator to maintain a sense of the system state while interacting with a focused task.

Shadows are used sparingly; when applied, they are sharp and low-spread, functioning as "glows" for active states rather than realistic depth indicators.

## Shapes

The design system utilizes **Sharp (0px)** corners for all primary containers, buttons, and input fields. This "Engineered Sharpness" conveys precision and maximizes screen real estate by removing the dead space typical of rounded corners.

For specific status indicators or user avatars, a 2px "Soft" corner may be used to provide a subtle distinction from structural layout elements, but standard UI components must remain strictly rectangular.

## Components

### Buttons
Primary buttons use the Electric Violet fill with white text. Secondary buttons are "Ghost" style (transparent fill, 1px border). Hover states should trigger a subtle inner glow or a brightness increase of 10%.

### Data Tables
The core of the interface. Rows must have a subtle background toggle on hover. Use 12px Hanken Grotesk for cell content. Column headers are `label-lg` with uppercase styling and a 1px bottom border.

### Input Fields
Strictly rectangular with a dark background and a 1px border (#ffffff20). On focus, the border color changes to the Primary Electric Violet, and a subtle glow is applied.

### Chips & Status Tags
Small, sharp-cornered tags. For success states, use Success Green text on a 10% opacity green background. For warnings or system errors, use an Amber or Red alternative in the same style.

### Modals & Tooltips
Apply a `backdrop-filter: blur(12px)` and a thin 1px border. Modals should appear to "float" over the data without entirely obscuring the operational context behind them.