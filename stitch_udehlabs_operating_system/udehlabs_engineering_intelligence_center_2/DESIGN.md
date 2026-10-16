---
name: Cyber-Intelligence Center
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
  on-surface-variant: '#c6c6cd'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#909097'
  outline-variant: '#45464d'
  surface-tint: '#bec6e0'
  primary: '#dae2fd'
  on-primary: '#283044'
  primary-container: '#bec6e0'
  on-primary-container: '#4a5268'
  inverse-primary: '#565e74'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00b47d'
  on-secondary-container: '#003e28'
  tertiary: '#ffddb8'
  on-tertiary: '#472a00'
  tertiary-container: '#ffb95f'
  on-tertiary-container: '#754900'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3e465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
  surface-deep: '#051424'
  surface-graph: '#0f172a'
  border-muted: '#334155'
  error-bright: '#ffb4ab'
  warning-gold: '#f59e0b'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.6'
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 12px
  margin-compact: 16px
  margin-wide: 32px
  sidebar-width: 240px
  topbar-height: 48px
---

## Brand & Style

This design system, titled **Cyber-Intelligence Center**, evokes a high-stakes engineering environment—think "Mission Control" for software architecture. It targets senior engineers, architects, and security analysts who require a high-density information display that remains legible and organized.

The aesthetic is a hybrid of **Cyber-Brutalism** and **Modern SaaS**. It uses sharp, technical typography, high-contrast accents (Emerald and Amber), and a "glass-and-steel" feel achieved through dark backgrounds and fine-lined borders. The interface prioritizes functional density over whitespace, emphasizing precision, real-time data, and systemic oversight. Visual interest is driven by glowing state indicators and monospaced "code-like" details rather than decorative imagery.

## Colors

The palette is rooted in a "Deep Space" navy background, providing a low-strain environment for long-duration analysis. 

- **Primary (Blue-Grey):** Used for standard interactive elements and secondary actions.
- **Secondary (Emerald):** The "Success" and "Active" state color. It represents healthy systems, live data, and primary branding.
- **Tertiary (Amber):** Used for technical debt, warnings, and informational highlights.
- **Error (Crimson):** Reserved strictly for violations and high-risk alerts.

Surface colors utilize a tiered system of navy shades (`#051424` to `#273647`) to separate navigation from content areas. Borders use a specific muted slate (`#334155`) to maintain structure without creating visual noise.

## Typography

Typography is split into two functional roles: **Hanken Grotesk** handles the standard interface language (headings, descriptions) with a modern, sharp humanist feel. **JetBrains Mono** is used for all technical data, metadata, and status labels, reinforcing the "engineered" nature of the product.

Hierarchy is strictly enforced. Large displays use heavy weights and negative letter-spacing. Small labels use all-caps monospaced fonts with increased tracking to ensure readability at extremely small sizes (down to 8px-10px).

## Layout & Spacing

The system uses a **12-column fluid grid** for the main workspace, but maintains fixed dimensions for structural navigation (Sidebar: 240px; Top Bar: 48px). 

Spacing follows a 4px base unit (`unit`). Gutters are kept tight (12px) to allow for high data density, while external margins (`margin-wide`) provide necessary breathing room for the layout to feel organized. 

**Breakpoints:**
- **Desktop (1280px+):** Full sidebar, 12-column grid, dual-column main content.
- **Tablet (768px-1279px):** Sidebar collapses to icons-only, grid shifts to single-column stacking for intelligence cards.
- **Mobile (<767px):** Sidebar hidden (hamburger menu), 32px margins reduced to 16px, all fonts scale down by 10%.

## Elevation & Depth

The system eschews traditional soft shadows in favor of **Tonal Layering** and **Luminous Accents**.

1.  **Base (Level 0):** `#051424` (The Canvas).
2.  **Containers (Level 1):** `#1c2b3c` with `#334155` borders. These create "frames" for different logic blocks.
3.  **Active Items (Level 2):** Uses light-source-based border highlights (e.g., a left-side 2px Emerald border for an active nav item).
4.  **Floating Elements (Level 3):** Search inputs and tooltips use backdrop blurs (8px-12px) and slightly higher surface tones to appear closer to the user.

Depth is often signaled by a "glowing" effect—using semi-transparent background tints and 8px-10px blur shadows that match the primary color of the element (e.g., an Emerald node on a map).

## Shapes

The shape language is primarily **Sharp-to-Soft**. 
- Standard UI components (buttons, input fields, cards) use a subtle **0.125rem (2px)** radius, giving them a precise, industrial look.
- **Circular elements** are used exclusively for user avatars and high-level branding marks to create a distinct visual contrast against the otherwise rectangular grid.
- **Status Pills** and small tag elements utilize a slightly softer **0.25rem (4px)** radius to differentiate them from functional containers.

## Components

### Buttons
- **Primary:** Outlined with a high-contrast border and subtle container tint. Hover states shift the background to a higher-contrast surface tone.
- **Ghost/Tertiary:** Monospaced labels with icon prefixes. No border until hover.

### Cards (Intelligence Containers)
- Must include a `label-caps` header section with a monospaced icon.
- Background: `surface-container-high`.
- Border: 1px solid `border-muted`.

### Status Indicators
- Use the "Glow" metaphor: A small circular indicator (8px) with a semi-transparent outer glow (`box-shadow: 0 0 8px [color]`).
- Red = Violation/Critical. Green = Live/Healthy. Gold = Debt/Warning.

### Input Fields
- Dark background (`surface-container-lowest`), no border except when focused. 
- Focus state: 1px solid `secondary` (Emerald).
- Must include a keyboard shortcut hint (`kbd`) when used for global actions like search.

### Data Lists
- Tight vertical padding with 1px horizontal dividers.
- Hover state: Slight background lightening and a "Inspect" button reveal.