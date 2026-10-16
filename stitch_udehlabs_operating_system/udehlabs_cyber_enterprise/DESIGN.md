---
name: UdehLabs Cyber-Enterprise
colors:
  surface: '#0c141e'
  surface-dim: '#0c141e'
  surface-bright: '#323a45'
  surface-container-lowest: '#070f18'
  surface-container-low: '#141c26'
  surface-container: '#18202b'
  surface-container-high: '#232b35'
  surface-container-highest: '#2d3540'
  on-surface: '#dbe3f1'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dbe3f1'
  inverse-on-surface: '#29313c'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#89ceff'
  on-secondary: '#00344d'
  secondary-container: '#00a2e6'
  on-secondary-container: '#00344e'
  tertiary: '#ffb783'
  on-tertiary: '#4f2500'
  tertiary-container: '#d97721'
  on-tertiary-container: '#452000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#0c141e'
  on-background: '#dbe3f1'
  surface-variant: '#2d3540'
typography:
  display:
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
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
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
    lineHeight: 18px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
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
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is engineered for high-stakes enterprise environments where data density and rapid decision-making are paramount. The brand personality is "Cyber-Professional": a blend of technical precision, institutional trust, and high-performance computing. 

The aesthetic follows a **Modern Corporate** approach with **Minimalist** influences, prioritizing information hierarchy over decorative elements. It utilizes a dark, immersive interface to reduce eye strain during long-duration service operations. The visual language conveys a sense of a "Mission Control" center—organized, reactive, and authoritative.

Key characteristics include:
- **Information Density:** High-UI density to accommodate complex telemetry and customer health data.
- **Precision:** Mathematical alignment and consistent geometric rhythm.
- **Reliability:** Clear visual feedback loops and standardized state management.

## Colors
The palette is rooted in a deep "Midnight Marine" neutral base, providing a high-contrast foundation for data visualization. 

- **Primary Indigo (#6366f1):** Used for primary actions, focus states, and key navigational highlights.
- **Secondary Cyan (#0ea5e9):** Used for informational accents and interactive sub-elements.
- **Status Accents:** Success Green, Warning Gold, and Critical Red are reserved strictly for health scores, SLA alerts, and system status indicators. These colors must maintain high saturation to stand out against the dark backgrounds.
- **Surface Hierarchy:** 
    - Base Background: `#0c141e`
    - Elevated Containers: `#111b27`
    - Borders/Dividers: `#1e293b`

## Typography
This design system utilizes **Hanken Grotesk** for all roles to maintain a unified, technical appearance. The variable font weight allows for subtle hierarchy adjustments in data-heavy views.

- **Headlines:** Use Bold (700) or Semi-Bold (600) with slight negative letter-spacing to create a "locked-in" professional feel.
- **Body Text:** Use Regular (400) for optimal readability. Body-md (14px) is the primary size for operational dashboards.
- **Labels:** Use Semi-Bold (600) or Bold (700) with uppercase styling and increased letter spacing. These are essential for table headers and metadata descriptions.
- **Numeric Data:** For health scores and metrics, use Semi-Bold weights to ensure they are the first thing a user scans.

## Layout & Spacing
The system employs a **Fluid Grid** model with high density. A 4px baseline grid ensures tight, mathematical alignment across complex dashboards.

- **Desktop (1440px+):** 12-column grid with 16px gutters. Margins are fixed at 32px to provide breathing room for the edge of the screen while maximizing the central workspace.
- **Tablet (768px - 1439px):** 8-column grid with 16px gutters.
- **Mobile (Up to 767px):** 4-column grid. Data-heavy tables should reflow into card-based layouts or utilize horizontal scrolling with a "sticky" first column.
- **Density:** Components should favor `sm` and `md` spacing units for internal padding to maintain high information density without sacrificing touch/click targets.

## Elevation & Depth
Depth is expressed through **Tonal Layers** rather than heavy shadows. This maintains a clean, digital-first look.

- **Level 0 (Base):** `#0c141e` - Main application canvas.
- **Level 1 (Card/Container):** `#111b27` - Surfaces for main content widgets.
- **Level 2 (Popovers/Modals):** `#1e293b` - Floating elements. These use a subtle `0 4px 12px rgba(0,0,0,0.5)` shadow to separate from the background.
- **Ghost Borders:** All containers utilize a 1px solid border (`#1e293b`) to define boundaries. This is more effective than shadows in dark mode for creating structure.
- **Interactive States:** On hover, surfaces should shift their border color to the Primary Indigo at 30% opacity to signal interactivity.

## Shapes
The shape language is **Soft (0.25rem)**, emphasizing a professional, modular feel. 

- **Components:** Buttons, input fields, and tags use the base 4px (0.25rem) radius.
- **Containers:** Large dashboard widgets and cards use `rounded-lg` (8px / 0.5rem) to slightly soften the technical layout.
- **Icons:** Use linear, geometric icons with a 1.5px or 2px stroke weight to match the precision of Hanken Grotesk.

## Components
- **Buttons:** Primary buttons are solid Indigo with white text. Secondary buttons use an outline style with the Ghost Border. For high-density rows, use "Ghost" buttons (icon-only or text-only) that appear on hover.
- **Health Indicators (Chips):** Small, high-contrast badges. Success Green background with 10% opacity and a solid 1px Green border for "Healthy" status. Apply the same logic to Warning and Critical.
- **Data Tables:** The core of the system. Use a strict 40px row height for high density. Header cells use `label-sm` typography with a subtle background tint (`#16212e`).
- **Input Fields:** Dark background (`#0c141e`) with a 1px border. Focus state triggers a 1px Indigo border and a subtle Indigo glow (2px spread).
- **Cards/Widgets:** Use a "Header + Content + Footer" structure. Headers should be separated by a 1px horizontal line to clearly distinguish titles from data.
- **Health Score Meters:** Use circular progress rings or thick horizontal bars with status-aware coloring to provide instant visual telemetry.