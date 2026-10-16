---
name: Cyber-Fleet SOC Evolution
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
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#dbe3f1'
  inverse-on-surface: '#29313c'
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
  tertiary: '#ffb784'
  on-tertiary: '#4f2500'
  tertiary-container: '#a15100'
  on-tertiary-container: '#ffe0cd'
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
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb784'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#713700'
  background: '#0c141e'
  on-background: '#dbe3f1'
  surface-variant: '#2d3540'
  success-mint: '#10b981'
  warning-amber: '#f59e0b'
  error-orange: '#f97316'
  critical-red: '#ef4444'
  electric-violet: '#8b5cf6'
  indigo-accent: '#6366f1'
  terminal-surface: '#091017'
  surface-border: '#1e293b'
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
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
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
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  compact: 8px
  standard: 16px
  large: 24px
  gutter: 16px
---

## Brand & Style

This design system is a high-density, technical evolution of the Cyber-Fleet aesthetic, specifically engineered for Security Operations Centers (SOC). It transitions from a general "Command" feel to a specialized "Defense Status" posture, where the UI functions as a mission-critical instrument panel.

The visual style is **Cyber-Enterprise Minimalism**. It leverages deep-space backgrounds and structural tonal layering to reduce cognitive load during long investigative shifts. The narrative is one of "Informed Vigilance"—the UI remains quiet and clinical until a threat is detected, at which point high-contrast "Defense Status" colors break the visual hierarchy to demand immediate action. The interface prioritizes data density, logical grouping, and rapid identification of Indicators of Compromise (IoCs).

## Colors

The palette is anchored in a dark-mode "Cyber-Enterprise" foundation, utilizing obsidian neutrals to maximize the pop of semantic alerts.

- **Primary & High-Priority:** `Electric Violet` and `Indigo` are reserved for user-initiated actions, primary navigation, and high-priority investigations.
- **Defense Status (Semantic):**
    - **Success (Emerald/Mint):** Indicates healthy system heartbeats and resolved incidents.
    - **Warning (Amber):** Used for anomalies and behavioral deviations.
    - **Error (Bright Orange):** Signals identified threats requiring triage.
    - **Critical (Pulse Red):** Exclusive to active attacks and catastrophic failures.
- **Surfaces:** Use `terminal-surface` for all data-heavy logs and investigation timelines to separate machine data from interface chrome.

## Typography

The typography strategy focuses on "Scanning Efficiency." 

- **Hanken Grotesk:** The primary interface font. It is used for all functional labels, headers, and UI controls. Its tight geometry allows for high information density without sacrificing legibility.
- **Data-Mono (JetBrains Mono):** This is the "Truth Layer." Any data derived from system logs, IP addresses, hashes, or code snippets must use this style. It provides the necessary character distinction (e.g., 0 vs O) required for security forensics.
- **Hierarchy:** Use `label-caps` for table headers and metadata categories to create a clear visual anchor above technical data strings.

## Layout & Spacing

This design system utilizes a **Dashboard Fluid Grid** model. The layout is optimized for high-resolution 24-inch+ monitors common in SOC environments.

- **Density:** Default to a 16px (standard) padding for main containers, but drop to 8px (compact) for data tables and sidebar lists to maximize visible vertical information.
- **12-Column Structure:** Widgets should typically span 3, 4, or 6 columns. High-priority "Investigation Timelines" should occupy a 9-column span to allow for horizontal data expansion.
- **Breakpoints:**
    - **Desktop (1440px+):** Full multi-pane view with persistent sidebars.
    - **Tablet (768px - 1439px):** Sidebars collapse into icons; main widgets stack vertically.
    - **Mobile:** Not recommended for full triage; view limited to critical alert cards and status summaries.

## Elevation & Depth

Depth is established through **Tonal Layering** and **High-Contrast Outlines** to maintain a "Glass-Cockpit" feel. 

- **Surface Tiers:** Use increasingly lighter shades of the base obsidian to signify elevation. The base dashboard is the lowest tier, while investigation cards sit on the mid-tier.
- **Outlines:** Instead of shadows, use 1px borders (`surface-border`) to define element boundaries.
- **Active State Elevation:** When an alert is "Critical," the card should not rise in height but instead gain a subtle `critical-red` outer glow (4px blur, 20% opacity) to signify urgency.
- **Backdrop Blurs:** Use 12px background blurs on modal overlays to maintain the context of the dashboard while focusing on a specific incident detail.

## Shapes

The shape language is "Precision-Soft" (ROUND_FOUR). This 8px (0.5rem) base roundedness provides a modern, professional feel that softens the "brutality" of a dark-mode technical interface.

- **UI Controls:** Buttons and input fields use the standard `rounded-md` (0.375rem).
- **Containers:** Large dashboard widgets and cards use `rounded-lg` (0.5rem).
- **Indicators:** Circular elements (avatars, status pips) remain fully rounded.
- **Accent Bars:** Status indicators on the left edge of cards are sharp (0px radius) on the inner side and match the card radius on the outer side.

## Components

- **Defense Buttons:** Primary actions use `electric-violet`. Destructive or emergency actions (e.g., "Isolate Host") use a solid `critical-red` fill.
- **Status Chips:** Use `label-caps`. The background should be a 10% tint of the semantic color (e.g., Mint for Success) with a high-contrast 100% opacity text.
- **Investigation Cards:** Must include a 4px left-hand accent bar color-coded to the "Defense Status" palette.
- **Security Logs:** Displayed in `terminal-surface`. Use `data-mono` for all text. Row highlights on hover should use a subtle Indigo tint.
- **Inputs:** Dark backgrounds with a 1px `surface-border`. On focus, the border transitions to `electric-violet` with a minimal 2px glow.
- **Pulse Indicators:** For "Critical" alerts, use a `Pulse Red` animation—a slow 2-second infinite expansion of the status dot to draw peripheral attention.