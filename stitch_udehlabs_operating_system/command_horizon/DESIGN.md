---
name: Command Horizon
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
  on-surface-variant: '#c4c6cd'
  inverse-surface: '#dbe3f1'
  inverse-on-surface: '#29313c'
  outline: '#8e9197'
  outline-variant: '#44474c'
  surface-tint: '#b9c8de'
  primary: '#ffffff'
  on-primary: '#233143'
  primary-container: '#d5e4fb'
  on-primary-container: '#576579'
  inverse-primary: '#515f73'
  secondary: '#d2bbff'
  on-secondary: '#3f008e'
  secondary-container: '#6001d1'
  on-secondary-container: '#c9aeff'
  tertiary: '#ffffff'
  on-tertiary: '#003738'
  tertiary-container: '#58f8fe'
  on-tertiary-container: '#007073'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d5e4fb'
  primary-fixed-dim: '#b9c8de'
  on-primary-fixed: '#0d1c2d'
  on-primary-fixed-variant: '#3a485a'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#58f8fe'
  tertiary-fixed-dim: '#2bdbe1'
  on-tertiary-fixed: '#002021'
  on-tertiary-fixed-variant: '#004f52'
  background: '#0c141e'
  on-background: '#dbe3f1'
  surface-variant: '#2d3540'
  intel-cyan: '#00cfd5'
  emerald-optima: '#10b981'
  amber-alert: '#f59e0b'
  ruby-incident: '#ef4444'
  surface-card: '#0d1b2a'
  terminal-black: '#091017'
  border-muted: '#1e293b'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  headline-md-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  compact: 8px
  comfortable: 16px
  gutter: 16px
  margin-lg: 24px
  margin-sm: 12px
---

## Brand & Style
The design system is a high-density, mission-critical interface designed for Enterprise Observability, FinOps, and Resource Governance. The aesthetic is rooted in **Corporate Modernism** blended with **High-Contrast Digitalism**, evoking the authority of a strategic command center.

The brand personality is analytical, precise, and anticipatory. It targets technical leadership and operations teams who require immediate clarity across vast datasets. The visual narrative is driven by "Mission Control" logic: every pixel must serve a functional purpose. To distinguish the product from standard enterprise tools, the system utilizes **AI Glow**—subtle, luminous accents and backdrops—to signal intelligence-driven insights and automated governance actions.

## Colors
The palette is optimized for long-duration monitoring in low-light environments. The foundation is a deep obsidian navy, providing a high-contrast base for technical data.

- **Primary (Steel Blue):** Used for structural hierarchy and essential interface chrome.
- **Secondary (Execution Violet):** Reserved for primary actions, system initialization, and active state transitions.
- **Semantic States:** 
  - **Intelligence Cyan (Healthy):** Used for AI-verified stability and "all-clear" signals.
  - **Emerald (Optimization):** Specific to FinOps and resource efficiency gains.
  - **Amber (Warning):** Denotes budget thresholds and non-critical governance drifts.
  - **Ruby (Critical):** High-priority incidents and resource depletion.
- **AI Glow:** A specialized application of `intel-cyan` with low-opacity radial gradients (5-10%) behind key insights to denote machine-learning influence.

## Typography
The system employs a dual-font strategy to differentiate between human-centric narrative and machine-generated data.

**Hanken Grotesk** handles the primary interface, providing a sharp, professional character that maintains legibility at high densities. **JetBrains Mono** is utilized strictly for technical metadata, resource IDs, financial figures, and terminal logs. This distinction allows users to subconsciously categorize information types instantly. All labels use uppercase styling with increased tracking to ensure they remain distinct from body copy at micro-sizes.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid Grid** modeled after professional telemetry dashboards. 

- **Desktop (1440px+):** A 12-column grid with 16px gutters. Analytical widgets typically span 4, 6, or 8 columns.
- **Sidebars:** Fixed at 280px for navigation and 320px for contextual resource inspectors.
- **Reflow:** On Tablet (768px - 1024px), the grid shifts to 6 columns. On Mobile, it collapses to a single column with horizontal scrolling for data tables.
- **Density:** Use `compact` (8px) spacing for data-heavy lists and property panels. Use `comfortable` (16px) for dashboard overview widgets and primary content areas.

## Elevation & Depth
Elevation is conveyed through **Tonal Layers** and **Low-Contrast Outlines**. Deep shadows are avoided to prevent visual clutter in data-rich views.

1. **Floor:** The base background (`#0c141e`).
2. **Sub-Surface:** Sidebars and utility bars use `#070f19` for clear grounding.
3. **Card Level:** Interactive widgets use `#0d1b2a` with a subtle 1px border (`#1e293b`).
4. **AI Glow Layer:** Insights utilize a secondary elevation tier where a faint, inner `intel-cyan` glow (blur: 12px, opacity: 0.1) suggests "intelligence" underneath the surface.
5. **Interactive Overlays:** Modals use `#18202b` with a more pronounced `outline-variant` to sit clearly above the operational floor.

## Shapes
The shape language is "Hard-Technical." By utilizing `Soft` (0.25rem) roundedness, the system maintains a rigid, structural feel that fits a professional monitoring environment while avoiding the aggressive sharpness of pure brutalism.

- **Primary Elements:** Buttons and Input fields use the base 4px radius.
- **Large Containers:** Dashboard cards and modals use the 8px (`rounded-lg`) radius.
- **Status Markers:** Circular dots for "Live" status indicators are the only exception, using full pill-rounding.
- **Indicators:** Use vertical 2px bars on the left edge of list items to indicate semantic state (e.g., a Ruby bar for a failed resource).

## Components
- **Buttons:** Primary actions use `execution-violet` solids. Secondary actions use `surface-bright` with a 1px border. FinOps-specific actions use `emerald-optima` ghost buttons.
- **Data Cards:** Must include a header area with `label-caps` and a primary metric in `data-mono`. Use the AI Glow backdrop for cards containing "Optimization Suggestions."
- **Status Chips:** Small, low-saturation backgrounds with high-saturation text of the semantic color. For "Live" states, include a 6px pulsing dot.
- **Input Fields:** Semi-transparent dark fills with `border-muted`. Upon focus, the border transitions to `primary` with a subtle outer glow.
- **Resource Lists:** High-density rows (32px height) using `body-sm` and `data-mono` for IDs. Use zebra-striping with `surface-container-low` for readability.
- **Metric Visualizations:** Sparklines should use semantic colors (Amber for drift, Emerald for savings). Charts should use `terminal-black` for the plot area.