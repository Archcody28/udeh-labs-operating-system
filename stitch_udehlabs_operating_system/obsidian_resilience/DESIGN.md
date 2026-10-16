---
name: Obsidian Resilience
colors:
  surface: '#111317'
  surface-dim: '#111317'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#c4c5d9'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#8e90a2'
  outline-variant: '#434656'
  surface-tint: '#b8c3ff'
  primary: '#b8c3ff'
  on-primary: '#002388'
  primary-container: '#2e5bff'
  on-primary-container: '#efefff'
  inverse-primary: '#124af0'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#ffb59b'
  on-tertiary: '#5b1a00'
  tertiary-container: '#c24100'
  on-tertiary-container: '#ffece6'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c3ff'
  on-primary-fixed: '#001356'
  on-primary-fixed-variant: '#0035be'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#812800'
  background: '#111317'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
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
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
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
---

## Brand & Style

The design system is engineered for mission-critical reliability and recovery environments. The brand personality is surgical, authoritative, and unflinching, designed to instill confidence during high-stakes infrastructure crises.

The design style is **Corporate Modern with high-density utility**. It prioritizes information density and technical clarity over decorative flair. It employs a "glass-cockpit" aesthetic—dark, low-fatigue surfaces paired with vibrant, meaningful color accents that signal system health. The UI should feel like a high-performance instrument: precise, responsive, and robust.

**Key Principles:**
- **Surgical Precision:** Every pixel serves a functional purpose; no wasted space.
- **Resilient Hierarchy:** Status indicators must be unmistakable even at a glance.
- **Technical Authority:** A layout that reflects the complexity of the underlying systems while providing the tools to manage them simply.

## Colors

The palette is anchored in **Deep Obsidian (#0F1115)** to reduce eye strain during long recovery windows. Brand expression is achieved through **Cobalt (#2E5BFF)** and **Indigo (#6366F1)**, used primarily for action intent and focal points.

Semantic utility is the cornerstone of this system:
- **Emerald (Resilient):** Indicates stable state and successful operations.
- **Amber (Degraded):** Warns of performance bottlenecks or non-critical issues.
- **Crimson (Failed):** Immediate attention required; catastrophic state.
- **Electric Blue (Recovering):** Active restorative processes or automated healing in progress.

Surfaces should utilize subtle tonal shifts of the neutral palette to differentiate between background, containers, and elevated modals.

## Typography

This design system utilizes **Hanken Grotesk** for all primary interfaces. Its sharp terminals and contemporary grotesque structure provide the "engineering-centric" feel required for technical dashboards.

- **Headlines:** Use Semi-Bold (600) or Bold (700) weights with slight negative letter-spacing for a compact, authoritative look.
- **Body Text:** Standardize on 14px or 16px for high-density information displays.
- **Labels:** Use uppercase for small labels to denote categories or metadata headers, increasing legibility in dense grids.
- **Monospaced Data:** While Hanken is primary, use a monospaced font for logs, IP addresses, and hash values to ensure character alignment and technical accuracy.

## Layout & Spacing

The layout philosophy is a **Fixed-Fluid Hybrid Grid**. Content is housed within a 12-column system that stretches to a maximum width of 1440px, ensuring that complex data visualizations remain readable on ultra-wide monitors common in SOC/NOC environments.

**Spacing Rhythm:**
- A **4px base unit** governs all dimensions.
- Use tight padding (8px or 12px) for internal card elements to maximize the visibility of data points.
- Gutters are fixed at 16px to maintain a rigid, structural feel.

**Breakpoints:**
- **Mobile (<768px):** Single column. Sidebar collapses into a bottom-sheet or hamburger menu.
- **Tablet (768px - 1024px):** 6-column grid. Main navigation collapses to icons only.
- **Desktop (>1024px):** Full 12-column grid. Persistent sidebar for rapid navigation between recovery modules.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** rather than traditional shadows. In this design system, "higher" elements are represented by lighter shades of Obsidian.

- **Base Layer (L0):** Background (#0F1115).
- **Surface Layer (L1):** Cards and main content areas (#1A1D23).
- **Elevated Layer (L2):** Hover states and active selections (#262A33).
- **Overlay Layer (L3):** Modals and dropdowns (#2D323C) with a subtle 1px stroke (10% white) to define edges.

**Borders:** Use low-contrast 1px outlines instead of shadows to maintain the technical, "flat" aesthetic. For critical alerts, the border color may inherit the semantic status color (e.g., a 1px Crimson border for a failed node).

## Shapes

The shape language is **Soft-Technical**. We use a 4px (0.25rem) base radius for buttons, input fields, and small containers. This provides just enough approachable modernism without compromising the professional, industrial feel of the system.

- **Standard Elements:** 4px (Soft)
- **Large Containers/Cards:** 8px (Rounded-lg)
- **Interactive Nodes:** 4px
- **Status Pills:** Fully rounded (Pill-shaped) to differentiate them from functional buttons.

## Components

**Buttons:**
- **Primary:** Solid Cobalt background with white text. High contrast.
- **Secondary:** Transparent with a 1px Indigo border.
- **Critical (Recovery):** Solid Crimson, reserved only for destructive or final actions.

**Status Chips:**
- Minimalist indicators using a small colored dot (8px) alongside a label in `label-md` typography. The background should be a 10% opacity tint of the semantic color.

**Data Tables & Lists:**
- High-density rows (32px height).
- Use alternating row tints or subtle borders to separate technical data points.
- Header rows must be sticky with `label-md` uppercase styling.

**Input Fields:**
- Dark-filled backgrounds (#1A1D23) with a bottom-only border or full subtle outline. 
- Focus state uses the Cobalt primary color for the border.

**Resource Cards:**
- Contain mini-sparklines or progress bars using the `recovering` Electric Blue to show restoration progress.
- Headers should include the system's UUID or ID in `mono-data` font.

**Additional Components:**
- **Health Pulse:** A pulsing dot animation used for the "Resilient" and "Recovering" states to show live system heartbeat.
- **Timeline Scrubber:** A custom component for scrolling through system state history during a recovery event.